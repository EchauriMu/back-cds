const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { ZTProduct_FILES } = require('../models/mongodb/ztproducts_files');

async function handleUploadZTProductFileCDS(file, body) {
  if (!file) {
    return { status: 400, data: { error: 'No se recibió archivo.' } };
  }

  const { SKUID, FILETYPE, PRINCIPAL, SECUENCE, INFOAD, IdPresentaOK, REGUSER } = body;
  if (!SKUID || !FILETYPE || !REGUSER) {
    return { status: 400, data: { error: 'Faltan campos requeridos: SKUID, FILETYPE, REGUSER.' } };
  }

  const AZURE_BLOB_SAS_URL = process.env.AZURE_BLOB_SAS_URL;
  try {
    // Crear nombre único para el archivo
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueFilename = `${baseName}_${uniqueId}${ext}`;
    const blobName = encodeURIComponent(uniqueFilename);
    const azureUrl = `${AZURE_BLOB_SAS_URL.split('?')[0]}/${blobName}?${AZURE_BLOB_SAS_URL.split('?')[1]}`;
    const publicUrl = `${AZURE_BLOB_SAS_URL.split('?')[0]}/${blobName}`;

    // Obtener buffer del archivo
    let fileBuffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.path) {
      fileBuffer = await fs.readFile(file.path);
    } else {
      throw new Error('No se proporcionó buffer ni path para el archivo');
    }

    // Subir archivo a Azure Blob Storage
    await axios.put(azureUrl, fileBuffer, {
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.mimetype
      }
    });

    // Guardar documento en MongoDB
    const fileDoc = await ZTProduct_FILES.create({
      FILEID: uniqueId,
      SKUID,
      IdPresentaOK: IdPresentaOK || null,
      FILETYPE,
      FILE: publicUrl,
      PRINCIPAL: PRINCIPAL === 'true' || PRINCIPAL === true,
      SECUENCE: SECUENCE ? Number(SECUENCE) : 0,
      INFOAD: INFOAD || '',
      REGUSER,
      REGDATE: new Date(),
      ACTIVED: true,
      DELETED: false
    });

    // Borrar archivo temporal si existe
    if (file.path) {
      await fs.unlink(file.path).catch(() => {});
    }

    // Convertir documento a JSON plano para evitar stack overflow
    const safeFile = fileDoc.toJSON();

    return {
      status: 201,
      data: { url: publicUrl, file: safeFile }
    };
  } catch (error) {
    // Borrar archivo temporal si existe
    if (file.path) {
      await fs.unlink(file.path).catch(() => {});
    }

    // Manejo de errores de Axios/Azure
    if (error.response) {
      return {
        status: error.response.status,
        data: {
          error: 'Error al subir archivo a Azure',
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        }
      };
    } else if (error.request) {
      return {
        status: 500,
        data: { error: 'No hubo respuesta de Azure' }
      };
    } else {
      return {
        status: 500,
        data: { error: 'Error inesperado al subir archivo', message: error.message }
      };
    }
  }
}

module.exports = { handleUploadZTProductFileCDS };
