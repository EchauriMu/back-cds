const cds = require('@sap/cds');
const { GetAllProducts, GetOneProduct } = require('../services/ztproducts-service');

class ZTProductsService extends cds.ApplicationService {
  async init() {
    // GET ALL PRODUCTS
    this.on('getAllProducts', async (req) => {
      return GetAllProducts();
    });
    // GET ONE PRODUCT BY SKUID
    this.on('getOneProduct', async (req) => {
      const { skuid } = req.data;
      return GetOneProduct(skuid);
    });
  }
}

module.exports = ZTProductsService;
