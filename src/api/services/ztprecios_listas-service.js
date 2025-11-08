// ============================================
// IMPORTS
// ============================================
const ZTPreciosListas = require('../models/mongodb/ztprecios_listas');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// FUNCIONES DE BASE DE DATOS
// ============================================

// ✅ Traer TODAS las listas (activas e inactivas), excepto eliminadas reales
async function GetAllZTPreciosListasMongo() {
  return await ZTPreciosListas.find({ DELETED: { $ne: true } }).lean();
}

// ✅ Obtener una lista específica (sin importar si está activa o no)
async function GetOneZTPreciosListaMongo(IDLISTAOK) {
  if (!IDLISTAOK) throw new Error('Falta parámetro IDLISTAOK');
  const item = await ZTPreciosListas.findOne({ IDLISTAOK, DELETED: { $ne: true } }).lean();
  if (!item) throw new Error('No se encontró la lista');
  return item;
}

// ✅ Crear una nueva lista
async function CreateZTPreciosListaMongo(data, user) {
  const filter = { IDLISTAOK: data.IDLISTAOK };
  const dataToSave = { ...data };

  // Asegurar que SKUSIDS sea arreglo JSON válido
  if (dataToSave.SKUSIDS && typeof dataToSave.SKUSIDS === 'string') {
    try {
      dataToSave.SKUSIDS = JSON.parse(dataToSave.SKUSIDS);
    } catch (e) {
      throw new Error('El campo SKUSIDS no es un arreglo JSON válido.');
    }
  }
  return await saveWithAudit(ZTPreciosListas, filter, dataToSave, user, 'CREATE');
}

// ✅ Actualizar lista existente
async function UpdateZTPreciosListaMongo(IDLISTAOK, data, user) {
  const filter = { IDLISTAOK };
  return await saveWithAudit(ZTPreciosListas, filter, data, user, 'UPDATE');
}

// ✅ Desactivar sin eliminar (igual que Categorías)
async function DeleteLogicZTPreciosListaMongo(IDLISTAOK, user) {
  const filter = { IDLISTAOK };
  const data = { ACTIVED: false }; // ⚡️ Solo inactiva, no elimina
  return await saveWithAudit(ZTPreciosListas, filter, data, user, 'UPDATE');
}

// ✅ Eliminar definitivamente
async function DeleteHardZTPreciosListaMongo(IDLISTAOK) {
  const deleted = await ZTPreciosListas.findOneAndDelete({ IDLISTAOK });
  if (!deleted) throw new Error('No se encontró la lista para eliminar permanentemente');
  return { message: 'Lista eliminada permanentemente', IDLISTAOK };
}

// ✅ Reactivar una lista
async function ActivateZTPreciosListaMongo(IDLISTAOK, user) {
  const filter = { IDLISTAOK };
  const data = { ACTIVED: true, DELETED: false };
  return await saveWithAudit(ZTPreciosListas, filter, data, user, 'UPDATE');
}

// ✅ Buscar por SKUID
async function GetZTPreciosListasBySKUIDMongo(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  return await ZTPreciosListas.find({ SKUSIDS: skuid, DELETED: { $ne: true } }).lean();
}

// ============================================
// MÉTODOS LOCALES CON BITÁCORA
// ============================================

async function GetAllMethod(bitacora, params, paramString, body, dbServer) {
  let data = DATA();
  data.process = 'Obtener todas las listas de precios';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-listas/preciosListasCRUD';
  data.queryString = paramString;

  bitacora.process = data.process;
  bitacora.processType = data.processType;
  bitacora.loggedUser = data.loggedUser;
  bitacora.dbServer = dbServer;
  bitacora.server = data.server;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await GetAllZTPreciosListasMongo();
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Listas obtenidas correctamente';
    data.messageDEV = 'GetAllZTPreciosListasMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener las listas de precios';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetOneMethod(bitacora, params, IDLISTAOK, dbServer) {
  let data = DATA();
  data.process = 'Obtener una lista de precios';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-listas/preciosListasCRUD';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await GetOneZTPreciosListaMongo(IDLISTAOK);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Lista obtenida correctamente';
    data.messageDEV = 'GetOneZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener la lista de precios';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function AddOneMethod(bitacora, params, body, req, dbServer) {
  let data = DATA();
  data.process = 'Agregar una nueva lista de precios';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-listas/preciosListasCRUD';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await CreateZTPreciosListaMongo(body, params.LoggedUser);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Lista de precios creada correctamente';
    data.messageDEV = 'CreateZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al crear la lista de precios';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function UpdateOneMethod(bitacora, params, IDLISTAOK, req, user, dbServer) {
  let data = DATA();
  data.process = 'Actualizar lista de precios';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-listas/preciosListasCRUD';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await UpdateZTPreciosListaMongo(IDLISTAOK, req.req.body, user);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Lista de precios actualizada correctamente';
    data.messageDEV = 'UpdateZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al actualizar la lista de precios';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteLogicMethod(bitacora, params, IDLISTAOK, user, dbServer) {
  let data = DATA();
  data.process = 'Desactivar lista de precios (borrado lógico)';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.api = '/api/ztprecios-listas/preciosListasCRUD';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteLogicZTPreciosListaMongo(IDLISTAOK, params.LoggedUser);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = result;
    data.messageUSR = 'Lista de precios desactivada correctamente';
    data.messageDEV = 'DeleteLogicZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al desactivar la lista de precios';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

// ============================================
// FUNCIÓN PRINCIPAL CRUD
// ============================================
async function ZTPreciosListasCRUD(req) {
  let bitacora = BITACORA();
  let data = DATA();

  try {
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer, IDLISTAOK, skuid } = params;

    const dbServer = DBServer || 'MongoDB';
    switch (ProcessType) {
      case 'GetAll':
        return OK(await GetAllMethod(bitacora, params, paramString, body, dbServer));
      case 'GetOne':
        return OK(await GetOneMethod(bitacora, params, IDLISTAOK, dbServer));
      case 'AddOne':
        return OK(await AddOneMethod(bitacora, params, body, req, dbServer));
      case 'UpdateOne':
        return OK(await UpdateOneMethod(bitacora, params, IDLISTAOK, req, LoggedUser, dbServer));
      case 'DeleteLogic':
        return OK(await DeleteLogicMethod(bitacora, params, IDLISTAOK, LoggedUser, dbServer));
      case 'DeleteHard':
        return OK(await DeleteHardZTPreciosListaMongo(IDLISTAOK));
      case 'ActivateOne':
        return OK(await ActivateZTPreciosListaMongo(IDLISTAOK, LoggedUser));
      case 'GetBySKUID':
        return OK(await GetZTPreciosListasBySKUIDMongo(skuid));
      default:
        throw new Error(`ProcessType inválido: ${ProcessType}`);
    }
  } catch (error) {
    data.process = 'Catch principal ZTPreciosListasCRUD';
    data.messageUSR = 'Error inesperado en el servicio';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return FAIL(bitacora);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  ZTPreciosListasCRUD,
  GetAllZTPreciosListasMongo,
  GetOneZTPreciosListaMongo,
  CreateZTPreciosListaMongo,
  UpdateZTPreciosListaMongo,
  DeleteLogicZTPreciosListaMongo,
  DeleteHardZTPreciosListaMongo,
  ActivateZTPreciosListaMongo,
  GetZTPreciosListasBySKUIDMongo
};
