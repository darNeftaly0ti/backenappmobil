import mongoose from 'mongoose';
import { IUser } from '../services';
import { config } from '../../configs/config';

// Interface para los datos de creación de usuario
export interface ICreateUserData {
  // Campos básicos requeridos
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  account_status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  
  // Campos de SmartOLT
  ONU_sn?: string;
  olt_name?: string;
  onu_port?: string;
  olt_id?: string;
  board?: number;
  port?: number;
  zone?: string;
  
  // Plan
  plan?: {
    name: string;
    speed_mbps: number;
    price_monthly: number;
    installation_date?: Date;
    next_billing_date?: Date;
  };
  
  // Network
  network?: {
    router_model?: string;
    router_mac?: string;
    router_ip?: string;
    ssid?: string;
    password_hint?: string;
    public_ip?: string;
    connection_type?: string;
    signal_quality?: number;
    uptime?: number;
  };
  
  // Devices (opcional, puede ser un array vacío)
  devices?: Array<{
    name: string;
    mac_address: string;
    ip_address: string;
    device_type: string;
    first_seen?: Date;
    last_seen?: Date;
    connection_status?: string;
    bandwidth_usage_mb?: number;
    blocked?: boolean;
    signal_strength?: number;
  }>;
  
  // Activity log inicial
  activity_log?: Array<{
    action: string;
    description: string;
    timestamp?: Date;
    ip_origin: string;
  }>;
  
  // Support
  support?: {
    last_ticket_id?: number;
    incidents_reported?: number;
    last_contact_date?: Date | null;
  };
  
  // Preferences
  preferences?: {
    notifications_enabled?: boolean;
    preferred_language?: string;
    dark_mode?: boolean;
  };
  
  // Campos adicionales
  verified?: boolean;
  roles?: string[];
  tags?: string[];
}

// Interface para el resultado de la creación
export interface ICreateUserResult {
  success: boolean;
  user?: IUser;
  message: string;
  error?: any;
}

// Clase de servicio para creación de usuarios
export class CreateUserService {
  private static instance: CreateUserService;
  private configData: ReturnType<typeof config>;
  private UserModel: mongoose.Model<IUser>;

  private constructor() {
    this.configData = config();
    // Obtener el modelo User desde mongoose (ya debe estar registrado)
    this.UserModel = mongoose.model<IUser>('User');
  }

  public static getInstance(): CreateUserService {
    if (!CreateUserService.instance) {
      CreateUserService.instance = new CreateUserService();
    }
    return CreateUserService.instance;
  }

  /**
   * Validar datos requeridos para crear un usuario
   */
  private validateUserData(userData: ICreateUserData): { isValid: boolean; message: string } {
    // Validar campos requeridos
    if (!userData.username || userData.username.trim() === '') {
      return { isValid: false, message: 'El nombre de usuario es requerido' };
    }

    if (!userData.first_name || userData.first_name.trim() === '') {
      return { isValid: false, message: 'El nombre es requerido' };
    }

    if (!userData.last_name || userData.last_name.trim() === '') {
      return { isValid: false, message: 'El apellido es requerido' };
    }

    if (!userData.email || userData.email.trim() === '') {
      return { isValid: false, message: 'El email es requerido' };
    }

    // Validar formato de email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(userData.email)) {
      return { isValid: false, message: 'Formato de email inválido' };
    }

    if (!userData.phone_number || userData.phone_number.trim() === '') {
      return { isValid: false, message: 'El número de teléfono es requerido' };
    }

    if (!userData.password || userData.password.trim() === '') {
      return { isValid: false, message: 'La contraseña es requerida' };
    }

    if (userData.password.length < 6) {
      return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
    }

    return { isValid: true, message: 'Datos válidos' };
  }

  /**
   * Crear un nuevo usuario en la base de datos
   */
  public async createUser(userData: ICreateUserData, ipOrigin?: string): Promise<ICreateUserResult> {
    try {
      // Validar datos
      const validation = this.validateUserData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Verificar si el usuario ya existe (por email o username)
      const existingUser = await this.UserModel.findOne({
        $or: [
          { email: userData.email.toLowerCase().trim() },
          { username: userData.username.trim() }
        ]
      });

      if (existingUser) {
        const field = existingUser.email === userData.email.toLowerCase().trim() ? 'email' : 'username';
        return {
          success: false,
          message: `Ya existe un usuario con ese ${field === 'email' ? 'correo electrónico' : 'nombre de usuario'}`
        };
      }

      // Preparar datos del usuario con valores por defecto
      const now = new Date();
      const userObject: any = {
        username: userData.username.trim(),
        first_name: userData.first_name.trim(),
        last_name: userData.last_name.trim(),
        email: userData.email.toLowerCase().trim(),
        phone_number: userData.phone_number.trim(),
        password: userData.password, // Se encriptará automáticamente con el middleware pre-save
        account_status: userData.account_status || 'ACTIVE',
        created_on: now,
        updated_on: now,
        last_login: now,
        verified: userData.verified !== undefined ? userData.verified : false,
        roles: userData.roles || ['USER'],
        tags: userData.tags || []
      };

      // Agregar campos de SmartOLT si están presentes
      if (userData.ONU_sn) {
        userObject.ONU_sn = userData.ONU_sn.trim();
      }
      if (userData.olt_name) {
        userObject.olt_name = userData.olt_name.trim();
      }
      if (userData.onu_port) {
        userObject.onu_port = userData.onu_port.trim();
      }
      if (userData.olt_id) {
        userObject.olt_id = userData.olt_id.trim();
      }
      if (userData.board !== undefined) {
        userObject.board = userData.board;
      }
      if (userData.port !== undefined) {
        userObject.port = userData.port;
      }
      if (userData.zone) {
        userObject.zone = userData.zone.trim();
      }

      // Agregar plan si está presente
      if (userData.plan) {
        userObject.plan = {
          name: userData.plan.name,
          speed_mbps: userData.plan.speed_mbps,
          price_monthly: userData.plan.price_monthly,
          installation_date: userData.plan.installation_date || now,
          next_billing_date: userData.plan.next_billing_date || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 días desde ahora
        };
      }

      // Agregar network si está presente
      if (userData.network) {
        userObject.network = {
          router_model: userData.network.router_model || '',
          router_mac: userData.network.router_mac || userData.ONU_sn || '',
          router_ip: userData.network.router_ip || '192.168.1.1',
          ssid: userData.network.ssid || `RouterApp_WiFi_${userData.first_name}`,
          password_hint: userData.network.password_hint || 'Contraseña segura',
          public_ip: userData.network.public_ip || '',
          connection_type: userData.network.connection_type || 'fiber',
          signal_quality: userData.network.signal_quality || 0,
          uptime: userData.network.uptime || 0
        };
      }

      // Agregar devices si están presentes
      if (userData.devices && userData.devices.length > 0) {
        userObject.devices = userData.devices.map(device => ({
          name: device.name,
          mac_address: device.mac_address,
          ip_address: device.ip_address,
          device_type: device.device_type,
          first_seen: device.first_seen || now,
          last_seen: device.last_seen || now,
          connection_status: device.connection_status || 'connected',
          bandwidth_usage_mb: device.bandwidth_usage_mb || 0,
          blocked: device.blocked !== undefined ? device.blocked : false,
          signal_strength: device.signal_strength || 0
        }));
      } else {
        userObject.devices = [];
      }

      // Agregar activity log inicial
      const activityLogEntry = {
        action: userData.activity_log?.[0]?.action || 'account_created',
        description: userData.activity_log?.[0]?.description || 'Cuenta de usuario creada exitosamente',
        timestamp: userData.activity_log?.[0]?.timestamp || now,
        ip_origin: userData.activity_log?.[0]?.ip_origin || ipOrigin || '127.0.0.1'
      };
      userObject.activity_log = [activityLogEntry];

      // Agregar support
      userObject.support = {
        last_ticket_id: userData.support?.last_ticket_id || 0,
        incidents_reported: userData.support?.incidents_reported || 0,
        last_contact_date: userData.support?.last_contact_date || null
      };

      // Agregar preferences
      userObject.preferences = {
        notifications_enabled: userData.preferences?.notifications_enabled !== undefined 
          ? userData.preferences.notifications_enabled 
          : true,
        preferred_language: userData.preferences?.preferred_language || 'es',
        dark_mode: userData.preferences?.dark_mode !== undefined 
          ? userData.preferences.dark_mode 
          : false
      };

      // Crear el usuario en la base de datos
      const newUser = new this.UserModel(userObject);
      const savedUser = await newUser.save();

      return {
        success: true,
        user: savedUser,
        message: 'Usuario creado exitosamente'
      };

    } catch (error: any) {
      console.error('Error al crear usuario:', error);

      // Manejar errores específicos de MongoDB
      if (error.code === 11000) {
        // Error de duplicado (unique constraint)
        const field = Object.keys(error.keyPattern)[0];
        return {
          success: false,
          message: `Ya existe un usuario con ese ${field === 'email' ? 'correo electrónico' : field === 'username' ? 'nombre de usuario' : field}`,
          error: error
        };
      }

      if (error.name === 'ValidationError') {
        // Error de validación de Mongoose
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return {
          success: false,
          message: `Error de validación: ${errors.join(', ')}`,
          error: error
        };
      }

      return {
        success: false,
        message: 'Error interno del servidor al crear usuario',
        error: error
      };
    }
  }

  /**
   * Crear usuario con datos mínimos (solo campos requeridos)
   */
  public async createUserMinimal(
    username: string,
    first_name: string,
    last_name: string,
    email: string,
    phone_number: string,
    password: string,
    ipOrigin?: string
  ): Promise<ICreateUserResult> {
    return this.createUser({
      username,
      first_name,
      last_name,
      email,
      phone_number,
      password,
      account_status: 'ACTIVE',
      verified: false,
      roles: ['USER'],
      tags: []
    }, ipOrigin);
  }
}

// Exportar instancia singleton del servicio
export const createUserService = CreateUserService.getInstance();

