const cds = require('@sap/cds');
const { ZTProductCRUD } = require('../services/ztproducts-service')

class ZTProductsService extends cds.ApplicationService {
  async init() {
      this.on('ZTProductCRUD', (req) => {
        console.log("Hola");
        return ZTProductCRUD(req);
      });
  }
}

module.exports = ZTProductsService;
