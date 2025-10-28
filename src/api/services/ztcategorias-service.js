// ============================================
// IMPORTS
// ============================================
const ZTCATEGORIAS = require('../models/mongodb/ztcategorias');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// Util: payload desde CDS/Express
function getPayload(req) {
  return req.data || req.req?.body || null;
}

// ============================================
// OPERACIONES MONGO
// ============================================
async function GetAllZTCategorias() {
  return await ZTCATEGORIAS.find({ DELETED: { $ne: true } }).lean();
}

async function GetOneZTCategoria(catid) {
  if (!catid) throw new Error('Falta parámetro catid');
  const doc = await ZTCATEGORIAS.findOne({ CATID: catid }).lean();
  if (!doc) throw new Error('No se encontró la categoría');
  return doc;
}

async function AddOneZTCategoria(payload, user) {
  if (!payload) throw new Error('No se recibió payload');
  const required = ['CATID', 'Nombre', 'REGUSER'];
  const missing = required.filter(k => payload[k] === undefined || payload[k] === null || payload[k] === '');
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);

  const dup = await ZTCATEGORIAS.findOne({ CATID: payload.CATID }).lean();
  if (dup) throw new Error('Ya existe una categoría con ese CATID');

  const data = {
    CATID: payload.CATID,
    Nombre: payload.Nombre,
    PadreCATID: payload.PadreCATID ?? null,
    ACTIVED: payload.ACTIVED ?? true,
    DELETED: payload.DELETED ?? false,
    REGUSER: payload.REGUSER
    // REGDATE, HISTORY se manejan en el hook / saveWithAudit
  };

  const created = await saveWithAudit(ZTCATEGORIAS, {}, data, user, 'CREATE');
  return created;
}

async function UpdateOneZTCategoria(catid, cambios, user) {
  if (!catid) throw new Error('Falta parámetro catid');
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');

  const filter = { CATID: catid };
  const updated = await saveWithAudit(ZTCATEGORIAS, filter, cambios, user, 'UPDATE');
  return updated;
}

async function DeleteLogicZTCategoria(catid, user) {
  if (!catid) throw new Error('Falta parámetro catid');
  const filter = { CATID: catid };
  const data = { ACTIVED: false, DELETED: true };
  const res = await saveWithAudit(ZTCATEGORIAS, filter, data, user, 'UPDATE');
  return res;
}

async function DeleteHardZTCategoria(catid) {
  if (!catid) throw new Error('Falta parámetro catid');
  const eliminado = await ZTCATEGORIAS.findOneAndDelete({ CATID: catid });
  if (!eliminado) throw new Error('No se encontró la categoría para eliminar');
  return { mensaje: 'Categoría eliminada permanentemente', CATID: catid };
}

async function ActivateZTCategoria(catid, user) {
  if (!catid) throw new Error('Falta parámetro catid');
  const filter = { CATID: catid };
  const data = { ACTIVED: true, DELETED: false };
  const res = await saveWithAudit(ZTCATEGORIAS, filter, data, user, 'UPDATE');
  return res;
}

// ============================================
// MÉTODOS con BITÁCORA (patrón)
// ============================================
async function GetAllMethod(bitacora, req, params, paramString, body, dbServer) {
  let data = DATA();
  data.process = 'Obtener todas las categorías';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztcategorias/categoriasCRUD';
  data.queryString = paramString;

  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;
  bitacora.process = data.process;

  try {
    let docs;
    switch (dbServer) {
      case 'MongoDB': docs = await GetAllZTCategorias(); break;
      case 'HANA': throw new Error('HANA no implementado aún para GetAll');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = docs;
    data.messageUSR = 'Categorías obtenidas correctamente';
    data.messageDEV = 'GetAllZTCategorias ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener las categorías';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetOneMethod(bitacora, params, catid, dbServer) {
  let data = DATA();
  data.process = 'Obtener una categoría';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztcategorias/categoriasCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;
  bitacora.process = data.process;

  try {
    let doc;
    switch (dbServer) {
      case 'MongoDB': doc = await GetOneZTCategoria(catid); break;
      case 'HANA': throw new Error('HANA no implementado aún para GetOne');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = doc;
    data.messageUSR = 'Categoría obtenida correctamente';
    data.messageDEV = 'GetOneZTCategoria ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener la categoría';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function AddOneMethod(bitacora, params, body, req, dbServer) {
  let data = DATA();
  data.process = 'Agregar categoría';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztcategorias/categoriasCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;
  bitacora.process = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await AddOneZTCategoria(getPayload(req), params.LoggedUser); break;
      case 'HANA': throw new Error('HANA no implementado aún para AddOne');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Categoría creada correctamente';
    data.messageDEV = 'AddOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;

    if (req?.http?.res) {
      req.http.res.status(201);
      const id = (result && (result.CATID || result?.data?.CATID)) || '';
      if (id) {
        req.http.res.set('Location', `/api/ztcategorias/Categorias('${id}')`);
      }
    }
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al crear la categoría';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function UpdateOneMethod(bitacora, params, catid, req, user, dbServer) {
  let data = DATA();
  data.process = 'Actualizar categoría';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztcategorias/categoriasCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;
  bitacora.process = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await UpdateOneZTCategoria(catid, getPayload(req), user); break;
      case 'HANA': throw new Error('HANA no implementado aún para UpdateOne');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Categoría actualizada correctamente';
    data.messageDEV = 'UpdateOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al actualizar la categoría';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteLogicMethod(bitacora, params, catid, user, dbServer) {
  let data = DATA();
  data.process = 'Borrado lógico de categoría';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztcategorias/categoriasCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;
  bitacora.process = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await DeleteLogicZTCategoria(catid, user); break;
      case 'HANA': throw new Error('HANA no implementado aún para DeleteLogic');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Categoría borrada lógicamente';
    data.messageDEV = 'DeleteLogic ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    if (error.message.includes('No se encontró')) {
      data.messageUSR = 'No se encontró la categoría especificada para borrar.';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else {
      data.messageUSR = 'Error al borrar lógicamente la categoría';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteHardMethod(bitacora, params, catid, dbServer) {
  let data = DATA();
  data.process = 'Borrado permanente de categoría';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztcategorias/categoriasCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;
  bitacora.process = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await DeleteHardZTCategoria(catid); break;
      case 'HANA': throw new Error('HANA no implementado aún para DeleteHard');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Categoría borrada permanentemente';
    data.messageDEV = 'DeleteHard ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al borrar permanentemente la categoría';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function ActivateOneMethod(bitacora, params, catid, user, dbServer) {
  let data = DATA();
  data.process = 'Activar categoría';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztcategorias/categoriasCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;
  bitacora.process = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await ActivateZTCategoria(catid, user); break;
      case 'HANA': throw new Error('HANA no implementado aún para ActivateOne');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Categoría activada correctamente';
    data.messageDEV = 'Activate ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al activar la categoría';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

// ============================================
// ORQUESTADOR PRINCIPAL
// ============================================
async function ZTCategoriasCRUD(req) {
  let bitacora = BITACORA();
  let data = DATA();

  try {
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';

    // soportar catid en mayúsculas o minúsculas
    const catid = params.catid || params.CATID || undefined;
    const { ProcessType, LoggedUser, DBServer } = params;

    if (!ProcessType) {
      data.process = 'Validación de parámetros obligatorios';
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV = 'Valores válidos: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    if (!LoggedUser) {
      data.process = 'Validación de parámetros obligatorios';
      data.messageUSR = 'Falta parámetro obligatorio: LoggedUser';
      data.messageDEV = 'LoggedUser es requerido para trazabilidad del sistema';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }

    const dbServer = DBServer || 'MongoDB';
    bitacora.processType = ProcessType;
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = dbServer;
    bitacora.queryString = paramString;
    bitacora.method = req.req?.method || 'UNKNOWN';
    bitacora.api = '/api/ztcategorias/categoriasCRUD';
    bitacora.server = process.env.SERVER_NAME || 'No especificado';

    switch (ProcessType) {
      case 'GetAll':
        bitacora = await GetAllMethod(bitacora, req, params, paramString, body, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'GetOne':
        if (!catid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: CATID';
          data.messageDEV = 'CATID es requerido para GetOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetOneMethod(bitacora, params, catid, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'AddOne':
        bitacora = await AddOneMethod(bitacora, params, body, req, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'UpdateOne':
        if (!catid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: CATID';
          data.messageDEV = 'CATID es requerido para UpdateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await UpdateOneMethod(bitacora, params, catid, req, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'DeleteLogic':
        if (!catid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: CATID';
          data.messageDEV = 'CATID es requerido para DeleteLogic';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteLogicMethod(bitacora, params, catid, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'DeleteHard':
        if (!catid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: CATID';
          data.messageDEV = 'CATID es requerido para DeleteHard';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteHardMethod(bitacora, params, catid, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'ActivateOne':
        if (!catid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: CATID';
          data.messageDEV = 'CATID es requerido para ActivateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await ActivateOneMethod(bitacora, params, catid, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      default:
        data.process = 'Validación de ProcessType';
        data.messageUSR = 'ProcessType inválido o no especificado';
        data.messageDEV = 'Debe ser: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes = true;
        return FAIL(bitacora);
    }

    return OK(bitacora);
  } catch (error) {
    if (bitacora.finalRes) {
      let dataCatch = DATA();
      dataCatch.process = 'Catch principal ZTCategoriasCRUD';
      dataCatch.messageUSR = 'Ocurrió un error inesperado en el endpoint';
      dataCatch.messageDEV = error.message;
      dataCatch.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
      bitacora = AddMSG(bitacora, dataCatch, 'FAIL', 500, true);
      bitacora.finalRes = true;
    }
    req.error({
      code: 'Internal-Server-Error',
      status: bitacora.status || 500,
      message: bitacora.messageUSR,
      target: bitacora.messageDEV,
      numericSeverity: 1,
      innererror: bitacora
    });
    return FAIL(bitacora);
  }
}

// EXPORTS
module.exports = {
  ZTCategoriasCRUD,

  GetAllZTCategorias,
  GetOneZTCategoria,
  AddOneZTCategoria,
  UpdateOneZTCategoria,
  DeleteLogicZTCategoria,
  DeleteHardZTCategoria,
  ActivateZTCategoria
};
