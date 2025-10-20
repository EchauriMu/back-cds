# Estructura Estandarizada de Endpoints - SAP CAP

## 📋 Tabla de Contenidos

1. [Estructura General](#1-estructura-general)
2. [Campos Base Obligatorios](#2-campos-base-obligatorios)
3. [Ejemplo de Implementación](#3-ejemplo-de-implementación)
4. [Validaciones](#4-validaciones)
5. [Manejo de Errores](#5-manejo-de-errores)
6. [Respuestas Estandarizadas](#6-respuestas-estandarizadas)

---

## 1. Estructura General

Todo endpoint debe definirse siguiendo una estructura **estandarizada y sensible a mayúsculas/minúsculas (case-sensitive)**. Esta estructura garantiza:

- ✅ Trazabilidad completa de operaciones
- ✅ Auditoría automática
- ✅ Manejo consistente de errores
- ✅ Compatibilidad multi-base de datos

---

## 2. Campos Base Obligatorios

Los siguientes campos **SIEMPRE** deben incluirse en cada endpoint:

| Campo | Tipo | Descripción | Ejemplo | Obligatorio |
|-------|------|-------------|---------|-------------|
| **processType** | `string` | Define el tipo de proceso que ejecuta el endpoint. Valores válidos: `GetFilters`, `AddMany`, `UpdateMany`, `DeleteMany` | `'GetFilters'` | ✅ SÍ |
| **dbServer** | `string` | Especifica el motor de base de datos a usar. Valores válidos: `MongoDB`, `HANA`, `AzureCosmos` | `'MongoDB'` | ⚠️ Default: `MongoDB` |
| **LoggedUser** | `string` | Identifica al usuario que ejecuta la API. Formato: [1ª letra nombre] + [apellido paterno] + [1ª letra apellido materno] | `jlopezm` | ✅ SÍ |
| **method** | `string` | Método HTTP asociado al servicio | `POST` | ✅ SÍ (autoconfigurado) |
| **api** | `string` | Ruta del endpoint | `/api/ztpromociones/crudPromociones` | ✅ SÍ (autoconfigurado) |

### 2.1 Detalles de cada campo

#### **processType**
Define la operación CRUD a ejecutar:
- `GetFilters`: Consulta con filtros dinámicos
- `AddMany`: Creación de uno o múltiples registros
- `UpdateMany`: Actualización de uno o múltiples registros
- `DeleteMany`: Eliminación lógica o física

**Case-sensitive**: Debe escribirse exactamente como se muestra.

#### **dbServer**
Motor de base de datos:
- `MongoDB`: Base de datos NoSQL (default)
- `HANA`: SAP HANA (no implementado)
- `AzureCosmos`: Azure Cosmos DB (no implementado)

Si no se proporciona, se asume `MongoDB`.

#### **LoggedUser**
Usuario que ejecuta la operación. El formato es:
```
[Primera letra del primer nombre] + [Apellido paterno completo] + [Primera letra del segundo apellido]
```

**Ejemplos:**
- Juan López Martínez → `jlopezm`
- María González Ruiz → `mgonzalezr`
- Pedro Sánchez López → `sanchezl`

**Validación regex básica**: `/^[a-z][a-z]+[a-z]$/i`

#### **method** / **api**
Estos campos se autogeneran en el controller:
- `method`: `req.req?.method || 'POST'`
- `api`: Ruta hardcoded del endpoint

---

## 3. Ejemplo de Implementación

### 3.1 Controller (ztpromociones-controller.js)

```javascript
this.on('crudPromociones', async (req) => {
  try {
    // ============================================
    // 1. VALIDAR Y EXTRAER PARÁMETROS BASE
    // ============================================
    const params = req.req?.query || {};
    const ProcessType = params.ProcessType;
    const LoggedUser = params.LoggedUser;
    const DBServer = params.DBServer || 'MongoDB'; // Default
    const method = req.req?.method || 'POST';
    const api = '/api/ztpromociones/crudPromociones';
    
    // Validar obligatorios
    if (!ProcessType) {
      throw new Error('Parámetro obligatorio: ProcessType');
    }
    if (!LoggedUser) {
      throw new Error('Parámetro obligatorio: LoggedUser');
    }
    
    // ============================================
    // 2. EJECUTAR LÓGICA DE NEGOCIO
    // ============================================
    const result = await crudZTPromociones(req);
    
    // ============================================
    // 3. ENRIQUECER RESPUESTA CON METADATOS
    // ============================================
    if (result && typeof result === 'object') {
      result._metadata = {
        processType: ProcessType,
        dbServer: DBServer,
        loggedUser: LoggedUser,
        method: method,
        api: api,
        timestamp: new Date().toISOString()
      };
    }
    
    return result;
    
  } catch (error) {
    req.error(error.code || 500, error.message);
  }
});
```

### 3.2 Service (ztpromociones-service.js)

```javascript
async function crudZTPromociones(req) {
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // Extraer parámetros
    const params = req.req?.query || {};
    const { ProcessType, LoggedUser, DBServer } = params;
    
    // Validar obligatorios
    if (!ProcessType || !LoggedUser) {
      throw new Error('Faltan parámetros obligatorios');
    }
    
    // Configurar bitácora con campos base
    bitacora.processType = ProcessType;
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = DBServer || 'MongoDB';
    bitacora.method = req.req?.method || 'POST';
    bitacora.api = '/api/ztpromociones/crudPromociones';
    bitacora.server = process.env.SERVER_NAME || 'No especificado';
    
    // Ejecutar según ProcessType...
    
  } catch (error) {
    // Manejo de errores...
  }
}
```

---

## 4. Validaciones

### 4.1 Validación en Controller

```javascript
// Validar ProcessType
const validProcessTypes = ['GetFilters', 'AddMany', 'UpdateMany', 'DeleteMany'];
if (!validProcessTypes.includes(ProcessType)) {
  throw new Error(`ProcessType inválido. Valores permitidos: ${validProcessTypes.join(', ')}`);
}

// Validar LoggedUser
const userRegex = /^[a-z][a-z]+[a-z]$/i;
if (!userRegex.test(LoggedUser)) {
  console.warn(`LoggedUser con formato inusual: ${LoggedUser}`);
}

// Validar DBServer
const validDBServers = ['MongoDB', 'HANA', 'AzureCosmos'];
if (!validDBServers.includes(DBServer)) {
  throw new Error(`DBServer inválido. Valores permitidos: ${validDBServers.join(', ')}`);
}
```

### 4.2 Validación en Service

```javascript
if (!ProcessType) {
  data.process = 'Validación de parámetros';
  data.messageUSR = 'Falta parámetro: ProcessType';
  data.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  return FAIL(bitacora);
}
```

---

## 5. Manejo de Errores

### 5.1 Errores de Validación (400)

```javascript
if (!ProcessType) {
  const error = new Error('Parámetro obligatorio faltante: ProcessType');
  error.code = 400;
  throw error;
}
```

### 5.2 Errores de Negocio (500)

```javascript
catch (error) {
  data.messageUSR = 'Error al procesar solicitud';
  data.messageDEV = error.message;
  data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
  bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
  return FAIL(bitacora);
}
```

---

## 6. Respuestas Estandarizadas

### 6.1 Estructura de Respuesta Exitosa

```json
{
  "success": true,
  "status": 200,
  "bitacora": [
    {
      "process": "Obtener promociones",
      "messageUSR": "Promociones obtenidas (5 registros)",
      "messageDEV": "Filtros: {\"ACTIVED\":true,\"DELETED\":false}",
      "dataRes": [ /* ... datos ... */ ]
    }
  ],
  "_metadata": {
    "processType": "GetFilters",
    "dbServer": "MongoDB",
    "loggedUser": "jlopezm",
    "method": "POST",
    "api": "/api/ztpromociones/crudPromociones",
    "timestamp": "2025-10-19T12:00:00.000Z"
  }
}
```

### 6.2 Estructura de Respuesta con Error

```json
{
  "success": false,
  "status": 400,
  "bitacora": [
    {
      "process": "Validación de parámetros",
      "messageUSR": "Falta parámetro: ProcessType",
      "messageDEV": "Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany"
    }
  ],
  "_metadata": {
    "processType": null,
    "dbServer": "MongoDB",
    "loggedUser": null,
    "method": "POST",
    "api": "/api/ztpromociones/crudPromociones",
    "timestamp": "2025-10-19T12:00:00.000Z"
  }
}
```

---

## 7. Ejemplos de Uso

### 7.1 GetFilters

```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm&DBServer=MongoDB
```

### 7.2 AddMany

```http
POST /api/ztpromociones/crudPromociones?ProcessType=AddMany&LoggedUser=jlopezm
Content-Type: application/json

{
  "promociones": [
    {
      "IdPromoOK": "PROMO001",
      "Titulo": "Descuento Navidad",
      "Descripcion": "50% de descuento",
      "FechaIni": "2025-12-01",
      "FechaFin": "2025-12-31",
      "SKUID": "SKU001",
      "IdListaOK": "LISTA001",
      "Descuento%": 50.0
    }
  ]
}
```

### 7.3 UpdateMany

```http
POST /api/ztpromociones/crudPromociones?ProcessType=UpdateMany&LoggedUser=jlopezm
Content-Type: application/json

{
  "filter": { "IdListaOK": "LISTA001" },
  "updates": { "ACTIVED": false }
}
```

### 7.4 DeleteMany (Lógico)

```http
POST /api/ztpromociones/crudPromociones?ProcessType=DeleteMany&LoggedUser=jlopezm&deleteType=logic
Content-Type: application/json

{
  "filter": { "IdPromoOK": "PROMO001" }
}
```

---

## 8. Checklist de Implementación

Al crear un nuevo endpoint, asegúrate de:

- [ ] Definir todos los campos base obligatorios
- [ ] Validar `ProcessType` y `LoggedUser` en el controller
- [ ] Configurar `DBServer` con valor default
- [ ] Autogenerar `method` y `api`
- [ ] Configurar bitácora con todos los campos
- [ ] Enriquecer respuesta con `_metadata`
- [ ] Manejar errores con códigos HTTP correctos
- [ ] Documentar el endpoint en el router (.cds)
- [ ] Agregar ejemplos de uso
- [ ] Validar formato de `LoggedUser`

---

## 9. Referencias

- **Router**: `src/api/routes/ztpromociones-router.cds`
- **Controller**: `src/api/controllers/ztpromociones-controller.js`
- **Service**: `src/api/services/ztpromociones-service.js`
- **Helpers**: `src/middlewares/respPWA.handler.js`

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0
