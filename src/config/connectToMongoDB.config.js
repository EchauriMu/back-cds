
// src/config/connectToMongoDB.config.js
const mongoose = require('mongoose');
const configX = require('./dotenvXConfig');

// Conexión Principal a MongoDB (se convierte en la conexión por defecto de Mongoose)
(async () => { 
    try { 
        const db = await mongoose.connect(configX.CONNECTION_STRING, { 
            // useNewUrlParser: true,  // Ya no es necesario en Mongoose 6+
            // useUnifiedTopology: true,  // Ya no es necesario en Mongoose 6+
            dbName: configX.DATABASE 
        }); 
        console.log('Database (MongoDB Atlas) is connected to: ', db.connection.name); 
    } catch (error) { 
        console.log('Error connecting to MongoDB Atlas: ', error); 
    } 
})();

// Conexión Secundaria a Cosmos DB
const cosmosConnection = mongoose.createConnection(configX.COSMOS_DB_CONNECTION_STRING, {
    dbName: configX.DATABASE
});

cosmosConnection.on('open', () => {
    console.log('Secondary DB (CosmosDB) is connected to: ', cosmosConnection.name);
});

cosmosConnection.on('error', (error) => {
    console.log('Error connecting to CosmosDB: ', error);
});

module.exports = { mongoose, cosmosConnection };