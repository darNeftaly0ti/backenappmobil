import { config } from '../../configs/config';
import { userService } from '../services';

// Interface para la respuesta de SmartOLT API
interface ISmartOLTResponse {
  status: boolean;
  response: any; // Array o objeto con datos de ONUs
}

// Interface para la información de la ONU
interface IONUInfo {
  status: any;
  name: any;
  model: any;
  serial: any;
  mac: any;
  pon_port: any;
  olt_id: any;
  zone: any;
  details: any; // Todos los demás campos de la ONU
}

// Interface para la respuesta del consumo de SmartOLT
export interface IConsumptionData {
  onu_sn: string;
  onu_id: any;
  onu_info: IONUInfo;
  traffic: any; // Datos de tráfico/consumo de SmartOLT
  timestamp: Date;
  from_cache?: boolean; // Indica si los datos vienen del caché
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
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTimeout: number; // Tiempo en milisegundos (5 minutos por defecto)

  private constructor() {
    this.configData = config();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos en cache
  }

  public static getInstance(): SmartOLTService {
    if (!SmartOLTService.instance) {
      SmartOLTService.instance = new SmartOLTService();
    }
    return SmartOLTService.instance;
  }

  /**
   * Limpiar caché antiguo
   */
  private cleanOldCache(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutos

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Limpiar todo el caché manualmente
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtener el consumo de un usuario desde SmartOLT usando su ONU_sn
   * @param userId - ID del usuario en la base de datos
   * @param graphType - Tipo de gráfico a obtener: 'hourly', 'daily', 'weekly', 'monthly', 'yearly' (default: 'daily')
   * @returns Resultado con los datos de consumo
   */
  public async getConsumptionByUserId(userId: string, graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): Promise<IConsumptionResult> {
    try {
      // Buscar el usuario en la base de datos
      const user = await userService.findUserById(userId);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      // Convertir el documento de Mongoose a objeto plano para acceder a todos los campos
      const userObj = user.toObject ? user.toObject() : user;
      const onuSn = (userObj as any).ONU_sn || (userObj as any).onu_sn;

      // Debug: Log para verificar qué campos tiene el usuario
      console.log('Usuario encontrado:', {
        id: user._id,
        username: user.username,
        onuSn: onuSn
      });

      if (!onuSn || (typeof onuSn === 'string' && onuSn.trim() === '')) {
        return {
          success: false,
          message: 'El usuario no tiene un ONU_sn registrado'
        };
      }

      // Consultar el consumo en SmartOLT directamente por ONU_sn
      // Ya no necesitamos filtros, el nuevo endpoint es directo por SN
      return await this.getConsumptionByONU(onuSn, undefined, graphType);

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
   * @param filters - DEPRECADO: Ya no se necesitan filtros, el endpoint es directo por SN
   * @param graphType - Tipo de gráfico a obtener: 'hourly', 'daily', 'weekly', 'monthly', 'yearly' (default: 'daily')
   * @returns Resultado con los datos de consumo
   */
  public async getConsumptionByONU(onuSn: string, filters?: any, graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'): Promise<IConsumptionResult> {
    try {
      const apiKey = this.configData.smartOLT.apiKey;

      if (!apiKey) {
        return {
          success: false,
          message: 'API Key de SmartOLT no configurada'
        };
      }

      // Configurar URL base del API de SmartOLT (ya incluye /api si está en .env)
      const smartOLTBaseUrl = this.configData.smartOLT.baseUrl || 'https://conectatayd.smartolt.com/api';
      
      // PASO 1: Obtener los detalles de la ONU específica directamente por su ONU_sn (serial number)
      // Endpoint: GET /api/onu/get_onus_details_by_sn/{onu_sn}
      // Este endpoint retorna directamente la ONU específica sin necesidad de filtros
      const endpoint = `${smartOLTBaseUrl}/onu/get_onus_details_by_sn/${encodeURIComponent(onuSn)}`;
      
      // Logs para debug
      console.log('Consultando SmartOLT:');
      console.log('  - ONU_sn buscado:', onuSn);
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

      console.log('Respuesta de SmartOLT:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);

      if (!response.ok) {
        let errorData: any = {};
        try {
          const errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Si no es JSON, usar el texto como error
          errorData = { error: 'Error desconocido' };
        }

        console.error('Error en respuesta de SmartOLT:');
        console.error('  - Status:', response.status);
        console.error('  - Error completo:', JSON.stringify(errorData));

        // Manejo específico de error 403 (límite de rate alcanzado)
        if (response.status === 403) {
          // Intentar usar caché si existe
          const cached = this.cache.get(onuSn);
          if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log('Usando datos en caché para evitar límite de rate');
            // Retornar datos del caché con la misma estructura, marcando que viene del caché
            const cachedData = {
              ...cached.data,
              timestamp: new Date(cached.timestamp),
              from_cache: true
            };
            return {
              success: true,
              data: cachedData,
              message: 'Consumo obtenido desde caché (límite de API alcanzado)'
            };
          }

          return {
            success: false,
            message: `Límite de peticiones horario de SmartOLT alcanzado. Error: ${errorData.error || 'Forbidden'}. Intenta nuevamente más tarde.`
          };
        }

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
          message: `Error al consultar SmartOLT: ${response.status} ${response.statusText}. ${errorData.error || ''}`
        };
      }

      // Parsear la respuesta
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (error) {
        const textResponse = await response.text();
        console.error('Error al parsear JSON de SmartOLT:', textResponse);
        return {
          success: false,
          message: `Error al parsear respuesta de SmartOLT: ${textResponse.substring(0, 200)}`
        };
      }
      
      console.log('Estructura de respuesta recibida:', {
        hasStatus: 'status' in responseData,
        status: responseData.status,
        hasOnus: 'onus' in responseData,
        onusType: responseData.onus ? (Array.isArray(responseData.onus) ? 'array' : typeof responseData.onus) : 'undefined',
        allKeys: Object.keys(responseData)
      });
      
      // El nuevo endpoint get_onus_details_by_sn retorna: { status: true, onus: [...] }
      // Ya retorna directamente la ONU específica que buscamos
      let onu: any = null;
      
      if (responseData.status === true && responseData.onus) {
        // Formato del nuevo endpoint: { status: true, onus: [...] }
        const onusList = Array.isArray(responseData.onus) ? responseData.onus : [responseData.onus];
        
        if (onusList.length > 0) {
          // Tomar la primera ONU (el endpoint debería retornar solo la que buscamos)
          onu = onusList[0];
          
          // Verificar que el SN coincide (por seguridad)
          if (onu.sn !== onuSn && onu.unique_external_id !== onuSn) {
            console.warn('La ONU retornada no coincide con el SN buscado:', {
              buscado: onuSn,
              retornado: onu.sn || onu.unique_external_id
            });
          }
        }
      } else {
        // Formato inesperado
        console.error('Formato de respuesta desconocido:', JSON.stringify(responseData));
        return {
          success: false,
          message: `Formato de respuesta inesperado de SmartOLT. Campos recibidos: ${Object.keys(responseData).join(', ')}. Revisa los logs del servidor para más detalles.`
        };
      }

      if (!onu) {
        console.log('ONU no encontrada. Serial buscado:', onuSn);
        return {
          success: false,
          message: 'ONU no encontrada en SmartOLT'
        };
      }

      console.log('ONU encontrada:', {
        serial: onu.sn,
        unique_external_id: onu.unique_external_id,
        status: onu.status,
        name: onu.name,
        olt_id: onu.olt_id,
        board: onu.board,
        port: onu.port,
        onu: onu.onu
      });

      // Verificar que tenemos el unique_external_id necesario para obtener el gráfico
      if (!onu.unique_external_id) {
        console.error('ONU encontrada pero no tiene unique_external_id para obtener el gráfico');
        return {
          success: false,
          message: 'ONU encontrada pero no tiene unique_external_id para consultar el gráfico de tráfico'
        };
      }

      // PASO 2: Obtener el gráfico de tráfico/consumo de la ONU usando su unique_external_id
      // Endpoint correcto: GET /api/onu/get_onu_traffic_graph/{onu_external_id}/{graph_type}
      // Este endpoint retorna una imagen PNG del gráfico de tráfico de la ONU específica
      // graph_type puede ser: hourly, daily, weekly, monthly, yearly
      
      let trafficData: any = null;
      let trafficGraphBase64: string | null = null;
      
      if (!onu.unique_external_id) {
        console.error('ONU encontrada pero no tiene unique_external_id para obtener el gráfico');
      } else {
        const trafficEndpoint = `${smartOLTBaseUrl}/onu/get_onu_traffic_graph/${onu.unique_external_id}/${graphType}`;
        console.log('Obteniendo gráfico de tráfico para ONU:', {
          unique_external_id: onu.unique_external_id,
          graph_type: graphType,
          endpoint: trafficEndpoint
        });

        const trafficResponse = await fetch(trafficEndpoint, {
          method: 'GET',
          headers: {
            'X-Token': apiKey,
            'Accept': 'image/png' // La respuesta es una imagen PNG
          }
        });

        console.log('Respuesta de tráfico SmartOLT:');
        console.log('  - Status:', trafficResponse.status);
        console.log('  - Status Text:', trafficResponse.statusText);
        console.log('  - Content-Type:', trafficResponse.headers.get('content-type'));

        if (trafficResponse.ok) {
          try {
            // La respuesta es una imagen PNG, convertirla a base64 para enviarla al frontend
            const imageBuffer = await trafficResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            trafficGraphBase64 = `data:image/png;base64,${base64Image}`;
            
            // También almacenar metadatos del gráfico
            trafficData = {
              graph_type: graphType,
              unique_external_id: onu.unique_external_id,
              image_base64: trafficGraphBase64,
              content_type: 'image/png',
              // URL directa para usar en el frontend si prefieren
              image_url: trafficEndpoint // El frontend puede usar esta URL directamente con el header X-Token
            };
            
            console.log('Gráfico de tráfico obtenido exitosamente');
          } catch (error) {
            console.error('Error al procesar imagen de tráfico:', error);
            // Continuar con datos de la ONU aunque no tengamos el gráfico
          }
        } else {
          let errorText = '';
          try {
            errorText = await trafficResponse.text();
            console.error('Error al obtener tráfico:', trafficResponse.status, errorText);
            
            // Manejar errores específicos según la documentación de SmartOLT
            if (trafficResponse.status === 400) {
              if (errorText.includes('no ONU external ID')) {
                console.error('Error: No se proporcionó el ONU external ID');
              } else if (errorText.includes('no ONU was found')) {
                console.error('Error: ONU no encontrada para el external ID proporcionado');
              } else if (errorText.includes('doesn\'t have traffic graph yet')) {
                console.error('Error: La ONU aún no tiene gráfico de tráfico generado');
              }
            }
          } catch (e) {
            console.error('Error al leer respuesta de error:', e);
          }
          // Continuar con datos de la ONU aunque no tengamos el gráfico
        }
      }

      // Retornar los datos combinados: información de la ONU + datos de tráfico/consumo
      // Estructura mejorada para mejor accesibilidad
      const consumptionData = {
        // Información básica de la ONU
        onu_sn: onuSn,
        onu_id: onu.unique_external_id, // Usar unique_external_id como ID
        // Información detallada de la ONU (campos principales)
        onu_info: {
          status: onu.status,
          name: onu.name || onu.custom_name || null,
          model: onu.model || null,
          serial: onu.sn || onu.serial_number || onu.serial,
          mac: onu.mac || null,
          pon_port: onu.pon_port || null,
          olt_id: onu.olt_id || null,
          zone: onu.zone || null,
          // Incluir todos los demás campos de la ONU
          details: onu
        },
        // Datos de tráfico/consumo
        traffic: trafficData,
        // Timestamp de la consulta
        timestamp: new Date(),
        // Indicador si viene del caché
        from_cache: false
      };

      // Guardar en caché para evitar futuras peticiones si se alcanza el límite
      this.cache.set(onuSn, {
        data: consumptionData,
        timestamp: Date.now()
      });

      // Limpiar caché antiguo (más de 10 minutos)
      this.cleanOldCache();

      return {
        success: true,
        data: consumptionData,
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

