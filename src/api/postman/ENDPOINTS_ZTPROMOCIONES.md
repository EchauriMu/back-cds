# ZTPROMOCIONES - Endpoints Postman (Estructura Técnica Estandarizada)

# ZTPROMOCIONES - Endpoints Completos para Postman

> **📌 IMPORTANTE**: Este módulo sigue la **Estructura Técnica Estandarizada** oficial del backend, replicando exactamente los patrones de `ztproducts_files`.
> 
> **Parámetros obligatorios (case-sensitive)**:
> - `ProcessType`: GetFilters | AddMany | UpdateMany | DeleteMany
> - `LoggedUser`: formato `jlopezm` (primera letra nombre + apellido paterno + primera letra segundo apellido)
>
> **Parámetros opcionales**:
> - `DBServer`: MongoDB (default) | HANA | AzureCosmos

## 📋 URLs Completas - Copiar y Pegar Directo

> **⚠️ RECORDATORIO DE PARÁMETROS**:
> - **Obligatorios**: `ProcessType`, `LoggedUser`
> - **Opcional**: `DBServer` (default: 'MongoDB' si no se especifica)
> - **Automático**: `method/api` (POST /api/ztpromociones/crudPromociones)

### 1️⃣ GET ALL PROMOCIONES (GetFilters sin filtros específicos)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag&limit=50&offset=0

Headers:
Content-Type: application/json

Body: (vacío)

Descripción:
- Obtiene todas las promociones activas y no eliminadas
- Parámetros obligatorios: ProcessType, LoggedUser
- Parámetros opcionales: DBServer (default: MongoDB), limit (default: 100), offset (default: 0)
- Retorna bitácora completa con estructura estandarizada
```

### 2️⃣ GET ONE PROMOCIÓN (GetFilters con IdPromoOK)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag&IdPromoOK=PROMO001

Headers:
Content-Type: application/json

Body: (vacío)

Descripción:
- Filtro dinámico por IdPromoOK
- Implementa lógica getOne/getSome/getAll según filtros presentes
- Retorna un único registro si encuentra coincidencia
```

### 3️⃣ GET BY PRODUCT (GetFilters con SKUID)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag&SKUID=P001

Headers:
Content-Type: application/json

Body: (vacío)

Descripción:
- Filtro dinámico por SKUID (producto)
- Retorna todas las promociones asociadas al producto P001
- Útil para consultar descuentos aplicables a un producto específico
```

### 4️⃣ GET PROMOCIONES VIGENTES
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag&vigentes=true

Headers:
Content-Type: application/json

Body: (vacío)

Descripción:
- Filtro por vigencia (FechaIni <= ahora AND FechaFin >= ahora)
- Retorna solo promociones activas en el momento actual
- Combina con otros filtros: vigentes=true&SKUID=P001
```

### 5️⃣ CREATE PROMOCIÓN (AddMany)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=AddMany&DBServer=MongoDB&LoggedUser=lpaniaguag

Headers:
Content-Type: application/json

Body (raw - JSON):
{
  "promociones": [
    {
      "IdPromoOK": "PROMO002",
      "Titulo": "Descuento otoño",
      "Descripcion": "15% de descuento en producto P002",
      "FechaIni": "2025-10-19T00:00:00Z",
      "FechaFin": "2025-12-31T00:00:00Z",
      "SKUID": "P002",
      "IdListaOK": null,
      "Descuento%": 15
    }
  ]
}

Descripción:
- Crea una o múltiples promociones
- Campos obligatorios: IdPromoOK, Titulo, FechaIni, FechaFin
- Usa saveWithAudit para <= 10 registros
- Usa insertMany con auditoría manual para > 10 registros
- Retorna status 201 en caso de éxito
```

### 6️⃣ UPDATE PROMOCIÓN (UpdateMany)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=UpdateMany&DBServer=MongoDB&LoggedUser=lpaniaguag

Headers:
Content-Type: application/json

Body (raw - JSON):
{
  "filter": {
    "IdPromoOK": "PROMO001"
  },
  "updates": {
    "Titulo": "Descuento verano EXTENDIDO",
    "Descripcion": "15% de descuento en producto P001 - OFERTA EXTENDIDA",
    "Descuento%": 15
  }
}

Descripción:
- Actualiza una o múltiples promociones según filtro
- Si filter.IdPromoOK existe, usa saveWithAudit (individual)
- Si no, usa updateMany con auditoría manual (masivo)
- Retorna matchedCount y modifiedCount en dataRes
```

### 7️⃣ DELETE LÓGICO (DeleteMany con deleteType=logic)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=DeleteMany&DBServer=MongoDB&LoggedUser=lpaniaguag&deleteType=logic

Headers:
Content-Type: application/json

Body (raw - JSON):
{
  "filter": {
    "IdPromoOK": "PROMO001"
  },
  "deleteType": "logic"
}

Descripción:
- Elimina lógicamente (DELETED=true, ACTIVED=false)
- Si filter.IdPromoOK existe, usa saveWithAudit
- Si no, usa updateMany con auditoría manual
- Mantiene los datos en base de datos para auditoría
```

### 8️⃣ DELETE FÍSICO (DeleteMany con deleteType=hard)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=DeleteMany&DBServer=MongoDB&LoggedUser=lpaniaguag&deleteType=hard

Headers:
Content-Type: application/json

Body (raw - JSON):
{
  "filter": {
    "IdPromoOK": "PROMO002"
  },
  "deleteType": "hard"
}

Descripción:
- Elimina permanentemente los registros de la base de datos
- ⚠️ PRECAUCIÓN: Esta operación NO es reversible
- Usar solo en casos excepcionales
- Retorna deletedCount en dataRes
```

### 9️⃣ LEGACY ENDPOINT (Deprecado)
```
Method: POST
URL: http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=get&type=all

Headers:
Content-Type: application/json

Body: (vacío)

⚠️ DEPRECADO: Use 'crudPromociones' con estructura estandarizada
```

## 📁 Organización Sugerida en Postman
```
📁 ZTPROMOCIONES API (Estructura Técnica Estandarizada)
  📂 GET Operations (GetFilters)
    - Get All Promociones (sin filtros)
    - Get One PROMO001 (IdPromoOK)
    - Get By Product P001 (SKUID)
    - Get Vigentes (vigentes=true)
  📂 CREATE Operations (AddMany)
    - Create Promoción Única
    - Create Múltiples Promociones (batch)
  📂 UPDATE Operations (UpdateMany)
    - Update One (filter.IdPromoOK)
    - Update Many (filter sin IdPromoOK)
  📂 DELETE Operations (DeleteMany)
    - Delete Lógico (deleteType=logic)
    - Delete Físico (deleteType=hard)
  📂 Legacy (Deprecado)
    - Legacy GetAll
```

## 🔧 Estructura de Respuesta Estandarizada

Todas las respuestas siguen la estructura de bitácora oficial:

```json
{
  "success": true,
  "status": 200,
  "process": "Obtener promociones con filtros",
  "processType": "GetFilters",
  "messageUSR": "Promociones obtenidas correctamente (2 registros)",
  "messageDEV": "GetFiltersPromociones ejecutado sin errores. Filtros aplicados: {...}",
  "countData": 1,
  "countDataReq": 0,
  "countDataRes": 1,
  "countMsgUSR": 1,
  "countMsgDEV": 1,
  "dbServer": "MongoDB",
  "server": "No especificado",
  "data": [
    {
      "success": true,
      "status": 200,
      "process": "Obtener promociones con filtros",
      "processType": "GetFilters",
      "principal": true,
      "secuencia": 1,
      "countDataReq": 0,
      "countDataRes": 2,
      "countFile": 0,
      "messageUSR": "Promociones obtenidas correctamente (2 registros)",
      "messageDEV": "GetFiltersPromociones ejecutado sin errores...",
      "method": "No Especificado",
      "api": "/api/ztpromociones/crudPromociones",
      "dataReq": [],
      "dataRes": [
        {
          "IdPromoOK": "PROMO001",
          "Titulo": "Descuento verano",
          ...
        }
      ],
      "file": []
    }
  ],
  "loggedUser": "lpaniaguag",
  "finalRes": false
}
```

## ✅ Lista de Verificación
- [ ] Crear Environment con variables base
  - `baseUrl`: http://localhost:3033
  - `LoggedUser`: lpaniaguag
  - `DBServer`: MongoDB
- [ ] Crear Collection "ZTPROMOCIONES API"
- [ ] Añadir cada request con configuración exacta
- [ ] Organizar en carpetas por ProcessType
- [ ] Probar Get All (debería retornar promociones activas)
- [ ] Probar Get One PROMO001 (debe existir)
- [ ] Probar Create con PROMO002
- [ ] Validar estructura de bitácora en respuestas

## 📚 Notas Técnicas

### Manejo de Errores
- **400**: Parámetros obligatorios faltantes (ProcessType, LoggedUser)
- **404**: Recursos no encontrados
- **500**: Errores internos o de base de datos

### Optimización de Bitácora
- **Flujo exitoso**: Un solo registro final en `bitacora.data`
- **Flujo con error**: Error registrado como último evento + `finalRes=true`

### Case Sensitivity
- ⚠️ **ProcessType**: DEBE usar mayúsculas/minúsculas exactas (GetFilters, NO getfilters)
- ⚠️ **DBServer**: MongoDB (NO mongodb)
- ⚠️ **LoggedUser**: formato estricto (primera letra + apellido + primera letra)

### Conexión Base de Datos
- MongoDB usa pooling (conexión persistente)
- No requiere cierre explícito en `finally` para MongoDB
- Para HANA/otros, implementar cierre en `finally`

## 🔄 Migración desde Endpoints Legacy

Si estás usando endpoints antiguos, migra así:

| Legacy | Nuevo Estandarizado |
|--------|---------------------|
| `?procedure=get&type=all` | `?ProcessType=GetFilters` |
| `?procedure=get&type=one` | `?ProcessType=GetFilters&IdPromoOK=XXX` |
| `?procedure=post` | `?ProcessType=AddMany` |
| `?procedure=put` | `?ProcessType=UpdateMany` |
| `?procedure=delete` | `?ProcessType=DeleteMany&deleteType=logic` |

## 🎯 Ejemplos de Filtros Combinados

```
# Promociones vigentes de un producto específico
?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag&SKUID=P001&vigentes=true

# Promociones de una lista específica con paginación
?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag&IdListaOK=LISTA001&limit=20&offset=40

# Todas las promociones con offset
?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag&limit=100&offset=0
```