// ============================================
// IMPORTS
// ============================================
const ZTProduct = require('../models/mongodb/ztproducts');
const { ZTProducts_Presentaciones } = require('../models/mongodb/ztproducts_presentaciones');
const { saveWithAudit } = require('../../helpers/audit-timestap');
const { handleUploadZTProductFileCDS } = require('../../helpers/azureUpload.helper');

// Import de utilidades de respuesta
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');

// ============================================
// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
// ============================================
function getPayload(req) {
  return req.data || req.req?.body || null;
}

// ============================================
// UTIL: GENERAR SKUID AUTOMÁTICAMENTE
// ============================================
function generateSkuFromProductName(productName) {
  if (!productName || typeof productName !== 'string' || productName.trim() === '') {
    // Si no hay productName, genera uno aleatorio
    return `SKU-${Date.now().toString(36).toUpperCase()}`;
  }

  const base = productName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '') // Quitar caracteres especiales
    .trim()
    .replace(/\s+/g, '-'); // Reemplazar espacios con guiones

  return `${base.slice(0, 40)}-${Date.now().toString(36).toUpperCase()}`;
}
// ============================================
// SERVICIO PRINCIPAL
// ============================================
async function addProductWithPresentations(req) {
  let bitacora = BITACORA();
  let data = DATA();

  const { LoggedUser } = req.req?.query || {};

  try {
    // 1. VALIDAR PARÁMETROS
    if (!LoggedUser) {
      data.messageDEV = "El parámetro LoggedUser es obligatorio.";
      data.messageUSR = "Falta información de usuario.";
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      return FAIL(bitacora);
    }

    const payload = getPayload(req);
    const { product, presentations } = payload;

    if (!product || !product.PRODUCTNAME) {
      data.messageDEV = "El objeto 'product' con su 'PRODUCTNAME' es obligatorio en el payload.";
      data.messageUSR = "El nombre del producto (PRODUCTNAME) es obligatorio.";
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      return FAIL(bitacora);
    }

    // FIC: Nueva validación para prevenir el error "Property 'files' does not exist in undefined"
    if (presentations && presentations.some(p => !p || typeof p !== 'object')) {
      data.messageDEV = "El array 'presentations' contiene elementos nulos o inválidos. Revise si hay comas extra en el JSON.";
      data.messageUSR = "Los datos de las presentaciones son inválidos. Por favor, verifique el formato.";
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      return FAIL(bitacora);
    }

    // 2. CONFIGURAR BITÁCORA
    bitacora.process = 'Crear Producto con Presentaciones';
    bitacora.processType = 'AddProductWithPresentations';
    bitacora.loggedUser = LoggedUser;
    bitacora.api = '/api/add-product/addProductWithPresentations';

    // 3. CREAR EL PRODUCTO PRINCIPAL
    let createdProduct;
    try {
      // --- Lógica de AddOneZTProduct integrada ---
      const required = ['PRODUCTNAME', 'DESSKU', 'IDUNIDADMEDIDA']; // SKUID ya no es requerido en el payload
      const missing = required.filter((k) => !product[k]);
      if (missing.length) throw new Error(`Faltan campos obligatorios en el producto: ${missing.join(', ')}`);

      // Generar el SKUID automáticamente
      const generatedSku = generateSkuFromProductName(product.PRODUCTNAME);

      // La validación de existencia ahora es interna y muy improbable que falle, pero es una buena práctica.
      const exists = await ZTProduct.findOne({ SKUID: generatedSku }).lean();
      if (exists) throw new Error(`Conflicto al generar SKUID único. Intente de nuevo.`);

      const productData = {
        SKUID: generatedSku, // Usar el SKUID generado
        PRODUCTNAME: product.PRODUCTNAME,
        DESSKU: product.DESSKU,
        MARCA: product.MARCA || '',
        CATEGORIAS: product.CATEGORIAS || [],
        IDUNIDADMEDIDA: product.IDUNIDADMEDIDA,
        BARCODE: product.BARCODE || '',
        INFOAD: product.INFOAD || '',
      };
      createdProduct = await saveWithAudit(ZTProduct, {}, productData, LoggedUser, 'CREATE');
      // --- Fin de lógica integrada ---

    } catch (productError) {
      data.process = 'Error al crear el producto padre';
      data.messageDEV = productError.message;
      data.messageUSR = "No se pudo crear el producto. Verifique que el SKUID no exista y que los datos sean correctos.";
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      return FAIL(bitacora);
    }

    // 4. CREAR LAS PRESENTACIONES (SI EXISTEN)
    const createdPresentations = [];
    const createdFilesInfo = [];
    if (presentations && presentations.length > 0) {
      for (const pres of presentations) {
        try {
          // --- Lógica de AddOneZTProductsPresentacion integrada ---
          const requiredPres = ['IdPresentaOK', 'NOMBREPRESENTACION', 'Descripcion'];
          const missingPres = requiredPres.filter((k) => !pres[k]);
          if (missingPres.length) throw new Error(`Faltan campos obligatorios en la presentación '${pres.IdPresentaOK || ''}': ${missingPres.join(', ')}`);

          const existsPres = await ZTProducts_Presentaciones.findOne({ IdPresentaOK: pres.IdPresentaOK }).lean();
          if (existsPres) throw new Error(`Ya existe una presentación con el ID: ${pres.IdPresentaOK}`);

          let propiedades = {};
          if (typeof pres.PropiedadesExtras === 'string' && pres.PropiedadesExtras.trim() !== '') {
            try {
              propiedades = JSON.parse(pres.PropiedadesExtras);
            } catch (jsonError) {
              throw new Error(`El formato de PropiedadesExtras para la presentación '${pres.IdPresentaOK}' no es un JSON válido.`);
            }
          }

          const presentationData = {
            IdPresentaOK: pres.IdPresentaOK,
            SKUID: createdProduct.SKUID, // Se asocia al producto padre ya creado
            NOMBREPRESENTACION: pres.NOMBREPRESENTACION,
            Descripcion: pres.Descripcion,
            PropiedadesExtras: propiedades,
          };

          const newPresentation = await saveWithAudit(ZTProducts_Presentaciones, {}, presentationData, LoggedUser, 'CREATE');
          // --- Fin de lógica integrada ---

          createdPresentations.push(newPresentation);

          // 4.1. SUBIR ARCHIVOS DE LA PRESENTACIÓN (SI EXISTEN)
          if (pres.files && pres.files.length > 0) {
            for (const file of pres.files) {
              const { fileBase64, originalname, mimetype, ...restOfFile } = file;

              // 1. Preparar el objeto 'file' para el helper
              const cleanBase64 = fileBase64.replace(/^data:([A-Za-z-+\/]+);base64,/, '').replace(/\r?\n|\r/g, '');
              const fileBuffer = Buffer.from(cleanBase64, 'base64');
              const fileForHelper = {
                buffer: fileBuffer,
                originalname: originalname || 'upload.bin',
                mimetype: mimetype || 'application/octet-stream',
              };

              // 2. Preparar el objeto 'body' para el helper
              // Se mapean explícitamente los campos del modelo para evitar pasar propiedades no deseadas.
              const bodyForHelper = {
                SKUID: createdProduct.SKUID,
                IdPresentaOK: pres.IdPresentaOK, // Asociar archivo a la presentación
                FILETYPE: file.FILETYPE,
                PRINCIPAL: file.PRINCIPAL,
                INFOAD: file.INFOAD,
              };

              // 3. Llamar al helper con los 3 argumentos correctos
              const uploadResult = await handleUploadZTProductFileCDS(fileForHelper, bodyForHelper, LoggedUser);

              if (uploadResult.error || uploadResult.status >= 400) {
                // Si la subida falla, lanzamos un error para activar el rollback
                throw new Error(uploadResult.message || uploadResult.data?.error || 'Error al subir archivo a Azure.');
              }
              createdFilesInfo.push(uploadResult.data);
            }
          }

        } catch (presentationError) {
          // -- INICIO DE ROLLBACK --
          // Si una presentación o un archivo falla, eliminamos todo lo creado hasta ahora.
          // --- Lógica de DeleteHardZTProduct integrada ---
          await ZTProduct.findOneAndDelete({ SKUID: createdProduct.SKUID });
          // --- Fin de lógica integrada ---

          // Eliminar presentaciones ya creadas en este proceso
          const presentaOKsToDelete = createdPresentations.map(p => p.IdPresentaOK);
          if (presentaOKsToDelete.length > 0) {
            await ZTProducts_Presentaciones.deleteMany({ IdPresentaOK: { $in: presentaOKsToDelete } });
          }
          // TODO: En un futuro, se podría añadir la lógica para borrar los archivos ya subidos a Azure.
          // -- FIN DE ROLLBACK --

          data.process = `Error al crear la presentación ${pres.IdPresentaOK || ''}`;
          data.messageDEV = presentationError.message;
          data.messageUSR = `Se creó el producto, pero falló la creación de una de sus presentaciones. Se ha revertido la operación.`;
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          return FAIL(bitacora);
        }
      }
    }

    // 5. RESPUESTA EXITOSA
    const responseData = {
      product: createdProduct,
      presentations: createdPresentations,
      files: createdFilesInfo,
    };

    data.dataRes = responseData;
    data.messageUSR = 'Producto y sus presentaciones creados exitosamente.';
    data.messageDEV = 'Operación completada sin errores.';
    bitacora = AddMSG(bitacora, data, 'OK', 201, true);

    return OK(bitacora);

  } catch (error) {
    console.error("Error catastrófico en addProductWithPresentations:", error);
    data.process = 'Catch principal del servicio';
    data.messageDEV = error.message;
    data.messageUSR = "Ocurrió un error inesperado al procesar su solicitud.";
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    return FAIL(bitacora);
  }
}

module.exports = {
  addProductWithPresentations,
};