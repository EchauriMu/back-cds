import mongoose from "mongoose";

const ZTPRECIOS_ITEMS = new mongoose.Schema(
  {
    IdPrecioOK: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    IdListaOK: {
      type: String,
      ref: "ZTPRECIOS_LISTAS",
      required: true,
      trim: true,
    },
    SKUID: {
      type: String,
      ref: "ZTPRODUCTS",
      required: true,
      trim: true,
    },
    IdPresentaOK: {
      type: String,
      ref: "ZTPRODUCTS_PRESENTACIONES",
      required: true,
      trim: true,
    },
    IdTipoFormulaOK: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    Formula: {
      type: String,
      required: false,
      default: "",
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

export const ZTPrecios_ITEMS = mongoose.model(
  "ZTPRECIOS_ITEMS",
  ZTPRECIOS_ITEMS,
  "ZTPRECIOS_ITEMS"
);
