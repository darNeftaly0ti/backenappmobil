import { Request, Response } from 'express';
import { saveSurveyResponseService, ISaveSurveyResponseData } from '../../services/backoffi/saveresponsies';

// Controlador para guardar y gestionar respuestas de encuestas
export class SaveSurveyResponseController {
  
  /**
   * Método para guardar respuesta de encuesta
   * POST /api/users/survey-responses
   */
  public async saveSurveyResponse(req: Request, res: Response): Promise<void> {
    try {
      // Obtener datos del body
      const responseData: ISaveSurveyResponseData = req.body;

      // Validar que se envíen los datos mínimos requeridos
      if (!responseData.survey_id || !responseData.alert_id || !responseData.user_id || !responseData.answers) {
        res.status(400).json({
          success: false,
          message: 'Campos requeridos faltantes: survey_id, alert_id, user_id, answers'
        });
        return;
      }

      // Validar que answers sea un array no vacío
      if (!Array.isArray(responseData.answers) || responseData.answers.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Las respuestas (answers) deben ser un array no vacío'
        });
        return;
      }

      // Guardar respuesta usando el servicio
      const result = await saveSurveyResponseService.saveSurveyResponse(responseData);

      if (result.success && result.surveyResponse) {
        // Respuesta guardada exitosamente
        res.status(201).json({
          success: true,
          message: result.message,
          surveyResponse: {
            _id: result.surveyResponse._id,
            survey_id: result.surveyResponse.survey_id,
            alert_id: result.surveyResponse.alert_id,
            user_id: result.surveyResponse.user_id,
            answers: result.surveyResponse.answers,
            completed_at: result.surveyResponse.completed_at,
            metadata: result.surveyResponse.metadata,
            created_at: result.surveyResponse.created_at,
            updated_at: result.surveyResponse.updated_at
          }
        });
      } else {
        // Error al guardar respuesta
        let statusCode = 400;
        
        if (result.message.includes('ya respondió')) {
          statusCode = 409; // Conflict
        } else if (result.message.includes('Error interno')) {
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
      console.error('Error en el controlador de guardar respuesta de encuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al guardar respuesta de encuesta'
      });
    }
  }

  /**
   * Método para verificar si un usuario ya respondió una encuesta
   * GET /api/users/survey-responses/:surveyId/check/:userId
   */
  public async checkUserResponse(req: Request, res: Response): Promise<void> {
    try {
      const { surveyId, userId } = req.params;

      if (!surveyId) {
        res.status(400).json({
          success: false,
          message: 'ID de la encuesta es requerido'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID del usuario es requerido'
        });
        return;
      }

      // Verificar si el usuario ya respondió
      const hasResponded = await saveSurveyResponseService.hasUserResponded(surveyId, userId);

      res.status(200).json({
        success: true,
        message: hasResponded ? 'El usuario ya respondió esta encuesta' : 'El usuario no ha respondido esta encuesta',
        has_responded: hasResponded
      });

    } catch (error) {
      console.error('Error al verificar respuesta del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar respuesta'
      });
    }
  }

  /**
   * Método para obtener respuesta de un usuario a una encuesta específica
   * GET /api/users/survey-responses/:surveyId/user/:userId
   */
  public async getSurveyResponseByUser(req: Request, res: Response): Promise<void> {
    try {
      const { surveyId, userId } = req.params;

      if (!surveyId) {
        res.status(400).json({
          success: false,
          message: 'ID de la encuesta es requerido'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID del usuario es requerido'
        });
        return;
      }

      // Obtener respuesta usando el servicio
      const response = await saveSurveyResponseService.getSurveyResponseByUser(surveyId, userId);

      if (response) {
        res.status(200).json({
          success: true,
          message: 'Respuesta de encuesta obtenida exitosamente',
          surveyResponse: {
            _id: response._id,
            survey_id: response.survey_id,
            alert_id: response.alert_id,
            user_id: response.user_id,
            answers: response.answers,
            completed_at: response.completed_at,
            metadata: response.metadata,
            created_at: response.created_at,
            updated_at: response.updated_at
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Respuesta de encuesta no encontrada'
        });
      }

    } catch (error) {
      console.error('Error al obtener respuesta de encuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener respuesta de encuesta'
      });
    }
  }

  /**
   * Método para obtener todas las respuestas de una encuesta
   * GET /api/users/survey-responses/:surveyId
   */
  public async getSurveyResponses(req: Request, res: Response): Promise<void> {
    try {
      const { surveyId } = req.params;

      if (!surveyId) {
        res.status(400).json({
          success: false,
          message: 'ID de la encuesta es requerido'
        });
        return;
      }

      // Obtener filtros de query params
      const { limit, skip } = req.query;

      const filters: any = {};
      
      if (limit) {
        filters.limit = Number(limit);
      }

      if (skip) {
        filters.skip = Number(skip);
      }

      // Obtener respuestas usando el servicio
      const responses = await saveSurveyResponseService.getSurveyResponses(surveyId, filters);

      res.status(200).json({
        success: true,
        message: 'Respuestas de encuesta obtenidas exitosamente',
        surveyResponses: responses.map(response => ({
          _id: response._id,
          survey_id: response.survey_id,
          alert_id: response.alert_id,
          user_id: response.user_id,
          answers: response.answers,
          completed_at: response.completed_at,
          metadata: response.metadata,
          created_at: response.created_at,
          updated_at: response.updated_at
        })),
        total: responses.length,
        filters: filters
      });

    } catch (error) {
      console.error('Error al obtener respuestas de encuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener respuestas de encuesta'
      });
    }
  }

  /**
   * Método para obtener respuestas de un usuario
   * GET /api/users/survey-responses/user/:userId
   */
  public async getUserSurveyResponses(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID del usuario es requerido'
        });
        return;
      }

      // Obtener filtros de query params
      const { limit, skip } = req.query;

      const filters: any = {};
      
      if (limit) {
        filters.limit = Number(limit);
      }

      if (skip) {
        filters.skip = Number(skip);
      }

      // Obtener respuestas usando el servicio
      const responses = await saveSurveyResponseService.getUserSurveyResponses(userId, filters);

      res.status(200).json({
        success: true,
        message: 'Respuestas del usuario obtenidas exitosamente',
        surveyResponses: responses.map(response => ({
          _id: response._id,
          survey_id: response.survey_id,
          alert_id: response.alert_id,
          user_id: response.user_id,
          answers: response.answers,
          completed_at: response.completed_at,
          metadata: response.metadata,
          created_at: response.created_at,
          updated_at: response.updated_at
        })),
        total: responses.length,
        filters: filters
      });

    } catch (error) {
      console.error('Error al obtener respuestas del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener respuestas del usuario'
      });
    }
  }

  /**
   * Método para obtener estadísticas de una encuesta
   * GET /api/users/survey-responses/:surveyId/stats
   */
  public async getSurveyStats(req: Request, res: Response): Promise<void> {
    try {
      const { surveyId } = req.params;

      if (!surveyId) {
        res.status(400).json({
          success: false,
          message: 'ID de la encuesta es requerido'
        });
        return;
      }

      // Obtener estadísticas usando el servicio
      const stats = await saveSurveyResponseService.getSurveyStats(surveyId);

      res.status(200).json({
        success: true,
        message: 'Estadísticas de encuesta obtenidas exitosamente',
        stats: stats
      });

    } catch (error) {
      console.error('Error al obtener estadísticas de encuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas'
      });
    }
  }

  /**
   * Método para eliminar respuesta de encuesta
   * DELETE /api/users/survey-responses/:responseId
   */
  public async deleteSurveyResponse(req: Request, res: Response): Promise<void> {
    try {
      const { responseId } = req.params;
      const { userId } = req.body;

      if (!responseId) {
        res.status(400).json({
          success: false,
          message: 'ID de la respuesta es requerido'
        });
        return;
      }

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'ID del usuario es requerido'
        });
        return;
      }

      // Eliminar respuesta usando el servicio
      const success = await saveSurveyResponseService.deleteSurveyResponse(responseId, userId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Respuesta de encuesta eliminada exitosamente'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Respuesta de encuesta no encontrada'
        });
      }

    } catch (error) {
      console.error('Error al eliminar respuesta de encuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar respuesta de encuesta'
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
        message: 'Controlador de respuestas de encuestas funcionando correctamente',
        timestamp: new Date().toISOString(),
        controller: 'SaveSurveyResponseController',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('Error en health check:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el controlador de respuestas de encuestas'
      });
    }
  }
}

// Exportar instancia del controlador
export const saveSurveyResponseController = new SaveSurveyResponseController();

