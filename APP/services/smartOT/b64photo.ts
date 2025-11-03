import { config } from '../../configs/config';
import { userService } from '../services';

// Interface para la respuesta del servicio de conversión a Base64
export interface IBase64PhotoResult {
  success: boolean;
  data?: {
    image_base64: string; // Imagen en formato base64 con prefijo data URI
    content_type: string; // Tipo de contenido (image/png, image/jpeg, etc.)
    image_url: string; // URL original de la imagen
    timestamp: Date; // Timestamp de cuando se obtuvo la imagen
  };
  message: string;
}

// Clase de servicio para convertir imágenes de SmartOLT a Base64
export class Base64PhotoService {
  private static instance: Base64PhotoService;
  private configData: ReturnType<typeof config>;

  private constructor() {
    this.configData = config();
  }

  public static getInstance(): Base64PhotoService {
    if (!Base64PhotoService.instance) {
      Base64PhotoService.instance = new Base64PhotoService();
    }
    return Base64PhotoService.instance;
  }

  /**
   * Convertir una imagen del API de SmartOLT a Base64
   * @param imageUrl - URL completa de la imagen en el API de SmartOLT
   * @returns Resultado con la imagen en Base64
   */
  public async convertImageToBase64(imageUrl: string): Promise<IBase64PhotoResult> {
    try {
      const apiKey = this.configData.smartOLT.apiKey;

      if (!apiKey) {
        return {
          success: false,
          message: 'API Key de SmartOLT no configurada'
        };
      }

      // Validar que la URL no esté vacía
      if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        return {
          success: false,
          message: 'URL de imagen requerida'
        };
      }

      // Asegurar que la URL sea absoluta o relativa al baseUrl de SmartOLT
      let fullImageUrl = imageUrl.trim();
      
      // Si la URL no es absoluta, construirla con el baseUrl de SmartOLT
      if (!fullImageUrl.startsWith('http://') && !fullImageUrl.startsWith('https://')) {
        const smartOLTBaseUrl = this.configData.smartOLT.baseUrl || 'https://conectatayd.smartolt.com/api';
        // Eliminar /api duplicado si existe
        const baseUrl = smartOLTBaseUrl.endsWith('/api') 
          ? smartOLTBaseUrl 
          : `${smartOLTBaseUrl}${smartOLTBaseUrl.endsWith('/') ? '' : '/'}api`;
        
        fullImageUrl = fullImageUrl.startsWith('/')
          ? `${baseUrl}${fullImageUrl}`
          : `${baseUrl}/${fullImageUrl}`;
      }

      console.log('Convirtiendo imagen a Base64:');
      console.log('  - URL completa:', fullImageUrl);

      // Hacer la petición al API de SmartOLT para obtener la imagen
      const response = await fetch(fullImageUrl, {
        method: 'GET',
        headers: {
          'X-Token': apiKey,
          'Accept': 'image/*' // Aceptar cualquier tipo de imagen
        }
      });

      console.log('Respuesta del API:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Error desconocido';
        }

        console.error('Error al obtener imagen:', response.status, errorText);

        // Manejar errores específicos
        if (response.status === 403) {
          return {
            success: false,
            message: 'Límite de peticiones horario de SmartOLT alcanzado. Intenta nuevamente más tarde.'
          };
        }

        if (response.status === 404) {
          return {
            success: false,
            message: 'Imagen no encontrada en SmartOLT'
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
          message: `Error al obtener imagen de SmartOLT: ${response.status} ${response.statusText}`
        };
      }

      // Obtener el tipo de contenido de la respuesta
      const contentType = response.headers.get('content-type') || 'image/png';
      
      // Verificar que realmente sea una imagen
      if (!contentType.startsWith('image/')) {
        const textResponse = await response.text();
        console.error('La respuesta no es una imagen:', textResponse.substring(0, 200));
        return {
          success: false,
          message: `La respuesta no es una imagen. Content-Type: ${contentType}`
        };
      }

      // Convertir la imagen a Base64
      try {
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const base64DataUri = `data:${contentType};base64,${base64Image}`;

        console.log('Imagen convertida a Base64 exitosamente');
        console.log('  - Tamaño de imagen:', imageBuffer.byteLength, 'bytes');
        console.log('  - Tipo de contenido:', contentType);

        return {
          success: true,
          data: {
            image_base64: base64DataUri,
            content_type: contentType,
            image_url: fullImageUrl,
            timestamp: new Date()
          },
          message: 'Imagen convertida a Base64 exitosamente'
        };
      } catch (error) {
        console.error('Error al convertir imagen a Base64:', error);
        return {
          success: false,
          message: 'Error al procesar la imagen. Asegúrate de que sea un formato de imagen válido.'
        };
      }

    } catch (error) {
      console.error('Error al convertir imagen a Base64:', error);
      return {
        success: false,
        message: 'Error al conectar con el API de SmartOLT para obtener la imagen'
      };
    }
  }

  /**
   * Convertir imagen de gráfico de tráfico de ONU a Base64
   * Método auxiliar que construye la URL del gráfico automáticamente
   * @param uniqueExternalId - ID único externo de la ONU en SmartOLT
   * @param graphType - Tipo de gráfico: 'hourly', 'daily', 'weekly', 'monthly', 'yearly' (default: 'daily')
   * @returns Resultado con la imagen en Base64
   */
  public async convertTrafficGraphToBase64(
    uniqueExternalId: string,
    graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<IBase64PhotoResult> {
    try {
      // Validar uniqueExternalId
      if (!uniqueExternalId || typeof uniqueExternalId !== 'string' || uniqueExternalId.trim() === '') {
        return {
          success: false,
          message: 'unique_external_id es requerido'
        };
      }

      // Validar graphType
      const validGraphTypes = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
      const finalGraphType = validGraphTypes.includes(graphType) ? graphType : 'daily';

      // Construir la URL del gráfico de tráfico
      const smartOLTBaseUrl = this.configData.smartOLT.baseUrl || 'https://conectatayd.smartolt.com/api';
      const baseUrl = smartOLTBaseUrl.endsWith('/api') 
        ? smartOLTBaseUrl 
        : `${smartOLTBaseUrl}${smartOLTBaseUrl.endsWith('/') ? '' : '/'}api`;
      
      const imageUrl = `${baseUrl}/onu/get_onu_traffic_graph/${encodeURIComponent(uniqueExternalId)}/${finalGraphType}`;

      console.log('Construyendo URL de gráfico de tráfico:');
      console.log('  - unique_external_id:', uniqueExternalId);
      console.log('  - graph_type:', finalGraphType);
      console.log('  - URL:', imageUrl);

      // Usar el método principal para convertir la imagen
      return await this.convertImageToBase64(imageUrl);
    } catch (error) {
      console.error('Error al construir URL de gráfico de tráfico:', error);
      return {
        success: false,
        message: 'Error al construir la URL del gráfico de tráfico'
      };
    }
  }

  /**
   * Obtener imagen de gráfico de tráfico por ONU Serial Number y convertirla a Base64
   * El backend obtiene primero los detalles de la ONU, luego el gráfico y lo convierte a Base64
   * @param onuSn - Número de serie de la ONU
   * @param graphType - Tipo de gráfico: 'hourly', 'daily', 'weekly', 'monthly', 'yearly' (default: 'daily')
   * @returns Resultado con la imagen en Base64
   */
  public async getImageByONU(
    onuSn: string,
    graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<IBase64PhotoResult> {
    try {
      const apiKey = this.configData.smartOLT.apiKey;

      if (!apiKey) {
        return {
          success: false,
          message: 'API Key de SmartOLT no configurada'
        };
      }

      // Validar onuSn
      if (!onuSn || typeof onuSn !== 'string' || onuSn.trim() === '') {
        return {
          success: false,
          message: 'ONU Serial Number es requerido'
        };
      }

      // Validar graphType
      const validGraphTypes = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
      const finalGraphType = validGraphTypes.includes(graphType) ? graphType : 'daily';

      const smartOLTBaseUrl = this.configData.smartOLT.baseUrl || 'https://conectatayd.smartolt.com/api';
      const baseUrl = smartOLTBaseUrl.endsWith('/api') 
        ? smartOLTBaseUrl 
        : `${smartOLTBaseUrl}${smartOLTBaseUrl.endsWith('/') ? '' : '/'}api`;

      console.log('Obteniendo imagen por ONU Serial Number:');
      console.log('  - ONU_sn:', onuSn);
      console.log('  - graph_type:', finalGraphType);

      // PASO 1: Obtener los detalles de la ONU por su serial number
      const onuDetailsEndpoint = `${baseUrl}/onu/get_onus_details_by_sn/${encodeURIComponent(onuSn)}`;
      
      const onuResponse = await fetch(onuDetailsEndpoint, {
        method: 'GET',
        headers: {
          'X-Token': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!onuResponse.ok) {
        if (onuResponse.status === 404) {
          return {
            success: false,
            message: 'ONU no encontrada en SmartOLT'
          };
        }
        if (onuResponse.status === 403) {
          return {
            success: false,
            message: 'Límite de peticiones horario de SmartOLT alcanzado. Intenta nuevamente más tarde.'
          };
        }
        return {
          success: false,
          message: `Error al obtener detalles de la ONU: ${onuResponse.status} ${onuResponse.statusText}`
        };
      }

      const onuData: any = await onuResponse.json();
      
      // Extraer la ONU de la respuesta
      let onu: any = null;
      if (onuData.status === true && onuData.onus) {
        const onusList = Array.isArray(onuData.onus) ? onuData.onus : [onuData.onus];
        if (onusList.length > 0) {
          onu = onusList[0];
        }
      }

      if (!onu) {
        return {
          success: false,
          message: 'ONU no encontrada en SmartOLT'
        };
      }

      // Verificar que tenemos el unique_external_id necesario
      if (!onu.unique_external_id) {
        return {
          success: false,
          message: 'ONU encontrada pero no tiene unique_external_id para consultar el gráfico de tráfico'
        };
      }

      console.log('ONU encontrada:', {
        serial: onu.sn,
        unique_external_id: onu.unique_external_id
      });

      // PASO 2: Obtener el gráfico de tráfico y convertir a Base64
      return await this.convertTrafficGraphToBase64(onu.unique_external_id, finalGraphType);

    } catch (error) {
      console.error('Error al obtener imagen por ONU Serial Number:', error);
      return {
        success: false,
        message: 'Error al obtener imagen de la ONU desde SmartOLT'
      };
    }
  }

  /**
   * Obtener imagen de gráfico de tráfico por User ID y convertirla a Base64
   * El backend busca el usuario, obtiene su ONU_sn, luego obtiene el gráfico y lo convierte a Base64
   * @param userId - ID del usuario en la base de datos
   * @param graphType - Tipo de gráfico: 'hourly', 'daily', 'weekly', 'monthly', 'yearly' (default: 'daily')
   * @returns Resultado con la imagen en Base64
   */
  public async getImageByUserId(
    userId: string,
    graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<IBase64PhotoResult> {
    try {
      // Validar userId
      if (!userId || typeof userId !== 'string' || userId.trim() === '') {
        return {
          success: false,
          message: 'ID de usuario es requerido'
        };
      }

      // Buscar el usuario en la base de datos
      const user = await userService.findUserById(userId.trim());

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      // Convertir el documento de Mongoose a objeto plano
      const userObj = user.toObject ? user.toObject() : user;
      const onuSn = (userObj as any).ONU_sn || (userObj as any).onu_sn;

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

      // Validar graphType
      const validGraphTypes = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];
      const finalGraphType = validGraphTypes.includes(graphType) ? graphType : 'daily';

      // Usar el método getImageByONU para obtener la imagen
      return await this.getImageByONU(onuSn, finalGraphType);

    } catch (error) {
      console.error('Error al obtener imagen por User ID:', error);
      return {
        success: false,
        message: 'Error al obtener imagen del usuario'
      };
    }
  }
}

// Exportar instancia singleton del servicio
export const base64PhotoService = Base64PhotoService.getInstance();

