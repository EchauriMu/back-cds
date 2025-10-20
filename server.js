// import configX from './src/config/dotenvXConfig'; 


const express = require ("express");
const cds = require("@sap/cds");
const cors = require("cors");
const router = express.Router();
// Importa mongoose usando require (ya que estás usando CommonJS)
const mongoose =  require('./src/config/connectToMongoDB.config').mongoose;

const docEnvX = require("./src/config/dotenvXConfig")



module.exports = async (o) =>{
    try{
        let app = express();
        app.express = express;
        //FIC: Declaramos la variable app igualandola a express 
        // const app = express();


        //Echauri imit json api para  files 64
        app.use(express.json({limit: "50mb"}));

        app.use(cors());
        
        // ============================================
        // RUTA DIRECTA PARA ZTPROMOCIONES (bypass CDS validation)
        // ============================================
        const { crudZTPromociones } = require('./src/api/services/ztpromociones-service');
        
        app.post('/api/ztpromociones/crudPromociones', async (req, res) => {
          try {
            // Crear objeto request compatible con CDS
            const cdsRequest = {
              data: req.body,
              req: {
                query: req.query,
                body: req.body,
                method: req.method,
                headers: req.headers
              }
            };
            
            // Llamar al servicio directamente
            const result = await crudZTPromociones(cdsRequest);
            
            // Configurar status HTTP según resultado
            const statusCode = result.status || (result.success ? 200 : 500);
            res.status(statusCode).json(result);
            
          } catch (error) {
            console.error('[ZTPROMOCIONES DIRECT] Error:', error.message);
            res.status(500).json({
              success: false,
              error: error.message,
              stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
          }
        });
        
        app.use(docEnvX.API_URL,router)
        // app.use('/api',router );

        // app.get ('/', (req, res) => {
        //     res.end(`SAP CDS esta ene ejecución ... ${req.url}`);
        // });

        o.app = app;
        o.app.httpServer = await cds.server(o);
        return o.app.httpServer;
    }
    catch(error){
        console.error('Error strating server:',error);
        process.exit(1);
    }
};