const cds = require('@sap/cds');
const { ZTPPreciosListasCRUD } = require('../services/ztprecios_listas-service');

class ZTPPreciosListasService extends cds.ApplicationService {
  async init() {
    this.on('preciosListasCRUD', (req) => {
      return ZTPPreciosListasCRUD(req);
    });
  }
}

module.exports = ZTPPreciosListasService;
