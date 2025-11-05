import mongoose, { Document, Schema } from 'mongoose';
import { config } from '../../configs/config';

// Interface para la respuesta de notificación (estado de lectura)
export interface INotificationResponse extends Document {
  _id: string;
  alert_id: mongoose.Types.ObjectId; // Referencia a la notificación en surveys
  user_id: mongoose.Types.ObjectId; // Referencia al usuario
  read: boolean; // Estado de lectura
  read_at?: Date; // Fecha/hora de lectura
  created_at: Date;
  updated_at: Date;
}

// Interface para los datos de crear/actualizar respuesta de notificación
export interface INotificationResponseData {
  alert_id: string | mongoose.Types.ObjectId; // ID de la notificación
  user_id: string | mongoose.Types.ObjectId; // ID del usuario
  read?: boolean; // Estado de lectura (default: false)
  read_at?: Date; // Fecha/hora de lectura
}

// Interface para el resultado de guardar respuesta de notificación
export interface INotificationResponseResult {
  success: boolean;
  notificationResponse?: INotificationResponse;
  message: string;
  error?: any;
}

// Esquema de respuesta de notificación
const notificationResponseSchema = new Schema<INotificationResponse>({
  alert_id: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID de la notificación es requerido'],
    index: true,
    ref: 'Alert' // Referencia a la colección surveys (donde están las notificaciones)
  },
  user_id: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID del usuario es requerido'],
    index: true,
    ref: 'User'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  read_at: {
    type: Date,
    index: true
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
      return ret;
    }
  }
});

// Índices para optimizar consultas
notificationResponseSchema.index({ alert_id: 1, user_id: 1 }, { unique: true }); // Evitar duplicados
notificationResponseSchema.index({ user_id: 1, read: 1, created_at: -1 }); // Para consultas por usuario
notificationResponseSchema.index({ alert_id: 1, read: 1 }); // Para consultas por notificación
notificationResponseSchema.index({ user_id: 1, read: 1 }); // Para contar no leídas

// Modelo de respuesta de notificación
const NotificationResponse = mongoose.model<INotificationResponse>(
  'NotificationResponse',
  notificationResponseSchema,
  'notification_responses'
);

// Clase de servicio para gestionar respuestas de notificaciones
export class NotificationResponseService {
  private static instance: NotificationResponseService;
  private configData: ReturnType<typeof config>;
  private NotificationResponseModel: mongoose.Model<INotificationResponse>;

  private constructor() {
    this.configData = config();
    this.NotificationResponseModel = mongoose.model<INotificationResponse>('NotificationResponse');
  }

  public static getInstance(): NotificationResponseService {
    if (!NotificationResponseService.instance) {
      NotificationResponseService.instance = new NotificationResponseService();
    }
    return NotificationResponseService.instance;
  }

  /**
   * Marcar notificación como leída (crear o actualizar)
   */
  public async markAsRead(alertId: string, userId: string): Promise<boolean> {
    try {
      const now = new Date();
      const result = await this.NotificationResponseModel.findOneAndUpdate(
        { alert_id: alertId, user_id: userId },
        {
          read: true,
          read_at: now,
          updated_at: now
        },
        {
          upsert: true, // Crear si no existe
          new: true // Retornar el documento actualizado
        }
      );

      return !!result;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw new Error('Error interno del servidor al marcar notificación como leída');
    }
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   */
  public async markAllAsRead(userId: string, alertIds?: string[]): Promise<number> {
    try {
      const now = new Date();
      const query: any = { user_id: userId, read: false };
      
      // Si se especifican alertIds, solo marcar esas notificaciones
      if (alertIds && alertIds.length > 0) {
        query.alert_id = { $in: alertIds };
      }

      const result = await this.NotificationResponseModel.updateMany(
        query,
        {
          read: true,
          read_at: now,
          updated_at: now
        }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw new Error('Error interno del servidor al marcar todas las notificaciones como leídas');
    }
  }

  /**
   * Crear registro de respuesta de notificación (cuando se crea la notificación)
   * Esto crea el registro inicial con read: false
   */
  public async createNotificationResponse(alertId: string, userId: string): Promise<INotificationResponse> {
    try {
      const response = new this.NotificationResponseModel({
        alert_id: alertId,
        user_id: userId,
        read: false
      });

      const savedResponse = await response.save();
      return savedResponse;
    } catch (error: any) {
      // Si ya existe (duplicado), retornar el existente
      if (error.code === 11000) {
        const existing = await this.NotificationResponseModel.findOne({
          alert_id: alertId,
          user_id: userId
        });
        if (existing) {
          return existing;
        }
      }
      console.error('Error al crear respuesta de notificación:', error);
      throw new Error('Error interno del servidor al crear respuesta de notificación');
    }
  }

  /**
   * Crear múltiples registros de respuesta de notificación (para múltiples usuarios)
   */
  public async createNotificationResponses(alertId: string, userIds: string[]): Promise<INotificationResponse[]> {
    try {
      const responsesToCreate = userIds.map(userId => ({
        alert_id: alertId,
        user_id: userId,
        read: false
      }));

      // Insertar todas las respuestas de una vez (ignorar duplicados)
      const savedResponses = await this.NotificationResponseModel.insertMany(
        responsesToCreate,
        { ordered: false } // Continuar aunque haya duplicados
      );

      return savedResponses;
    } catch (error: any) {
      // Si hay duplicados, obtener los existentes
      if (error.code === 11000) {
        const existing = await this.NotificationResponseModel.find({
          alert_id: alertId,
          user_id: { $in: userIds }
        });
        return existing;
      }
      console.error('Error al crear respuestas de notificación:', error);
      throw new Error('Error interno del servidor al crear respuestas de notificación');
    }
  }

  /**
   * Obtener estado de lectura de una notificación para un usuario
   */
  public async getNotificationResponse(alertId: string, userId: string): Promise<INotificationResponse | null> {
    try {
      const response = await this.NotificationResponseModel.findOne({
        alert_id: alertId,
        user_id: userId
      });

      return response;
    } catch (error) {
      console.error('Error al obtener respuesta de notificación:', error);
      throw new Error('Error interno del servidor al obtener respuesta de notificación');
    }
  }

  /**
   * Obtener todas las respuestas de notificación de un usuario
   */
  public async getUserNotificationResponses(
    userId: string,
    filters?: {
      read?: boolean;
      limit?: number;
      skip?: number;
    }
  ): Promise<INotificationResponse[]> {
    try {
      const query: any = { user_id: userId };

      if (filters?.read !== undefined) {
        query.read = filters.read;
      }

      const limit = filters?.limit || 50;
      const skip = filters?.skip || 0;

      const responses = await this.NotificationResponseModel.find(query)
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)
        .populate('alert_id', 'title message type priority');

      return responses;
    } catch (error) {
      console.error('Error al obtener respuestas de notificación del usuario:', error);
      throw new Error('Error interno del servidor al obtener respuestas de notificación');
    }
  }

  /**
   * Obtener todas las respuestas de una notificación (para ver quién la leyó)
   */
  public async getAlertNotificationResponses(
    alertId: string,
    filters?: {
      read?: boolean;
      limit?: number;
      skip?: number;
    }
  ): Promise<INotificationResponse[]> {
    try {
      const query: any = { alert_id: alertId };

      if (filters?.read !== undefined) {
        query.read = filters.read;
      }

      const limit = filters?.limit || 50;
      const skip = filters?.skip || 0;

      const responses = await this.NotificationResponseModel.find(query)
        .sort({ read_at: -1, created_at: -1 })
        .limit(limit)
        .skip(skip)
        .populate('user_id', 'username first_name last_name email');

      return responses;
    } catch (error) {
      console.error('Error al obtener respuestas de notificación:', error);
      throw new Error('Error interno del servidor al obtener respuestas de notificación');
    }
  }

  /**
   * Obtener contador de notificaciones no leídas de un usuario
   */
  public async getUnreadCount(userId: string, alertIds?: string[]): Promise<number> {
    try {
      const query: any = {
        user_id: userId,
        read: false
      };

      // Si se especifican alertIds, solo contar esas notificaciones
      if (alertIds && alertIds.length > 0) {
        query.alert_id = { $in: alertIds };
      }

      const count = await this.NotificationResponseModel.countDocuments(query);
      return count;
    } catch (error) {
      console.error('Error al obtener contador de notificaciones no leídas:', error);
      throw new Error('Error interno del servidor al obtener contador');
    }
  }

  /**
   * Obtener estadísticas de lectura de una notificación
   */
  public async getAlertReadStats(alertId: string): Promise<{
    total_sent: number; // Total de usuarios que recibieron la notificación
    total_read: number; // Total de usuarios que la leyeron
    total_unread: number; // Total de usuarios que no la han leído
    read_rate: number; // Porcentaje de lectura (0-100)
  }> {
    try {
      const totalSent = await this.NotificationResponseModel.countDocuments({ alert_id: alertId });
      const totalRead = await this.NotificationResponseModel.countDocuments({
        alert_id: alertId,
        read: true
      });
      const totalUnread = totalSent - totalRead;
      const readRate = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

      return {
        total_sent: totalSent,
        total_read: totalRead,
        total_unread: totalUnread,
        read_rate: Math.round(readRate * 100) / 100 // Redondear a 2 decimales
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de lectura:', error);
      throw new Error('Error interno del servidor al obtener estadísticas');
    }
  }

  /**
   * Eliminar respuesta de notificación
   */
  public async deleteNotificationResponse(alertId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.NotificationResponseModel.deleteOne({
        alert_id: alertId,
        user_id: userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar respuesta de notificación:', error);
      throw new Error('Error interno del servidor al eliminar respuesta de notificación');
    }
  }
}

// Exportar instancia singleton del servicio
export const notificationResponseService = NotificationResponseService.getInstance();

