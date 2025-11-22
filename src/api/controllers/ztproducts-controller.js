const cds = require('@sap/cds');
const { crudZTProducts } = require('../services/ztproducts-service');

class ZTProductsService extends cds.ApplicationService {
  async init() {
    this.on('crudProducts', async (req) => {
      console.log('\n[DEBUG] ztproducts-controller.js -> Inicia "crudProducts"');
      try {
        console.log('[DEBUG] ztproducts-controller.js -> req.data:', JSON.stringify(req.data, null, 2));
        console.log('[DEBUG] ztproducts-controller.js -> req.req.body:', JSON.stringify(req.req?.body, null, 2));
        console.log('[DEBUG] ztproducts-controller.js -> req.req.query:', JSON.stringify(req.req?.query, null, 2));

        // Ejecutar la lógica de negocio. El servicio se encargará de leer los parámetros desde req.data
        const result = await crudZTProducts(req);
        console.log('[DEBUG] ztproducts-controller.js -> Resultado del servicio:', JSON.stringify(result, null, 2));

        // Si el servicio ya manejó un error (FAIL), CAP lo propagará.
        if (result?.finalRes && !result?.success) {
          console.log('[DEBUG] ztproducts-controller.js -> El servicio manejó un error. Retornando.');
          return;
        }

        // Para respuestas exitosas, usamos req.reply() para que CAP las maneje correctamente.
        console.log('[DEBUG] ztproducts-controller.js -> Respondiendo con éxito.');
        return req.reply(result);

      } catch (error) {
        req.error(error.code || 500, error.message);
      }
    });

    return super.init();
  }
}

module.exports = ZTProductsService;
