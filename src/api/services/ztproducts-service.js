// Servicio para ZTPRODUCTS (productos)
const mongoose = require('mongoose');
const ZTProduct = require('../models/mongodb/ztproducts');

// GET ALL PRODUCTS
async function GetAllProducts() {

  const productos = await ZTProduct.find({ ACTIVED: true, DELETED: false }).lean();

  return productos;
}

// GET ONE PRODUCT BY SKUID
async function GetOneProduct(skuid) {
  console.log('[ZTProducts] Buscando producto por SKUID:', skuid);
  const producto = await ZTProduct.findOne({ SKUID: skuid, ACTIVED: true, DELETED: false }).lean();
  console.log('[ZTProducts] Resultado:', producto);
  return producto;
}

module.exports = {
  GetAllProducts,
  GetOneProduct
};
