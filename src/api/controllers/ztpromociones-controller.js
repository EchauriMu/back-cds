const cds = require('@sap/cds');
const { ZTPromocionesCRUD } = require('../services/ztpromociones-service');

class ZTPromocionesService extends cds.ApplicationService {
  async init() {
    this.on('promocionesCRUD', (req) => {
      return ZTPromocionesCRUD(req);
    });

    this.on('promocionesCRUD', (req) => {
      return ZTPromocionesCRUD(req);
    });

    await super.init();
  }
}

module.exports = ZTPromocionesService;