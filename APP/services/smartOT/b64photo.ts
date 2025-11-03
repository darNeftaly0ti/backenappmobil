import { config } from '../../configs/config';
import { userService } from '../services';
import { createWorker, Worker } from 'tesseract.js';

// Interface para datos extraídos del gráfico de tráfico
export interface ITrafficGraphData {
  // Datos del gráfico
  graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  onuIdentifier?: string; // Ej: GPON001FCFDO, gpon-onu_1/6/2:2
  
  // Valores del eje Y (bits per second)
  yAxisValues?: string[]; // Ej: ["0.0", "0.2k", "0.4k", "0.6k", "0.8k", "1.0k", "1.2k"]
  yAxisLabel?: string; // Ej: "bits per second"
  
  // Horarios del eje X
  xAxisTimestamps?: string[]; // Ej: ["20:20", "20:30", "20:40", "20:50", "21:00", "21:10"]
  xAxisLabel?: string; // Descripción del eje X
  
  // Valores de Upload
  upload?: {
    current?: string; // Ej: "0.00"
    maximum?: string; // Ej: "0.00"
    unit?: string; // Ej: "bits per second", "k"
  };
  
  // Valores de Download
  download?: {
    current?: string; // Ej: "1.12"
    maximum?: string; // Ej: "1.14"
    unit?: string; // Ej: "k", "bits per second"
  };
  
  // Información adicional extraída
  extractedText?: string; // Todo el texto extraído de la imagen
}

// Interface para los metadatos de la imagen
export interface IImageMetadata {
  width?: number; // Ancho en píxeles
  height?: number; // Alto en píxeles
  format: string; // Formato de la imagen (png, jpeg, webp, etc.)
  hasAlpha?: boolean; // Si tiene canal alfa (transparencia)
  colorDepth?: number; // Profundidad de color en bits
}

// Interface para la respuesta del servicio de conversión a Base64
export interface IBase64PhotoResult {
  success: boolean;
  data?: {
    image_base64: string; // Imagen en formato base64 con prefijo data URI
    content_type: string; // Tipo de contenido (image/png, image/jpeg, etc.)
    format: string; // Formato de la imagen (png, jpeg, webp, etc.)
    size_bytes: number; // Tamaño del buffer de imagen en bytes
    base64_length: number; // Longitud del string Base64
    size_kb: number; // Tamaño en kilobytes (calculado)
    image_url: string; // URL original de la imagen
    timestamp: Date; // Timestamp de cuando se obtuvo la imagen
    metadata?: IImageMetadata; // Metadatos extraídos de la imagen (dimensiones, etc.)
    graphData?: ITrafficGraphData; // Datos extraídos del gráfico (valores, horarios, métricas)
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
   * Analizar el contenido de una imagen en Base64 y extraer sus metadatos
   * Lee los headers del archivo de imagen para obtener dimensiones y otra información
   * @param base64String - String Base64 de la imagen (con o sin prefijo data URI)
   * @returns Metadatos de la imagen (dimensiones, formato, etc.)
   */
  private analyzeImageContent(base64String: string): IImageMetadata | null {
    try {
      // Remover el prefijo data URI si existe
      const base64Data = base64String.includes(',') 
        ? base64String.split(',')[1] 
        : base64String;

      // Decodificar Base64 a Buffer
      const imageBuffer = Buffer.from(base64Data, 'base64');

      if (imageBuffer.length < 8) {
        return null; // Buffer muy pequeño, no es una imagen válida
      }

      // Leer los primeros bytes para identificar el formato
      const header = imageBuffer.subarray(0, 8);
      
      let format = 'unknown';
      let width: number | undefined;
      let height: number | undefined;
      let hasAlpha: boolean | undefined;
      let colorDepth: number | undefined;

      // Detectar formato PNG (signatura: 89 50 4E 47 0D 0A 1A 0A)
      if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
        format = 'png';
        
        // En PNG, las dimensiones están en el chunk IHDR (bytes 16-23 después del header)
        if (imageBuffer.length >= 24) {
          width = imageBuffer.readUInt32BE(16);
          height = imageBuffer.readUInt32BE(20);
          // Byte 24 contiene depth y color type
          if (imageBuffer.length >= 25) {
            colorDepth = imageBuffer[24];
            hasAlpha = (imageBuffer[25] & 0x04) !== 0; // Bit 2 indica si hay canal alfa
          }
        }
      }
      // Detectar formato JPEG (signatura: FF D8)
      else if (header[0] === 0xFF && header[1] === 0xD8) {
        format = 'jpeg';
        
        // En JPEG, las dimensiones están en los marcadores SOF (Start of Frame)
        let offset = 2;
        while (offset < imageBuffer.length - 8) {
          // Buscar marcador (FF seguido de un byte que no sea FF)
          if (imageBuffer[offset] === 0xFF && imageBuffer[offset + 1] !== 0xFF) {
            const marker = imageBuffer[offset + 1];
            
            // SOF0-SOF3, SOF5-SOF7 (marcadores de inicio de frame)
            if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xC7)) {
              if (offset + 8 < imageBuffer.length) {
                height = imageBuffer.readUInt16BE(offset + 5);
                width = imageBuffer.readUInt16BE(offset + 7);
                colorDepth = imageBuffer[offset + 9]; // Bits por componente
                break;
              }
            }
            
            // Avanzar al siguiente marcador
            const segmentLength = imageBuffer.readUInt16BE(offset + 2);
            offset += 2 + segmentLength;
          } else {
            offset++;
          }
        }
      }
      // Detectar formato GIF (signatura: GIF87a o GIF89a)
      else if (
        (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) ||
        (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x39)
      ) {
        format = 'gif';
        if (imageBuffer.length >= 10) {
          width = imageBuffer.readUInt16LE(6);
          height = imageBuffer.readUInt16LE(8);
        }
      }
      // Detectar formato WebP
      else if (
        header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
        imageBuffer.length >= 12 &&
        imageBuffer.subarray(8, 12).toString() === 'WEBP'
      ) {
        format = 'webp';
        
        // WebP puede ser VP8, VP8L o VP8X
        if (imageBuffer.length >= 25) {
          const chunkType = imageBuffer.subarray(12, 16).toString();
          
          if (chunkType === 'VP8 ') {
            // VP8 simple
            if (imageBuffer.length >= 30) {
              width = imageBuffer.readUInt16LE(26) & 0x3FFF;
              height = imageBuffer.readUInt16LE(28) & 0x3FFF;
            }
          } else if (chunkType === 'VP8L') {
            // VP8L lossless
            const bits = imageBuffer.readUInt32LE(21);
            width = (bits & 0x3FFF) + 1;
            height = ((bits >> 14) & 0x3FFF) + 1;
          }
        }
      }

      const metadata: IImageMetadata = {
        format: format,
      };

      if (width !== undefined) metadata.width = width;
      if (height !== undefined) metadata.height = height;
      if (hasAlpha !== undefined) metadata.hasAlpha = hasAlpha;
      if (colorDepth !== undefined) metadata.colorDepth = colorDepth;

      return metadata;
    } catch (error) {
      console.error('Error al analizar contenido de la imagen:', error);
      return null;
    }
  }

  /**
   * Extraer datos del gráfico de tráfico de la imagen Base64 usando OCR (Tesseract.js)
   * Analiza la imagen para extraer valores numéricos, horarios y métricas de forma precisa
   * @param base64String - String Base64 de la imagen del gráfico
   * @param graphType - Tipo de gráfico (hourly, daily, weekly, monthly, yearly)
   * @returns Datos extraídos del gráfico
   */
  private async extractGraphDataFromImage(
    base64String: string,
    graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  ): Promise<ITrafficGraphData> {
    let worker: Worker | null = null;
    
    try {
      const graphData: ITrafficGraphData = {
        graphType: graphType,
      };

      // Remover el prefijo data URI si existe
      const base64Data = base64String.includes(',') 
        ? base64String.split(',')[1] 
        : base64String;

      console.log('Iniciando OCR para extraer datos del gráfico...');

      // Crear worker de Tesseract
      worker = await createWorker('eng', 1, {
        logger: (m) => {
          // Solo mostrar progreso importante
          if (m.status === 'recognizing text') {
            console.log(`OCR Progreso: ${m.progress?.toFixed(2) || 0}%`);
          }
        }
      });

      // Configurar parámetros para mejor reconocimiento de números y texto
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789:.-kKMGTPEZYmbitspersecondHourlyDailyWeeklyMonthlyYearlyUploadDownloadCurrentMaximum',
      });

      // Crear buffer desde Base64
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Realizar OCR en la imagen
      const { data: { text } } = await worker.recognize(imageBuffer);

      console.log('OCR completado. Texto extraído (primeros 500 caracteres):');
      console.log(text.substring(0, 500));

      // Guardar todo el texto extraído
      graphData.extractedText = text;

      // Extraer identificador ONU
      const onuPatterns = [
        /gpon[_\s-]?onu[_\s:/-]?[\d/]+:?\d*/i,
        /GPON\d+/i,
        /HWTC\d+/i,
        /ONU[:\s]+([A-Z0-9]+)/i
      ];

      for (const pattern of onuPatterns) {
        const match = text.match(pattern);
        if (match) {
          graphData.onuIdentifier = match[0].trim().replace(/\s+/g, '-');
          break;
        }
      }

      // Extraer horarios (formato HH:MM o H:MM)
      const timeRegex = /\b([0-2]?[0-9]):([0-5][0-9])\b/g;
      const times: string[] = [];
      let match;
      while ((match = timeRegex.exec(text)) !== null) {
        const hour = match[1].padStart(2, '0');
        const minute = match[2];
        times.push(`${hour}:${minute}`);
      }
      if (times.length > 0) {
        // Eliminar duplicados y ordenar
        graphData.xAxisTimestamps = [...new Set(times)].sort().slice(0, 20);
      }

      // Extraer valores del eje Y (números con k, M, G, etc.)
      const yAxisPatterns = [
        /\b(\d+\.?\d*)\s*[kmKMG]\b/gi,
        /\b(\d+\.?\d*)\s*k\b/gi,
        /\b(\d+\.?\d*)\s*M\b/gi
      ];

      const yAxisValues: string[] = [];
      for (const pattern of yAxisPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          yAxisValues.push(...matches.map(m => m.trim()));
        }
      }
      if (yAxisValues.length > 0) {
        graphData.yAxisValues = [...new Set(yAxisValues)].slice(0, 20);
      }

      // Extraer label del eje Y
      if (text.match(/bits\s*per\s*second|bps/i)) {
        graphData.yAxisLabel = 'bits per second';
      } else if (text.match(/bytes\s*per\s*second|Bps/i)) {
        graphData.yAxisLabel = 'bytes per second';
      }

      // Extraer valores de Upload
      const uploadPatterns = [
        /upload.*?current[:\s]*(\d+\.?\d*)\s*.*?maximum[:\s]*(\d+\.?\d*)/i,
        /upload.*?(\d+\.?\d*)\s*.*?(\d+\.?\d*)/i,
        /Upload\s*Current[:\s]*(\d+\.?\d*).*?Maximum[:\s]*(\d+\.?\d*)/i
      ];

      for (const pattern of uploadPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[2]) {
          graphData.upload = {
            current: match[1],
            maximum: match[2],
            unit: 'bits per second'
          };
          break;
        }
      }

      // Extraer valores de Download
      const downloadPatterns = [
        /download.*?current[:\s]*(\d+\.?\d*)\s*.*?maximum[:\s]*(\d+\.?\d*)/i,
        /download.*?(\d+\.?\d*)\s*.*?(\d+\.?\d*)/i,
        /Download\s*Current[:\s]*(\d+\.?\d*).*?Maximum[:\s]*(\d+\.?\d*)/i
      ];

      for (const pattern of downloadPatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[2]) {
          graphData.download = {
            current: match[1],
            maximum: match[2],
            unit: 'bits per second'
          };
          break;
        }
      }

      // Si no encontramos upload/download con el patrón completo, buscar valores individuales
      if (!graphData.upload) {
        const uploadCurrentMatch = text.match(/upload.*?current[:\s]*(\d+\.?\d*)/i);
        const uploadMaxMatch = text.match(/upload.*?maximum[:\s]*(\d+\.?\d*)/i);
        if (uploadCurrentMatch || uploadMaxMatch) {
          graphData.upload = {
            current: uploadCurrentMatch?.[1] || '0.00',
            maximum: uploadMaxMatch?.[1] || '0.00',
            unit: 'bits per second'
          };
        }
      }

      if (!graphData.download) {
        const downloadCurrentMatch = text.match(/download.*?current[:\s]*(\d+\.?\d*)/i);
        const downloadMaxMatch = text.match(/download.*?maximum[:\s]*(\d+\.?\d*)/i);
        if (downloadCurrentMatch || downloadMaxMatch) {
          graphData.download = {
            current: downloadCurrentMatch?.[1] || '0.00',
            maximum: downloadMaxMatch?.[1] || '0.00',
            unit: 'bits per second'
          };
        }
      }

      console.log('Datos extraídos del gráfico con OCR:');
      console.log('  - Identificador ONU:', graphData.onuIdentifier || 'No encontrado');
      console.log('  - Horarios encontrados:', graphData.xAxisTimestamps?.length || 0);
      console.log('  - Valores eje Y:', graphData.yAxisValues?.length || 0);
      console.log('  - Upload:', graphData.upload ? `${graphData.upload.current} / ${graphData.upload.maximum}` : 'No encontrado');
      console.log('  - Download:', graphData.download ? `${graphData.download.current} / ${graphData.download.maximum}` : 'No encontrado');

      return graphData;
    } catch (error) {
      console.error('Error al extraer datos del gráfico con OCR:', error);
      // Retornar datos básicos si hay error
      return {
        graphType: graphType,
        extractedText: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      // Limpiar worker
      if (worker) {
        await worker.terminate();
        console.log('Worker de OCR terminado');
      }
    }
  }

  /**
   * Convertir una imagen del API de SmartOLT a Base64
   * @param imageUrl - URL completa de la imagen en el API de SmartOLT
   * @param extractData - Si extraer datos del gráfico además de la imagen (default: true)
   * @param graphType - Tipo de gráfico para extracción de datos (opcional)
   * @returns Resultado con la imagen en Base64 y datos extraídos
   */
  public async convertImageToBase64(
    imageUrl: string,
    extractData: boolean = false,
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

        // Extraer información adicional de la imagen
        const sizeBytes = imageBuffer.byteLength;
        const base64Length = base64Image.length;
        const sizeKb = Math.round((sizeBytes / 1024) * 100) / 100; // Redondear a 2 decimales
        
        // Extraer formato del content-type (png, jpeg, webp, etc.)
        const format = contentType.split('/')[1]?.split(';')[0]?.trim() || 'unknown';

        // Analizar el contenido de la imagen para extraer metadatos (dimensiones, etc.)
        const metadata = this.analyzeImageContent(base64DataUri);

        console.log('Imagen convertida a Base64 exitosamente');
        console.log('  - Tamaño de imagen:', sizeBytes, 'bytes (', sizeKb, 'KB)');
        console.log('  - Longitud Base64:', base64Length, 'caracteres');
        console.log('  - Formato:', format);
        console.log('  - Tipo de contenido:', contentType);
        if (metadata) {
          console.log('  - Dimensiones:', metadata.width, 'x', metadata.height, 'píxeles');
          if (metadata.colorDepth) console.log('  - Profundidad de color:', metadata.colorDepth, 'bits');
          if (metadata.hasAlpha !== undefined) console.log('  - Canal alfa:', metadata.hasAlpha ? 'Sí' : 'No');
        }

        return {
          success: true,
          data: {
            image_base64: base64DataUri,
            content_type: contentType,
            format: format,
            size_bytes: sizeBytes,
            base64_length: base64Length,
            size_kb: sizeKb,
            image_url: fullImageUrl,
            timestamp: new Date(),
            metadata: metadata || undefined
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
    graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    extractData: boolean = true
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

      // Usar el método principal para convertir la imagen y extraer datos
      return await this.convertImageToBase64(imageUrl, extractData, finalGraphType);
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
    graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    extractData: boolean = true
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

      // PASO 2: Obtener el gráfico de tráfico y convertir a Base64 con extracción de datos
      return await this.convertTrafficGraphToBase64(onu.unique_external_id, finalGraphType, extractData);

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
    graphType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    extractData: boolean = true
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

      // Usar el método getImageByONU para obtener la imagen con extracción de datos
      return await this.getImageByONU(onuSn, finalGraphType, extractData);

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

