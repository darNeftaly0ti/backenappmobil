import mongoose, { Document, Schema } from 'mongoose';
import { config } from '../configs/config';

// Interface para el log de actividad
export interface IActivityLog extends Document {
  _id: string;
  user_id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  action: string;
  type: string;
  description: string;
  resource_type: 'user' | 'device' | 'network' | 'settings' | 'support' | 'system' | 'auth';
  resource_id?: mongoose.Types.ObjectId;
  ip_address: string;
  user_agent: string;
  session_id?: string;
  timestamp: Date;
  metadata?: {
    old_value?: any;
    new_value?: any;
    additional_info?: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failed' | 'pending';
  created_at: Date;
  updated_at: Date;
}

// Esquema para los logs de actividad
const activityLogSchema = new Schema<IActivityLog>({
  user_id: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID del usuario es requerido'],
    index: true,
    ref: 'User'
  },
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    index: true,
    trim: true,
    maxlength: [50, 'El nombre de usuario no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    index: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Formato de email inválido']
  },
  action: {
    type: String,
    required: [true, 'La acción es requerida'],
    enum: [
      // Autenticación
      'login', 'logout', 'login_failed', 'password_change', 'password_reset',
      // Usuario
      'user_created', 'user_updated', 'user_deleted', 'profile_updated',
      // Dispositivos
      'device_connected', 'device_disconnected', 'device_blocked', 'device_unblocked',
      'device_renamed', 'device_settings_changed',
      // Red
      'wifi_password_changed', 'router_settings_updated', 'network_configured',
      'connection_established', 'connection_lost',
      // Configuración
      'settings_updated', 'preferences_changed', 'notifications_toggled',
      // Soporte
      'ticket_created', 'ticket_updated', 'ticket_closed', 'support_contacted',
      // Sistema
      'system_access', 'permission_granted', 'permission_revoked',
      'data_exported', 'data_imported', 'backup_created'
    ],
    index: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'El tipo de acción es requerido'],
    index: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    trim: true
  },
  resource_type: {
    type: String,
    required: [true, 'El tipo de recurso es requerido'],
    enum: ['user', 'device', 'network', 'settings', 'support', 'system', 'auth'],
    index: true,
    trim: true
  },
  resource_id: {
    type: Schema.Types.ObjectId,
    index: true,
    ref: 'User'
  },
  ip_address: {
    type: String,
    required: [true, 'La dirección IP es requerida'],
    index: true,
    trim: true,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Formato de IP inválido']
  },
  user_agent: {
    type: String,
    required: [true, 'El user agent es requerido'],
    maxlength: [500, 'El user agent no puede exceder 500 caracteres'],
    trim: true
  },
  session_id: {
    type: String,
    index: true,
    trim: true,
    maxlength: [100, 'El session_id no puede exceder 100 caracteres']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    old_value: {
      type: Schema.Types.Mixed,
      default: null
    },
    new_value: {
      type: Schema.Types.Mixed,
      default: null
    },
    additional_info: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success',
    index: true,
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
      if (ret.timestamp) ret.timestamp = new Date(ret.timestamp).toISOString();
      if (ret.created_at) ret.created_at = new Date(ret.created_at).toISOString();
      if (ret.updated_at) ret.updated_at = new Date(ret.updated_at).toISOString();
      return ret;
    }
  }
});

// Índices compuestos para optimizar consultas
activityLogSchema.index({ user_id: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ type: 1, timestamp: -1 });
activityLogSchema.index({ resource_type: 1, timestamp: -1 });
activityLogSchema.index({ severity: 1, timestamp: -1 });
activityLogSchema.index({ status: 1, timestamp: -1 });

// Modelo de logs de actividad
const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema, 'activity_log');

// Clase de servicios para logs de actividad
export class ActivityLogService {
  private static instance: ActivityLogService;

  private constructor() {}

  public static getInstance(): ActivityLogService {
    if (!ActivityLogService.instance) {
      ActivityLogService.instance = new ActivityLogService();
    }
    return ActivityLogService.instance;
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
      console.log('Conectado a MongoDB para logs de actividad');
    } catch (error) {
      console.error('Error al conectar a MongoDB para logs:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo log de actividad
   */
  public async createActivityLog(logData: {
    user_id: string | mongoose.Types.ObjectId;
    username: string;
    email: string;
    action: string;
    type: string;
    description: string;
    resource_type: 'user' | 'device' | 'network' | 'settings' | 'support' | 'system' | 'auth';
    resource_id?: string | mongoose.Types.ObjectId;
    ip_address: string;
    user_agent: string;
    session_id?: string;
    metadata?: {
      old_value?: any;
      new_value?: any;
      additional_info?: any;
    };
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'success' | 'failed' | 'pending';
  }): Promise<IActivityLog> {
    try {
      const activityLog = new ActivityLog({
        ...logData,
        timestamp: new Date()
      });

      const savedLog = await activityLog.save();
      return savedLog;
    } catch (error) {
      console.error('Error al crear log de actividad:', error);
      throw new Error('Error interno del servidor al crear log de actividad');
    }
  }

  /**
   * Obtener logs de actividad por usuario
   */
  public async getActivityLogsByUser(
    userId: string, 
    limit: number = 50, 
    skip: number = 0
  ): Promise<IActivityLog[]> {
    try {
      const logs = await ActivityLog.find({ user_id: userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      return logs;
    } catch (error) {
      console.error('Error al obtener logs por usuario:', error);
      throw new Error('Error interno del servidor al obtener logs');
    }
  }

  /**
   * Obtener logs de actividad por acción
   */
  public async getActivityLogsByAction(
    action: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IActivityLog[]> {
    try {
      const logs = await ActivityLog.find({ action })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      return logs;
    } catch (error) {
      console.error('Error al obtener logs por acción:', error);
      throw new Error('Error interno del servidor al obtener logs');
    }
  }

  /**
   * Obtener logs de actividad por severidad
   */
  public async getActivityLogsBySeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 50,
    skip: number = 0
  ): Promise<IActivityLog[]> {
    try {
      const logs = await ActivityLog.find({ severity })
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      return logs;
    } catch (error) {
      console.error('Error al obtener logs por severidad:', error);
      throw new Error('Error interno del servidor al obtener logs');
    }
  }

  /**
   * Obtener todos los logs de actividad (con filtros opcionales)
   */
  public async getAllActivityLogs(filters: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    severity?: string;
    status?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
    skip?: number;
  } = {}): Promise<IActivityLog[]> {
    try {
      const query: any = {};

      if (filters.user_id) query.user_id = filters.user_id;
      if (filters.action) query.action = filters.action;
      if (filters.resource_type) query.resource_type = filters.resource_type;
      if (filters.severity) query.severity = filters.severity;
      if (filters.status) query.status = filters.status;

      if (filters.start_date || filters.end_date) {
        query.timestamp = {};
        if (filters.start_date) query.timestamp.$gte = filters.start_date;
        if (filters.end_date) query.timestamp.$lte = filters.end_date;
      }

      const limit = filters.limit || 50;
      const skip = filters.skip || 0;

      const logs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      return logs;
    } catch (error) {
      console.error('Error al obtener todos los logs:', error);
      throw new Error('Error interno del servidor al obtener logs');
    }
  }

  /**
   * Obtener estadísticas de actividad
   */
  public async getActivityStats(userId?: string): Promise<{
    total_logs: number;
    logs_by_action: { [key: string]: number };
    logs_by_severity: { [key: string]: number };
    logs_by_status: { [key: string]: number };
    recent_activity: IActivityLog[];
  }> {
    try {
      const query = userId ? { user_id: userId } : {};

      // Total de logs
      const total_logs = await ActivityLog.countDocuments(query);

      // Logs por acción
      const logs_by_action = await ActivityLog.aggregate([
        { $match: query },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Logs por severidad
      const logs_by_severity = await ActivityLog.aggregate([
        { $match: query },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Logs por estado
      const logs_by_status = await ActivityLog.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Actividad reciente (últimas 10)
      const recent_activity = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(10);

      return {
        total_logs,
        logs_by_action: logs_by_action.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        logs_by_severity: logs_by_severity.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        logs_by_status: logs_by_status.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recent_activity
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new Error('Error interno del servidor al obtener estadísticas');
    }
  }

  /**
   * Eliminar logs antiguos (más de X días)
   */
  public async deleteOldLogs(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await ActivityLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error al eliminar logs antiguos:', error);
      throw new Error('Error interno del servidor al eliminar logs antiguos');
    }
  }

  /**
   * Buscar logs por texto (en descripción)
   */
  public async searchActivityLogs(
    searchText: string,
    userId?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<IActivityLog[]> {
    try {
      const query: any = {
        $or: [
          { description: { $regex: searchText, $options: 'i' } },
          { action: { $regex: searchText, $options: 'i' } }
        ]
      };

      if (userId) {
        query.user_id = userId;
      }

      const logs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      return logs;
    } catch (error) {
      console.error('Error al buscar logs:', error);
      throw new Error('Error interno del servidor al buscar logs');
    }
  }
}

// Exportar instancia singleton del servicio
export const activityLogService = ActivityLogService.getInstance();
