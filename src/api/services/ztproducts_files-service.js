// ============================================
// MÉTODO GETALL CON BITACORA
// ============================================
async function GetAllZTProductFilesMethod(bitacora, params, paramString, body) {
  let data = DATA();
  try {
    const files = await GetAllZTProductFiles();
    data.dataRes = files;
    data.messageUSR = 'Archivos obtenidos correctamente';
    data.messageDEV = 'GetAllZTProductFiles ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener los archivos';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL');
    bitacora.success = false;
    return bitacora;
  }
}
//// ============================================
//// IMPORTS
//// ============================================
const { ZTProduct_FILES } = require('../models/mongodb/ztproducts_files');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { handleUploadZTProductFileCDS, handleUpdateZTProductFileCDS } = require('../../helpers/azureUpload.helper');

//// ============================================
//// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
//// ============================================
function getPayload(req) {
  return req.data || null;
}



//// ============================================
//// HANDLER: UPLOAD DE ARCHIVOS (POST)
//// ============================================
async function ZTProductFilesUploadHandler(req) {
  try {
    const payload = getPayload(req);
    if (!payload) {
      return { error: true, message: 'No se recibió payload. Verifica Content-Type: application/json' };
    }

    const { fileBase64, SKUID, FILETYPE, REGUSER, originalname, mimetype, ...rest } = payload;

    //// Validación de campos requeridos
    if (!fileBase64 || !SKUID || !FILETYPE || !REGUSER) {
      return { error: true, message: 'Faltan campos requeridos: fileBase64, SKUID, FILETYPE, REGUSER' };
    }

    //// Convertir Base64 a Buffer
    let fileBuffer;
    try {
      const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
      fileBuffer = Buffer.from(cleanBase64, 'base64');
    } catch (err) {
      return { error: true, message: 'Archivo base64 inválido', details: err.message };
    }

    //// Preparar objeto file para helper
    const file = {
      buffer: fileBuffer,
      originalname: originalname || 'upload.bin',
      mimetype: mimetype || 'application/octet-stream',
    };

    //// Subir archivo usando helper de Azure
    const result = await handleUploadZTProductFileCDS(file, { SKUID, FILETYPE, REGUSER, ...rest });
    return result.data || result;

  } catch (error) {
    return { error: true, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined };
  }
}

//// ============================================
//// HANDLER: UPDATE DE ARCHIVOS (PUT)
//// ============================================
async function ZTProductFilesUpdateHandler(req, fileid) {
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

    const result = await handleUpdateZTProductFileCDS(fileid, file, rest);
    return result.data || result;

  } catch (error) {
    return { error: true, message: error.message };
  }
}

//// ============================================
//// CRUD BÁSICO: GET
//// ============================================
async function GetAllZTProductFiles() {
  return await ZTProduct_FILES.find().lean();
}

async function GetOneZTProductFile(fileid) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const file = await ZTProduct_FILES.findOne({ FILEID: fileid }).lean();
  if (!file) throw new Error('No se encontró el archivo');
  return file;
}

//// ============================================
//// CRUD BÁSICO: DELETE / ACTIVATE
//// ============================================
async function DeleteZTProductFileLogic(fileid) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const actualizado = await ZTProduct_FILES.findOneAndUpdate(
    { FILEID: fileid },
    { $set: { ACTIVED: false, DELETED: true } },
    { new: true }
  );
  if (!actualizado) throw new Error('No se encontró el archivo para borrar');
  return actualizado.toObject();
}

async function DeleteZTProductFileHard(fileid) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const eliminado = await ZTProduct_FILES.findOneAndDelete({ FILEID: fileid });
  if (!eliminado) throw new Error('No se encontró el archivo para eliminar');
  return { mensaje: 'Archivo eliminado permanentemente', FILEID: fileid };
}

async function ActivateZTProductFile(fileid) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const actualizado = await ZTProduct_FILES.findOneAndUpdate(
    { FILEID: fileid },
    { $set: { ACTIVED: true, DELETED: false } },
    { new: true }
  );
  if (!actualizado) throw new Error('No se encontró el archivo para activar');
  return actualizado.toObject();
}
//// ============================================
//// FUNCION PRINCIPAL CRUD
//// ============================================
async function ZTProductFilesCRUD(req) {
  let bitacora = BITACORA();
  let data = DATA();
  try {
    const params = req.req?.query || {};
    const body = req.req?.body;
    const { ProcessType, LoggedUser, DBServer, type, fileid } = params;
    bitacora.processType = ProcessType || 'No especificado';
    bitacora.loggedUser = LoggedUser || 'No especificado';
    bitacora.dbServer = DBServer || process.env.CONNECTION_TO_HANA || 'No especificado';

    let paramString = params ? new URLSearchParams(params).toString().trim() : '';

    switch (ProcessType) {
      case 'GetAll':
        bitacora = await GetAllMethod(bitacora, params, paramString, body);
        break;
      case 'GetOne':
        bitacora = await GetOneMethod(bitacora, params, fileid);
        break;
      case 'AddOne':
        bitacora = await AddOneMethod(bitacora, params, body, req);
        break;
      case 'UpdateOne':
        bitacora = await UpdateOneMethod(bitacora, params, fileid, req);
        break;
      case 'DeleteLogic':
        bitacora = await DeleteLogicMethod(bitacora, params, fileid);
        break;
      case 'DeleteHard':
        bitacora = await DeleteHardMethod(bitacora, params, fileid);
        break;
      case 'ActivateOne':
        bitacora = await ActivateOneMethod(bitacora, params, fileid);
        break;
      default:
        data.process = 'Validación de ProcessType';
        data.messageUSR = 'ProcessType inválido o no especificado';
        data.messageDEV = 'ProcessType debe ser uno de: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        return FAIL(bitacora);
    }
    return OK(bitacora);
  } catch (error) {
    data.process = 'Catch principal ZTProductFilesCRUD';
    data.messageUSR = 'Ocurrió un error inesperado en el endpoint';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return FAIL(bitacora);
  }
}

// Métodos CRUD modulares con bitácora

async function GetAllMethod(bitacora, params, paramString, body) {
  let data = DATA();
  // Propagar todos los datos relevantes
  data.process = 'Obtener todos los archivos';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  data.server = process.env.SERVER_NAME || '';
  try {
    const files = await GetAllZTProductFiles();
    data.dataRes = files;
    data.messageUSR = 'Archivos obtenidos correctamente';
    data.messageDEV = 'GetAllZTProductFiles ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    // Propagar también en la bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
    bitacora.server = process.env.SERVER_NAME || '';
    bitacora.process = 'Obtener todos los archivos';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener los archivos';
    data.messageDEV = error.message;
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
    bitacora.server = process.env.SERVER_NAME || '';
    bitacora.process = 'Obtener todos los archivos';
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return bitacora;
  }
}

async function GetOneMethod(bitacora, params, fileid) {
  let data = DATA();
  data.process = 'Obtener un archivo';
  try {
    const file = await GetOneZTProductFile(fileid);
    data.dataRes = file;
    data.messageUSR = 'Archivo obtenido correctamente';
    data.messageDEV = 'GetOneZTProductFile ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return bitacora;
  }
}

async function AddOneMethod(bitacora, params, body, req) {
  let data = DATA();
  data.process = 'Agregar archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  data.server = process.env.SERVER_NAME || '';
  // Propagar también en la bitácora
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Agregar archivo';
  try {
    const result = await ZTProductFilesUploadHandle(req);
    data.dataRes = result;
    data.messageUSR = 'Archivo subido correctamente';
    data.messageDEV = 'Upload ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al subir el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return bitacora;
  }
}

async function UpdateOneMethod(bitacora, params, fileid, req) {
  let data = DATA();
  data.process = 'Actualizar archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  data.server = process.env.SERVER_NAME || '';
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Actualizar archivo';
  try {
    const result = await ZTProductFilesUpdateHandler(req, fileid);
    data.dataRes = result;
    data.messageUSR = 'Archivo actualizado correctamente';
    data.messageDEV = 'Update ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al actualizar el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return bitacora;
  }
}

async function DeleteLogicMethod(bitacora, params, fileid) {
  let data = DATA();
  data.process = 'Borrado lógico de archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  data.server = process.env.SERVER_NAME || '';
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Borrado lógico de archivo';
  try {
    const result = await DeleteZTProductFileLogic(fileid);
    data.dataRes = result;
    data.messageUSR = 'Archivo borrado lógicamente';
    data.messageDEV = 'DeleteLogic ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al borrar lógicamente el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return bitacora;
  }
}

async function DeleteHardMethod(bitacora, params, fileid) {
  let data = DATA();
  data.process = 'Borrado permanente de archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  data.server = process.env.SERVER_NAME || '';
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Borrado permanente de archivo';
  try {
    const result = await DeleteZTProductFileHard(fileid);
    data.dataRes = result;
    data.messageUSR = 'Archivo borrado permanentemente';
    data.messageDEV = 'DeleteHard ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al borrar permanentemente el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return bitacora;
  }
}

async function ActivateOneMethod(bitacora, params, fileid) {
  let data = DATA();
  data.process = 'Activar archivo';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  data.server = process.env.SERVER_NAME || '';
  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = params.DBServer || process.env.CONNECTION_TO_HANA || '';
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Activar archivo';
  try {
    const result = await ActivateZTProductFile(fileid);
    data.dataRes = result;
    data.messageUSR = 'Archivo activado correctamente';
    data.messageDEV = 'Activate ejecutado sin errores';
    data.api = '/api/ztproducts-files/productsFilesCRUD';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al activar el archivo';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return bitacora;
  }
}

//// ============================================
//// EXPORTS
//// ============================================
module.exports = {
  ZTProductFilesCRUD,
  GetAllZTProductFiles,
  GetOneZTProductFile,
  DeleteZTProductFileLogic,
  DeleteZTProductFileHard,
  ActivateZTProductFile,
  ZTProductFilesUploadHandler
};
