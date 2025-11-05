import { Request, Response } from 'express';
import { notificationResponseService } from '../../services/backoffi/notificationresponses';

// Controlador para gestionar respuestas de notificaciones
export class NotificationResponseController {
  
  /**
   * Obtener respuestas de notificación de un usuario
   * GET /api/users/notification-responses/:userId
   */
  public async getUserNotificationResponses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { read, limit, skip } = req.query;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      const filters: any = {};
      if (read !== undefined) {
        filters.read = read === 'true' || read === '1';
      }
      if (limit) {
        filters.limit = Number(limit);
      }
      if (skip) {
        filters.skip = Number(skip);
      }

      const responses = await notificationResponseService.getUserNotificationResponses(userId, filters);

      res.status(200).json({
        success: true,
        message: 'Respuestas de notificación obtenidas exitosamente',
        responses: responses,
        total: responses.length
      });

    } catch (error) {
      console.error('Error al obtener respuestas de notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener respuestas de notificación'
      });
    }
  }

  /**
   * Obtener respuestas de una notificación específica (ver quién la leyó)
   * GET /api/users/notification-responses/alert/:alertId
   */
  public async getAlertNotificationResponses(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { read, limit, skip } = req.query;

      if (!alertId) {
        res.status(400).json({
          success: false,
          message: 'ID de notificación es requerido'
        });
        return;
      }

      const filters: any = {};
      if (read !== undefined) {
        filters.read = read === 'true' || read === '1';
      }
      if (limit) {
        filters.limit = Number(limit);
      }
      if (skip) {
        filters.skip = Number(skip);
      }

      const responses = await notificationResponseService.getAlertNotificationResponses(alertId, filters);

      res.status(200).json({
        success: true,
        message: 'Respuestas de notificación obtenidas exitosamente',
        responses: responses,
        total: responses.length
      });

    } catch (error) {
      console.error('Error al obtener respuestas de notificación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener respuestas de notificación'
      });
    }
  }
}

// Exportar instancia del controlador
export const notificationResponseController = new NotificationResponseController();

