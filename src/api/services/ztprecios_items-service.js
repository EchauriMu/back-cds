// ============================================
// IMPORTS
// ============================================
const { ZTPrecios_ITEMS } = require('../models/mongodb/ztprecios_items');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// Util: payload desde CDS/Express
function getPayload(req) {
  return req.data || req.req?.body || null;
}

// ============================================
// CRUD MONGO (con auditoría donde aplica)
// ============================================
async function GetAllZTPreciosItems() {
  return await ZTPrecios_ITEMS.find({ DELETED: { $ne: true } }).lean();
}

async function GetOneZTPreciosItem(IdPrecioOK) {
  if (!IdPrecioOK) throw new Error('Falta parámetro IdPrecioOK');
  const doc = await ZTPrecios_ITEMS.findOne({ IdPrecioOK }).lean();
  if (!doc) throw new Error('No se encontró el precio');
  return doc;
}

async function AddOneZTPreciosItem(payload, user) {
  if (!payload) throw new Error('No se recibió payload');

  const required = ['IdPrecioOK', 'IdListaOK', 'SKUID', 'IdPresentaOK', 'Precio'];
  const missing = required.filter(k => payload[k] === undefined || payload[k] === null || payload[k] === '');
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);

  const dup = await ZTPrecios_ITEMS.findOne({ IdPrecioOK: payload.IdPrecioOK }).lean();
  if (dup) throw new Error('Ya existe un precio con ese IdPrecioOK');

  const data = {
    IdPrecioOK: payload.IdPrecioOK,
    IdListaOK: payload.IdListaOK,
    SKUID: payload.SKUID,
    IdPresentaOK: payload.IdPresentaOK,
    IdTipoFormulaOK: payload.IdTipoFormulaOK ?? null,
    Formula: payload.Formula ?? "",
    CostoIni: payload.CostoIni ?? 0,
    CostoFin: payload.CostoFin ?? 0,
    Precio: payload.Precio,
    ACTIVED: payload.ACTIVED ?? true,
    DELETED: payload.DELETED ?? false,
    // REGUSER/REGDATE se setean en saveWithAudit CREATE
  };

  const created = await saveWithAudit(ZTPrecios_ITEMS, {}, data, user, 'CREATE');
  return created;
}

async function UpdateOneZTPreciosItem(IdPrecioOK, cambios, user) {
  if (!IdPrecioOK) throw new Error('Falta parámetro IdPrecioOK');
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');

  const filter = { IdPrecioOK };
  const updated = await saveWithAudit(ZTPrecios_ITEMS, filter, cambios, user, 'UPDATE');
  return updated;
}

async function DeleteLogicZTPreciosItem(IdPrecioOK, user) {
  if (!IdPrecioOK) throw new Error('Falta parámetro IdPrecioOK');
  const filter = { IdPrecioOK };
  const data = { ACTIVED: false, DELETED: true };
  const res = await saveWithAudit(ZTPrecios_ITEMS, filter, data, user, 'UPDATE');
  return res;
}

async function DeleteHardZTPreciosItem(IdPrecioOK) {
  if (!IdPrecioOK) throw new Error('Falta parámetro IdPrecioOK');
  const eliminado = await ZTPrecios_ITEMS.findOneAndDelete({ IdPrecioOK });
  if (!eliminado) throw new Error('No se encontró el precio para eliminar');
  return { mensaje: 'Precio eliminado permanentemente', IdPrecioOK };
}

async function ActivateOneZTPreciosItem(IdPrecioOK, user) {
  if (!IdPrecioOK) throw new Error('Falta parámetro IdPrecioOK');
  const filter = { IdPrecioOK };
  const data = { ACTIVED: true, DELETED: false };
  const res = await saveWithAudit(ZTPrecios_ITEMS, filter, data, user, 'UPDATE');
  return res;
}

async function GetZTPreciosItemsByIdPresentaOK(idPresentaOK) {
  if (!idPresentaOK) throw new Error('Falta parámetro IdPresentaOK');
  return await ZTPrecios_ITEMS.find({ IdPresentaOK: idPresentaOK, DELETED: { $ne: true } }).lean();
}

// ============================================
// MÉTODOS con BITÁCORA (estilo amigo)
// ============================================
async function GetAllMethod(bitacora, req, params, paramString, body, dbServer) {
  let data = DATA();
  data.process = 'Obtener todos los precios';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.method       = req.req?.method || 'No Especificado';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';
  data.queryString = paramString;

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let docs;
    switch (dbServer) {
      case 'MongoDB': docs = await GetAllZTPreciosItems(); break;
      case 'HANA': throw new Error('HANA no implementado aún para GetAll');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = docs;
    data.messageUSR = 'Precios obtenidos correctamente';
    data.messageDEV = 'GetAllZTPreciosItems ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener los precios';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetOneMethod(bitacora, params, IdPrecioOK, dbServer) {
  let data = DATA();
  data.process = 'Obtener un precio';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let doc;
    switch (dbServer) {
      case 'MongoDB': doc = await GetOneZTPreciosItem(IdPrecioOK); break;
      case 'HANA': throw new Error('HANA no implementado aún para GetOne');
      default: throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = doc;
    data.messageUSR = 'Precio obtenido correctamente';
    data.messageDEV = 'GetOneZTPreciosItem ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener el precio';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function AddOneMethod(bitacora, params, body, req, dbServer) {
  let data = DATA();
  data.process = 'Agregar precio';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await AddOneZTPreciosItem(getPayload(req), params.LoggedUser); break;
      case 'HANA': throw new Error('HANA no implementado aún para AddOne');
      default: throw new Error('DBServer no soportado: ${dbServer}');
    }

    data.dataRes = result;
    data.messageUSR = 'Precio creado correctamente';
    data.messageDEV = 'AddOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;

    if (req?.http?.res) {
      req.http.res.status(201);
      const id = (result && (result.IdPrecioOK || result?.data?.IdPrecioOK)) || '';
      if (id) {
        // Ajusta el entity set si tu ruta difiere (por defecto 'Presentaciones')
        req.http.res.set('Location', `/api/ztprecios-items/Precios('${id}')`);
      }
    }
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al crear el precio';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function UpdateOneMethod(bitacora, params, IdPrecioOK, req, user, dbServer) {
  let data = DATA();
  data.process = 'Actualizar precio';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await UpdateOneZTPreciosItem(IdPrecioOK, getPayload(req), user); break;
      case 'HANA': throw new Error('HANA no implementado aún para UpdateOne');
      default: throw new Error('DBServer no soportado: ${dbServer}');
    }

    data.dataRes = result;
    data.messageUSR = 'Precio actualizado correctamente';
    data.messageDEV = 'UpdateOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al actualizar el precio';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteLogicMethod(bitacora, params, IdPrecioOK, user, dbServer) {
  let data = DATA();
  data.process = 'Borrado lógico de precio';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await DeleteLogicZTPreciosItem(IdPrecioOK, user); break;
      case 'HANA': throw new Error('HANA no implementado aún para DeleteLogic');
      default: throw new Error('DBServer no soportado: ${dbServer}');
    }

    data.dataRes = result;
    data.messageUSR = 'Precio borrado lógicamente';
    data.messageDEV = 'DeleteLogic ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    if (error.message.includes('No se encontró')) {
      data.messageUSR = 'No se encontró el precio especificado para borrar.';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else {
      data.messageUSR = 'Error al borrar lógicamente el precio';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteHardMethod(bitacora, params, IdPrecioOK, dbServer) {
  let data = DATA();
  data.process = 'Borrado permanente de precio';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await DeleteHardZTPreciosItem(IdPrecioOK); break;
      case 'HANA': throw new Error('HANA no implementado aún para DeleteHard');
      default: throw new Error('DBServer no soportado: ${dbServer}');
    }

    data.dataRes = result;
    data.messageUSR = 'Precio borrado permanentemente';
    data.messageDEV = 'DeleteHard ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al borrar permanentemente el precio';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function ActivateOneMethod(bitacora, params, IdPrecioOK, user, dbServer) {
  let data = DATA();
  data.process = 'Activar precio';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB': result = await ActivateOneZTPreciosItem(IdPrecioOK, user); break;
      case 'HANA': throw new Error('HANA no implementado aún para ActivateOne');
      default: throw new Error('DBServer no soportado: ${dbServer}');
    }

    data.dataRes = result;
    data.messageUSR = 'Precio activado correctamente';
    data.messageDEV = 'Activate ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al activar el precio';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetByIdPresentaOKMethod(bitacora, req, params, idPresentaOK, dbServer) {
  let data = DATA();

  data.process = 'Obtener precios por IdPresentaOK';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztprecios-items/preciosItemsCRUD';

  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Obtener precios por IdPresentaOK';

  try {
    let items;
    switch (dbServer) {
      case 'MongoDB':
        items = await GetZTPreciosItemsByIdPresentaOK(idPresentaOK);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = items;
    data.messageUSR = 'Precios obtenidos correctamente por Presentación';
    data.messageDEV = 'GetZTPreciosItemsByIdPresentaOK ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener los precios por Presentación';
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
async function ZTPreciosItemsCRUD(req) {
  let bitacora = BITACORA();
  let data = DATA();

  try {
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer, IdPrecioOK, idPresentaOK } = params;

    if (!ProcessType) {
      data.process = 'Validación de parámetros obligatorios';
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV = 'Valores válidos: GetAll, GetOne, GetByIdPresentaOK, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
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
    bitacora.loggedUser  = LoggedUser;
    bitacora.dbServer    = dbServer;
    bitacora.queryString = paramString;
    bitacora.method      = req.req?.method || 'UNKNOWN';
    bitacora.api         = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';
    bitacora.server      = process.env.SERVER_NAME || 'No especificado'; // eslint-disable-line

    switch (ProcessType) {
      case 'GetAll':
        bitacora = await GetAllMethod(bitacora, req, params, paramString, body, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'GetOne':
        if (!IdPrecioOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPrecioOK';
          data.messageDEV = 'IdPrecioOK es requerido para GetOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetOneMethod(bitacora, params, IdPrecioOK, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'AddOne':
        bitacora = await AddOneMethod(bitacora, params, body, req, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'UpdateOne':
        if (!IdPrecioOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPrecioOK';
          data.messageDEV = 'IdPrecioOK es requerido para UpdateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await UpdateOneMethod(bitacora, params, IdPrecioOK, req, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'DeleteLogic':
        if (!IdPrecioOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPrecioOK';
          data.messageDEV = 'IdPrecioOK es requerido para DeleteLogic';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteLogicMethod(bitacora, params, IdPrecioOK, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'DeleteHard':
        if (!IdPrecioOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPrecioOK';
          data.messageDEV = 'IdPrecioOK es requerido para DeleteHard';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteHardMethod(bitacora, params, IdPrecioOK, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'ActivateOne':
        if (!IdPrecioOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPrecioOK';
          data.messageDEV = 'IdPrecioOK es requerido para ActivateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await ActivateOneMethod(bitacora, params, IdPrecioOK, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'GetByIdPresentaOK':
        if (!idPresentaOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: idPresentaOK';
          data.messageDEV = 'idPresentaOK es requerido para GetByIdPresentaOK';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetByIdPresentaOKMethod(bitacora, req, params, idPresentaOK, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      default:
        data.process = 'Validación de ProcessType';
        data.messageUSR = 'ProcessType inválido o no especificado';
        data.messageDEV = 'Debe ser: GetAll, GetOne, GetByIdPresentaOK, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes = true;
        return FAIL(bitacora);
    }

    return OK(bitacora);

  } catch (error) {
    if (bitacora.finalRes) {
    let data = DATA();
    data.process = 'Catch principal ZTPreciosItemsCRUD';
    data.messageUSR = 'Ocurrió un error inesperado en el endpoint';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
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

// ============================================
// EXPORTS
// ============================================
module.exports = {
  ZTPreciosItemsCRUD,

  GetAllZTPreciosItems,
  GetOneZTPreciosItem,
  AddOneZTPreciosItem,
  UpdateOneZTPreciosItem,
  DeleteLogicZTPreciosItem,
  DeleteHardZTPreciosItem,
  ActivateOneZTPreciosItem,
  GetZTPreciosItemsByIdPresentaOK
  };