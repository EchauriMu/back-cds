# 🔧 Métodos Locales (Local Methods)

## 📋 Tabla de Contenidos

1. [¿Qué son los Métodos Locales?](#que-son)
2. [Características Clave](#caracteristicas)
3. [Responsabilidades](#responsabilidades)
4. [Estructura Estándar](#estructura)
5. [Manejo de Errores](#manejo-errores)
6. [Manejo de Conexiones](#manejo-conexiones)
7. [Ejemplos Completos](#ejemplos)
8. [Mejores Prácticas](#mejores-practicas)

---

## <a name="que-son"></a>🎯 1. ¿Qué son los Métodos Locales?

Los **métodos locales** son funciones que **realmente ejecutan operaciones sobre la base de datos**:

- 📊 **Extracción** (SELECT, find, findOne)
- ➕ **Inserción** (INSERT, insertOne, insertMany)
- ✏️ **Actualización** (UPDATE, updateOne, updateMany)
- ❌ **Eliminación** (DELETE, deleteOne, deleteMany)

### Diferencia con Servicio Principal

| Servicio Principal | Métodos Locales |
|-------------------|-----------------|
| Valida parámetros | Ejecuta queries |
| Configura bitácora | Maneja conexión |
| Orquesta flujo | Maneja errores propios |
| Llama métodos locales | Retorna promesas |
| Maneja respuesta HTTP | Actualiza bitácora |

---

## <a name="caracteristicas"></a>✅ 2. Características Clave

### 🔴 Obligatorias

1. **Deben manejar sus propios errores mediante `try/catch`**
   ```javascript
   async function GetProductsMethod(bitacora, options) {
     try {
       // ... lógica
     } catch (error) {
       // Manejo interno del error
     }
   }
   ```

2. **Siempre devuelven una promesa (implícita con `async`)**
   ```javascript
   async function GetProductsMethod() {
     return bitacora; // Promise<bitacora>
   }
   ```

3. **Deben usar la bitácora y el objeto data local**
   ```javascript
   let data = DATA(); // Instanciar data local
   data.process = 'Obtener productos';
   bitacora = AddMSG(bitacora, data, 'OK', 200, true);
   ```

4. **Si la conexión no está activa, establecerla y cerrarla en `finally`**
   ```javascript
   let connection = null;
   try {
     connection = await connectToHanaClient(dbServer);
     // ... operaciones
   } finally {
     if (connection) await connection.disconnect();
   }
   ```

---

## <a name="responsabilidades"></a>📊 3. Responsabilidades

### ✅ SÍ deben hacer:

- ✅ Establecer conexión a BD (si no está activa)
- ✅ Ejecutar query/operación real
- ✅ Manejar errores internos con try/catch
- ✅ Crear objeto `data = DATA()` local
- ✅ Configurar `data.process`, `data.messageUSR`, `data.messageDEV`
- ✅ Agregar resultado a `data.dataRes`
- ✅ Usar `AddMSG()` para actualizar bitácora
- ✅ Establecer `bitacora.finalRes = true` en errores
- ✅ Cerrar conexión en `finally`
- ✅ Retornar `bitacora` (éxito o error)

### ❌ NO deben hacer:

- ❌ Manejar respuesta HTTP (`res.error`, `res.status`)
- ❌ Validar parámetros obligatorios del servicio principal
- ❌ Configurar campos de bitácora del servicio principal
- ❌ Lanzar errores sin capturar (excepto validaciones)
- ❌ Retornar `OK()` o `FAIL()` directamente (solo bitacora)

---

## <a name="estructura"></a>🏗️ 4. Estructura Estándar

### Template Básico

```javascript
/**
 * Nombre del método local
 * Descripción de lo que hace
 * 
 * @param {Object} bitacora - Bitácora pasada por referencia
 * @param {Object} params - Parámetros del query
 * @param {String} dbServer - Motor de BD
 * @returns {Promise<Object>} bitacora actualizada
 */
async function GetProductsMethod(bitacora, params, dbServer) {
  // ============================================
  // 1. INICIALIZACIÓN DE DATA LOCAL
  // ============================================
  let data = DATA();
  
  // Configurar contexto del data
  data.process = 'Obtener productos';
  data.processType = bitacora.processType;
  data.loggedUser = bitacora.loggedUser;
  data.dbServer = bitacora.dbServer;
  data.principal = true;
  
  // Variables de conexión
  let connection = null;
  
  try {
    // ============================================
    // 2. ESTABLECER CONEXIÓN
    // ============================================
    connection = await connectToDatabase(dbServer);
    
    // ============================================
    // 3. CONSTRUIR Y EJECUTAR QUERY
    // ============================================
    const filter = { ACTIVED: true, DELETED: false };
    
    const result = await new Promise((resolve, reject) => {
      // Operación de BD aquí
      Model.find(filter)
        .exec()
        .then(rows => resolve(rows))
        .catch(err => reject(err));
    });
    
    // ============================================
    // 4. REGISTRAR ÉXITO EN BITÁCORA
    // ============================================
    data.dataRes = result;
    data.countDataRes = result.length;
    data.messageUSR = `Productos obtenidos exitosamente: ${result.length}`;
    data.messageDEV = `Query ejecutado correctamente`;
    
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // ============================================
    // 5. REGISTRAR ERROR EN BITÁCORA
    // ============================================
    data.messageUSR = 'Error al obtener productos';
    data.messageDEV = `Error en query: ${error.message}`;
    
    if (process.env.NODE_ENV === 'development') {
      data.stack = error.stack;
    }
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true; // Detener ejecución
    
    console.error('[GetProducts] ❌ Error:', error.message);
    
    return bitacora;
    
  } finally {
    // ============================================
    // 6. CERRAR CONEXIÓN
    // ============================================
    if (connection) {
      try {
        await connection.disconnect();
        console.log('[GetProducts] 🔌 Conexión cerrada');
      } catch (closeError) {
        console.error('[GetProducts] ⚠️  Error al cerrar:', closeError.message);
      }
    }
  }
}
```

---

## <a name="manejo-errores"></a>⚠️ 5. Manejo de Errores

### Reglas de Manejo de Errores

#### 1️⃣ **Capturar todos los errores con try/catch**

```javascript
try {
  // Operación de BD
  const result = await Model.find(filter);
} catch (error) {
  // Manejar error internamente
  data.messageUSR = 'Error al consultar';
  data.messageDEV = error.message;
  bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
  bitacora.finalRes = true;
  return bitacora;
}
```

#### 2️⃣ **Establecer `finalRes = true` en errores**

```javascript
catch (error) {
  // ...
  bitacora.finalRes = true; // ← CRÍTICO: detener ejecución
  return bitacora;
}
```

#### 3️⃣ **NO usar `res.error()` en métodos locales**

```javascript
// ❌ INCORRECTO
catch (error) {
  res.error(500, error.message); // NO hacer esto
}

// ✅ CORRECTO
catch (error) {
  data.messageDEV = error.message;
  bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
  bitacora.finalRes = true;
  return bitacora;
}
```

#### 4️⃣ **El servicio principal capturará el error**

```javascript
// Servicio Principal
bitacora = await GetProductsMethod(bitacora, params, dbServer)
  .then((bitacora) => {
    if (!bitacora.success) {
      bitacora.finalRes = true;
      throw bitacora; // ← Lanzar para catch del servicio principal
    }
    return bitacora;
  });
```

---

## <a name="manejo-conexiones"></a>🔌 6. Manejo de Conexiones

### Escenarios de Conexión

#### Escenario 1: Mongoose (conexión global activa)

```javascript
async function GetProductsMethod(bitacora, params) {
  let data = DATA();
  
  try {
    // Mongoose usa conexión global, no necesita establecer/cerrar
    const result = await Model.find(filter).lean();
    
    data.dataRes = result;
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    
    return bitacora;
    
  } catch (error) {
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    return bitacora;
  }
  // No requiere finally para cerrar conexión
}
```

#### Escenario 2: HANA (conexión por request)

```javascript
async function GetProductsMethod(bitacora, params, dbServer) {
  let data = DATA();
  let connection = null;
  
  try {
    // Establecer conexión
    connection = await connectToHanaClient(dbServer);
    
    // Ejecutar query
    const sql = `SELECT * FROM PRODUCTS WHERE ACTIVED = 1`;
    
    const result = await new Promise((resolve, reject) => {
      connection.exec(sql, [], (error, rows) => {
        if (error) reject(error);
        else resolve(rows);
      });
    });
    
    data.dataRes = result;
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    
    return bitacora;
    
  } catch (error) {
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    return bitacora;
    
  } finally {
    // Cerrar conexión
    if (connection) {
      try {
        await connection.disconnect();
      } catch (closeError) {
        console.error('[GetProducts] Error al cerrar:', closeError.message);
      }
    }
  }
}
```

#### Escenario 3: Pool de Conexiones

```javascript
async function GetProductsMethod(bitacora, params) {
  let data = DATA();
  let connection = null;
  
  try {
    // Obtener conexión del pool
    connection = await pool.getConnection();
    
    // Ejecutar query
    const [rows] = await connection.execute('SELECT * FROM products');
    
    data.dataRes = rows;
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    
    return bitacora;
    
  } catch (error) {
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    return bitacora;
    
  } finally {
    // Liberar conexión al pool
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('[GetProducts] Error al liberar:', releaseError.message);
      }
    }
  }
}
```

---

## <a name="ejemplos"></a>💡 7. Ejemplos Completos

### Ejemplo 1: GetFilters (MongoDB)

```javascript
async function GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer) {
  let data = DATA();
  
  data.process = 'Obtener promociones (GetFilters)';
  data.processType = bitacora.processType;
  data.loggedUser = bitacora.loggedUser;
  data.dbServer = bitacora.dbServer;
  data.principal = true;
  
  try {
    // Construir filtro
    const filter = { ACTIVED: true, DELETED: false };
    
    if (params.IdPromoOK) filter.IdPromoOK = params.IdPromoOK;
    if (params.SKUID) filter.SKUID = params.SKUID;
    
    // Ejecutar query con Mongoose (conexión global)
    const promociones = await ZTPromociones.find(filter)
      .limit(parseInt(params.limit || 100))
      .skip(parseInt(params.offset || 0))
      .lean()
      .exec();
    
    // Registrar éxito
    data.dataRes = promociones;
    data.countDataRes = promociones.length;
    data.messageUSR = `Promociones obtenidas: ${promociones.length}`;
    data.messageDEV = `Filtros aplicados: ${JSON.stringify(filter)}`;
    
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // Registrar error
    data.messageUSR = 'Error al obtener promociones';
    data.messageDEV = `Error en query: ${error.message}`;
    
    if (process.env.NODE_ENV === 'development') {
      data.stack = error.stack;
    }
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true;
    
    console.error('[GetFilters] ❌ Error:', error.message);
    
    return bitacora;
  }
  // No requiere finally (Mongoose usa conexión global)
}
```

### Ejemplo 2: AddMany (MongoDB con transacción)

```javascript
async function AddManyPromocionesMethod(bitacora, params, body, req, dbServer) {
  let data = DATA();
  let session = null;
  
  data.process = 'Crear promociones (AddMany)';
  data.processType = bitacora.processType;
  data.loggedUser = bitacora.loggedUser;
  data.principal = true;
  
  try {
    // Iniciar sesión para transacción
    session = await mongoose.startSession();
    session.startTransaction();
    
    // Validar payload
    const payload = getPayload(req);
    if (!payload || !Array.isArray(payload.promociones)) {
      throw new Error('Se requiere array promociones en el body');
    }
    
    // Insertar con auditoría
    const result = [];
    for (const promo of payload.promociones) {
      const nuevaPromo = await saveWithAudit(
        ZTPromociones,
        { IdPromoOK: promo.IdPromoOK },
        promo,
        params.LoggedUser,
        'CREATE',
        { session }
      );
      result.push(nuevaPromo);
    }
    
    // Commit transacción
    await session.commitTransaction();
    
    // Registrar éxito
    data.dataRes = result;
    data.countDataRes = result.length;
    data.messageUSR = `Promociones creadas: ${result.length}`;
    data.messageDEV = `Transacción completada correctamente`;
    
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // Rollback transacción
    if (session) {
      await session.abortTransaction();
    }
    
    // Registrar error
    data.messageUSR = 'Error al crear promociones';
    data.messageDEV = `Error en transacción: ${error.message}`;
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true;
    
    console.error('[AddMany] ❌ Error:', error.message);
    
    return bitacora;
    
  } finally {
    // Cerrar sesión
    if (session) {
      try {
        await session.endSession();
      } catch (closeError) {
        console.error('[AddMany] ⚠️  Error al cerrar sesión:', closeError.message);
      }
    }
  }
}
```

### Ejemplo 3: GetProducts (HANA)

```javascript
async function GetProductsMethod(bitacora, params, dbServer) {
  let data = DATA();
  let connection = null;
  
  data.process = 'Obtener productos (HANA)';
  data.processType = bitacora.processType;
  data.loggedUser = bitacora.loggedUser;
  data.principal = true;
  
  try {
    // Establecer conexión a HANA
    connection = await connectToHanaClient(dbServer);
    
    // Construir SQL
    const sql = `
      SELECT * FROM PRODUCTS 
      WHERE ACTIVED = 1 AND DELETED = 0
      LIMIT ? OFFSET ?
    `;
    
    const limit = params.limit || 100;
    const offset = params.offset || 0;
    
    // Ejecutar query
    const result = await new Promise((resolve, reject) => {
      connection.exec(sql, [limit, offset], (error, rows) => {
        if (error) reject(error);
        else resolve(rows);
      });
    });
    
    // Registrar éxito
    data.dataRes = result;
    data.countDataRes = result.length;
    data.messageUSR = `Productos obtenidos: ${result.length}`;
    data.messageDEV = `Query HANA ejecutado correctamente`;
    
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // Registrar error
    data.messageUSR = 'Error al consultar productos';
    data.messageDEV = `Error HANA: ${error.message}`;
    
    if (process.env.NODE_ENV === 'development') {
      data.stack = error.stack;
      data.errorCode = error.code;
    }
    
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    bitacora.finalRes = true;
    
    console.error('[GetProducts] ❌ Error HANA:', error.message);
    
    return bitacora;
    
  } finally {
    // Cerrar conexión HANA
    if (connection) {
      try {
        await connection.disconnect();
        console.log('[GetProducts] 🔌 Conexión HANA cerrada');
      } catch (closeError) {
        console.error('[GetProducts] ⚠️  Error al cerrar HANA:', closeError.message);
      }
    }
  }
}
```

---

## <a name="mejores-practicas"></a>✅ 8. Mejores Prácticas

### DO ✅

1. **Siempre usar try/catch**
   ```javascript
   try {
     // operaciones
   } catch (error) {
     // manejo de error
   }
   ```

2. **Instanciar DATA() local**
   ```javascript
   let data = DATA(); // Al inicio del método
   ```

3. **Configurar mensajes descriptivos**
   ```javascript
   data.messageUSR = 'Mensaje amigable para usuario';
   data.messageDEV = 'Detalle técnico con contexto';
   ```

4. **Establecer finalRes en errores**
   ```javascript
   bitacora.finalRes = true; // Detener ejecución
   ```

5. **Cerrar conexiones en finally**
   ```javascript
   finally {
     if (connection) await connection.disconnect();
   }
   ```

6. **Incluir stack trace en desarrollo**
   ```javascript
   if (process.env.NODE_ENV === 'development') {
     data.stack = error.stack;
   }
   ```

7. **Logs descriptivos**
   ```javascript
   console.error('[GetProducts] ❌ Error:', error.message);
   ```

### DON'T ❌

1. **NO manejar respuesta HTTP**
   ```javascript
   // ❌ NO
   res.error(500, error.message);
   res.status(200).json(result);
   ```

2. **NO lanzar errores sin capturar**
   ```javascript
   // ❌ NO
   throw new Error('Error'); // Sin try/catch
   
   // ✅ SÍ
   try {
     // operación
   } catch (error) {
     // manejar
   }
   ```

3. **NO dejar conexiones abiertas**
   ```javascript
   // ❌ NO
   const conn = await connect();
   // ... sin cerrar
   
   // ✅ SÍ
   try {
     const conn = await connect();
   } finally {
     await conn.disconnect();
   }
   ```

4. **NO retornar OK() o FAIL()**
   ```javascript
   // ❌ NO
   return OK(bitacora);
   return FAIL(bitacora);
   
   // ✅ SÍ
   return bitacora; // Solo bitacora
   ```

5. **NO ignorar errores en finally**
   ```javascript
   // ❌ NO
   finally {
     await connection.close(); // Sin try/catch
   }
   
   // ✅ SÍ
   finally {
     try {
       await connection.close();
     } catch (err) {
       console.error('Error al cerrar:', err.message);
     }
   }
   ```

---

## 🎯 Resumen Visual

```
┌─────────────────────────────────────────┐
│ MÉTODO LOCAL                            │
├─────────────────────────────────────────┤
│ 1. let data = DATA()                    │
│ 2. Configurar data.process, etc.       │
├─────────────────────────────────────────┤
│ TRY {                                   │
│   3. Establecer conexión (si necesario)│
│   4. Ejecutar query/operación           │
│   5. data.dataRes = resultado           │
│   6. bitacora = AddMSG(..., 'OK')      │
│   7. return bitacora                    │
│ }                                       │
├─────────────────────────────────────────┤
│ CATCH (error) {                         │
│   8. data.messageUSR = error amigable   │
│   9. data.messageDEV = error técnico    │
│  10. bitacora = AddMSG(..., 'FAIL')    │
│  11. bitacora.finalRes = true          │
│  12. return bitacora                    │
│ }                                       │
├─────────────────────────────────────────┤
│ FINALLY {                               │
│  13. Cerrar conexión                    │
│ }                                       │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [ ] ✅ Método tiene try/catch
- [ ] ✅ Instancia DATA() al inicio
- [ ] ✅ Configura data.process
- [ ] ✅ Establece conexión si necesario
- [ ] ✅ Ejecuta operación de BD
- [ ] ✅ Captura resultado en data.dataRes
- [ ] ✅ Usa AddMSG() para éxito
- [ ] ✅ Usa AddMSG() para error
- [ ] ✅ Establece finalRes=true en error
- [ ] ✅ Incluye messageUSR y messageDEV
- [ ] ✅ Cierra conexión en finally
- [ ] ✅ Retorna bitacora (no OK/FAIL)
- [ ] ✅ NO maneja respuesta HTTP
- [ ] ✅ Logs descriptivos

---

## 📚 Referencias

- **Handler**: `src/middlewares/respPWA.handler.js`
- **Servicio**: `src/api/services/ztpromociones-service.js`
- **Flujo Principal**: `ESTRUCTURA_FLUJO_SERVICIO.md`
- **Configuración Bitácora**: `CONFIGURACION_BITACORA.md`

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0  
**Autor**: Equipo Back-CDS
