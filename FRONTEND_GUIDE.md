# Guía para Frontend - Consumo de SmartOLT

## 📡 Endpoints Disponibles

### 1. Obtener consumo por User ID
```
GET /api/smartolt/consumption/:userId?graphType={tipo}
```

**Parámetros de Query:**
- `graphType` (opcional): Tipo de gráfico a obtener. Valores: `hourly`, `daily`, `weekly`, `monthly`, `yearly`. Default: `daily`

**Ejemplo:**
```
GET /api/smartolt/consumption/:userId?graphType=daily
GET /api/smartolt/consumption/:userId?graphType=hourly
```

### 2. Obtener consumo por ONU Serial Number
```
GET /api/smartolt/consumption/onu/:onuSn?graphType={tipo}
```

**Parámetros de Query:**
- `graphType` (opcional): Tipo de gráfico a obtener. Valores: `hourly`, `daily`, `weekly`, `monthly`, `yearly`. Default: `daily`

**Ejemplo:**
```
GET /api/smartolt/consumption/onu/:onuSn?graphType=weekly
```

---

## 📊 Estructura de Respuesta

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Consumo obtenido exitosamente",
  "data": {
    "onu_sn": "HWTC12345678",
    "onu_id": "12345",
    "onu_info": {
      "status": "online",
      "name": "Cliente XYZ",
      "model": "GPON-1234",
      "serial": "HWTC12345678",
      "mac": "AA:BB:CC:DD:EE:FF",
      "pon_port": "1/1/1",
      "olt_id": "olt-01",
      "zone": "Zona A",
      "details": {
        // Todos los demás campos de la ONU
      }
    },
    "traffic": {
      "graph_type": "daily",
      "unique_external_id": "GPON001FCFD0",
      "image_base64": "data:image/png;base64,iVBORw0KGgoAAAANS...",
      "content_type": "image/png",
      "image_url": "https://conectatayd.smartolt.com/api/onu/get_onu_traffic_graph/GPON001FCFD0/daily"
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "from_cache": false
  }
}
```

### Respuesta con Error (400/404/500)

```json
{
  "success": false,
  "message": "ONU no encontrada en SmartOLT"
}
```

---

## 💻 Ejemplos de Código Frontend

### JavaScript/TypeScript con Fetch API

```javascript
// Función para obtener consumo por User ID
async function getConsumptionByUserId(userId, graphType = 'daily') {
  try {
    const url = `/api/smartolt/consumption/${userId}${graphType ? `?graphType=${graphType}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Si necesitas autenticación, agrega el token aquí
        // 'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al obtener consumo:', error);
    throw error;
  }
}

// Función para obtener consumo por ONU Serial Number
async function getConsumptionByONU(onuSn, graphType = 'daily') {
  try {
    const url = `/api/smartolt/consumption/onu/${onuSn}${graphType ? `?graphType=${graphType}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error al obtener consumo:', error);
    throw error;
  }
}

// Uso en un componente React/Vue/etc.
async function mostrarConsumo() {
  try {
    // Obtener gráfico diario (default)
    const datos = await getConsumptionByUserId('user123', 'daily');
    
    // Acceder a los datos
    console.log('Serial Number:', datos.onu_sn);
    console.log('ONU ID:', datos.onu_id);
    console.log('Estado:', datos.onu_info.status);
    console.log('Nombre:', datos.onu_info.name);
    console.log('Modelo:', datos.onu_info.model);
    
    // Mostrar el gráfico de tráfico
    if (datos.traffic && datos.traffic.image_base64) {
      // La imagen está en base64, puedes usarla directamente en un <img>
      console.log('Gráfico disponible:', datos.traffic.graph_type);
      console.log('URL de la imagen:', datos.traffic.image_url);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Ejemplo con Axios

```javascript
import axios from 'axios';

// Obtener consumo por User ID
async function getConsumptionByUserId(userId, graphType = 'daily') {
  try {
    const url = `/api/smartolt/consumption/${userId}`;
    const params = graphType ? { graphType } : {};
    const response = await axios.get(url, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener consumo:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Obtener consumo por ONU Serial Number
async function getConsumptionByONU(onuSn, graphType = 'daily') {
  try {
    const url = `/api/smartolt/consumption/onu/${onuSn}`;
    const params = graphType ? { graphType } : {};
    const response = await axios.get(url, { params });
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener consumo:', error.response?.data?.message || error.message);
    throw error;
  }
}
```

---

## 🎨 Ejemplo de Componente React

```jsx
import React, { useState, useEffect } from 'react';

function ConsumptionDisplay({ userId }) {
  const [consumption, setConsumption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConsumption() {
      try {
        setLoading(true);
        const response = await fetch(`/api/smartolt/consumption/${userId}`);
        const result = await response.json();

        if (result.success) {
          setConsumption(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Error al cargar el consumo');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchConsumption();
    }
  }, [userId]);

  if (loading) return <div>Cargando consumo...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!consumption) return <div>No hay datos disponibles</div>;

  return (
    <div className="consumption-container">
      {/* Información de la ONU */}
      <div className="onu-info">
        <h2>Información de la ONU</h2>
        <p><strong>Serial Number:</strong> {consumption.onu_sn}</p>
        <p><strong>Estado:</strong> {consumption.onu_info.status}</p>
        <p><strong>Nombre:</strong> {consumption.onu_info.name || 'N/A'}</p>
        <p><strong>Modelo:</strong> {consumption.onu_info.model || 'N/A'}</p>
        <p><strong>MAC:</strong> {consumption.onu_info.mac || 'N/A'}</p>
        <p><strong>Puerto PON:</strong> {consumption.onu_info.pon_port || 'N/A'}</p>
        <p><strong>Zona:</strong> {consumption.onu_info.zone || 'N/A'}</p>
      </div>

      {/* Gráfico de tráfico/consumo */}
      <div className="traffic-data">
        <h2>Gráfico de Consumo/Tráfico</h2>
        {consumption.traffic && consumption.traffic.image_base64 ? (
          <div className="traffic-graph">
            <img 
              src={consumption.traffic.image_base64} 
              alt={`Gráfico de tráfico ${consumption.traffic.graph_type}`}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <p className="graph-type">
              Tipo de gráfico: {consumption.traffic.graph_type}
            </p>
          </div>
        ) : (
          <p>No hay gráfico de tráfico disponible</p>
        )}
      </div>

      {/* Información adicional */}
      <div className="meta-info">
        <p><strong>Última actualización:</strong> {new Date(consumption.timestamp).toLocaleString()}</p>
        {consumption.from_cache && (
          <p className="cache-indicator">⚠️ Datos desde caché</p>
        )}
      </div>
    </div>
  );
}

export default ConsumptionDisplay;
```

---

## 🎯 Campos Principales a Mostrar

### Información Básica de la ONU
- **onu_sn**: Serial Number de la ONU
- **onu_id**: ID interno de la ONU en SmartOLT

### Información Detallada (onu_info)
- **status**: Estado de la ONU (online/offline)
- **name**: Nombre del cliente/ONU
- **model**: Modelo de la ONU
- **serial**: Número de serie
- **mac**: Dirección MAC
- **pon_port**: Puerto PON
- **olt_id**: ID de la OLT
- **zone**: Zona geográfica

### Datos de Consumo/Tráfico (traffic)
- **graph_type**: Tipo de gráfico solicitado (`hourly`, `daily`, `weekly`, `monthly`, `yearly`)
- **unique_external_id**: ID único externo de la ONU usado para obtener el gráfico
- **image_base64**: Imagen PNG del gráfico en formato base64 (lista para usar en `<img src="...">`)
- **content_type**: Tipo de contenido (`image/png`)
- **image_url**: URL directa del endpoint de SmartOLT (requiere header `X-Token` si se usa directamente)

---

## ⚠️ Manejo de Errores

### Errores Comunes

1. **404 - Usuario/ONU no encontrado**
   ```json
   {
     "success": false,
     "message": "Usuario no encontrado"
   }
   ```

2. **403 - Límite de API alcanzado**
   ```json
   {
     "success": false,
     "message": "Límite de peticiones horario de SmartOLT alcanzado..."
   }
   ```

3. **500 - Error del servidor**
   ```json
   {
     "success": false,
     "message": "Error interno del servidor al consultar consumo"
   }
   ```

### Código de Manejo de Errores

```javascript
function handleApiError(error, response) {
  if (response) {
    switch (response.status) {
      case 404:
        return 'ONU o Usuario no encontrado';
      case 403:
        return 'Límite de peticiones alcanzado. Intenta más tarde.';
      case 401:
        return 'No autorizado. Verifica tus credenciales.';
      case 500:
        return 'Error del servidor. Contacta al administrador.';
      default:
        return 'Error desconocido';
    }
  }
  return 'Error de conexión. Verifica tu internet.';
}
```

---

## 📝 Notas Importantes

1. **Caché**: Los datos pueden venir del caché (`from_cache: true`). Esto ocurre cuando se alcanza el límite de peticiones de la API de SmartOLT.

2. **Traffic Graph**: Los datos de tráfico ahora son una imagen PNG del gráfico de consumo. La imagen viene en formato base64 y puede ser usada directamente en un elemento `<img>`. Puedes cambiar el tipo de gráfico usando el parámetro `graphType` en la query string.

3. **Timestamps**: Los timestamps están en formato ISO 8601 y pueden ser convertidos a formato local usando `new Date(timestamp).toLocaleString()`.

4. **Autenticación**: Si tu API requiere autenticación, asegúrate de incluir el token en los headers de las peticiones.

---

## 🔍 Debugging

Para ver la estructura completa de los datos:

```javascript
async function debugConsumption(userId) {
  const data = await getConsumptionByUserId(userId);
  console.log('Estructura completa:', data);
  console.log('Traffic structure:', data.traffic);
  console.log('ONU Info structure:', data.onu_info);
}
```

---

## 📌 Ejemplo Completo - Página de Consumo

```jsx
import React, { useState, useEffect } from 'react';

function ConsumptionPage() {
  const [userId, setUserId] = useState('');
  const [graphType, setGraphType] = useState('daily');
  const [consumption, setConsumption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!userId.trim()) {
      setError('Por favor ingresa un ID de usuario');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const url = `/api/smartolt/consumption/${userId}?graphType=${graphType}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setConsumption(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Error al obtener el consumo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consumption-page">
      <h1>Consumo de SmartOLT</h1>
      
      <div className="search-section">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Ingresa el ID del usuario"
        />
        <select 
          value={graphType} 
          onChange={(e) => setGraphType(e.target.value)}
          disabled={loading}
        >
          <option value="hourly">Por Hora</option>
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </select>
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar Consumo'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {consumption && (
        <div className="consumption-data">
          <h2>Información de la ONU</h2>
          <div className="info-grid">
            <div><strong>Serial:</strong> {consumption.onu_sn}</div>
            <div><strong>Estado:</strong> {consumption.onu_info.status}</div>
            <div><strong>Nombre:</strong> {consumption.onu_info.name || 'N/A'}</div>
            <div><strong>Modelo:</strong> {consumption.onu_info.model || 'N/A'}</div>
          </div>

          <h2>Gráfico de Tráfico</h2>
          {consumption.traffic && consumption.traffic.image_base64 ? (
            <div className="traffic-display">
              <img 
                src={consumption.traffic.image_base64} 
                alt={`Gráfico ${consumption.traffic.graph_type}`}
                style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}
              />
              <p><small>Tipo: {consumption.traffic.graph_type}</small></p>
            </div>
          ) : (
            <p>No hay gráfico de tráfico disponible</p>
          )}

          <div className="meta">
            <small>
              Última actualización: {new Date(consumption.timestamp).toLocaleString()}
              {consumption.from_cache && ' (desde caché)'}
            </small>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsumptionPage;
```

---

## 📱 Guía para Flutter/Dart - Ajustes del Frontend

### ⚠️ Cambios Necesarios en la Vista

Ya que el nuevo endpoint retorna una **imagen PNG** en lugar de datos numéricos, necesitas hacer estos ajustes:

### 1. **Ocultar o Ajustar Cards de Resumen**

Los cards que muestran "Total Usage", "Upload" y "Download" con valores "0.0 B" deben ser ocultados o mostrar "N/A" ya que estos datos numéricos no están disponibles en la nueva estructura:

```dart
// Opción 1: Ocultar completamente los cards
if (false) { // Cambiar a true si vuelves a tener datos numéricos
  // Cards de Total Usage, Upload, Download
}

// Opción 2: Mostrar "N/A" o indicador de que no está disponible
Widget buildSummaryCard(String title, String value) {
  return Card(
    child: Column(
      children: [
        Text(title),
        Text(value == "0.0 B" ? "N/A" : value), // Mostrar N/A si es 0
      ],
    ),
  );
}
```

### 2. **Mostrar la Imagen PNG del Gráfico**

En la sección "Usage Trend", reemplaza el gráfico generado dinámicamente con la imagen PNG del API:

```dart
import 'dart:convert';
import 'package:flutter/material.dart';

class NetworkUsageScreen extends StatefulWidget {
  @override
  _NetworkUsageScreenState createState() => _NetworkUsageScreenState();
}

class _NetworkUsageScreenState extends State<NetworkUsageScreen> {
  Map<String, dynamic>? consumptionData;
  bool isLoading = false;
  String selectedGraphType = 'hourly';

  // Tipos de gráfico disponibles
  final List<Map<String, String>> graphTypes = [
    {'value': 'hourly', 'label': 'Por Hora'},
    {'value': 'daily', 'label': 'Diario'},
    {'value': 'weekly', 'label': 'Semanal'},
    {'value': 'monthly', 'label': 'Mensual'},
    {'value': 'yearly', 'label': 'Anual'},
  ];

  Future<void> fetchConsumption(String userId) async {
    setState(() => isLoading = true);
    
    try {
      final url = Uri.parse(
        'http://18.191.163.61:3005/api/users/smartolt/consumption/$userId?graphType=$selectedGraphType'
      );
      
      final response = await http.get(url);
      
      if (response.statusCode == 200) {
        final result = json.decode(response.body);
        if (result['success'] == true) {
          setState(() => consumptionData = result['data']);
        }
      }
    } catch (e) {
      print('Error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Network Usage'),
        subtitle: Text('Monitor data consumption'),
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : consumptionData == null
              ? Center(child: Text('No hay datos disponibles'))
              : SingleChildScrollView(
                  child: Column(
                    children: [
                      // Selector de tipo de gráfico
                      Padding(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Text('Tipo de gráfico:'),
                            SizedBox(width: 16),
                            DropdownButton<String>(
                              value: selectedGraphType,
                              items: graphTypes.map((type) {
                                return DropdownMenuItem(
                                  value: type['value'],
                                  child: Text(type['label']!),
                                );
                              }).toList(),
                              onChanged: (value) {
                                setState(() => selectedGraphType = value!);
                                // Recargar datos con el nuevo tipo
                                fetchConsumption('userId'); // Reemplazar con el userId real
                              },
                            ),
                          ],
                        ),
                      ),

                      // Sección Usage Trend - Mostrar imagen PNG
                      if (consumptionData!['traffic'] != null &&
                          consumptionData!['traffic']['image_base64'] != null)
                        Card(
                          margin: EdgeInsets.all(16),
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Usage Trend',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    // Botón para cambiar tipo de gráfico
                                    Chip(
                                      label: Text(
                                        _getGraphTypeLabel(consumptionData!['traffic']['graph_type']),
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 16),
                                // Mostrar la imagen PNG del gráfico
                                Center(
                                  child: Image.memory(
                                    base64Decode(
                                      consumptionData!['traffic']['image_base64']
                                          .split(',')[1], // Remover el prefijo "data:image/png;base64,"
                                    ),
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        Card(
                          margin: EdgeInsets.all(16),
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(
                              child: Text('No hay gráfico disponible'),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
    );
  }

  String _getGraphTypeLabel(String type) {
    final labels = {
      'hourly': 'Por Hora',
      'daily': 'Diario',
      'weekly': 'Semanal',
      'monthly': 'Mensual',
      'yearly': 'Anual',
    };
    return labels[type] ?? type;
  }
}
```

### 3. **Ocultar Valores "Current" y "Maximum"**

Los valores "Upload Current: 0.00" y "Download Current: 731.42" que aparecen debajo del gráfico también deben ser ocultados o ajustados:

```dart
// Opción 1: Ocultar completamente
if (false) { // Cambiar a true si vuelves a tener estos datos
  // Widget con los valores Current/Maximum
}

// Opción 2: Mostrar mensaje informativo
Widget buildGraphLegend() {
  if (consumptionData?['traffic']?['image_base64'] != null) {
    return Text(
      'Gráfico de tráfico ${consumptionData!['traffic']['graph_type']}',
      style: TextStyle(fontSize: 12, color: Colors.grey),
    );
  }
  return SizedBox.shrink(); // Ocultar si no hay gráfico
}
```

### 4. **Estructura Completa del Widget de Gráfico**

```dart
Widget buildTrafficGraph() {
  final traffic = consumptionData?['traffic'];
  
  if (traffic == null || traffic['image_base64'] == null) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.bar_chart, size: 48, color: Colors.grey),
              SizedBox(height: 8),
              Text('No hay gráfico disponible'),
            ],
          ),
        ),
      ),
    );
  }

  // Decodificar la imagen base64
  String base64String = traffic['image_base64'];
  if (base64String.startsWith('data:')) {
    base64String = base64String.split(',')[1];
  }
  
  return Card(
    margin: EdgeInsets.all(16),
    child: Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Título y tipo de gráfico
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Usage Trend',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Chip(
                label: Text(_getGraphTypeLabel(traffic['graph_type'])),
              ),
            ],
          ),
          SizedBox(height: 16),
          
          // Imagen del gráfico
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.memory(
                base64Decode(base64String),
                fit: BoxFit.contain,
              ),
            ),
          ),
          
          SizedBox(height: 16),
          
          // Información adicional (opcional)
          Text(
            'Última actualización: ${_formatTimestamp(consumptionData!['timestamp'])}',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    ),
  );
}

String _formatTimestamp(String timestamp) {
  try {
    final date = DateTime.parse(timestamp);
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  } catch (e) {
    return timestamp;
  }
}
```

### 5. **Importaciones Necesarias**

Asegúrate de tener estas importaciones en tu archivo Dart:

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
```

### 📝 Resumen de Cambios

1. ✅ **Ocultar cards de resumen** (Total Usage, Upload, Download) que muestran "0.0 B"
2. ✅ **Reemplazar el gráfico dinámico** con `Image.memory()` usando `base64Decode()` de la imagen PNG
3. ✅ **Ocultar valores "Current" y "Maximum"** debajo del gráfico
4. ✅ **Agregar selector de tipo de gráfico** (hourly, daily, weekly, monthly, yearly)
5. ✅ **Manejar la imagen base64** correctamente (removiendo el prefijo "data:image/png;base64,")

### 🔍 Debugging

Si la imagen no se muestra, verifica:

```dart
print('Traffic data: ${consumptionData?['traffic']}');
print('Image base64 length: ${consumptionData?['traffic']?['image_base64']?.length}');
print('Graph type: ${consumptionData?['traffic']?['graph_type']}');
```

---

