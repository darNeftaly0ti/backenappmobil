import { Request, Response } from 'express';
import { createAlertService, ICreateAlertData } from '../../services/backoffi/cretealert';

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
      if (!alertData.user_id || !alertData.type || !alertData.title || !alertData.message) {
        res.status(400).json({
          success: false,
          message: 'Campos requeridos faltantes: user_id, type, title, message'
        });
        return;
      }

      // Crear notificación usando el servicio
      const result = await createAlertService.createAlert(alertData);

      if (result.success && result.alert) {
        // Notificación creada exitosamente
        res.status(201).json({
          success: true,
          message: result.message,
          alert: {
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
            read: result.alert.read,
            read_at: result.alert.read_at,
            metadata: result.alert.metadata,
            created_at: result.alert.created_at,
            updated_at: result.alert.updated_at
          }
        });
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

      res.status(200).json({
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        alerts: alerts,
        total: alerts.length,
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

