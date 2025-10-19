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
          // 1. Obtener ProcessType del query string
          const ProcessType = req.req?.query?.ProcessType;
          
          // 2. Ejecutar la lógica de negocio
          const result = await crudZTPromociones(req);

          // 3. Si el resultado no es exitoso, establecer el status HTTP de error
          if (!result.success && req.http?.res) {
            req.http.res.status(result.status || 500);
          } 
          // 4. Si es exitoso y es un AddMany, establecer status 201 y header
          else if (ProcessType === 'AddMany' && result.success && req.http?.res) {
            req.http.res.status(201);
            const promoCount = result.dataRes?.length || result.countDataRes || 0;
            if (promoCount > 0) {
              req.http.res.set('X-Created-Count', promoCount.toString());
            }
          }
          
          // 5. Retornar el resultado para que CAP lo envíe como respuesta
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