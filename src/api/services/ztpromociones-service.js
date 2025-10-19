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
  return req.data || req.req?.body || null;
}

// ============================================
// CRUD PRINCIPAL - Promociones
// ============================================
/**
 * EndPoint: POST /api/ztpromociones/crudPromociones
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
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // Extraer parámetros del request
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer } = params;
    
    // Validar parámetros obligatorios
    if (!ProcessType) {
      data.process = 'Validación de parámetros';
      data.messageUSR = 'Falta parámetro: ProcessType';
      data.messageDEV = 'Valores válidos: GetFilters, AddMany, UpdateMany, DeleteMany';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    if (!LoggedUser) {
      data.process = 'Validación de parámetros';
      data.messageUSR = 'Falta parámetro: LoggedUser';
      data.messageDEV = 'Usuario requerido para auditoría';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    // Configurar contexto de bitácora
    const dbServer = DBServer || 'MongoDB';
    bitacora.processType = ProcessType;
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = dbServer;
    bitacora.queryString = paramString;
    bitacora.method = req.req?.method || 'POST';
    bitacora.api = '/api/ztpromociones/crudPromociones';
    bitacora.server = process.env.SERVER_NAME || 'No especificado';

    // Ejecutar operación según ProcessType
    switch (ProcessType) {
      case 'GetFilters':
        bitacora = await GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'AddMany':
        bitacora = await AddManyPromocionesMethod(bitacora, params, body, req, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'UpdateMany':
        bitacora = await UpdateManyPromocionesMethod(bitacora, params, body, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'DeleteMany':
        bitacora = await DeleteManyPromocionesMethod(bitacora, params, body, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      default:
        data.process = 'Validación ProcessType';
        data.messageUSR = 'ProcessType inválido';
        data.messageDEV = 'Valores permitidos: GetFilters, AddMany, UpdateMany, DeleteMany';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes = true;
        return FAIL(bitacora);
    }
    
    return OK(bitacora);
    
  } catch (error) {
    // Error ya manejado en métodos locales
    if (bitacora.finalRes) {
      return FAIL(bitacora);
    }
    
    // Error no manejado
    data.process = 'Error inesperado';
    data.messageUSR = 'Error al procesar solicitud';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    // TODO: Registrar en tabla de errores
    // TODO: Notificar al usuario
    
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
 */
async function GetFiltersPromocionesMethod(bitacora, params, paramString, body, dbServer) {
  let data = DATA();
  
  // Configurar contexto
  data.process = 'Obtener promociones';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.api = '/api/ztpromociones/crudPromociones';
  data.queryString = paramString;
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Obtener promociones';
  
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
    
    data.dataRes = promociones;
    data.messageUSR = `Promociones obtenidas (${promociones.length} registros)`;
    data.messageDEV = `Filtros: ${JSON.stringify(filter)}`;
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al obtener promociones';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

/**
 * AddMany: Crea una o múltiples promociones
 * Usa saveWithAudit (≤10) o insertMany (>10)
 */
async function AddManyPromocionesMethod(bitacora, params, body, req, dbServer) {
  let data = DATA();
  
  data.process = 'Crear promociones';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.api = '/api/ztpromociones/crudPromociones';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Crear promociones';
  
  try {
    let result;
    const payload = getPayload(req);
    
    switch (dbServer) {
      case 'MongoDB':
        // Validar payload
        if (!payload || !Array.isArray(payload.promociones)) {
          throw new Error('Se requiere array promociones en el body');
        }

        const promocionesData = payload.promociones;

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
    
    data.dataRes = result;
    data.messageUSR = `Promociones creadas (${result.length} registros)`;
    data.messageDEV = 'AddMany ejecutado correctamente';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al crear promociones';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

/**
 * UpdateMany: Actualiza una o múltiples promociones
 * Usa saveWithAudit (con IdPromoOK) o updateMany (masivo)
 */
async function UpdateManyPromocionesMethod(bitacora, params, body, user, dbServer) {
  let data = DATA();
  
  data.process = 'Actualizar promociones';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.api = '/api/ztpromociones/crudPromociones';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Actualizar promociones';
  
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
    
    data.dataRes = {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      filter: body.filter,
      updates: body.updates
    };
    data.messageUSR = `Actualizadas: ${result.matchedCount} coincidencias, ${result.modifiedCount} modificadas`;
    data.messageDEV = 'UpdateMany ejecutado correctamente';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al actualizar promociones';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

/**
 * DeleteMany: Elimina lógica o físicamente promociones
 * deleteType: 'logic' (default) o 'hard'
 */
async function DeleteManyPromocionesMethod(bitacora, params, body, user, dbServer) {
  let data = DATA();
  
  data.process = 'Eliminar promociones';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.api = '/api/ztpromociones/crudPromociones';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Eliminar promociones';
  
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
    
    data.dataRes = {
      deleteType: params.deleteType || body.deleteType || 'logic',
      filter: body.filter,
      affected: result.matchedCount || result.deletedCount,
      modified: result.modifiedCount || result.deletedCount
    };
    data.messageUSR = result.messageUSR || 'Eliminación completada';
    data.messageDEV = result.messageDEV || 'DeleteMany ejecutado correctamente';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    if (error.message.includes('No se encontr')) {
      data.messageUSR = 'Promociones no encontradas';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else {
      data.messageUSR = 'Error al eliminar promociones';
      data.messageDEV = error.message;
      data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    bitacora.success = false;
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