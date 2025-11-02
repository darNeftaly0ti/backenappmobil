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

      // Convertir el documento de Mongoose a objeto plano para acceder a todos los campos
      const userObj = user.toObject ? user.toObject() : user;
      const onuSn = (userObj as any).ONU_sn || (userObj as any).onu_sn;

      // Obtener campos de filtrado para reducir consumo de API
      const filters = {
        olt_id: (userObj as any).olt_id,
        board: (userObj as any).board,
        port: (userObj as any).port,
        zone: (userObj as any).zone,
        olt_name: (userObj as any).olt_name
      };

      // Debug: Log para verificar qué campos tiene el usuario
      console.log('Usuario encontrado:', {
        id: user._id,
        username: user.username,
        onuSn: onuSn,
        filters: filters,
        filtersAvailable: Object.keys(filters).filter(key => filters[key as keyof typeof filters] !== undefined && filters[key as keyof typeof filters] !== null)
      });

      if (!onuSn || (typeof onuSn === 'string' && onuSn.trim() === '')) {
        return {
          success: false,
          message: 'El usuario no tiene un ONU_sn registrado'
        };
      }

      // Consultar el consumo en SmartOLT con los filtros disponibles
      return await this.getConsumptionByONU(onuSn, filters);

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
   * @param filters - Filtros opcionales para reducir el consumo de API (olt_id, board, port, zone)
   * @returns Resultado con los datos de consumo
   */
  public async getConsumptionByONU(onuSn: string, filters?: {
    olt_id?: string;
    board?: number;
    port?: number;
    zone?: string;
    olt_name?: string;
  }): Promise<IConsumptionResult> {
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
      
      // Construir endpoint con filtros para reducir el consumo de API
      // Si tenemos filtros disponibles (olt_id, board, port, zone), los usamos
      // La URL base ya incluye /api, solo agregamos el path del endpoint
      let endpoint = `${smartOLTBaseUrl}/onu/get_all_onus_details`;
      const queryParams: string[] = [];
      
      if (filters?.olt_id) {
        queryParams.push(`olt_id=${encodeURIComponent(filters.olt_id)}`);
      }
      if (filters?.board !== undefined && filters.board !== null) {
        queryParams.push(`board=${filters.board}`);
      }
      if (filters?.port !== undefined && filters.port !== null) {
        queryParams.push(`port=${filters.port}`);
      }
      if (filters?.zone) {
        queryParams.push(`zone=${encodeURIComponent(filters.zone)}`);
      }
      
      // Si tenemos filtros, agregarlos al endpoint
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      
      // Logs detallados para debug
      console.log('Consultando SmartOLT:');
      console.log('  - ONU_sn buscado:', onuSn);
      console.log('  - URL base:', smartOLTBaseUrl);
      console.log('  - Filtros aplicados:', {
        olt_id: filters?.olt_id || 'NO DISPONIBLE',
        board: filters?.board !== undefined ? filters.board : 'NO DISPONIBLE',
        port: filters?.port !== undefined ? filters.port : 'NO DISPONIBLE',
        zone: filters?.zone || 'NO DISPONIBLE',
        totalFiltros: queryParams.length
      });
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
            return {
              success: true,
              data: {
                onu_sn: onuSn,
                consumption: cached.data,
                timestamp: new Date(cached.timestamp),
                from_cache: true
              },
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
        hasResponse: 'response' in responseData,
        responseType: Array.isArray(responseData.response) ? 'array' : typeof responseData.response,
        allKeys: Object.keys(responseData)
      });
      
      // Verificar estructura de respuesta de SmartOLT (más flexible)
      // SmartOLT puede retornar diferentes formatos:
      // 1. { status: true, response: [...] }
      // 2. { status: true, onus: [...] }  <- Formato real de SmartOLT
      // 3. Array directo [...]
      let onusList: any[] = [];
      
      if (responseData.status === true && responseData.response) {
        // Formato estándar: { status: true, response: [...] }
        onusList = Array.isArray(responseData.response) ? responseData.response : [responseData.response];
      } else if (responseData.status === true && responseData.onus) {
        // Formato real de SmartOLT: { status: true, onus: [...] }
        onusList = Array.isArray(responseData.onus) ? responseData.onus : [responseData.onus];
      } else if (Array.isArray(responseData)) {
        // Formato alternativo: respuesta directa es un array
        onusList = responseData;
      } else if (responseData.response && Array.isArray(responseData.response)) {
        // Otro formato posible
        onusList = responseData.response;
      } else {
        // No encontramos el formato esperado, retornar error con detalles útiles
        const errorDetails = {
          keys: Object.keys(responseData),
          firstKeySample: responseData[Object.keys(responseData)[0]] ? 
            JSON.stringify(responseData[Object.keys(responseData)[0]]).substring(0, 100) : 'null',
          responseType: typeof responseData,
          isArray: Array.isArray(responseData)
        };
        
        console.error('Formato de respuesta desconocido:', JSON.stringify(errorDetails));
        
        return {
          success: false,
          message: `Formato de respuesta inesperado de SmartOLT. Campos recibidos: ${Object.keys(responseData).join(', ')}. Revisa los logs del servidor para más detalles.`
        };
      }
      
      console.log(`Total de ONUs encontradas en respuesta (filtradas): ${onusList.length}`);

      // Buscar la ONU específica por serial number en la respuesta filtrada
      // Según los logs anteriores, SmartOLT usa el campo 'sn' para el serial number
      console.log('Buscando ONU con serial:', onuSn);
      
      const onu = onusList.find((onuItem: any) => {
        // Intentar múltiples campos posibles para el serial number
        const matches = 
          onuItem.sn === onuSn ||  // Campo real de SmartOLT (prioridad)
          onuItem.serial_number === onuSn || 
          onuItem.serial === onuSn ||
          onuItem.ONU_sn === onuSn ||
          onuItem.unique_external_id === onuSn;
        
        if (matches) {
          console.log('Coincidencia encontrada en campo:', {
            sn: onuItem.sn,
            serial_number: onuItem.serial_number,
            serial: onuItem.serial,
            ONU_sn: onuItem.ONU_sn,
            unique_external_id: onuItem.unique_external_id,
            // Mostrar posibles campos de ID
            id: onuItem.id,
            onu_id: onuItem.onu_id,
            unique_id: onuItem.unique_id,
            allKeys: Object.keys(onuItem)
          });
        }
        
        return matches;
      });

      if (!onu) {
        console.log('ONU no encontrada en la lista. Serial buscado:', onuSn);
        console.log('Primeros 3 ONUs encontrados:', onusList.slice(0, 3).map((o: any) => ({
          serial: o.serial_number || o.serial || o.sn || o.ONU_sn,
          keys: Object.keys(o)
        })));
        return {
          success: false,
          message: 'ONU no encontrada en SmartOLT'
        };
      }

      console.log('ONU encontrada:', {
        serial: onu.serial_number || onu.serial || onu.sn,
        onu_id: onu.id || onu.onu_id || onu.unique_id,
        status: onu.status
      });

      // Obtener el onu_id para consultar el endpoint de tráfico/consumo
      // Revisar múltiples campos posibles donde pueda estar el ID
      const onuId = onu.id || 
                    onu.onu_id || 
                    onu.unique_id || 
                    onu.unique_external_id || 
                    onu.external_id ||
                    onu.onu_unique_id ||
                    onu.onu_external_id;
      
      if (!onuId) {
        console.error('ONU encontrada pero no tiene ID válido:', onu);
        return {
          success: false,
          message: 'ONU encontrada pero no se pudo obtener su ID para consultar el consumo'
        };
      }

      console.log('Obteniendo datos de tráfico/consumo para ONU ID:', onuId);

      // Hacer segunda petición para obtener el tráfico/consumo real
      const trafficEndpoint = `${smartOLTBaseUrl}/onu/traffic_graph/${onuId}`;
      console.log('  - Endpoint de tráfico:', trafficEndpoint);

      const trafficResponse = await fetch(trafficEndpoint, {
        method: 'GET',
        headers: {
          'X-Token': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Respuesta de tráfico SmartOLT:');
      console.log('  - Status:', trafficResponse.status);
      console.log('  - Status Text:', trafficResponse.statusText);

      let trafficData: any = null;

      if (trafficResponse.ok) {
        try {
          const trafficResponseData = await trafficResponse.json();
          console.log('Datos de tráfico obtenidos exitosamente');
          trafficData = trafficResponseData;
        } catch (error) {
          console.error('Error al parsear datos de tráfico:', error);
          // Continuar con datos de la ONU aunque no tengamos tráfico
        }
      } else {
        const errorText = await trafficResponse.text();
        console.error('Error al obtener tráfico:', trafficResponse.status, errorText);
        // Continuar con datos de la ONU aunque no tengamos tráfico
      }

      // Retornar los datos combinados: información de la ONU + datos de tráfico/consumo
      const consumptionData = {
        onu_info: onu, // Información completa de la ONU
        traffic: trafficData // Datos de tráfico/consumo
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

