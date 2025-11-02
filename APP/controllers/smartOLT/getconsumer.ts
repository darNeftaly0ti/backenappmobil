import { Request, Response } from 'express';
import { smartOLTService } from '../../services/smartOT/getconsumer';

// Controlador para SmartOLT
export class SmartOLTController {
  
  /**
   * Obtener el consumo de un usuario desde SmartOLT usando su ONU_sn
   * El usuario se identifica por su ID que contiene el campo ONU_sn
   */
  public async getConsumption(req: Request, res: Response): Promise<void> {
    try {
      // Obtener el userId de los parámetros de la ruta o del body
      const userId = req.params.userId || req.body.userId;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
        return;
      }

      // Validar formato del ID (debe ser un ObjectId válido de MongoDB o string)
      if (typeof userId !== 'string' || userId.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'ID de usuario inválido'
        });
        return;
      }

      // Consultar el consumo usando el servicio
      const result = await smartOLTService.getConsumptionByUserId(userId.trim());

      if (result.success) {
        // Éxito: retornar los datos de consumo
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        // Error: retornar mensaje de error apropiado
        const statusCode = result.message.includes('no encontrado') 
          ? 404 
          : result.message.includes('no configurada') || result.message.includes('inválida')
          ? 500
          : 400;
        
        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de consumo SmartOLT:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al consultar consumo'
      });
    }
  }

  /**
   * Obtener el consumo directamente por ONU_sn (alternativa)
   * Útil si se quiere consultar directamente sin pasar por el userId
   */
  public async getConsumptionByONU(req: Request, res: Response): Promise<void> {
    try {
      // Obtener el ONU_sn de los parámetros de la ruta o del body
      const onuSn = req.params.onuSn || req.body.onuSn;

      if (!onuSn) {
        res.status(400).json({
          success: false,
          message: 'ONU_sn es requerido'
        });
        return;
      }

      // Validar que el ONU_sn no esté vacío
      if (typeof onuSn !== 'string' || onuSn.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'ONU_sn inválido'
        });
        return;
      }

      // Consultar el consumo directamente por ONU_sn usando el servicio
      const result = await smartOLTService.getConsumptionByONU(onuSn.trim());

      if (result.success) {
        // Éxito: retornar los datos de consumo
        res.status(200).json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        // Error: retornar mensaje de error apropiado
        const statusCode = result.message.includes('no encontrada') 
          ? 404 
          : result.message.includes('no configurada') || result.message.includes('inválida')
          ? 500
          : 400;
        
        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de consumo SmartOLT por ONU:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al consultar consumo'
      });
    }
  }
}

// Exportar instancia del controlador
export const smartOLTController = new SmartOLTController();

