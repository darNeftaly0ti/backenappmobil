import mongoose, { Document, Schema } from 'mongoose';
import { config } from '../../configs/config';
import { userService } from '../services';

// Interface para los datos de creación de notificación
export interface ICreateAlertData {
  // Campos requeridos
  type: 'survey' | 'message' | 'reminder' | 'announcement' | 'warning' | 'info' | 'system';
  title: string;
  message: string;
  
  // Destinatarios (al menos uno debe estar presente)
  user_id?: string | mongoose.Types.ObjectId; // Usuario destinatario único
  user_ids?: (string | mongoose.Types.ObjectId)[]; // Múltiples usuarios destinatarios
  send_to_all?: boolean; // Enviar a todos los usuarios activos
  
  // Campos opcionales
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string; // Categoría personalizada
  
  // Datos adicionales según el tipo de notificación
  data?: {
    // Para encuestas (survey)
    survey_id?: string;
    survey_questions?: Array<{
      question: string;
      type: 'multiple_choice' | 'text' | 'rating' | 'yes_no';
      options?: string[];
      required?: boolean;
    }>;
    survey_expires_at?: Date;
    
    // Para mensajes
    sender_id?: string;
    sender_name?: string;
    reply_to?: string;
    attachments?: Array<{
      type: string;
      url: string;
      name: string;
    }>;
    
    // Para recordatorios
    reminder_date?: Date;
    reminder_repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
    action_url?: string; // URL para acción relacionada
    
    // Datos adicionales genéricos
    [key: string]: any;
  };
  
  // Configuración de visualización
  icon?: string; // Nombre del icono o URL
  color?: string; // Color de la notificación
  image_url?: string; // URL de imagen adjunta
  
  // Configuración de acción
  action_button?: {
    text: string;
    url?: string;
    action?: string;
  };
  
  // Expiración
  expires_at?: Date;
  
  // Metadata
  metadata?: {
    source?: string; // 'web', 'app', 'system'
    created_by?: string; // ID del usuario o sistema que creó la notificación
    tags?: string[];
    [key: string]: any;
  };
}

// Interface para la notificación
export interface IAlert extends Document {
  _id: string;
  user_id: mongoose.Types.ObjectId;
  type: 'survey' | 'message' | 'reminder' | 'announcement' | 'warning' | 'info' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  data?: any;
  icon?: string;
  color?: string;
  image_url?: string;
  action_button?: {
    text: string;
    url?: string;
    action?: string;
  };
  expires_at?: Date;
  read: boolean;
  read_at?: Date;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

// Interface para el resultado de la creación
export interface ICreateAlertResult {
  success: boolean;
  alert?: IAlert; // Para un solo usuario
  alerts?: IAlert[]; // Para múltiples usuarios
  message: string;
  total_created?: number; // Número de notificaciones creadas
  error?: any;
}

// Esquema de notificación
const alertSchema = new Schema<IAlert>({
  user_id: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID del usuario es requerido'],
    index: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: [true, 'El tipo de notificación es requerido'],
    enum: ['survey', 'message', 'reminder', 'announcement', 'warning', 'info', 'system'],
    index: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  message: {
    type: String,
    required: [true, 'El mensaje es requerido'],
    trim: true,
    maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'La categoría no puede exceder 50 caracteres']
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [100, 'El icono no puede exceder 100 caracteres']
  },
  color: {
    type: String,
    trim: true,
    match: [/^#[0-9A-Fa-f]{6}$|^[a-zA-Z]+$/, 'Color inválido. Use formato hex (#RRGGBB) o nombre de color']
  },
  image_url: {
    type: String,
    trim: true,
    maxlength: [500, 'La URL de imagen no puede exceder 500 caracteres']
  },
  action_button: {
    text: {
      type: String,
      trim: true,
      maxlength: [50, 'El texto del botón no puede exceder 50 caracteres']
    },
    url: {
      type: String,
      trim: true,
      maxlength: [500, 'La URL no puede exceder 500 caracteres']
    },
    action: {
      type: String,
      trim: true,
      maxlength: [100, 'La acción no puede exceder 100 caracteres']
    }
  },
  expires_at: {
    type: Date,
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  read_at: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  versionKey: false,
  toJSON: {
    transform: function(doc, ret: any) {
      if (ret.created_at) ret.created_at = new Date(ret.created_at).toISOString();
      if (ret.updated_at) ret.updated_at = new Date(ret.updated_at).toISOString();
      if (ret.read_at) ret.read_at = new Date(ret.read_at).toISOString();
      if (ret.expires_at) ret.expires_at = new Date(ret.expires_at).toISOString();
      return ret;
    }
  }
});

// Índices para optimizar consultas
alertSchema.index({ user_id: 1, read: 1, created_at: -1 });
alertSchema.index({ user_id: 1, type: 1, created_at: -1 });
alertSchema.index({ user_id: 1, priority: 1, created_at: -1 });
alertSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // Auto-eliminar notificaciones expiradas

// Modelo de notificación - usando la colección 'surveys' de la base de datos
const Alert = mongoose.model<IAlert>('Alert', alertSchema, 'surveys');

// Clase de servicio para creación de notificaciones
export class CreateAlertService {
  private static instance: CreateAlertService;
  private configData: ReturnType<typeof config>;
  private AlertModel: mongoose.Model<IAlert>;

  private constructor() {
    this.configData = config();
    this.AlertModel = mongoose.model<IAlert>('Alert');
  }

  public static getInstance(): CreateAlertService {
    if (!CreateAlertService.instance) {
      CreateAlertService.instance = new CreateAlertService();
    }
    return CreateAlertService.instance;
  }

  /**
   * Validar datos requeridos para crear una notificación
   */
  private validateAlertData(alertData: ICreateAlertData): { isValid: boolean; message: string } {
    // Validar que al menos un destinatario esté presente
    if (!alertData.user_id && !alertData.user_ids && !alertData.send_to_all) {
      return { isValid: false, message: 'Debe especificar al menos un destinatario: user_id, user_ids, o send_to_all' };
    }

    // Validar que no se envíen múltiples opciones de destinatario al mismo tiempo
    const recipientOptions = [
      alertData.user_id ? 1 : 0,
      alertData.user_ids && alertData.user_ids.length > 0 ? 1 : 0,
      alertData.send_to_all ? 1 : 0
    ].filter(x => x > 0).length;

    if (recipientOptions > 1) {
      return { isValid: false, message: 'Solo puede especificar una opción de destinatario: user_id, user_ids, o send_to_all' };
    }

    if (!alertData.type) {
      return { isValid: false, message: 'El tipo de notificación es requerido' };
    }

    const validTypes = ['survey', 'message', 'reminder', 'announcement', 'warning', 'info', 'system'];
    if (!validTypes.includes(alertData.type)) {
      return { isValid: false, message: `Tipo de notificación inválido. Tipos permitidos: ${validTypes.join(', ')}` };
    }

    if (!alertData.title || alertData.title.trim() === '') {
      return { isValid: false, message: 'El título es requerido' };
    }

    if (alertData.title.length > 200) {
      return { isValid: false, message: 'El título no puede exceder 200 caracteres' };
    }

    if (!alertData.message || alertData.message.trim() === '') {
      return { isValid: false, message: 'El mensaje es requerido' };
    }

    if (alertData.message.length > 1000) {
      return { isValid: false, message: 'El mensaje no puede exceder 1000 caracteres' };
    }

    if (alertData.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(alertData.priority)) {
        return { isValid: false, message: `Prioridad inválida. Prioridades permitidas: ${validPriorities.join(', ')}` };
      }
    }

    return { isValid: true, message: 'Datos válidos' };
  }

  /**
   * Obtener lista de IDs de usuarios destinatarios
   */
  private async getRecipientUserIds(alertData: ICreateAlertData): Promise<string[]> {
    let userIds: string[] = [];

    // Caso 1: Un solo usuario
    if (alertData.user_id) {
      userIds = [alertData.user_id.toString()];
    }
    // Caso 2: Múltiples usuarios
    else if (alertData.user_ids && alertData.user_ids.length > 0) {
      userIds = alertData.user_ids.map(id => id.toString());
    }
    // Caso 3: Todos los usuarios activos
    else if (alertData.send_to_all) {
      try {
        const allUsers = await userService.getAllUsers();
        // Filtrar solo usuarios activos
        const activeUsers = allUsers.filter(user => user.account_status === 'ACTIVE');
        userIds = activeUsers.map(user => user._id.toString());
      } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        throw new Error('Error al obtener lista de usuarios activos');
      }
    }

    return userIds;
  }

  /**
   * Crear una nueva notificación (soporta un usuario, múltiples usuarios o todos los usuarios)
   */
  public async createAlert(alertData: ICreateAlertData): Promise<ICreateAlertResult> {
    try {
      // Validar datos
      const validation = this.validateAlertData(alertData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Obtener lista de usuarios destinatarios
      const recipientUserIds = await this.getRecipientUserIds(alertData);

      if (recipientUserIds.length === 0) {
        return {
          success: false,
          message: 'No se encontraron usuarios destinatarios'
        };
      }

      // Preparar datos base de la notificación (sin user_id)
      const now = new Date();
      const baseAlertData: any = {
        type: alertData.type,
        title: alertData.title.trim(),
        message: alertData.message.trim(),
        priority: alertData.priority || 'medium',
        read: false,
        created_at: now,
        updated_at: now
      };

      // Agregar campos opcionales
      if (alertData.category) {
        baseAlertData.category = alertData.category.trim();
      }

      if (alertData.data) {
        baseAlertData.data = alertData.data;
      }

      if (alertData.icon) {
        baseAlertData.icon = alertData.icon.trim();
      }

      if (alertData.color) {
        baseAlertData.color = alertData.color.trim();
      }

      if (alertData.image_url) {
        baseAlertData.image_url = alertData.image_url.trim();
      }

      if (alertData.action_button) {
        baseAlertData.action_button = {
          text: alertData.action_button.text.trim(),
          url: alertData.action_button.url?.trim(),
          action: alertData.action_button.action?.trim()
        };
      }

      if (alertData.expires_at) {
        baseAlertData.expires_at = new Date(alertData.expires_at);
      }

      if (alertData.metadata) {
        baseAlertData.metadata = alertData.metadata;
      }

      // Crear notificaciones para cada usuario destinatario
      const alertsToCreate = recipientUserIds.map(userId => ({
        ...baseAlertData,
        user_id: userId
      }));

      // Insertar todas las notificaciones de una vez (más eficiente)
      const savedAlerts = await this.AlertModel.insertMany(alertsToCreate) as IAlert[];

      // Si es un solo usuario, retornar como antes
      if (savedAlerts.length === 1) {
        return {
          success: true,
          alert: savedAlerts[0] as IAlert,
          message: 'Notificación creada exitosamente',
          total_created: 1
        };
      }

      // Si son múltiples usuarios, retornar array
      return {
        success: true,
        alerts: savedAlerts as IAlert[],
        message: `Notificaciones creadas exitosamente para ${savedAlerts.length} usuario(s)`,
        total_created: savedAlerts.length
      };

    } catch (error: any) {
      console.error('Error al crear notificación:', error);

      // Manejar errores específicos de MongoDB
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Error: Ya existe una notificación con estos datos',
          error: error
        };
      }

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return {
          success: false,
          message: `Error de validación: ${errors.join(', ')}`,
          error: error
        };
      }

      return {
        success: false,
        message: 'Error interno del servidor al crear notificación',
        error: error
      };
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  public async getUserAlerts(
    userId: string,
    filters?: {
      read?: boolean;
      type?: string;
      priority?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<IAlert[]> {
    try {
      const query: any = { user_id: userId };

      if (filters?.read !== undefined) {
        query.read = filters.read;
      }

      if (filters?.type) {
        query.type = filters.type;
      }

      if (filters?.priority) {
        query.priority = filters.priority;
      }

      // Excluir notificaciones expiradas
      query.$or = [
        { expires_at: { $exists: false } },
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ];

      const limit = filters?.limit || 50;
      const skip = filters?.skip || 0;

      const alerts = await this.AlertModel.find(query)
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip);

      return alerts;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      throw new Error('Error interno del servidor al obtener notificaciones');
    }
  }

  /**
   * Marcar notificación como leída
   */
  public async markAsRead(alertId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.AlertModel.updateOne(
        { _id: alertId, user_id: userId },
        { 
          read: true,
          read_at: new Date()
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw new Error('Error interno del servidor al marcar notificación como leída');
    }
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  public async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.AlertModel.updateMany(
        { user_id: userId, read: false },
        { 
          read: true,
          read_at: new Date()
        }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw new Error('Error interno del servidor al marcar notificaciones como leídas');
    }
  }

  /**
   * Eliminar notificación
   */
  public async deleteAlert(alertId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.AlertModel.deleteOne({ _id: alertId, user_id: userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      throw new Error('Error interno del servidor al eliminar notificación');
    }
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  public async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.AlertModel.countDocuments({
        user_id: userId,
        read: false,
        $or: [
          { expires_at: { $exists: false } },
          { expires_at: null },
          { expires_at: { $gt: new Date() } }
        ]
      });

      return count;
    } catch (error) {
      console.error('Error al obtener contador de notificaciones no leídas:', error);
      throw new Error('Error interno del servidor al obtener contador');
    }
  }
}

// Exportar instancia singleton del servicio
export const createAlertService = CreateAlertService.getInstance();

