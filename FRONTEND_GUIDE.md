# Guía para Frontend - Consumo de SmartOLT

## 📡 Endpoints Disponibles

### 1. Obtener consumo por User ID
```
GET /api/smartolt/consumption/:userId
```

### 2. Obtener consumo por ONU Serial Number
```
GET /api/smartolt/consumption/onu/:onuSn
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
      // Datos de tráfico/consumo de SmartOLT
      // Estructura depende de la respuesta del API de SmartOLT
      // Puede incluir:
      // - download: bytes descargados
      // - upload: bytes subidos
      // - graphs: datos para gráficos
      // - timestamps: fechas de los datos
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
async function getConsumptionByUserId(userId) {
  try {
    const response = await fetch(`/api/smartolt/consumption/${userId}`, {
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
async function getConsumptionByONU(onuSn) {
  try {
    const response = await fetch(`/api/smartolt/consumption/onu/${onuSn}`, {
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
    const datos = await getConsumptionByUserId('user123');
    
    // Acceder a los datos
    console.log('Serial Number:', datos.onu_sn);
    console.log('ONU ID:', datos.onu_id);
    console.log('Estado:', datos.onu_info.status);
    console.log('Nombre:', datos.onu_info.name);
    console.log('Modelo:', datos.onu_info.model);
    console.log('Datos de tráfico:', datos.traffic);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

### Ejemplo con Axios

```javascript
import axios from 'axios';

// Obtener consumo por User ID
async function getConsumptionByUserId(userId) {
  try {
    const response = await axios.get(`/api/smartolt/consumption/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener consumo:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Obtener consumo por ONU Serial Number
async function getConsumptionByONU(onuSn) {
  try {
    const response = await axios.get(`/api/smartolt/consumption/onu/${onuSn}`);
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

      {/* Datos de tráfico/consumo */}
      <div className="traffic-data">
        <h2>Datos de Consumo/Tráfico</h2>
        {consumption.traffic ? (
          <pre>{JSON.stringify(consumption.traffic, null, 2)}</pre>
        ) : (
          <p>No hay datos de tráfico disponibles</p>
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
- **download**: Bytes descargados (puede variar según API de SmartOLT)
- **upload**: Bytes subidos (puede variar según API de SmartOLT)
- **graphs**: Datos para gráficos (si están disponibles)
- **timestamps**: Fechas de los datos (si están disponibles)

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

2. **Traffic Data**: La estructura de `traffic` depende de la respuesta del API de SmartOLT. Puede variar y necesitarás adaptar tu código según la estructura real.

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
      
      const response = await fetch(`/api/smartolt/consumption/${userId}`);
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

          <h2>Datos de Tráfico</h2>
          {consumption.traffic ? (
            <div className="traffic-display">
              <pre>{JSON.stringify(consumption.traffic, null, 2)}</pre>
            </div>
          ) : (
            <p>No hay datos de tráfico disponibles</p>
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

