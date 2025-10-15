// Importar el modelo mongoose
const { ZTPrecios_ITEMS } = require('../models/mongodb/ztprecios_items');

// Obtener todos los precios
async function GetAllZTPreciosItems() {
  return await ZTPrecios_ITEMS.find().lean();
}

// Obtener un precio por ID
async function GetOneZTPreciosItem(idPrecioOK) {
  if (!idPrecioOK) throw new Error('Falta parámetro IdPrecioOK');
  const precio = await ZTPrecios_ITEMS.findOne({ IdPrecioOK: idPrecioOK }).lean();
  if (!precio) throw new Error('No se encontró el precio');
  return precio;
}

// Crear un nuevo precio
async function CreateZTPreciosItem(req) {
  const data = req.req.body;
  if (!data.IdPrecioOK || !data.IdListaOK || !data.SKUID || !data.IdPresentaOK || !data.Precio || !data.REGUSER) {
    throw new Error('Faltan campos obligatorios');
  }

  const existe = await ZTPrecios_ITEMS.findOne({ IdPrecioOK: data.IdPrecioOK });
  if (existe) throw new Error('Ya existe un precio con ese IdPrecioOK');

  const nuevo = await ZTPrecios_ITEMS.create(data);
  return nuevo.toObject();
}

// Actualizar un precio existente
async function UpdateZTPreciosItem(req, idPrecioOK) {
  if (!idPrecioOK) throw new Error('Falta parámetro IdPrecioOK');
  const cambios = req.req.body;
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');

  const actualizado = await ZTPrecios_ITEMS.findOneAndUpdate(
    { IdPrecioOK: idPrecioOK },
    { $set: cambios },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró el precio para actualizar');
  return actualizado.toObject();
}

// Borrado lógico
async function DeleteZTPreciosItemLogic(idPrecioOK) {
  if (!idPrecioOK) throw new Error('Falta parámetro IdPrecioOK');

  const actualizado = await ZTPrecios_ITEMS.findOneAndUpdate(
    { IdPrecioOK: idPrecioOK },
    { $set: { ACTIVED: false, DELETED: true } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró el precio para borrar');
  return actualizado.toObject();
}

// Borrado físico
async function DeleteZTPreciosItemHard(idPrecioOK) {
  if (!idPrecioOK) throw new Error('Falta parámetro IdPrecioOK');

  const eliminado = await ZTPrecios_ITEMS.findOneAndDelete({ IdPrecioOK: idPrecioOK });
  if (!eliminado) throw new Error('No se encontró el precio para eliminar');

  return { mensaje: 'Precio eliminado permanentemente' };
}

// Activar un precio previamente desactivado
async function ActivateZTPreciosItem(idPrecioOK) {
  if (!idPrecioOK) throw new Error('Falta parámetro IdPrecioOK');

  const actualizado = await ZTPrecios_ITEMS.findOneAndUpdate(
    { IdPrecioOK: idPrecioOK },
    { $set: { ACTIVED: true, DELETED: false } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró el precio para activar');
  return actualizado.toObject();
}

// CRUD principal para manejar procedimientos
async function ZTPreciosItemsCRUD(req) {
  try {
    const { procedure, type, idPrecioOK } = req.req.query;
    let res;

    if (procedure === 'get') {
      if (type === 'all') {
        res = await GetAllZTPreciosItems();
      } else if (type === 'one') {
        res = await GetOneZTPreciosItem(idPrecioOK);
      } else {
        throw new Error('Coloca un tipo de búsqueda válido (all o one)');
      }
    } else if (procedure === 'post') {
      res = await CreateZTPreciosItem(req);
    } else if (procedure === 'put') {
      res = await UpdateZTPreciosItem(req, idPrecioOK);
    } else if (procedure === 'delete') {
      if (type === 'logic') {
        res = await DeleteZTPreciosItemLogic(idPrecioOK);
      } else if (type === 'hard') {
        res = await DeleteZTPreciosItemHard(idPrecioOK);
      } else {
        throw new Error('Tipo de borrado inválido (logic o hard)');
      }
    } else if (procedure === 'activate') {
      res = await ActivateZTPreciosItem(idPrecioOK);
    } else {
      throw new Error('Parámetros inválidos o incompletos');
    }

    return res;
  } catch (error) {
    console.error('Error en ZTPreciosItemsCRUD:', error);
    return { error: true, message: error.message };
  }
}

module.exports = {
  ZTPreciosItemsCRUD,
  GetAllZTPreciosItems,
  GetOneZTPreciosItem,
  CreateZTPreciosItem,
  UpdateZTPreciosItem,
  DeleteZTPreciosItemLogic,
  DeleteZTPreciosItemHard,
  ActivateZTPreciosItem
};
