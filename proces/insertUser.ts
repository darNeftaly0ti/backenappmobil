import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../APP/configs/config';

// Definir el esquema para los usuarios con la nueva estructura
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone_number: { type: String, required: true },
  password: { type: String, required: true },
  account_status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  ONU_sn: { type: String, required: true, unique: true }, // Número de serie de la ONU para consultas en SmartOLT
  // Campos adicionales para filtrar en SmartOLT y reducir consumo de API
  olt_name: { type: String }, // Nombre del OLT (ej: "POAQUIL")
  onu_port: { type: String }, // Puerto de la ONU (ej: "gpon-onu_1/6/2:2")
  olt_id: { type: String }, // ID del OLT para filtros en SmartOLT
  board: { type: Number }, // Número de placa/tarjeta
  port: { type: Number }, // Número de puerto PON
  zone: { type: String }, // Zona geográfica
  
  // información del plan de internet
  plan: {
    name: { type: String, required: true },
    speed_mbps: { type: Number, required: true },
    price_monthly: { type: Number, required: true },
    installation_date: { type: Date, required: true },
    next_billing_date: { type: Date, required: true }
  },

  // datos de red local
  network: {
    router_model: { type: String, required: true },
    router_mac: { type: String, required: true },
    router_ip: { type: String, required: true },
    ssid: { type: String, required: true },
    password_hint: { type: String },
    public_ip: { type: String },
    connection_type: { type: String, enum: ['fiber', 'wireless', 'dsl'], required: true },
    signal_quality: { type: Number, min: 0, max: 100 },
    uptime: { type: Number, default: 0 }
  },

  // dispositivos conectados detectados
  devices: [{
    name: { type: String, required: true },
    mac_address: { type: String, required: true },
    ip_address: { type: String, required: true },
    device_type: { type: String, required: true },
    first_seen: { type: Date, required: true },
    last_seen: { type: Date, required: true },
    connection_status: { type: String, enum: ['connected', 'disconnected'], default: 'connected' },
    bandwidth_usage_mb: { type: Number, default: 0 },
    blocked: { type: Boolean, default: false },
    signal_strength: { type: Number }
  }],

  // historial de actividad
  activity_log: [{
    action: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, required: true },
    ip_origin: { type: String, required: true }
  }],

  // información de soporte técnico
  support: {
    last_ticket_id: { type: Number, default: 0 },
    incidents_reported: { type: Number, default: 0 },
    last_contact_date: { type: Date }
  },

  // notificaciones y preferencias
  preferences: {
    notifications_enabled: { type: Boolean, default: true },
    preferred_language: { type: String, enum: ['es', 'en'], default: 'es' },
    dark_mode: { type: Boolean, default: false }
  },

  // control del sistema
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  last_login: { type: Date },
  verified: { type: Boolean, default: false },
  roles: [{ type: String, enum: ['USER', 'ADMIN', 'TECH_SUPPORT'], default: ['USER'] }],
  tags: [{ type: String }]
}, {
  timestamps: true
});

// Crear el modelo con la nueva colección 'user'
const User = mongoose.model('User', userSchema, 'user');

async function insertTestUser() {
  try {
    const configData = config();
    const mongoUri = configData.database.uri;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    // Usar la nueva base de datos router_app_ww_production
    const dbName = 'router_app_ww_production';
    const fullUri = mongoUri.endsWith('/') 
      ? `${mongoUri}${dbName}` 
      : `${mongoUri}/${dbName}`;

    console.log('Conectando a la base de datos:', fullUri);
    await mongoose.connect(fullUri);

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username: 'admin' });
    
    if (existingUser) {
      console.log('Usuario existente encontrado, eliminando...');
      await User.findByIdAndDelete(existingUser._id);
    }

    // Encriptar contraseña "1234567"
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('1234567', saltRounds);

    // Crear usuario de ejemplo con datos realistas
    const testUser = new User({
      username: 'admin',
      first_name: 'Dessiré',
      last_name: 'Ortiz',
      email: 'dess@gmail.com',
      phone_number: '+502 42158057',
      password: hashedPassword,
      account_status: 'ACTIVE',
      ONU_sn: '00:1A:2B:3C:4D:5E', // SN de ONU para SmartOLT
      
      // Información del plan de internet
      plan: {
        name: 'Hogar 50 Mbps',
        speed_mbps: 50,
        price_monthly: 299.99,
        installation_date: new Date('2024-01-15'),
        next_billing_date: new Date('2024-12-15')
      },

      // Datos de red local
      network: {
        router_model: 'TP-Link Archer C7',
        router_mac: '00:1A:2B:3C:4D:5E',
        router_ip: '192.168.1.1',
        ssid: 'RouterApp_WiFi',
        password_hint: 'Mi contraseña segura',
        public_ip: '201.123.45.67',
        connection_type: 'fiber',
        signal_quality: 95,
        uptime: 720 // 30 días en horas
      },

      // Dispositivos conectados
      devices: [
        {
          name: 'iPhone de Darwin',
          mac_address: 'AA:BB:CC:DD:EE:FF',
          ip_address: '192.168.1.100',
          device_type: 'phone',
          first_seen: new Date('2024-01-15'),
          last_seen: new Date(),
          connection_status: 'connected',
          bandwidth_usage_mb: 1024,
          blocked: false,
          signal_strength: -45
        },
        {
          name: 'Laptop Darwin',
          mac_address: '11:22:33:44:55:66',
          ip_address: '192.168.1.101',
          device_type: 'laptop',
          first_seen: new Date('2024-01-16'),
          last_seen: new Date(),
          connection_status: 'connected',
          bandwidth_usage_mb: 2048,
          blocked: false,
          signal_strength: -35
        }
      ],

      // Historial de actividad
      activity_log: [
        {
          action: 'account_created',
          description: 'Cuenta de usuario creada exitosamente',
          timestamp: new Date(),
          ip_origin: '192.168.1.100'
        },
        {
          action: 'wifi_password_changed',
          description: 'Contraseña de WiFi actualizada',
          timestamp: new Date(Date.now() - 86400000), // hace 1 día
          ip_origin: '192.168.1.101'
        }
      ],

      // Información de soporte
      support: {
        last_ticket_id: 0,
        incidents_reported: 0,
        last_contact_date: null
      },

      // Preferencias
      preferences: {
        notifications_enabled: true,
        preferred_language: 'es',
        dark_mode: false
      },

      // Control del sistema
      created_on: new Date(),
      updated_on: new Date(),
      last_login: new Date(),
      verified: true,
      roles: ['ADMIN'],
      tags: ['premium', 'beta_tester']
    });

    console.log('Guardando usuario de prueba...');
    await testUser.save();
    console.log(' Usuario creado exitosamente:', testUser.username);

    await mongoose.connection.close();
    console.log('Conexión cerrada.');

  } catch (error) {
    console.error(' Error al insertar usuario de prueba:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Función para insertar usuario de Elmer
async function insertElmerUser() {
  try {
    const configData = config();
    const mongoUri = configData.database.uri;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    // Usar la nueva base de datos router_app_ww_production
    const dbName = 'router_app_ww_production';
    const fullUri = mongoUri.endsWith('/') 
      ? `${mongoUri}${dbName}` 
      : `${mongoUri}/${dbName}`;

    console.log('Conectando a la base de datos:', fullUri);
    await mongoose.connect(fullUri);

    // Verificar si el usuario ya existe por email
    const existingUser = await User.findOne({ email: 'elmer@gmail.com' });
    
    if (existingUser) {
      console.log('Usuario existente encontrado, eliminando...');
      await User.findByIdAndDelete(existingUser._id);
    }

    // Encriptar contraseña "1234567"
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('1234567', saltRounds);

    // Crear usuario de Elmer con los datos proporcionados
    const elmerUser = new User({
      username: 'elmer',
      first_name: 'Elmer',
      last_name: 'Usuario',
      email: 'elmer@gmail.com',
      phone_number: '+502 00000000',
      password: hashedPassword,
      account_status: 'ACTIVE',
      ONU_sn: 'GPON001FCFD0', // SN de ONU para SmartOLT
      // Campos para filtrado en SmartOLT
      olt_name: 'POAQUIL',
      onu_port: 'gpon-onu_1/6/2:2',
      olt_id: '1', // ID del OLT (ajustar según tu configuración)
      board: 6, // Número de placa/tarjeta (del puerto gpon-onu_1/6/2:2)
      port: 2, // Número de puerto PON (del puerto gpon-onu_1/6/2:2)
      zone: 'Zone 1', // Zona (ajustar según tu configuración)
      
      // Información del plan de internet
      plan: {
        name: 'Hogar 50 Mbps',
        speed_mbps: 50,
        price_monthly: 299.99,
        installation_date: new Date('2024-01-15'),
        next_billing_date: new Date('2024-12-15')
      },

      // Datos de red local con la MAC proporcionada
      network: {
        router_model: 'TP-Link Archer C7',
        router_mac: 'GPON001FCFD0',
        router_ip: '192.168.1.1',
        ssid: 'RouterApp_WiFi_Elmer',
        password_hint: 'Contraseña segura',
        public_ip: '201.123.45.68',
        connection_type: 'fiber',
        signal_quality: 95,
        uptime: 720 // 30 días en horas
      },

      // Dispositivos conectados
      devices: [
        {
          name: 'Dispositivo de Elmer',
          mac_address: 'AA:BB:CC:DD:EE:01',
          ip_address: '192.168.1.100',
          device_type: 'phone',
          first_seen: new Date('2024-01-15'),
          last_seen: new Date(),
          connection_status: 'connected',
          bandwidth_usage_mb: 1024,
          blocked: false,
          signal_strength: -45
        }
      ],

      // Historial de actividad
      activity_log: [
        {
          action: 'account_created',
          description: 'Cuenta de usuario creada exitosamente',
          timestamp: new Date(),
          ip_origin: '192.168.1.100'
        }
      ],

      // Información de soporte
      support: {
        last_ticket_id: 0,
        incidents_reported: 0,
        last_contact_date: null
      },

      // Preferencias
      preferences: {
        notifications_enabled: true,
        preferred_language: 'es',
        dark_mode: false
      },

      // Control del sistema
      created_on: new Date(),
      updated_on: new Date(),
      last_login: new Date(),
      verified: true,
      roles: ['USER'],
      tags: ['new_user']
    });

    console.log('Guardando usuario de Elmer...');
    await elmerUser.save();
    console.log('✓ Usuario creado exitosamente:', elmerUser.username);
    console.log('✓ ONU_sn:', elmerUser.ONU_sn);

    await mongoose.connection.close();
    console.log('Conexión cerrada.');

  } catch (error) {
    console.error('✗ Error al insertar usuario de Elmer:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Ejecutar la función del usuario admin
// insertTestUser();

// Ejecutar la función del usuario Elmer
insertElmerUser();


//comando para insertar usuario npx ts-node proces/insertUser.ts