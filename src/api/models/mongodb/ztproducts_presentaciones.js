// src/models/mongodb/ztproducts_presentaciones.js
import mongoose from "mongoose";

const ZTPRODUCTS_PRESENTACIONES = new mongoose.Schema(
  {
    IdPresentaOK: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    SKUID: {
      type: String,
      required: true,
      trim: true,
    },
    Descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    CostoIni: {
      type: Number,
      default: 0,
      min: 0,
    },
    CostoFin: {
      type: Number,
      default: 0,
      min: 0,
    },
    Precio: {
      type: Number,
      default: 0,
      min: 0,
    },
    Stock: {
      type: Number,
      default: 0,
      min: 0,
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
      trim: true,
    },
    REGDATE: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt (sistema)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices útiles para consultas frecuentes
ZTPRODUCTS_PRESENTACIONES.index({ SKUID: 1, ACTIVED: 1, DELETED: 1 });

// Virtual populate para traer archivos ligados a esta presentación (por IdPresentaOK)
ZTPRODUCTS_PRESENTACIONES.virtual("files", {
  ref: "ZTPRODUCTS_FILES",           // nombre del modelo de tu amigo
  localField: "IdPresentaOK",        // campo local
  foreignField: "IdPresentaOK",      // campo en ZTPRODUCTS_FILES
  justOne: false,
});

// Exporta con el NOMBRE DE MODELO que tu amigo usa en ref:
export const ZTProducts_Presentaciones = mongoose.model(
  "ZTPRODUCTS_PRESENTACIONES",       // <- ¡coincide con el ref!
  ZTPRODUCTS_PRESENTACIONES,
  "ZTPRODUCTS_PRESENTACIONES"        // nombre de la colección en Mongo
);