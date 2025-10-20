// controllers/ztproducts_presentaciones-controller.js
const cds = require('@sap/cds');
const { ZTProductsPresentacionesCRUD } = require('../services/ztproducts_presentaciones-service');

class ZTProductsPresentacionesService extends cds.ApplicationService {
  async init() {

    this.on('productsPresentacionesCRUD', async (req) => {
      try {
        // 1) Obtener ProcessType del query string (?ProcessType=AddOne|GetAll|UpdateOne|...)
        const ProcessType = req.req?.query?.ProcessType;

        // 2) Ejecutar la lógica de negocio en el service
        const result = await ZTProductsPresentacionesCRUD(req);

        // 3) Si hubo error lógico, propagar HTTP status adecuado
        if (!result.success && req.http?.res) {
          req.http.res.status(result.status || 500);
        }
        // 4) Si es exitoso y es un AddOne => 201 + Location y responder manualmente
        else if (ProcessType === 'AddOne' && result.success && req.http?.res) {
          req.http.res.status(201);

          // === Construir Location con la clave primaria de Presentaciones ===
          // Tu PK es IdPresentaOK. Ajusta el "path" y "entity set" si en tu CDS difieren.
          // Ejemplos de dónde podría venir la PK en tu resultado:
          const idPresenta =
            result?.dataRes?.presentacion?.IdPresentaOK ||
            result?.dataRes?.IdPresentaOK ||
            result?.presentacion?.IdPresentaOK ||
            result?.IdPresentaOK ||
            '';

          if (idPresenta) {
            // IMPORTANTE: ajusta el entity set si en tu servicio es distinto.
            // Si tu entity set se llama "Presentaciones", podrías usar:
            // `/api/ztproducts-presentaciones/Presentaciones('${idPresenta}')`
            // Aquí seguimos el patrón del ejemplo de tu amigo:
            req.http.res.set('Location', `/api/ztproducts-presentaciones/ZTProductsPresentaciones('${idPresenta}')`);
          }

          // Enviar la respuesta manualmente y cortar el flujo CAP
          return req.http.res.send(result);
        }

        // 5) Retornar el resultado para que CAP lo serialice
        return result;

      } catch (error) {
        // Envía error CAP con código si existe
        req.error(error.code || 500, error.message);
      }
    });

    return super.init();
  }
}

module.exports = ZTProductsPresentacionesService;
