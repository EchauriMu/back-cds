// ============================================
// IMPORTS
// ============================================
const ZTPreciosListas = require('../models/mongodb/ztprecios_listas');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// FUNCIONES DE BASE DE DATOS
// ============================================
async function GetAllZTPreciosListasMongo() {
  return await ZTPreciosListas.find({
    $or: [
      { ACTIVED: true, DELETED: false },  // activos
      { ACTIVED: false, DELETED: true }   // eliminados lógicamente
    ]
  }).lean();
}


async function GetOneZTPreciosListaMongo(IDLISTAOK) {
  if (!IDLISTAOK) throw new Error('Falta parámetro IDLISTAOK');
  const item = await ZTPreciosListas.findOne({ IDLISTAOK, ACTIVED: true, DELETED: false }).lean();
  if (!item) throw new Error('No se encontró la lista');
  return item;
}

async function CreateZTPreciosListaMongo(data, user) {
  const filter = { IDLISTAOK: data.IDLISTAOK };
  const dataToSave = { ...data };

  // Asegurarse de que SKUSIDS sea un arreglo, incluso si viene como string JSON
  if (dataToSave.SKUSIDS && typeof dataToSave.SKUSIDS === 'string') {
    try {
      dataToSave.SKUSIDS = JSON.parse(dataToSave.SKUSIDS);
    } catch (e) {
      throw new Error('El campo SKUSIDS no es un arreglo JSON válido.');
    }
  }
  return await saveWithAudit(ZTPreciosListas, filter, dataToSave, user, 'CREATE');
}

async function UpdateZTPreciosListaMongo(IDLISTAOK, data, user) {
  const filter = { IDLISTAOK };
  return await saveWithAudit(ZTPreciosListas, filter, data, user, 'UPDATE');
}

async function DeleteLogicZTPreciosListaMongo(IDLISTAOK, user) {
  const filter = { IDLISTAOK };
  const data = { ACTIVED: false, DELETED: true };
  return await saveWithAudit(ZTPreciosListas, filter, data, user, 'UPDATE');
}

async function DeleteHardZTPreciosListaMongo(IDLISTAOK) {
  const deleted = await ZTPreciosListas.findOneAndDelete({ IDLISTAOK });
  if (!deleted) throw new Error('No se encontró la lista para eliminar permanentemente');
  return { message: 'Lista eliminada permanentemente', IDLISTAOK };
}

async function ActivateZTPreciosListaMongo(IDLISTAOK, user) {
  const filter = { IDLISTAOK };
  const data = { ACTIVED: true, DELETED: false };
  return await saveWithAudit(ZTPreciosListas, filter, data, user, 'UPDATE');
}

async function GetZTPreciosListasBySKUIDMongo(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  return await ZTPreciosListas.find({ SKUSIDS: skuid, DELETED: { $ne: true } }).lean();
}

// ============================================
// MÉTODOS LOCALES CON BITÁCORA
// ============================================

async function GetAllMethod(bitacora, params, paramString, body, dbServer) {
  let data = DATA();

  // configurar contexto de data
  data.process        = 'Obtener todas las listas de precios';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';
  data.queryString    = paramString;

  // propagar en bitácora
  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Obtener todas las listas de precios';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await GetAllZTPreciosListasMongo();
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes   = result;
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

  data.process        = 'Obtener una lista de precios';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';

  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Obtener una lista de precios';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await GetOneZTPreciosListaMongo(IDLISTAOK);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Lista de precios obtenida correctamente';
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

  data.process        = 'Agregar una nueva lista de precios';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';

  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Agregar una nueva lista de precios';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await CreateZTPreciosListaMongo(body, params.LoggedUser);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Lista de precios creada correctamente';
    data.messageDEV = 'CreateZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true); // POST -> 201 Created
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

  data.process        = 'Actualizar lista de precios';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';

  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Actualizar lista de precios';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await UpdateZTPreciosListaMongo(IDLISTAOK, req.req.body, user);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
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

  data.process        = 'Borrado lógico de lista de precios';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';

  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Borrado lógico de lista de precios';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteLogicZTPreciosListaMongo(IDLISTAOK, params.LoggedUser);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Lista de precios marcada como eliminada logicamente';
    data.messageDEV = 'DeleteLogicZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    if (error.message.includes('No se encontró')) {
      data.messageUSR = 'No se encontró la lista para eliminar';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else {
      data.messageUSR = 'Error al borrar logicamente la lista de precios';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteHardMethod(bitacora, params, IDLISTAOK, dbServer) {
  let data = DATA();

  data.process        = 'Borrado permanente de lista de precios';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';

  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Borrado permanente de lista de precios';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteHardZTPreciosListaMongo(IDLISTAOK);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Lista de precios eliminada permanentemente';
    data.messageDEV = 'DeleteHardZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al eliminar permanentemente la lista de precios';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function ActivateOneMethod(bitacora, params, IDLISTAOK, user, dbServer) {
  let data = DATA();

  data.process        = 'Reactivar lista de precios';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';

  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Reactivar lista de precios';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await ActivateZTPreciosListaMongo(IDLISTAOK, params.LoggedUser);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Lista de precios activada correctamente';
    data.messageDEV = 'ActivateZTPreciosListaMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al activar la lista de precios';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetBySKUIDMethod(bitacora, params, skuid, dbServer) {
  let data = DATA();

  // configurar contexto de data
  data.process        = 'Obtener listas de precios por SKUID';
  data.processType    = params.ProcessType || '';
  data.loggedUser     = params.LoggedUser || '';
  data.dbServer       = dbServer;
  data.server         = process.env.SERVER_NAME || '';
  data.api            = '/api/ztprecios‑listas/preciosListasCRUD';

  // propagar en bitácora
  bitacora.processType  = params.ProcessType || '';
  bitacora.loggedUser   = params.LoggedUser || '';
  bitacora.dbServer     = dbServer;
  bitacora.server       = process.env.SERVER_NAME || '';
  bitacora.process      = 'Obtener listas de precios por SKUID';

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await GetZTPreciosListasBySKUIDMongo(skuid);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes   = result;
    data.messageUSR = 'Listas obtenidas correctamente por SKUID';
    data.messageDEV = 'GetZTPreciosListasBySKUIDMongo ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener las listas por SKUID';
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
  let data     = DATA();

  try {
    const params     = req.req?.query || {};
    const body       = req.req?.body;
    const paramString= params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer, IDLISTAOK, skuid } = params;

    // validación de parámetros obligatorios: ProcessType y LoggedUser
    if (!ProcessType) {
      data.process     = 'Validación de parámetros obligatorios';
      data.messageUSR  = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV  = 'ProcessType es requerido para ejecutar la API';
      bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes= true;
      return FAIL(bitacora);
    }

    if (!LoggedUser) {
      data.process     = 'Validación de parámetros obligatorios';
      data.messageUSR  = 'Falta parámetro obligatorio: LoggedUser';
      data.messageDEV  = 'LoggedUser es requerido para trazabilidad del sistema';
      bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes= true;
      return FAIL(bitacora);
    }

    const dbServer = DBServer || 'MongoDB'; // default
    bitacora.processType  = ProcessType;
    bitacora.loggedUser   = LoggedUser;
    bitacora.dbServer     = dbServer;
    bitacora.queryString  = paramString;
    bitacora.method       = req.req?.method || 'UNKNOWN';
    bitacora.api          = '/api/ztprecios‑listas/preciosListasCRUD';
    bitacora.server       = process.env.SERVER_NAME || 'No especificado';

    switch (ProcessType) {
      case 'GetAll':
        bitacora = await GetAllMethod(bitacora, params, paramString, body, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'GetOne':
        if (!IDLISTAOK) {
          data.process     = 'Validación de parámetro IDLISTAOK';
          data.messageUSR  = 'Falta IDLISTAOK';
          data.messageDEV  = 'Parámetro IDLISTAOK requerido';
          bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes= true;
          return FAIL(bitacora);
        }
        bitacora = await GetOneMethod(bitacora, params, IDLISTAOK, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'AddOne':
        bitacora = await AddOneMethod(bitacora, params, body, req, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'UpdateOne':
        if (!IDLISTAOK) {
          data.process     = 'Validación de parámetro IDLISTAOK';
          data.messageUSR  = 'Falta IDLISTAOK';
          data.messageDEV  = 'Parámetro IDLISTAOK requerido';
          bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes= true;
          return FAIL(bitacora);
        }
        bitacora = await UpdateOneMethod(bitacora, params, IDLISTAOK, req, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'DeleteLogic':
        if (!IDLISTAOK) {
          data.process     = 'Validación de parámetro IDLISTAOK';
          data.messageUSR  = 'Falta IDLISTAOK';
          data.messageDEV  = 'Parámetro IDLISTAOK requerido';
          bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes= true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteLogicMethod(bitacora, params, IDLISTAOK, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'DeleteHard':
        if (!IDLISTAOK) {
          data.process     = 'Validación de parámetro IDLISTAOK';
          data.messageUSR  = 'Falta IDLISTAOK';
          data.messageDEV  = 'Parámetro IDLISTAOK requerido';
          bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes= true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteHardMethod(bitacora, params, IDLISTAOK, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'ActivateOne':
        if (!IDLISTAOK) {
          data.process     = 'Validación de parámetro IDLISTAOK';
          data.messageUSR  = 'Falta IDLISTAOK';
          data.messageDEV  = 'Parámetro IDLISTAOK requerido';
          bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes= true;
          return FAIL(bitacora);
        }
        bitacora = await ActivateOneMethod(bitacora, params, IDLISTAOK, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      case 'GetBySKUID':
        if (!skuid) {
          data.process     = 'Validación de parámetro skuid';
          data.messageUSR  = 'Falta skuid';
          data.messageDEV  = 'Parámetro skuid requerido';
          bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes= true;
          return FAIL(bitacora);
        }
        bitacora = await GetBySKUIDMethod(bitacora, params, skuid, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;

      default:
        data.process     = 'Validación de ProcessType';
        data.messageUSR  = 'ProcessType inválido o no especificado';
        data.messageDEV  = `Valor inválido: ${ProcessType}`;
        bitacora         = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes= true;
        return FAIL(bitacora);
    }

    return OK(bitacora);

  } catch (error) {
    data.process        = 'Catch principal ZTPreciosListasCRUD';
    data.messageUSR     = 'Ocurrió un error inesperado en el endpoint';
    data.messageDEV     = error.message;
    data.stack          = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    bitacora            = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.finalRes   = true;
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





