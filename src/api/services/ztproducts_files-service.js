// ============================================
// IMPORTS
// ============================================
const { ZTProduct_FILES } = require('../models/mongodb/ztproducts_files');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { handleUploadZTProductFileCDS, handleUpdateZTProductFileCDS } = require('../../helpers/azureUpload.helper');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
// ============================================
function getPayload(req) {
  return req.data || null;
}


// ============================================
// HANDLER: UPLOAD DE ARCHIVOS (POST)
// ============================================
async function ZTProductFilesUploadHandler(req, loggedUser) {
  try {
    const payload = getPayload(req);
    if (!payload) {
      return { error: true, message: 'No se recibió payload. Verifica Content-Type: application/json' };
    }
    const { fileBase64, SKUID, FILETYPE, originalname, mimetype, ...rest } = payload;

    // Validación de campos requeridos
    if (!fileBase64 || !SKUID || !FILETYPE || !loggedUser) {
      return { error: true, message: 'Faltan campos requeridos: fileBase64, SKUID, FILETYPE, y el usuario logueado (LoggedUser).' };
    }
    // Convertir Base64 a Buffer
    let fileBuffer;
    try {
      const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
      fileBuffer = Buffer.from(cleanBase64, 'base64');
    } catch (err) {
      return { error: true, message: 'Archivo base64 inválido', details: err.message };
    }

    // Preparar objeto file para helper
    const file = {
      buffer: fileBuffer,
      originalname: originalname || 'upload.bin',
      mimetype: mimetype || 'application/octet-stream',
    };

    // Subir archivo usando helper de Azure
    const result = await handleUploadZTProductFileCDS(file, { SKUID, FILETYPE, ...rest }, loggedUser);
    return result.data || result;

  } catch (error) {
    return { error: true, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }; // eslint-disable-line
  }
}

// ============================================
// HANDLER: UPDATE DE ARCHIVOS (PUT)
// ============================================
async function ZTProductFilesUpdateHandler(req, fileid, loggedUser) {
  try {
    const payload = getPayload(req);
    if (!payload) return { error: true, message: 'No se recibió payload para actualización' };

    const { fileBase64, originalname, mimetype, ...rest } = payload;
    if (!fileBase64) return { error: true, message: 'Falta fileBase64 en el payload' };

    const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');

    const file = {
      buffer: fileBuffer,
      originalname: originalname || 'update.bin',
      mimetype: mimetype || 'application/octet-stream',
    };

    const result = await handleUpdateZTProductFileCDS(fileid, file, rest, loggedUser);
    return result.data || result;

  } catch (error) {
    return { error: true, message: error.message };
  }
}

// ============================================
// CRUD BÁSICO: GET
// ============================================
async function GetAllZTProductFiles() {
  return await ZTProduct_FILES.find().lean();
}

async function GetOneZTProductFile(fileid) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const file = await ZTProduct_FILES.findOne({ FILEID: fileid }).lean();
  if (!file) throw new Error('No se encontró el archivo');
  return file;
}

// ============================================
// CRUD: GET FILES BY SKUID
// ============================================
async function GetZTProductFilesBySKUID(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  return await ZTProduct_FILES.find({ SKUID: skuid }).lean();
}

// ============================================
// CRUD: GET FILES BY IdPresentaOK
// ============================================
async function GetZTProductFilesByIdPresentaOK(idPresentaOK) {
  if (!idPresentaOK) throw new Error('Falta parámetro IdPresentaOK');
  return await ZTProduct_FILES.find({ IdPresentaOK: idPresentaOK }).lean();
}

// ============================================
// CRUD BÁSICO: DELETE / ACTIVATE
// ============================================
async function DeleteZTProductFileLogic(fileid, user) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const filter = { FILEID: fileid };
  const data = { ACTIVED: false, DELETED: true };
  const action = 'UPDATE';
  return await saveWithAudit(ZTProduct_FILES, filter, data, user, action);
}

async function DeleteZTProductFileHard(fileid) {
  console.log('entrando a DeleteZTProductFileHard')
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const eliminado = await ZTProduct_FILES.findOneAndDelete({ FILEID: fileid });
  if (!eliminado) throw new Error('No se encontró el archivo para eliminar');
  return { mensaje: 'Archivo eliminado permanentemente', FILEID: fileid };
}

async function ActivateZTProductFile(fileid, user) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const filter = { FILEID: fileid };
  const data = { ACTIVED: true, DELETED: false };
  const action = 'UPDATE';
  return await saveWithAudit(ZTProduct_FILES, filter, data, user, action);
}
// ============================================
// FUNCION PRINCIPAL CRUD
// ============================================
async function ZTProductFilesCRUD(req) {
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // 1. EXTRAER Y SERIALIZAR PARÁMETROS
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer, fileid, skuid } = params;
    
    // 2. VALIDAR PARÁMETROS OBLIGATORIOS
    if (!ProcessType) {
      data.process = 'Validación de parámetros obligatorios';
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV = 'ProcessType es requerido para ejecutar la API. Valores válidos: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
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
    
    // 3. CONFIGURAR CONTEXTO DE LA BITÁCORA
    const dbServer = DBServer || 'MongoDB'; // Default explícito
    bitacora.processType = ProcessType;
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = dbServer;
    bitacora.queryString = paramString;
    bitacora.method = req.req?.method || 'UNKNOWN';
    bitacora.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora.server = process.env.SERVER_NAME || 'No especificado'; // eslint-disable-line

    // 4. EJECUTAR OPERACIÓN SEGÚN PROCESSTYPE
    switch (ProcessType) {
      case 'GetAll':
        bitacora = await GetAllMethod(bitacora, req, params, paramString, body, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'GetOne':
        if (!fileid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: fileid';
          data.messageDEV = 'fileid es requerido para la operación GetOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetOneMethod(bitacora, req, params, fileid, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'AddOne':
        bitacora = await AddOneMethod(bitacora, req, params, body, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'UpdateOne':
        if (!fileid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: fileid';
          data.messageDEV = 'fileid es requerido para la operación UpdateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await UpdateOneMethod(bitacora, req, params, fileid, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'DeleteLogic':
        if (!fileid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: fileid';
          data.messageDEV = 'fileid es requerido para la operación DeleteLogic';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteLogicMethod(bitacora, req, params, fileid, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'DeleteHard':
        if (!fileid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: fileid';
          data.messageDEV = 'fileid es requerido para la operación DeleteHard';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteHardMethod(bitacora, req, params, fileid, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'ActivateOne':
        if (!fileid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: fileid';
          data.messageDEV = 'fileid es requerido para la operación ActivateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await ActivateOneMethod(bitacora, req, params, fileid, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'GetBySKUID':
        if (!skuid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: skuid';
          data.messageDEV = 'skuid es requerido para la operación GetBySKUID';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetBySKUIDMethod(bitacora, req, params, skuid, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'GetByIdPresentaOK':
        if (!params.idPresentaOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: idPresentaOK';
          data.messageDEV = 'idPresentaOK es requerido para la operación GetByIdPresentaOK';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetByIdPresentaOKMethod(bitacora, req, params, params.idPresentaOK, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      default:
        data.process = 'Validación de ProcessType';
        data.messageUSR = 'ProcessType inválido o no especificado';
        data.messageDEV = 'ProcessType debe ser uno de: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes = true;
        return FAIL(bitacora);
    }
    
    return OK(bitacora);
    //------utilizar este catch  para el documentos
  }  catch (error) {
    // 1. Configuración de error NO MANEJADO (solo se ejecuta si el error fue una excepción imprevista)
    // Si bitacora.finalRes es false, significa que el error no fue procesado por un método interno.
    if (!bitacora.finalRes) {
        // Error no manejado - lo construimos como 500
        data.process = 'Catch principal ZTProductFilesCRUD (Error Inesperado)';
        data.messageUSR = 'Ocurrió un error inesperado en el endpoint';
        data.messageDEV = error.message;
        
        // Se añade el mensaje de fallo con status 500 y se marca como finalRes=true
        bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    } 
    // Si bitacora.finalRes ya era true, saltamos el 'if' y usamos la bitácora existente (ej. un 404 de un método interno).

    // 2. Notificación a SAP CAP (ÚNICA LLAMADA)
    // Usamos la bitácora ya finalizada, ya sea que la construimos en el 'if' o vino de un método.
    //basado en la logica estandar que nos eneseño el profe
    //
    req.error({
        code: 'Internal-Server-Error',
        status: bitacora.status || 500, // Usar el status final de la bitácora
        message: bitacora.messageUSR,
        target: bitacora.messageDEV,
        numericSeverity: 1,
        innererror: bitacora
    });

    // 3. Devolver la respuesta de fallo y finalizar el flujo
    return FAIL(bitacora);
}

}

// ============================================
// MÉTODOS LOCALES CON BITÁCORA
// ============================================

async function GetAllMethod(bitacora, req, params, paramString, body, dbServer) {
  let data = DATA();
  
  // Configurar contexto de data
  data.process = 'Obtener todos los archivos';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';
  data.queryString = paramString;
  
  // Propagar en bitácora
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Obtener todos los archivos';
  
  try {
    // Switch según base de datos
    let files;
    switch (dbServer) {
      case 'MongoDB':
        files = await GetAllZTProductFiles();
        break;
      case 'HANA':
        // TODO: Implementar lógica para HANA
        throw new Error('HANA no implementado aún para GetAll');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    data.dataRes = files;
    data.messageUSR = 'Archivos obtenidos correctamente';
    data.messageDEV = 'GetAllZTProductFiles ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al obtener los archivos';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetOneMethod(bitacora, req, params, fileid, dbServer) {
  let data = DATA();
  
  // Configurar contexto de data
  data.process = 'Obtener un archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';
  
  // Propagar en bitácora
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Obtener un archivo';
  
  try {
    let file;
    switch (dbServer) {
      case 'MongoDB':
        file = await GetOneZTProductFile(fileid);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para GetOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    data.dataRes = file;
    data.messageUSR = 'Archivo obtenido correctamente';
    data.messageDEV = 'GetOneZTProductFile ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al obtener el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function AddOneMethod(bitacora, req, params, body, dbServer) {
  let data = DATA();
  
  data.process = 'Agregar archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Agregar archivo';
  
  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await ZTProductFilesUploadHandler(req, params.LoggedUser);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para AddOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    data.dataRes = result;
    data.messageUSR = 'Archivo subido correctamente';
    data.messageDEV = 'Upload ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al subir el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function UpdateOneMethod(bitacora, req, params, fileid, user, dbServer) {
  let data = DATA();
  
  data.process = 'Actualizar archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Actualizar archivo';
  
  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await ZTProductFilesUpdateHandler(req, fileid, user);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para UpdateOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    data.dataRes = result;
    data.messageUSR = 'Archivo actualizado correctamente';
    data.messageDEV = 'Update ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al actualizar el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteLogicMethod(bitacora, req, params, fileid, user, dbServer) {
  let data = DATA();
  
  data.process = 'Borrado lógico de archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Borrado lógico de archivo';
  
  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteZTProductFileLogic(fileid, user);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para DeleteLogic');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    data.dataRes = result;
    data.messageUSR = 'Archivo borrado lógicamente';
    data.messageDEV = 'DeleteLogic ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    // Si el error es porque no se encontró el archivo, es un 404.
    if (error.message.includes('No se encontró el archivo')) {
      data.messageUSR = 'No se encontró el archivo especificado para borrar.';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else { // Para cualquier otro error, es un 500.
      data.messageUSR = 'Error al borrar lógicamente el archivo';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteHardMethod(bitacora, req, params, fileid, dbServer) {
  let data = DATA();
  
  data.process = 'Borrado permanente de archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Borrado permanente de archivo';
  
  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteZTProductFileHard(fileid);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para DeleteHard');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    data.dataRes = result;
    data.messageUSR = 'Archivo borrado permanentemente';
    data.messageDEV = 'DeleteHard ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al borrar permanentemente el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function ActivateOneMethod(bitacora, req, params, fileid, user, dbServer) {
  let data = DATA();
  
  data.process = 'Activar archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';
  
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
  bitacora.process = 'Activar archivo';
  
  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await ActivateZTProductFile(fileid, user);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para ActivateOne');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }
    
    data.dataRes = result;
    data.messageUSR = 'Archivo activado correctamente';
    data.messageDEV = 'Activate ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
    
  } catch (error) {
    data.messageUSR = 'Error al activar el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetBySKUIDMethod(bitacora, req, params, skuid, dbServer) {
  let data = DATA();

  data.process = 'Obtener archivos por SKUID';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';

  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Obtener archivos por SKUID';

  try {
    let files;
    switch (dbServer) {
      case 'MongoDB':
        files = await GetZTProductFilesBySKUID(skuid);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para GetBySKUID');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = files;
    data.messageUSR = 'Archivos obtenidos correctamente por SKUID';
    data.messageDEV = 'GetZTProductFilesBySKUID ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener los archivos por SKUID';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetByIdPresentaOKMethod(bitacora, req, params, idPresentaOK, dbServer) {
  let data = DATA();

  data.process = 'Obtener archivos por IdPresentaOK';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-files/productsFilesCRUD';

  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Obtener archivos por IdPresentaOK';

  try {
    let files;
    switch (dbServer) {
      case 'MongoDB':
        files = await GetZTProductFilesByIdPresentaOK(idPresentaOK);
        break;
      case 'HANA':
        throw new Error('HANA no implementado aún para GetByIdPresentaOK');
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = files;
    data.messageUSR = 'Archivos obtenidos correctamente por IdPresentaOK';
    data.messageDEV = 'GetZTProductFilesByIdPresentaOK ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener los archivos por IdPresentaOK';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  ZTProductFilesCRUD,
  GetAllZTProductFiles,
  GetOneZTProductFile,
  DeleteZTProductFileLogic,
  DeleteZTProductFileHard,
  ActivateZTProductFile,
  ZTProductFilesUploadHandler,
  GetZTProductFilesBySKUID,
  GetZTProductFilesByIdPresentaOK // <-- Exporta la nueva función
};
