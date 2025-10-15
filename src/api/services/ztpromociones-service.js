// src/api/services/ztpromociones-service.js

// Importar el modelo mongoose
const ZTPromociones = require('../models/mongodb/ztpromociones');

// -----------------------------
// GET ALL
// -----------------------------
async function GetAllZTPromociones() {
  return await ZTPromociones.find({ ACTIVED: true, DELETED: false }).lean();
}

// -----------------------------
// GET ONE
// -----------------------------
async function GetOneZTPromocion(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');
  const item = await ZTPromociones.findOne({ 
    IdPromoOK: idpromoOK, 
    ACTIVED: true, 
    DELETED: false 
  }).lean();
  if (!item) throw new Error('No se encontró la promoción');
  return item;
}

// -----------------------------
// CREATE
// -----------------------------
async function CreateZTPromocion(req) {
  const data = req.req.body || {};

  // Valida mínimos obligatorios
  if (!data.IdPromoOK || !data.Titulo || !data.FechaIni || !data.FechaFin || !data.REGUSER) {
    throw new Error('Faltan campos obligatorios (IdPromoOK, Titulo, FechaIni, FechaFin, REGUSER)');
  }

  // Validación de fechas
  const fechaIni = new Date(data.FechaIni);
  const fechaFin = new Date(data.FechaFin);
  if (fechaFin <= fechaIni) {
    throw new Error('La fecha fin debe ser posterior a la fecha inicio');
  }

  // Validación de referencias (al menos una debe estar presente)
  if (!data.SKUID && !data.IdListaOK) {
    throw new Error('Debe especificar al menos un SKUID o IdListaOK');
  }

  // Evita duplicados por clave
  const existe = await ZTPromociones.findOne({ IdPromoOK: data.IdPromoOK });
  if (existe) throw new Error('Ya existe una promoción con ese IdPromoOK');

  // Establecer valores por defecto
  data.REGDATE = new Date();
  data.ACTIVED = data.ACTIVED !== undefined ? data.ACTIVED : true;
  data.DELETED = data.DELETED !== undefined ? data.DELETED : false;

  const nuevo = await ZTPromociones.create(data);
  return nuevo.toObject();
}

// -----------------------------
// UPDATE
// -----------------------------
async function UpdateZTPromocion(req, idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const cambios = req.req.body;
  if (!cambios || Object.keys(cambios).length === 0) {
    throw new Error('No se enviaron datos para actualizar');
  }

  // Validación de fechas si se están actualizando
  if (cambios.FechaIni || cambios.FechaFin) {
    const promocionActual = await ZTPromociones.findOne({ IdPromoOK: idpromoOK });
    if (!promocionActual) throw new Error('No se encontró la promoción');

    const fechaIni = new Date(cambios.FechaIni || promocionActual.FechaIni);
    const fechaFin = new Date(cambios.FechaFin || promocionActual.FechaFin);
    
    if (fechaFin <= fechaIni) {
      throw new Error('La fecha fin debe ser posterior a la fecha inicio');
    }
  }

  // Validación de referencias si se están actualizando
  if (cambios.hasOwnProperty('SKUID') || cambios.hasOwnProperty('IdListaOK')) {
    const promocionActual = await ZTPromociones.findOne({ IdPromoOK: idpromoOK });
    if (!promocionActual) throw new Error('No se encontró la promoción');

    const nuevoSKUID = cambios.hasOwnProperty('SKUID') ? cambios.SKUID : promocionActual.SKUID;
    const nuevoIdListaOK = cambios.hasOwnProperty('IdListaOK') ? cambios.IdListaOK : promocionActual.IdListaOK;

    if (!nuevoSKUID && !nuevoIdListaOK) {
      throw new Error('Debe especificar al menos un SKUID o IdListaOK');
    }
  }

  // Agregar info de modificación
  cambios.MODDATE = new Date();
  if (req.req.body.MODUSER) {
    cambios.MODUSER = req.req.body.MODUSER;
  }

  const actualizado = await ZTPromociones.findOneAndUpdate(
    { IdPromoOK: idpromoOK },
    { $set: cambios },
    { new: true, runValidators: true }
  );

  if (!actualizado) throw new Error('No se encontró la promoción para actualizar');
  return actualizado.toObject();
}

// -----------------------------
// DELETE LOGIC
// -----------------------------
async function DeleteZTPromocionLogic(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const actualizado = await ZTPromociones.findOneAndUpdate(
    { IdPromoOK: idpromoOK },
    { $set: { ACTIVED: false, DELETED: true, MODDATE: new Date() } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la promoción para eliminar');
  return actualizado.toObject();
}

// -----------------------------
// DELETE HARD
// -----------------------------
async function DeleteZTPromocionHard(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const eliminado = await ZTPromociones.findOneAndDelete({ IdPromoOK: idpromoOK });
  if (!eliminado) throw new Error('No se encontró la promoción para eliminar');
  return { message: 'Promoción eliminada permanentemente', eliminado: eliminado.toObject() };
}

// -----------------------------
// ACTIVATE
// -----------------------------
async function ActivateZTPromocion(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const actualizado = await ZTPromociones.findOneAndUpdate(
    { IdPromoOK: idpromoOK },
    { $set: { ACTIVED: true, DELETED: false, MODDATE: new Date() } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la promoción para activar');
  return actualizado.toObject();
}

// -----------------------------
// GET PROMOCIONES BY PRODUCT
// -----------------------------
async function GetPromocionesByProduct(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  
  const now = new Date();
  return await ZTPromociones.find({
    SKUID: skuid,
    ACTIVED: true,
    DELETED: false,
    FechaIni: { $lte: now },
    FechaFin: { $gte: now }
  }).lean();
}

// -----------------------------
// GET PROMOCIONES BY LISTA
// -----------------------------
async function GetPromocionesByLista(idListaOK) {
  if (!idListaOK) throw new Error('Falta parámetro IdListaOK');
  
  const now = new Date();
  return await ZTPromociones.find({
    IdListaOK: idListaOK,
    ACTIVED: true,
    DELETED: false,
    FechaIni: { $lte: now },
    FechaFin: { $gte: now }
  }).lean();
}

// -----------------------------
// GET PROMOCIONES VIGENTES
// -----------------------------
async function GetPromocionesVigentes() {
  const now = new Date();
  return await ZTPromociones.find({
    ACTIVED: true,
    DELETED: false,
    FechaIni: { $lte: now },
    FechaFin: { $gte: now }
  }).lean();
}

// -----------------------------
// CRUD ROUTER (entrypoint para @impl)
// -----------------------------
async function ZTPromocionesCRUD(req) {
  try {
    const { procedure, type, idpromoOK, skuid, idlistaok } = req.req.query || {};
    let res;

    switch (procedure) {
      case 'get':
        switch (type) {
          case 'all':
            res = await GetAllZTPromociones();
            break;
          case 'one':
            res = await GetOneZTPromocion(idpromoOK);
            break;
          case 'by-product':
            res = await GetPromocionesByProduct(skuid);
            break;
          case 'by-lista':
            res = await GetPromocionesByLista(idlistaok);
            break;
          case 'vigentes':
            res = await GetPromocionesVigentes();
            break;
          default:
            throw new Error('Coloca un tipo de búsqueda válido (all, one, by-product, by-lista, vigentes)');
        }
        break;

      case 'post':
        res = await CreateZTPromocion(req);
        break;

      case 'put':
        res = await UpdateZTPromocion(req, idpromoOK);
        break;

      case 'delete':
        switch (type) {
          case 'logic':
            res = await DeleteZTPromocionLogic(idpromoOK);
            break;
          case 'hard':
            res = await DeleteZTPromocionHard(idpromoOK);
            break;
          default:
            throw new Error('Tipo de borrado inválido (logic o hard)');
        }
        break;

      case 'activate':
        res = await ActivateZTPromocion(idpromoOK);
        break;

      default:
        throw new Error('Parámetros inválidos o incompletos');
    }

    return res;
  } catch (error) {
    console.error('Error en ZTPromocionesCRUD:', error);
    return { error: true, message: error.message };
  }
}

module.exports = {
  ZTPromocionesCRUD,
  GetAllZTPromociones,
  GetOneZTPromocion,
  CreateZTPromocion,
  UpdateZTPromocion,
  DeleteZTPromocionLogic,
  DeleteZTPromocionHard,
  ActivateZTPromocion,
  GetPromocionesByProduct,
  GetPromocionesByLista,
  GetPromocionesVigentes
};