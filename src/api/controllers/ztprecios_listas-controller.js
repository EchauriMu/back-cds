const cds = require('@sap/cds');
const { ZTPreciosListasCRUD } = require('../services/ztprecios_listas-service');

class ZTPreciosListasService extends cds.ApplicationService {
  async init() {

    this.on('preciosListasCRUD', async (req) => {
      try {
        // 1. Obtener ProcessType del query string
        const ProcessType = req.req?.query?.ProcessType;

        // 2. Ejecutar la lógica de negocio
        const result = await ZTPreciosListasCRUD(req);

        // 3. Si el resultado no es exitoso, establecer el status HTTP de error
        if (!result.success && req.http?.res) {
          req.http.res.status(result.status || 500);
        }
        // 4. Si es exitoso y es un AddOne, establecer status 201 y header Location
        else if (ProcessType === 'AddOne' && result.success && req.http?.res) {
          req.http.res.status(201);
          const idLista = result.dataRes?.IDLISTAOK || '';
          if (idLista) {
            req.http.res.set('Location', `/api/ztprecios-listas/ZTPreciosListas('${idLista}')`);
          }
          return req.http.res.send(result);
        }

        // 5. Retornar el resultado para que CAP lo envíe como respuesta
        return result;

      } catch (error) {
        req.error(error.code || 500, error.message);
      }
    });

    return super.init();
  }
}

module.exports = ZTPreciosListasService;
