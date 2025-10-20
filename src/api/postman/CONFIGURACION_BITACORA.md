# 📋 Configuración de la Bitácora (BITACORA)

## 🎯 Objetivo

La **bitácora** es una estructura central que acompaña todo el flujo de la API, registrando información detallada sobre cada operación ejecutada.

---

## 📊 Campos Obligatorios de la Bitácora

### 1️⃣ **processType** → Tipo de operación
Indica el tipo de proceso que se está ejecutando.

**Valores permitidos:**
- `GetFilters` → Consultar promociones con filtros
- `AddMany` → Crear múltiples promociones
- `UpdateMany` → Actualizar múltiples promociones
- `DeleteMany` → Eliminar múltiples promociones

**Ejemplo:**
```javascript
bitacora.processType = 'GetFilters';
```

---

### 2️⃣ **dbServer** → Servidor de base de datos
Indica qué motor de base de datos se está utilizando.

**Valores permitidos:**
- `MongoDB` (default)
- `HANA`
- `AzureCosmos`

**Ejemplo:**
```javascript
bitacora.dbServer = 'MongoDB';
```

---

### 3️⃣ **loggedUser** → Usuario que ejecuta el proceso
Usuario autenticado que realiza la operación. Requerido para auditoría.

**Formato esperado:** `jlopezm` (minúsculas, sin espacios)

**Ejemplo:**
```javascript
bitacora.loggedUser = 'jlopezm';
```

---

### 4️⃣ **method** → Método HTTP
Método HTTP utilizado en la solicitud.

**Valores comunes:**
- `GET` → Consultas
- `POST` → Crear o ejecutar acciones
- `PUT/PATCH` → Actualizar
- `DELETE` → Eliminar

**Ejemplo:**
```javascript
bitacora.method = 'POST';
```

---

### 5️⃣ **api** → Ruta del endpoint
Ruta completa del endpoint ejecutado.

**Ejemplo:**
```javascript
bitacora.api = '/api/ztpromociones/crudPromociones';
```

---

### 6️⃣ **status** → Estado de la operación
Estado HTTP resultante de la operación (agregado automáticamente por `AddMSG`).

**Valores comunes:**
- `200` → OK
- `400` → Bad Request (error de validación)
- `404` → Not Found
- `500` → Internal Server Error

---

### 7️⃣ **messageUSR** → Mensaje para el usuario
Mensaje amigable destinado al usuario final.

**Ejemplo:**
```javascript
data.messageUSR = 'Promociones obtenidas exitosamente: 15 registro(s)';
```

---

### 8️⃣ **messageDEV** → Mensaje para el desarrollador
Mensaje técnico con detalles para debugging.

**Ejemplo:**
```javascript
data.messageDEV = 'Filtros aplicados: {"ACTIVED":true,"DELETED":false} | Paginación: limit=100, offset=0';
```

---

### 9️⃣ **dataRes (dataResponse)** → Resultado de la consulta
Datos resultantes de la operación o información del error.

**Ejemplo (éxito):**
```javascript
data.dataRes = promociones; // Array con resultados
```

**Ejemplo (error):**
```javascript
data.dataRes = {
  error: error.message,
  stack: error.stack // Solo en development
};
```

---

## 🔧 Configuración Inicial en el Servicio

### Servicio Principal (`crudZTPromociones`)

```javascript
async function crudZTPromociones(req) {
  // ============================================
  // INICIALIZACIÓN DE ESTRUCTURAS BASE
  // ============================================
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // Extraer parámetros
    const params = req.req?.query || {};
    const { ProcessType, LoggedUser, DBServer } = params;
    
    // ============================================
    // VALIDACIÓN DE PARÁMETROS OBLIGATORIOS
    // ============================================
    if (!ProcessType) {
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    if (!LoggedUser) {
      data.messageUSR = 'Falta parámetro obligatorio: LoggedUser';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    // ============================================
    // CONFIGURAR CONTEXTO DE BITÁCORA
    // ============================================
    const dbServer = DBServer || 'MongoDB';
    
    // Campos obligatorios de la bitácora
    bitacora.processType = ProcessType;                         // GetFilters, AddMany, etc.
    bitacora.dbServer = dbServer;                              // MongoDB, HANA, etc.
    bitacora.loggedUser = LoggedUser;                          // Usuario autenticado
    bitacora.method = req.req?.method || 'POST';               // Método HTTP
    bitacora.api = '/api/ztpromociones/crudPromociones';       // Ruta del endpoint
    
    // Campos adicionales
    bitacora.queryString = paramString;                        // Parámetros serializados
    bitacora.server = process.env.SERVER_NAME || 'No especificado';
    bitacora.timestamp = new Date().toISOString();             // Timestamp de inicio
    
    // Ejecutar operación según ProcessType...
  }
}
```

---

## 🎨 Configuración en Métodos Locales

### Método `GetFiltersPromocionesMethod`

```javascript
async function GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer) {
  // ============================================
  // INICIALIZACIÓN DE DATA
  // ============================================
  let data = DATA();
  
  // ============================================
  // CONFIGURACIÓN DE BITÁCORA
  // ============================================
  // La bitácora heredó los valores del servicio principal,
  // aquí solo copiamos los campos necesarios a data
  
  data.process = 'Obtener promociones (GetFilters)';
  data.processType = bitacora.processType;      // Ya configurado en servicio principal
  data.loggedUser = bitacora.loggedUser;        // Ya configurado en servicio principal
  data.dbServer = bitacora.dbServer;            // Ya configurado en servicio principal
  data.method = bitacora.method;                // Ya configurado en servicio principal
  data.api = bitacora.api;                      // Ya configurado en servicio principal
  data.principal = true;                        // Marcar como proceso principal
  
  // Actualizar descripción del proceso
  bitacora.process = 'Obtener promociones (GetFilters)';
  
  try {
    // ... lógica del método ...
    
    // ============================================
    // FLUJO EXITOSO
    // ============================================
    data.dataRes = promociones;
    data.countDataRes = promociones.length;
    data.messageUSR = `Promociones obtenidas exitosamente: ${promociones.length} registro(s)`;
    data.messageDEV = `Filtros aplicados: ${JSON.stringify(filter)}`;
    
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // ============================================
    // FLUJO CON ERROR
    // ============================================
    data.messageUSR = 'Error al obtener promociones';
    data.messageDEV = `Error en query: ${error.message}`;
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true;  // Detener ejecución
    
    return bitacora;
  }
}
```

---

## ⚠️ Validaciones Obligatorias

### Al Inicio del Flujo

> **Si la API no incluye `processType` o `loggedUser`, debe lanzar error al inicio del flujo.**

```javascript
// ❌ ERROR: Falta ProcessType
if (!ProcessType) {
  data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
  data.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.finalRes = true;
  
  // TODO: Registrar en tabla de errores
  // TODO: Notificar al usuario/desarrollador
  
  return FAIL(bitacora);
}

// ❌ ERROR: Falta LoggedUser
if (!LoggedUser) {
  data.messageUSR = 'Falta parámetro obligatorio: LoggedUser';
  data.messageDEV = 'Usuario requerido para auditoría. Formato esperado: jlopezm';
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.finalRes = true;
  
  // TODO: Registrar en tabla de errores
  // TODO: Notificar al usuario/desarrollador
  
  return FAIL(bitacora);
}
```

---

## 📤 Estructura de Respuesta Final

### Respuesta Exitosa

```json
{
  "success": true,
  "data": [
    {
      "status": 200,
      "process": "Obtener promociones (GetFilters)",
      "processType": "GetFilters",
      "principal": true,
      "dataRes": [
        {
          "IdPromoOK": "PROMO001",
          "Titulo": "Oferta Especial",
          "FechaIni": "2025-01-01T00:00:00.000Z",
          "FechaFin": "2025-12-31T23:59:59.000Z"
        }
      ],
      "countDataRes": 1,
      "messageUSR": "Promociones obtenidas exitosamente: 1 registro(s)",
      "messageDEV": "Filtros aplicados: {\"ACTIVED\":true,\"DELETED\":false}"
    }
  ],
  "processType": "GetFilters",
  "dbServer": "MongoDB",
  "loggedUser": "jlopezm",
  "method": "POST",
  "api": "/api/ztpromociones/crudPromociones",
  "queryString": "ProcessType=GetFilters&LoggedUser=jlopezm",
  "timestamp": "2025-10-19T10:30:00.000Z",
  "_metadata": {
    "controller": "ztpromociones-controller",
    "action": "crudPromociones",
    "timestamp": "2025-10-19T10:30:00.000Z"
  }
}
```

### Respuesta con Error

```json
{
  "success": false,
  "data": [
    {
      "status": 400,
      "process": "Validación de parámetros",
      "processType": "ValidationError",
      "messageUSR": "Falta parámetro obligatorio: ProcessType",
      "messageDEV": "Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany",
      "api": "/api/ztpromociones/crudPromociones",
      "method": "POST"
    }
  ],
  "finalRes": true,
  "_metadata": {
    "controller": "ztpromociones-controller",
    "action": "crudPromociones",
    "timestamp": "2025-10-19T10:30:00.000Z"
  }
}
```

---

## 🔄 Flujo Completo

### 1. Inicialización
```javascript
let bitacora = BITACORA();  // Crear instancia de bitácora
let data = DATA();           // Crear instancia de data
```

### 2. Validación de Parámetros
```javascript
if (!ProcessType || !LoggedUser) {
  // Registrar error y detener
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.finalRes = true;
  return FAIL(bitacora);
}
```

### 3. Configuración de Bitácora
```javascript
bitacora.processType = ProcessType;
bitacora.dbServer = DBServer || 'MongoDB';
bitacora.loggedUser = LoggedUser;
bitacora.method = req.req?.method || 'POST';
bitacora.api = '/api/ztpromociones/crudPromociones';
```

### 4. Ejecución del Método
```javascript
bitacora = await GetFiltersPromocionesMethod(bitacora, params, ...);
```

### 5. Respuesta Final
```javascript
if (!bitacora.success) {
  bitacora.finalRes = true;
  return FAIL(bitacora);
}

return OK(bitacora);
```

---

## ✅ Checklist de Implementación

- [x] Instanciar `bitacora` y `data` al inicio
- [x] Validar `ProcessType` obligatorio
- [x] Validar `LoggedUser` obligatorio
- [x] Configurar `bitacora.processType`
- [x] Configurar `bitacora.dbServer`
- [x] Configurar `bitacora.loggedUser`
- [x] Configurar `bitacora.method`
- [x] Configurar `bitacora.api`
- [x] Agregar `timestamp` de inicio
- [x] Configurar campos adicionales (`queryString`, `server`)
- [x] Heredar campos de bitácora en métodos locales
- [x] Registrar `messageUSR` y `messageDEV` en data
- [x] Incluir `dataRes` con resultados o errores
- [x] Establecer `finalRes=true` en errores

---

## 📚 Referencias

- **Handler:** `src/middlewares/respPWA.handler.js`
- **Servicio:** `src/api/services/ztpromociones-service.js`
- **Controlador:** `src/api/controllers/ztpromociones-controller.js`
- **Documentación:** `src/api/postman/ESTRUCTURA_ESTANDAR_ENDPOINTS.md`

---

## 🎯 Conclusión

La bitácora debe configurarse **inmediatamente después de las validaciones** y debe incluir todos los campos obligatorios para asegurar trazabilidad completa de cada operación ejecutada en la API.

> **Regla de oro:** Si falta `ProcessType` o `LoggedUser`, el flujo debe detenerse inmediatamente y retornar un error 400.
