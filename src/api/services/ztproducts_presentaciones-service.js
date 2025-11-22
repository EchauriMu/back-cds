// ============================================
// IMPORTS
// ============================================
const { getCosmosDatabase } = require('../../config/connectToMongoDB.config');
const { ZTProducts_Presentaciones } = require('../models/mongodb/ztproducts_presentaciones');
const { ZTProduct } = require('../models/mongodb/ztproducts'); // FIC: Necesario para validación de SKUID
const { ZTProduct_FILES } = require('../models/mongodb/ztproducts_files');
const { handleUploadZTProductFileCDS } = require('../../helpers/azureUpload.helper');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
// ============================================
function getPayload(req) {
  // Si la acción no tiene parámetros definidos, CAP pone todo el body en req.data
  return req.data || req.req?.body || null;
}

// ============================================
// UTIL: OBTENER CONTENEDOR DE COSMOS DB
// ============================================
async function getCosmosContainer(containerName, partitionKeyPath) {
  const database = getCosmosDatabase();
  if (!database) {
    throw new Error('La conexión con Cosmos DB no está disponible.');
  }
  const { container } = await database.containers.createIfNotExists({ 
    id: containerName, 
    partitionKey: { paths: [partitionKeyPath] } 
  });
  return container;
}

// Helper específico para este servicio
async function getPresentacionesCosmosContainer() {
  return getCosmosContainer('ZTPRODUCTS_PRESENTACIONES', '/IDPRESENTAOK');
}

// ============================================
// CRUD BÁSICO (MONGO PURO)
// ============================================
async function GetAllZTProductsPresentaciones() {
  // por defecto excluimos borrados lógicos
  return await ZTProducts_Presentaciones.find({ DELETED: { $ne: true } }).lean();
}

async function GetOneZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const doc = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: idpresentaok }).lean();
  if (!doc) throw new Error('No se encontró la presentación');
  return doc;
}

async function AddOneZTProductsPresentacion(payload, user) {
  if (!payload) throw new Error('No se recibió payload. Verifica Content-Type: application/json');

  const { files, ...presentationPayload } = payload;

  const required = ['IdPresentaOK', 'SKUID', 'NOMBREPRESENTACION', 'Descripcion'];
  const missing = required.filter((k) => !presentationPayload[k]);
  if (missing.length) throw new Error(`Faltan campos obligatorios en la presentación: ${missing.join(', ')}`);

  const exists = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: presentationPayload.IdPresentaOK }).lean();
  if (exists) throw new Error(`Ya existe una presentación con el IdPresentaOK: ${presentationPayload.IdPresentaOK}`);

  let createdPresentation;
  const createdFilesInfo = [];

  try {
    // 1. CREAR LA PRESENTACIÓN
    let propiedades = {};
    if (typeof presentationPayload.PropiedadesExtras === 'string' && presentationPayload.PropiedadesExtras.trim() !== '') {
      try {
        propiedades = JSON.parse(presentationPayload.PropiedadesExtras);
      } catch (jsonError) {
        throw new Error(`El formato de PropiedadesExtras no es un JSON válido.`);
      }
    }

    const presentationData = {
      IdPresentaOK: presentationPayload.IdPresentaOK,
      SKUID: presentationPayload.SKUID,
      NOMBREPRESENTACION: presentationPayload.NOMBREPRESENTACION,
      Descripcion: presentationPayload.Descripcion,
      PropiedadesExtras: propiedades,
      ACTIVED: presentationPayload.ACTIVED ?? true,
      DELETED: presentationPayload.DELETED ?? false,
    };

    createdPresentation = await saveWithAudit(ZTProducts_Presentaciones, {}, presentationData, user, 'CREATE');

    // 2. SUBIR ARCHIVOS (SI EXISTEN)
    if (files && files.length > 0) {
      for (const file of files) {
        const { fileBase64, originalname, mimetype, ...restOfFile } = file;

        if (!fileBase64 || !originalname || !mimetype) {
          throw new Error('Cada archivo debe tener fileBase64, originalname y mimetype.');
        }

        const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
        const fileBuffer = Buffer.from(cleanBase64, 'base64');
        const fileForHelper = {
          buffer: fileBuffer,
          originalname,
          mimetype,
        };

        const bodyForHelper = {
          SKUID: createdPresentation.SKUID,
          IdPresentaOK: createdPresentation.IdPresentaOK,
          ...restOfFile,
        };

        const uploadResult = await handleUploadZTProductFileCDS(fileForHelper, bodyForHelper, user);

        if (uploadResult.error || uploadResult.status >= 400) {
          throw new Error(uploadResult.message || uploadResult.data?.error || 'Error al subir archivo a Azure.');
        }
        createdFilesInfo.push(uploadResult.data);
      }
    }

    // 3. RESPUESTA EXITOSA
    return {
      presentation: createdPresentation,
      files: createdFilesInfo,
    };

  } catch (error) {
    // -- INICIO DE ROLLBACK --
    // Si algo falla, eliminamos todo lo que se creó en esta operación.
    if (createdPresentation) {
      await ZTProducts_Presentaciones.deleteOne({ _id: createdPresentation._id });
    }
    if (createdFilesInfo.length > 0) {
      const fileIdsToDelete = createdFilesInfo.map(f => f.file.FILEID);
      await ZTProduct_FILES.deleteMany({ FILEID: { $in: fileIdsToDelete } });
      // TODO: En un futuro, se podría añadir la lógica para borrar los archivos de Azure.
    }
    // -- FIN DE ROLLBACK --

    // Re-lanzar el error para que sea capturado por el método que lo llamó (AddOneMethod)
    throw new Error(`Error en AddOneZTProductsPresentacion: ${error.message}`);
  }
}

async function UpdateOneZTProductsPresentacion(idpresentaok, cambios, user) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const payload = cambios; // Renombramos para claridad
  if (!payload || Object.keys(payload).length === 0) throw new Error('No se enviaron datos para actualizar');

  const { files, ...presentationChanges } = payload;

  // 1. ACTUALIZAR DATOS DE LA PRESENTACIÓN
  // Parsear PropiedadesExtras si viene como string
  if (typeof presentationChanges.PropiedadesExtras === 'string' && presentationChanges.PropiedadesExtras.trim() !== '') {
    try {
      presentationChanges.PropiedadesExtras = JSON.parse(presentationChanges.PropiedadesExtras);
    } catch (jsonError) {
      throw new Error(`El formato de PropiedadesExtras no es un JSON válido.`);
    }
  } else if (presentationChanges.PropiedadesExtras === '') {
    presentationChanges.PropiedadesExtras = {};
  }

  const filter = { IdPresentaOK: idpresentaok };
  const updatedPresentation = await saveWithAudit(ZTProducts_Presentaciones, filter, presentationChanges, user, 'UPDATE');

  if (!updatedPresentation) {
    throw new Error('No se encontró la presentación para actualizar o no se pudo guardar.');
  }

  const processedFiles = [];

  // 2. PROCESAR ARCHIVOS (SI SE ENVIARON)
  if (files && files.length > 0) {
    // Obtener SKUID de la presentación recién actualizada
    const skuid = updatedPresentation.SKUID;

    for (const file of files) {
      const { fileBase64, originalname, mimetype, ...restOfFile } = file;

      if (!fileBase64 || !originalname || !mimetype) {
        console.warn('Se omitió un archivo en la actualización por falta de datos:', file);
        continue; // Saltar al siguiente archivo
      }

      // Si el archivo que se sube es el principal, borramos el anterior si existe.
      if (restOfFile.PRINCIPAL === true) {
        const oldPrincipal = await ZTProduct_FILES.findOne({ IdPresentaOK: idpresentaok, PRINCIPAL: true });
        if (oldPrincipal) {
          await ZTProduct_FILES.findByIdAndDelete(oldPrincipal._id);
          // TODO: Añadir lógica para borrar de Azure Blob Storage usando oldPrincipal.URL
        }
      }

      // Subir el nuevo archivo
      const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
      const fileBuffer = Buffer.from(cleanBase64, 'base64');
      const fileForHelper = {
        buffer: fileBuffer,
        originalname,
        mimetype,
      };

      const bodyForHelper = {
        SKUID: skuid,
        IdPresentaOK: idpresentaok,
        ...restOfFile,
      };

      const uploadResult = await handleUploadZTProductFileCDS(fileForHelper, bodyForHelper, user);

      if (uploadResult.error || uploadResult.status >= 400) {
        // Si la subida falla, al menos la presentación se actualizó. Se podría implementar un rollback más complejo.
        console.error('Error al subir archivo durante la actualización:', uploadResult.message);
      } else {
        processedFiles.push(uploadResult.data);
      }
    }
  }

  // 3. DEVOLVER LA PRESENTACIÓN ACTUALIZADA Y LOS ARCHIVOS PROCESADOS
  return { presentation: updatedPresentation, files: processedFiles };
}

async function DeleteLogicZTProductsPresentacion(idpresentaok, user) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const filter = { IdPresentaOK: idpresentaok };
  const data   = { ACTIVED: false, DELETED: true };
  const res = await saveWithAudit(ZTProducts_Presentaciones, filter, data, user, 'UPDATE');
  return res;
}

async function DeleteHardZTProductsPresentacion(idpresentaok) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const eliminado = await ZTProducts_Presentaciones.findOneAndDelete({ IdPresentaOK: idpresentaok });
  if (!eliminado) throw new Error('No se encontró la presentación para eliminar');
  return { mensaje: 'Presentación eliminada permanentemente', IdPresentaOK: idpresentaok };
}

async function ActivateOneZTProductsPresentacion(idpresentaok, user) {
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const filter = { IdPresentaOK: idpresentaok };
  const data   = { ACTIVED: true, DELETED: false };
  const res = await saveWithAudit(ZTProducts_Presentaciones, filter, data, user, 'UPDATE');
  return res;
}

// ============================================
// CRUD: GET PRESENTACIONES BY SKUID
// ============================================
async function GetZTProductsPresentacionesBySKUID(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  return await ZTProducts_Presentaciones.find({ SKUID: skuid, DELETED: { $ne: true } }).lean();
}

// ============================================
// CRUD BÁSICO (COSMOS DB SDK)
// ============================================
async function GetAllZTProductsPresentacionesCosmos() {
  console.log("🐛 [DEBUG] -> Iniciando GetAllZTProductsPresentacionesCosmos...");
  const container = await getPresentacionesCosmosContainer();
  const query = "SELECT * from c WHERE c.DELETED != true";
  console.log(`🐛 [DEBUG] -> Ejecutando query: ${query}`);
  const { resources: items } = await container.items.query(query).fetchAll();
  console.log(`🐛 [DEBUG] -> Query completada. Se encontraron ${items.length} presentaciones.`);
  return items;
}

async function GetOneZTProductsPresentacionCosmos(idpresentaok) {
  console.log(`🐛 [DEBUG] -> Iniciando GetOneZTProductsPresentacionCosmos con idpresentaok: ${idpresentaok}`);
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const container = await getPresentacionesCosmosContainer();
  // Para leer un item, se necesita su ID y su clave de partición.
  // En este contenedor, ambos son `idpresentaok`.
  console.log(`🐛 [DEBUG] -> Leyendo item con ID '${idpresentaok}' y PartitionKey '${idpresentaok}'`);
  const { resource: item } = await container.item(idpresentaok, idpresentaok).read();
  if (!item) {
    console.error(`\x1b[31m[ERROR]\x1b[0m -> No se encontró la presentación con id: ${idpresentaok}`);
    throw new Error('No se encontró la presentación');
  }
  console.log("🐛 [DEBUG] -> Presentación encontrada:", JSON.stringify(item, null, 2));
  return item;
}

async function AddOneZTProductsPresentacionCosmos(payload, user) {
  console.log("🐛 [DEBUG] -> Iniciando AddOneZTProductsPresentacionCosmos...");
  console.log("   -> Payload recibido:", JSON.stringify(payload, null, 2));
  console.log(`   -> Usuario: ${user}`);

  if (!payload) throw new Error('No se recibió payload. Verifica Content-Type: application/json');

  const { files, ...presentationPayload } = payload;
  const { IdPresentaOK, SKUID, NOMBREPRESENTACION, Descripcion } = presentationPayload;

  const required = ['IdPresentaOK', 'SKUID', 'NOMBREPRESENTACION', 'Descripcion'];
  console.log("🐛 [DEBUG] -> Validando campos obligatorios:", required);
  const missing = required.filter((k) => !presentationPayload[k]);
  if (missing.length) throw new Error(`Faltan campos obligatorios en la presentación: ${missing.join(', ')}`);
  console.log("🐛 [DEBUG] -> Validación de campos obligatorios: OK");

  const container = await getPresentacionesCosmosContainer();

  // Verificar si la presentación ya existe
  console.log(`🐛 [DEBUG] -> Verificando si ya existe presentación con IdPresentaOK: ${IdPresentaOK}`);
  const { resource: existing } = await container.item(IdPresentaOK, IdPresentaOK).read().catch(() => ({}));
  if (existing) throw new Error(`Ya existe una presentación con el IdPresentaOK: ${IdPresentaOK}`);
  console.log("🐛 [DEBUG] -> Verificación de duplicados: OK, no existe.");

  // Verificar si el producto padre (SKUID) existe
  console.log(`🐛 [DEBUG] -> Verificando si existe producto padre con SKUID: ${SKUID}`);
  const productContainer = await getCosmosContainer('ZTPRODUCTS', '/SKUID');
  // Usamos una consulta para verificar la existencia del producto padre.
  const productQuery = { query: "SELECT c.id FROM c WHERE c.id = @skuid", parameters: [{ name: "@skuid", value: SKUID }] };
  const { resources: products } = await productContainer.items.query(productQuery).fetchAll();
  if (products.length === 0) throw new Error(`El producto padre con SKUID '${SKUID}' no existe.`);
  console.log("🐛 [DEBUG] -> Verificación de producto padre: OK, sí existe.");

  let createdPresentation;
  const createdFilesInfo = [];

  try {
    // 1. CREAR LA PRESENTACIÓN
    let propiedades = {};
    if (typeof presentationPayload.PropiedadesExtras === 'string' && presentationPayload.PropiedadesExtras.trim() !== '') {
      try {
        propiedades = JSON.parse(presentationPayload.PropiedadesExtras);
      } catch (jsonError) {
        throw new Error(`El formato de PropiedadesExtras no es un JSON válido.`);
      }
    } else if (typeof presentationPayload.PropiedadesExtras === 'object' && presentationPayload.PropiedadesExtras !== null) {
        propiedades = presentationPayload.PropiedadesExtras;
    }

    // Excluir 'files' del objeto que se va a guardar en la BD
    const { files: _files, ...payloadToSave } = presentationPayload;

    const newItem = {
      id: IdPresentaOK,
      partitionKey: IdPresentaOK, // Clave de partición
      IdPresentaOK: IdPresentaOK, // Campo en mayúsculas para consistencia
      ...presentationPayload,
      PropiedadesExtras: propiedades,
      ACTIVED: presentationPayload.ACTIVED ?? true,
      DELETED: presentationPayload.DELETED ?? false,
      REGUSER: user,
      REGDATE: new Date().toISOString(),
      HISTORY: [{
        user: user,
        event: "CREATE",
        date: new Date().toISOString(),
        changes: payloadToSave // Guardar el payload sin los archivos
      }]
    };

    console.log("🐛 [DEBUG] -> Objeto a crear en Cosmos DB:", JSON.stringify(newItem, null, 2));
    const { resource: createdItem } = await container.items.create(newItem);
    createdPresentation = createdItem;
    console.log("🐛 [DEBUG] -> Presentación creada exitosamente en Cosmos DB. ID:", createdItem.id);

    // 2. SUBIR ARCHIVOS (SI EXISTEN)
    if (files && files.length > 0) {
      console.log(`🐛 [DEBUG] -> Se encontraron ${files.length} archivos para subir.`);
      for (const [index, file] of files.entries()) {
        console.log(`   -> Procesando archivo #${index + 1}...`);
        const { fileBase64, originalname, mimetype, ...restOfFile } = file;
        const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
        const fileBuffer = Buffer.from(cleanBase64, 'base64');
        const fileForHelper = { buffer: fileBuffer, originalname, mimetype };
        const bodyForHelper = { SKUID: createdPresentation.SKUID, IdPresentaOK: createdPresentation.id, ...restOfFile };

        const uploadResult = await handleUploadZTProductFileCDS(fileForHelper, bodyForHelper, user, 'CosmosDB');
        if (uploadResult.error || uploadResult.status >= 400) {
          throw new Error(uploadResult.message || uploadResult.data?.error || 'Error al subir archivo a Azure.');
        }
        createdFilesInfo.push(uploadResult.data);
        console.log(`   -> Archivo #${index + 1} subido exitosamente.`);
      }
    } else {
      console.log("🐛 [DEBUG] -> No se encontraron archivos en el payload.");
    }

    // 3. RESPUESTA EXITOSA
    const finalResponse = { presentation: createdPresentation, files: createdFilesInfo };
    console.log("🐛 [DEBUG] -> Operación completada. Retornando:", JSON.stringify(finalResponse, null, 2));
    return finalResponse;

  } catch (error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m -> Error en AddOneZTProductsPresentacionCosmos: ${error.message}`);
    // -- INICIO DE ROLLBACK --
    if (createdPresentation) {
      console.log(`\x1b[33m[ROLLBACK]\x1b[0m -> Intentando eliminar la presentación creada con id: ${createdPresentation.id}`);
      await container.item(createdPresentation.id, createdPresentation.id).delete().catch(() => {});
      console.log(`\x1b[33m[ROLLBACK]\x1b[0m -> Presentación eliminada.`);
    }
    // TODO: Rollback de archivos subidos a Azure.
    // -- FIN DE ROLLBACK --
    throw error; // Re-lanzar el error original
  }
}

async function UpdateOneZTProductsPresentacionCosmos(idpresentaok, cambios, user) {
  console.log(`🐛 [DEBUG] -> Iniciando UpdateOneZTProductsPresentacionCosmos con idpresentaok: ${idpresentaok}`);
  console.log("   -> Cambios recibidos:", JSON.stringify(cambios, null, 2));
  console.log(`   -> Usuario: ${user}`);

  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');

  const container = await getPresentacionesCosmosContainer();
  console.log(`🐛 [DEBUG] -> Buscando item actual con id: ${idpresentaok}`);
  const { resource: currentItem } = await container.item(idpresentaok, idpresentaok).read();
  if (!currentItem) throw new Error(`No se encontró la presentación para actualizar con IdPresentaOK: ${idpresentaok}`);

  const { files, ...presentationChanges } = cambios;

  // Parsear PropiedadesExtras
  if (typeof presentationChanges.PropiedadesExtras === 'string') {
    try {
      presentationChanges.PropiedadesExtras = JSON.parse(presentationChanges.PropiedadesExtras);
    } catch (e) {
      throw new Error('El campo PropiedadesExtras no es un JSON válido.');
    }
  }

  const updatedItem = {
    ...currentItem,
    ...presentationChanges,
    id: currentItem.id, // Asegurar que el id no cambie
    partitionKey: currentItem.partitionKey, // Asegurar que la partitionKey no cambie
    MODUSER: user, // Este campo es importante para la auditoría
    MODDATE: new Date().toISOString(),
    HISTORY: [...(currentItem.HISTORY || []), { user, action: 'UPDATE', date: new Date().toISOString(), changes: presentationChanges }]
  };

  console.log("🐛 [DEBUG] -> Objeto a reemplazar en Cosmos DB:", JSON.stringify(updatedItem, null, 2));
  const { resource: replacedItem } = await container.item(currentItem.id, currentItem.partitionKey).replace(updatedItem);
  console.log("🐛 [DEBUG] -> Item reemplazado exitosamente.");

  // Lógica para manejar archivos (similar a la versión de Mongo)
  const processedFiles = [];
  if (files && files.length > 0) {
      console.log(`🐛 [DEBUG] -> Se encontraron ${files.length} archivos para procesar en la actualización.`);
      // ... (la lógica de subida de archivos se puede implementar aquí si es necesario)
  }

  const finalResponse = { presentation: replacedItem, files: processedFiles };
  console.log("🐛 [DEBUG] -> Actualización completada. Retornando:", JSON.stringify(finalResponse, null, 2));
  return finalResponse;
}

async function DeleteLogicZTProductsPresentacionCosmos(idpresentaok, user) {
  console.log(`🐛 [DEBUG] -> Iniciando DeleteLogicZTProductsPresentacionCosmos con idpresentaok: ${idpresentaok}, user: ${user}`);
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const container = await getPresentacionesCosmosContainer();
  console.log(`🐛 [DEBUG] -> Buscando item actual con id: ${idpresentaok}`);
  const { resource: currentItem } = await container.item(idpresentaok, idpresentaok).read();
  if (!currentItem) throw new Error(`No se encontró la presentación para borrado lógico con IdPresentaOK: ${idpresentaok}`);

  const updatedItem = {
    ...currentItem,
    ACTIVED: false,
    DELETED: true,
    MODUSER: user,
    MODDATE: new Date().toISOString(),
    HISTORY: [...(currentItem.HISTORY || []), { user, action: 'DELETE_LOGIC', date: new Date().toISOString(), changes: { ACTIVED: false, DELETED: true } }]
  };

  console.log("🐛 [DEBUG] -> Objeto para borrado lógico (reemplazo):", JSON.stringify(updatedItem, null, 2));
  const { resource: replacedItem } = await container.item(currentItem.id, currentItem.partitionKey).replace(updatedItem);
  console.log("🐛 [DEBUG] -> Borrado lógico exitoso.");
  return replacedItem;
}

async function DeleteHardZTProductsPresentacionCosmos(idpresentaok) {
  console.log(`🐛 [DEBUG] -> Iniciando DeleteHardZTProductsPresentacionCosmos con idpresentaok: ${idpresentaok}`);
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const container = await getPresentacionesCosmosContainer();
  console.log(`🐛 [DEBUG] -> Intentando eliminar permanentemente el item con id: ${idpresentaok}`);
  const { resource: deletedItem } = await container.item(idpresentaok, idpresentaok).delete();
  if (!deletedItem) {
      console.error(`\x1b[31m[ERROR]\x1b[0m -> No se encontró la presentación para eliminar permanentemente con id: ${idpresentaok}`);
      throw new Error('No se encontró la presentación para eliminar permanentemente');
  }
  const response = { mensaje: 'Presentación eliminada permanentemente de Cosmos DB', IdPresentaOK: idpresentaok };
  console.log("🐛 [DEBUG] -> Borrado físico exitoso. Retornando:", response);
  return response;
}

async function ActivateOneZTProductsPresentacionCosmos(idpresentaok, user) {
  console.log(`🐛 [DEBUG] -> Iniciando ActivateOneZTProductsPresentacionCosmos con idpresentaok: ${idpresentaok}, user: ${user}`);
  if (!idpresentaok) throw new Error('Falta parámetro IdPresentaOK');
  const container = await getPresentacionesCosmosContainer();
  console.log(`🐛 [DEBUG] -> Buscando item actual con id: ${idpresentaok}`);
  const { resource: currentItem } = await container.item(idpresentaok, idpresentaok).read();
  if (!currentItem) throw new Error(`No se encontró la presentación para activar con IdPresentaOK: ${idpresentaok}`);

  const updatedItem = {
    ...currentItem,
    ACTIVED: true,
    DELETED: false,
    MODUSER: user,
    MODDATE: new Date().toISOString(),
    HISTORY: [...(currentItem.HISTORY || []), { user, action: 'ACTIVATE', date: new Date().toISOString(), changes: { ACTIVED: true, DELETED: false } }]
  };

  console.log("🐛 [DEBUG] -> Objeto para activación (reemplazo):", JSON.stringify(updatedItem, null, 2));
  const { resource: replacedItem } = await container.item(currentItem.id, currentItem.partitionKey).replace(updatedItem);
  console.log("🐛 [DEBUG] -> Activación exitosa.");
  return replacedItem;
}

async function GetZTProductsPresentacionesBySKUIDCosmos(skuid) {
  console.log(`\n\n\x1b[35m======= INICIO DEBUG INSANO: GetZTProductsPresentacionesBySKUIDCosmos =======\x1b[0m`);
  console.log(`🐛 [SUPER-DEBUG] -> Función iniciada con SKUID: \x1b[33m'${skuid}'\x1b[0m`);

  if (!skuid) throw new Error('Falta parámetro SKUID');
  const container = await getPresentacionesCosmosContainer();
  console.log("🐛 [SUPER-DEBUG] -> Contenedor 'ZTPRODUCTS_PRESENTACIONES' obtenido.");

  const querySpec = {
    query: "SELECT * FROM c WHERE c.SKUID = @skuid AND c.DELETED != true",
    parameters: [{ name: "@skuid", value: skuid }]
  };
  console.log("🐛 [SUPER-DEBUG] -> QuerySpec preparado para Cosmos DB:");
  console.log(JSON.stringify(querySpec, null, 2));

  const { resources: items } = await container.items.query(querySpec).fetchAll();
  console.log(`🐛 [SUPER-DEBUG] -> Query ejecutada. Se encontraron \x1b[32m${items.length}\x1b[0m items.`);
  console.log("🐛 [SUPER-DEBUG] -> Items retornados:", JSON.stringify(items, null, 2));
  console.log(`\x1b[35m======= FIN DEBUG INSANO: GetZTProductsPresentacionesBySKUIDCosmos =======\x1b[0m\n\n`);
  return items;
}

// ============================================
// MÉTODOS LOCALES CON BITÁCORA (mismo estilo amigo)
// ============================================
async function GetAllMethod(bitacora, req, params, paramString, body, dbServer) {
  let data = DATA();

  // contexto
  data.process      = 'Obtener todas las presentaciones';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.method       = req.req?.method || 'No Especificado';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';
  data.queryString  = paramString;

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let docs;
    switch (dbServer) {
      case 'MongoDB':
        docs = await GetAllZTProductsPresentaciones();
        break;
      case 'CosmosDB':
        docs = await GetAllZTProductsPresentacionesCosmos();
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = docs;
    data.messageUSR = 'Presentaciones obtenidas correctamente';
    data.messageDEV = 'GetAllZTProductsPresentaciones ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener las presentaciones';
    data.messageDEV = error.message;
    data.stack      = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetOneMethod(bitacora, params, idpresentaok, dbServer) {
  let data = DATA();

  data.process      = 'Obtener una presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let doc;
    switch (dbServer) {
      case 'MongoDB':
        doc = await GetOneZTProductsPresentacion(idpresentaok);
        break;
      case 'CosmosDB':
        doc = await GetOneZTProductsPresentacionCosmos(idpresentaok);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = doc;
    data.messageUSR = 'Presentación obtenida correctamente';
    data.messageDEV = 'GetOneZTProductsPresentacion ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al obtener la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function AddOneMethod(bitacora, params, req, dbServer) {
  let data = DATA();

  data.process      = 'Agregar presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await AddOneZTProductsPresentacion(getPayload(req), params.LoggedUser);
        break;
      case 'CosmosDB':
        result = await AddOneZTProductsPresentacionCosmos(getPayload(req), params.LoggedUser);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación creada correctamente';
    data.messageDEV = 'AddOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);
    bitacora.success = true;

    // ✅ Setear HTTP 201 + Location desde el service (si hay http.res)
    if (req?.http?.res) {
      req.http.res.status(201);
      const id = (result && (result.IdPresentaOK || result?.data?.IdPresentaOK)) || '';
      if (id) {
        // Ajusta el entity set si tu ruta difiere (por defecto 'Presentaciones')
        req.http.res.set('Location', `/api/ztproducts-presentaciones/Presentaciones('${id}')`);
      }
    }

    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al crear la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function UpdateOneMethod(bitacora, params, idpresentaok, req, user, dbServer) {
  let data = DATA();

  data.process      = 'Actualizar presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await UpdateOneZTProductsPresentacion(idpresentaok, getPayload(req), user);
        break;
      case 'CosmosDB':
        result = await UpdateOneZTProductsPresentacionCosmos(idpresentaok, getPayload(req), user);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación actualizada correctamente';
    data.messageDEV = 'UpdateOne ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al actualizar la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', error.message.includes('No se encontró') ? 404 : 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteLogicMethod(bitacora, params, idpresentaok, user, dbServer) {
  let data = DATA();

  data.process      = 'Borrado lógico de presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteLogicZTProductsPresentacion(idpresentaok, user);
        break;
      case 'CosmosDB':
        result = await DeleteLogicZTProductsPresentacionCosmos(idpresentaok, user);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación borrada lógicamente';
    data.messageDEV = 'DeleteLogic ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    if (error.message.includes('No se encontró')) {
      data.messageUSR = 'No se encontró la presentación especificada para borrar.';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
    } else {
      data.messageUSR = 'Error al borrar lógicamente la presentación';
      data.messageDEV = error.message;
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    }
    bitacora.success = false;
    return bitacora;
  }
}

async function DeleteHardMethod(bitacora, params, idpresentaok, dbServer) {
  let data = DATA();

  data.process      = 'Borrado permanente de presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await DeleteHardZTProductsPresentacion(idpresentaok);
        break;
      case 'CosmosDB':
        result = await DeleteHardZTProductsPresentacionCosmos(idpresentaok);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación borrada permanentemente';
    data.messageDEV = 'DeleteHard ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al borrar permanentemente la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function ActivateOneMethod(bitacora, params, idpresentaok, user, dbServer) {
  let data = DATA();

  data.process      = 'Activar presentación';
  data.processType  = params.ProcessType || '';
  data.loggedUser   = params.LoggedUser || '';
  data.dbServer     = dbServer;
  data.server       = process.env.SERVER_NAME || '';
  data.api          = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = data.processType;
  bitacora.loggedUser  = data.loggedUser;
  bitacora.dbServer    = dbServer;
  bitacora.server      = data.server;
  bitacora.process     = data.process;

  try {
    let result;
    switch (dbServer) {
      case 'MongoDB':
        result = await ActivateOneZTProductsPresentacion(idpresentaok, user);
        break;
      case 'CosmosDB':
        result = await ActivateOneZTProductsPresentacionCosmos(idpresentaok, user);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes    = result;
    data.messageUSR = 'Presentación activada correctamente';
    data.messageDEV = 'Activate ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;

  } catch (error) {
    data.messageUSR = 'Error al activar la presentación';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

async function GetBySKUIDMethod(bitacora, req, params, skuid, dbServer) {
  let data = DATA();

  data.process = 'Obtener presentaciones por SKUID';
  data.processType = params.ProcessType || '';
  data.loggedUser = params.LoggedUser || '';
  data.dbServer = dbServer;
  data.server = process.env.SERVER_NAME || '';
  data.method = req.req?.method || 'No Especificado';
  data.api = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';

  bitacora.processType = params.ProcessType || '';
  bitacora.loggedUser = params.LoggedUser || '';
  bitacora.dbServer = dbServer;
  bitacora.server = process.env.SERVER_NAME || '';
  bitacora.process = 'Obtener presentaciones por SKUID';

  try {
    let presentations;
    switch (dbServer) {
      case 'MongoDB':
        presentations = await GetZTProductsPresentacionesBySKUID(skuid);
        break;
      case 'CosmosDB':
        presentations = await GetZTProductsPresentacionesBySKUIDCosmos(skuid);
        break;
      default:
        throw new Error(`DBServer no soportado: ${dbServer}`);
    }

    data.dataRes = presentations;
    data.messageUSR = 'Presentaciones obtenidas correctamente por SKUID';
    data.messageDEV = 'GetZTProductsPresentacionesBySKUID ejecutado sin errores';
    bitacora = AddMSG(bitacora, data, 'OK', 200, true);
    bitacora.success = true;
    return bitacora;
  } catch (error) {
    data.messageUSR = 'Error al obtener las presentaciones por SKUID';
    data.messageDEV = error.message;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.success = false;
    return bitacora;
  }
}

// ============================================
// ORQUESTADOR PRINCIPAL (CAP Action)
//    ProcessType: GetAll | GetOne | AddOne | UpdateOne | DeleteLogic | DeleteHard | ActivateOne
//    Params esperados: LoggedUser, DBServer (opcional), idpresentaok (para One/Update/Delete/Activate)
// ============================================
async function ZTProductsPresentacionesCRUD(req) {
  let bitacora = BITACORA();
  let data = DATA();

  try {
    // 1. PARAMS
    const params = req.req?.query || {};    
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    // Soportar tanto 'idpresentaok' como 'IdPresentaOK' para mayor flexibilidad.
    const { ProcessType, LoggedUser, DBServer } = params;
    const idpresentaok = params.idpresentaok || params.IdPresentaOK;

    // 2. VALIDACIONES
    if (!ProcessType) {
      data.process     = 'Validación de parámetros obligatorios';
      data.messageUSR  = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV  = 'Valores válidos: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    if (!LoggedUser) {
      data.process     = 'Validación de parámetros obligatorios';
      data.messageUSR  = 'Falta parámetro obligatorio: LoggedUser';
      data.messageDEV  = 'LoggedUser es requerido para trazabilidad del sistema';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }

    // 3. CONTEXTO BITÁCORA
    const dbServer = DBServer || 'MongoDB';
    bitacora.processType = ProcessType;
    bitacora.loggedUser  = LoggedUser;
    bitacora.dbServer    = dbServer;
    bitacora.queryString = paramString;
    bitacora.method      = req.req?.method || 'UNKNOWN';
    bitacora.api         = '/api/ztproducts-presentaciones/productsPresentacionesCRUD';
    bitacora.server      = process.env.SERVER_NAME || 'No especificado'; // eslint-disable-line

    // 4. ROUTING POR PROCESSTYPE
    switch (ProcessType) {
      case 'GetAll': {
        bitacora = await GetAllMethod(bitacora, req, params, paramString, null, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'GetOne': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación GetOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetOneMethod(bitacora, params, idpresentaok, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'AddOne': {
        bitacora = await AddOneMethod(bitacora, params, req, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'UpdateOne': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación UpdateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await UpdateOneMethod(bitacora, params, idpresentaok, req, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'DeleteLogic': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación DeleteLogic';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteLogicMethod(bitacora, params, idpresentaok, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'DeleteHard': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación DeleteHard';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteHardMethod(bitacora, params, idpresentaok, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'ActivateOne': {
        if (!idpresentaok) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: idpresentaok';
          data.messageDEV  = 'idpresentaok es requerido para la operación ActivateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await ActivateOneMethod(bitacora, params, idpresentaok, LoggedUser, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      case 'GetBySKUID': {
        if (!params.skuid) {
          data.process     = 'Validación de parámetros';
          data.messageUSR  = 'Falta parámetro obligatorio: skuid';
          data.messageDEV  = 'skuid es requerido para la operación GetBySKUID';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetBySKUIDMethod(bitacora, req, params, params.skuid, dbServer);
        if (!bitacora.success) { bitacora.finalRes = true; return FAIL(bitacora); }
        break;
      }

      default: {
        data.process     = 'Validación de ProcessType';
        data.messageUSR  = 'ProcessType inválido o no especificado';
        data.messageDEV  = 'ProcessType debe ser uno de: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes = true;
        return FAIL(bitacora);
      }
    }

    return OK(bitacora);

  } catch (error) {
    // Si ya venías con finalRes=true, respeta el status consolidado
    if (!bitacora.finalRes) {
      // Error no manejado -> consolida a 500 y cierra
      let data = DATA();
      data.process     = 'Catch principal ZTProductsPresentacionesCRUD (Error Inesperado)';
      data.messageUSR  = 'Ocurrió un error inesperado en el endpoint';
      data.messageDEV  = error.message;
      data.stack       = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
      bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
      bitacora.finalRes = true;
    }

    // ✅ Notificar a CAP una única vez con el status final de bitácora
    req.error({
      code: 'Internal-Server-Error',
      status: bitacora.status || 500,
      message: bitacora.messageUSR,
      target: bitacora.messageDEV,
      numericSeverity: 1,
      innererror: bitacora
    });

    return FAIL(bitacora);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  ZTProductsPresentacionesCRUD,
  GetAllZTProductsPresentaciones,
  GetOneZTProductsPresentacion,
  AddOneZTProductsPresentacion,
  UpdateOneZTProductsPresentacion,
  DeleteLogicZTProductsPresentacion,
  DeleteHardZTProductsPresentacion,
  ActivateOneZTProductsPresentacion,
  GetZTProductsPresentacionesBySKUID,
  // Cosmos DB Functions
  GetAllZTProductsPresentacionesCosmos,
  GetOneZTProductsPresentacionCosmos,
  AddOneZTProductsPresentacionCosmos,
  UpdateOneZTProductsPresentacionCosmos,
  DeleteLogicZTProductsPresentacionCosmos,
  DeleteHardZTProductsPresentacionCosmos,
  ActivateOneZTProductsPresentacionCosmos,
  GetZTProductsPresentacionesBySKUIDCosmos
};
