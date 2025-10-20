# 🔢 Códigos de Estado y Respuestas HTTP

## 📋 Tabla de Contenidos

1. [Códigos HTTP Estándar](#codigos-estandar)
2. [Uso por Operación CRUD](#uso-crud)
3. [Códigos en Bitácora](#codigos-bitacora)
4. [Respuestas Exitosas vs Errores](#respuestas)
5. [Códigos Personalizados](#codigos-personalizados)
6. [Ejemplos por Escenario](#ejemplos)
7. [Testing en Postman](#testing-postman)
8. [Mejores Prácticas](#mejores-practicas)

---

## <a name="codigos-estandar"></a>🎯 1. Códigos HTTP Estándar

### Códigos de Éxito (2xx)

| Código | Nombre | Uso | Operación |
|--------|--------|-----|-----------|
| **200** | OK | Operación exitosa | GET, UPDATE, DELETE |
| **201** | Created | Recurso creado | POST, AddMany |
| **204** | No Content | Éxito sin contenido | DELETE (opcional) |

### Códigos de Error del Cliente (4xx)

| Código | Nombre | Uso | Ejemplo |
|--------|--------|-----|---------|
| **400** | Bad Request | Parámetros inválidos | Falta ProcessType, LoggedUser inválido |
| **401** | Unauthorized | Sin autenticación | Token faltante o inválido |
| **403** | Forbidden | Sin permisos | Usuario sin acceso al recurso |
| **404** | Not Found | Recurso no existe | Promoción no encontrada |
| **409** | Conflict | Conflicto de estado | ID duplicado |
| **422** | Unprocessable Entity | Error de negocio | Regla de validación no cumplida |

### Códigos de Error del Servidor (5xx)

| Código | Nombre | Uso | Ejemplo |
|--------|--------|-----|---------|
| **500** | Internal Server Error | Error no manejado | Error inesperado en BD |
| **502** | Bad Gateway | Error de conexión | MongoDB no responde |
| **503** | Service Unavailable | Servicio no disponible | BD en mantenimiento |
| **504** | Gateway Timeout | Timeout | Query demoró demasiado |

---

## <a name="uso-crud"></a>📊 2. Uso por Operación CRUD

### GetFilters (Consultar)

| Escenario | Código | messageUSR |
|-----------|--------|------------|
| ✅ Datos encontrados | **200** | `Promociones obtenidas: ${count}` |
| ✅ Sin resultados | **200** | `No se encontraron promociones con los filtros aplicados` |
| ❌ Error en query | **500** | `Error al consultar promociones` |
| ❌ Parámetros inválidos | **400** | `Parámetros de filtro inválidos` |

**Ejemplo:**

```javascript
// GetFilters exitoso
data.dataRes = promociones;
data.countDataRes = promociones.length;
data.messageUSR = `Promociones obtenidas: ${promociones.length}`;
data.messageDEV = 'Query ejecutado correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 200, true);
```

---

### AddMany (Crear)

| Escenario | Código | messageUSR |
|-----------|--------|------------|
| ✅ Creación exitosa | **201** | `${count} promociones creadas exitosamente` |
| ❌ Datos inválidos | **400** | `Datos de promociones inválidos` |
| ❌ ID duplicado | **409** | `Promoción con ID ${id} ya existe` |
| ❌ Regla negocio violada | **422** | `No se puede crear promoción sin productos` |
| ❌ Error en BD | **500** | `Error al crear promociones` |

**Ejemplo:**

```javascript
// AddMany exitoso
data.dataRes = insertedPromociones;
data.countDataRes = insertedPromociones.length;
data.messageUSR = `${insertedPromociones.length} promociones creadas exitosamente`;
data.messageDEV = 'Inserción completada correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 201, true);
```

---

### UpdateMany (Actualizar)

| Escenario | Código | messageUSR |
|-----------|--------|------------|
| ✅ Actualización exitosa | **200** | `${count} promociones actualizadas` |
| ❌ Promoción no existe | **404** | `Promoción con ID ${id} no encontrada` |
| ❌ Datos inválidos | **400** | `Datos de actualización inválidos` |
| ❌ Regla negocio violada | **422** | `No se puede desactivar promoción activa` |
| ❌ Error en BD | **500** | `Error al actualizar promociones` |

**Ejemplo:**

```javascript
// UpdateMany exitoso
data.dataRes = updatedPromociones;
data.countDataRes = updatedPromociones.length;
data.messageUSR = `${updatedPromociones.length} promociones actualizadas exitosamente`;
data.messageDEV = 'Actualización completada correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 200, true);
```

---

### DeleteMany (Eliminar)

| Escenario | Código | messageUSR |
|-----------|--------|------------|
| ✅ Eliminación exitosa | **200** | `${count} promociones eliminadas` |
| ✅ Eliminación sin contenido | **204** | - |
| ❌ Promoción no existe | **404** | `Promoción con ID ${id} no encontrada` |
| ❌ Promoción en uso | **409** | `No se puede eliminar promoción activa` |
| ❌ Error en BD | **500** | `Error al eliminar promociones` |

**Ejemplo:**

```javascript
// DeleteMany exitoso
data.dataRes = deletedPromociones;
data.countDataRes = deletedPromociones.length;
data.messageUSR = `${deletedPromociones.length} promociones eliminadas exitosamente`;
data.messageDEV = 'Eliminación completada correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 200, true);
```

---

## <a name="codigos-bitacora"></a>📦 3. Códigos en Bitácora

### Estructura de AddMSG

```javascript
// Firma de AddMSG
bitacora = AddMSG(bitacora, data, tipo, status, principal);

// Parámetros:
// - bitacora: objeto bitácora
// - data: objeto DATA() con información
// - tipo: 'OK' | 'FAIL'
// - status: código HTTP (200, 201, 400, 404, 500, etc.)
// - principal: boolean (true para registro principal)
```

### Ejemplos de Uso

#### Éxito (200)

```javascript
data.dataRes = resultados;
data.messageUSR = 'Operación exitosa';
data.messageDEV = 'Query ejecutado correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 200, true);
bitacora.success = true;
```

#### Creación (201)

```javascript
data.dataRes = nuevosRegistros;
data.messageUSR = `${count} registros creados`;
data.messageDEV = 'Inserción completada';

bitacora = AddMSG(bitacora, data, 'OK', 201, true);
bitacora.success = true;
```

#### Error de Validación (400)

```javascript
data.messageUSR = 'Parámetro LoggedUser inválido';
data.messageDEV = 'Formato esperado: usuario@empresa';
data.receivedValue = LoggedUser;

bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
bitacora.success = false;
bitacora.finalRes = true;
```

#### No Encontrado (404)

```javascript
data.messageUSR = `Promoción con ID "${IdPromoOK}" no encontrada`;
data.messageDEV = 'No existe registro con el ID proporcionado';

bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
bitacora.success = false;
bitacora.finalRes = true;
```

#### Error Interno (500)

```javascript
data.messageUSR = 'Error al procesar solicitud';
data.messageDEV = `Error en query: ${error.message}`;

if (process.env.NODE_ENV === 'development') {
  data.stack = error.stack;
}

bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
bitacora.success = false;
bitacora.finalRes = true;
```

---

## <a name="respuestas"></a>✅ 4. Respuestas Exitosas vs Errores

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "status": 200,
  "process": "Obtener promociones (GetFilters)",
  "processType": "GetFilters",
  "messageUSR": "Promociones obtenidas: 5",
  "messageDEV": "Query ejecutado correctamente",
  "countData": 1,
  "countDataRes": 5,
  "dbServer": "MongoDB",
  "loggedUser": "jlopezm@innovacion.com",
  "data": [
    {
      "success": true,
      "status": 200,
      "process": "Obtener promociones (GetFilters)",
      "principal": true,
      "dataRes": [
        { "IdPromoOK": "PROMO001", "Titulo": "..." },
        { "IdPromoOK": "PROMO002", "Titulo": "..." },
        // ... más promociones
      ],
      "countDataRes": 5,
      "messageUSR": "Promociones obtenidas: 5",
      "messageDEV": "Query ejecutado correctamente"
    }
  ]
}
```

**Características**:
- ✅ `success: true`
- ✅ `status: 200` (o 201)
- ✅ `dataRes` con resultados
- ✅ `countDataRes > 0`
- ✅ `messageUSR` amigable
- ✅ `messageDEV` técnico

---

### Respuesta con Error (400)

```json
{
  "success": false,
  "status": 400,
  "process": "Validación de parámetros",
  "processType": "ValidationError",
  "messageUSR": "Parámetro LoggedUser inválido",
  "messageDEV": "Formato esperado: usuario@empresa, recibido: invalid",
  "countData": 1,
  "countDataRes": 0,
  "finalRes": true,
  "data": [
    {
      "success": false,
      "status": 400,
      "process": "Validación de parámetros",
      "principal": true,
      "dataRes": [],
      "messageUSR": "Parámetro LoggedUser inválido",
      "messageDEV": "Formato esperado: usuario@empresa, recibido: invalid",
      "receivedValue": "invalid"
    }
  ]
}
```

**Características**:
- ❌ `success: false`
- ❌ `status: 400` (o 404, 422, 500)
- ❌ `dataRes: []` (vacío)
- ❌ `finalRes: true` (detener ejecución)
- ❌ `messageUSR` descriptivo
- ❌ `messageDEV` con detalles técnicos

---

## <a name="codigos-personalizados"></a>🎨 5. Códigos Personalizados

### ⚠️ Advertencia

Aunque es **posible** usar códigos personalizados (ej. 291, 292), **NO se recomienda** porque:

1. ❌ No son estándar HTTP
2. ❌ No son reconocidos por proxies/gateways
3. ❌ No son comprendidos por herramientas (Postman, Swagger)
4. ❌ Dificultan el debugging
5. ❌ No siguen convenciones REST

### Alternativa Recomendada

En lugar de códigos personalizados, usar:

1. ✅ **Códigos HTTP estándar** (200, 201, 400, etc.)
2. ✅ **Campo `processType`** para diferenciar operaciones
3. ✅ **Campo `messageUSR`** para mensajes específicos
4. ✅ **Campo `messageDEV`** para detalles técnicos
5. ✅ **Campo custom adicional** si es necesario

**Ejemplo:**

```javascript
// ❌ NO RECOMENDADO
bitacora = AddMSG(bitacora, data, 'OK', 291, true);

// ✅ RECOMENDADO
bitacora = AddMSG(bitacora, data, 'OK', 200, true);
data.customCode = 'PROMO_PARTIAL_UPDATE'; // Campo adicional si es necesario
data.messageUSR = 'Actualización parcial completada';
```

---

### Testing en Postman con Códigos Personalizados

Si **absolutamente necesario** para testing interno:

```javascript
// En el servicio
if (process.env.NODE_ENV === 'development' && params.customStatus) {
  // Solo en desarrollo y si se solicita explícitamente
  const customStatus = parseInt(params.customStatus);
  if (customStatus >= 200 && customStatus <= 599) {
    bitacora.status = customStatus;
  }
}
```

**Postman Test:**

```javascript
// Test en Postman
pm.test("Status code personalizado en desarrollo", function () {
    // En desarrollo se puede validar código custom
    pm.expect(pm.response.code).to.be.oneOf([200, 291, 292]);
});

// Test para producción
pm.test("Status code estándar HTTP", function () {
    // En producción solo códigos estándar
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 400, 404, 500]);
});
```

---

## <a name="ejemplos"></a>💡 6. Ejemplos por Escenario

### Escenario 1: GetFilters - Éxito con Datos

```javascript
async function GetFiltersPromocionesMethod(bitacora, params, ...) {
  let data = DATA();
  
  try {
    const promociones = await ZTPromociones.find(filter).lean();
    
    // ✅ Éxito: datos encontrados
    data.dataRes = promociones;
    data.countDataRes = promociones.length;
    data.messageUSR = `Promociones obtenidas: ${promociones.length}`;
    data.messageDEV = 'Query ejecutado correctamente';
    
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // ❌ Error
    data.messageUSR = 'Error al obtener promociones';
    data.messageDEV = `Error en query: ${error.message}`;
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true;
    
    return bitacora;
  }
}
```

**Respuesta HTTP**: 200 OK

---

### Escenario 2: GetFilters - Sin Resultados

```javascript
const promociones = await ZTPromociones.find(filter).lean();

if (promociones.length === 0) {
  // ✅ Éxito pero sin resultados
  data.dataRes = [];
  data.countDataRes = 0;
  data.messageUSR = 'No se encontraron promociones con los filtros aplicados';
  data.messageDEV = 'Query ejecutado correctamente, 0 resultados';
  
  bitacora = AddMSG(bitacora, data, 'OK', 200, true);
  bitacora.success = true;
  
  return bitacora;
}
```

**Respuesta HTTP**: 200 OK (no 404, porque el query fue exitoso)

---

### Escenario 3: AddMany - Éxito

```javascript
const insertedPromociones = await ZTPromociones.insertMany(promocionesData);

// ✅ Creación exitosa
data.dataRes = insertedPromociones;
data.countDataRes = insertedPromociones.length;
data.messageUSR = `${insertedPromociones.length} promociones creadas exitosamente`;
data.messageDEV = 'Inserción completada correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 201, true);
bitacora.success = true;
```

**Respuesta HTTP**: 201 Created

---

### Escenario 4: AddMany - Datos Inválidos

```javascript
if (!promocionesData || promocionesData.length === 0) {
  // ❌ Error de validación
  data.messageUSR = 'No se puede crear promociones con array vacío';
  data.messageDEV = 'El array promociones debe contener al menos 1 elemento';
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.success = false;
  bitacora.finalRes = true;
  
  return bitacora;
}
```

**Respuesta HTTP**: 400 Bad Request

---

### Escenario 5: AddMany - ID Duplicado

```javascript
try {
  await ZTPromociones.insertMany(promocionesData);
} catch (error) {
  if (error.code === 11000) {
    // ❌ Error de duplicado
    data.messageUSR = 'Una o más promociones ya existen';
    data.messageDEV = `Duplicate key error: ${error.message}`;
    data.errorCode = error.code;
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 409, true);
    bitacora.success = false;
    bitacora.finalRes = true;
    
    return bitacora;
  }
}
```

**Respuesta HTTP**: 409 Conflict

---

### Escenario 6: UpdateMany - No Encontrado

```javascript
const promocion = await ZTPromociones.findOne({ IdPromoOK });

if (!promocion) {
  // ❌ Recurso no existe
  data.messageUSR = `Promoción con ID "${IdPromoOK}" no encontrada`;
  data.messageDEV = 'No existe registro con el ID proporcionado';
  data.searchedId = IdPromoOK;
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
  bitacora.success = false;
  bitacora.finalRes = true;
  
  return bitacora;
}
```

**Respuesta HTTP**: 404 Not Found

---

### Escenario 7: UpdateMany - Regla de Negocio Violada

```javascript
if (promocion.Activo && updateData.Activo === false) {
  // ❌ Error de negocio
  data.messageUSR = 'No se puede desactivar una promoción activa con ventas';
  data.messageDEV = 'Business rule: promoción con ventas no puede desactivarse';
  data.promocionId = IdPromoOK;
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 422, true);
  bitacora.success = false;
  bitacora.finalRes = true;
  
  return bitacora;
}
```

**Respuesta HTTP**: 422 Unprocessable Entity

---

### Escenario 8: DeleteMany - Éxito

```javascript
const deletedPromociones = await ZTPromociones.deleteMany({ 
  IdPromoOK: { $in: idsToDelete } 
});

// ✅ Eliminación exitosa
data.dataRes = deletedPromociones;
data.countDataRes = deletedPromociones.deletedCount;
data.messageUSR = `${deletedPromociones.deletedCount} promociones eliminadas`;
data.messageDEV = 'Eliminación completada correctamente';

bitacora = AddMSG(bitacora, data, 'OK', 200, true);
bitacora.success = true;
```

**Respuesta HTTP**: 200 OK

---

## <a name="testing-postman"></a>🧪 7. Testing en Postman

### Tests Básicos de Status Code

```javascript
// Test 1: Verificar éxito
pm.test("Status code es 200 para GetFilters exitoso", function () {
    pm.response.to.have.status(200);
});

// Test 2: Verificar creación
pm.test("Status code es 201 para AddMany exitoso", function () {
    pm.response.to.have.status(201);
});

// Test 3: Verificar error de validación
pm.test("Status code es 400 para parámetros inválidos", function () {
    pm.response.to.have.status(400);
});

// Test 4: Verificar no encontrado
pm.test("Status code es 404 para recurso inexistente", function () {
    pm.response.to.have.status(404);
});

// Test 5: Verificar error interno
pm.test("Status code es 500 para error de BD", function () {
    pm.response.to.have.status(500);
});
```

---

### Tests Avanzados con Bitácora

```javascript
// Test: Verificar estructura de respuesta exitosa
pm.test("Respuesta exitosa tiene estructura correcta", function () {
    const jsonData = pm.response.json();
    
    pm.expect(jsonData).to.have.property('success', true);
    pm.expect(jsonData).to.have.property('status', 200);
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData.data[0]).to.have.property('dataRes');
    pm.expect(jsonData.data[0].dataRes).to.be.an('array');
});

// Test: Verificar estructura de error
pm.test("Respuesta de error tiene estructura correcta", function () {
    const jsonData = pm.response.json();
    
    pm.expect(jsonData).to.have.property('success', false);
    pm.expect(jsonData).to.have.property('status').that.is.oneOf([400, 404, 422, 500]);
    pm.expect(jsonData).to.have.property('finalRes', true);
    pm.expect(jsonData.data[0]).to.have.property('messageUSR');
    pm.expect(jsonData.data[0]).to.have.property('messageDEV');
});

// Test: Verificar código según operación
pm.test("Código de status correcto según ProcessType", function () {
    const jsonData = pm.response.json();
    const processType = jsonData.processType;
    const status = jsonData.status;
    
    if (processType === 'AddMany' && jsonData.success) {
        pm.expect(status).to.equal(201);
    } else if (jsonData.success) {
        pm.expect(status).to.equal(200);
    } else {
        pm.expect(status).to.be.oneOf([400, 404, 409, 422, 500]);
    }
});
```

---

### Tests de Validación de Códigos

```javascript
// Test: Solo códigos HTTP estándar en producción
pm.test("Solo códigos HTTP estándar", function () {
    const status = pm.response.code;
    
    // Rango válido de códigos HTTP
    pm.expect(status).to.be.at.least(100);
    pm.expect(status).to.be.at.most(599);
    
    // Códigos más comunes en la API
    pm.expect(status).to.be.oneOf([
        200, 201, 204,           // Éxito
        400, 401, 403, 404, 409, 422,  // Error cliente
        500, 502, 503, 504       // Error servidor
    ]);
});
```

---

## <a name="mejores-practicas"></a>✅ 8. Mejores Prácticas

### DO ✅

#### 1. **Usar códigos HTTP estándar**

```javascript
// ✅ Correcto
bitacora = AddMSG(bitacora, data, 'OK', 200, true);     // GET, UPDATE, DELETE
bitacora = AddMSG(bitacora, data, 'OK', 201, true);     // POST, CREATE
bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);   // Validación
bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);   // No encontrado
bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);   // Error interno
```

#### 2. **Código 200 para GetFilters sin resultados**

```javascript
// ✅ Correcto (query exitoso, 0 resultados)
if (promociones.length === 0) {
  data.dataRes = [];
  data.messageUSR = 'No se encontraron promociones';
  bitacora = AddMSG(bitacora, data, 'OK', 200, true);
}
```

#### 3. **Código 201 para creación**

```javascript
// ✅ Correcto
const inserted = await Model.insertMany(data);
bitacora = AddMSG(bitacora, data, 'OK', 201, true);
```

#### 4. **Código 404 cuando recurso no existe**

```javascript
// ✅ Correcto
const item = await Model.findById(id);
if (!item) {
  bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
}
```

#### 5. **Código 422 para errores de negocio**

```javascript
// ✅ Correcto
if (promocion.Ventas > 0 && updateData.Activo === false) {
  data.messageUSR = 'No se puede desactivar promoción con ventas';
  bitacora = AddMSG(bitacora, data, 'FAIL', 422, true);
}
```

#### 6. **Incluir detalles en messageDEV**

```javascript
// ✅ Correcto
data.messageUSR = 'Error al procesar solicitud';
data.messageDEV = `Error en query MongoDB: ${error.message}`;
```

---

### DON'T ❌

#### 1. **NO usar códigos personalizados**

```javascript
// ❌ Incorrecto
bitacora = AddMSG(bitacora, data, 'OK', 291, true);  // No estándar
bitacora = AddMSG(bitacora, data, 'FAIL', 999, true); // No estándar
```

#### 2. **NO usar 404 para queries sin resultados**

```javascript
// ❌ Incorrecto
if (promociones.length === 0) {
  bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
}

// ✅ Correcto
if (promociones.length === 0) {
  bitacora = AddMSG(bitacora, data, 'OK', 200, true);
}
```

#### 3. **NO usar 200 para creación**

```javascript
// ❌ Incorrecto
const inserted = await Model.insertMany(data);
bitacora = AddMSG(bitacora, data, 'OK', 200, true);

// ✅ Correcto
bitacora = AddMSG(bitacora, data, 'OK', 201, true);
```

#### 4. **NO omitir messageUSR en errores**

```javascript
// ❌ Incorrecto
data.messageDEV = 'Error técnico';
bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);

// ✅ Correcto
data.messageUSR = 'Error al procesar solicitud';
data.messageDEV = 'Error técnico detallado';
bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
```

---

## 📊 Tabla de Referencia Rápida

| Operación | Éxito | Sin Resultados | No Existe | Error Validación | Error BD |
|-----------|-------|----------------|-----------|------------------|----------|
| **GetFilters** | 200 | 200 | - | 400 | 500 |
| **AddMany** | 201 | - | - | 400 | 500 |
| **UpdateMany** | 200 | - | 404 | 400/422 | 500 |
| **DeleteMany** | 200 | - | 404 | 400 | 500 |

---

## 🎯 Resumen

### Códigos Principales

- **200**: Operación exitosa (GET, UPDATE, DELETE)
- **201**: Creación exitosa (POST, AddMany)
- **400**: Error de validación
- **404**: Recurso no encontrado
- **422**: Error de regla de negocio
- **500**: Error interno del servidor

### Reglas Clave

1. ✅ Usar solo códigos HTTP estándar
2. ✅ 200 para queries sin resultados (no 404)
3. ✅ 201 para creación exitosa
4. ✅ 404 solo cuando recurso específico no existe
5. ✅ 422 para errores de reglas de negocio
6. ✅ Incluir `messageUSR` y `messageDEV`

---

## 📚 Referencias

- **RFC 7231**: HTTP/1.1 Semantics and Content
- **Handler**: `src/middlewares/respPWA.handler.js`
- **Servicio**: `src/api/services/ztpromociones-service.js`

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0  
**Autor**: Equipo Back-CDS
