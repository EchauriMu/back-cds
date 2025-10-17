# 🎯 RUTAS POSTMAN CON DATOS REALES - ZTPROMOCIONES

## 📊 **DATOS REALES DISPONIBLES EN LA BASE DE DATOS**

### 🏷️ **Promoción Existente:**
```json
{
  "_id": "68d4921293fed01513e946be",
  "IdPromoOK": "PROMO001",
  "Titulo": "Descuento verano",
  "Descripcion": "10% de descuento en producto P001",
  "FechaIni": "2025-06-01T00:00:00Z",
  "FechaFin": "2025-08-31T00:00:00Z",
  "SKUID": "P001",
  "IdListaOK": null,
  "Descuento%": 10,
  "ACTIVED": true,
  "DELETED": false
}
```

---

## 🆕 **NUEVO SERVICIO CON BITÁCORA - crudPromociones**

### 🔍 **1. Obtener todas las promociones**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetAll&LoggedUser=Laura
Content-Type: application/json
```
**Body:** (vacío)

**Respuesta esperada:**
```json
{
  "success": true,
  "process": "Obtener todas las PROMOCIONES",
  "processType": "GetAll",
  "loggedUser": "Laura",
  "status": 200,
  "method": "POST",
  "api": "/crudPromociones?ProcessType=GetAll",
  "messageUSR": "Se obtuvo 1 promoción correctamente",
  "messageDEV": "Query ejecutada exitosamente. Promociones encontradas: 1",
  "dataRes": [
    {
      "_id": "68d4921293fed01513e946be",
      "IdPromoOK": "PROMO001",
      "Titulo": "Descuento verano",
      "Descripcion": "10% de descuento en producto P001",
      "FechaIni": "2025-06-01T00:00:00Z",
      "FechaFin": "2025-08-31T00:00:00Z",
      "SKUID": "P001",
      "IdListaOK": null,
      "Descuento%": 10,
      "ACTIVED": true,
      "DELETED": false
    }
  ],
  "principal": true,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

---

### 🔍 **2. Obtener la promoción específica existente**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=GetOne&idPromoOK=PROMO001&LoggedUser=Laura
Content-Type: application/json
```
**Body:** (vacío)

**Respuesta esperada:**
```json
{
  "success": true,
  "process": "Obtener UNA PROMOCION",
  "processType": "GetOne",
  "loggedUser": "Laura",
  "status": 200,
  "method": "POST",
  "api": "/crudPromociones?ProcessType=GetOne&idPromoOK=PROMO001",
  "messageUSR": "Promoción encontrada correctamente",
  "messageDEV": "Promoción PROMO001 encontrada exitosamente",
  "dataRes": {
    "_id": "68d4921293fed01513e946be",
    "IdPromoOK": "PROMO001",
    "Titulo": "Descuento verano",
    "Descripcion": "10% de descuento en producto P001",
    "FechaIni": "2025-06-01T00:00:00Z",
    "FechaFin": "2025-08-31T00:00:00Z",
    "SKUID": "P001",
    "IdListaOK": null,
    "Descuento%": 10,
    "ACTIVED": true,
    "DELETED": false
  },
  "principal": true,
  "timestamp": "2025-10-16T10:30:00.000Z"
}
```

---

### ➕ **3. Crear nueva promoción (similar estructura)**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=AddOne&LoggedUser=Laura
Content-Type: application/json
```
**Body:**
```json
{
  "IdPromoOK": "PROMO002",
  "Titulo": "Descuento otoño",
  "Descripcion": "15% de descuento en producto P002",
  "FechaIni": "2025-09-01T00:00:00Z",
  "FechaFin": "2025-11-30T00:00:00Z",
  "SKUID": "P002",
  "IdListaOK": null,
  "Descuento%": 15,
  "REGUSER": "Laura"
}
```

---

### ✏️ **4. Actualizar promoción existente**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=UpdateOne&idPromoOK=PROMO001&LoggedUser=Laura
Content-Type: application/json
```
**Body:**
```json
{
  "Titulo": "Descuento verano EXTENDIDO",
  "Descripcion": "15% de descuento en producto P001 - PROMOCIÓN EXTENDIDA",
  "FechaFin": "2025-09-15T00:00:00Z",
  "Descuento%": 15
}
```

---

### 🗑️ **5. Borrado lógico de promoción existente**
```http
POST http://localhost:3033/api/ztpromociones/crudPromociones?ProcessType=DeleteOne&idPromoOK=PROMO001&LoggedUser=Laura
Content-Type: application/json
```
**Body:** (vacío)

**Resultado:** Cambiará `ACTIVED: false` y `DELETED: true`

---

## 📋 **SERVICIO LEGACY - promocionesCRUD**

### 🔍 **6. Obtener todas las promociones (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=get&type=all
Content-Type: application/json
```
**Body:** (vacío)

**Respuesta esperada:**
```json
[
  {
    "_id": "68d4921293fed01513e946be",
    "IdPromoOK": "PROMO001",
    "Titulo": "Descuento verano",
    "Descripcion": "10% de descuento en producto P001",
    "FechaIni": "2025-06-01T00:00:00Z",
    "FechaFin": "2025-08-31T00:00:00Z",
    "SKUID": "P001",
    "IdListaOK": null,
    "Descuento%": 10,
    "ACTIVED": true,
    "DELETED": false
  }
]
```

---

### 🔍 **7. Obtener promoción específica (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=get&type=one&idPromoOK=PROMO001
Content-Type: application/json
```
**Body:** (vacío)

---

### 🔍 **8. Obtener promociones por producto (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=get&type=by-product&skuid=P001
Content-Type: application/json
```
**Body:** (vacío)

**Respuesta esperada:** Retornará la promoción `PROMO001` ya que está asociada al `SKUID: "P001"`

---

### 🔍 **9. Obtener promociones vigentes (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=get&type=vigentes
Content-Type: application/json
```
**Body:** (vacío)

**Nota:** La promoción `PROMO001` tiene fechas desde `2025-06-01` hasta `2025-08-31`, por lo que **NO estará vigente** en octubre 2025.

---

### ➕ **10. Crear nueva promoción (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=post
Content-Type: application/json
```
**Body:**
```json
{
  "IdPromoOK": "PROMO003",
  "Titulo": "Descuento navidad",
  "Descripcion": "20% de descuento en producto P003",
  "FechaIni": "2025-12-01T00:00:00Z",
  "FechaFin": "2025-12-31T00:00:00Z",
  "SKUID": "P003",
  "IdListaOK": null,
  "Descuento%": 20,
  "REGUSER": "Laura"
}
```

---

### ✏️ **11. Actualizar promoción (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=put&idPromoOK=PROMO001
Content-Type: application/json
```
**Body:**
```json
{
  "Titulo": "Descuento verano MEGA",
  "Descripcion": "25% de descuento en producto P001 - OFERTA ESPECIAL",
  "Descuento%": 25
}
```

---

### 🗑️ **12. Borrado lógico (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=delete&type=logic&idPromoOK=PROMO001
Content-Type: application/json
```
**Body:** (vacío)

---

### 💥 **13. Borrado físico (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=delete&type=hard&idPromoOK=PROMO001
Content-Type: application/json
```
**Body:** (vacío)

**⚠️ CUIDADO:** Esto eliminará permanentemente el registro de la base de datos.

---

### ✅ **14. Activar promoción (Legacy)**
```http
POST http://localhost:3033/api/ztpromociones/promocionesCRUD?procedure=activate&idPromoOK=PROMO001
Content-Type: application/json
```
**Body:** (vacío)

**Resultado:** Cambiará `ACTIVED: true` y `DELETED: false`

---

## 🎯 **CASOS DE PRUEBA ESPECÍFICOS**

### ✅ **Casos que deberían funcionar:**
1. **GetAll** → Retornará 1 promoción
2. **GetOne con PROMO001** → Retornará la promoción existente  
3. **GetByProduct con P001** → Retornará PROMO001
4. **UpdateOne PROMO001** → Actualizará los campos especificados

### ❌ **Casos que deberían fallar:**
1. **GetOne con PROMO999** → Error: Promoción no encontrada
2. **GetByProduct con P999** → Retornará array vacío
3. **GetVigentes** → Array vacío (promoción expirada)
4. **AddOne con PROMO001** → Error: ID duplicado

---

## 📊 **ANÁLISIS DE LOS DATOS REALES**

### 🔍 **Observaciones importantes:**
- **Estado:** Promoción activa (`ACTIVED: true, DELETED: false`)
- **Vigencia:** **EXPIRADA** (terminó el 31 de agosto 2025)
- **Producto:** Asociada al SKU `P001`
- **Lista:** No asociada a ninguna lista (`IdListaOK: null`)
- **Descuento:** 10% de tipo entero (`Int32`)
- **Fechas:** Formato ISO 8601 con Z

### 🛠️ **Recomendaciones para testing:**
1. **Crear promociones vigentes** para probar filtros de fecha
2. **Usar diferentes SKUIDs** para probar filtros por producto  
3. **Asignar IdListaOK** para probar filtros por lista
4. **Probar límites** de descuento (0-100%)
5. **Validar fechas** (FechaIni debe ser < FechaFin)

---

## 🚀 **COLECCIÓN POSTMAN SUGERIDA**

### 📁 **Carpeta: "PROMOCIONES - DATOS REALES"**
1. **🔍 Consultas**
   - GetAll (debe retornar 1)
   - GetOne PROMO001 (existente)
   - GetOne PROMO999 (no existe)
   - GetByProduct P001 (existente)
   - GetVigentes (vacío por fechas)

2. **➕ Creaciones**
   - Crear PROMO002 (nueva)
   - Crear PROMO001 (duplicado - error)

3. **✏️ Actualizaciones**
   - Update PROMO001 (existente)
   - Update PROMO999 (no existe)

4. **🗑️ Eliminaciones**
   - Delete lógico PROMO001
   - Reactivar PROMO001
   - Delete físico (CUIDADO)

---

**🎯 Puerto configurado:** `localhost:3033`
**📅 Fecha actual:** 16 de octubre 2025
**⏰ Estado promoción:** EXPIRADA (terminó 31 ago 2025)