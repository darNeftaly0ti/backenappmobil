# 🔐 Configuración de JWT - CarOnline Services

## 📋 Variables de Entorno

### **JWT_EXPIRES_IN**
Controla la duración del token JWT.

```env
# Ejemplos de configuración
JWT_EXPIRES_IN=1m      # 1 minuto (desarrollo/testing)
JWT_EXPIRES_IN=15m     # 15 minutos (testing)
JWT_EXPIRES_IN=1h      # 1 hora (producción)
JWT_EXPIRES_IN=24h     # 24 horas (desarrollo largo)
JWT_EXPIRES_IN=7d      # 7 días (muy largo)
JWT_EXPIRES_IN=3600s   # 3600 segundos (1 hora)
```

### **JWT_SECRET**
Clave secreta para firmar los tokens.

```env
JWT_SECRET=tu-secret-key-super-segura-cambiar-en-produccion
```

## 🚀 Configuración Rápida

### **1. Crear archivo `.env`**
```bash
# Copiar el archivo de ejemplo
cp env.example .env
```

### **2. Editar `.env`**
```env
# Para desarrollo (1 minuto)
JWT_EXPIRES_IN=1m

# Para testing (15 minutos)
JWT_EXPIRES_IN=15m

# Para producción (1 hora)
JWT_EXPIRES_IN=1h
```

### **3. Reiniciar servidor**
```bash
npx ts-node server.ts
```

## 🔍 Verificar Configuración

### **Endpoint de Debug**
```bash
# Después de hacer login
curl -H "Authorization: Bearer TU_TOKEN" \
     http://localhost:3005/api/auth/debug-token
```

### **Respuesta Esperada**
```json
{
  "success": true,
  "debug": {
    "timeLeftSeconds": 60,
    "config": {
      "jwtExpiresIn": "1m",
      "source": "ENV",
      "envVars": {
        "JWT_EXPIRES_IN": "1m"
      }
    }
  }
}
```

## 📊 Logs del Servidor

### **Al Iniciar**
```
🔧 Config cargado: {
  jwtExpiresIn: '1m',
  source: 'ENV'
}

🔧 JWTService inicializado con: {
  expiresIn: '1m',
  source: 'ENV'
}
```

### **Al Generar Token**
```
🔧 JWT Config: {
  expiresIn: '1m',
  secret: 'tu-secret-k...'
}
```

## 🎯 Recomendaciones

### **Desarrollo**
```env
JWT_EXPIRES_IN=1m    # Fácil testing
```

### **Testing**
```env
JWT_EXPIRES_IN=15m   # Balance entre testing y UX
```

### **Producción**
```env
JWT_EXPIRES_IN=1h    # Seguridad y UX balanceados
```

### **Aplicaciones Críticas**
```env
JWT_EXPIRES_IN=5m    # Máxima seguridad
```

## 🔧 Troubleshooting

### **Problema: Token dura más de lo esperado**
1. Verificar archivo `.env`
2. Reiniciar servidor
3. Verificar logs de configuración

### **Problema: Token expira muy rápido**
1. Aumentar `JWT_EXPIRES_IN` en `.env`
2. Reiniciar servidor

### **Problema: Configuración no se aplica**
1. Verificar que `.env` esté en la raíz del proyecto
2. Verificar sintaxis del archivo `.env`
3. Reiniciar servidor completamente
