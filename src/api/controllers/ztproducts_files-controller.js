const cds = require('@sap/cds');
const { ZTProductFilesCRUD } = require('../services/ztproducts_files-service'); 

class ZTProductFilesService extends cds.ApplicationService {
    async init() {
        
        this.on('productsFilesCRUD', async (req) => { 
            
            // 1. Obtener ProcessType del query string (para validar si debemos deolver una resp diff)
            const ProcessType = req.req?.query?.ProcessType; 
            // 2. Ejecutar la lógica de negocio osea el crud puro recibimos data (bitacora y demas datos  )
            const result = await ZTProductFilesCRUD(req); 
            // 3. similar al servicio manejamos el caso de post la funcion es 200ok por defecto pero si es correcto forzamos a 201
            if (ProcessType === 'AddOne' && req.http?.res) {
                req.http.res.status(201); 
                // Construir el header Location usando el FILEID del resultado
                const fileID = result.dataRes?.file?.FILEID || ''; 
                if (fileID) {
                    req.http.res.set('Location', `/api/ztproducts-files/ZTProductFiles('${fileID}')`);
                }
                // Enviar la respuesta manualmente y evitar que CAP la sobrescriba
                const finalResponse = { 
                    '@odata.context': '$metadataFiles',
                    value: [result] 
                };
                req.http.res.send(finalResponse);
                return; 
            }
            // 4. Retornar el resultado normal para los demás ProcessType (GET, DELETE, )
            return result; 
        });
        return super.init();
    }
}

module.exports = ZTProductFilesService;