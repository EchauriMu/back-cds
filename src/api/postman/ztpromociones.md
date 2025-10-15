# 📋 ZTPROMOCIONES - Endpoints para Postman

---

## 🔍 **1. Obtener todas las promociones**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=get&type=all
Content-Type: application/json
```
**Body:** (vacío)

---

## 🔍 **2. Obtener una promoción específica**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=get&type=one&idpromoOK=PROMO123
Content-Type: application/json
```
**Body:** (vacío)

---

## 🔍 **3. Obtener promociones por producto**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=get&type=by-product&skuid=SKU123
Content-Type: application/json
```
**Body:** (vacío)

---

## 🔍 **4. Obtener promociones por lista de precios**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=get&type=by-lista&idlistaok=LISTA123
Content-Type: application/json
```
**Body:** (vacío)

---

## 🔍 **5. Obtener promociones vigentes (activas y dentro del rango de fechas)**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=get&type=vigentes
Content-Type: application/json
```
**Body:** (vacío)

---

## ➕ **6. Crear nueva promoción**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=post
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
  "IdListaOK": null,
  "DescuentoPorcentaje": 25.5,
  "ACTIVED": true,
  "DELETED": false,
  "REGUSER": "admin@empresa.com"
}
```

**Campos obligatorios:**
- `IdPromoOK`: Identificador único
- `Titulo`: Título de la promoción
- `FechaIni`: Fecha inicio (ISO 8601)
- `FechaFin`: Fecha fin (ISO 8601)
- `REGUSER`: Usuario que registra
- Al menos uno: `SKUID` o `IdListaOK`

---

## ✏️ **7. Actualizar promoción existente**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=put&idpromoOK=PROMO2024001
Content-Type: application/json
```
**Body:**
```json
{
  "Titulo": "Descuento Black Friday EXTENDIDO",
  "Descripcion": "Promoción extendida hasta diciembre",
  "FechaFin": "2024-12-05T23:59:59.000Z",
  "DescuentoPorcentaje": 30.0,
  "MODUSER": "admin@empresa.com"
}
```

---

## 🗑️ **8. Borrado lógico (soft delete)**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=delete&type=logic&idpromoOK=PROMO2024001
Content-Type: application/json
```
**Body:** (vacío)

**Resultado:** Marca `ACTIVED: false` y `DELETED: true`

---

## 🗑️ **9. Borrado físico (hard delete)**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=delete&type=hard&idpromoOK=PROMO2024001
Content-Type: application/json
```
**Body:** (vacío)

**⚠️ CUIDADO:** Elimina permanentemente el registro de la base de datos

---

## 🔄 **10. Activar promoción**
```http
POST {{base_url}}/api/ztpromociones/promocionesCRUD?procedure=activate&idpromoOK=PROMO2024001
Content-Type: application/json
```
**Body:** (vacío)

**Resultado:** Marca `ACTIVED: true` y `DELETED: false`

---

## 📝 **Variables de Postman**

Crear una variable de entorno:
- **Variable:** `base_url`
- **Valor:** `http://localhost:4004` (o tu servidor)

---

## 📊 **Ejemplos de respuesta exitosa:**

### GET (todas las promociones):
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
    "IdListaOK": null,
    "DescuentoPorcentaje": 25.5,
    "ACTIVED": true,
    "DELETED": false,
    "REGUSER": "admin@empresa.com",
    "REGDATE": "2024-10-14T10:30:00.000Z",
    "createdAt": "2024-10-14T10:30:00.000Z",
    "updatedAt": "2024-10-14T10:30:00.000Z"
  }
]
```

### Error:
```json
{
  "error": true,
  "message": "Ya existe una promoción con ese IdPromoOK"
}
```

---

## 🚀 **Tips para testing:**

1. **Usar fechas futuras** para promociones vigentes
2. **Validar rangos de descuento** (0-100%)
3. **Probar con productos/listas existentes**
4. **Testear validaciones** (fechas, campos obligatorios)
5. **Verificar soft delete** antes del hard delete