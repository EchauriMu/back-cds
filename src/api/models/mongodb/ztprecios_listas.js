import mongoose from "mongoose";

const ZTPRECIOS_LISTAS = new mongoose.Schema(
  {
    IDLISTAOK: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    IDINSTITUTOOK: {
      type: String,
      trim: true,
    },
    IDLISTABK: {
      type: String,
      trim: true,
    },
    DESLISTA: {
      type: String,
      required: true,
      trim: true,
    },
    FECHAEXPIRAINI: {
      type: Date,
      required: true,
    },
    FECHAEXPIRAFIN: {
      type: Date,
      required: true,
    },
    IDTIPOLISTAOK: {
      type: String,
      trim: true,
    },
    IDTIPOGENERALISTAOK: {
      type: String,
      trim: true,
    },
    IDTIPOFORMULAOK: {
      type: String,
      trim: true,
    },
    ACTIVED: {
      type: Boolean,
      default: true,
    },
    DELETED: {
      type: Boolean,
      default: false,
    },
    REGUSER: {
      type: String,
      required: true,
    },
    REGDATE: {
      type: Date,
      default: Date.now,
    },
    MODUSER: {
      type: String,
    },
    MODDATE: {
      type: Date,
    },
    CREATEDAT: {
      type: Date,
    },
    UPDATEDAT: {
      type: Date,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticos
  }
);


export const ZTPrecios_Listas = mongoose.model(
  "ZTPRECIOS_LISTAS",        // Nombre lógico del modelo
  ZTPRECIOS_LISTAS,          // Esquema definido arriba
  "ZTPRECIOS_LISTAS"         // Nombre exacto de la colección en MongoDB
);
