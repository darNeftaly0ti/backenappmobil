import { Request, Response } from 'express';
import { createAlertService, ICreateAlertData } from '../../services/backoffi/cretealert';
import { notificationResponseService } from '../../services/backoffi/notificationresponses';

// Controlador para creación y gestión de notificaciones/alertas
export class CreateAlertController {
  
  /**
   * Método para crear una nueva notificación
   * POST /api/users/alerts o POST /api/alerts/create
   */
  public async createAlert(req: Request, res: Response): Promise<void> {
    try {
      // Obtener datos del body
      const alertData: ICreateAlertData = req.body;

      // Validar que se envíen los datos mínimos requeridos
      if (!alertData.type || !alertData.title || !alertData.message) {
        res.status(400).json({
          success: false,
          message: 'Campos requeridos faltantes: type, title, message'
        });
        return;
      }

      // Validar que se especifique al menos un destinatario
      if (!alertData.user_id && !alertData.user_ids && !alertData.send_to_all) {
        res.status(400).json({
          success: false,
          message: 'Debe especificar al menos un destinatario: user_id, user_ids, o send_to_all'
        });
        return;
      }

      // Crear notificación usando el servicio
      const result = await createAlertService.createAlert(alertData);

      if (result.success) {
        // Notificación(es) creada(s) exitosamente
        const responseData: any = {
          success: true,
          message: result.message,
          total_created: result.total_created || (result.alert ? 1 : (result.alerts ? result.alerts.length : 0))
        };

        // Si es un solo usuario, retornar 'alert'
        if (result.alert) {
          responseData.alert = {
            _id: result.alert._id,
            user_id: result.alert.user_id,
            type: result.alert.type,
            title: result.alert.title,
            message: result.alert.message,
            priority: result.alert.priority,
            category: result.alert.category,
            data: result.alert.data,
            icon: result.alert.icon,
            color: result.alert.color,
            image_url: result.alert.image_url,
            action_button: result.alert.action_button,
            expires_at: result.alert.expires_at,
            metadata: result.alert.metadata,
            created_at: result.alert.created_at,
            updated_at: result.alert.updated_at
          };
        }
        // Si son múltiples usuarios, retornar 'alerts'
        else if (result.alerts && result.alerts.length > 0) {
          responseData.alerts = result.alerts.map((alert: any) => ({
            _id: alert._id,
            user_id: alert.user_id,
            type: alert.type,
            title: alert.title,
            message: alert.message,
            priority: alert.priority,
            category: alert.category,
            data: alert.data,
            icon: alert.icon,
            color: alert.color,
            image_url: alert.image_url,
            action_button: alert.action_button,
            expires_at: alert.expires_at,
            metadata: alert.metadata,
            created_at: alert.created_at,
            updated_at: alert.updated_at
          }));
        }

        res.status(201).json(responseData);
      } else {
        // Error al crear notificación
        let statusCode = 400;
        
        if (result.message.includes('Error interno')) {
          statusCode = 500;
        } else if (result.message.includes('Error de validación')) {
          statusCode = 422; // Unprocessable Entity
        }

        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de creación de notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear notificación'
      });
    }
  }

  /**
   * Método para obtener notificaciones de un usuario
   * GET /api/users/alerts/:userId
   */
  public async getUserAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // Obtener filtros de query params
      const { read, type, priority, limit, skip } = req.query;

      const filters: any = {};
      
      if (read !== undefined) {
        filters.read = read === 'true' || read === '1';
      }

      if (type) {
        filters.type = type;
      }

      if (priority) {
        filters.priority = priority;
      }

      if (limit) {
        filters.limit = Number(limit);
      }

      if (skip) {
        filters.skip = Number(skip);
      }

      // Obtener notificaciones usando el servicio
      const alerts = await createAlertService.getUserAlerts(userId, filters);

      // Obtener estados de lectura desde notification_responses
      const alertIds = alerts.map(alert => alert._id.toString());
      const responses = await notificationResponseService.getUserNotificationResponses(userId, {
        limit: 1000
      });

      // Crear mapa de estados de lectura
      const responseMap = new Map();
      responses.forEach(response => {
        responseMap.set(response.alert_id.toString(), {
          read: response.read,
          read_at: response.read_at
        });
      });

      // Agregar estado de lectura a cada notificación
      const alertsWithReadStatus = alerts.map(alert => {
        const readStatus = responseMap.get(alert._id.toString()) || { read: false, read_at: null };
        return {
          ...alert.toObject(),
          read: readStatus.read,
          read_at: readStatus.read_at
        };
      });

      res.status(200).json({
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        alerts: alertsWithReadStatus,
        total: alertsWithReadStatus.length,
        filters: filters
      });

    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener notificaciones'
      });
    }
  }

  /**
   * Método para marcar una notificación como leída
   * PATCH /api/users/alerts/:alertId/mark-read
   * PUT /api/users/alerts/:alertId/read
   */
  public async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { userId } = req.body;

      if (!alertId) {
        res.status(400).json({
          success: false,
          message: 'ID de notificación es requerido'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // Marcar como leída usando el servicio
      const success = await createAlertService.markAsRead(alertId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notificación marcada como leída exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notificación no encontrada o ya estaba marcada como leída'
        });
      }

    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al marcar notificación como leída'
      });
    }
  }

  /**
   * Método para marcar todas las notificaciones de un usuario como leídas
   * PATCH /api/users/alerts/mark-all-read
   * PUT /api/users/alerts/mark-all-read
   */
  public async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // Marcar todas como leídas usando el servicio
      const count = await createAlertService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'Notificaciones marcadas como leídas exitosamente',
        count: count
      });

    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al marcar notificaciones como leídas'
      });
    }
  }

  /**
   * Método para eliminar una notificación
   * DELETE /api/users/alerts/:alertId
   */
  public async deleteAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { userId } = req.body;

      if (!alertId) {
        res.status(400).json({
          success: false,
          message: 'ID de notificación es requerido'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // Eliminar notificación usando el servicio
      const success = await createAlertService.deleteAlert(alertId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Notificación eliminada exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notificación no encontrada'
        });
      }

    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar notificación'
      });
    }
  }

  /**
   * Método para obtener contador de notificaciones no leídas
   * GET /api/users/alerts/:userId/unread-count
   */
  public async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // Obtener contador usando el servicio
      const count = await createAlertService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        message: 'Contador de notificaciones no leídas obtenido exitosamente',
        unread_count: count
      });

    } catch (error) {
      console.error('Error al obtener contador de notificaciones no leídas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener contador'
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
        message: 'Controlador de notificaciones funcionando correctamente',
        timestamp: new Date().toISOString(),
        controller: 'CreateAlertController',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el controlador de notificaciones'
      });
    }
  }
}

// Exportar instancia del controlador
export const createAlertController = new CreateAlertController();

