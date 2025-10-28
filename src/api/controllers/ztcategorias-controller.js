const cds = require("@sap/cds");
const { ZTCategoriasCRUD } = require("../services/ztcategorias-service");

class ZTCategoriasService extends cds.ApplicationService {
  async init() {
    this.on("categoriasCRUD", async (req) => {
      try {
        // Obtener ProcessType (case-insensitive)
        const ProcessType = (req.req?.query?.ProcessType || "").toString();
        const procNorm = ProcessType.toLowerCase();

        // Ejecutar la lógica de negocio
        const result = await ZTCategoriasCRUD(req);

        // Si no hay objeto de respuesta HTTP (CAP internal), devolver el resultado
        if (!req.http?.res) {
          return result;
        }

        // Determinar código HTTP a usar
        const statusCode = result?.status || (result?.success ? 200 : 500);

        // Si fallo, devolver con status de error
        if (!result?.success) {
          req.http.res.status(statusCode).send(result);
          return;
        }

        // Si fue AddOne -> 201 + Location header (si se puede obtener CATID)
        if (procNorm === "addone") {
          req.http.res.status(201);
          const catID =
            result?.dataRes?.data?.CATID ||
            result?.dataRes?.CATID ||
            result?.dataRes?.data?.catid ||
            result?.dataRes?.catid ||
            "";
          if (catID) {
            req.http.res.set("Location", `/api/ztcategorias/Categorias('${catID}')`);
          }
          req.http.res.send(result);
          return;
        }

        // Para éxitos generales, devolver con status apropiado (200 por defecto)
        req.http.res.status(statusCode).send(result);
        return;
      } catch (error) {
        // Manejo de excepción consistente con CAP
        req.error(error.code || 500, error.message);
      }
    });

    return super.init();
  }
}

module.exports = ZTCategoriasService;
