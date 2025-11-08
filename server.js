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

      app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081'],
  credentials: true
}));

        
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