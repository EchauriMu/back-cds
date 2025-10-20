# ⚠️ Manejo de Errores y Bitácora

## 📋 Tabla de Contenidos

1. [Flujo General de Errores](#flujo-general)
2. [Estrategia de Optimización de Bitácora](#estrategia)
3. [Centralización de Manejo de Errores](#centralizacion)
4. [Tipos de Errores](#tipos-errores)
5. [Estructura de Error en Bitácora](#estructura)
6. [Ejemplos Completos](#ejemplos)
7. [Diagrama de Flujo](#diagrama)
8. [Mejores Prácticas](#mejores-practicas)

---

## <a name="flujo-general"></a>🔄 1. Flujo General de Errores

### Reglas Fundamentales

#### 1️⃣ **Si un query falla → establecer `finalRes = true`**

```javascript
catch (error) {
  data.messageUSR = 'Error al consultar base de datos';
  data.messageDEV = error.message;
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
  bitacora.finalRes = true; // ← CRÍTICO: detener ejecución
  bitacora.success = false;
  
  return bitacora;
}
```

#### 2️⃣ **El error debe contener causa técnica y mensaje usuario**

```javascript
// Error completo
data.messageUSR = 'No se pudieron obtener las promociones'; // Usuario final
data.messageDEV = 'Connection timeout: MongoDB not responding after 10s'; // Desarrollador

// Información adicional en desarrollo
if (process.env.NODE_ENV === 'development') {
  data.stack = error.stack;
  data.errorCode = error.code;
  data.errorDetails = error.toString();
}
```

#### 3️⃣ **Si la operación fue exitosa → resultado en `dataRes`**

```javascript
// Éxito
data.dataRes = promociones; // ← Resultado aquí
data.countDataRes = promociones.length;
data.messageUSR = 'Promociones obtenidas exitosamente';
data.messageDEV = 'Query ejecutado correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 200, true);
bitacora.success = true;
```

---

## <a name="estrategia"></a>📊 2. Estrategia de Optimización de Bitácora

### Tabla de Estrategias

| Caso | Acción | Registros en Bitácora | `finalRes` |
|------|--------|----------------------|------------|
| **Flujo completo y correcto** | Guardar solo un registro final consolidado | 1 registro | `false` |
| **Flujo con error** | Error como último evento + inyectar en tabla de errores + notificar | 1+ registros | `true` |

### 2.1. Flujo Completo y Correcto

**Características:**
- ✅ Todas las operaciones exitosas
- ✅ UN SOLO registro en `bitacora.data[]`
- ✅ Respuesta consolidada con todos los datos
- ✅ `bitacora.success = true`
- ✅ `bitacora.finalRes = false` (o sin establecer)

**Ejemplo:**

```javascript
// Método Local (GetFilters)
async function GetFiltersPromocionesMethod(bitacora, params, ...) {
  let data = DATA();
  
  try {
    // Ejecutar query
    const promociones = await ZTPromociones.find(filter).lean();
    
    // ============================================
    // UN SOLO REGISTRO CON TODA LA RESPUESTA
    // ============================================
    data.dataRes = promociones;
    data.countDataRes = promociones.length;
    data.messageUSR = `Promociones obtenidas: ${promociones.length}`;
    data.messageDEV = `Filtros aplicados correctamente`;
    
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    // finalRes NO se establece (o queda en false)
    
    return bitacora;
    
  } catch (error) {
    // ... manejo de error
  }
}
```

**Resultado:**

```json
{
  "success": true,
  "status": 200,
  "processType": "GetFilters",
  "data": [
    {
      "process": "Obtener promociones (GetFilters)",
      "status": 200,
      "principal": true,
      "dataRes": [
        { "IdPromoOK": "PROMO001", "Titulo": "..." },
        { "IdPromoOK": "PROMO002", "Titulo": "..." }
      ],
      "countDataRes": 2,
      "messageUSR": "Promociones obtenidas: 2",
      "messageDEV": "Filtros aplicados correctamente"
    }
  ],
  "finalRes": false
}
```

---

### 2.2. Flujo con Error

**Características:**
- ❌ Error en alguna operación
- ❌ Múltiples registros posibles en `bitacora.data[]`
- ❌ Error como ÚLTIMO registro
- ❌ `bitacora.success = false`
- ❌ `bitacora.finalRes = true` (detener ejecución)
- ⚠️ Inyectar en tabla de errores (TODO)
- 📧 Notificar usuario/desarrollador (TODO)

**Ejemplo:**

```javascript
// Método Local con Error
async function GetFiltersPromocionesMethod(bitacora, params, ...) {
  let data = DATA();
  
  try {
    // Ejecutar query
    const promociones = await ZTPromociones.find(filter).lean();
    
    // Simular error
    throw new Error('Connection timeout');
    
  } catch (error) {
    // ============================================
    // ERROR COMO ÚLTIMO REGISTRO
    // ============================================
    data.messageUSR = 'Error al obtener promociones';
    data.messageDEV = `Error en query MongoDB: ${error.message}`;
    
    if (process.env.NODE_ENV === 'development') {
      data.stack = error.stack;
    }
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true; // ← Detener ejecución
    
    // TODO: Inyectar en tabla de errores
    // await logErrorToDatabase({ error, bitacora, ... });
    
    // TODO: Notificar al usuario/desarrollador
    // await notifyError({ user, error, ... });
    
    console.error('[GetFilters] ❌ Error:', error.message);
    
    return bitacora;
  }
}
```

**Resultado:**

```json
{
  "success": false,
  "status": 500,
  "processType": "GetFilters",
  "data": [
    {
      "process": "Obtener promociones (GetFilters)",
      "status": 500,
      "principal": true,
      "dataRes": [],
      "messageUSR": "Error al obtener promociones",
      "messageDEV": "Error en query MongoDB: Connection timeout",
      "stack": "Error: Connection timeout\n    at ..."
    }
  ],
  "finalRes": true
}
```

---

## <a name="centralizacion"></a>🎯 3. Centralización de Manejo de Errores

### El Servicio Principal centraliza el manejo de errores

```javascript
async function crudZTPromociones(req) {
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // Validaciones...
    
    // ============================================
    // EJECUTAR MÉTODO LOCAL
    // ============================================
    switch (ProcessType) {
      case 'GetFilters':
        bitacora = await GetFiltersPromocionesMethod(bitacora, params, ...)
          .then((bitacora) => {
            if (!bitacora.success) {
              bitacora.finalRes = true;
              throw bitacora; // ← Lanzar para capturar en catch
            }
            return bitacora;
          });
        break;
    }
    
    return OK(bitacora);
    
  } catch (error) {
    // ============================================
    // CENTRALIZACIÓN: MANEJO DE ERRORES
    // ============================================
    
    // CASO 1: Error ya manejado (finalRes = true)
    if (error.finalRes === true || bitacora.finalRes === true) {
      // El error ya fue tratado en método local
      console.error('[SERVICE] ⚠️  Error manejado por método local');
      
      // Si el error es bitácora completa, usarla
      if (error.data && Array.isArray(error.data)) {
        return FAIL(error);
      }
      
      return FAIL(bitacora);
    }
    
    // CASO 2: Error inesperado (finalRes = false o undefined)
    let errorData = DATA();
    errorData.process = 'Error inesperado en servicio principal';
    errorData.processType = 'UnhandledError';
    errorData.messageUSR = 'Error crítico. Contacte al administrador.';
    errorData.messageDEV = `Error no capturado: ${error.message}`;
    
    if (process.env.NODE_ENV === 'development') {
      errorData.stack = error.stack;
    }
    
    // Registrar como último en bitácora
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
    bitacora.finalRes = true;
    bitacora.success = false;
    
    console.error('[SERVICE] ❌ ERROR INESPERADO:', error.message);
    
    return FAIL(bitacora);
  }
}
```

---

## <a name="tipos-errores"></a>🔴 4. Tipos de Errores

### Clasificación de Errores

| Tipo | Descripción | `finalRes` | Manejado por | Acción |
|------|-------------|-----------|--------------|--------|
| **Error de Validación** | Parámetros faltantes/inválidos | `true` | Servicio Principal | Retornar 400 |
| **Error de BD (manejado)** | Query falló, capturado por método local | `true` | Método Local | Retornar 500 |
| **Error Inesperado** | Error no capturado | `true` | Catch del Servicio | Retornar 500 |
| **Error de Negocio** | Regla de negocio violada | `true` | Método Local | Retornar 400/422 |

### 4.1. Error de Validación

```javascript
// Servicio Principal
if (!ProcessType) {
  data.process = 'Validación de parámetros';
  data.processType = 'ValidationError';
  data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
  data.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.finalRes = true;
  
  return FAIL(bitacora);
}
```

### 4.2. Error de BD (manejado)

```javascript
// Método Local
try {
  const result = await ZTPromociones.find(filter).lean();
} catch (error) {
  data.messageUSR = 'Error al consultar promociones';
  data.messageDEV = `MongoDB error: ${error.message}`;
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
  bitacora.finalRes = true; // ← Error manejado
  
  return bitacora;
}
```

### 4.3. Error Inesperado

```javascript
// Catch del Servicio Principal
catch (error) {
  if (error.finalRes === true) {
    // Ya manejado
    return FAIL(error);
  }
  
  // Error inesperado
  let errorData = DATA();
  errorData.messageUSR = 'Error crítico';
  errorData.messageDEV = error.message;
  
  bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
  bitacora.finalRes = true;
  
  return FAIL(bitacora);
}
```

### 4.4. Error de Negocio

```javascript
// Método Local
if (promocionesData.length === 0) {
  data.messageUSR = 'No se puede crear promociones con array vacío';
  data.messageDEV = 'Business rule: array promociones must have at least 1 item';
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 422, true);
  bitacora.finalRes = true;
  
  return bitacora;
}
```

---

## <a name="estructura"></a>📦 5. Estructura de Error en Bitácora

### Estructura Completa

```javascript
{
  // Campos de bitácora
  "success": false,
  "status": 500,
  "process": "Obtener promociones (GetFilters)",
  "processType": "GetFilters",
  "messageUSR": "Error al obtener promociones",
  "messageDEV": "MongoDB connection timeout",
  "countData": 1,
  "countDataRes": 0,
  "dbServer": "MongoDB",
  "loggedUser": "jlopezm",
  "finalRes": true, // ← Detiene ejecución
  
  // Array de datos
  "data": [
    {
      "success": false,
      "status": 500,
      "process": "Obtener promociones (GetFilters)",
      "processType": "GetFilters",
      "principal": true,
      "messageUSR": "Error al obtener promociones",
      "messageDEV": "MongoDB connection timeout",
      "dataRes": [],
      "countDataRes": 0,
      "method": "POST",
      "api": "/api/ztpromociones/crudPromociones",
      
      // Información adicional en desarrollo
      "stack": "Error: Connection timeout\n    at ZTPromociones.find...",
      "errorCode": "ETIMEDOUT",
      "errorDetails": {
        "name": "MongoTimeoutError",
        "code": "ETIMEDOUT"
      }
    }
  ]
}
```

### Campos Obligatorios en Error

| Campo | Tipo | Descripción | Obligatorio |
|-------|------|-------------|-------------|
| `success` | boolean | `false` en errores | ✅ |
| `status` | number | Código HTTP (400, 500, etc.) | ✅ |
| `messageUSR` | string | Mensaje amigable al usuario | ✅ |
| `messageDEV` | string | Mensaje técnico con detalles | ✅ |
| `finalRes` | boolean | `true` para detener ejecución | ✅ |
| `process` | string | Descripción del proceso | ✅ |
| `processType` | string | Tipo de operación | ✅ |
| `dataRes` | array | Array vacío o con datos parciales | ✅ |
| `stack` | string | Stack trace (solo desarrollo) | ⚠️ |

---

## <a name="ejemplos"></a>💡 6. Ejemplos Completos

### Ejemplo 1: Error de Validación

```javascript
// Servicio Principal
async function crudZTPromociones(req) {
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    const params = req.req?.query || {};
    const { ProcessType, LoggedUser } = params;
    
    // ============================================
    // ERROR DE VALIDACIÓN
    // ============================================
    if (!ProcessType) {
      data.process = 'Validación de parámetros';
      data.processType = 'ValidationError';
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV = 'ProcessType es requerido. Valores: GetFilters, AddMany, UpdateMany, DeleteMany';
      data.api = '/api/ztpromociones/crudPromociones';
      data.method = req.req?.method || 'POST';
      
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      
      return FAIL(bitacora);
    }
    
    // ... resto del código
    
  } catch (error) {
    // ...
  }
}
```

**Respuesta:**

```json
{
  "success": false,
  "status": 400,
  "data": [
    {
      "process": "Validación de parámetros",
      "processType": "ValidationError",
      "status": 400,
      "messageUSR": "Falta parámetro obligatorio: ProcessType",
      "messageDEV": "ProcessType es requerido. Valores: GetFilters, AddMany, UpdateMany, DeleteMany",
      "api": "/api/ztpromociones/crudPromociones",
      "method": "POST"
    }
  ],
  "finalRes": true
}
```

---

### Ejemplo 2: Error de BD en Método Local

```javascript
// Método Local
async function GetFiltersPromocionesMethod(bitacora, params, ...) {
  let data = DATA();
  
  data.process = 'Obtener promociones (GetFilters)';
  data.processType = bitacora.processType;
  data.loggedUser = bitacora.loggedUser;
  data.principal = true;
  
  try {
    // ============================================
    // ERROR EN QUERY
    // ============================================
    const promociones = await ZTPromociones.find(filter).lean();
    // Simular error de conexión
    throw new Error('Connection refused: MongoDB server not available');
    
  } catch (error) {
    // ============================================
    // REGISTRAR ERROR
    // ============================================
    data.messageUSR = 'No se pudieron obtener las promociones';
    data.messageDEV = `Error MongoDB: ${error.message}`;
    
    if (process.env.NODE_ENV === 'development') {
      data.stack = error.stack;
      data.errorCode = error.code;
    }
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true; // ← Detener
    
    console.error('[GetFilters] ❌ Error:', error.message);
    
    // TODO: Inyectar en tabla de errores
    // await ErrorLog.create({
    //   timestamp: new Date(),
    //   user: bitacora.loggedUser,
    //   process: bitacora.processType,
    //   error: error.message,
    //   stack: error.stack,
    //   severity: 'HIGH'
    // });
    
    // TODO: Notificar
    // await sendNotification({
    //   to: bitacora.loggedUser,
    //   subject: 'Error en GetFilters',
    //   body: data.messageUSR
    // });
    
    return bitacora;
  }
}
```

**Servicio Principal captura el error:**

```javascript
// Servicio Principal
try {
  switch (ProcessType) {
    case 'GetFilters':
      bitacora = await GetFiltersPromocionesMethod(bitacora, ...)
        .then((bitacora) => {
          if (!bitacora.success) {
            bitacora.finalRes = true;
            throw bitacora; // ← Lanza bitácora con error
          }
          return bitacora;
        });
      break;
  }
  
  return OK(bitacora);
  
} catch (error) {
  // ============================================
  // CASO 1: Error ya manejado (finalRes = true)
  // ============================================
  if (error.finalRes === true || bitacora.finalRes === true) {
    console.error('[SERVICE] ⚠️  Error manejado por método local');
    
    if (error.data && Array.isArray(error.data)) {
      return FAIL(error); // ← Retorna bitácora con error
    }
    
    return FAIL(bitacora);
  }
  
  // ... error inesperado
}
```

**Respuesta:**

```json
{
  "success": false,
  "status": 500,
  "processType": "GetFilters",
  "loggedUser": "jlopezm",
  "data": [
    {
      "process": "Obtener promociones (GetFilters)",
      "processType": "GetFilters",
      "status": 500,
      "principal": true,
      "messageUSR": "No se pudieron obtener las promociones",
      "messageDEV": "Error MongoDB: Connection refused: MongoDB server not available",
      "stack": "Error: Connection refused...",
      "errorCode": "ECONNREFUSED"
    }
  ],
  "finalRes": true
}
```

---

### Ejemplo 3: Error Inesperado

```javascript
// Servicio Principal
catch (error) {
  // ============================================
  // CASO 2: Error inesperado
  // ============================================
  if (error.finalRes !== true && bitacora.finalRes !== true) {
    let errorData = DATA();
    errorData.process = 'Error inesperado en servicio principal';
    errorData.processType = 'UnhandledError';
    errorData.messageUSR = 'Error crítico al procesar solicitud';
    errorData.messageDEV = `Error no capturado: ${error.message}`;
    errorData.api = '/api/ztpromociones/crudPromociones';
    errorData.method = req.req?.method || 'POST';
    
    if (process.env.NODE_ENV === 'development') {
      errorData.stack = error.stack;
      errorData.errorDetails = {
        name: error.name,
        code: error.code
      };
    }
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
    bitacora.finalRes = true;
    bitacora.success = false;
    
    console.error('[SERVICE] ❌ ERROR CRÍTICO:', error.message);
    
    // TODO: Log crítico
    // TODO: Notificación urgente
    
    return FAIL(bitacora);
  }
}
```

---

## <a name="diagrama"></a>🎯 7. Diagrama de Flujo

```
┌─────────────────────────────────────────┐
│ SERVICIO PRINCIPAL                      │
│ - Validar parámetros                    │
│ - Configurar bitácora                   │
└──────────────┬──────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ ¿Parámetros   │
       │ válidos?      │
       └───┬───────┬───┘
           │ NO    │ SÍ
           │       │
           ▼       ▼
     ┌─────────┐  ┌──────────────────┐
     │ ERROR   │  │ LLAMAR MÉTODO    │
     │ 400     │  │ LOCAL            │
     │finalRes │  └────────┬─────────┘
     │= true   │           │
     └─────────┘           ▼
                   ┌──────────────────┐
                   │ MÉTODO LOCAL     │
                   │ - Ejecutar query │
                   └────────┬─────────┘
                            │
                       ┌────┴────┐
                       │         │
                  ÉXITO│         │ERROR
                       │         │
                       ▼         ▼
                ┌──────────┐ ┌──────────┐
                │ data.    │ │ data.    │
                │ dataRes  │ │ messageUSR│
                │ = result │ │ messageDEV│
                │          │ │ finalRes  │
                │ AddMSG   │ │ = true    │
                │ ('OK')   │ │          │
                │          │ │ AddMSG   │
                │ return   │ │ ('FAIL') │
                │ bitacora │ │          │
                └────┬─────┘ │ return   │
                     │       │ bitacora │
                     │       └────┬─────┘
                     │            │
                     ▼            ▼
              ┌──────────────────────┐
              │ .then((bitacora) =>  │
              │   if (!success) {    │
              │     finalRes = true  │
              │     throw bitacora   │
              │   }                  │
              │   return bitacora    │
              │ )                    │
              └──────────┬───────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ CATCH DEL    │
                  │ SERVICIO     │
                  └──────┬───────┘
                         │
                    ┌────┴────┐
                    │         │
            finalRes│         │NO finalRes
            = true  │         │
                    ▼         ▼
             ┌────────────┐ ┌──────────────┐
             │ Error      │ │ Error        │
             │ manejado   │ │ inesperado   │
             │            │ │              │
             │ return     │ │ AddMSG       │
             │ FAIL(      │ │ ('FAIL',500) │
             │ bitacora)  │ │ finalRes=true│
             │            │ │              │
             │            │ │ return       │
             │            │ │ FAIL(        │
             │            │ │ bitacora)    │
             └────────────┘ └──────────────┘
```

---

## <a name="mejores-practicas"></a>✅ 8. Mejores Prácticas

### DO ✅

1. **Siempre establecer `finalRes = true` en errores**
   ```javascript
   bitacora.finalRes = true; // Detener ejecución
   ```

2. **Incluir messageUSR y messageDEV**
   ```javascript
   data.messageUSR = 'Mensaje amigable';
   data.messageDEV = 'Detalle técnico';
   ```

3. **Stack trace solo en desarrollo**
   ```javascript
   if (process.env.NODE_ENV === 'development') {
     data.stack = error.stack;
   }
   ```

4. **Centralizar manejo de errores en servicio principal**
   ```javascript
   catch (error) {
     if (error.finalRes) {
       // Ya manejado
     } else {
       // Inesperado
     }
   }
   ```

5. **Un solo registro en flujo exitoso**
   ```javascript
   // Éxito: solo un AddMSG
   bitacora = AddMSG(bitacora, data, 'OK', 200, true);
   ```

6. **Error como último registro**
   ```javascript
   // Error: último en bitacora.data[]
   bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
   ```

7. **TODO para tabla de errores y notificaciones**
   ```javascript
   // TODO: Log en tabla de errores
   // TODO: Notificar usuario/desarrollador
   ```

### DON'T ❌

1. **NO ignorar errores**
   ```javascript
   // ❌ NO
   try {
     // ...
   } catch (error) {
     // Sin manejo
   }
   ```

2. **NO dejar finalRes sin establecer en errores**
   ```javascript
   // ❌ NO
   catch (error) {
     bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
     // Falta: bitacora.finalRes = true;
   }
   ```

3. **NO múltiples registros en flujo exitoso**
   ```javascript
   // ❌ NO
   bitacora = AddMSG(bitacora, data1, 'OK', 200);
   bitacora = AddMSG(bitacora, data2, 'OK', 200);
   // Solo uno con principal=true
   ```

4. **NO exponer información sensible en messageUSR**
   ```javascript
   // ❌ NO
   data.messageUSR = `Error: ${connectionString}`;
   
   // ✅ SÍ
   data.messageUSR = 'Error de conexión a base de datos';
   data.messageDEV = `Connection failed: ${connectionString}`;
   ```

---

## 🎯 Resumen

| Aspecto | Flujo Exitoso | Flujo con Error |
|---------|---------------|-----------------|
| **Registros en bitácora** | 1 registro | 1+ registros |
| **success** | `true` | `false` |
| **finalRes** | `false` o sin establecer | `true` |
| **dataRes** | Array con datos | Array vacío o parcial |
| **messageUSR** | Mensaje de éxito | Mensaje de error |
| **messageDEV** | Detalles técnicos | Error detallado |
| **Acción adicional** | - | Inyectar en tabla + Notificar |

---

## ✅ Checklist

- [ ] ✅ `finalRes = true` en todos los errores
- [ ] ✅ `messageUSR` y `messageDEV` en todos los casos
- [ ] ✅ Stack trace solo en desarrollo
- [ ] ✅ Un solo registro en flujo exitoso
- [ ] ✅ Error como último registro
- [ ] ✅ Centralización en catch del servicio
- [ ] ✅ TODO para tabla de errores
- [ ] ✅ TODO para notificaciones

---

## 📚 Referencias

- **Handler**: `src/middlewares/respPWA.handler.js`
- **Servicio**: `src/api/services/ztpromociones-service.js`
- **Flujo Principal**: `ESTRUCTURA_FLUJO_SERVICIO.md`
- **Métodos Locales**: `METODOS_LOCALES.md`

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0  
**Autor**: Equipo Back-CDS
