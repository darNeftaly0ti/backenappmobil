import mongoose from 'mongoose';
import { config } from '../APP/configs/config';

// Definir el esquema para los routers
const routerSchema = new mongoose.Schema({
  ip_address: {
    type: String,
    required: [true, 'La dirección IP es requerida'],
    unique: true,
    trim: true,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Formato de IP inválido']
  },
  brand: {
    type: String,
    required: [true, 'La marca es requerida'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'El modelo es requerido'],
    trim: true
  },
  firmware_version: {
    type: String,
    required: [true, 'La versión del firmware es requerida'],
    trim: true
  },
  credentials: {
    username: {
      type: String,
      required: [true, 'El nombre de usuario es requerido'],
      trim: true
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      trim: true
    },
    auth_type: {
      type: String,
      enum: ['basic', 'digest', 'bearer'],
      default: 'basic',
      trim: true
    }
  },
  endpoints: {
    change_password: {
      type: String,
      required: [true, 'El endpoint de cambio de contraseña es requerido'],
      trim: true
    },
    reboot: {
      type: String,
      required: [true, 'El endpoint de reinicio es requerido'],
      trim: true
    },
    login: {
      type: String,
      required: [true, 'El endpoint de login es requerido'],
      trim: true
    },
    status: {
      type: String,
      required: [true, 'El endpoint de estado es requerido'],
      trim: true
    }
  },
  cookies_required: {
    type: Boolean,
    default: true
  },
  token_required: {
    type: Boolean,
    default: true
  },
  token_pattern: {
    type: String,
    trim: true
  },
  protocol: {
    type: String,
    enum: ['http', 'https'],
    default: 'http',
    trim: true
  },
  port: {
    type: Number,
    required: [true, 'El puerto es requerido'],
    min: [1, 'El puerto debe ser mayor a 0'],
    max: [65535, 'El puerto debe ser menor a 65536']
  },
  default_gateway: {
    type: String,
    required: [true, 'La puerta de enlace por defecto es requerida'],
    trim: true,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Formato de IP inválido']
  },
  mac_address: {
    type: String,
    required: [true, 'La dirección MAC es requerida'],
    trim: true,
    match: [/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Formato de MAC inválido']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    trim: true
  },
  metadata: {
    created_by: {
      type: String,
      default: 'system',
      trim: true
    },
    updated_by: {
      type: String,
      default: 'system',
      trim: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DISABLED'],
    default: 'ACTIVE',
    trim: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  versionKey: false,
  toJSON: {
    transform: function(doc, ret: any) {
      if (ret.metadata?.created_at) ret.metadata.created_at = new Date(ret.metadata.created_at).toISOString();
      if (ret.metadata?.updated_at) ret.metadata.updated_at = new Date(ret.metadata.updated_at).toISOString();
      if (ret.created_at) ret.created_at = new Date(ret.created_at).toISOString();
      if (ret.updated_at) ret.updated_at = new Date(ret.updated_at).toISOString();
      return ret;
    }
  }
});

// Crear el modelo
const Router = mongoose.model('Router', routerSchema, 'router');

// Datos de routers para insertar
const routers = [
  {
    ip_address: "192.168.0.1",
    brand: "TP-Link",
    model: "Archer C20",
    firmware_version: "1.0.14 Build 220301 Rel.54572n",
    credentials: {
      username: "admin",
      password: "admin123",
      auth_type: "basic"
    },
    endpoints: {
      change_password: "/cgi-bin/luci/;stok={token}/admin/wireless",
      reboot: "/cgi-bin/luci/;stok={token}/system/reboot",
      login: "/cgi-bin/luci",
      status: "/cgi-bin/luci/;stok={token}/admin/status"
    },
    cookies_required: true,
    token_required: true,
    token_pattern: "stok=([a-zA-Z0-9]+)",
    protocol: "http",
    port: 80,
    default_gateway: "192.168.0.1",
    mac_address: "00:1A:2B:3C:4D:5E",
    description: "Router TP-Link Archer C20, versión estable compatible con endpoints HTTP v1.",
    metadata: {
      created_by: "system",
      updated_by: "darwin",
      created_at: new Date("2025-10-24T00:00:00Z"),
      updated_at: new Date("2025-10-24T18:00:00Z")
    },
    status: "ACTIVE"
  },
  {
    ip_address: "192.168.1.1",
    brand: "TP-Link",
    model: "Archer C7",
    firmware_version: "3.0.0 Build 20180115 Rel. 40492",
    credentials: {
      username: "admin",
      password: "admin",
      auth_type: "basic"
    },
    endpoints: {
      change_password: "/cgi-bin/luci/;stok={token}/admin/network/wireless",
      reboot: "/cgi-bin/luci/;stok={token}/admin/system/reboot",
      login: "/cgi-bin/luci",
      status: "/cgi-bin/luci/;stok={token}/admin/status/overview"
    },
    cookies_required: true,
    token_required: true,
    token_pattern: "stok=([a-zA-Z0-9]+)",
    protocol: "http",
    port: 80,
    default_gateway: "192.168.1.1",
    mac_address: "00:1A:2B:3C:4D:5F",
    description: "Router TP-Link Archer C7, versión estable con interfaz web mejorada.",
    metadata: {
      created_by: "system",
      updated_by: "darwin",
      created_at: new Date("2025-10-24T00:00:00Z"),
      updated_at: new Date("2025-10-24T18:00:00Z")
    },
    status: "ACTIVE"
  },
  {
    ip_address: "192.168.0.1",
    brand: "Linksys",
    model: "WRT3200ACM",
    firmware_version: "1.0.3.186766",
    credentials: {
      username: "admin",
      password: "admin",
      auth_type: "basic"
    },
    endpoints: {
      change_password: "/cgi-bin/luci/;stok={token}/admin/network/wireless",
      reboot: "/cgi-bin/luci/;stok={token}/admin/system/reboot",
      login: "/cgi-bin/luci",
      status: "/cgi-bin/luci/;stok={token}/admin/status"
    },
    cookies_required: true,
    token_required: true,
    token_pattern: "stok=([a-zA-Z0-9]+)",
    protocol: "http",
    port: 80,
    default_gateway: "192.168.0.1",
    mac_address: "00:1A:2B:3C:4D:60",
    description: "Router Linksys WRT3200ACM, versión estable con soporte para OpenWrt.",
    metadata: {
      created_by: "system",
      updated_by: "darwin",
      created_at: new Date("2025-10-24T00:00:00Z"),
      updated_at: new Date("2025-10-24T18:00:00Z")
    },
    status: "ACTIVE"
  },
  {
    ip_address: "192.168.1.1",
    brand: "Netgear",
    model: "R7000",
    firmware_version: "1.0.9.42_10.2.44",
    credentials: {
      username: "admin",
      password: "password",
      auth_type: "basic"
    },
    endpoints: {
      change_password: "/cgi-bin/luci/;stok={token}/admin/network/wireless",
      reboot: "/cgi-bin/luci/;stok={token}/admin/system/reboot",
      login: "/cgi-bin/luci",
      status: "/cgi-bin/luci/;stok={token}/admin/status"
    },
    cookies_required: true,
    token_required: true,
    token_pattern: "stok=([a-zA-Z0-9]+)",
    protocol: "http",
    port: 80,
    default_gateway: "192.168.1.1",
    mac_address: "00:1A:2B:3C:4D:61",
    description: "Router Netgear R7000, versión estable con firmware DD-WRT.",
    metadata: {
      created_by: "system",
      updated_by: "darwin",
      created_at: new Date("2025-10-24T00:00:00Z"),
      updated_at: new Date("2025-10-24T18:00:00Z")
    },
    status: "ACTIVE"
  },
  {
    ip_address: "192.168.0.1",
    brand: "ASUS",
    model: "RT-AC68U",
    firmware_version: "3.0.0.4.384.81039",
    credentials: {
      username: "admin",
      password: "admin",
      auth_type: "basic"
    },
    endpoints: {
      change_password: "/cgi-bin/luci/;stok={token}/admin/network/wireless",
      reboot: "/cgi-bin/luci/;stok={token}/admin/system/reboot",
      login: "/cgi-bin/luci",
      status: "/cgi-bin/luci/;stok={token}/admin/status"
    },
    cookies_required: true,
    token_required: true,
    token_pattern: "stok=([a-zA-Z0-9]+)",
    protocol: "http",
    port: 80,
    default_gateway: "192.168.0.1",
    mac_address: "00:1A:2B:3C:4D:62",
    description: "Router ASUS RT-AC68U, versión estable con firmware Merlin.",
    metadata: {
      created_by: "system",
      updated_by: "darwin",
      created_at: new Date("2025-10-24T00:00:00Z"),
      updated_at: new Date("2025-10-24T18:00:00Z")
    },
    status: "ACTIVE"
  }
];

// Función para conectar a MongoDB
async function connectToDatabase() {
  try {
    const configData = config();
    const mongoUri = configData.database.uri;
    const dbName = configData.database.name;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    // Construir la URI completa con el nombre de la base de datos
    const fullUri = mongoUri.endsWith('/') 
      ? `${mongoUri}${dbName}` 
      : `${mongoUri}/${dbName}`;

    await mongoose.connect(fullUri);
    console.log('Conectado a MongoDB exitosamente');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
}

// Función para insertar routers
async function insertRouters() {
  try {
    console.log('Limpiando colección de routers existente...');
    await Router.deleteMany({});
    
    console.log('Insertando routers...');
    const result = await Router.insertMany(routers);
    
    console.log(`${result.length} routers insertados exitosamente`);
    
    // Mostrar resumen de routers insertados
    result.forEach((router, index) => {
      console.log(`${index + 1}. ${router.brand} ${router.model} - ${router.ip_address}`);
    });
    
  } catch (error) {
    console.error('Error al insertar routers:', error);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    await connectToDatabase();
    await insertRouters();
    console.log('Proceso completado exitosamente');
  } catch (error) {
    console.error('Error en el proceso:', error);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

export { insertRouters, connectToDatabase };

// comando para ejecutar el script: npx ts-node proces/insertrouter.ts