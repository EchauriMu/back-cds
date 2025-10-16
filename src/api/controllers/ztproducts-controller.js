const cds = require('@sap/cds');
const { ZTProductCRUD, crudZTProducts } = require('../services/ztproducts-service')

class ZTProductsService extends cds.ApplicationService {
  async init() {
      this.on('ZTProductCRUD', (req) => {
        console.log("Hola");
        return ZTProductCRUD(req);
      });

      // Nueva función con bitácora
      this.on('crudProducts', async (req) => {
        console.log("[ZTProducts Bitácora] Procesando request con bitácora");
        try {
          const resultado = await crudZTProducts(req);
          return resultado;
        } catch (error) {
          console.error("[ZTProducts Bitácora] Error:", error);
          req.error(500, `Error procesando la solicitud: ${error.message}`);
        }
      });
  }
}

module.exports = ZTProductsService;
