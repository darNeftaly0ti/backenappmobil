import { Request, Response } from 'express';
import { activityLogService, IActivityLog } from '../services/activity_logs';

// Controlador de logs de actividad
export class ActivityLogController {
  
  /**
   * Crear un nuevo log de actividad
   */
  public async createActivityLog(req: Request, res: Response): Promise<void> {
    try {
      const {
        user_id,
        username,
        email,
        action,
        type,
        description,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        session_id,
        metadata,
        severity,
        status
      } = req.body;

      // Validar campos requeridos
      if (!user_id || !username || !email || !action || !type || !description || !resource_type || !ip_address || !user_agent) {
        res.status(400).json({
          success: false,
          message: 'Campos requeridos: user_id, username, email, action, type, description, resource_type, ip_address, user_agent'
        });
        return;
      }

      // Validar que la acción sea válida
      const validActions = [
        'login', 'logout', 'login_failed', 'password_change', 'password_reset',
        'user_created', 'user_updated', 'user_deleted', 'profile_updated',
        'device_connected', 'device_disconnected', 'device_blocked', 'device_unblocked',
        'device_renamed', 'device_settings_changed',
        'wifi_password_changed', 'router_settings_updated', 'network_configured',
        'connection_established', 'connection_lost',
        'settings_updated', 'preferences_changed', 'notifications_toggled',
        'ticket_created', 'ticket_updated', 'ticket_closed', 'support_contacted',
        'system_access', 'permission_granted', 'permission_revoked',
        'data_exported', 'data_imported', 'backup_created'
      ];

      if (!validActions.includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Acción no válida. Acciones permitidas: ' + validActions.join(', ')
        });
        return;
      }

      // Validar que el tipo de recurso sea válido
      const validResourceTypes = ['user', 'device', 'network', 'settings', 'support', 'system', 'auth'];
      if (!validResourceTypes.includes(resource_type)) {
        res.status(400).json({
          success: false,
          message: 'Tipo de recurso no válido. Tipos permitidos: ' + validResourceTypes.join(', ')
        });
        return;
      }

      // El campo type ahora acepta cualquier valor

      // Crear el log de actividad
      const activityLog = await activityLogService.createActivityLog({
        user_id,
        username,
        email,
        action,
        type,
        description,
        resource_type,
        resource_id,
        ip_address,
        user_agent,
        session_id,
        metadata,
        severity: severity || 'low',
        status: status || 'success'
      });

      res.status(201).json({
        success: true,
        message: 'Log de actividad creado exitosamente',
        data: activityLog
      });

    } catch (error) {
      console.error('Error en el controlador de crear log:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear log de actividad'
      });
    }
  }

  /**
   * Obtener logs de actividad por usuario
   */
  public async getActivityLogsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit, skip } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // Validar y convertir límites (sin límite máximo hardcodeado)
      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const skipNum = skip ? parseInt(skip as string, 10) : 0;

      // Validar que los valores sean números válidos
      if (isNaN(limitNum) || limitNum < 0) {
        res.status(400).json({
          success: false,
          message: 'El parámetro limit debe ser un número válido mayor o igual a 0'
        });
        return;
      }

      if (isNaN(skipNum) || skipNum < 0) {
        res.status(400).json({
          success: false,
          message: 'El parámetro skip debe ser un número válido mayor o igual a 0'
        });
        return;
      }

      const logs = await activityLogService.getActivityLogsByUser(
        userId,
        limitNum,
        skipNum
      );

      res.status(200).json({
        success: true,
        message: 'Logs de actividad obtenidos exitosamente',
        data: logs,
        total: logs.length,
        limit: limitNum,
        skip: skipNum
      });

    } catch (error) {
      console.error('Error al obtener logs por usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener logs'
      });
    }
  }

  /**
   * Obtener logs de actividad por acción
   */
  public async getActivityLogsByAction(req: Request, res: Response): Promise<void> {
    try {
      const { action } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      if (!action) {
        res.status(400).json({
          success: false,
          message: 'Acción es requerida'
        });
        return;
      }

      const logs = await activityLogService.getActivityLogsByAction(
        action,
        Number(limit),
        Number(skip)
      );

      res.status(200).json({
        success: true,
        message: `Logs de actividad para la acción '${action}' obtenidos exitosamente`,
        data: logs,
        total: logs.length,
        limit: Number(limit),
        skip: Number(skip)
      });

    } catch (error) {
      console.error('Error al obtener logs por acción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener logs'
      });
    }
  }

  /**
   * Obtener logs de actividad por severidad
   */
  public async getActivityLogsBySeverity(req: Request, res: Response): Promise<void> {
    try {
      const { severity } = req.params;
      const { limit = 50, skip = 0 } = req.query;

      if (!severity) {
        res.status(400).json({
          success: false,
          message: 'Severidad es requerida'
        });
        return;
      }

      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(severity)) {
        res.status(400).json({
          success: false,
          message: 'Severidad no válida. Valores permitidos: ' + validSeverities.join(', ')
        });
        return;
      }

      const logs = await activityLogService.getActivityLogsBySeverity(
        severity as 'low' | 'medium' | 'high' | 'critical',
        Number(limit),
        Number(skip)
      );

      res.status(200).json({
        success: true,
        message: `Logs de actividad para severidad '${severity}' obtenidos exitosamente`,
        data: logs,
        total: logs.length,
        limit: Number(limit),
        skip: Number(skip)
      });

    } catch (error) {
      console.error('Error al obtener logs por severidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener logs'
      });
    }
  }

  /**
   * Obtener todos los logs de actividad con filtros
   */
  public async getAllActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        user_id,
        action,
        resource_type,
        severity,
        status,
        start_date,
        end_date,
        limit,
        skip
      } = req.query;

      // Construir filtros
      const filters: any = {};
      
      if (user_id) filters.user_id = user_id;
      if (action) filters.action = action;
      if (resource_type) filters.resource_type = resource_type;
      if (severity) filters.severity = severity;
      if (status) filters.status = status;
      if (start_date) filters.start_date = new Date(start_date as string);
      if (end_date) filters.end_date = new Date(end_date as string);
      
      // Validar y convertir límites (sin límite máximo hardcodeado)
      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const skipNum = skip ? parseInt(skip as string, 10) : 0;

      // Validar que los valores sean números válidos
      if (limit && (isNaN(limitNum) || limitNum < 0)) {
        res.status(400).json({
          success: false,
          message: 'El parámetro limit debe ser un número válido mayor o igual a 0'
        });
        return;
      }

      if (skip && (isNaN(skipNum) || skipNum < 0)) {
        res.status(400).json({
          success: false,
          message: 'El parámetro skip debe ser un número válido mayor o igual a 0'
        });
        return;
      }

      filters.limit = limitNum;
      filters.skip = skipNum;

      const logs = await activityLogService.getAllActivityLogs(filters);

      res.status(200).json({
        success: true,
        message: 'Logs de actividad obtenidos exitosamente',
        data: logs,
        total: logs.length,
        filters: filters,
        limit: limitNum,
        skip: skipNum
      });

    } catch (error) {
      console.error('Error al obtener todos los logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener logs'
      });
    }
  }

  /**
   * Obtener estadísticas de actividad
   */
  public async getActivityStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;

      const stats = await activityLogService.getActivityStats(userId as string);

      res.status(200).json({
        success: true,
        message: 'Estadísticas de actividad obtenidas exitosamente',
        data: stats
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas'
      });
    }
  }

  /**
   * Buscar logs por texto
   */
  public async searchActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { searchText } = req.params;
      const { userId, limit = 50, skip = 0 } = req.query;

      if (!searchText) {
        res.status(400).json({
          success: false,
          message: 'Texto de búsqueda es requerido'
        });
        return;
      }

      const logs = await activityLogService.searchActivityLogs(
        searchText,
        userId as string,
        Number(limit),
        Number(skip)
      );

      res.status(200).json({
        success: true,
        message: `Búsqueda de logs con texto '${searchText}' completada exitosamente`,
        data: logs,
        total: logs.length,
        searchText: searchText,
        limit: Number(limit),
        skip: Number(skip)
      });

    } catch (error) {
      console.error('Error al buscar logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al buscar logs'
      });
    }
  }

  /**
   * Eliminar logs antiguos
   */
  public async deleteOldLogs(req: Request, res: Response): Promise<void> {
    try {
      const { daysOld = 90 } = req.body;

      if (daysOld < 1) {
        res.status(400).json({
          success: false,
          message: 'El número de días debe ser mayor a 0'
        });
        return;
      }

      const deletedCount = await activityLogService.deleteOldLogs(Number(daysOld));

      res.status(200).json({
        success: true,
        message: `Logs antiguos eliminados exitosamente`,
        data: {
          deletedCount: deletedCount,
          daysOld: Number(daysOld)
        }
      });

    } catch (error) {
      console.error('Error al eliminar logs antiguos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar logs antiguos'
      });
    }
  }

  /**
   * Obtener un log específico por ID
   */
  public async getActivityLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID del log es requerido'
        });
        return;
      }

      // Buscar el log por ID usando el servicio
      const logs = await activityLogService.getAllActivityLogs({
        limit: 1,
        skip: 0
      });

      const log = logs.find(l => l._id.toString() === id);

      if (!log) {
        res.status(404).json({
          success: false,
          message: 'Log de actividad no encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Log de actividad obtenido exitosamente',
        data: log
      });

    } catch (error) {
      console.error('Error al obtener log por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener log'
      });
    }
  }

  /**
   * Obtener logs en tiempo real (más recientes)
   * GET /api/users/activity-logs/recent
   * Query Parameters:
   *   - since (opcional): ISO timestamp - Obtener logs más recientes que este timestamp
   *   - last_id (opcional): ObjectId - Obtener logs más recientes que este ID
   *   - user_id (opcional): ID de usuario para filtrar
   *   - limit (opcional): Número máximo de logs (por defecto: 100)
   */
  public async getRecentActivityLogs(req: Request, res: Response): Promise<void> {
    try {
      const { since, last_id, user_id, limit } = req.query;

      // Validar y convertir límite
      const limitNum = limit ? parseInt(limit as string, 10) : 100;
      
      if (limit && (isNaN(limitNum) || limitNum < 0 || limitNum > 1000)) {
        res.status(400).json({
          success: false,
          message: 'El parámetro limit debe ser un número válido entre 0 y 1000'
        });
        return;
      }

      // Validar que solo se proporcione uno: since o last_id
      if (since && last_id) {
        res.status(400).json({
          success: false,
          message: 'Solo se puede proporcionar "since" o "last_id", no ambos'
        });
        return;
      }

      // Convertir parámetros
      const sinceDate = since ? (since instanceof Date ? since : new Date(since as string)) : undefined;
      const lastId = last_id ? (last_id as string) : undefined;
      const userId = user_id ? (user_id as string) : undefined;

      // Validar formato de fecha si se proporciona since
      if (since && sinceDate && isNaN(sinceDate.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use ISO timestamp (ej: 2025-01-15T10:30:00.000Z)'
        });
        return;
      }

      // Obtener logs recientes usando el servicio
      const logs = await activityLogService.getRecentActivityLogs(
        sinceDate,
        lastId,
        userId,
        limitNum
      );

      res.status(200).json({
        success: true,
        message: 'Logs recientes obtenidos exitosamente',
        data: logs,
        total: logs.length,
        limit: limitNum,
        filters: {
          since: since ? sinceDate?.toISOString() : undefined,
          last_id: lastId,
          user_id: userId
        }
      });

    } catch (error) {
      console.error('Error al obtener logs recientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener logs recientes'
      });
    }
  }

  /**
   * Health check del controlador
   */
  public async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Controlador de logs de actividad funcionando correctamente',
        timestamp: new Date().toISOString(),
        controller: 'ActivityLogController',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el controlador de logs de actividad'
      });
    }
  }
}

// Exportar instancia del controlador
export const activityLogController = new ActivityLogController();
