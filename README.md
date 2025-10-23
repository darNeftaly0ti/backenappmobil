# CarOnline Services API

API REST para gestionar información de vehículos, desarrollado con Node.js, TypeScript, Express y MongoDB.

## 🚀 Características

- **Base de datos**: MongoDB con colección `cars` en la base de datos `main_webappcars`
- **Arquitectura**: Patrón MVC (Model-View-Controller)
- **Patrón de diseño**: Singleton para el servicio de base de datos
- **Respuestas**: Formato JSON estandarizado
- **CORS**: Habilitado para desarrollo frontend
- **Autenticación**: JWT con Google OAuth y MFA (Duo Security)
- **Permisos**: Sistema de roles y permisos granular
- **Rate Limiting**: Protección contra ataques de fuerza bruta

## 📋 Endpoints Disponibles

### 1. Información del API
```
GET /
```
Retorna información general del API y endpoints disponibles.

### 2. Health Check
```
GET /api/health
```
Verifica el estado del servidor.

### 3. Vehículos Agrupados por Marca
```
GET /api/vehicles
```
Retorna todos los vehículos agrupados por marca.

**Respuesta:**
```json
{
  "success": true,
  "message": "Vehículos obtenidos exitosamente",
  "data": {
    "Toyota": [
      {
        "id": 1,
        "marca": "Toyota",
        "modelo": "Camry",
        "año": "2024",
        "precio": "Q195,000",
        "estado": "Disponible",
        "kilometraje": "15,000 km",
        "color": "Blanco",
        "image": "https://images.unsplash.com/..."
      }
    ],
    "Honda": [...]
  },
  "totalBrands": 25,
  "totalVehicles": 100
}
```

### 4. Vehículos por Marca Específica
```
GET /api/vehicles/brand/:marca
```
Retorna todos los vehículos de una marca específica.

**Ejemplo:** `GET /api/vehicles/brand/Toyota`

### 5. Marcas Disponibles
```
GET /api/brands
```
Retorna la lista de todas las marcas disponibles.

**Respuesta:**
```json
{
  "success": true,
  "message": "Marcas obtenidas exitosamente",
  "data": ["Audi", "BMW", "Honda", "Toyota", ...],
  "total": 25
}
```

### 6. Estadísticas por Marca
```
GET /api/stats
```
Retorna estadísticas de vehículos por marca (total, disponibles, vendidos, en mantenimiento).

## 🔐 Sistema de Autenticación y Permisos

### **Autenticación**
- **Login normal**: `POST /api/auth/login`
- **Registro**: `POST /api/auth/register`
- **Login con Google**: `POST /api/auth/google/login`
- **Verificar token**: `GET /api/auth/debug-token`

### **Sistema de Permisos**
- **Obtener permisos del usuario**: `GET /api/permissions/user`
- **Verificar permiso específico**: `GET /api/permissions/check/:permission`
- **Todos los permisos (admin)**: `GET /api/permissions/all`

### **Roles y Permisos**
| Rol | Permisos |
|-----|----------|
| **admin** | `create:vehicle`, `read:vehicle`, `update:vehicle`, `delete:vehicle`, `publish:vehicle` |
| **user** | `create:vehicle`, `read:vehicle` |

### **Rutas Protegidas**
- **Crear vehículo**: `POST /api/vehicles` (requiere `create:vehicle`)
- **Editar vehículo**: `PUT /api/vehicles/:id` (requiere `update:vehicle`)
- **Eliminar vehículo**: `DELETE /api/vehicles/:id` (requiere `delete:vehicle`)

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd carsonline-services-BK
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:
```env
MONGO_URI=mongodb://localhost:27017
PORT=3005
NODE_ENV=development

# JWT Configuration
JWT_SECRET=tu-secret-key-super-segura-cambiar-en-produccion
JWT_EXPIRES_IN=1m

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Duo Security (Opcional - para MFA)
DUO_CLIENT_ID=tu_duo_client_id
DUO_CLIENT_SECRET=tu_duo_client_secret
DUO_API_HOST=api-xxxxx.duosecurity.com
```

**📋 Archivo de ejemplo:** Usa `env.example` como referencia.

### 4. Insertar datos de prueba
```bash
npm run insert-cars
```

### 5. Ejecutar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📊 Estructura de Datos

### Vehículo
```typescript
interface Vehicle {
  id: number;           // ID único del vehículo
  marca: string;        // Marca del vehículo
  modelo: string;       // Modelo del vehículo
  año: string;          // Año del vehículo
  precio: string;       // Precio en Quetzales
  estado: string;       // Disponible, Vendido, En mantenimiento
  kilometraje: string;  // Kilometraje del vehículo
  color: string;        // Color del vehículo
  image: string;        // URL de la imagen
}
```

## 🏗️ Arquitectura del Proyecto

```
carsonline-services-BK/
├── APP/
│   ├── configs/
│   │   └── config.ts          # Configuración de la aplicación
│   ├── controllers/
│   │   └── controller.ts      # Controladores de la API
│   ├── routers/
│   │   └── router.ts          # Definición de rutas
│   └── services/
│       └── services.ts        # Lógica de negocio y acceso a datos
├── proces/
│   └── insertcars.ts          # Script para insertar datos de prueba
├── server.ts                  # Servidor principal
├── package.json
└── README.md
```

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run build` - Compila el proyecto TypeScript
- `npm run insert-cars` - Ejecuta el script para insertar vehículos de prueba

## 🌐 URLs del API

- **Servidor local**: `http://localhost:3005`
- **API base**: `http://localhost:3005/api`
- **Documentación**: `http://localhost:3005/api`

## 📝 Ejemplos de Uso

### Frontend (JavaScript)
```javascript
// Obtener todos los vehículos agrupados por marca
fetch('http://localhost:3005/api/vehicles')
  .then(response => response.json())
  .then(data => {
    console.log('Vehículos:', data.data);
    console.log('Total de marcas:', data.totalBrands);
  });

// Obtener vehículos de Toyota
fetch('http://localhost:3005/api/vehicles/brand/Toyota')
  .then(response => response.json())
  .then(data => {
    console.log('Vehículos Toyota:', data.data.vehicles);
  });

// Obtener marcas disponibles
fetch('http://localhost:3005/api/brands')
  .then(response => response.json())
  .then(data => {
    console.log('Marcas:', data.data);
  });
```

### Frontend (React)
```jsx
import { useState, useEffect } from 'react';

function VehicleList() {
  const [vehicles, setVehicles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3005/api/vehicles')
      .then(response => response.json())
      .then(data => {
        setVehicles(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      {Object.entries(vehicles).map(([marca, cars]) => (
        <div key={marca}>
          <h2>{marca}</h2>
          {cars.map(car => (
            <div key={car.id}>
              <h3>{car.modelo}</h3>
              <p>Precio: {car.precio}</p>
              <p>Estado: {car.estado}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## 🎯 **Implementación de Permisos en Frontend**

### **1. Hook para Permisos (React)**
```typescript
import { useState, useEffect } from 'react';

interface UserPermissions {
  role: string;
  permissions: string[];
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/permissions/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPermissions(data.data);
        }
      } catch (error) {
        console.error('Error al obtener permisos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  return { permissions, loading };
};
```

### **2. Componente de Botones Condicionales**
```typescript
import React from 'react';
import { usePermissions } from './hooks/usePermissions';

const VehicleCard = ({ vehicle }) => {
  const { permissions, loading } = usePermissions();

  if (loading) {
    return <div>Cargando permisos...</div>;
  }

  return (
    <div className="vehicle-card">
      <h3>{vehicle.name}</h3>
      <p>Precio: {vehicle.price}</p>
      
      {/* Botón Ver Detalles - Siempre visible */}
      <button className="btn-primary">Ver Detalles</button>
      
      {/* Botón Agregar - Solo si tiene permiso create:vehicle */}
      {permissions?.canCreate && (
        <button className="btn-success">Agregar Vehículo</button>
      )}
      
      {/* Botones de Editar y Eliminar - Solo admin */}
      {permissions?.canUpdate && (
        <button className="btn-warning">Editar</button>
      )}
      
      {permissions?.canDelete && (
        <button className="btn-danger">Eliminar</button>
      )}
    </div>
  );
};
```

### **3. Protección de Rutas**
```typescript
import { Navigate } from 'react-router-dom';
import { usePermissions } from './hooks/usePermissions';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { permissions, loading } = usePermissions();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!permissions?.permissions.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

// Uso:
<ProtectedRoute requiredPermission="update:vehicle">
  <EditVehiclePage />
</ProtectedRoute>
```

### **4. Interfaz de Usuario según Permisos**

#### **👤 Usuario Normal (role: user)**
- ✅ **Ver Detalles** - Siempre visible
- ✅ **Agregar Vehículo** - Botón visible
- ❌ **Editar** - Botón oculto
- ❌ **Eliminar** - Botón oculto

#### **👑 Administrador (role: admin)**
- ✅ **Ver Detalles** - Siempre visible
- ✅ **Agregar Vehículo** - Botón visible
- ✅ **Editar** - Botón visible
- ✅ **Eliminar** - Botón visible

### **5. Ejemplo de Uso Completo**
```typescript
// En tu componente principal
import { usePermissions } from './hooks/usePermissions';

function Dashboard() {
  const { permissions, loading } = usePermissions();

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Mostrar botones según permisos */}
      {permissions?.canCreate && (
        <button onClick={() => navigate('/add-vehicle')}>
          Agregar Vehículo
        </button>
      )}
      
      {permissions?.canUpdate && (
        <button onClick={() => navigate('/edit-vehicle')}>
          Editar Vehículos
        </button>
      )}
      
      {permissions?.canDelete && (
        <button onClick={() => navigate('/delete-vehicle')}>
          Eliminar Vehículos
        </button>
      )}
    </div>
  );
}
```

### **6. Endpoints de Permisos**
```bash
# Obtener permisos del usuario (requiere MFA)
GET /api/permissions/user
Authorization: Bearer <token>

# Obtener permisos SIN verificar MFA (para testing)
GET /api/permissions/user-no-mfa
Authorization: Bearer <token>

# Verificar permiso específico
GET /api/permissions/check/create:vehicle
Authorization: Bearer <token>

# Respuesta de permisos
{
  "success": true,
  "data": {
    "role": "user",
    "permissions": ["create:vehicle", "read:vehicle"],
    "canCreate": true,
    "canRead": true,
    "canUpdate": false,
    "canDelete": false,
    "canPublish": false
  }
}
```

### **7. Solución al Error "mfa_required"**

Si recibes el error `mfa_required`, significa que:
1. **El token JWT ha expirado** (configuración de 1 minuto)
2. **El token no tiene el campo `mfa: true`**

**Soluciones:**

#### **Opción 1: Usar endpoint sin MFA (Recomendado para testing)**
```typescript
// En tu frontend, cambiar de:
const response = await fetch('/api/permissions/user', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// A:
const response = await fetch('/api/permissions/user-no-mfa', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### **Opción 2: Aumentar duración del JWT**
```env
# En tu archivo .env
JWT_EXPIRES_IN=1h  # Cambiar de 1m a 1h
```

#### **Opción 3: Verificar token antes de usar**
```typescript
// Verificar si el token es válido
const debugResponse = await fetch('/api/auth/debug-token', {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (debugResponse.ok) {
  // Token válido, proceder con permisos
  const permissionsResponse = await fetch('/api/permissions/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
} else {
  // Token expirado, hacer login nuevamente
  // Redirigir al login
}
```

## 🚨 Manejo de Errores

El API retorna errores en formato JSON:

```json
{
  "success": false,
  "message": "Descripción del error",
  "error": "Detalles del error (solo en desarrollo)"
}
```

## 📈 Estado del Proyecto

- ✅ API REST funcional
- ✅ Conexión a MongoDB
- ✅ Agrupación por marca
- ✅ Endpoints documentados
- ✅ Manejo de errores
- ✅ CORS habilitado
- ✅ TypeScript configurado

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
