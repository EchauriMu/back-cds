// Servicio para ZTPRODUCTS (productos)
const mongoose = require('mongoose');
const ZTProduct = require('../models/mongodb/ztproducts');
const { cosmosConnection } = require('../../config/connectToMongoDB.config');

//FIC: Imports fuctions/methods
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
// ============================================
function getPayload(req) {
  return req.data || req.req?.body || null;
}

// ============================================
// CRUD BÁSICO (MONGO PURO) - Capa 1
// ============================================
async function GetAllZTProducts() {
  
  return await ZTProduct.find({}).lean();
}

async function GetOneZTProduct(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  const doc = await ZTProduct.findOne({ SKUID: skuid, ACTIVED: true, DELETED: false }).lean();
  if (!doc) throw new Error('No se encontró el producto');
  return doc;
}

async function AddOneZTProduct(payload, user) {
  if (!payload) throw new Error('No se recibió payload. Verifica Content-Type: application/json');

  const required = ['SKUID', 'DESSKU', 'IDUNIDADMEDIDA'];
  const missing = required.filter((k) => payload[k] === undefined || payload[k] === null || payload[k] === '');
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);

  // Evitar duplicados
  const exists = await ZTProduct.findOne({ SKUID: payload.SKUID }).lean();
  if (exists) throw new Error('Ya existe un producto con ese SKUID');

  // Defaults
  const data = {
    SKUID: payload.SKUID,
    PRODUCTNAME: payload.PRODUCTNAME,
    DESSKU: payload.DESSKU,
    MARCA: payload.MARCA || '',
    CATEGORIAS: payload.CATEGORIAS || [],
    IDUNIDADMEDIDA  : payload.IDUNIDADMEDIDA,
    BARCODE         : payload.BARCODE || '',
    INFOAD          : payload.INFOAD || '',
    ACTIVED         : payload.ACTIVED ?? true,
    DELETED         : payload.DELETED ?? false,
    // Los timestamps son manejados por Mongoose
  };

  // Usa helper con auditoría (CREATE dispara pre('save') y llena HISTORY)
  const created = await saveWithAudit(ZTProduct, {}, data, user, 'CREATE');
  return created;
}

async function UpdateOneZTProduct(skuid, cambios, user) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  if (!cambios || Object.keys(cambios).length === 0) throw new Error('No se enviaron datos para actualizar');

  // FIC: Parsear CATEGORIAS si viene como un string JSON
  if (cambios.CATEGORIAS && typeof cambios.CATEGORIAS === 'string') {
    try {
      cambios.CATEGORIAS = JSON.parse(cambios.CATEGORIAS);
    } catch (e) {
      throw new Error('El campo CATEGORIAS no es un JSON de array válido.');
    }
  }

  const filter = { SKUID: skuid, ACTIVED: true, DELETED: false };
  const updateData = { ...cambios };
  // saveWithAudit asigna MODUSER/MODDATE y triggerá pre('save') para HISTORY
  const updated = await saveWithAudit(ZTProduct, filter, updateData, user, 'UPDATE');
  return updated;
}

async function DeleteLogicZTProduct(skuid, user) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  const filter = { SKUID: skuid, ACTIVED: true, DELETED: false };
  const data   = { ACTIVED: false, DELETED: true };
  const res = await saveWithAudit(ZTProduct, filter, data, user, 'UPDATE');
  return res;
}

async function DeleteHardZTProduct(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  const eliminado = await ZTProduct.findOneAndDelete({ SKUID: skuid });
  if (!eliminado) throw new Error('No se encontró el producto para eliminar');
  return { mensaje: 'Producto eliminado permanentemente', SKUID: skuid };
}

async function ActivateOneZTProduct(skuid, user) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  const filter = { SKUID: skuid };
  const data   = { ACTIVED: true, DELETED: false };
  const res = await saveWithAudit(ZTProduct, filter, data, user, 'UPDATE');
  return res;
}

//----------------------------------------
//FIC: CRUD Products Service with Bitacora
//----------------------------------------
/* EndPoint: localhost:8080/api/ztproducts/crud?ProcessType='GetAll'  */
async function crudZTProducts(req) {
  
  let bitacora = BITACORA();
  let data = DATA();
  
  try {
    // 1. EXTRAER Y SERIALIZAR PARÁMETROS
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer, skuid } = params;
    
    // 2. VALIDAR PARÁMETROS OBLIGATORIOS
    if (!ProcessType) {
      data.process = 'Validación de parámetros obligatorios';
      data.messageUSR = 'Falta parámetro obligatorio: ProcessType';
      data.messageDEV = 'ProcessType es requerido para ejecutar la API. Valores válidos: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    if (!LoggedUser) {
      data.process = 'Validación de parámetros obligatorios';
      data.messageUSR = 'Falta parámetro obligatorio: LoggedUser';
      data.messageDEV = 'LoggedUser es requerido para trazabilidad del sistema';
      bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
      bitacora.finalRes = true;
      return FAIL(bitacora);
    }
    
    // 3. CONFIGURAR CONTEXTO DE LA BITÁCORA
    const dbServer = DBServer || 'MongoDB'; // Default explícito
    bitacora.processType = ProcessType;
    bitacora.loggedUser = LoggedUser;
    bitacora.dbServer = dbServer;
    bitacora.queryString = paramString;
    bitacora.method = req.req?.method || 'UNKNOWN';
    bitacora.api = '/api/ztproducts/crudProducts';
    bitacora.server = process.env.SERVER_NAME || 'No especificado'; // eslint-disable-line

    // 4. EJECUTAR OPERACIÓN SEGÚN PROCESSTYPE
    switch (ProcessType) {
      case 'GetAll':
        bitacora = await GetProductMethod(bitacora, params, paramString, body, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'GetOne':
        if (!skuid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: skuid';
          data.messageDEV = 'skuid es requerido para la operación GetOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await GetProductMethod(bitacora, params, paramString, body, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'AddOne':
        bitacora = await AddProductMethod(bitacora, params, paramString, body, req, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'UpdateOne':
        if (!skuid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: skuid';
          data.messageDEV = 'skuid es requerido para la operación UpdateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await UpdateProductMethod(bitacora, params, paramString, body, req, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'DeleteLogic':
        if (!skuid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: skuid';
          data.messageDEV = 'skuid es requerido para la operación DeleteLogic';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        const deleteResult = await DeleteLogicZTProduct(skuid, LoggedUser);
        bitacora = AddMSG(bitacora, DATA('Borrado Lógico', `Producto ${skuid} desactivado.`, deleteResult), 'OK', 200, true);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'DeleteHard':
        if (!skuid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: skuid';
          data.messageDEV = 'skuid es requerido para la operación DeleteHard';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeleteProductMethod(bitacora, { ...params, paramString }, skuid, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'ActivateOne':
        if (!skuid) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: skuid';
          data.messageDEV = 'skuid es requerido para la operación ActivateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        const activateResult = await ActivateOneZTProduct(skuid, LoggedUser);
        bitacora = AddMSG(bitacora, DATA('Activación', `Producto ${skuid} activado.`, activateResult), 'OK', 200, true);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      default:
        data.process = 'Validación de ProcessType';
        data.messageUSR = 'ProcessType inválido o no especificado';
        data.messageDEV = 'ProcessType debe ser uno de: GetAll, GetOne, AddOne, UpdateOne, DeleteLogic, DeleteHard, ActivateOne';
        bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        bitacora.finalRes = true;
        return FAIL(bitacora);
    }

    
    return OK(bitacora);
    
  } catch (error) {
    // Si el error ya tiene finalRes = true, significa que fue manejado en un método local
    if (bitacora.finalRes) {
      return FAIL(bitacora);
    }
    
    // Error no manejado - captura inesperada
    data.process = 'Catch principal crudZTProducts';
    data.messageUSR = 'Ocurrió un error inesperado en el endpoint';
    data.messageDEV = error.message;
    data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
    bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
    bitacora.finalRes = true;
    
    // NOTIFICACIÓN ESTRUCTURADA A CAP
    if (req?.error) {
      req.error({
        code: 'Internal-Server-Error',
        status: bitacora.status || 500,
        message: bitacora.messageUSR || data.messageUSR,
        target: bitacora.messageDEV || data.messageDEV,
        numericSeverity: 1,
        innererror: bitacora
      });
    }
    
    // TODO: Implementar registro en tabla de errores
    // await logErrorToDatabase(error, bitacora);
    
    // TODO: Implementar notificación de error
    // await notifyError(bitacora.loggedUser, error);
    
    return FAIL(bitacora);
  }
}

//####################################################################################
//FIC: Methods for each operation with Bitacora - Capa 2
//####################################################################################

async function GetProductMethod(bitacora, params, paramString, body, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Obtener producto(s)';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztproducts/crudProducts';
    data.queryString = paramString;
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Obtener producto(s)';
    
    try {
        const processType = params.ProcessType;
        
        if (processType === 'GetAll') {
            bitacora.process = "Obtener todos los PRODUCTOS";
            data.process = "Consulta de todos los productos";
            data.method = "GET";
            data.api = "/api/ztproducts/crudProducts?ProcessType=GetAll";
            data.principal = true;

            let productos;
            switch (dbServer) {
                case 'MongoDB':
                    productos = await GetAllZTProducts();
                    break;
                case 'CosmosDB':
                    // Compilamos el modelo sobre la conexión de Cosmos DB al vuelo.
                    // Se añade el tercer argumento 'ZTPRODUCTS' para forzar el nombre de la colección
         
                  // El primer argumento 'ZTProductCosmos' es un nombre único para este modelo en
                  //  esta conexión POR QUE NO SE PUEDE COMPARTIR LA DE LA CONEXION POR DEFECTO QUE ES ATLAS
                    const ZTProductCosmos = cosmosConnection.model('ZTProductCosmos', ZTProduct.schema, 'ZTPRODUCTS');
                    productos = await ZTProductCosmos.find({}).lean(); 
                    break;
                default:
                    throw new Error(`DBServer no soportado: ${dbServer}`);
            }
            
            data.dataRes = productos;
            data.messageUSR = `Se obtuvieron ${productos.length} productos correctamente`;
            data.messageDEV = 'GetAllZTProducts ejecutado sin errores';
            bitacora = AddMSG(bitacora, data, 'OK', 200, true);
            
        } else if (processType === 'GetOne') {
            bitacora.process = "Obtener UN PRODUCTO";
            data.process = "Consulta de producto específico";
            data.method = "GET";
            data.api = "/api/ztproducts/crudProducts?ProcessType=GetOne";
            data.principal = true;

            const skuid = params.skuid || params.SKUID;
            
            if (!skuid) {
                data.messageUSR = "ID de producto requerido";
                data.messageDEV = "SKUID es requerido para obtener un producto";
                bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
                bitacora.success = false;
                return bitacora;
            }

            let producto;
            switch (dbServer) {
                case 'MongoDB':
                    producto = await GetOneZTProduct(skuid);
                    break;
                case 'HANA':
                    throw new Error('HANA no implementado aún para GetOne');
                default:
                    throw new Error(`DBServer no soportado: ${dbServer}`);
            }
            
            data.dataRes = producto;
            data.messageUSR = "Producto encontrado correctamente";
            data.messageDEV = `Producto con SKUID ${skuid} encontrado`;
            bitacora = AddMSG(bitacora, data, 'OK', 200, true);
        }
        
        bitacora.success = true;
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES 404 vs 500
        if (error.message.includes('No se encontró') || error.message.includes('no encontrado')) {
            data.messageUSR = 'Producto no encontrado';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
        } else {
            data.messageUSR = 'Error al obtener el/los producto(s)';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
        bitacora.success = false;
        return bitacora;
    }
}

async function AddProductMethod(bitacora, params, paramString, body, req, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Agregar producto';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztproducts/crudProducts';
    data.method = "POST";
    data.principal = true;
    data.queryString = paramString;
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Agregar producto';
    bitacora.api = '/api/ztproducts/crudProducts';
    bitacora.queryString = paramString;
    
    try {
        let result;
        switch (dbServer) {
            case 'MongoDB':
                result = await AddOneZTProduct(getPayload(req), params.LoggedUser);
                break;
            case 'HANA':
                throw new Error('HANA no implementado aún para AddOne');
            default:
                throw new Error(`DBServer no soportado: ${dbServer}`);
        }
        
        data.dataRes = result;
        data.messageUSR = 'Producto creado exitosamente';
        data.messageDEV = 'AddOneZTProduct ejecutado sin errores';
        bitacora = AddMSG(bitacora, data, 'OK', 201, true);
        bitacora.success = true;
        
        if (req?.http?.res) {
            req.http.res.status(201);
            const id = (result && (result.SKUID)) || '';
            if (id) {
                req.http.res.set('Location', `/api/ztproducts/Products('${id}')`);
            }
        }
        
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES
        if (error.message.includes('Faltan campos') || error.message.includes('Ya existe')) {
            data.messageUSR = 'Error al crear el producto - datos no válidos';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        } else {
            data.messageUSR = 'Error al crear el producto';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        bitacora.success = false;
        return bitacora;
    }
}

async function UpdateProductMethod(bitacora, params, paramString, body, req, user, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Actualizar producto';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztproducts/crudProducts';
    data.method = "PUT";
    data.principal = true;
    data.queryString = paramString;
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Actualizar producto';
    bitacora.api = '/api/ztproducts/crudProducts';
    bitacora.queryString = paramString;
    
    try {
        let result;
        const skuid = params.skuid || params.SKUID;
        const isActivate = params.operation === 'activate' || params.type === 'activate';
        
        switch (dbServer) {
            case 'MongoDB':
                if (isActivate) {
                    // Usar función de activación
                    result = await ActivateOneZTProduct(skuid);
                } else {
                    // Usar función de actualización
                    result = await UpdateOneZTProduct(
                        skuid,
                        getPayload(req),
                        user
                    );
                }
                break;
            case 'HANA':
                throw new Error('HANA no implementado aún para UpdateOne');
            default:
                throw new Error(`DBServer no soportado: ${dbServer}`);
        }
        
        data.dataRes = result;
        data.messageUSR = isActivate ? 'Producto activado exitosamente' : 'Producto actualizado exitosamente';
        data.messageDEV = isActivate ? 'ActivateOneZTProduct ejecutado sin errores' : 'UpdateOneZTProduct ejecutado sin errores';
        bitacora = AddMSG(bitacora, data, 'OK', 200, true);
        bitacora.success = true;
        
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES
        if (error.message.includes('No se encontró') || error.message.includes('no encontrado')) {
            data.messageUSR = 'Error al actualizar el producto - producto no encontrado';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
        } else if (error.message.includes('Faltan campos') || error.message.includes('no válido')) {
            data.messageUSR = 'Error al actualizar el producto - datos no válidos';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        } else {
            data.messageUSR = 'Error al actualizar el producto';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        bitacora.success = false;
        return bitacora;
    }
}

async function DeleteProductMethod(bitacora, params, skuid, user, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Eliminar producto';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztproducts/crudProducts';
    data.method = "DELETE";
    data.principal = true;
    data.queryString = params.paramString || '';
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Eliminar producto';
    bitacora.api = '/api/ztproducts/crudProducts';
    bitacora.queryString = params.paramString || '';
    
    try {
        let result;
        const isHardDelete = params.ProcessType === 'DeleteHard';
        
        switch (dbServer) {
            case 'MongoDB':
                if (isHardDelete) {
                    // Usar función de eliminación física
                    result = await DeleteHardZTProduct(skuid);
                } else {
                    // Usar función de eliminación lógica
                    result = await DeleteLogicZTProduct(skuid, user);
                }
                break;
            case 'HANA':
                throw new Error('HANA no implementado aún para Delete');
            default:
                throw new Error(`DBServer no soportado: ${dbServer}`);
        }
        
        data.dataRes = result;
        data.messageUSR = isHardDelete ? 'Producto eliminado físicamente' : 'Producto eliminado lógicamente';
        data.messageDEV = isHardDelete ? 'DeleteHardZTProduct ejecutado sin errores' : 'DeleteLogicZTProduct ejecutado sin errores';
        bitacora = AddMSG(bitacora, data, 'OK', 200, true);
        bitacora.success = true;
        
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES
        if (error.message.includes('No se encontró') || error.message.includes('no encontrado')) {
            data.messageUSR = 'Error al eliminar el producto - producto no encontrado';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
        } else {
            data.messageUSR = 'Error al eliminar el producto';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        bitacora.success = false;
        return bitacora;
    }
}


module.exports = {
    crudZTProducts,
    GetAllZTProducts,
    GetOneZTProduct,
    AddOneZTProduct,
    UpdateOneZTProduct,
    DeleteLogicZTProduct,
    DeleteHardZTProduct,
    ActivateOneZTProduct
};
