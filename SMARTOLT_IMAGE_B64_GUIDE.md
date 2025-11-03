# Guía para Frontend - Extracción de Datos de Gráficos SmartOLT con OCR

## 📋 Descripción

Esta guía explica cómo usar los endpoints del backend para obtener **imágenes de gráficos de consumo/tráfico de SmartOLT en formato Base64** y **extraer los datos numéricos** (métricas, horarios, valores) usando **OCR (Tesseract.js)** para crear un UI intuitivo.

## 🔍 Tecnología: OCR con Tesseract.js

El backend utiliza **Tesseract.js** (Reconocimiento Óptico de Caracteres) para extraer texto y datos numéricos de forma precisa directamente de las imágenes PNG del gráfico. Esto permite:

- ✅ **Extraer horarios exactos** del eje X (ej: "20:20", "20:30", "21:00")
- ✅ **Extraer valores numéricos** de Upload y Download (actuales y máximos)
- ✅ **Identificar el ONU** del gráfico (ej: "GPON001FCFD0", "gpon-onu_1/6/2:2")
- ✅ **Obtener valores del eje Y** (ej: "0.2k", "1.0k", "1.2k")
- ✅ **Detectar unidades y etiquetas** ("bits per second", etc.)

El OCR procesa la imagen PNG y extrae todo el texto visible, luego el backend parsea ese texto para identificar y estructurar los datos numéricos.

## 🎯 Objetivo

El API de SmartOLT solo devuelve imágenes PNG del gráfico, **NO proporciona datos numéricos directamente**. El backend:
1. ✅ Obtiene la imagen del gráfico de SmartOLT
2. ✅ La convierte a Base64
3. ✅ **Usa OCR (Tesseract.js) para extraer los datos numéricos de la imagen** de forma precisa (valores, horarios, métricas)
4. ✅ Devuelve tanto la imagen Base64 como los datos extraídos estructurados

El frontend puede usar estos datos para crear una **interfaz de usuario intuitiva** que muestre:
- Horarios del gráfico (extraídos del eje X)
- Valores de Upload y Download (actuales y máximos)
- Valores del eje Y (bits per second)
- Identificador ONU
- Datos estructurados y listos para mostrar en cards, tablas, etc.

---

## 📡 Endpoints Disponibles

### 1. Obtener imagen y datos por User ID

```
GET /api/users/smartolt/image/user/:userId?graphType={tipo}
```

**Parámetros:**
- `userId` (ruta): ID del usuario en la base de datos
- `graphType` (query, opcional): Tipo de gráfico. Valores: `hourly`, `daily`, `weekly`, `monthly`, `yearly`. Default: `daily`

**Ejemplo:**
```
GET /api/users/smartolt/image/user/12345?graphType=daily
GET /api/users/smartolt/image/user/12345?graphType=hourly
```

### 2. Obtener imagen y datos por ONU Serial Number

```
GET /api/users/smartolt/image/onu/:onuSn?graphType={tipo}
```

**Parámetros:**
- `onuSn` (ruta): Serial Number de la ONU (ej: `HWTC12345678`, `GPON001FCFD0`)
- `graphType` (query, opcional): Tipo de gráfico. Valores: `hourly`, `daily`, `weekly`, `monthly`, `yearly`. Default: `daily`

**Ejemplo:**
```
GET /api/users/smartolt/image/onu/HWTC12345678?graphType=daily
GET /api/users/smartolt/image/onu/GPON001FCFD0?graphType=weekly
```

---

## 📊 Estructura de Respuesta

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Imagen convertida a Base64 exitosamente",
  "data": {
    "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "content_type": "image/png",
    "format": "png",
    "size_bytes": 45678,
    "base64_length": 60904,
    "size_kb": 44.61,
    "image_url": "https://conectatayd.smartolt.com/api/onu/get_onu_traffic_graph/GPON001FCFD0/daily",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "metadata": {
      "width": 1200,
      "height": 800,
      "format": "png",
      "colorDepth": 8,
      "hasAlpha": false
    },
    "graphData": {
      "graphType": "hourly",
      "onuIdentifier": "gpon-onu_1/6/2:2",
      "yAxisValues": ["0.0", "0.2k", "0.4k", "0.6k", "0.8k", "1.0k", "1.2k"],
      "yAxisLabel": "bits per second",
      "xAxisTimestamps": ["20:20", "20:30", "20:40", "20:50", "21:00", "21:10"],
      "upload": {
        "current": "0.00",
        "maximum": "0.00",
        "unit": "bits per second"
      },
      "download": {
        "current": "1.12",
        "maximum": "1.14",
        "unit": "bits per second"
      },
      "extractedText": "..."
    }
  }
}
```

### Campos Importantes para el Frontend

#### `image_base64`
- La imagen completa del gráfico en Base64
- Usar en `<img src={image_base64} />` para mostrar la imagen original

#### `graphData` (Datos Extraídos del Gráfico usando OCR)
Esta es la información clave que necesitas para crear un UI intuitivo. Los datos se extraen automáticamente usando **OCR (Tesseract.js)** de la imagen PNG:

- **`graphType`**: Tipo de gráfico (`hourly`, `daily`, `weekly`, `monthly`, `yearly`)
- **`onuIdentifier`**: Identificador de la ONU extraído de la imagen (ej: `"gpon-onu_1/6/2:2"`, `"GPON001FCFD0"`)
- **`yAxisValues`**: Array de valores del eje Y extraídos (ej: `["0.0", "0.2k", "0.4k", "1.0k"]`)
- **`yAxisLabel`**: Etiqueta del eje Y detectada (ej: `"bits per second"`)
- **`xAxisTimestamps`**: Array de horarios extraídos del eje X (ej: `["20:20", "20:30", "21:00"]`)
- **`upload.current`**: Valor actual de upload extraído (ej: `"0.00"`)
- **`upload.maximum`**: Valor máximo de upload extraído (ej: `"0.00"`)
- **`download.current`**: Valor actual de download extraído (ej: `"1.12"`)
- **`download.maximum`**: Valor máximo de download extraído (ej: `"1.14"`)
- **`upload.unit`** / **`download.unit`**: Unidad de medida detectada (ej: `"bits per second"`)
- **`extractedText`**: Todo el texto extraído por OCR (útil para debugging o extracción adicional)

---

## 💻 Ejemplos de Código Frontend

### Ejemplo 1: Mostrar Datos Extraídos en UI Intuitiva

```javascript
/**
 * Obtener imagen y datos extraídos del gráfico
 */
async function getTrafficData(userId, graphType = 'daily') {
  try {
    const response = await fetch(
      `/api/users/smartolt/image/user/${userId}?graphType=${graphType}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.data.graphData) {
      const { graphData } = result.data;
      
      // Usar los datos extraídos para crear UI
      return {
        image: result.data.image_base64, // Para mostrar la imagen original
        data: {
          // Datos para mostrar en UI
          timestamps: graphData.xAxisTimestamps || [],
          uploadCurrent: graphData.upload?.current || '0',
          uploadMax: graphData.upload?.maximum || '0',
          downloadCurrent: graphData.download?.current || '0',
          downloadMax: graphData.download?.maximum || '0',
          onuId: graphData.onuIdentifier || 'N/A',
          yAxisValues: graphData.yAxisValues || [],
          unit: graphData.upload?.unit || 'bits per second'
        }
      };
    } else {
      throw new Error(result.message || 'No se pudieron extraer datos');
    }
  } catch (error) {
    console.error('Error al obtener datos:', error);
    throw error;
  }
}

// Uso
const trafficData = await getTrafficData('12345', 'hourly');

// Mostrar en UI
console.log('Horarios:', trafficData.data.timestamps);
console.log('Upload actual:', trafficData.data.uploadCurrent);
console.log('Download actual:', trafficData.data.downloadCurrent);
console.log('Download máximo:', trafficData.data.downloadMax);
```

### Ejemplo 2: Componente React con UI Intuitiva

```jsx
import React, { useState, useEffect } from 'react';

function TrafficGraphDisplay({ userId, graphType = 'daily' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/users/smartolt/image/user/${userId}?graphType=${graphType}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setImageBase64(result.data.image_base64);
          setGraphData(result.data.graphData);
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, graphType]);

  if (loading) return <div>Cargando datos...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!graphData) return <div>No hay datos disponibles</div>;

  return (
    <div className="traffic-graph-container">
      <h2>Consumo de Red - {graphType}</h2>
      
      {/* Mostrar identificador ONU */}
      {graphData.onuIdentifier && (
        <div className="onu-info">
          <strong>ONU:</strong> {graphData.onuIdentifier}
        </div>
      )}

      {/* Mostrar métricas principales */}
      <div className="metrics-grid">
        {/* Upload */}
        <div className="metric-card upload">
          <h3>Upload</h3>
          <div className="metric-value">
            <span className="current">{graphData.upload?.current || '0.00'}</span>
            <span className="unit">{graphData.upload?.unit || 'bps'}</span>
          </div>
          <div className="metric-max">
            Máximo: {graphData.upload?.maximum || '0.00'}
          </div>
        </div>

        {/* Download */}
        <div className="metric-card download">
          <h3>Download</h3>
          <div className="metric-value">
            <span className="current">{graphData.download?.current || '0.00'}</span>
            <span className="unit">{graphData.download?.unit || 'bps'}</span>
          </div>
          <div className="metric-max">
            Máximo: {graphData.download?.maximum || '0.00'}
          </div>
        </div>
      </div>

      {/* Mostrar horarios del gráfico */}
      {graphData.xAxisTimestamps && graphData.xAxisTimestamps.length > 0 && (
        <div className="timestamps">
          <h3>Horarios del Gráfico</h3>
          <div className="timestamps-list">
            {graphData.xAxisTimestamps.map((timestamp, index) => (
              <span key={index} className="timestamp-badge">
                {timestamp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar valores del eje Y */}
      {graphData.yAxisValues && graphData.yAxisValues.length > 0 && (
        <div className="y-axis-values">
          <h3>Rango de Valores ({graphData.yAxisLabel})</h3>
          <div className="values-list">
            {graphData.yAxisValues.map((value, index) => (
              <span key={index} className="value-badge">
                {value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar imagen original (opcional) */}
      {imageBase64 && (
        <div className="original-image">
          <h3>Gráfico Original</h3>
          <img 
            src={imageBase64} 
            alt={`Gráfico de tráfico ${graphType}`}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      )}
    </div>
  );
}

export default TrafficGraphDisplay;
```

### Ejemplo 3: Mostrar Datos en Tabla

```jsx
function TrafficDataTable({ graphData }) {
  if (!graphData) return null;

  return (
    <table className="traffic-data-table">
      <thead>
        <tr>
          <th>Métrica</th>
          <th>Actual</th>
          <th>Máximo</th>
          <th>Unidad</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Upload</strong></td>
          <td>{graphData.upload?.current || '0.00'}</td>
          <td>{graphData.upload?.maximum || '0.00'}</td>
          <td>{graphData.upload?.unit || 'bps'}</td>
        </tr>
        <tr>
          <td><strong>Download</strong></td>
          <td>{graphData.download?.current || '0.00'}</td>
          <td>{graphData.download?.maximum || '0.00'}</td>
          <td>{graphData.download?.unit || 'bps'}</td>
        </tr>
      </tbody>
    </table>
  );
}
```

### Ejemplo 4: Cards con Métricas Visuales

```jsx
function MetricsCards({ graphData }) {
  if (!graphData) return null;

  // Convertir valores a números para cálculos
  const downloadCurrent = parseFloat(graphData.download?.current || '0');
  const downloadMax = parseFloat(graphData.download?.maximum || '0');
  const uploadCurrent = parseFloat(graphData.upload?.current || '0');
  const uploadMax = parseFloat(graphData.upload?.maximum || '0');

  // Calcular porcentajes
  const downloadPercentage = downloadMax > 0 ? (downloadCurrent / downloadMax) * 100 : 0;
  const uploadPercentage = uploadMax > 0 ? (uploadCurrent / uploadMax) * 100 : 0;

  return (
    <div className="metrics-cards">
      <div className="card download-card">
        <div className="card-header">
          <h3>Download</h3>
          <span className="identifier">{graphData.onuIdentifier}</span>
        </div>
        <div className="card-body">
          <div className="main-value">
            {downloadCurrent.toFixed(2)} <span className="unit">kbps</span>
          </div>
          <div className="max-value">
            Máximo: {downloadMax.toFixed(2)} kbps
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill download" 
              style={{ width: `${downloadPercentage}%` }}
            />
          </div>
          <div className="percentage">{downloadPercentage.toFixed(1)}%</div>
        </div>
      </div>

      <div className="card upload-card">
        <div className="card-header">
          <h3>Upload</h3>
        </div>
        <div className="card-body">
          <div className="main-value">
            {uploadCurrent.toFixed(2)} <span className="unit">kbps</span>
          </div>
          <div className="max-value">
            Máximo: {uploadMax.toFixed(2)} kbps
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill upload" 
              style={{ width: `${uploadPercentage}%` }}
            />
          </div>
          <div className="percentage">{uploadPercentage.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
```

### Ejemplo 5: Timeline con Horarios

```jsx
function TimeLineDisplay({ timestamps }) {
  if (!timestamps || timestamps.length === 0) return null;

  return (
    <div className="timeline">
      <h3>Horarios del Gráfico</h3>
      <div className="timeline-track">
        {timestamps.map((timestamp, index) => (
          <div key={index} className="timeline-marker">
            <div className="marker-dot" />
            <div className="marker-label">{timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 CSS para UI Intuitiva

```css
.traffic-graph-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.metric-card {
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric-card.upload {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.metric-card.download {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
}

.metric-value {
  font-size: 2.5em;
  font-weight: bold;
  margin: 10px 0;
}

.metric-value .unit {
  font-size: 0.5em;
  opacity: 0.8;
}

.metric-max {
  font-size: 0.9em;
  opacity: 0.9;
}

.timestamps-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.timestamp-badge {
  padding: 5px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.9em;
}

.values-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.value-badge {
  padding: 4px 8px;
  background: #e3f2fd;
  border-radius: 4px;
  font-size: 0.85em;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: rgba(255,255,255,0.3);
  border-radius: 5px;
  margin: 10px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
}

.timeline-track {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 20px 0;
}

.timeline-track::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #ddd;
}

.timeline-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: #2196f3;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 1;
}

.marker-label {
  margin-top: 5px;
  font-size: 0.85em;
  color: #666;
}
```

---

## ⚠️ Notas Importantes

1. **Extracción de Datos con OCR**: El backend usa **Tesseract.js** (OCR - Reconocimiento Óptico de Caracteres) para extraer texto y datos numéricos de forma precisa de las imágenes PNG del gráfico. Esto permite obtener:
   - Horarios exactos del gráfico
   - Valores numéricos (Upload/Download)
   - Identificador ONU
   - Valores del eje Y
   - Métricas y estadísticas

2. **Precisión del OCR**: La precisión depende de la calidad de la imagen. El backend está configurado para:
   - Reconocer números, horarios y unidades (k, M, G, etc.)
   - Filtrar caracteres irrelevantes con whitelist
   - Manejar diferentes formatos de texto en los gráficos

3. **Datos Disponibles**: Si el OCR no puede extraer todos los datos, el campo `graphData` puede contener solo información parcial. Siempre verifica que los datos existan antes de usarlos.

4. **Fallback**: Si no se pueden extraer datos, el campo `graphData` puede estar vacío o contener solo información básica. Siempre verifica que los datos existan antes de usarlos.

5. **Imagen Original**: Siempre puedes usar `image_base64` para mostrar la imagen original del gráfico como respaldo, incluso si el OCR no pudo extraer todos los datos.

---

## 📝 Ejemplo Completo de Uso

```javascript
async function displayTrafficData(userId, graphType = 'daily') {
  try {
    const response = await fetch(
      `/api/users/smartolt/image/user/${userId}?graphType=${graphType}`
    );
    
    const result = await response.json();

    if (result.success && result.data.graphData) {
      const { graphData } = result.data;

      // Crear UI con los datos extraídos
      console.log('=== Datos del Gráfico ===');
      console.log('ONU:', graphData.onuIdentifier);
      console.log('Tipo:', graphData.graphType);
      console.log('Horarios:', graphData.xAxisTimestamps);
      console.log('Upload:', {
        actual: graphData.upload?.current,
        máximo: graphData.upload?.maximum,
        unidad: graphData.upload?.unit
      });
      console.log('Download:', {
        actual: graphData.download?.current,
        máximo: graphData.download?.maximum,
        unidad: graphData.download?.unit
      });
      console.log('Valores Y:', graphData.yAxisValues);

      // Usar estos datos para crear tu UI personalizada
      return result.data;
    } else {
      // Fallback: mostrar solo la imagen si no hay datos
      console.warn('No se pudieron extraer datos, mostrando solo imagen');
      return result.data;
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

**Última actualización**: Enero 2024
