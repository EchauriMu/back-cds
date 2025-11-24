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
// Obtener precios por IdListaOK
// ============================================
// Esta función obtiene SOLO los precios que pertenecen a una lista específica
// En lugar de hacer múltiples llamadas a la API, obtenemos todos los precios de una lista en UNA sola consulta
//
// Parámetro:
//   - idListaOK: El ID de la lista (ej: "LISTA-RETAIL-2025")
//
// Retorna:
//   - Array de objetos con todos los precios de esa lista
//   - Ejemplo: [{ IdPrecioOK: "P001", IdListaOK: "LISTA-RETAIL-2025", SKUID: "HOG001", Precio: 15000 }, ...]
//
// Cómo funciona:
//   1. Valida que idListaOK venga completo (no vacío)
//   2. Busca en MongoDB la colección ZTPrecios_ITEMS
//   3. Filtra por: IdListaOK coincida AND DELETED no sea true (soft delete)
//   4. .lean() retorna datos planos (más rápido que documentos Mongoose)
async function GetZTPreciosItemsByIdListaOK(idListaOK) {
  // ⚠️ VALIDACIÓN: Si no viene el parámetro, lanza error inmediatamente
  if (!idListaOK) throw new Error('Falta parámetro IdListaOK');
  
  // 🔍 CONSULTA MONGODB:
  // - ZTPrecios_ITEMS: colección donde se guardan todos los precios
  // - .find({ IdListaOK: idListaOK, DELETED: { $ne: true } }): 
  //     • Busca documentos donde IdListaOK coincida con el parámetro
  //     • Y excluye documentos marcados como DELETED=true
  // - .lean(): Retorna objetos JSON planos (optimización de velocidad)
  return await ZTPrecios_ITEMS.find({ IdListaOK: idListaOK, DELETED: { $ne: true } }).lean();
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
// Método HTTP para GetByIdListaOK
// ============================================
// Esta función es el "orquestador" que maneja la solicitud HTTP
// Se encarga de:
//   1. Registrar la solicitud en la bitácora (auditoría)
//   2. Validar que la base de datos sea soportada
//   3. Llamar a GetZTPreciosItemsByIdListaOK() para obtener datos
//   4. Formatear la respuesta con mensajes apropiados
//
// Parámetros:
//   - bitacora: Objeto que registra todas las operaciones (para auditoría)
//   - req: La solicitud HTTP original
//   - params: Parámetros de la query string (ProcessType, LoggedUser, etc.)
//   - idListaOK: El ID de la lista a consultar
//   - dbServer: La base de datos a usar ('MongoDB' o 'HANA')
//
// Retorna:
//   - bitacora: Objeto actualizado con resultado, datos, y mensajes
async function GetByIdListaOKMethod(bitacora, req, params, idListaOK, dbServer) {
  // 📋 Crear objeto DATA para almacenar información de esta operación
  let data = DATA();

  // 📝 REGISTRAR INFORMACIÓN DE LA SOLICITUD (para auditoría)
  data.process = 'Obtener precios por IdListaOK';           // ¿Qué estamos haciendo?
  data.processType = params.ProcessType || '';              // Tipo de proceso (GetByIdListaOK)
  data.loggedUser = params.LoggedUser || '';                // ¿Quién hace la solicitud?
  data.dbServer = dbServer;                                 // ¿Cuál BD? (MongoDB, HANA)
  data.server = process.env.SERVER_NAME || '';              // ¿En qué servidor?
  data.method = req.req?.method || 'No Especificado';      // ¿Qué método HTTP? (GET, POST, etc)
  data.api = '/api/ztprecios-items/preciosItemsCRUD';      // ¿Cuál endpoint?

  // 📋 Copiar información a la bitácora para trazabilidad
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Obtener precios por IdListaOK';

  // 🛡️ TRY-CATCH: Captura cualquier error sin detener la app
  try {
    let items;  // Variable donde guardaremos los resultados

    // 🔀 VALIDAR BASE DE DATOS
    switch (dbServer) {
      case 'MongoDB':
        // ✅ MongoDB está soportado, ejecutar consulta
        items = await GetZTPreciosItemsByIdListaOK(idListaOK);
        break;
      default:
        // ❌ Base de datos no reconocida
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    // ✅ ÉXITO: Preparar respuesta positiva
    data.dataRes = items;  // Guardar los precios obtenidos
    data.messageUSR = 'Precios obtenidos correctamente por Lista';  // Mensaje para usuario
    data.messageDEV = 'GetZTPreciosItemsByIdListaOK ejecutado sin errores';  // Mensaje para desarrollador
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);  // Agregar mensaje con código HTTP 200 (éxito)
    bitacora.success = true;  // Marcar como exitoso
    return bitacora;  // Retornar resultado

  } catch (error) {
    // ❌ ERROR: Preparar respuesta de error
    data.messageUSR = 'Error al obtener los precios por Lista';  // Mensaje para usuario
    data.messageDEV = error.message;  // Mensaje técnico del error
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);  // Agregar mensaje con código HTTP 500 (error interno)
    bitacora.success = false;  // Marcar como fallido
    return bitacora;  // Retornar error
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
    const params = req.req?.query || {};  // Extraer parámetros de la URL query string
    const body = req.req?.body;  // Extraer body de la solicitud (para POST)
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';  // Convertir params a string para logueo
    
    // ============================================
    // 🔹 DESTRUCTURING: Extraer parámetros específicos
    // ============================================
    // Esto extrae variables individuales del objeto params
    // Ejemplo de URL: /api/endpoint?ProcessType=GetByIdListaOK&idListaOK=LISTA-RETAIL&LoggedUser=admin
    // Resultado: { ProcessType: "GetByIdListaOK", LoggedUser: "admin", idListaOK: "LISTA-RETAIL", ... }
    const { 
      ProcessType,      // 📋 Tipo de operación (GetAll, GetOne, AddOne, etc.)
      LoggedUser,       // 👤 Usuario que hace la solicitud (para auditoría)
      DBServer,         // 🗄️ Base de datos (MongoDB, HANA, etc.)
      IdPrecioOK,       // 💰 ID del precio (usado en operaciones de un solo precio)
      idPresentaOK,     // 📦 ID de presentación (usado en GetByIdPresentaOK)
      idListaOK         // 📄 ID de lista - NUEVO: Usado en GetByIdListaOK para obtener TODOS los precios de esa lista
    } = params;

    if (!ProcessType) {
      data.process = 'Validación de parámetros obligatorios';
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV = 'Valores válidos: GetAll, GetOne, GetByIdPresentaOK, GetByIdListaOK, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
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

      // ============================================
      // CASE: GetByIdListaOK
      // ============================================
      // Este case maneja solicitudes para obtener precios de una lista específica
      // 
      // Flujo:
      //   1. Valida que el parámetro idListaOK no esté vacío
      //   2. Si está vacío → retorna error 400 (Bad Request)
      //   3. Si está completo → llama GetByIdListaOKMethod() para obtener datos
      //   4. Si la operación falló → retorna el error
      //   5. Si todo bien → continúa (break)
      case 'GetByIdListaOK':
        // ⚠️ VALIDACIÓN: Verificar que idListaOK vino en la solicitud
        if (!idListaOK) {
          data.process = 'Validación de parámetros';  // Tipo de validación
          data.messageUSR = 'Falta parámetro obligatorio: idListaOK';  // Mensaje usuario
          data.messageDEV = 'idListaOK es requerido para GetByIdListaOK';  // Mensaje técnico
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);  // Agregar mensaje de error (código 400)
          bitacora.finalRes = true;  // Marcar como respuesta final
          return FAIL(bitacora);  // Retornar error sin continuar
        }
        
        // ✅ El parámetro existe, llamar al método para obtener los precios
        bitacora = await GetByIdListaOKMethod(bitacora, req, params, idListaOK, dbServer);
        
        // ❌ Verificar si la operación fue exitosa
        if (!bitacora.success) { 
          bitacora.finalRes = true;  // Marcar como respuesta final
          return FAIL(bitacora);  // Retornar error si falló
        }
        break;  // ✅ Si todo bien, salir del case y continuar

      default:
        data.process = 'Validación de ProcessType';
        data.messageUSR = 'ProcessType inválido o no especificado';
        data.messageDEV = 'Debe ser: GetAll, GetOne, GetByIdPresentaOK, GetByIdListaOK, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
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
// EXPORTS: Funciones disponibles para importar
// ============================================
// Esto hace que las funciones estén disponibles para ser importadas desde otros archivos
// Ejemplo de uso en otro archivo:
//   const { GetZTPreciosItemsByIdListaOK } = require('./ztprecios_items-service');
//   const precios = await GetZTPreciosItemsByIdListaOK('LISTA-RETAIL-2025');
//
// Solo exponemos las funciones principales, las internas no se exportan
module.exports = {
  // 🎯 Función principal que orquesta todo
  ZTPreciosItemsCRUD,

  // 🔹 Funciones CRUD de base de datos (consultas MongoDB)
  GetAllZTPreciosItems,              // Obtener todos los precios
  GetOneZTPreciosItem,               // Obtener un precio específico
  AddOneZTPreciosItem,               // Crear un nuevo precio
  UpdateOneZTPreciosItem,            // Actualizar un precio existente
  DeleteLogicZTPreciosItem,          // Borrado lógico (marcar como eliminado)
  DeleteHardZTPreciosItem,           // Borrado físico (eliminar permanentemente)
  ActivateOneZTPreciosItem,          // Activar un precio inactivo
  
  // 🔹 Funciones para obtener por relaciones
  GetZTPreciosItemsByIdPresentaOK,   // Obtener precios por ID de presentación (ya existía)
  GetZTPreciosItemsByIdListaOK       // ⭐ NUEVA: Obtener precios por ID de lista
  };