# ZTPROMOCIONES - Configuración para Postman GUI

## 🔧 CONFIGURACIÓN INICIAL

### 1. Crear Environment
```
Name: ZTPROMOCIONES Environment
Variables:
- BASE_URL = http://localhost:3033
- LOGGED_USER = lpaniaguag
- DB_SERVER = MongoDB
```

### 2. Crear Collection
```
Name: ZTPROMOCIONES API
Description: APIs para gestión de promociones con estructura técnica estandarizada
```

---

## 📋 REQUESTS PARA CREAR EN POSTMAN GUI

### 🔍 REQUEST 1: Get All Promociones

**Nombre:** `Get All Promociones`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = GetFilters
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
limit = 50
offset = 0
```

**Headers:**
```
Content-Type = application/json
```

**Body:** `None`

**Tests (opcional):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success property", function () {
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.have.property('success', true);
});
```

---

### 🎯 REQUEST 2: Get One Promoción (PROMO001)

**Nombre:** `Get One Promoción - PROMO001`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = GetFilters
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
IdPromoOK = PROMO001
```

**Headers:**
```
Content-Type = application/json
```

**Body:** `None`

---

### 🛍️ REQUEST 3: Get By Product (P001)

**Nombre:** `Get By Product - P001`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = GetFilters
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
SKUID = P001
```

**Headers:**
```
Content-Type = application/json
```

**Body:** `None`

---

### ⏰ REQUEST 4: Get Promociones Vigentes

**Nombre:** `Get Promociones Vigentes`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = GetFilters
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
vigentes = true
limit = 20
```

**Headers:**
```
Content-Type = application/json
```

**Body:** `None`

---

### ➕ REQUEST 5: Create Promoción

**Nombre:** `Create Nueva Promoción`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = AddMany
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
```

**Headers:**
```
Content-Type = application/json
```

**Body (raw - JSON):**
```json
{
  "promociones": [
    {
      "IdPromoOK": "PROMO002",
      "Titulo": "Descuento otoño",
      "Descripcion": "15% de descuento en producto P002",
      "FechaIni": "2024-10-19T00:00:00Z",
      "FechaFin": "2024-12-31T00:00:00Z",
      "SKUID": "P002",
      "IdListaOK": null,
      "Descuento%": 15
    }
  ]
}
```

---

### ✏️ REQUEST 6: Update Promoción

**Nombre:** `Update Promoción - PROMO001`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = UpdateMany
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
```

**Headers:**
```
Content-Type = application/json
```

**Body (raw - JSON):**
```json
{
  "filter": {
    "IdPromoOK": "PROMO001"
  },
  "updates": {
    "Titulo": "Descuento verano EXTENDIDO",
    "Descripcion": "15% de descuento en producto P001 - OFERTA EXTENDIDA",
    "FechaFin": "2025-12-31T00:00:00Z",
    "Descuento%": 15
  }
}
```

---

### 🗑️ REQUEST 7: Delete Lógico

**Nombre:** `Delete Lógico - PROMO001`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = DeleteMany
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
deleteType = logic
```

**Headers:**
```
Content-Type = application/json
```

**Body (raw - JSON):**
```json
{
  "filter": {
    "IdPromoOK": "PROMO001"
  },
  "deleteType": "logic"
}
```

---

### 🔄 REQUEST 8: Reactivar Promoción

**Nombre:** `Reactivar Promoción - PROMO001`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = UpdateMany
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
```

**Headers:**
```
Content-Type = application/json
```

**Body (raw - JSON):**
```json
{
  "filter": {
    "IdPromoOK": "PROMO001"
  },
  "updates": {
    "ACTIVED": true,
    "DELETED": false
  }
}
```

---

### ⚠️ REQUEST 9: Legacy Endpoint (Deprecado)

**Nombre:** `Legacy - Get All (DEPRECADO)`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/promocionesCRUD`

**Params (Query):**
```
procedure = get
type = all
```

**Headers:**
```
Content-Type = application/json
```

**Body:** `None`

---

## 🚨 REQUESTS DE ERROR PARA TESTING

### ❌ REQUEST 10: Error - Promoción No Existe

**Nombre:** `ERROR - Promoción No Existe`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
ProcessType = GetFilters
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
IdPromoOK = PROMO999
```

**Headers:**
```
Content-Type = application/json
```

**Body:** `None`

---

### ❌ REQUEST 11: Error - Falta ProcessType

**Nombre:** `ERROR - Falta ProcessType`
**Método:** `POST`
**URL:** `{{BASE_URL}}/api/ztpromociones/crudPromociones`

**Params (Query):**
```
DBServer = {{DB_SERVER}}
LoggedUser = {{LOGGED_USER}}
```

**Headers:**
```
Content-Type = application/json
```

**Body:** `None`

---

## 📊 ORGANIZACIÓN EN CARPETAS

```
📁 ZTPROMOCIONES API
  📁 1️⃣ GET Operations
    - Get All Promociones
    - Get One Promoción - PROMO001
    - Get By Product - P001
    - Get Promociones Vigentes
  
  📁 2️⃣ CREATE Operations
    - Create Nueva Promoción
  
  📁 3️⃣ UPDATE Operations
    - Update Promoción - PROMO001
    - Reactivar Promoción - PROMO001
  
  📁 4️⃣ DELETE Operations
    - Delete Lógico - PROMO001
  
  📁 ⚠️ LEGACY & ERRORS
    - Legacy - Get All (DEPRECADO)
    - ERROR - Promoción No Existe
    - ERROR - Falta ProcessType
```

---

## 🔧 CONFIGURACIÓN ADICIONAL

### Pre-request Script (Nivel Collection):
```javascript
// Validar variables de entorno
if (!pm.environment.get('BASE_URL')) {
    console.error('❌ Variable BASE_URL no definida');
}
if (!pm.environment.get('LOGGED_USER')) {
    console.error('❌ Variable LOGGED_USER no definida');
}
if (!pm.environment.get('DB_SERVER')) {
    pm.environment.set('DB_SERVER', 'MongoDB');
    console.log('✅ DB_SERVER configurado como MongoDB por defecto');
}

// Log de request
console.log(`🚀 Ejecutando: ${pm.info.requestName}`);
console.log(`📍 URL: ${pm.request.url}`);
```

### Tests (Nivel Collection):
```javascript
// Tests básicos para todas las requests
pm.test('Response time is less than 5000ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

pm.test('Response is JSON', function () {
    pm.response.to.be.json;
});

pm.test('Response has correct structure', function () {
    const responseJson = pm.response.json();
    
    if (pm.response.code === 200 || pm.response.code === 201) {
        pm.expect(responseJson).to.have.property('success');
        pm.expect(responseJson).to.have.property('messageUSR');
        
        if (responseJson.bitacora) {
            pm.expect(responseJson.bitacora).to.have.property('processType');
            pm.expect(responseJson.bitacora).to.have.property('loggedUser');
            pm.expect(responseJson.bitacora).to.have.property('dbServer');
        }
    }
});

// Log de respuesta
console.log(`✅ Status: ${pm.response.code}`);
console.log(`⏱️ Tiempo: ${pm.response.responseTime}ms`);

if (pm.response.json().success === false) {
    console.warn(`⚠️ Error: ${pm.response.json().messageUSR}`);
}
```

---

## 🎯 INSTRUCCIONES DE USO

1. **Crear Environment** con las variables especificadas
2. **Crear Collection** con el nombre sugerido
3. **Añadir cada request** siguiendo la configuración exacta
4. **Organizar en carpetas** según la estructura propuesta
5. **Agregar scripts** de pre-request y tests a nivel collection
6. **Probar cada endpoint** en el orden sugerido

**✅ Listo para usar en Postman GUI!**