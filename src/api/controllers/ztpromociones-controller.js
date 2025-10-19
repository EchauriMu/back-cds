const cds = require('@sap/cds');
const { crudZTPromociones, ZTPromocionesCRUD } = require('../services/ztpromociones-service');

/**
 * Controller de Promociones - SAP CAP
 * 
 * Endpoints:
 * - crudPromociones: Endpoint estándar con bitácora completa
 * - promocionesCRUD: Legacy (deprecado)
 */
class ZTPromocionesService extends cds.ApplicationService {
  async init() {
      
      /**
       * Endpoint Principal: POST /api/ztpromociones/crudPromociones
       * Parámetros: ?ProcessType=GetFilters&LoggedUser=jlopezm
       */
      this.on('crudPromociones', async (req) => {
        try {
          const ProcessType = req.req?.query?.ProcessType;
          
          // Debug: Log request structure for AddMany operations
          if (ProcessType === 'AddMany') {
            console.log('[DEBUG] Request data:', JSON.stringify(req.data, null, 2));
            console.log('[DEBUG] Request body:', JSON.stringify(req.req?.body, null, 2));
          }
          
          // Ejecutar servicio
          const result = await crudZTPromociones(req);

          // Establecer status HTTP
          if (!result.success && req.http?.res) {
            req.http.res.status(result.status || 500);
          } 
          else if (ProcessType === 'AddMany' && result.success && req.http?.res) {
            req.http.res.status(201);
            const promoCount = result.dataRes?.length || result.countDataRes || 0;
            if (promoCount > 0) {
              req.http.res.set('X-Created-Count', promoCount.toString());
            }
          }
          
          return result;
          
        } catch (error) {
          req.error(error.code || 500, error.message);
        }
      });

      /**
       * Endpoint Legacy (deprecado)
       * ADVERTENCIA: Migre a 'crudPromociones'
       */
      this.on('promocionesCRUD', async (req) => {
        console.warn("[LEGACY] Use 'crudPromociones' en lugar de 'promocionesCRUD'");
        
        try {
          const resultado = await ZTPromocionesCRUD(req);
          
          if (resultado && typeof resultado === 'object') {
            resultado._deprecated = true;
            resultado._migration_info = "Use 'crudPromociones' con ProcessType";
            resultado._new_endpoint = "/api/ztpromociones/crudPromociones";
          }
          
          return resultado;
          
        } catch (error) {
          console.error("[LEGACY] Error:", error.message);
          req.error(error.code || 500, error.message);
        }
      });

      return super.init();
  }
}

module.exports = ZTPromocionesService;