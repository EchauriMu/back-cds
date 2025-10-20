// ============================================
// IMPORTS
// ============================================
const { ZTProducts_Presentaciones } = require('../models/mongodb/ztproducts_presentaciones');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
// ============================================
function getPayload(req) {
  return req.data || req.req?.body || null;
}

// ============================================
// CRUD BÁSICO (MONGO PURO)
// ============================================
async function GetAllZTProductsPresentaciones() {
  // por defecto excluimos borrados lógicos
  return await ZTProducts_Presentaciones.find({ DELETED: { $ne: true } }).lean();
}

async function GetOneZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const doc = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: idpresentaok }).lean();
  if (!doc) throw new Error('No se encontró la presentación');
  return doc;
}

async function AddOneZTProductsPresentacion(payload, user) {
  if (!payload) throw new Error('No se recibió payload. Verifica Content-Type: application/json');

  const required = ['IdPresentaOK', 'SKUID', 'Descripcion', 'Precio'];
  const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === '');
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);

  // evitar duplicados
  const exists = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: payload.IdPresentaOK }).lean();
  if (exists) throw new Error('Ya existe una presentación con ese IdPresentaOK');

  // defaults
  const data = {
    IdPresentaOK : payload.IdPresentaOK,
    SKUID        : payload.SKUID,
    Descripcion  : payload.Descripcion,
    CostoIni     : payload.CostoIni ?? 0,
    CostoFin     : payload.CostoFin ?? 0,
    Precio       : payload.Precio,
    Stock        : payload.Stock ?? 0,
    ACTIVED      : payload.ACTIVED ?? true,
    DELETED      : payload.DELETED ?? false,
    // REGUSER y REGDATE los setea saveWithAudit en CREATE
  };

  // usa helper con auditoría (CREATE dispara pre('save') y llena HISTORY)
  const created = await saveWithAudit(ZTProducts_Presentaciones, {}, data, user, 'CREATE');
  return created;
}

async function UpdateOneZTProductsPresentacion(idpresentaok, cambios, user) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');

  const filter = { IdPresentaOK: idpresentaok };
  // saveWithAudit asigna MODUSER/MODDATE y triggerá pre('save') para HISTORY
  const updated = await saveWithAudit(ZTProducts_Presentaciones, filter, cambios, user, 'UPDATE');
  return updated;
}

async function DeleteLogicZTProductsPresentacion(idpresentaok, user) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const filter = { IdPresentaOK: idpresentaok };
  const data   = { ACTIVED: false, DELETED: true };
  const res = await saveWithAudit(ZTProducts_Presentaciones, filter, data, user, 'UPDATE');
  return res;
}

async function DeleteHardZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const eliminado = await ZTProducts_Presentaciones.findOneAndDelete({ IdPresentaOK: idpresentaok });
  if (!eliminado) throw new Error('No se encontró la presentación para eliminar');
  return { mensaje: 'Presentación eliminada permanentemente', IdPresentaOK: idpresentaok };
}

async function ActivateOneZTProductsPresentacion(idpresentaok, user) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const filter = { IdPresentaOK: idpresentaok };
  const data   = { ACTIVED: true, DELETED: false };
  const res = await saveWithAudit(ZTProducts_Presentaciones, filter, data, user, 'UPDATE');
  return res;
}

// ============================================
// MÉTODOS LOCALES CON BITÁCORA (mismo estilo amigo)
// ============================================
async function GetAllMethod(bitacora, params, paramString, body, dbServer) {
  let data = DATA();

  // contexto
  data.process      = 'Obtener todas las presentaciones';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';
  data.queryString  = paramString;

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let docs;
    switch (dbServer) {
      case 'MongoDB':
        docs = await GetAllZTProductsPresentaciones();
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para GetAll');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = docs;
    data.messageUSR = 'Presentaciones obtenidas correctamente';
    data.messageDEV = 'GetAllZTProductsPresentaciones ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener las presentaciones';
    data.messageDEV = error.message;
    data.stack      = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetOneMethod(bitacora, params, idpresentaok, dbServer) {
  let data = DATA();

  data.process      = 'Obtener una presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let doc;
    switch (dbServer) {
      case 'MongoDB':
        doc = await GetOneZTProductsPresentacion(idpresentaok);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para GetOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = doc;
    data.messageUSR = 'Presentación obtenida correctamente';
    data.messageDEV = 'GetOneZTProductsPresentacion ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function AddOneMethod(bitacora, params, body, req, dbServer) {
  let data = DATA();

  data.process      = 'Agregar presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await AddOneZTProductsPresentacion(getPayload(req), params.LoggedUser);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para AddOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación creada correctamente';
    data.messageDEV = 'AddOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al crear la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function UpdateOneMethod(bitacora, params, idpresentaok, req, user, dbServer) {
  let data = DATA();

  data.process      = 'Actualizar presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await UpdateOneZTProductsPresentacion(idpresentaok, getPayload(req), user);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para UpdateOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación actualizada correctamente';
    data.messageDEV = 'UpdateOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al actualizar la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteLogicMethod(bitacora, params, idpresentaok, user, dbServer) {
  let data = DATA();

  data.process      = 'Borrado lógico de presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteLogicZTProductsPresentacion(idpresentaok, user);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para DeleteLogic');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación borrada lógicamente';
    data.messageDEV = 'DeleteLogic ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    if (error.message.includes('No se encontró')) {
      data.messageUSR = 'No se encontró la presentación especificada para borrar.';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else {
      data.messageUSR = 'Error al borrar lógicamente la presentación';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteHardMethod(bitacora, params, idpresentaok, dbServer) {
  let data = DATA();

  data.process      = 'Borrado permanente de presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteHardZTProductsPresentacion(idpresentaok);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para DeleteHard');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación borrada permanentemente';
    data.messageDEV = 'DeleteHard ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al borrar permanentemente la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function ActivateOneMethod(bitacora, params, idpresentaok, user, dbServer) {
  let data = DATA();

  data.process      = 'Activar presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await ActivateOneZTProductsPresentacion(idpresentaok, user);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para ActivateOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación activada correctamente';
    data.messageDEV = 'Activate ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al activar la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

// ============================================
// ORQUESTADOR PRINCIPAL (CAP Action)
//    ProcessType: GetAll | GetOne | AddOne | UpdateOne | DeleteLogic | DeleteHard | ActivateOne
//    Params esperados: LoggedUser, DBServer (opcional), idpresentaok (para One/Update/Delete/Activate)
// ============================================
async function ZTProductsPresentacionesCRUD(req) {
  let bitacora = BITACORA();
  let data = DATA();

  try {
    // 1. PARAMS
    const params = req.req?.query || {};
    const body   = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer, idpresentaok } = params;

    // 2. VALIDACIONES
    if (!ProcessType) {
      data.process     = 'Validación de parámetros obligatorios';
      data.messageUSR  = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV  = 'Valores válidos: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    if (!LoggedUser) {
      data.process     = 'Validación de parámetros obligatorios';
      data.messageUSR  = 'Falta parámetro obligatorio: LoggedUser';
      data.messageDEV  = 'LoggedUser es requerido para trazabilidad del sistema';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }

    // 3. CONTEXTO BITÁCORA
    const dbServer = DBServer || 'MongoDB';
    bitacora.processType = ProcessType;
    bitacora.loggedUser  = LoggedUser;
    bitacora.dbServer    = dbServer;
    bitacora.queryString = paramString;
    bitacora.method      = req.req?.method || 'UNKNOWN';
    bitacora.api         = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';
    bitacora.server      = process.env.SERVER_NAME || 'No especificado'; // eslint-disable-line

    // 4. ROUTING POR PROCESSTYPE
    switch (ProcessType) {
      case 'GetAll': {
        bitacora = await GetAllMethod(bitacora, params, paramString, body, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'GetOne': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación GetOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetOneMethod(bitacora, params, idpresentaok, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'AddOne': {
        bitacora = await AddOneMethod(bitacora, params, body, req, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'UpdateOne': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación UpdateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await UpdateOneMethod(bitacora, params, idpresentaok, req, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'DeleteLogic': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación DeleteLogic';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteLogicMethod(bitacora, params, idpresentaok, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'DeleteHard': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación DeleteHard';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteHardMethod(bitacora, params, idpresentaok, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'ActivateOne': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación ActivateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await ActivateOneMethod(bitacora, params, idpresentaok, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      default: {
        data.process     = 'Validación de ProcessType';
        data.messageUSR  = 'ProcessType inválido o no especificado';
        data.messageDEV  = 'ProcessType debe ser uno de: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes = true;
        return FAIL(bitacora);
      }
    }

    return OK(bitacora);

  } catch (error) {
    if (bitacora.finalRes) return FAIL(bitacora);

    // Error no manejado
    data.process     = 'Catch principal ZTProductsPresentacionesCRUD';
    data.messageUSR  = 'Ocurrió un error inesperado en el endpoint';
    data.messageDEV  = error.message;
    data.stack       = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.finalRes = true;

    return FAIL(bitacora);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  ZTProductsPresentacionesCRUD,

  // utilidades / helpers para uso interno o pruebas
  GetAllZTProductsPresentaciones,
  GetOneZTProductsPresentacion,
  AddOneZTProductsPresentacion,
  UpdateOneZTProductsPresentacion,
  DeleteLogicZTProductsPresentacion,
  DeleteHardZTProductsPresentacion,
  ActivateOneZTProductsPresentacion
};
