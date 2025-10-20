const cds = require('@sap/cds');
const { crudZTProducts } = require('../services/ztproducts-service')

class ZTProductsService extends cds.ApplicationService {
  async init() {
      this.on('crudProducts', async (req) => {
        try {                                                          
          // 1. Obtener ProcessType del query string
          const ProcessType = req.req?.query?.ProcessType;
          // 2. Ejecutar la lógica de negocio
          const result = await crudZTProducts(req);

          // 3. Si el resultado no es exitoso, establecer el status HTTP de error
          if (!result.success && req.http?.res) {
            req.http.res.status(result.status || 500);
          } 
          // 4. Si es exitoso y es un AddOne, establecer status 201 y header Location
          else if (ProcessType === 'AddOne' && result.success && req.http?.res) {
            req.http.res.status(201);
            // Construir el header Location usando el SKUID del resultado
            const skuid = result.dataRes?.data?.SKUID || '';
            if (skuid) {
              req.http.res.set('Location', `/api/ztproducts/ZTProducts('${skuid}')`);
            }
            // Envía la respuesta manualmente y termina para que CAP no la procese de nuevo.
            return req.http.res.send(result);
          }
          // 5. Retornar el resultado para que CAP lo envíe como respuesta.
          return result;
        } catch (error) {
          req.error(error.code || 500, error.message);
        }
      });

      return super.init();
  }
}

module.exports = ZTProductsService;
