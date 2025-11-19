// src/config/connectToMongoDB.config.js

// 1. Importa Mongoose para MongoDB
const mongoose = require('mongoose');
// 2. Importa el cliente nativo de Cosmos DB
const { CosmosClient } = require('@azure/cosmos'); 
const configX = require('./dotenvXConfig');

// --- I. Conexión Principal a MongoDB Atlas (Mongoose) ---
// Se convierte en la conexión por defecto de Mongoose
(async () => { 
    try { 
        const db = await mongoose.connect(configX.CONNECTION_STRING, { 
            dbName: configX.DATABASE 
        }); 
        console.log('Database (MongoDB Atlas) is connected to: ', db.connection.name); 
    } catch (error) { 
        console.error('Error connecting to MongoDB Atlas: ', error); 
        // Considera salir del proceso o manejar el error críticamente
    } 
})();

// --- II. Conexión a Cosmos DB NoSQL (SDK Nativo) ---
// La cadena de conexión de Cosmos DB ya es la que tienes en el .env
const endpoint = configX.COSMOS_DB_CONNECTION_STRING.match(/AccountEndpoint=([^;]+)/i)[1];
const key = configX.COSMOS_DB_CONNECTION_STRING.match(/AccountKey=([^;]+)/i)[1];

const cosmosClient = new CosmosClient({ endpoint, key });

// --- III. Referencia a la Base de Datos de Cosmos DB ---
let cosmosDatabase;

(async () => {
    try {
        // Asume que configX.DATABASE es el nombre de tu base de datos en Cosmos DB
        const { database } = await cosmosClient.databases.createIfNotExists({ id: configX.DATABASE });
        cosmosDatabase = database; // Almacena la referencia a la base de datos
        console.log(`Secondary DB (CosmosDB NoSQL) is connected to database: ${database.id}`);
    } catch (error) {
        console.error('Error connecting to CosmosDB NoSQL: ', error.message);
    }
})();

// Exporta Mongoose, el cliente y la base de datos de Cosmos DB
module.exports = { mongoose, cosmosClient, getCosmosDatabase: () => cosmosDatabase };