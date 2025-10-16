// Importar el modelo de Mongoose que representa la colección en MongoDB
const ZTPreciosListas = require('../models/mongodb/ztprecios_listas');


// ==============================
// GET ALL - Obtener todas las listas activas y no eliminadas
// ==============================
async function GetAllZTPreciosListas() {
  return await ZTPreciosListas.find({ ACTIVED: true, DELETED: false }).lean();
}


// ==============================
// GET ONE - Obtener una lista específica por su IDLISTAOK
// ==============================
async function GetOneZTPrecioLista(IDLISTAOK) {
  if (!IDLISTAOK) throw new Error('Falta parámetro IDLISTAOK');

  const item = await ZTPreciosListas.findOne({ 
    IDLISTAOK,
    ACTIVED: true, 
    DELETED: false 
  }).lean();

  if (!item) throw new Error('No se encontró la lista');

  return item;
}


// ==============================
// CREATE - Crear una nueva lista
// ==============================
async function CreateZTPrecioLista(req) {
  const data = req.req.body || {};

  // Validación de campos obligatorios
  if (!data.IDLISTAOK || !data.DESLISTA || !data.FECHAEXPIRAINI || !data.FECHAEXPIRAFIN || !data.REGUSER) {
    throw new Error('Faltan campos obligatorios (IDLISTAOK, DESLISTA, FECHAEXPIRAINI, FECHAEXPIRAFIN, REGUSER)');
  }

  // Validación de fechas
  const fechaIni = new Date(data.FECHAEXPIRAINI);
  const fechaFin = new Date(data.FECHAEXPIRAFIN);
  if (fechaFin <= fechaIni) {
    throw new Error('La fecha fin debe ser posterior a la fecha inicio');
  }

  // Validar que no exista una lista con el mismo ID
  const existe = await ZTPreciosListas.findOne({ IDLISTAOK: data.IDLISTAOK });
  if (existe) throw new Error('Ya existe una lista con ese IDLISTAOK');

  // Establecer campos de sistema por defecto
  data.REGDATE = new Date();
  data.ACTIVED = data.ACTIVED !== undefined ? data.ACTIVED : true;
  data.DELETED = data.DELETED !== undefined ? data.DELETED : false;

  // Crear y devolver el objeto creado
  const nueva = await ZTPreciosListas.create(data);
  return nueva.toObject();
}


// ==============================
// UPDATE - Actualizar una lista existente
// ==============================
async function UpdateZTPrecioLista(req, IDLISTAOK) {
  if (!IDLISTAOK) throw new Error('Falta parámetro IDLISTAOK');

  const cambios = req.req.body;

  if (!cambios || Object.keys(cambios).length === 0) {
    throw new Error('No se enviaron datos para actualizar');
  }

  // Validar fechas si se están actualizando
  if (cambios.FECHAEXPIRAINI || cambios.FECHAEXPIRAFIN) {
    const actual = await ZTPreciosListas.findOne({ IDLISTAOK });
    if (!actual) throw new Error('No se encontró la lista');

    const fechaIni = new Date(cambios.FECHAEXPIRAINI || actual.FECHAEXPIRAINI);
    const fechaFin = new Date(cambios.FECHAEXPIRAFIN || actual.FECHAEXPIRAFIN);
    if (fechaFin <= fechaIni) {
      throw new Error('La fecha fin debe ser posterior a la fecha inicio');
    }
  }

  // Establecer usuario y fecha de modificación
  cambios.MODDATE = new Date();
  if (req.req.body.MODUSER) {
    cambios.MODUSER = req.req.body.MODUSER;
  }

  // Actualizar la lista
  const actualizado = await ZTPreciosListas.findOneAndUpdate(
    { IDLISTAOK },
    { $set: cambios },
    { new: true, runValidators: true }
  );

  if (!actualizado) throw new Error('No se encontró la lista para actualizar');

  return actualizado.toObject();
}


// ==============================
// DELETE LOGIC - Borrado lógico (no elimina, solo marca como inactiva y eliminada)
// ==============================
async function DeleteZTPrecioListaLogic(IDLISTAOK) {
  if (!IDLISTAOK) throw new Error('Falta parámetro IDLISTAOK');

  const actualizado = await ZTPreciosListas.findOneAndUpdate(
    { IDLISTAOK },
    { $set: { ACTIVED: false, DELETED: true, MODDATE: new Date() } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la lista para eliminar');

  return actualizado.toObject();
}


// ==============================
// DELETE HARD - Eliminación permanente de la lista
// ==============================
async function DeleteZTPrecioListaHard(IDLISTAOK) {
  if (!IDLISTAOK) throw new Error('Falta parámetro IDLISTAOK');

  const eliminado = await ZTPreciosListas.findOneAndDelete({ IDLISTAOK });

  if (!eliminado) throw new Error('No se encontró la lista para eliminar');

  return { message: 'Lista eliminada permanentemente', eliminado: eliminado.toObject() };
}


// ==============================
// ACTIVATE - Reactivar una lista eliminada lógicamente
// ==============================
async function ActivateZTPrecioLista(IDLISTAOK) {
  if (!IDLISTAOK) throw new Error('Falta parámetro IDLISTAOK');

  const actualizado = await ZTPreciosListas.findOneAndUpdate(
    { IDLISTAOK },
    { $set: { ACTIVED: true, DELETED: false, MODDATE: new Date() } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la lista para activar');

  return actualizado.toObject();
}


// ==============================
// GET VIGENTES - Listas dentro del rango de fechas válidas
// ==============================
async function GetZTPreciosListasVigentes() {
  const now = new Date();
  return await ZTPreciosListas.find({
    ACTIVED: true,
    DELETED: false,
    FECHAEXPIRAINI: { $lte: now },
    FECHAEXPIRAFIN: { $gte: now }
  }).lean();
}


// ==============================
// CRUD ENTRY POINT - Se conecta al controlador y ejecuta funciones según el query
// ==============================
async function ZTPPreciosListasCRUD(req) {
  try {
    const { procedure, type, idlistaok } = req.req.query || {};
    let resultado;

    // Aquí se direcciona cada llamada al método correspondiente según los parámetros
    if (procedure === 'get' && type === 'all') {
      resultado = await GetAllZTPreciosListas();
    } else if (procedure === 'get' && type === 'one') {
      resultado = await GetOneZTPrecioLista(idlistaok);
    } else if (procedure === 'get' && type === 'vigentes') {
      resultado = await GetZTPreciosListasVigentes();
    } else if (procedure === 'post') {
      resultado = await CreateZTPrecioLista(req);
    } else if (procedure === 'put') {
      resultado = await UpdateZTPrecioLista(req, idlistaok);
    } else if (procedure === 'delete' && type === 'logic') {
      resultado = await DeleteZTPrecioListaLogic(idlistaok);
    } else if (procedure === 'delete' && type === 'hard') {
      resultado = await DeleteZTPrecioListaHard(idlistaok);
    } else if (procedure === 'activate') {
      resultado = await ActivateZTPrecioLista(idlistaok);
    } else {
      throw new Error('Parámetros inválidos o incompletos');
    }

    return resultado;

  } catch (error) {
    console.error('Error en ZTPPreciosListasCRUD:', error);
    return { error: true, message: error.message };
  }
}


// Exportar todas las funciones del servicio para que puedan usarse desde el controlador
module.exports = {
  ZTPPreciosListasCRUD,
  GetAllZTPreciosListas,
  GetOneZTPrecioLista,
  CreateZTPrecioLista,
  UpdateZTPrecioLista,
  DeleteZTPrecioListaLogic,
  DeleteZTPrecioListaHard,
  ActivateZTPrecioLista,
  GetZTPreciosListasVigentes
};
