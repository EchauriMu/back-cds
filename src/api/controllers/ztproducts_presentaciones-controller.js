const cds = require('@sap/cds');
const { ZTProductsPresentacionesCRUD } = require('../services/ztproducts_presentaciones-service');

class ZTProductsPresentacionesService extends cds.ApplicationService {
  async init() {
    this.on('productsPresentacionesCRUD', (req) => {
      return ZTProductsPresentacionesCRUD(req);
    });
  }
}

module.exports = ZTProductsPresentacionesService;
