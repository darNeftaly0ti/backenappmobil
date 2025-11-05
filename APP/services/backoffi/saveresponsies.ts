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
}

// Exportar instancia singleton del servicio
export const saveSurveyResponseService = SaveSurveyResponseService.getInstance();

