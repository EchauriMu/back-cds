// Servicio para ZTPRODUCTS (productos)
const mongoose = require('mongoose');
const ZTProduct = require('../models/mongodb/ztproducts');

//FIC: Imports fuctions/methods
const {OK, FAIL, BITACORA, DATA, AddMSG} = require('../../middlewares/respPWA.handler');

//----------------------------------------
//FIC: CRUD Products Service with Bitacora
//----------------------------------------
/* EndPoint: localhost:8080/api/ztproducts/crud?ProcessType='GetAll'  */
async function crudZTProducts(req) {
  
  let bitacora = BITACORA();
  let data = DATA();
  
  let ProcessType = req.req.query?.ProcessType;
  const {LoggedUser} = req.req.query;
  //FIC: get query params
  let params = req.req.query;
  //FIC: get params of the service and convert in string
  let paramString = req.req.query ? new URLSearchParams(req.req.query).toString().trim() : '';
  //FIC: get body 
  const body = req.req.body;

  //FIC: start fill some properties of the bitacora
  bitacora.loggedUser = LoggedUser;
  bitacora.processType = ProcessType;

  try {

    switch (ProcessType) {

      case 'GetAll':
            //FIC: Get All Products Method
            //------------------------------------------------------           
            bitacora = await GetAllProductsMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;

      case 'GetOne':
            //FIC: Get One Product Method
            //------------------------------------------------------           
            bitacora = await GetOneProductMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;
    
      case 'AddOne':
            //FIC: Add One Product Method
            //------------------------------------------------------           
            bitacora = await AddOneProductMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;

      case 'UpdateOne':
            //FIC: Update One Product Method
            //------------------------------------------------------           
            bitacora = await UpdateOneProductMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;

      case 'DeleteOne':
            //FIC: Delete One Product Method
            //------------------------------------------------------           
            bitacora = await DeleteOneProductMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;

      default:
        data.status = 400;
        data.messageDEV = `ProcessType '${ProcessType}' no es válido`;
        data.messageUSR = "Tipo de proceso no válido";
        data.dataRes = null;
        bitacora = AddMSG(bitacora, data, "FAIL");
        bitacora.finalRes = true;
        throw bitacora;
    };

    //FIC: Return response OK
    return OK(bitacora);

  } catch (errorBita) {
        //FIC: Unhandled error response configuration 
        if(!errorBita?.finalRes) {
            data.status = data.status || 500;
            data.messageDEV = data.messageDEV || errorBita.message;
            data.messageUSR = data.messageUSR || "<<ERROR CATCH>> La operación con PRODUCTOS <<NO>> tuvo éxito.";
            data.dataRes = data.dataRes || errorBita;
            errorBita = AddMSG(bitacora, data, "FAIL");
        };
        console.log(`<<Message USR>> ${errorBita.messageUSR}`);
        console.log(`<<Message DEV>> ${errorBita.messageDEV}`);

        FAIL(errorBita);
        //FIC: Manejo de errores adicionales si es necesario
        req.error({
            code: 'Internal-Server-Error',
            status: errorBita.status,
            message: errorBita.messageUSR,
            target: errorBita.messageDEV,
            numericSeverity: 1,
            innererror: errorBita
        });
    
        return

    } finally {
      // Cleanup if needed
    }
}

//----------------------------------------
//FIC: Methods for each operation with Bitacora
//----------------------------------------

async function GetAllProductsMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Obtener todos los PRODUCTOS";
        data.method = "GET";
        data.api = "/crud?ProcessType=GetAll";
        data.process = "Consulta de productos";
        data.principal = true;

        // Call the original function
        const productos = await GetAllZTProduct();
        
        data.status = 200;
        data.messageUSR = `Se obtuvieron ${productos.length} productos correctamente`;
        data.messageDEV = `Query ejecutada exitosamente. Productos encontrados: ${productos.length}`;
        data.dataRes = productos;
        
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al obtener los productos";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function GetOneProductMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Obtener UN PRODUCTO";
        data.method = "GET";
        data.api = "/crud?ProcessType=GetOne";
        data.process = "Consulta de producto específico";
        data.principal = true;

        const skuid = params.skuid || params.SKUID;
        
        if (!skuid) {
            data.status = 400;
            data.messageDEV = "SKUID es requerido para obtener un producto";
            data.messageUSR = "ID de producto requerido";
            data.dataRes = null;
            bitacora = AddMSG(bitacora, data, "FAIL");
            return bitacora;
        }

        // Call the original function
        const producto = await GetOneZTProduct(skuid);
        
        if (!producto) {
            data.status = 404;
            data.messageUSR = "Producto no encontrado";
            data.messageDEV = `Producto con SKUID ${skuid} no encontrado`;
            data.dataRes = null;
        } else {
            data.status = 200;
            data.messageUSR = "Producto encontrado correctamente";
            data.messageDEV = `Producto con SKUID ${skuid} encontrado`;
            data.dataRes = producto;
        }
        
        bitacora = AddMSG(bitacora, data, producto ? "OK" : "FAIL", data.status, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al obtener el producto";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function AddOneProductMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Agregar UN PRODUCTO";
        data.method = "POST";
        data.api = "/crud?ProcessType=AddOne";
        data.process = "Creación de producto";
        data.principal = true;

        // Simulate req object for CreateZTProduct
        const mockReq = {
            req: {
                data: body || {},
                body: body || {}
            }
        };

        // Call the original function
        const resultado = await CreateZTProduct(mockReq);
        
        data.status = 201;
        data.messageUSR = "Producto creado exitosamente";
        data.messageDEV = "Producto insertado en la base de datos";
        data.dataRes = resultado;
        
        bitacora = AddMSG(bitacora, data, "OK", 201, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al crear el producto";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function UpdateOneProductMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Actualizar UN PRODUCTO";
        data.method = "PUT";
        data.api = "/crud?ProcessType=UpdateOne";
        data.process = "Actualización de producto";
        data.principal = true;

        const skuid = params.skuid || params.SKUID;
        
        if (!skuid) {
            data.status = 400;
            data.messageDEV = "SKUID es requerido para actualizar un producto";
            data.messageUSR = "ID de producto requerido";
            data.dataRes = null;
            bitacora = AddMSG(bitacora, data, "FAIL");
            return bitacora;
        }

        // Simulate req object for UpdateZTProduct
        const mockReq = {
            req: {
                data: { skuid, ...body },
                body: body || {}
            }
        };

        // Call the original function
        const resultado = await UpdateZTProduct(mockReq, skuid);
        
        data.status = 200;
        data.messageUSR = "Producto actualizado exitosamente";
        data.messageDEV = `Producto con SKUID ${skuid} actualizado`;
        data.dataRes = resultado;
        
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al actualizar el producto";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function DeleteOneProductMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Eliminar UN PRODUCTO";
        data.method = "DELETE";
        data.api = "/crud?ProcessType=DeleteOne";
        data.process = "Eliminación de producto";
        data.principal = true;

        const skuid = params.skuid || params.SKUID;
        
        if (!skuid) {
            data.status = 400;
            data.messageDEV = "SKUID es requerido para eliminar un producto";
            data.messageUSR = "ID de producto requerido";
            data.dataRes = null;
            bitacora = AddMSG(bitacora, data, "FAIL");
            return bitacora;
        }

        // Call the original function (logic delete)
        const resultado = await DeleteZTProductLogic(skuid);
        
        data.status = 200;
        data.messageUSR = "Producto eliminado exitosamente";
        data.messageDEV = `Producto con SKUID ${skuid} eliminado lógicamente`;
        data.dataRes = resultado;
        
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al eliminar el producto";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

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

// CREATE PRODUCT
async function CreateZTProduct(req) {
  try {
    
    // Obtener datos de diferentes posibles ubicaciones
    let data = req.req.data || req.data || {};
    
    // Remover el campo 'procedure' si existe en los datos
    if (data.procedure) {
      delete data.procedure;
    }
    
    console.log('[ZTProducts] Datos finales para crear:', data);
    
    // Validar que tengamos los campos mínimos requeridos
    if (!data.SKUID || !data.DESSKU || !data.IDUNIDADMEDIDA || !data.REGUSER) {
      const error = 'Faltan campos requeridos: SKUID, DESSKU, IDUNIDADMEDIDA, REGUSER';
      console.log('[ZTProducts]', error);
      return { error: true, message: error };
    }
    
    // Verificar que el SKUID no exista ya
    const productoExistente = await ZTProduct.findOne({ SKUID: data.SKUID }).lean();
    if (productoExistente) {
      console.log('[ZTProducts] El producto ya existe');
      return { error: true, message: 'Ya existe un producto con ese SKUID' };
    }
    
    const nuevoProducto = new ZTProduct({
      ...data,
      ACTIVED: true,
      DELETED: false,
      CREATED_AT: new Date(),
      UPDATED_AT: new Date()
    });
    
    const productoGuardado = await nuevoProducto.save();
    console.log('[ZTProducts] Producto creado exitosamente');
    
    // Retornar objeto limpio para evitar errores de CDS
    return {
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        SKUID: productoGuardado.SKUID,
        DESSKU: productoGuardado.DESSKU,
        IDUNIDADMEDIDA: productoGuardado.IDUNIDADMEDIDA,
        REGUSER: productoGuardado.REGUSER,
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

// UPDATE PRODUCT
async function UpdateZTProduct(req, skuid) {
  try {
    let data = req.req.data || req.data || {};
    
    // Si no hay datos, devolver error
    if (!data || Object.keys(data).length === 0) {
      return { error: true, message: 'No se recibieron datos para actualizar' };
    }
    
    // Verificar que el producto existe ANTES de actualizar
    const productoExistente = await ZTProduct.findOne({ SKUID: skuid }).lean();
    console.log('[ZTProducts] Producto existente ANTES:', productoExistente ? 'SÍ EXISTE' : 'NO EXISTE');
    if (productoExistente) {
      console.log('[ZTProducts] Estado actual - ACTIVED:', productoExistente.ACTIVED, 'DELETED:', productoExistente.DELETED);
    }
    
    // Realizar la actualización
    console.log('[ZTProducts] Ejecutando findOneAndUpdate...');
    const productoActualizado = await ZTProduct.findOneAndUpdate(
      { SKUID: skuid, ACTIVED: true, DELETED: false },
      { 
        ...data,
        UPDATED_AT: new Date()
      },
      { new: true }
    ).lean();
    
    console.log('[ZTProducts] Resultado de findOneAndUpdate:', productoActualizado ? 'ENCONTRADO Y ACTUALIZADO' : 'NO ENCONTRADO');
    
    if (!productoActualizado) {
      return { error: true, message: 'Producto no encontrado para actualizar' };
    }
    
    // Verificar que realmente se actualizó en la BD
    const verificacion = await ZTProduct.findOne({ SKUID: skuid }).lean();
    console.log('[ZTProducts] Verificación post-actualización:', verificacion);
    
    console.log('[ZTProducts] Producto actualizado exitosamente');
    return {
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        SKUID: productoActualizado.SKUID,
        DESSKU: productoActualizado.DESSKU,
        IDUNIDADMEDIDA: productoActualizado.IDUNIDADMEDIDA,
        UPDATED_AT: productoActualizado.UPDATED_AT
      }
    };
  } catch (error) {
    console.error('[ZTProducts] Error actualizando producto:', error.message);
    console.error('[ZTProducts] Stack trace:', error.stack);
    throw error;
  }
}

// DELETE LOGIC (SOFT DELETE)
async function DeleteZTProductLogic(skuid) {
  try {
    console.log('[ZTProducts] Eliminación lógica del producto SKUID:', skuid);
    
    const productoEliminado = await ZTProduct.findOneAndUpdate(
      { SKUID: skuid, ACTIVED: true, DELETED: false },
      { 
        DELETED: true,
        ACTIVED: false,
        DELETED_AT: new Date(),
        UPDATED_AT: new Date()
      },
      { new: true }
    ).lean(); 
    
    if (!productoEliminado) {
      console.log('[ZTProducts] No se encontró el producto para eliminar');
      return { error: true, message: 'Producto no encontrado o ya eliminado' };
    }
    
    console.log('[ZTProducts] Producto eliminado lógicamente');
    return {
      success: true,
      message: 'Producto eliminado lógicamente',
      data: {
        SKUID: productoEliminado.SKUID,
        DESSKU: productoEliminado.DESSKU,
        ACTIVED: productoEliminado.ACTIVED,
        DELETED: productoEliminado.DELETED
      }
    };
  } catch (error) {
    console.error('[ZTProducts] Error en eliminación lógica:', error.message);
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
    
    console.log('[ZTProducts] Producto eliminado físicamente:', productoEliminado);
    return productoEliminado;
  } catch (error) {
    console.error('[ZTProducts] Error en eliminación física:', error.message);
    throw error;
  }
}

// ACTIVATE PRODUCT
async function ActivateZTProduct(skuid) {
  try {
    console.log('[ZTProducts] Activando producto SKUID:', skuid);
    
    const productoActivado = await ZTProduct.findOneAndUpdate(
      { SKUID: skuid },
      { 
        ACTIVED: true,
        DELETED: false,
        UPDATED_AT: new Date()
      },
      { new: true }
    ).lean();
    
    if (!productoActivado) {
      console.log('[ZTProducts] No se encontró el producto para activar');
      return { error: true, message: 'Producto no encontrado' };
    }
    
    console.log('[ZTProducts] Producto activado exitosamente');
    // Retornar objeto limpio sin metadatos de MongoDB
    return {
      success: true,
      message: 'Producto activado exitosamente',
      data: {
        SKUID: productoActivado.SKUID,
        DESSKU: productoActivado.DESSKU,
        ACTIVED: productoActivado.ACTIVED,
        DELETED: productoActivado.DELETED
      }
    };
  } catch (error) {
    console.error('[ZTProducts] Error activando producto:', error.message);
    throw error;
  }
} 


async function ZTProductCRUD(req) {
  try {
    const { procedure, type, skuid } = req.req.query;
    let res;
    
    switch (procedure) {
      case 'get':
        switch (type) {
          case 'all':
            res = await GetAllZTProduct();
            break;
          case 'one':
            res = await GetOneZTProduct(skuid);
            break;
          default:
            throw new Error('Coloca un tipo de búsqueda válido (all o one)');
        }
        break;
        
      case 'post':
        res = await CreateZTProduct(req);
        break;
        
      case 'put':
        res = await UpdateZTProduct(req, skuid);
        break;
        
      case 'delete':
        switch (type) {
          case 'logic':
            res = await DeleteZTProductLogic(skuid);
            break;
          case 'hard':
            res = await DeleteZTProductHard(skuid);
            break;
          default:
            throw new Error('Tipo de borrado inválido (logic o hard)');
        }
        break;
        
      case 'activate':
        res = await ActivateZTProduct(skuid);
        break;
        
      default:
        throw new Error('Parámetros inválidos o incompletos');
    }
    
    return res;
  } catch (error) {
    console.error('Error en ZTProductCRUD:', error);
    return { error: true, message: error.message };
  }
}


module.exports = {
  GetAllZTProduct,
  GetOneZTProduct,
  CreateZTProduct,
  UpdateZTProduct,
  DeleteZTProductLogic,
  DeleteZTProductHard,
  ActivateZTProduct,
  ZTProductCRUD,
  crudZTProducts
};
