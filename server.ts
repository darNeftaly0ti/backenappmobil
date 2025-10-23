import express from 'express';
import cors from 'cors';
import { config } from './APP/configs/config';
import { userService } from './APP/services/services';
// import { endpointLogger } from './APP/middleware/endpointLogger';

const app = express();
const serverConfig = config();

// Middleware para CORS
app.use(cors({
  origin: serverConfig.server.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging de endpoints (debe ir después de los middlewares de parsing)
// app.use(endpointLogger);

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: '¡Backend funcionando correctamente!',
    port: serverConfig.server.port,
    environment: serverConfig.server.nodeEnv,
    database: serverConfig.database.name,
    api: {
      baseUrl: `/api`,
      endpoints: [
        'GET / - Información del API',
        'POST /api/users/login - Login de usuario con email y contraseña',
        'GET /api/users - Obtener todos los usuarios',
        'GET /api/users/:id - Obtener usuario por ID',
        'GET /api/users/email/:email - Obtener usuario por email',
        'PUT /api/users/:id - Actualizar información de usuario',
        'DELETE /api/users/:id - Eliminar usuario',
        'GET /api/users/health - Estado del router de usuarios'
      ]
    }
  });
});

// Configurar rutas del API
import userRouter from './APP/routers/router'; // Nuestro nuevo router de usuarios

app.use('/api/users', userRouter); // Rutas para gestión de usuarios

// Manejo de errores global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error global:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Iniciar el servidor
app.listen(Number(serverConfig.server.port), serverConfig.server.host, async () => {
  console.log(`Servidor ejecutándose en puerto ${serverConfig.server.port}`);
  console.log(`Entorno: ${serverConfig.server.nodeEnv}`);
  console.log(`Base de datos: ${serverConfig.database.name}`);
  console.log(`Acceso local: http://localhost:${serverConfig.server.port}`);
  console.log(`Acceso desde red local: http://192.168.1.6:${serverConfig.server.port}`);
  console.log(`Acceso desde red externa: http://192.168.101.1:${serverConfig.server.port}`);
  console.log(`Orígenes permitidos: ${serverConfig.server.allowedOrigins.length} configurados`);
  
  // Conectar a la base de datos
  try {
    await userService.connectToDatabase();
    console.log('Sistema de usuarios inicializado correctamente');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
});

export default app;


//comando para ejecutar el script npx ts-node server.ts
//heroku local web -f Procfile.dev