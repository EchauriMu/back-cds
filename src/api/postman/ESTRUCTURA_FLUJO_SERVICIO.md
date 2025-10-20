# 🔄 Estructura del Flujo Principal del Servicio

## 📋 Tabla de Contenidos

1. [Responsabilidades del Servicio Principal](#responsabilidades)
2. [Estructura General](#estructura-general)
3. [Patrón de Evaluación de Promesas](#patron-promesas)
4. [Manejo de Errores Capturados](#manejo-errores)
5. [Cierre de Conexión en Finally](#cierre-conexion)
6. [Ejemplos Completos](#ejemplos)

---

## <a name="responsabilidades"></a>📊 1. Responsabilidades del Servicio Principal

El servicio principal (ejemplo: `crudZTPromociones`, `GetProductsAllFilters`, `crudPricesHistory`) tiene las siguientes responsabilidades:

### ✅ 1. Inicializar la bitácora y los datos

```javascript
let bitacora = BITACORA();
let data = DATA();
```

### ✅ 2. Definir y validar parámetros

```javascript
const params = req.req?.query || {};
const { ProcessType, LoggedUser, DBServer } = params;

// Validaciones
if (!ProcessType) {
  data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
  bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
  bitacora.finalRes = true;
  return FAIL(bitacora);
}
```

### ✅ 3. Configurar el contexto

```javascript
bitacora.processType = ProcessType;
bitacora.dbServer = DBServer || 'MongoDB';
bitacora.loggedUser = LoggedUser;
bitacora.method = req.req?.method || 'POST';
bitacora.api = '/api/ztpromociones/crudPromociones';
```

### ✅ 4. Llamar al método local (query real)

```javascript
bitacora = await GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer);
```

### ✅ 5. Evaluar la promesa retornada

```javascript
.then((bitacora) => {
  if (!bitacora.success) {
    bitacora.finalRes = true;
    throw bitacora;
  }
  return bitacora;
});
```

### ✅ 6. Manejar errores capturados en catch

```javascript
catch (error) {
  if (error.finalRes || bitacora.finalRes) {
    return FAIL(error || bitacora);
  }
  // Error inesperado...
}
```

### ✅ 7. Cerrar la conexión en finally

```javascript
finally {
  // Cerrar conexión a base de datos si existe
  if (connection) {
    await connection.close();
  }
}
```

---

## <a name="estructura-general"></a>🏗️ 2. Estructura General

### Esquema Completo

```javascript
async function crudZTPromociones(req) {
  // ============================================
  // 1. INICIALIZAR ESTRUCTURAS BASE
  // ============================================
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // ============================================
    // 2. DEFINIR Y VALIDAR PARÁMETROS
    // ============================================
    const params = req.req?.query || {};
    const { ProcessType, LoggedUser, DBServer } = params;
    
    if (!ProcessType) { /* validación */ }
    if (!LoggedUser) { /* validación */ }
    
    // ============================================
    // 3. CONFIGURAR CONTEXTO
    // ============================================
    bitacora.processType = ProcessType;
    bitacora.dbServer = DBServer || 'MongoDB';
    bitacora.loggedUser = LoggedUser;
    bitacora.method = req.req?.method || 'POST';
    bitacora.api = '/api/ztpromociones/crudPromociones';
    
    // ============================================
    // 4. LLAMAR AL MÉTODO LOCAL Y EVALUAR PROMESA
    // ============================================
    switch (ProcessType) {
      case 'GetFilters':
        bitacora = await GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer)
          .then((bitacora) => {
            if (!bitacora.success) {
              bitacora.finalRes = true;
              throw bitacora;
            }
            return bitacora;
          });
        break;
      
      case 'AddMany':
        bitacora = await AddManyPromocionesMethod(bitacora, params, body, req, dbServer)
          .then((bitacora) => {
            if (!bitacora.success) {
              bitacora.finalRes = true;
              throw bitacora;
            }
            return bitacora;
          });
        break;
      
      // ... otros casos
    }
    
    // ============================================
    // 5. RETORNAR ÉXITO
    // ============================================
    return OK(bitacora);
    
  } catch (error) {
    // ============================================
    // 6. MANEJAR ERRORES CAPTURADOS
    // ============================================
    
    // Caso 1: Error ya manejado por métodos locales
    if (error.finalRes === true || bitacora.finalRes === true) {
      return FAIL(error.data ? error : bitacora);
    }
    
    // Caso 2: Error inesperado
    let errorData = DATA();
    errorData.messageUSR = 'Error crítico al procesar solicitud';
    errorData.messageDEV = error.message;
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    // TODO: Registrar en tabla de errores
    // TODO: Notificar al usuario/desarrollador
    
    return FAIL(bitacora);
  }
}
```

---

## <a name="patron-promesas"></a>🎯 3. Patrón de Evaluación de Promesas

### Ejemplo General

```javascript
bitacora = await GetProductsMethod(bitacora, params)
  .then((bitacora) => {
    if (!bitacora.success) {
      bitacora.finalRes = true;
      throw bitacora;
    }
    return bitacora;
  });

return OK(bitacora);
```

### Desglose del Patrón

#### 1️⃣ Llamar al método local (query real)

```javascript
await GetProductsMethod(bitacora, params)
```

- Pasa la bitácora por referencia
- Pasa los parámetros necesarios
- El método retorna una promesa

#### 2️⃣ Evaluar la promesa con `.then()`

```javascript
.then((bitacora) => {
  // La promesa se resolvió exitosamente
  // Evaluar el resultado
})
```

#### 3️⃣ Verificar éxito/fracaso

```javascript
if (!bitacora.success) {
  // Falló la operación
  bitacora.finalRes = true;  // Marcar como respuesta final
  throw bitacora;             // Lanzar error para capturar en catch
}
```

#### 4️⃣ Retornar bitácora si fue exitoso

```javascript
return bitacora;  // Continuar con flujo exitoso
```

---

## <a name="manejo-errores"></a>⚠️ 4. Manejo de Errores Capturados en Catch

### Dos Tipos de Errores

#### 🔴 Tipo 1: Error ya manejado por método local

**Características:**
- `error.finalRes === true` o `bitacora.finalRes === true`
- Ya fue registrado en `bitacora.data[]`
- Contiene `messageUSR` y `messageDEV`
- Viene como último registro en la bitácora

**Acción:**
```javascript
if (error.finalRes === true || bitacora.finalRes === true) {
  // Ya se registró en bitácora, solo retornar
  console.error('[SERVICE] ⚠️  Error manejado por método local');
  
  // Si el error es un objeto bitácora (lanzado desde .then()), usarlo
  if (error.data && Array.isArray(error.data)) {
    return FAIL(error);
  }
  
  return FAIL(bitacora);
}
```

#### 🔴 Tipo 2: Error inesperado no manejado

**Características:**
- No tiene `finalRes = true`
- No fue capturado por método local
- Error del sistema (DB, red, sintaxis, etc.)

**Acción:**
```javascript
// Crear nuevo data para el error
let errorData = DATA();
errorData.process = 'Error inesperado en servicio principal';
errorData.processType = 'UnhandledError';
errorData.messageUSR = 'Error crítico. Contacte al administrador.';
errorData.messageDEV = `Error no capturado: ${error.message}`;

// Incluir stack trace en desarrollo
if (process.env.NODE_ENV === 'development') {
  errorData.stack = error.stack;
}

// Registrar como último en bitácora
bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
bitacora.finalRes = true;
bitacora.success = false;

// TODO: Inyectar en tabla de errores
// await logErrorToDatabase({ error, bitacora, ... });

// TODO: Notificar al usuario/desarrollador
// await notifyError({ user, developer, error, ... });

console.error('[SERVICE] ❌ ERROR CRÍTICO:', error.message);

return FAIL(bitacora);
```

---

## <a name="cierre-conexion"></a>🔌 5. Cierre de Conexión en Finally

### ⚠️ Importante

Si tu servicio abre conexiones a bases de datos u otros recursos, **siempre ciérralos en el bloque `finally`**.

### Ejemplo con MongoDB

```javascript
async function crudZTPromociones(req) {
  let bitacora = BITACORA();
  let data = DATA();
  let connection = null;  // Variable para la conexión
  
  try {
    // ... validaciones ...
    
    // Obtener conexión
    connection = await mongoose.createConnection(MONGO_URI);
    
    // ... lógica del servicio ...
    
    return OK(bitacora);
    
  } catch (error) {
    // ... manejo de errores ...
    return FAIL(bitacora);
    
  } finally {
    // ============================================
    // SIEMPRE CERRAR CONEXIÓN
    // ============================================
    if (connection) {
      try {
        await connection.close();
        console.log('[SERVICE] 🔌 Conexión cerrada correctamente');
      } catch (closeError) {
        console.error('[SERVICE] ⚠️  Error al cerrar conexión:', closeError.message);
      }
    }
  }
}
```

### Ejemplo con Pool de Conexiones

```javascript
finally {
  // Liberar conexión al pool
  if (connection) {
    try {
      connection.release();
      console.log('[SERVICE] 🔌 Conexión liberada al pool');
    } catch (releaseError) {
      console.error('[SERVICE] ⚠️  Error al liberar conexión:', releaseError.message);
    }
  }
}
```

---

## <a name="ejemplos"></a>💡 6. Ejemplos Completos

### Ejemplo 1: GetFilters

```javascript
async function crudZTPromociones(req) {
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // 1. Validar parámetros
    const params = req.req?.query || {};
    const { ProcessType, LoggedUser, DBServer } = params;
    
    if (!ProcessType) {
      data.messageUSR = 'Falta ProcessType';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    // 2. Configurar contexto
    bitacora.processType = ProcessType;
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = DBServer || 'MongoDB';
    
    // 3. Llamar al método y evaluar promesa
    bitacora = await GetFiltersPromocionesMethod(bitacora, params, paramString, body, DBServer)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    
    // 4. Retornar éxito
    return OK(bitacora);
    
  } catch (error) {
    // 5. Manejar error
    if (error.finalRes) {
      return FAIL(error);
    }
    
    // Error inesperado
    let errorData = DATA();
    errorData.messageUSR = 'Error al procesar solicitud';
    errorData.messageDEV = error.message;
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    return FAIL(bitacora);
  }
}
```

### Ejemplo 2: AddMany con Conexión

```javascript
async function crudZTPromociones(req) {
  let bitacora = BITACORA();
  let data = DATA();
  let connection = null;
  
  try {
    // 1. Validaciones
    const params = req.req?.query || {};
    const { ProcessType, LoggedUser, DBServer } = params;
    
    if (!LoggedUser) {
      data.messageUSR = 'Falta LoggedUser';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    // 2. Configurar contexto
    bitacora.processType = 'AddMany';
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = DBServer || 'MongoDB';
    
    // 3. Obtener conexión
    connection = await GetConnectionByDbServer(DBServer);
    
    // 4. Llamar al método y evaluar promesa
    bitacora = await AddManyPromocionesMethod(bitacora, params, body, req, DBServer)
      .then((bitacora) => {
        if (!bitacora.success) {
          bitacora.finalRes = true;
          throw bitacora;
        }
        return bitacora;
      });
    
    // 5. Retornar éxito
    return OK(bitacora);
    
  } catch (error) {
    // 6. Manejar error
    if (error.finalRes || bitacora.finalRes) {
      return FAIL(error.data ? error : bitacora);
    }
    
    // Error inesperado
    let errorData = DATA();
    errorData.messageUSR = 'Error crítico al crear promociones';
    errorData.messageDEV = error.message;
    
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    // TODO: Log en tabla de errores
    // TODO: Notificar
    
    return FAIL(bitacora);
    
  } finally {
    // 7. Cerrar conexión
    if (connection) {
      await connection.close();
    }
  }
}
```

---

## 🎯 Resumen Visual del Flujo

```
┌─────────────────────────────────────────┐
│ 1. INICIALIZAR                          │
│    let bitacora = BITACORA()            │
│    let data = DATA()                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. VALIDAR PARÁMETROS                   │
│    - ProcessType (obligatorio)          │
│    - LoggedUser (obligatorio)           │
│    - DBServer (opcional)                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. CONFIGURAR CONTEXTO                  │
│    bitacora.processType = ...           │
│    bitacora.loggedUser = ...            │
│    bitacora.dbServer = ...              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. LLAMAR MÉTODO LOCAL                  │
│    await GetFiltersMethod(...)          │
│      .then((bitacora) => {              │
│        if (!bitacora.success) {         │
│          bitacora.finalRes = true;      │
│          throw bitacora;                │
│        }                                │
│        return bitacora;                 │
│      })                                 │
└──────────────┬──────────────────────────┘
               │
          ┌────┴────┐
          │         │
    ÉXITO │         │ ERROR
          ▼         ▼
    ┌─────────┐   ┌──────────────────┐
    │   OK    │   │ CATCH            │
    │(bitacora)│   │  - Manejado?     │
    └─────────┘   │  - Inesperado?   │
                  │  → FAIL(bitacora)│
                  └──────────────────┘
                          │
                          ▼
                  ┌──────────────────┐
                  │ FINALLY          │
                  │  - Cerrar        │
                  │    conexión      │
                  └──────────────────┘
```

---

## ✅ Checklist de Implementación

- [ ] ✅ Inicializar `BITACORA()` y `DATA()` al inicio
- [ ] ✅ Validar parámetros obligatorios
- [ ] ✅ Configurar contexto de bitácora
- [ ] ✅ Llamar al método local con await
- [ ] ✅ Usar `.then()` para evaluar promesa
- [ ] ✅ Verificar `bitacora.success`
- [ ] ✅ Establecer `finalRes = true` en errores
- [ ] ✅ Lanzar error con `throw` si falló
- [ ] ✅ Capturar errores en `catch`
- [ ] ✅ Diferenciar error manejado vs inesperado
- [ ] ✅ Registrar error en bitácora
- [ ] ✅ TODO: Log en tabla de errores
- [ ] ✅ TODO: Notificar usuario/desarrollador
- [ ] ✅ Cerrar conexión en `finally`
- [ ] ✅ Retornar `OK(bitacora)` o `FAIL(bitacora)`

---

## 📚 Referencias

- **Handler**: `src/middlewares/respPWA.handler.js`
- **Servicio**: `src/api/services/ztpromociones-service.js`
- **Configuración Bitácora**: `CONFIGURACION_BITACORA.md`
- **Estructura de Parámetros**: `ESTRUCTURA_PARAMETROS.md`

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0  
**Autor**: Equipo Back-CDS
