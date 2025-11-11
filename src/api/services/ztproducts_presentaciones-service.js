// ============================================
// IMPORTS
// ============================================
const { ZTProducts_Presentaciones } = require('../models/mongodb/ztproducts_presentaciones');
const { ZTProduct_FILES } = require('../models/mongodb/ztproducts_files');
const { handleUploadZTProductFileCDS } = require('../../helpers/azureUpload.helper');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
// ============================================
function getPayload(req) {
  // Si la acción no tiene parámetros definidos, CAP pone todo el body en req.data
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

  const { files, ...presentationPayload } = payload;

  const required = ['IdPresentaOK', 'SKUID', 'NOMBREPRESENTACION', 'Descripcion'];
  const missing = required.filter((k) => !presentationPayload[k]);
  if (missing.length) throw new Error(`Faltan campos obligatorios en la presentación: ${missing.join(', ')}`);

  const exists = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: presentationPayload.IdPresentaOK }).lean();
  if (exists) throw new Error(`Ya existe una presentación con el IdPresentaOK: ${presentationPayload.IdPresentaOK}`);

  let createdPresentation;
  const createdFilesInfo = [];

  try {
    // 1. CREAR LA PRESENTACIÓN
    let propiedades = {};
    if (typeof presentationPayload.PropiedadesExtras === 'string' && presentationPayload.PropiedadesExtras.trim() !== '') {
      try {
        propiedades = JSON.parse(presentationPayload.PropiedadesExtras);
      } catch (jsonError) {
        throw new Error(`El formato de PropiedadesExtras no es un JSON válido.`);
      }
    }

    const presentationData = {
      IdPresentaOK: presentationPayload.IdPresentaOK,
      SKUID: presentationPayload.SKUID,
      NOMBREPRESENTACION: presentationPayload.NOMBREPRESENTACION,
      Descripcion: presentationPayload.Descripcion,
      PropiedadesExtras: propiedades,
      ACTIVED: presentationPayload.ACTIVED ?? true,
      DELETED: presentationPayload.DELETED ?? false,
    };

    createdPresentation = await saveWithAudit(ZTProducts_Presentaciones, {}, presentationData, user, 'CREATE');

    // 2. SUBIR ARCHIVOS (SI EXISTEN)
    if (files && files.length > 0) {
      for (const file of files) {
        const { fileBase64, originalname, mimetype, ...restOfFile } = file;

        if (!fileBase64 || !originalname || !mimetype) {
          throw new Error('Cada archivo debe tener fileBase64, originalname y mimetype.');
        }

        const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
        const fileBuffer = Buffer.from(cleanBase64, 'base64');
        const fileForHelper = {
          buffer: fileBuffer,
          originalname,
          mimetype,
        };

        const bodyForHelper = {
          SKUID: createdPresentation.SKUID,
          IdPresentaOK: createdPresentation.IdPresentaOK,
          ...restOfFile,
        };

        const uploadResult = await handleUploadZTProductFileCDS(fileForHelper, bodyForHelper, user);

        if (uploadResult.error || uploadResult.status >= 400) {
          throw new Error(uploadResult.message || uploadResult.data?.error || 'Error al subir archivo a Azure.');
        }
        createdFilesInfo.push(uploadResult.data);
      }
    }

    // 3. RESPUESTA EXITOSA
    return {
      presentation: createdPresentation,
      files: createdFilesInfo,
    };

  } catch (error) {
    // -- INICIO DE ROLLBACK --
    // Si algo falla, eliminamos todo lo que se creó en esta operación.
    if (createdPresentation) {
      await ZTProducts_Presentaciones.deleteOne({ _id: createdPresentation._id });
    }
    if (createdFilesInfo.length > 0) {
      const fileIdsToDelete = createdFilesInfo.map(f => f.file.FILEID);
      await ZTProduct_FILES.deleteMany({ FILEID: { $in: fileIdsToDelete } });
      // TODO: En un futuro, se podría añadir la lógica para borrar los archivos de Azure.
    }
    // -- FIN DE ROLLBACK --

    // Re-lanzar el error para que sea capturado por el método que lo llamó (AddOneMethod)
    throw new Error(`Error en AddOneZTProductsPresentacion: ${error.message}`);
  }
}

async function UpdateOneZTProductsPresentacion(idpresentaok, cambios, user) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');

  // Parsear PropiedadesExtras si viene como string, igual que en AddOne
  if (typeof cambios.PropiedadesExtras === 'string' && cambios.PropiedadesExtras.trim() !== '') {
    try {
      cambios.PropiedadesExtras = JSON.parse(cambios.PropiedadesExtras);
    } catch (jsonError) {
      throw new Error(`El formato de PropiedadesExtras no es un JSON válido.`);
    }
  } else if (cambios.PropiedadesExtras === '') {
    // Si se envía un string vacío, lo interpretamos como un objeto vacío.
    cambios.PropiedadesExtras = {};
  }

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
// CRUD: GET PRESENTACIONES BY SKUID
// ============================================
async function GetZTProductsPresentacionesBySKUID(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  return await ZTProducts_Presentaciones.find({ SKUID: skuid, DELETED: { $ne: true } }).lean();
}

// ============================================
// MÉTODOS LOCALES CON BITÁCORA (mismo estilo amigo)
// ============================================
async function GetAllMethod(bitacora, req, params, paramString, body, dbServer) {
  let data = DATA();

  // contexto
  data.process      = 'Obtener todas las presentaciones';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.method       = req.req?.method || 'No Especificado';
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

async function AddOneMethod(bitacora, params, req, dbServer) {
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

    // ✅ Setear HTTP 201 + Location desde el service (si hay http.res)
    if (req?.http?.res) {
      req.http.res.status(201);
      const id = (result && (result.IdPresentaOK || result?.data?.IdPresentaOK)) || '';
      if (id) {
        // Ajusta el entity set si tu ruta difiere (por defecto 'Presentaciones')
        req.http.res.set('Location', `/api/ztproducts-presentaciones/Presentaciones('${id}')`);
      }
    }

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

async function GetBySKUIDMethod(bitacora, req, params, skuid, dbServer) {
  let data = DATA();

  data.process = 'Obtener presentaciones por SKUID';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Obtener presentaciones por SKUID';

  try {
    let files;
    switch (dbServer) {
      case 'MongoDB':
        files = await GetZTProductsPresentacionesBySKUID(skuid);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para GetBySKUID');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = files;
    data.messageUSR = 'Presentaciones obtenidas correctamente por SKUID';
    data.messageDEV = 'GetZTProductsPresentacionesBySKUID ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener las presentaciones por SKUID';
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
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    // Soportar tanto 'idpresentaok' como 'IdPresentaOK' para mayor flexibilidad.
    const { ProcessType, LoggedUser, DBServer } = params;
    const idpresentaok = params.idpresentaok || params.IdPresentaOK;

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
        bitacora = await GetAllMethod(bitacora, req, params, paramString, null, dbServer);
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
        bitacora = await AddOneMethod(bitacora, params, req, dbServer);
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

      case 'GetBySKUID': {
        if (!params.skuid) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: skuid';
          data.messageDEV  = 'skuid es requerido para la operación GetBySKUID';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetBySKUIDMethod(bitacora, req, params, params.skuid, dbServer);
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
    // Si ya venías con finalRes=true, respeta el status consolidado
    if (!bitacora.finalRes) {
      // Error no manejado -> consolida a 500 y cierra
      let data = DATA();
      data.process     = 'Catch principal ZTProductsPresentacionesCRUD (Error Inesperado)';
      data.messageUSR  = 'Ocurrió un error inesperado en el endpoint';
      data.messageDEV  = error.message;
      data.stack       = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
      bitacora.finalRes = true;
    }

    // ✅ Notificar a CAP una única vez con el status final de bitácora
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
  ZTProductsPresentacionesCRUD,
  GetAllZTProductsPresentaciones,
  GetOneZTProductsPresentacion,
  AddOneZTProductsPresentacion,
  UpdateOneZTProductsPresentacion,
  DeleteLogicZTProductsPresentacion,
  DeleteHardZTProductsPresentacion,
  ActivateOneZTProductsPresentacion,
  GetZTProductsPresentacionesBySKUID
};
