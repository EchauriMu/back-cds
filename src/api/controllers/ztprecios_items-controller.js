const cds = require('@sap/cds');
const { ZTPreciosItemsCRUD } = require('../services/ztprecios_items-service');

class ZTPreciosItemsService extends cds.ApplicationService {
  async init() {
    this.on('preciosItemsCRUD', (req) => {
      return ZTPreciosItemsCRUD(req);
    });
  }
}

module.exports = ZTPreciosItemsService;
