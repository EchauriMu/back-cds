// Servicio para ZTPRODUCTS (productos)
const mongoose = require('mongoose');
const ZTProduct = require('../models/mongodb/ztproducts');

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
    const data = req.req.data;
    console.log('[ZTProducts] Creando producto:', data);
    
    const nuevoProducto = new ZTProduct({
      ...data,
      ACTIVED: true,
      DELETED: false,
      CREATED_AT: new Date(),
      UPDATED_AT: new Date()
    });
    
    const productoGuardado = await nuevoProducto.save();
    console.log('[ZTProducts] Producto creado exitosamente:', productoGuardado);
    return productoGuardado;
  } catch (error) {
    console.error('[ZTProducts] Error creando producto:', error.message);
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
    console.log('[ZTProducts] ✅ Verificación post-actualización:', verificacion);
    
    console.log('[ZTProducts] ✅ Producto actualizado exitosamente');
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
    console.error('[ZTProducts] ❌ Error actualizando producto:', error.message);
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
  ZTProductCRUD
};
