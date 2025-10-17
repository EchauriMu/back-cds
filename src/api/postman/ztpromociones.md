# 📋 ZTPROMOCIONES - Endpoints para Postman

## 🔧 **Explicación del Servicio Actualizado**

El servicio `ztpromociones-service.js` ha sido actualizado siguiendo el patrón del servicio `ztproducts` con las siguientes características:

### 📊 **Características principales:**
- **🔍 Bitácora completa:** Registro detallado de todas las operaciones
- **⚡ Control por ProcessType:** Un solo endpoint CRUD con diferentes tipos de proceso
- **🛡️ Manejo de errores robusto:** Respuestas consistentes con `OK()` y `FAIL()`
- **📝 Logging detallado:** Mensajes para usuario y desarrollador

### 🎯 **Endpoints disponibles:**
1. **Servicio LEGACY:** `promocionesCRUD` (funcionalidad original)
2. **Servicio NUEVO:** `crudPromociones` (con bitácora y ProcessType)

---

## 🆕 **NUEVO SERVICIO CON BITÁCORA - crudPromociones**

### 🔍 **1. Obtener todas las promociones**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetAll&LoggedUser=Laura
Content-Type: application/json
```
**Body:** (vacío)

---

### 🔍 **2. Obtener una promoción específica**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetOne&idPromoOK=PROMO001&LoggedUser=Laura
Content-Type: application/json
```
**Body:** (vacío)

---

### ➕ **3. Crear nueva promoción**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=AddOne&LoggedUser=Laura
Content-Type: application/json
```
**Body:**
```json
{
  "IdPromoOK": "PROMO2024001",
  "Titulo": "Descuento Black Friday",
  "Descripcion": "Descuento especial por Black Friday en productos seleccionados",
  "FechaIni": "2024-11-20T00:00:00.000Z",
  "FechaFin": "2024-11-30T23:59:59.000Z",
  "SKUID": "SKU123456",
  "DescuentoPorcentaje": 25.5,
  "REGUSER": "admin@empresa.com"
}
```

**Campos obligatorios:**
- `IdPromoOK`: Identificador único
- `Titulo`: Título de la promoción
- `FechaIni`: Fecha inicio (ISO 8601)
- `FechaFin`: Fecha fin (ISO 8601)
- `REGUSER`: Usuario que registra

---

### ✏️ **4. Actualizar promoción existente**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=UpdateOne&idPromoOK=PROMO2024001&LoggedUser=Laura
Content-Type: application/json
```
**Body:**
```json
{
  "Titulo": "Descuento Black Friday EXTENDIDO",
  "Descripcion": "Promoción extendida hasta diciembre",
  "FechaFin": "2024-12-05T23:59:59.000Z",
  "DescuentoPorcentaje": 30.0
}
```

---

### 🗑️ **5. Borrado lógico (soft delete)**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=DeleteOne&idPromoOK=PROMO2024001&LoggedUser=Laura
Content-Type: application/json
```
**Body:** (vacío)

**Resultado:** Marca `ACTIVED: false` y `DELETED: true`

---

## � **Respuesta del Nuevo Servicio con Bitácora:**

### ✅ **Respuesta exitosa:**
```json
{
  "success": true,
  "process": "Obtener todas las PROMOCIONES",
  "processType": "GetAll",
  "loggedUser": "Laura",
  "status": 200,
  "method": "GET",
  "api": "/crud?ProcessType=GetAll",
  "messageUSR": "Se obtuvieron 5 promociones correctamente",
  "messageDEV": "Query ejecutada exitosamente. Promociones encontradas: 5",
  "dataRes": [...], // Array de promociones
  "principal": true,
  "timestamp": "2024-10-16T10:30:00.000Z"
}
```

### ❌ **Respuesta de error:**
```json
{
  "success": false,
  "process": "Agregar UNA PROMOCION",
  "processType": "AddOne",
  "loggedUser": "Laura",
  "status": 400,
  "method": "POST",
  "api": "/crud?ProcessType=AddOne",
  "messageUSR": "ID de promoción requerido",
  "messageDEV": "IdPromoOK es requerido para crear una promoción",
  "dataRes": null,
  "principal": true,
  "timestamp": "2024-10-16T10:30:00.000Z"
}
```

---

## 📋 **SERVICIO LEGACY - promocionesCRUD**

### 🔍 **1. Obtener todas las promociones (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=get&type=all
Content-Type: application/json
```
**Body:** (vacío)

---

### 🔍 **2. Obtener una promoción específica (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=get&type=one&idPromoOK=PROMO123
Content-Type: application/json
```
**Body:** (vacío)

---

### ➕ **3. Crear nueva promoción (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=post
Content-Type: application/json
```
**Body:**
```json
{
  "IdPromoOK": "PROMO2024001",
  "Titulo": "Descuento Black Friday",
  "Descripcion": "Descuento especial por Black Friday en productos seleccionados",
  "FechaIni": "2024-11-20T00:00:00.000Z",
  "FechaFin": "2024-11-30T23:59:59.000Z",
  "SKUID": "SKU123456",
  "DescuentoPorcentaje": 25.5,
  "REGUSER": "Laura"
}
```

---

### ✏️ **4. Actualizar promoción existente (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=put&idPromoOK=PROMO2024001
Content-Type: application/json
```
**Body:**
```json
{
  "Titulo": "Descuento Black Friday EXTENDIDO",
  "Descripcion": "Promoción extendida hasta diciembre",
  "FechaFin": "2024-12-05T23:59:59.000Z",
  "DescuentoPorcentaje": 30.0
}
```

---

### 🗑️ **5. Borrado lógico (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=delete&type=logic&idPromoOK=PROMO2024001
Content-Type: application/json
```
**Body:** (vacío)

---

## 🎯 **Diferencias entre los Servicios:**

| Característica | **crudPromociones (NUEVO)** | **promocionesCRUD (LEGACY)** |
|---|---|---|
| **Bitácora** | ✅ Completa con logs detallados | ❌ Sin bitácora |
| **ProcessType** | ✅ GetAll, GetOne, AddOne, UpdateOne, DeleteOne | ❌ procedure + type |
| **Manejo de errores** | ✅ OK() y FAIL() consistentes | ⚠️ Respuestas simples |
| **Logging** | ✅ Mensajes USR y DEV | ⚠️ Console.log básico |
| **Validaciones** | ✅ Robustas con mensajes claros | ⚠️ Básicas |

---

## 📊 **Ejemplos de respuesta Legacy (promocionesCRUD):**

### GET exitoso:
```json
[
  {
    "_id": "673d2e...",
    "IdPromoOK": "PROMO2024001",
    "Titulo": "Descuento Black Friday",
    "Descripcion": "Descuento especial...",
    "FechaIni": "2024-11-20T00:00:00.000Z",
    "FechaFin": "2024-11-30T23:59:59.000Z",
    "SKUID": "SKU123456",
    "DescuentoPorcentaje": 25.5,
    "ACTIVED": true,
    "DELETED": false,
    "REGUSER": "Laura",
    "REGDATE": "2024-10-14T10:30:00.000Z"
  }
]
```

### Error Legacy:
```json
{
  "error": true,
  "message": "Ya existe una promoción con ese IdPromoOK"
}
```

---

## 🚀 **Tips para testing:**

### **🆕 Para el NUEVO servicio (crudPromociones):**
1. **Siempre incluir `LoggedUser`** en query params
2. **Usar ProcessType correcto** (GetAll, GetOne, AddOne, UpdateOne, DeleteOne)
3. **Revisar bitácora completa** en respuestas
4. **Aprovechar mensajes detallados** para debugging

### **📋 Para el servicio LEGACY (promocionesCRUD):**
1. **Usar procedure + type** tradicional
2. **Respuestas más simples** sin bitácora
3. **Compatible con código existente**

### **🔧 Generales:**
1. **Usar fechas futuras** para promociones vigentes
2. **Validar rangos de descuento** (0-100%)
3. **Testear validaciones** (fechas, campos obligatorios)
4. **Verificar soft delete** antes del hard delete
5. **Puerto configurado:** `localhost:3033`