const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const db = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const userFound = await User.findByEmail(email);
    if (userFound) {
      return res.status(400).json({ message: 'El email ya está en uso.' });
    }

    const newUser = await User.create(nombre, email, password, rol);

    res.status(201).json({
      message: 'Usuario registrado exitosamente.',
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    const userFound = await User.findByEmail(email);
    if (!userFound) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const isMatch = await User.comparePassword(password, userFound.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    let datosPropietario = {};
    
    if (userFound.rol === 'Propietario') {
        const [rows] = await db.query(
            'SELECT direccion, latitud, longitud FROM propietarios WHERE usuario_id = ?', 
            [userFound.id]
        );
        
        if (rows.length > 0) {
            datosPropietario = rows[0];
        }
    }
    const token = jwt.sign(
      { id: userFound.id, rol: userFound.rol },
      process.env.JWT_SECRET || 'tu_secreto_super_secreto', 
      { expiresIn: '2h' } 
    );

    res.status(200).json({
      message: 'Login exitoso.',
      token,
      user: {
        id: userFound.id,
        nombre: userFound.nombre,
        email: userFound.email,
        rol: userFound.rol,
        direccion: datosPropietario.direccion || null,
        latitud: datosPropietario.latitud || null,
        longitud: datosPropietario.longitud || null,
        token: token
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const userId = req.user.id;
        const userRol = req.user.rol;

        const [users] = await connection.query("SELECT id, nombre, email, rol FROM usuarios WHERE id = ?", [userId]);
        if (users.length === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        
        const user = users[0];
        let datosExtra = {};

        if (userRol === 'Propietario') {
            const [props] = await connection.query("SELECT id as propietario_id, telefono, direccion, latitud, longitud FROM propietarios WHERE usuario_id = ?", [userId]);
            if (props.length > 0) datosExtra = props[0];
        } 
        
        res.json({ ...user, ...datosExtra });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener perfil" });
    } finally {
        connection.release();
    }
};

exports.updateProfile = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const userId = req.user.id; 
        const userRol = req.user.rol;
        const { nombre, password, telefono, direccion, latitud, longitud } = req.body;

        let queryUser = "UPDATE usuarios SET nombre = ? WHERE id = ?";
        let paramsUser = [nombre, userId];

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            queryUser = "UPDATE usuarios SET nombre = ?, password = ? WHERE id = ?";
            paramsUser = [nombre, hash, userId];
        }

        await connection.query(queryUser, paramsUser);

        if (userRol === 'Propietario') {
            const [exist] = await connection.query("SELECT id FROM propietarios WHERE usuario_id = ?", [userId]);
            
            if (exist.length > 0) {
                await connection.query(
                    "UPDATE propietarios SET telefono = ?, direccion = ?, latitud = ?, longitud = ? WHERE usuario_id = ?",
                    [telefono, direccion, latitud, longitud, userId]
                );
            } else {
                await connection.query(
                    "INSERT INTO propietarios (usuario_id, telefono, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?)",
                    [userId, telefono, direccion, latitud, longitud]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Perfil actualizado correctamente" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Error al actualizar perfil" });
    } finally {
        connection.release();
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: "Correo no registrado" });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expireDate = new Date(Date.now() + 3600000); 

        await db.query("UPDATE usuarios SET reset_code = ?, reset_expires = ? WHERE email = ?", [code, expireDate, email]);

        const mailOptions = {
            from: '"Soporte Zoonosis" <no-reply@zoonosis.com>', 
            to: email,
            subject: 'Recuperación de Contraseña - Zoonosis Potosí',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #2563eb; padding: 20px; text-align: center;">
                        <h2 style="color: white; margin: 0;">Restablecer Contraseña</h2>
                    </div>
                    <div style="padding: 20px; background-color: #f9fafb;">
                        <p style="color: #374151; font-size: 16px;">Hola,</p>
                        <p style="color: #374151; font-size: 16px;">Has solicitado restablecer tu contraseña en el sistema de Zoonosis. Usa el siguiente código de seguridad:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e40af; background-color: #dbeafe; padding: 10px 20px; border-radius: 8px;">
                                ${code}
                            </span>
                        </div>

                        <p style="color: #6b7280; font-size: 14px;">Este código expira en 1 hora.</p>
                        <p style="color: #6b7280; font-size: 14px;">Si no solicitaste esto, ignora este mensaje.</p>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #9ca3af;">
                        © ${new Date().getFullYear()} Unidad de Zoonosis Potosí
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Código enviado a tu correo electrónico." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al enviar el correo." });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const [users] = await db.query(
            "SELECT * FROM usuarios WHERE email = ? AND reset_code = ? AND reset_expires > NOW()", 
            [email, code]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Código inválido o expirado" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query(
            "UPDATE usuarios SET password = ?, reset_code = NULL, reset_expires = NULL WHERE id = ?", 
            [hashedPassword, users[0].id]
        );

        res.json({ message: "Contraseña actualizada correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al cambiar contraseña" });
    }
};