import { config } from '../../configs/config';
import { userService } from '../services';

// Interface para la respuesta de SmartOLT API
interface ISmartOLTResponse {
  status: boolean;
  response: any; // Array o objeto con datos de ONUs
}

// Interface para la respuesta del consumo de SmartOLT
export interface IConsumptionData {
  onu_sn: string;
  consumption: any; // La estructura exacta depende de la respuesta de SmartOLT
  timestamp: Date;
}

// Interface para el resultado del servicio
export interface IConsumptionResult {
  success: boolean;
  data?: IConsumptionData;
  message: string;
}

// Clase de servicios para SmartOLT
export class SmartOLTService {
  private static instance: SmartOLTService;
  private configData: ReturnType<typeof config>;

  private constructor() {
    this.configData = config();
  }

  public static getInstance(): SmartOLTService {
    if (!SmartOLTService.instance) {
      SmartOLTService.instance = new SmartOLTService();
    }
    return SmartOLTService.instance;
  }

  /**
   * Obtener el consumo de un usuario desde SmartOLT usando su ONU_sn
   * @param userId - ID del usuario en la base de datos
   * @returns Resultado con los datos de consumo
   */
  public async getConsumptionByUserId(userId: string): Promise<IConsumptionResult> {
    try {
      // Buscar el usuario en la base de datos
      const user = await userService.findUserById(userId);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      // Obtener el ONU_sn del usuario (campo "ONU_sn" de la colección user)
      // Convertir el documento de Mongoose a objeto plano para acceder a todos los campos
      const userObj = user.toObject ? user.toObject() : user;
      const onuSn = (userObj as any).ONU_sn || (userObj as any).onu_sn;

      // Debug: Log para verificar qué campos tiene el usuario
      console.log('Usuario encontrado:', {
        id: user._id,
        username: user.username,
        onuSn: onuSn,
        allFields: Object.keys(userObj)
      });

      if (!onuSn || (typeof onuSn === 'string' && onuSn.trim() === '')) {
        return {
          success: false,
          message: 'El usuario no tiene un ONU_sn registrado'
        };
      }

      // Consultar el consumo en SmartOLT
      return await this.getConsumptionByONU(onuSn);

    } catch (error) {
      console.error('Error al obtener consumo por userId:', error);
      return {
        success: false,
        message: 'Error interno del servidor al consultar consumo'
      };
    }
  }

  /**
   * Obtener el consumo directamente por ONU_sn desde SmartOLT
   * @param onuSn - Número de serie de la ONU
   * @returns Resultado con los datos de consumo
   */
  public async getConsumptionByONU(onuSn: string): Promise<IConsumptionResult> {
    try {
      const apiKey = this.configData.smartOLT.apiKey;

      if (!apiKey) {
        return {
          success: false,
          message: 'API Key de SmartOLT no configurada'
        };
      }

      // Configurar URL base del API de SmartOLT
      const smartOLTBaseUrl = process.env.SMART_OLT_BASE_URL || 'https://conectatayd.smartolt.com';
      
      // Endpoint para obtener detalles de ONUs - buscamos por serial number (ONU_sn)
      // Si SmartOLT no tiene endpoint específico por SN, obtenemos todos y filtramos
      const endpoint = `${smartOLTBaseUrl}/api/onu/get_all_onus_details`;
      
      // Logs detallados para debug
      console.log('🔍 Consultando SmartOLT:');
      console.log('  - ONU_sn:', onuSn);
      console.log('  - URL base:', smartOLTBaseUrl);
      console.log('  - Endpoint completo:', endpoint);

      // Hacer la petición al API de SmartOLT con el formato correcto
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-Token': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('📥 Respuesta de SmartOLT:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta de SmartOLT:');
        console.error('  - Status:', response.status);
        console.error('  - Error completo:', errorText);
        
        if (response.status === 404) {
          return {
            success: false,
            message: 'ONU no encontrada en SmartOLT'
          };
        }

        if (response.status === 401) {
          return {
            success: false,
            message: 'API Key de SmartOLT inválida o expirada'
          };
        }

        return {
          success: false,
          message: `Error al consultar SmartOLT: ${response.status} ${response.statusText}`
        };
      }

      // Parsear la respuesta
      const responseData = await response.json() as ISmartOLTResponse;
      
      // Verificar estructura de respuesta de SmartOLT
      if (!responseData.status || !responseData.response) {
        return {
          success: false,
          message: 'Formato de respuesta inválido de SmartOLT'
        };
      }

      // Buscar la ONU específica por serial number en la respuesta
      const onusList = Array.isArray(responseData.response) ? responseData.response : [responseData.response];
      const onu = onusList.find((onuItem: any) => 
        onuItem.serial_number === onuSn || 
        onuItem.serial === onuSn || 
        onuItem.sn === onuSn ||
        onuItem.ONU_sn === onuSn
      );

      if (!onu) {
        console.log('⚠️ ONU no encontrada en la lista. Serial buscado:', onuSn);
        console.log('📋 Primeros 3 ONUs encontrados:', onusList.slice(0, 3).map((o: any) => ({
          serial: o.serial_number || o.serial || o.sn || o.ONU_sn,
          keys: Object.keys(o)
        })));
        return {
          success: false,
          message: 'ONU no encontrada en SmartOLT'
        };
      }

      console.log('✅ ONU encontrada:', {
        serial: onu.serial_number || onu.serial || onu.sn,
        id: onu.id,
        status: onu.status
      });

      // Retornar los datos de la ONU encontrada (incluye consumo, tráfico, etc.)
      const consumptionData = onu;

      return {
        success: true,
        data: {
          onu_sn: onuSn,
          consumption: consumptionData,
          timestamp: new Date()
        },
        message: 'Consumo obtenido exitosamente'
      };

    } catch (error) {
      console.error('Error al consultar consumo en SmartOLT:', error);
      return {
        success: false,
        message: 'Error al conectar con el API de SmartOLT'
      };
    }
  }
}

// Exportar instancia singleton del servicio
export const smartOLTService = SmartOLTService.getInstance();

