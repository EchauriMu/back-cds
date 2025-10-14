const cds = require('@sap/cds');
const { ZTProductFilesCRUD } = require('../services/ztproducts_files-service');

class ZTProductFilesService extends cds.ApplicationService {
  async init() {
    this.on('productsCRUD', (req) => {
      return ZTProductFilesCRUD(req);
    });
  }
}

module.exports = ZTProductFilesService;
