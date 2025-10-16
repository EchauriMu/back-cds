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
      ref: "ZTPRODUCTS", // referencia a productos base
    },
    Descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    CostoIni: {
      type: Number,
      required: true,
      default: 0,
    },
    CostoFin: {
      type: Number,
      required: true,
      default: 0,
    },
    Precio: {
      type: Number,
      required: true,
      default: 0,
    },
    Stock: {
      type: Number,
      required: true,
      default: 0,
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
      default: null,
    },
    MODDATE: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const ZTProducts_Presentaciones = mongoose.model(
  "ZTPRODUCTS_PRESENTACIONES",
  ZTPRODUCTS_PRESENTACIONES,
  "ZTPRODUCTS_PRESENTACIONES"
);
