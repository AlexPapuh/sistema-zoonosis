const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.descargarBackup = (req, res) => {
    const fecha = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_zoonosis_${fecha}.sql`;
    
    const backupFolder = path.join(__dirname, '../temp');
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder);
    }
    const filePath = path.join(backupFolder, fileName);

    const dbUser = process.env.DB_USER || 'root';
    const dbPass = process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : ''; 
    const dbName = process.env.DB_NAME || 'veterinaria_db'; 

    const mysqldumpPath = '"C:/Program Files/MySQL/MySQL Server 9.5/bin/mysqldump"'; 

    const cmd = `${mysqldumpPath} -u ${dbUser} ${dbPass} ${dbName} > "${filePath}"`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error("Error al generar backup:", error);
            return res.status(500).json({ message: 'Error interno al generar la copia de seguridad' });
        }

        res.download(filePath, fileName, (err) => {
            if (err) console.error("Error al enviar backup:", err);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        });
    });
};