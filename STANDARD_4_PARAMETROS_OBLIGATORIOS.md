# 📋 Estándar Técnico: 4 Parámetros Obligatorios

## 🎯 Definición

En el **estándar técnico de ztpromociones** (basado en la estructura de `ztproducts_files`), todo endpoint debe incluir **obligatoriamente** los siguientes **4 parámetros base**:

---

## 📊 Los 4 Parámetros Obligatorios del Endpoint

| # | Parámetro | Descripción | Ejemplo | Validación |
|---|-----------|-------------|---------|------------|
| **1** | **ProcessType** | Define el tipo de proceso que ejecutará el endpoint. Determina qué operación se realizará. | `'GetFilters'` | ✅ Obligatorio - Error 400 si falta |
| **2** | **DBServer** | Indica el motor de base de datos en el que se ejecutará la consulta o transacción. | `'MongoDB'` | ✅ Obligatorio - Error 400 si falta |
| **3** | **LoggedUser** | Identifica al usuario que ejecuta la API. Formato: primera letra del nombre + apellido paterno completo + primera letra del segundo apellido. | `'jlopezm'` | ✅ Obligatorio - Error 400 si falta |
| **4** | **method/api** | Define el método HTTP y la ruta o endpoint asociado al servicio. | `POST /api/ztpromociones/crudPromociones` | ✅ Se configura automáticamente |

---

## 🔍 Detalle de Cada Parámetro

### 1️⃣ **ProcessType** (Tipo de Proceso)

**Propósito**: Define qué operación se ejecutará en el endpoint.

**Valores válidos**:
- `GetFilters` - Consultas con filtros dinámicos (getOne, getSome, getAll)
- `AddMany` - Crear uno o múltiples registros
- `UpdateMany` - Actualizar uno o múltiples registros
- `DeleteMany` - Eliminar uno o múltiples registros (lógico o físico)

**Ejemplo**:
```
?ProcessType=GetFilters
```

**Validación**:
```javascript
if (!ProcessType) {
  return ERROR 400: "Falta parámetro obligatorio: ProcessType"
}
```

---

### 2️⃣ **DBServer** (Servidor de Base de Datos)

**Propósito**: Especifica el motor de base de datos donde se ejecutará la operación.

**Valores válidos**:
- `MongoDB` - MongoDB Atlas o local
- `HANA` - SAP HANA
- `AzureCosmos` - Azure Cosmos DB

**Ejemplo**:
```
?DBServer=MongoDB
```

**Validación**:
```javascript
if (!DBServer) {
  return ERROR 400: "Falta parámetro obligatorio: DBServer"
}
```

**Nota**: Aunque el código puede tener un default, según el estándar técnico debe ser **explícito** en la petición.

---

### 3️⃣ **LoggedUser** (Usuario Logueado)

**Propósito**: Identifica al usuario que ejecuta la API para trazabilidad y auditoría.

**Formato estándar**:
- Primera letra del **primer nombre**
- **Apellido paterno** completo (minúsculas)
- Primera letra del **segundo apellido** (opcional)

**Ejemplos**:
```
Juan López Martínez    → jlopezm
Luis Paniagua García   → lpaniaguag
Ana Silva Rodríguez    → asilvar
Pedro Gómez            → pgomez
```

**Ejemplo en URL**:
```
?LoggedUser=jlopezm
```

**Validación**:
```javascript
if (!LoggedUser) {
  return ERROR 400: "Falta parámetro obligatorio: LoggedUser"
}
```

**Uso**:
- Se registra en la bitácora
- Se usa en `saveWithAudit` para campos REGUSER/MODUSER
- Permite rastrear quién ejecutó cada operación

---

### 4️⃣ **method/api** (Método HTTP y Ruta)

**Propósito**: Define el método HTTP y la ruta del endpoint.

**Componentes**:
- **Method**: Tipo de petición HTTP (`POST`, `GET`, `PUT`, `DELETE`)
- **API**: Ruta completa del endpoint

**En ztpromociones**:
```
Method: POST
API: /api/ztpromociones/crudPromociones
```

**Configuración automática**:
```javascript
bitacora.method = req.req?.method || 'POST';
bitacora.api = '/api/ztpromociones/crudPromociones';
```

**Nota**: Este parámetro **NO se envía en la URL**, se configura automáticamente en el servicio desde el objeto `req`.

---

## 🌐 URL Completa de Ejemplo

```
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetFilters&DBServer=MongoDB&LoggedUser=lpaniaguag
```

**Desglose**:
- **Method**: `POST` ← Parámetro 4
- **Base URL**: `http://localhost:3033`
- **API**: `/api/ztpromociones/crudPromociones` ← Parámetro 4
- **ProcessType**: `GetFilters` ← Parámetro 1
- **DBServer**: `MongoDB` ← Parámetro 2
- **LoggedUser**: `lpaniaguag` ← Parámetro 3

---

## ✅ Validación de Parámetros

### Orden de Validación (en el código):

```javascript
// 1. Extraer parámetros
const { ProcessType, LoggedUser, DBServer } = params;

// 2. Validar ProcessType
if (!ProcessType) {
  return ERROR 400
}

// 3. Validar LoggedUser
if (!LoggedUser) {
  return ERROR 400
}

// 4. Validar DBServer
if (!DBServer) {
  return ERROR 400
}

// 5. Configurar bitácora con los 4 parámetros
bitacora.processType = ProcessType;
bitacora.loggedUser = LoggedUser;
bitacora.dbServer = DBServer;
bitacora.method = req.req?.method || 'POST';
bitacora.api = '/api/ztpromociones/crudPromociones';
```

---

## 🚨 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| **400: Falta parámetro obligatorio: ProcessType** | No se envió ProcessType en la URL | Agregar `?ProcessType=GetFilters` |
| **400: Falta parámetro obligatorio: DBServer** | No se envió DBServer en la URL | Agregar `&DBServer=MongoDB` |
| **400: Falta parámetro obligatorio: LoggedUser** | No se envió LoggedUser en la URL | Agregar `&LoggedUser=jlopezm` |
| **Case sensitivity error** | Escribiste `processtype` en vez de `ProcessType` | Usar mayúsculas/minúsculas exactas |

---

## 📝 Buenas Prácticas

1. **Siempre incluir los 4 parámetros** en todas las peticiones
2. **Respetar case-sensitivity**: `ProcessType` NO es igual a `processtype`
3. **Usar LoggedUser real**: Evitar valores como "test" o "admin"
4. **Especificar DBServer explícito**: Aunque haya default, enviarlo siempre
5. **Documentar cambios**: Si agregas nuevos ProcessTypes, documentarlos

---

## 🎯 Implementación en Código

### Archivo: `ztpromociones-service.js`

```javascript
/* 
 * PARÁMETROS OBLIGATORIOS (4 campos base del estándar técnico):
 * 1. ProcessType - Define el tipo de proceso
 * 2. DBServer - Motor de base de datos
 * 3. LoggedUser - Usuario que ejecuta
 * 4. method/api - Método HTTP y ruta
 */

// 1. EXTRAER PARÁMETROS
const { ProcessType, LoggedUser, DBServer } = params;

// 2. VALIDAR PARÁMETROS OBLIGATORIOS
if (!ProcessType) { /* Error 400 */ }
if (!LoggedUser) { /* Error 400 */ }
if (!DBServer) { /* Error 400 */ }

// 3. CONFIGURAR BITÁCORA CON LOS 4 PARÁMETROS
bitacora.processType = ProcessType;
bitacora.loggedUser = LoggedUser;
bitacora.dbServer = DBServer;
bitacora.method = req.req?.method || 'POST';
bitacora.api = '/api/ztpromociones/crudPromociones';
```

---

## 📚 Referencias

- **Patrón de referencia**: `ztproducts_files`
- **Documentación de endpoints**: `ENDPOINTS_ZTPROMOCIONES.md`
- **Validación de estándar**: `ZTPROMOCIONES_VALIDATION_CHECKLIST.md`

---

**📅 Actualizado**: 19 de Octubre de 2025  
**✅ Estado**: Implementado y validado 100%
