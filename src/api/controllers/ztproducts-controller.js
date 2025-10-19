const cds = require('@sap/cds');
const { crudZTProducts } = require('../services/ztproducts-service')

class ZTProductsService extends cds.ApplicationService {
  async init() {
      this.on('crudProducts', async (req) => {
        try {
          return crudZTProducts(req);
        } catch (error) {
          console.error("[ZTProducts Bitácora] Error:", error);
          req.error(500, `Error procesando la solicitud: ${error.message}`);
        }
      });
  }
}

module.exports = ZTProductsService;
