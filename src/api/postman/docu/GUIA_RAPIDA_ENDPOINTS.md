# Guía Rápida: Estructura Estandarizada de Endpoints

## 🎯 Objetivo

Esta guía establece la estructura **obligatoria** que deben seguir todos los endpoints del proyecto para garantizar:

- ✅ **Trazabilidad**: Saber quién, cuándo y qué hizo
- ✅ **Auditoría**: Registro automático de todas las operaciones
- ✅ **Consistencia**: Mismo formato en todas las APIs
- ✅ **Multi-BD**: Soporte para MongoDB, HANA, Azure Cosmos

---

## 📦 Campos Base Obligatorios

### En Query String (URL)

| Campo | Obligatorio | Default | Descripción | Ejemplo |
|-------|------------|---------|-------------|---------|
| **ProcessType** | ✅ SÍ | - | Tipo de operación CRUD | `GetFilters` |
| **LoggedUser** | ✅ SÍ | - | Usuario que ejecuta (formato: `jlopezm`) | `jlopezm` |
| **DBServer** | ⚠️ Opcional | `MongoDB` | Motor de base de datos | `MongoDB` |

### Autoconfigurados por el Sistema

| Campo | Fuente | Ejemplo |
|-------|--------|---------|
| **method** | `req.req.method` | `POST` |
| **api** | Hardcoded en controller | `/api/ztpromociones/crudPromociones` |

---

## 📝 Formato de LoggedUser

El usuario debe formarse con:
1. **Primera letra del primer nombre**
2. **Apellido paterno completo**
3. **Primera letra del segundo apellido**

### Ejemplos:

| Nombre Completo | LoggedUser |
|----------------|------------|
| Juan López Martínez | `jlopezm` |
| María González Ruiz | `mgonzalezr` |
| Pedro Sánchez López | `psanchezl` |
| Ana María Torres Vega | `atorresv` |

**Regex de validación**: `/^[a-z][a-z]+[a-z]$/i`

---

## 🔧 Valores Permitidos

### ProcessType (case-sensitive)

| Valor | Descripción | Método HTTP Típico |
|-------|-------------|-------------------|
| `GetFilters` | Consulta con filtros dinámicos | POST |
| `AddMany` | Crear uno o múltiples registros | POST |
| `UpdateMany` | Actualizar uno o múltiples registros | POST |
| `DeleteMany` | Eliminar lógica/físicamente | POST |

### DBServer (case-sensitive)

| Valor | Estado | Descripción |
|-------|--------|-------------|
| `MongoDB` | ✅ Implementado | Base de datos NoSQL (default) |
| `HANA` | ⚠️ No implementado | SAP HANA |
| `AzureCosmos` | ⚠️ No implementado | Azure Cosmos DB |

---

## 🚀 Ejemplos Prácticos

### 1️⃣ GetFilters - Consultar Promociones

**Todas las promociones activas:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm
```

**Por IdPromoOK específico:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm&IdPromoOK=PROMO001
```

**Promociones vigentes:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm&vigentes=true
```

**Con paginación:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm&limit=50&offset=0
```

**Por lista de precios:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm&IdListaOK=LISTA001
```

**Usando HANA (cuando esté disponible):**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm&DBServer=HANA
```

---

### 2️⃣ AddMany - Crear Promociones

**Crear una promoción:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=AddMany&LoggedUser=jlopezm
Content-Type: application/json

{
  "promociones": [
    {
      "IdPromoOK": "PROMO001",
      "Titulo": "Descuento Navidad 2025",
      "Descripcion": "50% de descuento en productos seleccionados",
      "FechaIni": "2025-12-01",
      "FechaFin": "2025-12-31",
      "SKUID": "SKU001",
      "IdListaOK": "LISTA001",
      "Descuento%": 50.0
    }
  ]
}
```

**Crear múltiples promociones:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=AddMany&LoggedUser=mgonzalezr
Content-Type: application/json

{
  "promociones": [
    {
      "IdPromoOK": "PROMO002",
      "Titulo": "Año Nuevo",
      "FechaIni": "2026-01-01",
      "FechaFin": "2026-01-31",
      "SKUID": "SKU002",
      "Descuento%": 30.0
    },
    {
      "IdPromoOK": "PROMO003",
      "Titulo": "San Valentín",
      "FechaIni": "2026-02-01",
      "FechaFin": "2026-02-14",
      "SKUID": "SKU003",
      "Descuento%": 20.0
    }
  ]
}
```

**⚠️ Campos obligatorios en cada promoción:**
- `IdPromoOK`
- `Titulo`
- `FechaIni`
- `FechaFin`

---

### 3️⃣ UpdateMany - Actualizar Promociones

**Actualizar una promoción específica:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=UpdateMany&LoggedUser=jlopezm
Content-Type: application/json

{
  "filter": { 
    "IdPromoOK": "PROMO001" 
  },
  "updates": { 
    "Descuento%": 60.0,
    "Titulo": "Super Descuento Navidad 2025"
  }
}
```

**Desactivar todas las promociones de una lista:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=UpdateMany&LoggedUser=psanchezl
Content-Type: application/json

{
  "filter": { 
    "IdListaOK": "LISTA001" 
  },
  "updates": { 
    "ACTIVED": false 
  }
}
```

**Actualizar promociones por SKU:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=UpdateMany&LoggedUser=jlopezm
Content-Type: application/json

{
  "filter": { 
    "SKUID": "SKU001" 
  },
  "updates": { 
    "Descripcion": "Nueva descripción para todas las promos de este SKU"
  }
}
```

---

### 4️⃣ DeleteMany - Eliminar Promociones

**Eliminación lógica (ACTIVED=false, DELETED=true):**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=DeleteMany&LoggedUser=jlopezm&deleteType=logic
Content-Type: application/json

{
  "filter": { 
    "IdPromoOK": "PROMO001" 
  }
}
```

**Eliminación física (permanente) - ⚠️ PELIGRO:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=DeleteMany&LoggedUser=jlopezm&deleteType=hard
Content-Type: application/json

{
  "filter": { 
    "IdPromoOK": "PROMO001" 
  }
}
```

**Eliminar lógicamente todas las promociones expiradas:**
```http
POST /api/ztpromociones/crudPromociones?ProcessType=DeleteMany&LoggedUser=psanchezl&deleteType=logic
Content-Type: application/json

{
  "filter": { 
    "FechaFin": { "$lt": "2025-01-01" }
  }
}
```

---

## 📊 Estructura de Respuesta

### Respuesta Exitosa

```json
{
  "success": true,
  "status": 200,
  "bitacora": [
    {
      "process": "Obtener promociones",
      "processType": "GetFilters",
      "loggedUser": "jlopezm",
      "dbServer": "MongoDB",
      "server": "SAP-SERVER-01",
      "messageUSR": "Promociones obtenidas (3 registros)",
      "messageDEV": "Filtros: {\"ACTIVED\":true,\"DELETED\":false}",
      "dataRes": [
        {
          "IdPromoOK": "PROMO001",
          "Titulo": "Descuento Navidad",
          "Descuento%": 50.0,
          "REGUSER": "jlopezm",
          "REGDATE": "2025-10-19T10:00:00.000Z"
        }
      ]
    }
  ],
  "_metadata": {
    "processType": "GetFilters",
    "dbServer": "MongoDB",
    "loggedUser": "jlopezm",
    "method": "POST",
    "api": "/api/ztpromociones/crudPromociones",
    "timestamp": "2025-10-19T12:30:00.000Z"
  }
}
```

### Respuesta con Error (400 - Validación)

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
    "timestamp": "2025-10-19T12:30:00.000Z"
  }
}
```

### Respuesta con Error (500 - Servidor)

```json
{
  "success": false,
  "status": 500,
  "bitacora": [
    {
      "process": "Crear promociones",
      "messageUSR": "Error al crear promociones",
      "messageDEV": "Faltan campos obligatorios: IdPromoOK, Titulo, FechaIni, FechaFin",
      "stack": "Error: Faltan campos...\n    at AddManyPromocionesMethod..."
    }
  ],
  "_metadata": {
    "processType": "AddMany",
    "dbServer": "MongoDB",
    "loggedUser": "jlopezm",
    "method": "POST",
    "api": "/api/ztpromociones/crudPromociones",
    "timestamp": "2025-10-19T12:30:00.000Z"
  }
}
```

---

## ❌ Errores Comunes

### 1. Falta ProcessType
```
❌ POST /api/ztpromociones/crudPromociones?LoggedUser=jlopezm
✅ POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm
```

### 2. Falta LoggedUser
```
❌ POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters
✅ POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm
```

### 3. ProcessType con mayúsculas incorrectas
```
❌ ProcessType=getfilters
❌ ProcessType=GETFILTERS
✅ ProcessType=GetFilters
```

### 4. LoggedUser con formato incorrecto
```
❌ LoggedUser=Juan Lopez
❌ LoggedUser=jlopez
❌ LoggedUser=juan.lopez
✅ LoggedUser=jlopezm
```

### 5. DBServer inválido
```
❌ DBServer=mysql
❌ DBServer=postgres
✅ DBServer=MongoDB
✅ DBServer=HANA
```

### 6. Body incorrecto en AddMany
```json
❌ { "promo": { "IdPromoOK": "..." } }
✅ { "promociones": [{ "IdPromoOK": "..." }] }
```

---

## 🧪 Testing con Postman

### Variables de Entorno

```json
{
  "base_url": "http://localhost:4004",
  "logged_user": "jlopezm",
  "db_server": "MongoDB"
}
```

### Pre-request Script

```javascript
// Configurar parámetros base automáticamente
pm.request.url.addQueryParams([
  { key: "LoggedUser", value: pm.environment.get("logged_user") },
  { key: "DBServer", value: pm.environment.get("db_server") }
]);
```

### Tests

```javascript
// Validar estructura de respuesta
pm.test("Respuesta tiene estructura base", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('success');
  pm.expect(jsonData).to.have.property('status');
  pm.expect(jsonData).to.have.property('_metadata');
});

pm.test("Metadata contiene campos obligatorios", function () {
  const metadata = pm.response.json()._metadata;
  pm.expect(metadata).to.have.property('processType');
  pm.expect(metadata).to.have.property('dbServer');
  pm.expect(metadata).to.have.property('loggedUser');
  pm.expect(metadata).to.have.property('method');
  pm.expect(metadata).to.have.property('api');
  pm.expect(metadata).to.have.property('timestamp');
});
```

---

## 📚 Documentación Adicional

- **Estructura Completa**: `src/api/ESTRUCTURA_ESTANDAR_ENDPOINTS.md`
- **Router**: `src/api/routes/ztpromociones-router.cds`
- **Controller**: `src/api/controllers/ztpromociones-controller.js`
- **Service**: `src/api/services/ztpromociones-service.js`

---

## 🔍 Checklist de Validación

Antes de hacer commit, verifica:

- [ ] ✅ **ProcessType** presente en query string
- [ ] ✅ **LoggedUser** presente y con formato `jlopezm`
- [ ] ✅ **DBServer** configurado (o default `MongoDB`)
- [ ] ✅ **method** y **api** autoconfigurados en controller
- [ ] ✅ Bitácora incluye todos los campos base
- [ ] ✅ Respuesta incluye `_metadata`
- [ ] ✅ Errores retornan códigos HTTP correctos (400, 500)
- [ ] ✅ Documentado en router (.cds)
- [ ] ✅ Probado con Postman/REST Client

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0  
**Autor**: Equipo Back-CDS
