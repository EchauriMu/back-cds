// ============================================
// IMPORTS
// ============================================
const mongoose = require('mongoose');
const ZTPromociones = require('../models/mongodb/ztpromociones');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// UTIL: Extraer payload del request
// ============================================
function getPayload(req) {
  // Intentar diferentes ubicaciones del payload
  let payload = null;
  
  // 1. req.data.payload (cuando viene como String desde CDS)
  if (req.data && req.data.payload) {
    try {
      // Si es String, parsearlo
      payload = typeof req.data.payload === 'string' 
        ? JSON.parse(req.data.payload) 
        : req.data.payload;
    } catch (e) {
      console.error('[getPayload] Error parseando req.data.payload:', e.message);
    }
  }
  // 2. req.data (CAP estándar - objeto completo)
  else if (req.data && typeof req.data === 'object' && Object.keys(req.data).length > 0) {
    // Excluir si solo tiene 'payload'
    const keys = Object.keys(req.data);
    if (!(keys.length === 1 && keys[0] === 'payload')) {
      payload = req.data;
    }
  }
  // 3. req.req.body (HTTP directo)
  else if (req.req && req.req.body && typeof req.req.body === 'object') {
    payload = req.req.body;
  }
  // 4. req.body (alternativo)
  else if (req.body && typeof req.body === 'object') {
    payload = req.body;
  }
  
  return payload;
}

// ============================================
// CRUD PRINCIPAL - Promociones
// ============================================
/**
 * EndPoint: POST /api/ztpromociones/crudPromociones
 * 
 * ESTRATEGIA DE BITÁCORA OPTIMIZADA:
 * - Flujo exitoso: Un único registro final en bitacora.data con toda la respuesta
 * - Flujo con error: Múltiples registros donde el último es el error + finalRes=true
 * 
 * Parámetros obligatorios:
 * @param {string} ProcessType - GetFilters | AddMany | UpdateMany | DeleteMany
 * @param {string} LoggedUser - Usuario formato: jlopezm
 * 
 * Parámetros opcionales:
 * @param {string} DBServer - Default: MongoDB | HANA | AzureCosmos
 * @param {string} method/api - Autoconfigurado por el sistema
 * 
 * @example ?ProcessType=GetFilters&LoggedUser=jlopezm
 */
async function crudZTPromociones(req) {
  // ============================================
  // INICIALIZACIÓN DE ESTRUCTURAS BASE
  // ============================================
  // Instanciar bitácora y data al inicio del servicio
  let bitacora = BITACORA();
  let data = DATA();
  
  // ============================================
  // DEBUG: Ver qué contiene el request
  // ============================================
  if (process.env.NODE_ENV === 'development') { // eslint-disable-line
    console.log('[ZTPROMOCIONES DEBUG] ═══════════════════════════════════════');
    console.log('[ZTPROMOCIONES DEBUG] req.data:', JSON.stringify(req.data, null, 2));
    console.log('[ZTPROMOCIONES DEBUG] req.req.body:', JSON.stringify(req.req?.body, null, 2));
    console.log('[ZTPROMOCIONES DEBUG] req.body:', JSON.stringify(req.body, null, 2));
    console.log('[ZTPROMOCIONES DEBUG] req.req.query:', JSON.stringify(req.req?.query, null, 2));
    console.log('[ZTPROMOCIONES DEBUG] ═══════════════════════════════════════');
  }
  
  try {
    // Extraer parámetros del request
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer } = params;
    
    // ============================================
    // VALIDACIÓN DE PARÁMETROS OBLIGATORIOS
    // ============================================
    // Si falla validación, registrar error y detener ejecución
    if (!ProcessType) {
      data.process = 'Validación de parámetros';
      data.processType = 'ValidationError';
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
      data.api = '/api/ztpromociones/crudPromociones';
      data.method = req.req?.method || 'POST';
      
      // Registrar error en bitácora
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      
      // Establecer finalRes para detener ejecución
      bitacora.finalRes = true;
      
      return FAIL(bitacora);
    }
    
    if (!LoggedUser) {
      data.process = 'Validación de parámetros';
      data.processType = 'ValidationError';
      data.messageUSR = 'Falta parámetro obligatorio: LoggedUser';
      data.messageDEV = 'Usuario requerido para auditoría. Formato esperado: jlopezm';
      data.api = '/api/ztpromociones/crudPromociones';
      data.method = req.req?.method || 'POST';
      
      // Registrar error en bitácora
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      
      // Establecer finalRes para detener ejecución
      bitacora.finalRes = true;
      
      return FAIL(bitacora);
    }
    
    // ============================================
    // CONFIGURAR CONTEXTO DE BITÁCORA
    // ============================================
    // La bitácora debe incluir información del proceso, usuario, servidor y endpoint
    const dbServer = DBServer || 'MongoDB';
    
    // Campos obligatorios de la bitácora
    bitacora.processType = ProcessType;              // Tipo de operación (GetFilters, AddMany, etc.)
    bitacora.dbServer = dbServer;                    // Servidor de BD usado (MongoDB, HANA, etc.)
    bitacora.loggedUser = LoggedUser;                // Usuario que ejecuta el proceso
    bitacora.method = req.req?.method || 'POST';     // Método HTTP (GET, POST, etc.)
    bitacora.api = '/api/ztpromociones/crudPromociones';  // Ruta del endpoint
    
    // Campos adicionales para auditoría
    bitacora.queryString = paramString;              // Parámetros de la URL serializados
    bitacora.server = process.env.SERVER_NAME || 'No especificado'; // eslint-disable-line
    bitacora.timestamp = new Date().toISOString();   // Timestamp de inicio

    // ============================================
    // EJECUTAR OPERACIÓN SEGÚN ProcessType
    // ============================================
    // Flujo con evaluación de promesa usando .then()
    switch (ProcessType) {
      case 'GetFilters':
        // Llamar al método local (query real)
        bitacora = await GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer)
          .then((bitacora) => {
            // Evaluar la promesa retornada
            if (!bitacora.success) {
              // Si falló, marcar como respuesta final y lanzar error
              bitacora.finalRes = true;
              throw bitacora;
            }
            return bitacora;
          });
        break;
        
      case 'AddMany':
        // Llamar al método local (query real)
        bitacora = await AddManyPromocionesMethod(bitacora, params, body, req, dbServer)
          .then((bitacora) => {
            // Evaluar la promesa retornada
            if (!bitacora.success) {
              // Si falló, marcar como respuesta final y lanzar error
              bitacora.finalRes = true;
              throw bitacora;
            }
            return bitacora;
          });
        break;
        
      case 'UpdateMany':
        // Llamar al método local (query real)
        bitacora = await UpdateManyPromocionesMethod(bitacora, params, body, LoggedUser, dbServer)
          .then((bitacora) => {
            // Evaluar la promesa retornada
            if (!bitacora.success) {
              // Si falló, marcar como respuesta final y lanzar error
              bitacora.finalRes = true;
              throw bitacora;
            }
            return bitacora;
          });
        break;
        
      case 'DeleteMany':
        // Llamar al método local (query real)
        bitacora = await DeleteManyPromocionesMethod(bitacora, params, body, LoggedUser, dbServer)
          .then((bitacora) => {
            // Evaluar la promesa retornada
            if (!bitacora.success) {
              // Si falló, marcar como respuesta final y lanzar error
              bitacora.finalRes = true;
              throw bitacora;
            }
            return bitacora;
          });
        break;
        
      default:
        // ProcessType inválido
        data.process = 'Validación ProcessType';
        data.processType = 'ValidationError';
        data.messageUSR = `ProcessType inválido: "${ProcessType}"`;
        data.messageDEV = 'Valores permitidos: GetFilters, AddMany, UpdateMany, DeleteMany';
        data.api = '/api/ztpromociones/crudPromociones';
        data.method = req.req?.method || 'POST';
        
        // Registrar error en bitácora
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        
        // Establecer finalRes para detener ejecución
        bitacora.finalRes = true;
        
        return FAIL(bitacora);
    }
    
    // ============================================
    // FLUJO EXITOSO: Retornar resultado único
    // ============================================
    // Todo el proceso fue exitoso, retornar bitácora completa
    return OK(bitacora);
    
  } catch (error) {
    // ============================================
    // MANEJO INTEGRAL DE ERRORES CAPTURADOS EN CATCH
    // ============================================
    
    // ============================================
    // CASO 1: Error ya manejado por métodos locales
    // ============================================
    // Si el error tiene finalRes=true, significa que ya fue procesado
    // en el método local y contiene toda la bitácora con el error
    if (error.finalRes === true || bitacora.finalRes === true) {
      // El error ya está registrado en bitácora.data como último registro
      // Solo retornar FAIL con la bitácora completa (incluyendo errores previos)
      
      console.error('[ZTPROMOCIONES] ⚠️  Error manejado por método local');
      console.error('[ZTPROMOCIONES] 📊 Bitácora con historial:', JSON.stringify(error.data || bitacora.data, null, 2));
      
      // Si el error es un objeto bitácora (lanzado desde .then()), usarlo
      if (error.data && Array.isArray(error.data)) {
        return FAIL(error);
      }
      
      return FAIL(bitacora);
    }
    
    // ============================================
    // CASO 2: ERROR INESPERADO NO MANEJADO
    // ============================================
    // Error que no fue capturado por los métodos locales
    // Crear nuevo objeto data para registrar el error inesperado
    
    let errorData = DATA();
    errorData.process = 'Error inesperado en servicio principal';
    errorData.processType = 'UnhandledError';
    errorData.messageUSR = 'Error crítico al procesar solicitud. Contacte al administrador del sistema.';
    errorData.messageDEV = `Error no capturado: ${error.message}`;
    errorData.api = '/api/ztpromociones/crudPromociones';
    errorData.method = req.req?.method || 'POST';
    
    // Incluir stack trace completo solo en desarrollo
    if (process.env.NODE_ENV === 'development') { // eslint-disable-line
      errorData.stack = error.stack;
      errorData.errorDetails = {
        name: error.name,
        code: error.code,
        cause: error.cause
      };
    }
    
    // Registrar error inesperado en bitácora (será el último registro)
    bitacora = AddMSG(bitacora, errorData, 'FAIL', 500, true);
    
    // Establecer finalRes para indicar que este es el error final
    bitacora.finalRes = true;
    bitacora.success = false;
    
    // ============================================
    // LOG DE ERROR CRÍTICO
    // ============================================
    
    // Log detallado en consola para debugging inmediato
    console.error('[ZTPROMOCIONES] ❌ ERROR CRÍTICO INESPERADO:');
    console.error('[ZTPROMOCIONES] 📛 Mensaje:', error.message);
    console.error('[ZTPROMOCIONES] 📊 Bitácora completa:', JSON.stringify(bitacora, null, 2));
    
    if (process.env.NODE_ENV === 'development') { // eslint-disable-line
      console.error('[ZTPROMOCIONES] 🔍 Stack trace:', error.stack);
    }
    
    // Retornar FAIL con toda la bitácora (incluyendo errores previos + error final)
    return FAIL(bitacora);
  }
}

// ============================================ 
// CRUD BÁSICO: Operaciones simples
// ============================================
async function GetAllZTPromociones() {
  return await ZTPromociones.find({ ACTIVED: true, DELETED: false }).lean();
}

async function GetOneZTPromocion(filter) {
  if (!filter) throw new Error('Falta parámetro filter');
  const promo = await ZTPromociones.findOne({ ...filter, ACTIVED: true, DELETED: false }).lean();
  if (!promo) throw new Error('No se encontró la promoción');
  return promo;
}

//============================================
// CRUD BÁSICO: DELETE / ACTIVATE
//============================================
async function DeleteZTPromocionLogic(filter, user) {
  if (!filter) throw new Error('Falta parámetro filter');
  const data = { ACTIVED: false, DELETED: true };
  const action = 'UPDATE';
  return await saveWithAudit(ZTPromociones, filter, data, user, action);
}

async function DeleteZTPromocionHard(filter) {
  if (!filter) throw new Error('Falta parámetro filter');
  const eliminado = await ZTPromociones.findOneAndDelete(filter);
  if (!eliminado) throw new Error('Promoción no encontrada');
  return { mensaje: 'Promoción eliminada', filter };
}

async function ActivateZTPromocion(filter, user) {
  if (!filter) throw new Error('Falta parámetro filter');
  const data = { ACTIVED: true, DELETED: false };
  return await saveWithAudit(ZTPromociones, filter, data, user, 'UPDATE');
}

// ============================================
// MÉTODOS LOCALES CON BITÁCORA
// ============================================

/**
 * GetFilters: Obtiene promociones con filtros dinámicos
 * Soporta: IdPromoOK, SKUID, IdListaOK, vigentes, paginación
 * 
 * ESTRATEGIA DE BITÁCORA:
 * - Éxito: Registrar UN SOLO resultado final con todos los datos
 * - Error: Registrar error y establecer finalRes=true
 * 
 * @param {Object} bitacora - Instancia de bitácora pasada por referencia
 * @param {Object} params - Parámetros del query string
 * @param {String} paramString - Cadena serializada de parámetros
 * @param {Object} body - Body del request
 * @param {String} dbServer - Motor de base de datos
 * @returns {Object} bitacora actualizada
 */
async function GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer) {
  // ============================================
  // INICIALIZACIÓN DE DATA PARA ESTE MÉTODO
  // ============================================
  // Instanciar nuevo objeto data para este método
  let data = DATA();
  
  // ============================================
  // CONFIGURACIÓN DE BITÁCORA (campos obligatorios)
  // ============================================
  // La bitácora heredó los valores del servicio principal,
  // aquí solo actualizamos campos específicos del método
  
  // Configurar contexto del data
  data.process = 'Obtener promociones (GetFilters)';
  data.processType = bitacora.processType;           // Ya configurado en servicio principal
  data.loggedUser = bitacora.loggedUser;             // Ya configurado en servicio principal
  data.dbServer = bitacora.dbServer;                 // Ya configurado en servicio principal
  data.method = bitacora.method;                     // Ya configurado en servicio principal
  data.api = bitacora.api;                           // Ya configurado en servicio principal
  data.queryString = bitacora.queryString;           // Ya configurado en servicio principal
  data.server = bitacora.server;                     // Ya configurado en servicio principal
  data.principal = true;                             // Marcar como proceso principal
  
  // La bitácora ya tiene configurados:
  // - bitacora.processType → tipo de operación (GetFilters)
  // - bitacora.dbServer → servidor de BD usado (MongoDB)
  // - bitacora.loggedUser → usuario que ejecuta el proceso
  // - bitacora.method → método HTTP (POST)
  // - bitacora.api → ruta del endpoint
  // - bitacora.queryString → parámetros serializados
  bitacora.process = 'Obtener promociones (GetFilters)';
  
  try {
    let promociones;
    let filter = {};
    
    switch (dbServer) {
      case 'MongoDB':
        const {
          IdPromoOK,
          SKUID,
          IdListaOK,
          vigentes,
          limit = 100,
          offset = 0
        } = params;

        // Construir filtro base
        filter = { ACTIVED: true, DELETED: false };
        
        if (IdPromoOK) filter.IdPromoOK = IdPromoOK;
        if (SKUID) filter.SKUID = SKUID;
        if (IdListaOK) filter.IdListaOK = IdListaOK;
        
        // Filtro por vigencia
        if (vigentes === 'true') {
          const now = new Date();
          filter.FechaIni = { $lte: now };
          filter.FechaFin = { $gte: now };
        }

        // Ejecutar query con paginación
        promociones = await new Promise((resolve, reject) => {
          ZTPromociones.find(filter)
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .lean()
            .exec()
            .then(result => resolve(result))
            .catch(error => reject(error));
        });
        break;
        
      case 'HANA':
        throw new Error('HANA no implementado');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    // ============================================
    // FLUJO EXITOSO: UN SOLO REGISTRO EN BITÁCORA
    // ============================================
    data.dataRes = promociones;
    data.countDataRes = promociones.length;
    data.messageUSR = `Promociones obtenidas exitosamente: ${promociones.length} registro(s)`;
    data.messageDEV = `Filtros aplicados: ${JSON.stringify(filter)} | Paginación: limit=${params.limit || 100}, offset=${params.offset || 0}`;
    
    // Registrar resultado exitoso en bitácora (único registro)
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // ============================================
    // FLUJO CON ERROR: REGISTRAR Y DETENER
    // ============================================
    data.messageUSR = 'Error al obtener promociones';
    data.messageDEV = `Error en query MongoDB: ${error.message}`;
    
    // Incluir stack trace solo en desarrollo
    if (process.env.NODE_ENV === 'development') { // eslint-disable-line
      data.stack = error.stack;
    }
    
    // Registrar error en bitácora (será el último registro)
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    
    // Marcar como respuesta final para detener ejecución
    bitacora.finalRes = true;
    
    // Log de error
    console.error('[GetFilters] ❌ Error:', error.message);
    
    return bitacora;
  }
}

/**
 * AddMany: Crea una o múltiples promociones
 * Usa saveWithAudit (≤10) o insertMany (>10)
 * 
 * ESTRATEGIA DE BITÁCORA:
 * - Éxito: Registrar UN SOLO resultado final con resumen de creaciones
 * - Error: Registrar error y establecer finalRes=true
 * 
 * @param {Object} bitacora - Instancia de bitácora pasada por referencia
 * @param {Object} params - Parámetros del query string
 * @param {Object} body - Body del request
 * @param {Object} req - Request completo
 * @param {String} dbServer - Motor de base de datos
 * @returns {Object} bitacora actualizada
 */
async function AddManyPromocionesMethod(bitacora, params, body, req, dbServer) {
  // ============================================
  // INICIALIZACIÓN DE DATA PARA ESTE MÉTODO
  // ============================================
  // Instanciar nuevo objeto data para este método
  let data = DATA();
  
  // ============================================
  // CONFIGURACIÓN DE BITÁCORA (campos obligatorios)
  // ============================================
  // La bitácora heredó los valores del servicio principal
  
  // Configurar contexto del data
  data.process = 'Crear promociones (AddMany)';
  data.processType = bitacora.processType;           // Ya configurado en servicio principal
  data.loggedUser = bitacora.loggedUser;             // Ya configurado en servicio principal
  data.dbServer = bitacora.dbServer;                 // Ya configurado en servicio principal
  data.method = bitacora.method;                     // Ya configurado en servicio principal
  data.api = bitacora.api;                           // Ya configurado en servicio principal
  data.server = bitacora.server;                     // Ya configurado en servicio principal
  data.principal = true;                             // Marcar como proceso principal
  
  // Actualizar descripción del proceso en bitácora
  bitacora.process = 'Crear promociones (AddMany)';
  
  try {
    let result;
    const payload = getPayload(req);
    
    switch (dbServer) {
      case 'MongoDB':
        // Validar payload - permitir tanto 'promociones' como directamente el array
        let promocionesData;
        
        if (!payload) {
          throw new Error('Se requiere array promociones en el body');
        }
        
        // Permitir tanto { promociones: [...] } como [...] directamente
        if (Array.isArray(payload)) {
          promocionesData = payload;
        } else if (payload.promociones && Array.isArray(payload.promociones)) {
          promocionesData = payload.promociones;
        } else {
          throw new Error('Se requiere array promociones en el body');
        }
        
        if (promocionesData.length === 0) {
          throw new Error('El array promociones no puede estar vacío');
        }

        // Validar campos obligatorios
        const promocionesValidadas = promocionesData.map(promo => {
          if (!promo.IdPromoOK || !promo.Titulo || !promo.FechaIni || !promo.FechaFin) {
            throw new Error('Faltan campos obligatorios: IdPromoOK, Titulo, FechaIni, FechaFin');
          }
          return {
            ...promo,
            ACTIVED: true,
            DELETED: false
          };
        });

        // Insertar con auditoría
        result = await new Promise(async (resolve, reject) => {
          try {
            const promocionesCreadas = [];
            
            // Para pocas promociones, usar saveWithAudit
            if (promocionesValidadas.length <= 10) {
              for (const promo of promocionesValidadas) {
                try {
                  const nuevaPromo = await saveWithAudit(
                    ZTPromociones, 
                    { IdPromoOK: promo.IdPromoOK },
                    promo, 
                    params.LoggedUser, 
                    'CREATE'
                  );
                  promocionesCreadas.push(nuevaPromo);
                } catch (error) {
                  if (error.message.includes('E11000') || error.message.includes('duplicate')) {
                    console.warn(`[ZTPROMOCIONES] ${promo.IdPromoOK} ya existe`);
                  } else {
                    reject(error);
                    return;
                  }
                }
              }
            } else {
              // Para muchas, usar insertMany con auditoría manual
              const promocionesConAuditoria = promocionesValidadas.map(promo => ({
                ...promo,
                REGUSER: params.LoggedUser,
                REGDATE: new Date(),
                MODDATE: new Date()
              }));
              
              const resultados = await ZTPromociones.insertMany(promocionesConAuditoria);
              promocionesCreadas.push(...resultados);
            }
            
            const resumen = promocionesCreadas.map(p => ({
              IdPromoOK: p.IdPromoOK,
              Titulo: p.Titulo,
              REGUSER: p.REGUSER,
              REGDATE: p.REGDATE
            }));
            
            resolve(resumen);
          } catch (error) {
            reject(error);
          }
        });
        break;
        
      case 'HANA':
        throw new Error('HANA no implementado');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    // ============================================
    // FLUJO EXITOSO: UN SOLO REGISTRO EN BITÁCORA
    // ============================================
    data.dataRes = result;
    data.countDataRes = result.length;
    data.messageUSR = `Promociones creadas exitosamente: ${result.length} registro(s)`;
    data.messageDEV = `AddMany ejecutado correctamente. Método: ${result.length <= 10 ? 'saveWithAudit' : 'insertMany'}`;
    
    // Registrar resultado exitoso en bitácora (único registro)
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // ============================================
    // FLUJO CON ERROR: REGISTRAR Y DETENER
    // ============================================
    data.messageUSR = 'Error al crear promociones';
    data.messageDEV = `Error en AddMany: ${error.message}`;
    
    // Incluir stack trace solo en desarrollo
    if (process.env.NODE_ENV === 'development') { // eslint-disable-line
      data.stack = error.stack;
    }
    
    // Registrar error en bitácora (será el último registro)
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    
    // Marcar como respuesta final para detener ejecución
    bitacora.finalRes = true;
    
    // Log de error
    console.error('[AddMany] ❌ Error:', error.message);
    
    return bitacora;
  }
}

/**
 * UpdateMany: Actualiza una o múltiples promociones
 * Usa saveWithAudit (con IdPromoOK) o updateMany (masivo)
 * 
 * ESTRATEGIA DE BITÁCORA:
 * - Éxito: Registrar UN SOLO resultado final con resumen de actualizaciones
 * - Error: Registrar error y establecer finalRes=true
 * 
 * @param {Object} bitacora - Instancia de bitácora pasada por referencia
 * @param {Object} params - Parámetros del query string
 * @param {Object} body - Body del request con filter y updates
 * @param {String} user - Usuario que ejecuta la operación
 * @param {String} dbServer - Motor de base de datos
 * @returns {Object} bitacora actualizada
 */
async function UpdateManyPromocionesMethod(bitacora, params, body, user, dbServer) {
  // Instanciar nuevo objeto data para este método
  let data = DATA();
  
  // ============================================
  // CONFIGURACIÓN DE BITÁCORA (campos obligatorios)
  // ============================================
  // La bitácora heredó los valores del servicio principal
  
  // Configurar contexto del data
  data.process = 'Actualizar promociones (UpdateMany)';
  data.processType = bitacora.processType;           // Ya configurado en servicio principal
  data.loggedUser = bitacora.loggedUser;             // Ya configurado en servicio principal
  data.dbServer = bitacora.dbServer;                 // Ya configurado en servicio principal
  data.method = bitacora.method;                     // Ya configurado en servicio principal
  data.api = bitacora.api;                           // Ya configurado en servicio principal
  data.server = bitacora.server;                     // Ya configurado en servicio principal
  data.principal = true;                             // Marcar como proceso principal
  
  // Actualizar descripción del proceso en bitácora
  bitacora.process = 'Actualizar promociones (UpdateMany)';
  
  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        if (!body || (!body.filter && !body.updates)) {
          throw new Error('Se requieren filter y updates en el body');
        }

        const { filter, updates } = body;

        result = await new Promise(async (resolve, reject) => {
          try {
            let updateResult;
            
            // Con IdPromoOK: usar saveWithAudit
            if (filter.IdPromoOK) {
              const savedPromo = await saveWithAudit(
                ZTPromociones,
                { ...filter, ACTIVED: true, DELETED: false },
                updates,
                user,
                'UPDATE'
              );
              
              updateResult = {
                matchedCount: 1,
                modifiedCount: savedPromo ? 1 : 0
              };
            } else {
              // Sin IdPromoOK: updateMany con auditoría manual
              updates.MODUSER = user;
              updates.MODDATE = new Date();

              updateResult = await ZTPromociones.updateMany(
                { ...filter, ACTIVED: true, DELETED: false },
                { $set: updates },
                { runValidators: true }
              );
            }
            
            resolve(updateResult);
          } catch (error) {
            reject(error);
          }
        });
        break;
        
      case 'HANA':
        throw new Error('HANA no implementado');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    // ============================================
    // FLUJO EXITOSO: UN SOLO REGISTRO EN BITÁCORA
    // ============================================
    data.dataRes = {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      filter: body.filter,
      updates: body.updates
    };
    data.countDataRes = result.modifiedCount;
    data.messageUSR = `Promociones actualizadas exitosamente: ${result.matchedCount} encontrada(s), ${result.modifiedCount} modificada(s)`;
    data.messageDEV = `UpdateMany ejecutado correctamente. Método: ${body.filter.IdPromoOK ? 'saveWithAudit' : 'updateMany'}`;
    
    // Registrar resultado exitoso en bitácora (único registro)
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // ============================================
    // FLUJO CON ERROR: REGISTRAR Y DETENER
    // ============================================
    data.messageUSR = 'Error al actualizar promociones';
    data.messageDEV = `Error en UpdateMany: ${error.message}`;
    
    // Incluir stack trace solo en desarrollo
    if (process.env.NODE_ENV === 'development') { // eslint-disable-line
      data.stack = error.stack;
    }
    
    // Registrar error en bitácora (será el último registro)
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    
    // Marcar como respuesta final para detener ejecución
    bitacora.finalRes = true;
    
    // Log de error
    console.error('[UpdateMany] ❌ Error:', error.message);
    
    return bitacora;
  }
}

/**
 * DeleteMany: Elimina lógica o físicamente promociones
 * deleteType: 'logic' (default) o 'hard'
 * 
 * ESTRATEGIA DE BITÁCORA:
 * - Éxito: Registrar UN SOLO resultado final con resumen de eliminaciones
 * - Error: Registrar error y establecer finalRes=true
 * 
 * @param {Object} bitacora - Instancia de bitácora pasada por referencia
 * @param {Object} params - Parámetros del query string
 * @param {Object} body - Body del request con filter
 * @param {String} user - Usuario que ejecuta la operación
 * @param {String} dbServer - Motor de base de datos
 * @returns {Object} bitacora actualizada
 */
async function DeleteManyPromocionesMethod(bitacora, params, body, user, dbServer) {
  // ============================================
  // INICIALIZACIÓN DE DATA PARA ESTE MÉTODO
  // ============================================
  // Instanciar nuevo objeto data para este método
  let data = DATA();
  
  // ============================================
  // CONFIGURACIÓN DE BITÁCORA (campos obligatorios)
  // ============================================
  // La bitácora heredó los valores del servicio principal
  
  // Configurar contexto del data
  data.process = 'Eliminar promociones (DeleteMany)';
  data.processType = bitacora.processType;           // Ya configurado en servicio principal
  data.loggedUser = bitacora.loggedUser;             // Ya configurado en servicio principal
  data.dbServer = bitacora.dbServer;                 // Ya configurado en servicio principal
  data.method = bitacora.method;                     // Ya configurado en servicio principal
  data.api = bitacora.api;                           // Ya configurado en servicio principal
  data.server = bitacora.server;                     // Ya configurado en servicio principal
  data.principal = true;                             // Marcar como proceso principal
  
  // Actualizar descripción del proceso en bitácora
  bitacora.process = 'Eliminar promociones (DeleteMany)';
  
  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        const deleteType = params.deleteType || body.deleteType || 'logic';
        
        if (!body || !body.filter) {
          throw new Error('Se requiere filter en el body');
        }

        const { filter } = body;

        result = await new Promise(async (resolve, reject) => {
          try {
            let deleteResult;
            
            if (deleteType === 'logic') {
              // Con IdPromoOK: usar saveWithAudit
              if (filter.IdPromoOK) {
                const updates = {
                  DELETED: true,
                  ACTIVED: false
                };
                
                const deletedPromo = await saveWithAudit(
                  ZTPromociones,
                  { ...filter, DELETED: false },
                  updates,
                  user,
                  'UPDATE'
                );
                
                deleteResult = {
                  matchedCount: deletedPromo ? 1 : 0,
                  modifiedCount: deletedPromo ? 1 : 0
                };
              } else {
                // Sin IdPromoOK: updateMany
                const updates = {
                  DELETED: true,
                  ACTIVED: false,
                  MODUSER: user,
                  MODDATE: new Date()
                };

                deleteResult = await ZTPromociones.updateMany(
                  { ...filter, DELETED: false },
                  { $set: updates }
                );
              }

              deleteResult.messageUSR = `Eliminadas lógicamente: ${deleteResult.matchedCount} coincidencias, ${deleteResult.modifiedCount} modificadas`;
              deleteResult.messageDEV = 'Delete logic ejecutado correctamente';
              
            } else if (deleteType === 'hard') {
              // Eliminación física permanente
              deleteResult = await ZTPromociones.deleteMany(filter);

              deleteResult.messageUSR = `Eliminadas permanentemente: ${deleteResult.deletedCount} registros`;
              deleteResult.messageDEV = 'Delete hard ejecutado correctamente';
              
            } else {
              reject(new Error('deleteType debe ser "logic" o "hard"'));
              return;
            }
            
            resolve(deleteResult);
          } catch (error) {
            reject(error);
          }
        });
        break;
        
      case 'HANA':
        throw new Error('HANA no implementado');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    // ============================================
    // FLUJO EXITOSO: UN SOLO REGISTRO EN BITÁCORA
    // ============================================
    const deleteType = params.deleteType || body.deleteType || 'logic';
    const affectedCount = result.matchedCount || result.deletedCount || 0;
    const modifiedCount = result.modifiedCount || result.deletedCount || 0;
    
    data.dataRes = {
      deleteType: deleteType,
      filter: body.filter,
      affected: affectedCount,
      modified: modifiedCount
    };
    data.countDataRes = modifiedCount;
    data.messageUSR = result.messageUSR || `Promociones eliminadas exitosamente: ${affectedCount} encontrada(s), ${modifiedCount} ${deleteType === 'logic' ? 'desactivada(s)' : 'eliminada(s)'}`;
    data.messageDEV = result.messageDEV || `DeleteMany ejecutado correctamente. Tipo: ${deleteType}, Método: ${body.filter.IdPromoOK ? 'saveWithAudit' : 'updateMany/deleteMany'}`;
    
    // Registrar resultado exitoso en bitácora (único registro)
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    
    return bitacora;
    
  } catch (error) {
    // ============================================
    // FLUJO CON ERROR: REGISTRAR Y DETENER
    // ============================================
    
    // Determinar tipo de error
    if (error.message.includes('No se encontr')) {
      // Error 404: No encontrado
      data.messageUSR = 'Promociones no encontradas con los filtros especificados';
      data.messageDEV = `Error en DeleteMany: ${error.message}`;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else {
      // Error 500: Error de servidor
      data.messageUSR = 'Error al eliminar promociones';
      data.messageDEV = `Error en DeleteMany: ${error.message}`;
      
      // Incluir stack trace solo en desarrollo
      if (process.env.NODE_ENV === 'development') { // eslint-disable-line
        data.stack = error.stack;
      }
      
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    
    bitacora.success = false;
    
    // Marcar como respuesta final para detener ejecución
    bitacora.finalRes = true;
    
    // Log de error
    console.error('[DeleteMany] ❌ Error:', error.message);
    
    return bitacora;
  }
}

// ============================================
// CONEXIÓN SEGÚN DBSERVER
// ============================================
async function GetConnectionByDbServer(dbServer) {
  switch (dbServer) {
    case 'MongoDB':
      if (mongoose.connection.readyState !== 1) {
        console.log('[ZTPROMOCIONES] Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
      }
      return mongoose.connection;
      
    case 'HANA':
      throw new Error('HANA no implementado');
      
    case 'AzureCosmos':
      throw new Error('Azure Cosmos no implementado');
      
    default:
      throw new Error(`DBServer no soportado: ${dbServer}`);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  // Función principal
  crudZTPromociones,
  
  // CRUD básico
  GetAllZTPromociones,
  GetOneZTPromocion,
  DeleteZTPromocionLogic,
  DeleteZTPromocionHard,
  ActivateZTPromocion,
  
  // Métodos con bitácora
  GetFiltersPromocionesMethod,
  AddManyPromocionesMethod,
  UpdateManyPromocionesMethod,
  DeleteManyPromocionesMethod,
  
  // Utilidades
  GetConnectionByDbServer,
  
  // Legacy (deprecado)
  ZTPromocionesCRUD: async (req) => {
    console.warn('[LEGACY] Use crudZTPromociones en lugar de ZTPromocionesCRUD');
    
    const legacyParams = req.req?.query || {};
    const processTypeMap = {
      'get-all': 'GetFilters',
      'get-one': 'GetFilters', 
      'post': 'AddMany',
      'put': 'UpdateMany',
      'delete': 'DeleteMany'
    };
    
    if (!req.req) req.req = {};
    req.req.query = {
      ProcessType: processTypeMap[`${legacyParams.procedure}${legacyParams.type ? `-${legacyParams.type}` : ''}`] || 'GetFilters',
      DBServer: legacyParams.DBServer || 'MongoDB',
      LoggedUser: legacyParams.LoggedUser || 'system_legacy',
      ...legacyParams
    };
    
    return await crudZTPromociones(req);
  }
};