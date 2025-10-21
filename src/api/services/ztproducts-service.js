// Servicio para ZTPRODUCTS (productos)
const mongoose = require('mongoose');
const ZTProduct = require('../models/mongodb/ztproducts');

//FIC: Imports fuctions/methods
const {OK, FAIL, BITACORA, DATA, AddMSG} = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

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
        bitacora = await DeleteProductMethod(bitacora, params, skuid, LoggedUser, dbServer);
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
        bitacora = await DeleteProductMethod(bitacora, params, skuid, LoggedUser, dbServer);
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
        // Agregar operation=activate para el método UpdateProductMethod
        const activateParams = { ...params, operation: 'activate' };
        bitacora = await UpdateProductMethod(bitacora, activateParams, paramString, body, req, LoggedUser, dbServer);
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
    
    // TODO: Implementar registro en tabla de errores
    // await logErrorToDatabase(error, bitacora);
    
    // TODO: Implementar notificación de error
    // await notifyError(bitacora.loggedUser, error);
    
    return FAIL(bitacora);
  }
}

//####################################################################################
//FIC: Methods for each operation with Bitacora
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
            data.api = "/crud?ProcessType=GetAll";
            data.principal = true;

            let productos;
            switch (dbServer) {
                case 'MongoDB':
                    productos = await GetAllZTProduct();
                    break;
                case 'HANA':
                    throw new Error('HANA no implementado aún para GetAll');
                default:
                    throw new Error(`DBServer no soportado: ${dbServer}`);
            }
            
            data.dataRes = productos;
            data.messageUSR = `Se obtuvieron ${productos.length} productos correctamente`;
            data.messageDEV = 'GetAllZTProduct ejecutado sin errores';
            bitacora = AddMSG(bitacora, data, 'OK', 200, true);
            
        } else if (processType === 'GetOne') {
            bitacora.process = "Obtener UN PRODUCTO";
            data.process = "Consulta de producto específico";
            data.method = "GET";
            data.api = "/crud?ProcessType=GetOne";
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
            
            if (!producto) {
                data.messageUSR = "Producto no encontrado";
                data.messageDEV = `Producto con SKUID ${skuid} no encontrado`;
                bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
                bitacora.success = false;
                return bitacora;
            } else {
                data.dataRes = producto;
                data.messageUSR = "Producto encontrado correctamente";
                data.messageDEV = `Producto con SKUID ${skuid} encontrado`;
                bitacora = AddMSG(bitacora, data, 'OK', 200, true);
            }
        }
        
        bitacora.success = true;
        return bitacora;
        
    } catch (error) {
        data.messageUSR = 'Error al obtener el/los producto(s)';
        data.messageDEV = error.message;
        data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
        bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
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
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Agregar producto';
    
    try {
        let result;
        switch (dbServer) {
            case 'MongoDB':
                // Simulate req object for CreateZTProduct
                const mockReq = {
                    req: {
                        data: body || {},
                        body: body || {}
                    }
                };
                result = await CreateZTProduct(mockReq, params.LoggedUser);
                break;
            case 'HANA':
                throw new Error('HANA no implementado aún para AddOne');
            default:
                throw new Error(`DBServer no soportado: ${dbServer}`);
        }
        
        data.dataRes = result;
        data.messageUSR = 'Producto creado exitosamente';
        data.messageDEV = 'CreateZTProduct ejecutado sin errores';
        bitacora = AddMSG(bitacora, data, 'OK', 201, true);
        bitacora.success = true;
        return bitacora;
        
    } catch (error) {
        data.messageUSR = 'Error al crear el producto';
        data.messageDEV = error.message;
        bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        bitacora.success = false;
        return bitacora;
    }
}

async function UpdateProductMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    // Configurar contexto base de data
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = params.DBServer || 'MongoDB';
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztproducts/crudProducts';
    
    try {
        const operation = params.operation || params.type || 'update';
        const skuid = params.skuid || params.SKUID;
        
        if (!skuid) {
            data.status = 400;
            data.messageDEV = "SKUID es requerido para actualizar/activar un producto";
            data.messageUSR = "ID de producto requerido";
            data.dataRes = null;
            bitacora = AddMSG(bitacora, data, "FAIL");
            return bitacora;
        }

        if (operation === 'activate') {
            //FIC: Log configuration for ACTIVATE
            bitacora.process = "Activar UN PRODUCTO";
            data.method = "PUT";
            data.api = "/crud?ProcessType=put&operation=activate";
            data.process = "Activación de producto";
            data.principal = true;

            // Call the original function - CON AUDITORÍA
            const resultado = await ActivateZTProduct(skuid, params.LoggedUser);
            
            if (resultado.error) {
                data.status = 404;
                data.messageUSR = resultado.message;
                data.messageDEV = `Error al activar producto con SKUID ${skuid}`;
                data.dataRes = null;
                bitacora = AddMSG(bitacora, data, "FAIL");
                bitacora.success = false;
            } else {
                data.status = 200;
                data.messageUSR = "Producto activado exitosamente";
                data.messageDEV = `Producto con SKUID ${skuid} activado correctamente`;
                // Solo pasar datos serializables y limpios para evitar referencias circulares
                data.dataRes = {
                    success: resultado.success,
                    message: resultado.message,
                    SKUID: resultado.data?.SKUID || skuid
                };
                bitacora = AddMSG(bitacora, data, "OK", 200, true);
                bitacora.success = true;
            }
            
        } else {
            //FIC: Log configuration for UPDATE
            bitacora.process = "Actualizar UN PRODUCTO";
            data.method = "PUT";
            data.api = "/crud?ProcessType=put";
            data.process = "Actualización de producto";
            data.principal = true;

            // Simulate req object for UpdateZTProduct
            const mockReq = {
                req: {
                    data: { skuid, ...body },
                    body: body || {}
                }
            };

            // Call the original function - CON AUDITORÍA
            const resultado = await UpdateZTProduct(mockReq, skuid, params.LoggedUser);
            
            data.status = 200;
            data.messageUSR = "Producto actualizado exitosamente";
            data.messageDEV = `Producto con SKUID ${skuid} actualizado`;
            data.dataRes = resultado;
            
            bitacora = AddMSG(bitacora, data, "OK", 200, true);
            bitacora.success = true;
        }
        
        bitacora.success = bitacora.success !== false; // Asegurar que tenga valor
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al actualizar/activar el producto";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
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
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Eliminar producto';
    
    try {
        const processType = params.ProcessType;
        
        if (processType === 'DeleteLogic') {
            //FIC: Log configuration for SOFT DELETE
            bitacora.process = "Eliminar UN PRODUCTO";
            data.method = "DELETE";
            data.api = "/crud?ProcessType=delete&type=soft";
            data.process = "Eliminación lógica de producto";
            data.principal = true;

            // Call the original function (logic delete) - CON AUDITORÍA
            const resultado = await DeleteZTProductLogic(skuid, user);
            
            data.status = 200;
            data.messageUSR = "Producto eliminado exitosamente";
            data.messageDEV = `Producto con SKUID ${skuid} eliminado lógicamente`;
            // Solo pasar datos serializables y limpios para evitar referencias circulares
            data.dataRes = {
                success: resultado.success,
                message: resultado.message,
                SKUID: resultado.data?.SKUID || skuid
            };
            
            bitacora = AddMSG(bitacora, data, "OK", 200, true);
            bitacora.success = true;
            
        } else if (processType === 'DeleteHard') {
            //FIC: Log configuration for HARD DELETE
            bitacora.process = "Eliminar FÍSICAMENTE UN PRODUCTO";
            data.method = "DELETE";
            data.api = "/crud?ProcessType=delete&type=hard";
            data.process = "Eliminación física de producto";
            data.principal = true;

            // Call the original function (hard delete)
            const resultado = await DeleteZTProductHard(skuid);
            
            if (!resultado) {
                data.status = 404;
                data.messageUSR = "Producto no encontrado para eliminación física";
                data.messageDEV = `Producto con SKUID ${skuid} no encontrado`;
                data.dataRes = null;
                bitacora = AddMSG(bitacora, data, "FAIL");
                bitacora.success = false;
            } else {
                data.status = 200;
                data.messageUSR = "Producto eliminado físicamente";
                data.messageDEV = `Producto con SKUID ${skuid} eliminado físicamente`;
                // Solo pasar datos serializables y limpios para evitar referencias circulares
                data.dataRes = {
                    success: resultado.success,
                    message: resultado.message,
                    SKUID: resultado.data?.SKUID || skuid
                };
                bitacora = AddMSG(bitacora, data, "OK", 200, true);
                bitacora.success = true;
            }
        }
        
        bitacora.success = bitacora.success !== false; // Asegurar que tenga valor
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al eliminar el producto";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        bitacora.success = false;
        return bitacora;
    }
}

//####################################################################################
//####################################################################################
//####################################################################################
//####################################################################################

// GET ALL PRODUCTS
async function GetAllZTProduct() {
  try {
    const productos = await ZTProduct.find({ ACTIVED: true, DELETED: false }).lean();
    console.log('[ZTProducts] Productos encontrados:', productos.length);
    return productos;
  } catch (error) {
    console.error('[ZTProducts] Error obteniendo productos:', error.message);
    throw error;
  }
}

// GET ONE PRODUCT BY SKUID
async function GetOneZTProduct(skuid) {
  try {
    console.log('[ZTProducts] Buscando producto por SKUID:', skuid);
    const producto = await ZTProduct.findOne({ SKUID: skuid, ACTIVED: true, DELETED: false }).lean();
    
    if (!producto) {
      console.log('[ZTProducts] No se encontró el producto en la base de datos.');
      return null;
    }
    
    console.log('[ZTProducts] Producto encontrado:', producto);
    return producto;
  } catch (error) {
    console.error('[ZTProducts] Error buscando producto:', error.message);
    throw error;
  }
}

// CREATE PRODUCT - CON AUDITORÍA
async function CreateZTProduct(req, user) {
  try {
    
    // Obtener datos de diferentes posibles ubicaciones
    let data = req.req.data || req.data || {};
    
    // Remover el campo 'procedure' si existe en los datos
    if (data.procedure) {
      delete data.procedure;
    }
    
    console.log('[ZTProducts] Datos finales para crear:', data);
    
    // Validar que tengamos los campos mínimos requeridos
    if (!data.SKUID || !data.DESSKU || !data.IDUNIDADMEDIDA) {
      const error = 'Faltan campos requeridos: SKUID, DESSKU, IDUNIDADMEDIDA';
      console.log('[ZTProducts]', error);
      return { error: true, message: error };
    }
    
    if (!user) {
      const error = 'Usuario requerido para auditoría';
      console.log('[ZTProducts]', error);
      return { error: true, message: error };
    }
    
    // Verificar que el SKUID no exista ya
    const productoExistente = await ZTProduct.findOne({ SKUID: data.SKUID }).lean();
    if (productoExistente) {
      console.log('[ZTProducts] El producto ya existe');
      return { error: true, message: 'Ya existe un producto con ese SKUID' };
    }
    
    // Usar saveWithAudit para trazabilidad automática
    const filter = {}; // No necesario para CREATE
    const productData = {
      ...data,
      ACTIVED: true,
      DELETED: false,
      CREATED_AT: new Date(),
      UPDATED_AT: new Date()
    };
    const action = 'CREATE';
    
    const productoGuardado = await saveWithAudit(ZTProduct, filter, productData, user, action);
    console.log('[ZTProducts] Producto creado exitosamente con auditoría');
    
    // Retornar objeto limpio para evitar errores de CDS
    return {
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        SKUID: productoGuardado.SKUID,
        DESSKU: productoGuardado.DESSKU,
        IDUNIDADMEDIDA: productoGuardado.IDUNIDADMEDIDA,
        REGUSER: productoGuardado.REGUSER,
        REGDATE: productoGuardado.REGDATE,
        ACTIVED: productoGuardado.ACTIVED,
        DELETED: productoGuardado.DELETED,
        CREATED_AT: productoGuardado.CREATED_AT
      }
    };
  } catch (error) {
    console.error('[ZTProducts] Error creando producto:', error.message);
    if (error.name === 'ValidationError') {
      return { error: true, message: error.message };
    }
    throw error;
  }
}

// UPDATE PRODUCT - CON AUDITORÍA
async function UpdateZTProduct(req, skuid, user) {
  try {
    let data = req.req.data || req.data || {};
    
    // Si no hay datos, devolver error
    if (!data || Object.keys(data).length === 0) {
      return { error: true, message: 'No se recibieron datos para actualizar' };
    }
    
    if (!user) {
      return { error: true, message: 'Usuario requerido para auditoría' };
    }
    
    console.log('[ZTProducts] Actualizando producto con auditoría...');
    
    // Usar saveWithAudit para trazabilidad automática
    const filter = { SKUID: skuid, ACTIVED: true, DELETED: false };
    const updateData = { 
      ...data,
      UPDATED_AT: new Date()
    };
    const action = 'UPDATE';
    
    const productoActualizado = await saveWithAudit(ZTProduct, filter, updateData, user, action);
    
    console.log('[ZTProducts] Producto actualizado exitosamente con auditoría');
    return {
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        SKUID: productoActualizado.SKUID,
        DESSKU: productoActualizado.DESSKU,
        IDUNIDADMEDIDA: productoActualizado.IDUNIDADMEDIDA,
        MODUSER: productoActualizado.MODUSER,
        MODDATE: productoActualizado.MODDATE,
        UPDATED_AT: productoActualizado.UPDATED_AT
      }
    };
  } catch (error) {
    console.error('[ZTProducts] Error actualizando producto:', error.message);
    
    // Si es error de "no encontrado", retornar mensaje específico
    if (error.message.includes('Documento no encontrado')) {
      return { error: true, message: 'Producto no encontrado para actualizar' };
    }
    
    throw error;
  }
}

// DELETE LOGIC (SOFT DELETE) - CON AUDITORÍA
async function DeleteZTProductLogic(skuid, user) {
  try {
    console.log('[ZTProducts] Eliminación lógica del producto SKUID:', skuid);
    
    // Usar saveWithAudit para trazabilidad automática
    const filter = { SKUID: skuid, ACTIVED: true, DELETED: false };
    const data = { 
      DELETED: true,
      ACTIVED: false,
      DELETED_AT: new Date(),
      UPDATED_AT: new Date()
    };
    const action = 'UPDATE';
    
    const productoEliminado = await saveWithAudit(ZTProduct, filter, data, user, action);
    
    console.log('[ZTProducts] Producto eliminado lógicamente con auditoría');
    return {
      success: true,
      message: 'Producto eliminado lógicamente',
      data: {
        SKUID: productoEliminado.SKUID,
        DESSKU: productoEliminado.DESSKU,
        ACTIVED: productoEliminado.ACTIVED,
        DELETED: productoEliminado.DELETED,
        MODUSER: productoEliminado.MODUSER,
        MODDATE: productoEliminado.MODDATE
      }
    };
  } catch (error) {
    console.error('[ZTProducts] Error en eliminación lógica:', error.message);
    
    // Si es error de "no encontrado", retornar mensaje específico
    if (error.message.includes('Documento no encontrado')) {
      return { error: true, message: 'Producto no encontrado o ya eliminado' };
    }
    
    throw error;
  }
}

// DELETE HARD (PHYSICAL DELETE)
async function DeleteZTProductHard(skuid) {
  try {
    console.log('[ZTProducts] Eliminación física del producto SKUID:', skuid);
    
    const productoEliminado = await ZTProduct.findOneAndDelete({ SKUID: skuid });
    
    if (!productoEliminado) {
      console.log('[ZTProducts] No se encontró el producto para eliminar');
      return null;
    }
    
    console.log('[ZTProducts] Producto eliminado físicamente exitosamente');
    
    // Crear objeto limpio INMEDIATAMENTE para evitar referencias circulares
    const resultado = {
      success: true,
      message: 'Producto eliminado físicamente',
      data: {
        SKUID: String(productoEliminado.SKUID || ''),
        DESSKU: String(productoEliminado.DESSKU || ''),
        IDUNIDADMEDIDA: String(productoEliminado.IDUNIDADMEDIDA || ''),
        ACTIVED: Boolean(productoEliminado.ACTIVED),
        DELETED: Boolean(productoEliminado.DELETED)
      }
    };
    
    console.log('[ZTProducts] Objeto limpio creado:', resultado);
    return resultado;
  } catch (error) {
    console.error('[ZTProducts] Error en eliminación física:', error.message);
    throw error;
  }
}

// ACTIVATE PRODUCT - CON AUDITORÍA
async function ActivateZTProduct(skuid, user) {
  try {
    console.log('[ZTProducts] Activando producto SKUID:', skuid);
    
    // Usar saveWithAudit para trazabilidad automática
    const filter = { SKUID: skuid };
    const data = { 
      ACTIVED: true,
      DELETED: false,
      UPDATED_AT: new Date()
    };
    const action = 'UPDATE';
    
    const productoActivado = await saveWithAudit(ZTProduct, filter, data, user, action);
    
    console.log('[ZTProducts] Producto activado exitosamente con auditoría');
    // Retornar objeto limpio sin metadatos de MongoDB
    return {
      success: true,
      message: 'Producto activado exitosamente',
      data: {
        SKUID: productoActivado.SKUID,
        DESSKU: productoActivado.DESSKU,
        ACTIVED: productoActivado.ACTIVED,
        DELETED: productoActivado.DELETED,
        MODUSER: productoActivado.MODUSER,
        MODDATE: productoActivado.MODDATE
      }
    };
  } catch (error) {
    console.error('[ZTProducts] Error activando producto:', error.message);
    
    // Si es error de "no encontrado", retornar mensaje específico
    if (error.message.includes('Documento no encontrado')) {
      return { error: true, message: 'Producto no encontrado' };
    }
    
    throw error;
  }
} 


// async function ZTProductCRUD(req) {
//   try {
//     const { procedure, type, skuid } = req.req.query;
//     let res;
    
//     switch (procedure) {
//       case 'get':
//         switch (type) {
//           case 'all':
//             res = await GetAllZTProduct();
//             break;
//           case 'one':
//             res = await GetOneZTProduct(skuid);
//             break;
//           default:
//             throw new Error('Coloca un tipo de búsqueda válido (all o one)');
//         }
//         break;
        
//       case 'post':
//         res = await CreateZTProduct(req);
//         break;
        
//       case 'put':
//         res = await UpdateZTProduct(req, skuid);
//         break;
        
//       case 'delete':
//         switch (type) {
//           case 'logic':
//             res = await DeleteZTProductLogic(skuid);
//             break;
//           case 'hard':
//             res = await DeleteZTProductHard(skuid);
//             break;
//           default:
//             throw new Error('Tipo de borrado inválido (logic o hard)');
//         }
//         break;
        
//       case 'activate':
//         res = await ActivateZTProduct(skuid);
//         break;
        
//       default:
//         throw new Error('Parámetros inválidos o incompletos');
//     }
    
//     return res;
//   } catch (error) {
//     console.error('Error en ZTProductCRUD:', error);
//     return { error: true, message: error.message };
//   }
// }


module.exports = {
  GetAllZTProduct,
  GetOneZTProduct,
  CreateZTProduct,
  UpdateZTProduct,
  DeleteZTProductLogic,
  DeleteZTProductHard,
  ActivateZTProduct,
  // ZTProductCRUD,
  crudZTProducts
};
