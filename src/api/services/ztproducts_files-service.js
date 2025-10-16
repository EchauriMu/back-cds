// Importar el modelo mongoose
const { ZTProduct_FILES } = require('../models/mongodb/ztproducts_files');
// Import de middlewares
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
// Handler para POST con archivo en base64 (JSON)
const { handleUploadZTProductFileCDS, handleUpdateZTProductFileCDS } = require('../helpers/azureUpload.helper');


// ============================================
// HANDLER PARA UPLOAD DE ARCHIVOS -- post
// ============================================
async function ZTProductFilesUploadHandler(req) {
  try {
    // Debug completo
    console.log('===== DEBUG COMPLETO =====');
    console.log('req.data:', req.data);
    console.log('req.req?.body:', req.req?.body);
    console.log('req.body:', req.body);
    console.log('req.req?.query:', req.req?.query);
    console.log('typeof req.data:', typeof req.data);
    console.log('typeof req.req?.body:', typeof req.req?.body);

    // SOLUCIÓN: En CAP/CDS, intentar múltiples fuentes
    let payload = null;
    
    // 1. Primero intentar req.data (formato CAP estándar)
    if (req.data && Object.keys(req.data).length > 0) {
      payload = req.data;
      console.log('✓ Datos encontrados en req.data');
    }
    // 2. Luego intentar req.req.body (Express body-parser)
    else if (req.req?.body && Object.keys(req.req.body).length > 0) {
      payload = req.req.body;
      console.log('✓ Datos encontrados en req.req.body');
    }
    // 3. Finalmente req.body directo
    else if (req.body && Object.keys(req.body).length > 0) {
      payload = req.body;
      console.log('✓ Datos encontrados en req.body');
    }

    if (!payload) {
      console.error('✗ No se encontraron datos en ninguna fuente');
      return { 
        error: true, 
        message: 'No se recibió payload. Verifica que el Content-Type sea application/json',
        debug: {
          hasReqData: !!(req.data && Object.keys(req.data).length > 0),
          hasReqReqBody: !!(req.req?.body && Object.keys(req.req.body).length > 0),
          hasReqBody: !!(req.body && Object.keys(req.body).length > 0),
          reqDataKeys: req.data ? Object.keys(req.data) : [],
          reqReqBodyKeys: req.req?.body ? Object.keys(req.req.body) : []
        }
      };
    }

    console.log('✓ Payload encontrado:', Object.keys(payload));

    const { 
      fileBase64, 
      SKUID, 
      FILETYPE, 
      REGUSER, 
      originalname, 
      mimetype, 
      ...rest 
    } = payload;

    // Validar campos requeridos
    if (!fileBase64 || !SKUID || !FILETYPE || !REGUSER) {
      console.error('[ZTProductFilesUploadHandler] Faltan campos requeridos:', { 
        fileBase64: fileBase64 ? '✓ presente' : '✗ falta',
        SKUID: SKUID || '✗ falta',
        FILETYPE: FILETYPE || '✗ falta',
        REGUSER: REGUSER || '✗ falta'
      });
      return { 
        error: true, 
        message: 'Faltan campos requeridos: fileBase64, SKUID, FILETYPE, REGUSER',
        received: {
          fileBase64: !!fileBase64,
          SKUID: SKUID || null,
          FILETYPE: FILETYPE || null,
          REGUSER: REGUSER || null
        }
      };
    }

    // Convertir base64 a buffer
    let fileBuffer;
    try {
      // Limpiar el base64 si viene con el prefijo data:image/...
 // Limpiar Base64: eliminar prefijo y saltos de línea
const cleanBase64 = fileBase64
  .replace(/^data:([A-Za-z-+\/]+);base64,/, '') // eliminar prefijo data:...
  .replace(/\r?\n|\r/g, ''); // eliminar saltos de línea

// Convertir a buffer
fileBuffer = Buffer.from(cleanBase64, 'base64');

  console.log(`✓ Buffer creado: ${fileBuffer.length} bytes`);
    } catch (err) {
      console.error('[ZTProductFilesUploadHandler] Error al convertir base64:', err);
      return { 
        error: true, 
        message: 'Archivo base64 inválido. Verifica que el string esté correctamente codificado.',
        details: err.message
      };
    }

    // Simular objeto file compatible con el helper
    const file = {
      buffer: fileBuffer,
      originalname: originalname || 'upload.bin',
      mimetype: mimetype || 'application/octet-stream',
    };

    console.log('[ZTProductFilesUploadHandler] File object creado:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.buffer.length
    });

    // Llamar helper para subir a Azure
    const result = await handleUploadZTProductFileCDS(file, { 
      SKUID, 
      FILETYPE, 
      REGUSER, 
      ...rest 
    });

    console.log('[ZTProductFilesUploadHandler] ✓ Resultado helper:', result);

    return result.data || result;

  } catch (error) {
    console.error('❌ Error en ZTProductFilesUploadHandler:', error);
    return { 
      error: true, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}




// ============================================
// HANDLER PARA UPDATE DE ARCHIVOS
// ============================================
async function ZTProductFilesUpdateHandler(req, fileid) {
  try {
    console.log('===== DEBUG UPDATE =====');
    console.log('req.data:', req.data);

    let payload = null;
    if (req.data && Object.keys(req.data).length > 0) payload = req.data;
    else if (req.req?.body && Object.keys(req.req.body).length > 0) payload = req.req.body;
    else if (req.body && Object.keys(req.body).length > 0) payload = req.body;

    if (!payload) {
      return { error: true, message: 'No se recibió payload para actualización' };
    }

    const { fileBase64, originalname, mimetype, ...rest } = payload;

    if (!fileBase64) {
      return { error: true, message: 'Falta fileBase64 en el payload' };
    }

    // Limpiar y convertir base64 a buffer
    const cleanBase64 = fileBase64
      .replace(/^data:([A-Za-z-+\/]+);base64,/, '')
      .replace(/\r?\n|\r/g, '');
    const fileBuffer = Buffer.from(cleanBase64, 'base64');

    // Simular objeto file
    const file = {
      buffer: fileBuffer,
      originalname: originalname || 'update.bin',
      mimetype: mimetype || 'application/octet-stream'
    };

    const result = await handleUpdateZTProductFileCDS(fileid, file, rest);
    return result.data || result;

  } catch (error) {
    console.error('❌ Error en ZTProductFilesUpdateHandler:', error);
    return { error: true, message: error.message };
  }
}

// ============================================
// FUNCIONES CRUD BÁSICAS
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

async function CreateZTProductFile(req) {
  const data = req.req.body;
  if (!data.FILEID || !data.SKUID || !data.FILETYPE || !data.FILE || !data.REGUSER) {
    throw new Error('Faltan campos obligatorios: FILEID, SKUID, FILETYPE, FILE, REGUSER');
  }
  
  const existe = await ZTProduct_FILES.findOne({ FILEID: data.FILEID });
  if (existe) throw new Error('Ya existe un archivo con ese FILEID');
  
  const nuevo = await ZTProduct_FILES.create(data);
  return nuevo.toObject();
}

async function UpdateZTProductFile(req, fileid) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const cambios = req.req.body;
  if (!cambios || Object.keys(cambios).length === 0) {
    throw new Error('No se enviaron datos para actualizar');
  }
  
  const actualizado = await ZTProduct_FILES.findOneAndUpdate(
    { FILEID: fileid },
    { $set: cambios },
    { new: true }
  );
  
  if (!actualizado) throw new Error('No se encontró el archivo para actualizar');
  return actualizado.toObject();
}

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

// ============================================
// FUNCIÓN PRINCIPAL CRUD
// ============================================
async function ZTProductFilesCRUD(req) {
  let res;
  try {
    const { procedure, type, fileid, LoggedUser } = req.req?.query || {};
    
    console.log('=== ZTProductFilesCRUD ===');
    console.log('Procedure:', procedure);
    console.log('Type:', type);
    console.log('FileID:', fileid);

    if (procedure === 'post') {
      // POST - Upload de archivo
      res = await ZTProductFilesUploadHandler(req);
      
    } else if (procedure === 'get') {
      // GET - Obtener archivos
      if (type === 'all') {
        // Si es request OData directo, retornar solo los datos
        if (req && req._.odataReq) {
          res = await GetAllZTProductFiles();
        } else {
          // Respuesta con bitácora/metadatos
          let bitacora = BITACORA();
          let data = DATA();
          bitacora.loggedUser = LoggedUser || 'DEFAULT_USER';
          bitacora.process = 'GETall ZTProductFiles';
          
          try {
            const files = await GetAllZTProductFiles();
            data.dataRes = files;
            data.messageUSR = 'Archivos obtenidos correctamente';
            data.messageDEV = 'GetAllZTProductFiles ejecutado sin errores';
            data.api = '/api/ztproducts-files/productsFilesCRUD';
            bitacora = AddMSG(bitacora, data, 'OK', 200, true);
            res = OK(bitacora);
          } catch (error) {
            data.messageUSR = 'Error al obtener los archivos';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL');
            console.error('<<Message USR>>', bitacora.messageUSR);
            console.error('<<Message DEV>>', bitacora.messageDEV);
            res = FAIL(bitacora);
          }
        }
      } else if (type === 'one') {
        res = await GetOneZTProductFile(fileid);
      } else {
        throw new Error('Coloca un tipo de búsqueda válido (all o one)');
      }
      
    } else if (procedure === 'put') {
      // PUT - Actualizar archivo
      res = await ZTProductFilesUpdateHandler(req, fileid);
      
    } else if (procedure === 'delete') {
      // DELETE - Eliminar archivo
      if (type === 'logic') {
        res = await DeleteZTProductFileLogic(fileid);
      } else if (type === 'hard') {
        res = await DeleteZTProductFileHard(fileid);
      } else {
        throw new Error('Tipo de borrado inválido (logic o hard)');
      }
      
    } else if (procedure === 'activate') {
      // ACTIVATE - Reactivar archivo
      res = await ActivateZTProductFile(fileid);
      
    } else {
      throw new Error('Parámetros inválidos o incompletos. Usa: procedure=get|post|put|delete|activate');
    }

    return res;

  } catch (error) {
    console.error('❌ Error en ZTProductFilesCRUD:', error);
    return { 
      error: true, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  ZTProductFilesCRUD,
  GetAllZTProductFiles,
  GetOneZTProductFile,
  CreateZTProductFile,
  UpdateZTProductFile,
  DeleteZTProductFileLogic,
  DeleteZTProductFileHard,
  ActivateZTProductFile,
  ZTProductFilesUploadHandler
};