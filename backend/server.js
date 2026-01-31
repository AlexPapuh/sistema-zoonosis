const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 

dotenv.config();


const db = require('./config/db');

require('./services/whatsappClient'); 

const iniciarTareasProgramadas = require('./utils/cronJobs'); 

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const propietarioRoutes = require('./routes/propietario.routes');
const animalRoutes = require('./routes/animal.routes');
const historialRoutes = require('./routes/historial.routes');
const vacunaRoutes = require('./routes/vacuna.routes');
const campanaRoutes = require('./routes/campana.routes');
const casoRoutes = require('./routes/caso.routes');
const publicRoutes = require('./routes/public.routes');
const reporteRoutes = require('./routes/reporte.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const citasRoutes = require('./routes/citas.routes');
const horarioRoutes = require('./routes/horario.routes');


const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});


const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

async function testDbConnection() {
  try {
    const [results] = await db.query('SELECT 1 + 1 AS solution');
    console.log('✅ Conexión a MySQL exitosa. La solución es:', results[0].solution);
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
}
testDbConnection();

io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado:', socket.id);

  socket.on('unirse_campana', (campanaId) => {
    socket.join(`campana_${campanaId}`);
    console.log(`Usuario ${socket.id} se unió a campaña ${campanaId}`);
  });

  socket.on('enviar_ubicacion', (data) => {
    io.to(`campana_${data.campanaId}`).emit('actualizar_ubicacion', data);
  });

  socket.on('salir_campana', (campanaId) => {
      socket.leave(`campana_${campanaId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

iniciarTareasProgramadas(); 
console.log('⏰ Sistema de recordatorios automáticos iniciado.');

app.get('/', (req, res) => {
  res.json({ message: '¡Bienvenido a la API de Veterinaria!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/propietarios', propietarioRoutes);
app.use('/api/animales', animalRoutes);
app.use('/api/historiales', historialRoutes);
app.use('/api/vacunas', vacunaRoutes);
app.use('/api/campanas', campanaRoutes);
app.use('/api/casos', casoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/horarios', horarioRoutes);


server.listen(PORT, () => {
  console.log(`🚀 Servidor (HTTP + Socket + WhatsApp) corriendo en http://localhost:${PORT}`);
});