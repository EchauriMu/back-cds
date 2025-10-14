// src/api/services/ztproducts_presentaciones-service.js

// Importar el modelo mongoose
const { ZTProducts_Presentaciones } = require('../models/mongodb/ztproducts_presentaciones');

// -----------------------------
// GET ALL
// -----------------------------
async function GetAllZTProductsPresentaciones() {
  return await ZTProducts_Presentaciones.find().lean();
}

// -----------------------------
// GET ONE
// -----------------------------
async function GetOneZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const item = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: idpresentaok }).lean();
  if (!item) throw new Error('No se encontró la presentación');
  return item;
}

// -----------------------------
// CREATE
// -----------------------------
async function CreateZTProductsPresentacion(req) {
  const data = req.req.body || {};

  // Valida mínimos obligatorios
  if (!data.IdPresentaOK || !data.SKUID || !data.Descripcion || !data.REGUSER) {
    throw new Error('Faltan campos obligatorios (IdPresentaOK, SKUID, Descripcion, REGUSER)');
  }

  // Evita duplicados por clave
  const existe = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: data.IdPresentaOK });
  if (existe) throw new Error('Ya existe una presentación con ese IdPresentaOK');

  const nuevo = await ZTProducts_Presentaciones.create(data);
  return nuevo.toObject();
}

// -----------------------------
// UPDATE
// -----------------------------
async function UpdateZTProductsPresentacion(req, idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');

  const cambios = req.req.body;
  if (!cambios || Object.keys(cambios).length === 0) {
    throw new Error('No se enviaron datos para actualizar');
  }

  const actualizado = await ZTProducts_Presentaciones.findOneAndUpdate(
    { IdPresentaOK: idpresentaok },
    { $set: cambios },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la presentación para actualizar');
  return actualizado.toObject();
}

// -----------------------------
// DELETE LOGIC
// -----------------------------
async function DeleteZTProductsPresentacionLogic(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');

  const actualizado = await ZTProducts_Presentaciones.findOneAndUpdate(
    { IdPresentaOK: idpresentaok },
    { $set: { ACTIVED: false, DELETED: true } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la presentación para borrar (lógico)');
  return actualizado.toObject();
}

// -----------------------------
// DELETE HARD
// -----------------------------
async function DeleteZTProductsPresentacionHard(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');

  const eliminado = await ZTProducts_Presentaciones.findOneAndDelete({ IdPresentaOK: idpresentaok });
  if (!eliminado) throw new Error('No se encontró la presentación para eliminar');
  return { mensaje: 'Presentación eliminada permanentemente' };
}

// -----------------------------
// ACTIVATE
// -----------------------------
async function ActivateZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');

  const actualizado = await ZTProducts_Presentaciones.findOneAndUpdate(
    { IdPresentaOK: idpresentaok },
    { $set: { ACTIVED: true, DELETED: false } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la presentación para activar');
  return actualizado.toObject();
}

// -----------------------------
// CRUD ROUTER (entrypoint para @impl)
// -----------------------------
async function ZTProductsPresentacionesCRUD(req) {
  try {
    const { procedure, type, idpresentaok } = req.req.query || {};
    let res;

    if (procedure === 'get') {
      if (type === 'all') {
        res = await GetAllZTProductsPresentaciones();
      } else if (type === 'one') {
        res = await GetOneZTProductsPresentacion(idpresentaok);
      } else {
        throw new Error('Coloca un tipo de búsqueda válido (all o one)');
      }
    } else if (procedure === 'post') {
      res = await CreateZTProductsPresentacion(req);
    } else if (procedure === 'put') {
      res = await UpdateZTProductsPresentacion(req, idpresentaok);
    } else if (procedure === 'delete') {
      if (type === 'logic') {
        res = await DeleteZTProductsPresentacionLogic(idpresentaok);
      } else if (type === 'hard') {
        res = await DeleteZTProductsPresentacionHard(idpresentaok);
      } else {
        throw new Error('Tipo de borrado inválido (logic o hard)');
      }
    } else if (procedure === 'activate') {
      res = await ActivateZTProductsPresentacion(idpresentaok);
    } else {
      throw new Error('Parámetros inválidos o incompletos');
    }

    return res;
  } catch (error) {
    console.error('Error en ZTProductsPresentacionesCRUD:', error);
    return { error: true, message: error.message };
  }
}

module.exports = {
  ZTProductsPresentacionesCRUD,
  GetAllZTProductsPresentaciones,
  GetOneZTProductsPresentacion,
  CreateZTProductsPresentacion,
  UpdateZTProductsPresentacion,
  DeleteZTProductsPresentacionLogic,
  DeleteZTProductsPresentacionHard,
  ActivateZTProductsPresentacion,
};
