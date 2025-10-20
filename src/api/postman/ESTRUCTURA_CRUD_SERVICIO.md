# 🔄 Estructura Estándar CRUD en el Servicio

## 📋 Tabla de Contenidos

1. [Concepto General](#concepto)
2. [Estructura del Switch](#estructura-switch)
3. [ProcessTypes Disponibles](#processtypes)
4. [Patrón de Ejecución](#patron)
5. [Validación de ProcessType](#validacion)
6. [Ejemplos Completos](#ejemplos)
7. [Extensibilidad](#extensibilidad)
8. [Mejores Prácticas](#mejores-practicas)
9. [Verificación de Implementación](#verificacion)

---

## <a name="concepto"></a>🎯 1. Concepto General

### Principio de Diseño

El servicio **CRUD principal** utiliza un **switch sobre `ProcessType`** para:

✅ **Dirigir** la operación al método correspondiente  
✅ **Mantener** una estructura clara y escalable  
✅ **Facilitar** el mantenimiento y extensión  
✅ **Centralizar** la lógica de enrutamiento  

### Ventajas del Patrón

| Ventaja | Descripción |
|---------|-------------|
| **Claridad** | Fácil identificar qué método maneja cada operación |
| **Mantenibilidad** | Agregar nuevos ProcessTypes es simple |
| **Testabilidad** | Cada método se puede probar independientemente |
| **Escalabilidad** | Soporta múltiples operaciones sin complejidad |
| **Consistencia** | Todos los servicios siguen el mismo patrón |

---

## <a name="estructura-switch"></a>🏗️ 2. Estructura del Switch

### Patrón Básico

```javascript
switch (ProcessType) {
  case 'GetFilters':
    bitacora = await GetFiltersPromocionesMethod(...);
    break;
    
  case 'AddMany':
    bitacora = await AddManyPromocionesMethod(...);
    break;
    
  case 'UpdateMany':
    bitacora = await UpdateManyPromocionesMethod(...);
    break;
    
  case 'DeleteMany':
    bitacora = await DeleteManyPromocionesMethod(...);
    break;
    
  default:
    throw new Error("ProcessType no válido.");
}
```

### Características Clave

#### 1️⃣ **Cada método se ejecuta como promesa**

```javascript
// ✅ Correcto: await + método que retorna Promise
bitacora = await GetFiltersPromocionesMethod(bitacora, params, ...);

// ❌ Incorrecto: Sin await
bitacora = GetFiltersPromocionesMethod(bitacora, params, ...);
```

#### 2️⃣ **Retorna bitácora actualizada**

```javascript
// Método local retorna bitácora
async function GetFiltersPromocionesMethod(...) {
  // ... operaciones
  
  // Retornar bitácora actualizada
  return bitacora;
}
```

#### 3️⃣ **break después de cada case**

```javascript
case 'GetFilters':
  bitacora = await GetFiltersPromocionesMethod(...);
  break; // ← IMPORTANTE: evitar fall-through
```

#### 4️⃣ **default para casos no válidos**

```javascript
default:
  throw new Error("ProcessType no válido.");
  // O mejor: registrar en bitácora
```

---

## <a name="processtypes"></a>📊 3. ProcessTypes Disponibles

### ProcessTypes Estándar

| ProcessType | Operación | Método | HTTP Status |
|-------------|-----------|--------|-------------|
| **GetFilters** | Consultar con filtros | `GetFilters[Entity]Method` | 200 |
| **AddMany** | Crear múltiples | `AddMany[Entity]Method` | 201 |
| **UpdateMany** | Actualizar múltiples | `UpdateMany[Entity]Method` | 200 |
| **DeleteMany** | Eliminar múltiples | `DeleteMany[Entity]Method` | 200 |

### Nomenclatura de Métodos

```javascript
// Patrón: [Action][Entity]Method
GetFiltersPromocionesMethod    // Promociones
GetFiltersPricesHistoryMethod  // PricesHistory
GetFiltersProductsMethod       // Products

AddManyPromocionesMethod
UpdateManyPromocionesMethod
DeleteManyPromocionesMethod
```

---

## <a name="patron"></a>🔄 4. Patrón de Ejecución

### Flujo Completo del Switch

```javascript
async function crudZTPromociones(req) {
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // ============================================
    // 1. VALIDACIONES PREVIAS
    // ============================================
    const params = req.req?.query || {};
    const { ProcessType, LoggedUser, DBServer } = params;
    
    if (!ProcessType) {
      // Error de validación
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    // ============================================
    // 2. CONFIGURACIÓN DE BITÁCORA
    // ============================================
    bitacora.processType = ProcessType;
    bitacora.dbServer = DBServer || 'MongoDB';
    bitacora.loggedUser = LoggedUser;
    bitacora.method = req.req?.method || 'POST';
    bitacora.api = '/api/ztpromociones/crudPromociones';
    
    // ============================================
    // 3. SWITCH: ENRUTAR A MÉTODO CORRESPONDIENTE
    // ============================================
    switch (ProcessType) {
      case 'GetFilters':
        bitacora = await GetFiltersPromocionesMethod(
          bitacora,
          params,
          req
        ).then((bitacora) => {
          // Evaluar éxito
          if (!bitacora.success) {
            bitacora.finalRes = true;
            throw bitacora;
          }
          return bitacora;
        });
        break;
        
      case 'AddMany':
        bitacora = await AddManyPromocionesMethod(
          bitacora,
          params,
          req
        ).then((bitacora) => {
          if (!bitacora.success) {
            bitacora.finalRes = true;
            throw bitacora;
          }
          return bitacora;
        });
        break;
        
      case 'UpdateMany':
        bitacora = await UpdateManyPromocionesMethod(
          bitacora,
          params,
          req
        ).then((bitacora) => {
          if (!bitacora.success) {
            bitacora.finalRes = true;
            throw bitacora;
          }
          return bitacora;
        });
        break;
        
      case 'DeleteMany':
        bitacora = await DeleteManyPromocionesMethod(
          bitacora,
          params,
          req
        ).then((bitacora) => {
          if (!bitacora.success) {
            bitacora.finalRes = true;
            throw bitacora;
          }
          return bitacora;
        });
        break;
        
      default:
        // ProcessType no válido
        let errorData = DATA();
        errorData.process = 'Validación de ProcessType';
        errorData.processType = 'ValidationError';
        errorData.messageUSR = `ProcessType "${ProcessType}" no es válido`;
        errorData.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
        
        bitacora = AddMSG(bitacora, errorData, 'FAIL', 400, true);
        bitacora.finalRes = true;
        
        return FAIL(bitacora);
    }
    
    // ============================================
    // 4. RETORNO EXITOSO
    // ============================================
    return OK(bitacora);
    
  } catch (error) {
    // ============================================
    // 5. MANEJO DE ERRORES
    // ============================================
    if (error.finalRes === true || bitacora.finalRes === true) {
      // Error ya manejado
      if (error.data && Array.isArray(error.data)) {
        return FAIL(error);
      }
      return FAIL(bitacora);
    }
    
    // Error inesperado
    let errorData = DATA();
    errorData.messageUSR = 'Error crítico al procesar solicitud';
    errorData.messageDEV = `Error no capturado: ${error.message}`;
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    return FAIL(bitacora);
  }
}
```

---

## <a name="validacion"></a>✅ 5. Validación de ProcessType

### Estrategia 1: Validación Previa (Recomendado)

```javascript
// ANTES del switch
const VALID_PROCESS_TYPES = ['GetFilters', 'AddMany', 'UpdateMany', 'DeleteMany'];

if (!VALID_PROCESS_TYPES.includes(ProcessType)) {
  data.process = 'Validación de ProcessType';
  data.messageUSR = `ProcessType "${ProcessType}" no es válido`;
  data.messageDEV = `Valores válidos: ${VALID_PROCESS_TYPES.join(', ')}`;
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.finalRes = true;
  
  return FAIL(bitacora);
}

// Ahora el switch solo contiene casos válidos
switch (ProcessType) {
  case 'GetFilters':
    // ...
    break;
  // ... otros casos
}
```

### Estrategia 2: Default en Switch

```javascript
switch (ProcessType) {
  case 'GetFilters':
    bitacora = await GetFiltersPromocionesMethod(...);
    break;
    
  case 'AddMany':
    bitacora = await AddManyPromocionesMethod(...);
    break;
    
  case 'UpdateMany':
    bitacora = await UpdateManyPromocionesMethod(...);
    break;
    
  case 'DeleteMany':
    bitacora = await DeleteManyPromocionesMethod(...);
    break;
    
  default:
    // ProcessType inválido
    let errorData = DATA();
    errorData.process = 'Validación de ProcessType';
    errorData.processType = 'ValidationError';
    errorData.messageUSR = `ProcessType "${ProcessType}" no es válido`;
    errorData.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 400, true);
    bitacora.finalRes = true;
    
    return FAIL(bitacora);
}
```

---

## <a name="ejemplos"></a>💡 6. Ejemplos Completos

### Ejemplo 1: Switch Básico (Sin .then())

```javascript
// Versión simple (sin evaluación de promesas)
switch (ProcessType) {
  case 'GetFilters':
    bitacora = await GetFiltersPromocionesMethod(bitacora, params, req);
    break;
    
  case 'AddMany':
    bitacora = await AddManyPromocionesMethod(bitacora, params, req);
    break;
    
  case 'UpdateMany':
    bitacora = await UpdateManyPromocionesMethod(bitacora, params, req);
    break;
    
  case 'DeleteMany':
    bitacora = await DeleteManyPromocionesMethod(bitacora, params, req);
    break;
    
  default:
    throw new Error(`ProcessType "${ProcessType}" no válido`);
}
```

**⚠️ Problema**: No evalúa si el método falló.

---

### Ejemplo 2: Switch con .then() (Recomendado)

```javascript
// Versión con evaluación de promesas
switch (ProcessType) {
  case 'GetFilters':
    bitacora = await GetFiltersPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora; // ← Propagar error al catch
        }
        return bitacora;
      });
    break;
    
  case 'AddMany':
    bitacora = await AddManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'UpdateMany':
    bitacora = await UpdateManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'DeleteMany':
    bitacora = await DeleteManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  default:
    let errorData = DATA();
    errorData.messageUSR = `ProcessType "${ProcessType}" no válido`;
    errorData.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 400, true);
    bitacora.finalRes = true;
    
    return FAIL(bitacora);
}
```

**✅ Ventaja**: Evalúa el resultado y propaga errores correctamente.

---

### Ejemplo 3: Switch con Validación Previa

```javascript
// Validación previa
const VALID_PROCESS_TYPES = ['GetFilters', 'AddMany', 'UpdateMany', 'DeleteMany'];

if (!VALID_PROCESS_TYPES.includes(ProcessType)) {
  data.process = 'Validación de ProcessType';
  data.messageUSR = `ProcessType "${ProcessType}" no es válido`;
  data.messageDEV = `Valores válidos: ${VALID_PROCESS_TYPES.join(', ')}`;
  data.receivedValue = ProcessType;
  
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.finalRes = true;
  
  return FAIL(bitacora);
}

// Switch simplificado (sin default)
switch (ProcessType) {
  case 'GetFilters':
    bitacora = await GetFiltersPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'AddMany':
    bitacora = await AddManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'UpdateMany':
    bitacora = await UpdateManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'DeleteMany':
    bitacora = await DeleteManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
}
```

**✅ Ventaja**: Separación de concerns (validación vs enrutamiento).

---

## <a name="extensibilidad"></a>🔧 7. Extensibilidad

### Agregar Nuevo ProcessType

#### Paso 1: Validar ProcessType

```javascript
// Agregar a la lista de válidos
const VALID_PROCESS_TYPES = [
  'GetFilters',
  'AddMany',
  'UpdateMany',
  'DeleteMany',
  'GetOne' // ← NUEVO
];
```

#### Paso 2: Agregar Case en Switch

```javascript
switch (ProcessType) {
  // ... casos existentes
  
  case 'GetOne':
    bitacora = await GetOnePromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
}
```

#### Paso 3: Implementar Método Local

```javascript
async function GetOnePromocionesMethod(bitacora, params, req) {
  let data = DATA();
  
  data.process = 'Obtener una promoción (GetOne)';
  data.processType = bitacora.processType;
  data.loggedUser = bitacora.loggedUser;
  data.principal = true;
  
  try {
    const { IdPromoOK } = params;
    
    if (!IdPromoOK) {
      data.messageUSR = 'Falta parámetro obligatorio: IdPromoOK';
      data.messageDEV = 'IdPromoOK es requerido para GetOne';
      
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.success = false;
      bitacora.finalRes = true;
      
      return bitacora;
    }
    
    // Buscar promoción
    const promocion = await ZTPromociones.findOne({ IdPromoOK }).lean();
    
    if (!promocion) {
      data.messageUSR = `Promoción con ID "${IdPromoOK}" no encontrada`;
      data.messageDEV = 'No existe registro con el ID proporcionado';
      
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
      bitacora.success = false;
      bitacora.finalRes = true;
      
      return bitacora;
    }
    
    // Éxito
    data.dataRes = [promocion];
    data.countDataRes = 1;
    data.messageUSR = 'Promoción obtenida exitosamente';
    data.messageDEV = 'Query ejecutado correctamente';
    
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al obtener la promoción';
    data.messageDEV = `Error en query: ${error.message}`;
    
    if (process.env.NODE_ENV === 'development') {
      data.stack = error.stack;
    }
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true;
    
    console.error('[GetOne] ❌ Error:', error.message);
    
    return bitacora;
  }
}
```

---

## <a name="mejores-practicas"></a>✅ 8. Mejores Prácticas

### DO ✅

#### 1. **Usar await en todos los cases**

```javascript
case 'GetFilters':
  bitacora = await GetFiltersPromocionesMethod(...);
  break;
```

#### 2. **Incluir break después de cada case**

```javascript
case 'GetFilters':
  bitacora = await GetFiltersPromocionesMethod(...);
  break; // ← IMPORTANTE
```

#### 3. **Evaluar resultado con .then()**

```javascript
bitacora = await GetFiltersPromocionesMethod(...)
  .then((bitacora) => {
    if (!bitacora.success) {
      bitacora.finalRes = true;
      throw bitacora;
    }
    return bitacora;
  });
```

#### 4. **Manejar default explícitamente**

```javascript
default:
  let errorData = DATA();
  errorData.messageUSR = `ProcessType "${ProcessType}" no válido`;
  errorData.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
  
  bitacora = AddMSG(bitacora, errorData, 'FAIL', 400, true);
  bitacora.finalRes = true;
  
  return FAIL(bitacora);
```

#### 5. **Validar ProcessType antes del switch**

```javascript
const VALID_PROCESS_TYPES = ['GetFilters', 'AddMany', 'UpdateMany', 'DeleteMany'];

if (!VALID_PROCESS_TYPES.includes(ProcessType)) {
  // Error
  return FAIL(bitacora);
}
```

#### 6. **Nombrar métodos consistentemente**

```javascript
// Patrón: [Action][Entity]Method
GetFiltersPromocionesMethod
AddManyPromocionesMethod
UpdateManyPromocionesMethod
DeleteManyPromocionesMethod
```

---

### DON'T ❌

#### 1. **NO omitir break**

```javascript
// ❌ NO
case 'GetFilters':
  bitacora = await GetFiltersPromocionesMethod(...);
  // Sin break → fall-through

case 'AddMany':
  bitacora = await AddManyPromocionesMethod(...);
  break;
```

#### 2. **NO usar switch sin await**

```javascript
// ❌ NO
switch (ProcessType) {
  case 'GetFilters':
    bitacora = GetFiltersPromocionesMethod(...); // Sin await
    break;
}
```

#### 3. **NO ignorar errores de métodos**

```javascript
// ❌ NO
case 'GetFilters':
  bitacora = await GetFiltersPromocionesMethod(...);
  // Sin evaluar bitacora.success
  break;
```

#### 4. **NO usar default vacío**

```javascript
// ❌ NO
default:
  // Sin manejo
  break;
```

#### 5. **NO mezclar nomenclaturas**

```javascript
// ❌ NO
GetFiltersPromocionesMethod    // ✓
getFiltersPrices               // ✗
AddManyPromos                  // ✗
Update_Many_Products           // ✗
```

---

## <a name="verificacion"></a>🔍 9. Verificación de Implementación

### Checklist de Verificación

| Aspecto | Verificación | Estado |
|---------|--------------|--------|
| **Switch sobre ProcessType** | ¿Existe switch(ProcessType)? | ✅ |
| **4 ProcessTypes** | GetFilters, AddMany, UpdateMany, DeleteMany | ✅ |
| **await en todos los cases** | Todos los métodos usan await | ✅ |
| **break después de case** | Todos los cases tienen break | ✅ |
| **default manejado** | Existe default con error | ✅ |
| **.then() evaluation** | Evalúa success y lanza error | ✅ |
| **Nomenclatura consistente** | [Action][Entity]Method | ✅ |
| **Retornan bitácora** | Todos los métodos retornan bitácora | ✅ |

---

### Código Verificado

```javascript
// Archivo: src/api/services/ztpromociones-service.js
// Líneas: 135-190

switch (ProcessType) {
  case 'GetFilters':
    bitacora = await GetFiltersPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'AddMany':
    bitacora = await AddManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'UpdateMany':
    bitacora = await UpdateManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  case 'DeleteMany':
    bitacora = await DeleteManyPromocionesMethod(bitacora, params, req)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    break;
    
  default:
    let errorData = DATA();
    errorData.process = 'Validación de ProcessType en switch';
    errorData.processType = 'ValidationError';
    errorData.messageUSR = `ProcessType "${ProcessType}" no es válido`;
    errorData.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
    errorData.receivedValue = ProcessType;
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 400, true);
    bitacora.finalRes = true;
    
    return FAIL(bitacora);
}
```

**✅ VERIFICADO**: La implementación cumple con TODOS los requisitos.

---

## 📊 Diagrama de Flujo del Switch

```
                    ┌──────────────────┐
                    │  switch          │
                    │  (ProcessType)   │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ GetFilters? │   │  AddMany?   │   │UpdateMany?  │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │ SÍ              │ SÍ              │ SÍ
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ await Get   │   │ await Add   │   │ await Update│
    │ Filters     │   │ Many        │   │ Many        │
    │ Method()    │   │ Method()    │   │ Method()    │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ .then()     │   │ .then()     │   │ .then()     │
    │ ¿success?   │   │ ¿success?   │   │ ¿success?   │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
      ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
      │         │       │         │       │         │
     SÍ         NO     SÍ         NO     SÍ         NO
      │         │       │         │       │         │
      ▼         ▼       ▼         ▼       ▼         ▼
   return   throw    return   throw    return   throw
   bitacora bitacora bitacora bitacora bitacora bitacora
      │         │       │         │       │         │
      ▼         │       ▼         │       ▼         │
   break        │    break        │    break        │
                │                 │                 │
                └─────────────────┼─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ catch del       │
                         │ servicio        │
                         │ principal       │
                         └─────────────────┘
                                  │
                         ┌────────┴────────┐
                         │                 │
                  finalRes=true      finalRes=false
                         │                 │
                         ▼                 ▼
                   Error manejado    Error inesperado
                         │                 │
                         ▼                 ▼
                    FAIL(bitacora)   AddMSG + FAIL
```

---

## 🎯 Resumen

### Estructura del Switch

| Componente | Descripción | Obligatorio |
|------------|-------------|-------------|
| **switch (ProcessType)** | Enrutar operación | ✅ |
| **case 'GetFilters'** | Consultar con filtros | ✅ |
| **case 'AddMany'** | Crear múltiples | ✅ |
| **case 'UpdateMany'** | Actualizar múltiples | ✅ |
| **case 'DeleteMany'** | Eliminar múltiples | ✅ |
| **default** | Manejar ProcessType inválido | ✅ |
| **await** | Esperar promesa | ✅ |
| **break** | Evitar fall-through | ✅ |
| **.then()** | Evaluar resultado | ✅ |

### Ventajas del Patrón

✅ **Claridad**: Código fácil de leer y mantener  
✅ **Escalabilidad**: Agregar ProcessTypes es simple  
✅ **Testabilidad**: Métodos independientes  
✅ **Consistencia**: Mismo patrón en todos los servicios  
✅ **Manejo de errores**: Centralizado y robusto  

---

## 📚 Referencias

- **Servicio**: `src/api/services/ztpromociones-service.js` (líneas 135-190)
- **Métodos Locales**: `METODOS_LOCALES.md`
- **Flujo Principal**: `ESTRUCTURA_FLUJO_SERVICIO.md`
- **Manejo Errores**: `MANEJO_ERRORES_BITACORA.md`

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0  
**Autor**: Equipo Back-CDS
