import dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

export const config = () => {
  const configData = {
    // Configuración de la base de datos
    database: {
      uri: process.env.MONGO_URI,
      name: 'router_app_ww_production',
    },
    
    // Configuración del servidor
    server: {
      port: process.env.PORT || 3005,
      nodeEnv: process.env.NODE_ENV || 'development',
      host: '0.0.0.0', // Escuchar en todas las interfaces de red
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3005',
        'http://192.168.1.6:3005',
        'http://192.168.101.1:3005',
        'http://192.168.101.1:3000',
        // Permitir cualquier IP de la red 192.168.101.x
        /^http:\/\/192\.168\.101\.\d+:?\d*$/
      ]
    },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'tu-secret-key-super-segura',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Cambiado a 1 hora para desarrollo
  },

  // Configuración de SmartOLT
  smartOLT: {
    apiKey: process.env.SMART_OILT || '',
    baseUrl: process.env.SMARTOLT_BASE_URL || 'https://conectatayd.smartolt.com/api',
  },
  };
  
  
  return configData;
};

export default config;
