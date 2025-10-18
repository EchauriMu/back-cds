import mongoose from "mongoose";

const ZTPRODUCTS_FILES = new mongoose.Schema(
  {
    FILEID: {
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
    IdPresentaOK: {
      type: String,
      ref: "ZTPRODUCTS_PRESENTACIONES",
      default: null,
    },
    FILETYPE: {
      type: String,
      enum: ["IMG", "PDF", "DOC", "VIDEO", "OTHER"],
      required: true,
    },
    FILE: {
      type: String,
      required: true,
    },
    PRINCIPAL: {
      type: Boolean,
      default: false,
    },
    INFOAD: {
      type: String,
      default: "",
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
    ACTIVED: {
      type: Boolean,
      default: true,
    },
    DELETED: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ZTProduct_FILES = mongoose.model('ZTPRODUCTS_FILES', ZTPRODUCTS_FILES, 'ZTPRODUCTS_FILES');
