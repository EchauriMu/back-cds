// Importar el modelo mongoose
const { ZTProducts_Presentaciones } = require('../models/mongodb/ztproducts_presentaciones');

/* =========================
   QUERIES BÁSICAS
   ========================= */
async function GetAllZTProductsPresentaciones() {
  return await ZTProducts_Presentaciones.find().lean();
}

async function GetOneZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const doc = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: idpresentaok }).lean();
  if (!doc) throw new Error('No se encontró la presentación');
  return doc;
}

/* =========================
   CREATE / UPDATE / DELETE
   ========================= */
async function CreateZTProductsPresentacion(req) {
  const data = req.req.body || {};

  // Campos obligatorios mínimos
  const required = ['IdPresentaOK', 'SKUID', 'Descripcion', 'Precio', 'REGUSER'];
  const missing = required.filter((k) => data[k] === undefined || data[k] === null || data[k] === '');
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);

  // Evitar duplicados por IdPresentaOK
  const exists = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: data.IdPresentaOK });
  if (exists) throw new Error('Ya existe una presentación con ese IdPresentaOK');

  // Defaults suaves por si no vienen
  data.CostoIni = data.CostoIni ?? 0;
  data.CostoFin = data.CostoFin ?? 0;
  data.Stock    = data.Stock ?? 0;
  data.ACTIVED  = data.ACTIVED ?? true;
  data.DELETED  = data.DELETED ?? false;
  data.REGDATE  = data.REGDATE ?? new Date();

  const nuevo = await ZTProducts_Presentaciones.create(data);
  return nuevo.toObject();
}

async function UpdateZTProductsPresentacion(req, idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const cambios = req.req.body;
  if (!cambios || Object.keys(cambios).length === 0) {
    throw new Error('No se enviaron datos para actualizar');
  }

  // Sello de modificación
  cambios.MODDATE = new Date();

  const actualizado = await ZTProducts_Presentaciones.findOneAndUpdate(
    { IdPresentaOK: idpresentaok },
    { $set: cambios },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la presentación para actualizar');
  return actualizado.toObject();
}

async function DeleteZTProductsPresentacionLogic(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const actualizado = await ZTProducts_Presentaciones.findOneAndUpdate(
    { IdPresentaOK: idpresentaok },
    { $set: { ACTIVED: false, DELETED: true, MODDATE: new Date() } },
    { new: true }
  );
  if (!actualizado) throw new Error('No se encontró la presentación para borrar (lógico)');
  return actualizado.toObject();
}

async function DeleteZTProductsPresentacionHard(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const eliminado = await ZTProducts_Presentaciones.findOneAndDelete({ IdPresentaOK: idpresentaok });
  if (!eliminado) throw new Error('No se encontró la presentación para eliminar');
  return { mensaje: 'Presentación eliminada permanentemente' };
}

async function ActivateZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const actualizado = await ZTProducts_Presentaciones.findOneAndUpdate(
    { IdPresentaOK: idpresentaok },
    { $set: { ACTIVED: true, DELETED: false, MODDATE: new Date() } },
    { new: true }
  );
  if (!actualizado) throw new Error('No se encontró la presentación para activar');
  return actualizado.toObject();
}

/* =========================
   ORQUESTADOR (CAP Action)
   ========================= */
// Uso (ejemplos):
// GET ALL:
// POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=get&type=all
// GET ONE:
// POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=get&type=one&idpresentaok=ID123
// CREATE:
// POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=post
// UPDATE:
// POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=put&idpresentaok=ID123
// DELETE LOGIC:
// POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=delete&type=logic&idpresentaok=ID123
// DELETE HARD:
// POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=delete&type=hard&idpresentaok=ID123
// ACTIVATE:
// POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=activate&idpresentaok=ID123

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
  ActivateZTProductsPresentacion
};
