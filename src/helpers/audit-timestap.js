// helpers/audit-timestap.js
/**
 * Actualiza o crea un documento en Mongo con campos de auditoría.
 * @param {mongoose.Model} model - Modelo de Mongoose
 * @param {Object} filter - Filtro para encontrar el documento
 * @param {Object} data - Datos a guardar
 * @param {String} user - Usuario que realiza la acción
 * @param {String} action - CREATE o UPDATE
 * @returns {Promise<Object>} Documento actualizado o creado
 */
async function saveWithAudit(model, filter, data, user, action) {
  const now = new Date();

  if (action === 'CREATE') {
    const newDoc = new model({
      ...data,
      REGUSER: user,
      REGDATE: now,
    });
    await newDoc.save();
    return newDoc.toObject();
  }

  if (action === 'UPDATE') {
    const updatedDoc = await model.findOneAndUpdate(
      filter,
      {
        ...data,
        MODUSER: user,
        MODDATE: now,
      },
      { new: true, upsert: false }
    );
    if (!updatedDoc) throw new Error('Documento no encontrado para actualizar');
    return updatedDoc.toObject();
  }

  throw new Error('Acción no soportada: ' + action);
}

module.exports = { saveWithAudit };
