import { Request, Response } from 'express';
import { base64PhotoService } from '../../services/smartOT/b64photo';

// Controlador para conversión de imágenes a Base64 de SmartOLT
export class Base64PhotoController {
  
  /**
   * Convertir una imagen del API de SmartOLT a Base64 usando su URL
   * Útil para convertir cualquier imagen del API de SmartOLT a Base64
   */
  public async convertImageToBase64(req: Request, res: Response): Promise<void> {
    try {
      // Obtener la URL de la imagen desde el body o query params
      const imageUrl = req.body.imageUrl || req.query.imageUrl;

      if (!imageUrl) {
        res.status(400).json({
          success: false,
          message: 'URL de imagen es requerida. Envía "imageUrl" en el body o query params.'
        });
        return;
      }

      // Validar que sea un string
      if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'URL de imagen inválida'
        });
        return;
      }

      // Convertir la imagen a Base64 usando el servicio
      const result = await base64PhotoService.convertImageToBase64(imageUrl.trim());

      if (result.success) {
        // Éxito: retornar los datos de la imagen en Base64
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
          : result.message.includes('límite de peticiones')
          ? 403
          : 400;
        
        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de conversión a Base64:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al convertir imagen a Base64'
      });
    }
  }

  /**
   * Convertir gráfico de tráfico de ONU a Base64
   * Construye automáticamente la URL del gráfico usando unique_external_id y graphType
   */
  public async convertTrafficGraphToBase64(req: Request, res: Response): Promise<void> {
    try {
      // Obtener unique_external_id desde parámetros de ruta, body o query
      const uniqueExternalId = req.params.uniqueExternalId || req.body.uniqueExternalId || req.query.uniqueExternalId;

      if (!uniqueExternalId) {
        res.status(400).json({
          success: false,
          message: 'unique_external_id es requerido. Puede enviarse como parámetro de ruta, en el body o query params.'
        });
        return;
      }

      // Validar que sea un string
      if (typeof uniqueExternalId !== 'string' || uniqueExternalId.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'unique_external_id inválido'
        });
        return;
      }

      // Obtener el tipo de gráfico desde query params o body (default: 'daily')
      const graphType = (req.query.graphType || req.body.graphType || 'daily') as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
      
      // Validar que el graphType sea válido
      const validGraphTypes = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
      const finalGraphType = validGraphTypes.includes(graphType) ? graphType : 'daily';

      // Convertir el gráfico de tráfico a Base64 usando el servicio
      const result = await base64PhotoService.convertTrafficGraphToBase64(uniqueExternalId.trim(), finalGraphType);

      if (result.success) {
        // Éxito: retornar los datos de la imagen en Base64
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
          : result.message.includes('límite de peticiones')
          ? 403
          : 400;
        
        res.status(statusCode).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Error en el controlador de conversión de gráfico a Base64:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al convertir gráfico a Base64'
      });
    }
  }
}

// Exportar instancia del controlador
export const base64PhotoController = new Base64PhotoController();

