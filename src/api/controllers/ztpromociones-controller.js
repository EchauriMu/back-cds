const cds = require('@sap/cds');
const { ZTPromocionesCRUD, crudZTPromociones } = require('../services/ztpromociones-service');

class ZTPromocionesService extends cds.ApplicationService {
  async init() {
      this.on('promocionesCRUD', (req) => {
        console.log("Hola");
        return ZTPromocionesCRUD(req);
      });

      // Nueva función con bitácora
      this.on('crudPromociones', async (req) => {
        console.log("[ZTPromociones Bitácora] Procesando request con bitácora");
        try {
          const resultado = await crudZTPromociones(req);
          return resultado;
        } catch (error) {
          console.error("[ZTPromociones Bitácora] Error:", error);
          req.error(500, `Error procesando la solicitud: ${error.message}`);
        }
      });

      await super.init();
  }
}

module.exports = ZTPromocionesService;