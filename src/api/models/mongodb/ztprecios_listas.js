const mongoose = require("mongoose");

// ============================================
// ESQUEMA DE HISTORIAL DE MODIFICACIONES
// ============================================
const ModificationSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    date: { type: Date, default: Date.now },
    action: { type: String, enum: ["CREATE", "UPDATE", "DELETE"], required: true },
    changes: { type: Object, default: {} },
  },
  { _id: false }
);

// ============================================
// ESQUEMA PRINCIPAL: ZTPRECIOS_LISTAS
// ============================================
const ZTPRECIOS_LISTAS = new mongoose.Schema({
  IDLISTAOK: { type: String, required: true, unique: true, trim: true },
  IDINSTITUTOOK: { type: String, trim: true },
  IDLISTABK: { type: String, trim: true },

  SKUSIDS: { type: [String], default: [] },

  DESLISTA: { type: String, required: true, trim: true },
  FECHAEXPIRAINI: { type: Date, required: true },
  FECHAEXPIRAFIN: { type: Date, required: true },
  IDTIPOLISTAOK: { type: String, trim: true },
  IDTIPOGENERALISTAOK: { type: String, trim: true },
  IDTIPOFORMULAOK: { type: String, trim: true },
  REGUSER: { type: String, required: true },
  REGDATE: { type: Date, default: Date.now },
  MODUSER: { type: String },
  MODDATE: { type: Date },
  ACTIVED: { type: Boolean, default: true },
  DELETED: { type: Boolean, default: false },
  HISTORY: [ModificationSchema],
});

// ============================================
// MIDDLEWARE PARA GUARDAR HISTORIAL DE CAMBIOS
// ============================================
ZTPRECIOS_LISTAS.pre("save", function (next) {
  const doc = this;

  if (doc.isNew) {
    doc.HISTORY.push({
      user: doc.REGUSER,
      action: "CREATE",
      changes: doc.toObject(),
    });
  } else {
    const modifiedFields = doc.modifiedPaths().reduce((acc, path) => {
      if (!["HISTORY", "MODUSER", "MODDATE"].includes(path)) {
        acc[path] = doc.get(path);
      }
      return acc;
    }, {});

    if (Object.keys(modifiedFields).length > 0) {
      doc.MODDATE = new Date();
      doc.HISTORY.push({
        user: doc.MODUSER || "system",
        action: "UPDATE",
        changes: modifiedFields,
      });
    }
  }

  next();
});

// ============================================
// EXPORTACIÓN DEL MODELO (CommonJS)
// ============================================
module.exports = mongoose.model("ZTPRECIOS_LISTAS", ZTPRECIOS_LISTAS, "ZTPRECIOS_LISTAS");
