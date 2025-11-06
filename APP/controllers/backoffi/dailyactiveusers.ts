import { Request, Response } from 'express';
import { dailyActiveUsersService } from '../../services/backoffi/dailyactiveusers';

// Controlador para Daily Active Users (DAU)
export class DailyActiveUsersController {
  
  /**
   * Método para obtener usuarios activos diarios
   * GET /api/users/activity-logs/daily-active-users
   * Query Parameters:
   *   - start_date (opcional): YYYY-MM-DD - Fecha de inicio
   *   - end_date (opcional): YYYY-MM-DD - Fecha de fin
   *   - group_by (opcional): "day" | "week" | "month" - Agrupar por período (por ahora solo "day")
   */
  public async getDailyActiveUsers(req: Request, res: Response): Promise<void> {
    try {
      // Obtener parámetros de query
      const { start_date, end_date, group_by } = req.query;

      // Validar formato de fechas si se proporcionan
      if (start_date && typeof start_date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
        res.status(400).json({
          success: false,
          message: 'Formato de fecha de inicio inválido. Use YYYY-MM-DD'
        });
        return;
      }

      if (end_date && typeof end_date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
        res.status(400).json({
          success: false,
          message: 'Formato de fecha de fin inválido. Use YYYY-MM-DD'
        });
        return;
      }

      // Validar group_by si se proporciona
      if (group_by && group_by !== 'day' && group_by !== 'week' && group_by !== 'month') {
        res.status(400).json({
          success: false,
          message: 'Valor de group_by inválido. Valores permitidos: "day", "week", "month"'
        });
        return;
      }

      // Convertir fechas a Date o string según corresponda
      const startDate = start_date ? (typeof start_date === 'string' ? start_date : undefined) : undefined;
      const endDate = end_date ? (typeof end_date === 'string' ? end_date : undefined) : undefined;
      const groupBy = (group_by as 'day' | 'week' | 'month') || 'day';

      // Obtener usuarios activos diarios usando el servicio
      const result = await dailyActiveUsersService.getDailyActiveUsers(
        startDate,
        endDate,
        groupBy
      );

      // Retornar respuesta exitosa
      res.status(200).json(result);

    } catch (error: any) {
      console.error('Error en el controlador de usuarios activos diarios:', error);
      
      // Determinar código de estado apropiado según el tipo de error
      let statusCode = 500;
      let message = 'Error interno del servidor al obtener usuarios activos diarios';

      if (error.message && error.message.includes('fecha')) {
        statusCode = 400;
        message = error.message;
      } else if (error.message && error.message.includes('requerido')) {
        statusCode = 400;
        message = error.message;
      }

      res.status(statusCode).json({
        success: false,
        message: message
      });
    }
  }

  /**
   * Método para obtener detalles de usuarios activos para una fecha específica
   * GET /api/users/activity-logs/daily-active-users/detailed
   * Query Parameters:
   *   - date (requerido): YYYY-MM-DD - Fecha específica
   *   - include_user_details (opcional): boolean - Incluir detalles de usuarios (default: true)
   */
  public async getDailyActiveUsersDetailed(req: Request, res: Response): Promise<void> {
    try {
      // Obtener parámetros de query
      const { date, include_user_details } = req.query;

      // Validar que se proporcione la fecha
      if (!date) {
        res.status(400).json({
          success: false,
          message: 'El parámetro "date" es requerido. Use el formato YYYY-MM-DD'
        });
        return;
      }

      // Validar formato de fecha
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use YYYY-MM-DD'
        });
        return;
      }

      // Validar que include_user_details sea boolean si se proporciona
      let includeUserDetails = true; // Por defecto incluir detalles
      if (include_user_details !== undefined) {
        if (include_user_details === 'true' || include_user_details === '1') {
          includeUserDetails = true;
        } else if (include_user_details === 'false' || include_user_details === '0') {
          includeUserDetails = false;
        } else {
          res.status(400).json({
            success: false,
            message: 'El parámetro include_user_details debe ser "true" o "false"'
          });
          return;
        }
      }

      // Obtener detalles de usuarios activos usando el servicio
      const result = await dailyActiveUsersService.getDailyActiveUsersDetailed(
        date,
        includeUserDetails
      );

      // Retornar respuesta exitosa
      res.status(200).json(result);

    } catch (error: any) {
      console.error('Error en el controlador de detalles de usuarios activos:', error);
      
      // Determinar código de estado apropiado según el tipo de error
      let statusCode = 500;
      let message = 'Error interno del servidor al obtener detalles de usuarios activos';

      if (error.message && error.message.includes('fecha')) {
        statusCode = 400;
        message = error.message;
      } else if (error.message && error.message.includes('requerido')) {
        statusCode = 400;
        message = error.message;
      }

      res.status(statusCode).json({
        success: false,
        message: message
      });
    }
  }

  /**
   * Health check del controlador
   * GET /api/users/activity-logs/daily-active-users/health
   */
  public async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Controlador de usuarios activos diarios funcionando correctamente',
        timestamp: new Date().toISOString(),
        controller: 'DailyActiveUsersController',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el controlador de usuarios activos diarios'
      });
    }
  }
}

// Exportar instancia del controlador
export const dailyActiveUsersController = new DailyActiveUsersController();

