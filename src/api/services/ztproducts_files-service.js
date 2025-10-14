// Importar el modelo mongoose
const { ZTProduct_FILES } = require('../models/mongodb/ztproducts_files');

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
    throw new Error('Faltan campos obligatorios');
  }
  const existe = await ZTProduct_FILES.findOne({ FILEID: data.FILEID });
  if (existe) throw new Error('Ya existe un archivo con ese FILEID');
  const nuevo = await ZTProduct_FILES.create(data);
  return nuevo.toObject();
}

async function UpdateZTProductFile(req, fileid) {
  if (!fileid) throw new Error('Falta parámetro FILEID');
  const cambios = req.req.body;
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');
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
  return { mensaje: 'Archivo eliminado permanentemente' };
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

async function ZTProductFilesCRUD(req) {
  try {
    const { procedure, type, fileid } = req.req.query;
    let res;
    if (procedure === 'get') {
      if (type === 'all') {
        res = await GetAllZTProductFiles();
      } else if (type === 'one') {
        res = await GetOneZTProductFile(fileid);
      } else {
        throw new Error('Coloca un tipo de búsqueda válido (all o one)');
      }
    } else if (procedure === 'post') {
      res = await CreateZTProductFile(req);
    } else if (procedure === 'put') {
      res = await UpdateZTProductFile(req, fileid);
    } else if (procedure === 'delete') {
      if (type === 'logic') {
        res = await DeleteZTProductFileLogic(fileid);
      } else if (type === 'hard') {
        res = await DeleteZTProductFileHard(fileid);
      } else {
        throw new Error('Tipo de borrado inválido (logic o hard)');
      }
    } else if (procedure === 'activate') {
      res = await ActivateZTProductFile(fileid);
    } else {
      throw new Error('Parámetros inválidos o incompletos');
    }
    return res;
  } catch (error) {
    console.error('Error en ZTProductFilesCRUD:', error);
    return { error: true, message: error.message };
  }
}

module.exports = {
  ZTProductFilesCRUD,
  GetAllZTProductFiles,
  GetOneZTProductFile,
  CreateZTProductFile,
  UpdateZTProductFile,
  DeleteZTProductFileLogic,
  DeleteZTProductFileHard,
  ActivateZTProductFile
};
