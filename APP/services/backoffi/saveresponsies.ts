import mongoose, { Document, Schema } from 'mongoose';
import { config } from '../../configs/config';

// Interface para una respuesta individual a una pregunta
export interface IAnswer {
  question_id?: string; // ID de la pregunta (opcional, puede ser el índice)
  question: string; // Texto de la pregunta
  answer: string | number | boolean | string[]; // Respuesta del usuario
  question_type: 'multiple_choice' | 'text' | 'rating' | 'yes_no'; // Tipo de pregunta
}

// Interface para los datos de guardar respuesta de encuesta
export interface ISaveSurveyResponseData {
  // Campos requeridos
  survey_id: string; // ID de la encuesta (del campo data.survey_id de la notificación)
  alert_id: string | mongoose.Types.ObjectId; // ID de la notificación/encuesta (referencia a la colección surveys)
  user_id: string | mongoose.Types.ObjectId; // ID del usuario que responde
  answers: IAnswer[]; // Respuestas del usuario
  
  // Campos opcionales
  completed_at?: Date; // Fecha de completación
  metadata?: {
    source?: string; // 'web', 'app'
    device_info?: string; // Información del dispositivo
    ip_address?: string; // IP del usuario
    [key: string]: any;
  };
}

// Interface para la respuesta de encuesta
export interface ISurveyResponse extends Document {
  _id: string;
  survey_id: string; // ID de la encuesta (del campo data.survey_id)
  alert_id: mongoose.Types.ObjectId; // Referencia a la notificación/encuesta
  user_id: mongoose.Types.ObjectId; // Referencia al usuario
  answers: IAnswer[]; // Respuestas del usuario
  completed_at: Date; // Fecha de completación
  metadata?: any; // Metadata adicional
  created_at: Date;
  updated_at: Date;
}

// Interface para el resultado de guardar respuesta
export interface ISaveSurveyResponseResult {
  success: boolean;
  surveyResponse?: ISurveyResponse;
  message: string;
  error?: any;
}

// Esquema de respuesta de encuesta
const surveyResponseSchema = new Schema<ISurveyResponse>({
  survey_id: {
    type: String,
    required: [true, 'El ID de la encuesta es requerido'],
    index: true,
    trim: true
  },
  alert_id: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID de la notificación es requerido'],
    index: true,
    ref: 'Alert' // Referencia a la colección surveys (donde están las encuestas)
  },
  user_id: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID del usuario es requerido'],
    index: true,
    ref: 'User'
  },
  answers: [{
    question_id: {
      type: String,
      trim: true
    },
    question: {
      type: String,
      required: [true, 'La pregunta es requerida'],
      trim: true,
      maxlength: [500, 'La pregunta no puede exceder 500 caracteres']
    },
    answer: {
      type: Schema.Types.Mixed, // Puede ser string, number, boolean o array
      required: [true, 'La respuesta es requerida']
    },
    question_type: {
      type: String,
      required: [true, 'El tipo de pregunta es requerido'],
      enum: ['multiple_choice', 'text', 'rating', 'yes_no'],
      trim: true
    }
  }],
  completed_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  versionKey: false,
  toJSON: {
    transform: function(doc, ret: any) {
      if (ret.completed_at) ret.completed_at = new Date(ret.completed_at).toISOString();
      if (ret.created_at) ret.created_at = new Date(ret.created_at).toISOString();
      if (ret.updated_at) ret.updated_at = new Date(ret.updated_at).toISOString();
      return ret;
    }
  }
});

// Índices para optimizar consultas
surveyResponseSchema.index({ survey_id: 1, user_id: 1 }); // Para evitar duplicados
surveyResponseSchema.index({ alert_id: 1, user_id: 1 }); // Para consultas por notificación
surveyResponseSchema.index({ user_id: 1, completed_at: -1 }); // Para consultas por usuario
surveyResponseSchema.index({ survey_id: 1, completed_at: -1 }); // Para consultas por encuesta

// Modelo de respuesta de encuesta
const SurveyResponse = mongoose.model<ISurveyResponse>('SurveyResponse', surveyResponseSchema, 'survey_responses');

// Clase de servicio para guardar respuestas de encuestas
export class SaveSurveyResponseService {
  private static instance: SaveSurveyResponseService;
  private configData: ReturnType<typeof config>;
  private SurveyResponseModel: mongoose.Model<ISurveyResponse>;

  private constructor() {
    this.configData = config();
    this.SurveyResponseModel = mongoose.model<ISurveyResponse>('SurveyResponse');
  }

  public static getInstance(): SaveSurveyResponseService {
    if (!SaveSurveyResponseService.instance) {
      SaveSurveyResponseService.instance = new SaveSurveyResponseService();
    }
    return SaveSurveyResponseService.instance;
  }

  /**
   * Validar datos requeridos para guardar una respuesta de encuesta
   */
  private validateSurveyResponseData(responseData: ISaveSurveyResponseData): { isValid: boolean; message: string } {
    if (!responseData.survey_id || responseData.survey_id.trim() === '') {
      return { isValid: false, message: 'El ID de la encuesta (survey_id) es requerido' };
    }

    if (!responseData.alert_id) {
      return { isValid: false, message: 'El ID de la notificación (alert_id) es requerido' };
    }

    if (!responseData.user_id) {
      return { isValid: false, message: 'El ID del usuario (user_id) es requerido' };
    }

    if (!responseData.answers || !Array.isArray(responseData.answers) || responseData.answers.length === 0) {
      return { isValid: false, message: 'Las respuestas (answers) son requeridas y deben ser un array no vacío' };
    }

    // Validar que cada respuesta tenga los campos requeridos
    for (let i = 0; i < responseData.answers.length; i++) {
      const answer = responseData.answers[i];
      
      if (!answer.question || answer.question.trim() === '') {
        return { isValid: false, message: `La pregunta en la respuesta ${i + 1} es requerida` };
      }

      if (answer.answer === undefined || answer.answer === null || answer.answer === '') {
        return { isValid: false, message: `La respuesta en la pregunta ${i + 1} es requerida` };
      }

      if (!answer.question_type) {
        return { isValid: false, message: `El tipo de pregunta en la respuesta ${i + 1} es requerido` };
      }

      const validQuestionTypes = ['multiple_choice', 'text', 'rating', 'yes_no'];
      if (!validQuestionTypes.includes(answer.question_type)) {
        return { isValid: false, message: `Tipo de pregunta inválido en la respuesta ${i + 1}. Tipos permitidos: ${validQuestionTypes.join(', ')}` };
      }

      // Validar formato de respuesta según el tipo
      if (answer.question_type === 'rating') {
        if (typeof answer.answer !== 'number') {
          return { isValid: false, message: `La respuesta en la pregunta ${i + 1} debe ser un número para preguntas de tipo rating` };
        }
        if (answer.answer < 0 || answer.answer > 10) {
          return { isValid: false, message: `La respuesta en la pregunta ${i + 1} debe estar entre 0 y 10 para preguntas de tipo rating` };
        }
      } else if (answer.question_type === 'yes_no') {
        if (typeof answer.answer !== 'boolean' && answer.answer !== 'yes' && answer.answer !== 'no') {
          return { isValid: false, message: `La respuesta en la pregunta ${i + 1} debe ser true/false o yes/no para preguntas de tipo yes_no` };
        }
      } else if (answer.question_type === 'multiple_choice') {
        if (!Array.isArray(answer.answer)) {
          return { isValid: false, message: `La respuesta en la pregunta ${i + 1} debe ser un array para preguntas de tipo multiple_choice` };
        }
      }
    }

    return { isValid: true, message: 'Datos válidos' };
  }

  /**
   * Verificar si el usuario ya respondió esta encuesta
   */
  public async hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
    try {
      const existingResponse = await this.SurveyResponseModel.findOne({
        survey_id: surveyId,
        user_id: userId
      });

      return !!existingResponse;
    } catch (error) {
      console.error('Error al verificar si el usuario ya respondió:', error);
      return false;
    }
  }

  /**
   * Guardar respuesta de encuesta
   */
  public async saveSurveyResponse(responseData: ISaveSurveyResponseData): Promise<ISaveSurveyResponseResult> {
    try {
      // Validar datos
      const validation = this.validateSurveyResponseData(responseData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Verificar si el usuario ya respondió esta encuesta
      const hasResponded = await this.hasUserResponded(responseData.survey_id, responseData.user_id.toString());
      if (hasResponded) {
        return {
          success: false,
          message: 'El usuario ya respondió esta encuesta'
        };
      }

      // Preparar datos de la respuesta
      const now = new Date();
      const responseObject: any = {
        survey_id: responseData.survey_id.trim(),
        alert_id: responseData.alert_id,
        user_id: responseData.user_id,
        answers: responseData.answers.map(answer => ({
          question_id: answer.question_id?.trim(),
          question: answer.question.trim(),
          answer: answer.answer,
          question_type: answer.question_type
        })),
        completed_at: responseData.completed_at || now,
        created_at: now,
        updated_at: now
      };

      // Agregar metadata si está presente
      if (responseData.metadata) {
        responseObject.metadata = responseData.metadata;
      }

      // Crear la respuesta en la base de datos
      const newResponse = new this.SurveyResponseModel(responseObject);
      const savedResponse = await newResponse.save();

      return {
        success: true,
        surveyResponse: savedResponse,
        message: 'Respuesta de encuesta guardada exitosamente'
      };

    } catch (error: any) {
      console.error('Error al guardar respuesta de encuesta:', error);

      // Manejar errores específicos de MongoDB
      if (error.code === 11000) {
        return {
          success: false,
          message: 'Error: Ya existe una respuesta para esta encuesta de este usuario',
          error: error
        };
      }

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => err.message);
        return {
          success: false,
          message: `Error de validación: ${errors.join(', ')}`,
          error: error
        };
      }

      return {
        success: false,
        message: 'Error interno del servidor al guardar respuesta de encuesta',
        error: error
      };
    }
  }

  /**
   * Obtener respuesta de encuesta por usuario y encuesta
   */
  public async getSurveyResponseByUser(surveyId: string, userId: string): Promise<ISurveyResponse | null> {
    try {
      const response = await this.SurveyResponseModel.findOne({
        survey_id: surveyId,
        user_id: userId
      });

      return response;
    } catch (error) {
      console.error('Error al obtener respuesta de encuesta:', error);
      throw new Error('Error interno del servidor al obtener respuesta de encuesta');
    }
  }

  /**
   * Obtener todas las respuestas de una encuesta
   */
  public async getSurveyResponses(surveyId: string, filters?: {
    limit?: number;
    skip?: number;
  }): Promise<ISurveyResponse[]> {
    try {
      const query: any = { survey_id: surveyId };

      const limit = filters?.limit || 50;
      const skip = filters?.skip || 0;

      const responses = await this.SurveyResponseModel.find(query)
        .sort({ completed_at: -1 })
        .limit(limit)
        .skip(skip)
        .populate('user_id', 'username first_name last_name email')
        .populate('alert_id', 'title message');

      return responses;
    } catch (error) {
      console.error('Error al obtener respuestas de encuesta:', error);
      throw new Error('Error interno del servidor al obtener respuestas de encuesta');
    }
  }

  /**
   * Obtener respuestas de un usuario
   */
  public async getUserSurveyResponses(userId: string, filters?: {
    limit?: number;
    skip?: number;
  }): Promise<ISurveyResponse[]> {
    try {
      const query: any = { user_id: userId };

      const limit = filters?.limit || 50;
      const skip = filters?.skip || 0;

      const responses = await this.SurveyResponseModel.find(query)
        .sort({ completed_at: -1 })
        .limit(limit)
        .skip(skip)
        .populate('alert_id', 'title message type');

      return responses;
    } catch (error) {
      console.error('Error al obtener respuestas del usuario:', error);
      throw new Error('Error interno del servidor al obtener respuestas del usuario');
    }
  }

  /**
   * Obtener estadísticas de una encuesta
   */
  public async getSurveyStats(surveyId: string): Promise<{
    total_responses: number;
    unique_users: number;
    completion_rate?: number; // Si se conoce el total de usuarios que recibieron la encuesta
    average_completion_time?: number; // Si se tiene este dato
  }> {
    try {
      // Total de respuestas
      const totalResponses = await this.SurveyResponseModel.countDocuments({ survey_id: surveyId });

      // Usuarios únicos que respondieron
      const uniqueUsers = await this.SurveyResponseModel.distinct('user_id', { survey_id: surveyId });

      return {
        total_responses: totalResponses,
        unique_users: uniqueUsers.length
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de encuesta:', error);
      throw new Error('Error interno del servidor al obtener estadísticas');
    }
  }

  /**
   * Eliminar respuesta de encuesta
   */
  public async deleteSurveyResponse(responseId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.SurveyResponseModel.deleteOne({
        _id: responseId,
        user_id: userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al eliminar respuesta de encuesta:', error);
      throw new Error('Error interno del servidor al eliminar respuesta de encuesta');
    }
  }

  /**
   * Obtener estadísticas completas de una encuesta para dashboard
   * Incluye: tasa de finalización, tiempo promedio, respuestas por fecha
   */
  public async getSurveyStatsDetailed(surveyId: string): Promise<{
    total_responses: number;
    unique_users: number;
    completion_rate: number | null;
    average_completion_time: number | null;
    responses_by_date: Array<{
      date: string;
      count: number;
    }>;
    first_response_date: Date | null;
    last_response_date: Date | null;
  }> {
    try {
      // Total de respuestas
      const totalResponses = await this.SurveyResponseModel.countDocuments({ survey_id: surveyId });

      // Usuarios únicos que respondieron
      const uniqueUsers = await this.SurveyResponseModel.distinct('user_id', { survey_id: surveyId });

      // Obtener todas las respuestas para calcular tiempo promedio y respuestas por fecha
      const responses = await this.SurveyResponseModel.find({ survey_id: surveyId })
        .sort({ completed_at: 1 })
        .select('completed_at created_at');

      // Calcular tasa de finalización
      // Buscar el alert_id asociado a la encuesta para obtener total de usuarios que recibieron el alert
      let completionRate: number | null = null;
      if (responses.length > 0) {
        const firstResponse = await this.SurveyResponseModel.findOne({ survey_id: surveyId }).select('alert_id');
        if (firstResponse && firstResponse.alert_id) {
          try {
            const NotificationResponseModel = mongoose.model('NotificationResponse');
            const totalUsersReceived = await NotificationResponseModel.countDocuments({ 
              alert_id: firstResponse.alert_id 
            });
            
            if (totalUsersReceived > 0) {
              completionRate = Math.round((uniqueUsers.length / totalUsersReceived) * 10000) / 100; // Porcentaje con 2 decimales (ej: 75.50)
            }
          } catch (error) {
            // Si no se puede obtener, dejar como null
            console.warn('No se pudo calcular completion_rate:', error);
          }
        }
      }

      // Calcular tiempo promedio de respuesta (diferencia entre created_at y completed_at)
      let averageCompletionTime: number | null = null;
      if (responses.length > 0) {
        let totalTime = 0;
        let validResponses = 0;
        
        responses.forEach((response: any) => {
          if (response.created_at && response.completed_at) {
            const timeDiff = new Date(response.completed_at).getTime() - new Date(response.created_at).getTime();
            if (timeDiff > 0) {
              totalTime += timeDiff;
              validResponses++;
            }
          }
        });
        
        if (validResponses > 0) {
          averageCompletionTime = Math.round(totalTime / validResponses / 1000); // En segundos
        }
      }

      // Respuestas por fecha
      const responsesByDateMap: { [key: string]: number } = {};
      let firstResponseDate: Date | null = null;
      let lastResponseDate: Date | null = null;

      responses.forEach((response: any) => {
        if (response.completed_at) {
          const date = new Date(response.completed_at);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          responsesByDateMap[dateKey] = (responsesByDateMap[dateKey] || 0) + 1;
          
          if (!firstResponseDate || date < firstResponseDate) {
            firstResponseDate = date;
          }
          if (!lastResponseDate || date > lastResponseDate) {
            lastResponseDate = date;
          }
        }
      });

      const responsesByDate = Object.entries(responsesByDateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_responses: totalResponses,
        unique_users: uniqueUsers.length,
        completion_rate: completionRate,
        average_completion_time: averageCompletionTime,
        responses_by_date: responsesByDate,
        first_response_date: firstResponseDate,
        last_response_date: lastResponseDate
      };
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas de encuesta:', error);
      throw new Error('Error interno del servidor al obtener estadísticas detalladas');
    }
  }

  /**
   * Obtener respuestas de encuesta con información completa del usuario
   */
  public async getSurveyResponsesWithUsers(surveyId: string, filters?: {
    limit?: number;
    skip?: number;
  }): Promise<any[]> {
    try {
      const query: any = { survey_id: surveyId };
      const limit = filters?.limit || 50;
      const skip = filters?.skip || 0;

      const responses = await this.SurveyResponseModel.find(query)
        .sort({ completed_at: -1 })
        .limit(limit)
        .skip(skip)
        .populate('user_id', 'username first_name last_name email phone_number')
        .populate('alert_id', 'title message type');

      return responses.map((response: any) => ({
        _id: response._id,
        survey_id: response.survey_id,
        alert_id: response.alert_id,
        user_id: response.user_id,
        user_info: response.user_id ? {
          username: response.user_id.username,
          first_name: response.user_id.first_name,
          last_name: response.user_id.last_name,
          email: response.user_id.email,
          phone_number: response.user_id.phone_number
        } : null,
        answers: response.answers,
        completed_at: response.completed_at,
        metadata: response.metadata,
        created_at: response.created_at,
        updated_at: response.updated_at
      }));
    } catch (error) {
      console.error('Error al obtener respuestas con usuarios:', error);
      throw new Error('Error interno del servidor al obtener respuestas con usuarios');
    }
  }

  /**
   * Obtener análisis de respuestas por tipo de pregunta
   */
  public async getSurveyAnswersAnalysis(surveyId: string): Promise<{
    question_analysis: Array<{
      question_id: string;
      question: string;
      question_type: string;
      total_responses: number;
      answer_distribution: any;
      average_rating?: number;
      text_responses?: string[];
    }>;
  }> {
    try {
      const responses = await this.SurveyResponseModel.find({ survey_id: surveyId })
        .select('answers');

      if (responses.length === 0) {
        return { question_analysis: [] };
      }

      // Agrupar respuestas por pregunta
      const questionMap: { [key: string]: {
        question_id: string;
        question: string;
        question_type: string;
        answers: any[];
      } } = {};

      responses.forEach((response: any) => {
        if (response.answers && Array.isArray(response.answers)) {
          response.answers.forEach((answerItem: any) => {
            const qId = answerItem.question_id || 'unknown';
            
            if (!questionMap[qId]) {
              questionMap[qId] = {
                question_id: qId,
                question: answerItem.question || '',
                question_type: answerItem.question_type || 'text',
                answers: []
              };
            }
            
            questionMap[qId].answers.push(answerItem.answer);
          });
        }
      });

      // Procesar cada pregunta según su tipo
      const questionAnalysis = Object.values(questionMap).map((questionData) => {
        const analysis: any = {
          question_id: questionData.question_id,
          question: questionData.question,
          question_type: questionData.question_type,
          total_responses: questionData.answers.length,
          answer_distribution: {}
        };

        switch (questionData.question_type) {
          case 'rating':
            // Para rating: calcular promedio
            const ratings = questionData.answers.filter(a => typeof a === 'number');
            if (ratings.length > 0) {
              const sum = ratings.reduce((acc: number, val: number) => acc + val, 0);
              analysis.average_rating = Math.round((sum / ratings.length) * 100) / 100;
              analysis.answer_distribution = {
                min: Math.min(...ratings),
                max: Math.max(...ratings),
                average: analysis.average_rating
              };
            }
            break;

          case 'yes_no':
            // Para yes_no: contar true/false
            const yesCount = questionData.answers.filter((a: any) => a === true || a === 'true' || a === 'Sí').length;
            const noCount = questionData.answers.length - yesCount;
            analysis.answer_distribution = {
              yes: yesCount,
              no: noCount,
              yes_percentage: Math.round((yesCount / questionData.answers.length) * 10000) / 100
            };
            break;

          case 'multiple_choice':
            // Para multiple_choice: contar opciones seleccionadas
            const choiceCounts: { [key: string]: number } = {};
            questionData.answers.forEach((answer: any) => {
              if (Array.isArray(answer)) {
                answer.forEach((choice: any) => {
                  const choiceStr = String(choice);
                  choiceCounts[choiceStr] = (choiceCounts[choiceStr] || 0) + 1;
                });
              } else {
                const choiceStr = String(answer);
                choiceCounts[choiceStr] = (choiceCounts[choiceStr] || 0) + 1;
              }
            });
            analysis.answer_distribution = choiceCounts;
            break;

          case 'text':
          default:
            // Para text: obtener respuestas únicas (hasta 10)
            const uniqueTexts = [...new Set(questionData.answers.map((a: any) => String(a)))];
            analysis.text_responses = uniqueTexts.slice(0, 10);
            analysis.answer_distribution = {
              total_unique_responses: uniqueTexts.length,
              sample_responses: uniqueTexts.slice(0, 5)
            };
            break;
        }

        return analysis;
      });

      return { question_analysis: questionAnalysis };
    } catch (error) {
      console.error('Error al obtener análisis de respuestas:', error);
      throw new Error('Error interno del servidor al obtener análisis de respuestas');
    }
  }

  /**
   * Obtener estadísticas de todas las encuestas
   */
  public async getAllSurveysStats(): Promise<Array<{
    survey_id: string;
    total_responses: number;
    unique_users: number;
    completion_rate: number | null;
    average_completion_time: number | null;
    last_response_date: Date | null;
  }>> {
    try {
      // Obtener todos los survey_id únicos
      const surveyIds = await this.SurveyResponseModel.distinct('survey_id');

      // Obtener estadísticas para cada encuesta
      const statsPromises = surveyIds.map(async (surveyId: string) => {
        const detailedStats = await this.getSurveyStatsDetailed(surveyId);
        return {
          survey_id: surveyId,
          total_responses: detailedStats.total_responses,
          unique_users: detailedStats.unique_users,
          completion_rate: detailedStats.completion_rate,
          average_completion_time: detailedStats.average_completion_time,
          last_response_date: detailedStats.last_response_date
        };
      });

      const allStats = await Promise.all(statsPromises);
      
      // Ordenar por fecha de última respuesta (más reciente primero)
      return allStats.sort((a, b) => {
        if (!a.last_response_date && !b.last_response_date) return 0;
        if (!a.last_response_date) return 1;
        if (!b.last_response_date) return -1;
        return new Date(b.last_response_date).getTime() - new Date(a.last_response_date).getTime();
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de todas las encuestas:', error);
      throw new Error('Error interno del servidor al obtener estadísticas de todas las encuestas');
    }
  }
}

// Exportar instancia singleton del servicio
export const saveSurveyResponseService = SaveSurveyResponseService.getInstance();

