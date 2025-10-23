import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../configs/config';

// Interfaces para el usuario basadas en tu esquema real
export interface IUser extends Document {
  _id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  account_status: string;
  plan: {
    name: string;
    speed_mbps: number;
    price_monthly: number;
    installation_date: Date;
    next_billing_date: Date;
  };
  network: {
    router_model: string;
    router_mac: string;
    router_ip: string;
    ssid: string;
    password_hint: string;
    public_ip: string;
    connection_type: string;
    signal_quality: number;
    uptime: number;
  };
  devices: Array<{
    name: string;
    mac_address: string;
    ip_address: string;
    device_type: string;
    first_seen: Date;
    last_seen: Date;
    connection_status: string;
    bandwidth_usage_mb: number;
    blocked: boolean;
    signal_strength: number;
    _id: string;
  }>;
  activity_log: Array<{
    action: string;
    description: string;
    timestamp: Date;
    ip_origin: string;
    _id: string;
  }>;
  support: {
    last_ticket_id: number;
    incidents_reported: number;
    last_contact_date: Date | null;
  };
  preferences: {
    notifications_enabled: boolean;
    preferred_language: string;
    dark_mode: boolean;
  };
  created_on: Date;
  updated_on: Date;
  last_login: Date;
  verified: boolean;
  roles: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IAuthResult {
  success: boolean;
  user?: IUser;
  message: string;
}

// Esquema de usuario basado en tu estructura real
const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true
  },
  first_name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  last_name: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  phone_number: {
    type: String,
    required: [true, 'El número de teléfono es requerido'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  account_status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  plan: {
    name: String,
    speed_mbps: Number,
    price_monthly: Number,
    installation_date: Date,
    next_billing_date: Date
  },
  network: {
    router_model: String,
    router_mac: String,
    router_ip: String,
    ssid: String,
    password_hint: String,
    public_ip: String,
    connection_type: String,
    signal_quality: Number,
    uptime: Number
  },
  devices: [{
    name: String,
    mac_address: String,
    ip_address: String,
    device_type: String,
    first_seen: Date,
    last_seen: Date,
    connection_status: String,
    bandwidth_usage_mb: Number,
    blocked: Boolean,
    signal_strength: Number
  }],
  activity_log: [{
    action: String,
    description: String,
    timestamp: Date,
    ip_origin: String
  }],
  support: {
    last_ticket_id: { type: Number, default: 0 },
    incidents_reported: { type: Number, default: 0 },
    last_contact_date: { type: Date, default: null }
  },
  preferences: {
    notifications_enabled: { type: Boolean, default: true },
    preferred_language: { type: String, default: 'es' },
    dark_mode: { type: Boolean, default: false }
  },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  last_login: { type: Date, default: Date.now },
  verified: { type: Boolean, default: false },
  roles: [String],
  tags: [String]
}, {
  timestamps: true,
  versionKey: false
});

// Middleware para encriptar contraseña antes de guardar
userSchema.pre('save', async function(next) {
  // Solo encriptar si la contraseña fue modificada
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Modelo de usuario
const User = mongoose.model<IUser>('User', userSchema, 'user');

// Clase de servicios para usuarios
export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Conectar a la base de datos MongoDB
   */
  public async connectToDatabase(): Promise<void> {
    try {
      const configData = config();
      await mongoose.connect(configData.database.uri || '', {
        dbName: configData.database.name
      });
      console.log('Conectado a MongoDB exitosamente');
    } catch (error) {
      console.error('Error al conectar a MongoDB:', error);
      throw error;
    }
  }

  /**
   * Desconectar de la base de datos
   */
  public async disconnectFromDatabase(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('Desconectado de MongoDB');
    } catch (error) {
      console.error('Error al desconectar de MongoDB:', error);
      throw error;
    }
  }

  /**
   * Buscar usuario por email
   */
  public async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      return user;
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      throw new Error('Error interno del servidor al buscar usuario');
    }
  }

  /**
   * Buscar usuario por username
   */
  public async findUserByUsername(username: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ username: username.trim() });
      return user;
    } catch (error) {
      console.error('Error al buscar usuario por username:', error);
      throw new Error('Error interno del servidor al buscar usuario');
    }
  }

  /**
   * Buscar usuario por ID
   */
  public async findUserById(id: string): Promise<IUser | null> {
    try {
      const user = await User.findById(id);
      return user;
    } catch (error) {
      console.error('Error al buscar usuario por ID:', error);
      throw new Error('Error interno del servidor al buscar usuario');
    }
  }

  /**
   * Validar credenciales de login
   */
  public async validateLogin(credentials: ILoginCredentials): Promise<IAuthResult> {
    try {
      const { email, password } = credentials;

      // Buscar usuario por email
      const user = await this.findUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'Credenciales inválidas'
        };
      }

      // Verificar estado de la cuenta
      if (user.account_status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Cuenta inactiva o suspendida'
        };
      }

      // Comparar contraseñas
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Credenciales inválidas'
        };
      }

      // Actualizar último login
      user.last_login = new Date();
      await user.save();

      return {
        success: true,
        user,
        message: 'Login exitoso'
      };
    } catch (error) {
      console.error('Error al validar login:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Obtener todos los usuarios (para administración)
   */
  public async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await User.find({}).select('-password');
      return users;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw new Error('Error interno del servidor al obtener usuarios');
    }
  }

  /**
   * Actualizar información del usuario
   */
  public async updateUser(userId: string, updateData: any): Promise<IUser | null> {
    try {
      updateData.updated_on = new Date();
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      return user;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw new Error('Error interno del servidor al actualizar usuario');
    }
  }

  /**
   * Eliminar usuario
   */
  public async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await User.findByIdAndDelete(userId);
      return !!result;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw new Error('Error interno del servidor al eliminar usuario');
    }
  }
}

// Exportar instancia singleton del servicio
export const userService = UserService.getInstance();
