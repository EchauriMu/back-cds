// ============================================
// IMPORTS
// ============================================
const { getCosmosDatabase } = require('../../config/connectToMongoDB.config');
const mongoose = require('mongoose');
const ZTPromociones = require('../models/mongodb/ztpromociones');
const { OK, FAIL, BITACORA, DATA, AddMSG } = require('../../middlewares/respPWA.handler');
const { saveWithAudit } = require('../../helpers/audit-timestap');

// ============================================
// UTIL: OBTENER PAYLOAD DESDE CDS/EXPRESS
// ============================================
function getPayload(req) {
  const payload = req.req?.body || req.data || null;  
  return payload;
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
async function getPromocionesCosmosContainer() {
  return getCosmosContainer('ZTPROMOCIONES', '/IdPromoOK');
}

// ============================================
// CRUD BÁSICO (MONGO PURO) - Capa 1
// ============================================

//----------------------------------------
//FIC: CRUD Promociones Service with Bitacora
//----------------------------------------
/* EndPoint: localhost:8080/api/ztpromociones/crudPromociones?ProcessType='GetFilters'  */
async function crudZTPromociones(req) {
  
  let bitacora = BITACORA();
  let data = DATA();  

  try {
    // 1. EXTRAER Y SERIALIZAR PARÁMETROS
    const params = req.req?.query || {};
    const body = req.req?.body;
    const paramString = params ? new URLSearchParams(params).toString().trim() : '';
    const { ProcessType, LoggedUser, DBServer, IdPromoOK } = params;    
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
    bitacora.api = '/api/ztpromociones/crudPromociones';
    bitacora.server = process.env.SERVER_NAME || 'No especificado'; // eslint-disable-line

    // 4. EJECUTAR OPERACIÓN SEGÚN PROCESSTYPE
    switch (ProcessType) {
      case 'GetAll':
        bitacora = await GetPromocionMethod(bitacora, params, paramString, body, req, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          if (req?.error) {
            req.error(bitacora.status, bitacora.messageDEV);
          }
          return FAIL(bitacora);
        }
        break;
        
      case 'GetOne':
        if (!IdPromoOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPromoOK';
          data.messageDEV = 'IdPromoOK es requerido para la operación GetOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          if (req?.error) {
            req.error(400, data.messageDEV);
          }
          return FAIL(bitacora);
        }
        bitacora = await GetPromocionMethod(bitacora, params, paramString, body, req, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;
        
      case 'AddOne':
        bitacora = await AddPromocionMethod(bitacora, params, paramString, body, req, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'UpdateOne':
        if (!IdPromoOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPromoOK';
          data.messageDEV = 'IdPromoOK es requerido para la operación UpdateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await UpdatePromocionMethod(bitacora, params, paramString, body, req, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'DeleteLogic':
        if (!IdPromoOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPromoOK';
          data.messageDEV = 'IdPromoOK es requerido para la operación DeleteLogic';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeletePromocionMethod(bitacora, { ...params, paramString }, IdPromoOK, req, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'DeleteHard':
        if (!IdPromoOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPromoOK';
          data.messageDEV = 'IdPromoOK es requerido para la operación DeleteHard';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        bitacora = await DeletePromocionMethod(bitacora, { ...params, paramString }, IdPromoOK, req, LoggedUser, dbServer);
        if (!bitacora.success) {
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        break;

      case 'ActivateOne':
        if (!IdPromoOK) {
          data.process = 'Validación de parámetros';
          data.messageUSR = 'Falta parámetro obligatorio: IdPromoOK';
          data.messageDEV = 'IdPromoOK es requerido para la operación ActivateOne';
          bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
          bitacora.finalRes = true;
          return FAIL(bitacora);
        }
        // Agregar operation=activate para el método UpdatePromocionMethod
        const activateParams = { ...params, operation: 'activate' };
        bitacora = await UpdatePromocionMethod(bitacora, activateParams, paramString, body, req, LoggedUser, dbServer);
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
    data.process = 'Catch principal crudZTPromociones';
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

async function GetAllZTPromociones() {
  // Devolver todas las promociones, incluyendo las inactivas (DELETED: true)
  // Ordenar por DELETED (activas primero) y luego por fecha de creación
  return await ZTPromociones.find({}).sort({ DELETED: 1, REGDATE: -1 }).lean();
}

async function GetOneZTPromocion(idPromoOK) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  const promo = await ZTPromociones.findOne({ IdPromoOK: idPromoOK, ACTIVED: true, DELETED: false }).lean();
  if (!promo) throw new Error(`No se encontró la promoción con IdPromoOK: ${idPromoOK}`);
  return promo;
}

async function AddOneZTPromocion(payload, user) {
  const required = ['IdPromoOK', 'Titulo', 'FechaIni', 'FechaFin'];
  const missing = required.filter(k => !payload[k]);
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);
  if (!user) throw new Error('Usuario requerido para auditoría');
  
  const existe = await ZTPromociones.findOne({ IdPromoOK: payload.IdPromoOK }).lean();
  if (existe) throw new Error(`Ya existe una promoción con IdPromoOK: ${payload.IdPromoOK}`);
  
  // Validar que tenga al menos productos aplicables
  const hasProducts = payload.ProductosAplicables && payload.ProductosAplicables.length > 0;
  
  if (!hasProducts) {
    throw new Error('Debe especificar al menos un producto aplicable');
  }
  
  // Validar descuento
  const tipoDescuento = payload.TipoDescuento || 'PORCENTAJE';
  if (tipoDescuento === 'PORCENTAJE') {
    if (!payload.DescuentoPorcentaje || payload.DescuentoPorcentaje <= 0 || payload.DescuentoPorcentaje > 100) {
      throw new Error('Debe especificar un porcentaje de descuento válido entre 1 y 100');
    }
  } else if (tipoDescuento === 'MONTO_FIJO') {
    if (!payload.DescuentoMonto || payload.DescuentoMonto <= 0) {
      throw new Error('Debe especificar un monto de descuento válido mayor a 0');
    }
  }
  
  // Validar fechas
  const fechaIni = new Date(payload.FechaIni);
  const fechaFin = new Date(payload.FechaFin);
  if (fechaFin <= fechaIni) {
    throw new Error('La fecha fin debe ser posterior a la fecha inicio');
  }
  
  // Preparar datos de la promoción
  const promoData = { 
    ...payload, 
    ACTIVED: payload.ACTIVED ?? true, 
    DELETED: payload.DELETED ?? false,
    TipoDescuento: tipoDescuento,
    PermiteAcumulacion: payload.PermiteAcumulacion ?? false,
    LimiteUsos: payload.LimiteUsos || null,
    UsosActuales: 0
  };
  
  return await saveWithAudit(ZTPromociones, {}, promoData, user, 'CREATE');
}

async function UpdateOneZTPromocion(idPromoOK, payload, user) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  if (!user) throw new Error('Usuario requerido para auditoría');
  
  // Buscar la promoción existente
  const existingPromo = await ZTPromociones.findOne({ 
    IdPromoOK: idPromoOK, 
    DELETED: false 
  }).lean();
  
  if (!existingPromo) {
    throw new Error(`No se encontró la promoción con IdPromoOK: ${idPromoOK}`);
  }
  
  // Preparar datos de actualización
  const updateData = {
    ...payload,
    MODUSER: user,
    MODDATE: new Date()
  };
  
  // Si se actualizan las fechas, validar que sean correctas
  if (updateData.FechaIni || updateData.FechaFin) {
    const fechaIni = new Date(updateData.FechaIni || existingPromo.FechaIni);
    const fechaFin = new Date(updateData.FechaFin || existingPromo.FechaFin);
    
    if (fechaFin <= fechaIni) {
      throw new Error('La fecha fin debe ser posterior a la fecha inicio');
    }
  }
  
  // Validar descuento solo si se está actualizando explícitamente
  if (updateData.TipoDescuento || updateData.DescuentoPorcentaje !== undefined || updateData.DescuentoMonto !== undefined) {
    const tipoDescuento = updateData.TipoDescuento || existingPromo.TipoDescuento;
    
    if (tipoDescuento === 'PORCENTAJE') {
      // Solo validar si se proporciona un nuevo valor de descuento
      if (updateData.DescuentoPorcentaje !== undefined) {
        const descuento = updateData.DescuentoPorcentaje;
        if (descuento <= 0 || descuento > 100) {
          throw new Error('El porcentaje de descuento debe estar entre 1 y 100');
        }
      }
    } else if (tipoDescuento === 'MONTO_FIJO') {
      // Solo validar si se proporciona un nuevo valor de descuento
      if (updateData.DescuentoMonto !== undefined) {
        const descuento = updateData.DescuentoMonto;
        if (descuento <= 0) {
          throw new Error('El monto de descuento debe ser mayor a 0');
        }
      }
    }
  }
  
  // Validar que tenga al menos productos aplicables si se está actualizando
  if (updateData.ProductosAplicables !== undefined) {
    const hasProducts = updateData.ProductosAplicables && updateData.ProductosAplicables.length > 0;
    
    if (!hasProducts) {
      throw new Error('Debe especificar al menos un producto aplicable');
    }
  }
  
  const filter = { IdPromoOK: idPromoOK, DELETED: false };
  const promo = await saveWithAudit(ZTPromociones, filter, updateData, user, 'UPDATE');
  
  if (!promo) {
    throw new Error(`No se pudo actualizar la promoción con IdPromoOK: ${idPromoOK}`);
  }
  
  return promo;
}

async function DeleteLogicZTPromocion(idPromoOK, user) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  if (!user) throw new Error('Usuario requerido para auditoría');
  
  // Manejar uno o varios IDs
  const ids = Array.isArray(idPromoOK) ? idPromoOK : [idPromoOK];
  const results = [];
  const errors = [];
  
  for (const id of ids) {
    try {
      const filter = { IdPromoOK: id, DELETED: false };
      const deleteData = { DELETED: true, ACTIVED: false };
      const promo = await saveWithAudit(ZTPromociones, filter, deleteData, user, 'UPDATE');
      if (!promo) {
        errors.push({ IdPromoOK: id, error: `No se encontró la promoción con IdPromoOK: ${id}` });
      } else {
        results.push(promo);
      }
    } catch (error) {
      errors.push({ IdPromoOK: id, error: error.message });
    }
  }
  
  // Si es un solo ID, devolver el resultado directo o lanzar error
  if (!Array.isArray(idPromoOK)) {
    if (errors.length > 0) throw new Error(errors[0].error);
    return results[0];
  }
  
  // Si son múltiples IDs, devolver resumen
  return {
    success: results.length,
    failed: errors.length,
    results: results,
    errors: errors
  };
}

async function DeleteHardZTPromocion(idPromoOK) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  
  // Manejar uno o varios IDs
  const ids = Array.isArray(idPromoOK) ? idPromoOK : [idPromoOK];
  const results = [];
  const errors = [];
  
  for (const id of ids) {
    try {
      const promo = await ZTPromociones.findOneAndDelete({ IdPromoOK: id }).lean();
      if (!promo) {
        errors.push({ IdPromoOK: id, error: `No se encontró la promoción con IdPromoOK: ${id}` });
      } else {
        results.push(promo);
      }
    } catch (error) {
      errors.push({ IdPromoOK: id, error: error.message });
    }
  }
  
  // Si es un solo ID, devolver el resultado directo o lanzar error
  if (!Array.isArray(idPromoOK)) {
    if (errors.length > 0) throw new Error(errors[0].error);
    return results[0];
  }
  
  // Si son múltiples IDs, devolver resumen
  return {
    success: results.length,
    failed: errors.length,
    results: results,
    errors: errors
  };
}

async function ActivateOneZTPromocion(idPromoOK, user) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  
  // Manejar uno o varios IDs
  const ids = Array.isArray(idPromoOK) ? idPromoOK : [idPromoOK];
  const results = [];
  const errors = [];
  
  for (const id of ids) {
    try {
      const promo = await ZTPromociones.findOneAndUpdate(
        { IdPromoOK: id },
        { ACTIVED: true, DELETED: false },
        { new: true, lean: true }
      );
      if (!promo) {
        errors.push({ IdPromoOK: id, error: `No se encontró la promoción con IdPromoOK: ${id}` });
      } else {
        results.push(promo);
      }
    } catch (error) {
      errors.push({ IdPromoOK: id, error: error.message });
    }
  }
  
  // Si es un solo ID, devolver el resultado directo o lanzar error
  if (!Array.isArray(idPromoOK)) {
    if (errors.length > 0) throw new Error(errors[0].error);
    return results[0];
  }
  
  // Si son múltiples IDs, devolver resumen
  return {
    success: results.length,
    failed: errors.length,
    results: results,
    errors: errors
  };
}

// ============================================
// CRUD BÁSICO (COSMOS DB) - Capa 1
// ============================================
async function GetAllZTPromocionesCosmos() {
  const container = await getPromocionesCosmosContainer();
  // Se quita el ORDER BY para evitar el error de índice compuesto en Cosmos DB.
  // La ordenación se realizará en el código de la aplicación.
  const query = "SELECT * from c";
  const { resources: items } = await container.items.query(query).fetchAll();

  // Ordenar los resultados en JavaScript, replicando la lógica de MongoDB.
  items.sort((a, b) => {
    // 1. Poner los activos (DELETED: false) primero.
    if (a.DELETED !== b.DELETED) {
      return a.DELETED ? 1 : -1;
    }
    // 2. Para los que tienen el mismo estado, ordenar por fecha de registro descendente (más nuevos primero).
    return new Date(b.REGDATE) - new Date(a.REGDATE);
  });

  return items;
}

async function GetOneZTPromocionCosmos(idPromoOK) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  const container = await getPromocionesCosmosContainer();
  const { resource: item } = await container.item(idPromoOK, idPromoOK).read();
  if (!item || item.DELETED === true) throw new Error(`No se encontró la promoción con IdPromoOK: ${idPromoOK}`);
  return item;
}

async function AddOneZTPromocionCosmos(payload, user) {
  const required = ['IdPromoOK', 'Titulo', 'FechaIni', 'FechaFin'];
  const missing = required.filter(k => !payload[k]);
  if (missing.length) throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`);
  if (!user) throw new Error('Usuario requerido para auditoría');

  const container = await getPromocionesCosmosContainer();

  const { resource: existing } = await container.item(payload.IdPromoOK, payload.IdPromoOK).read().catch(() => ({}));
  if (existing) throw new Error(`Ya existe una promoción con IdPromoOK: ${payload.IdPromoOK}`);

  // Validaciones de negocio
  if (!payload.ProductosAplicables || payload.ProductosAplicables.length === 0) {
    throw new Error('Debe especificar al menos un producto aplicable');
  }
  const tipoDescuento = payload.TipoDescuento || 'PORCENTAJE';
  if (tipoDescuento === 'PORCENTAJE' && (!payload.DescuentoPorcentaje || payload.DescuentoPorcentaje <= 0 || payload.DescuentoPorcentaje > 100)) {
    throw new Error('Debe especificar un porcentaje de descuento válido entre 1 y 100');
  }
  if (tipoDescuento === 'MONTO_FIJO' && (!payload.DescuentoMonto || payload.DescuentoMonto <= 0)) {
    throw new Error('Debe especificar un monto de descuento válido mayor a 0');
  }
  if (new Date(payload.FechaFin) <= new Date(payload.FechaIni)) {
    throw new Error('La fecha fin debe ser posterior a la fecha inicio');
  }

  const newItem = {
    id: payload.IdPromoOK,
    partitionKey: payload.IdPromoOK,
    ...payload,
    ACTIVED: payload.ACTIVED ?? true,
    DELETED: payload.DELETED ?? false,
    TipoDescuento: tipoDescuento,
    PermiteAcumulacion: payload.PermiteAcumulacion ?? false,
    LimiteUsos: payload.LimiteUsos || null,
    UsosActuales: 0,
    REGUSER: user,
    REGDATE: new Date().toISOString(),
    HISTORY: [{
      user: user,
      action: 'CREATE',
      date: new Date().toISOString(),
      changes: payload
    }]
  };

  const { resource: createdItem } = await container.items.create(newItem);

  return createdItem;
}

async function UpdateOneZTPromocionCosmos(idPromoOK, payload, user) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  if (!user) throw new Error('Usuario requerido para auditoría');

  const container = await getPromocionesCosmosContainer();
  const { resource: currentItem } = await container.item(idPromoOK, idPromoOK).read();
  if (!currentItem || currentItem.DELETED) throw new Error(`No se encontró la promoción con IdPromoOK: ${idPromoOK}`);

  // Validaciones de negocio (similar a la versión de Mongo)
  // ...

  const updatedItem = {
    ...currentItem,
    ...payload,
    id: currentItem.id,
    partitionKey: currentItem.partitionKey,
    MODUSER: user,
    MODDATE: new Date().toISOString(),
    HISTORY: [...(currentItem.HISTORY || []), { user, action: 'UPDATE', date: new Date().toISOString(), changes: payload }]
  };

  const { resource: replacedItem } = await container.item(currentItem.id, currentItem.partitionKey).replace(updatedItem);
  return replacedItem;
}

async function DeleteLogicZTPromocionCosmos(idPromoOK, user) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  if (!user) throw new Error('Usuario requerido para auditoría');

  const container = await getPromocionesCosmosContainer();
  
  // Manejar uno o varios IDs
  const ids = Array.isArray(idPromoOK) ? idPromoOK : [idPromoOK];
  const results = [];
  const errors = [];
  
  for (const id of ids) {
    try {
      const { resource: currentItem } = await container.item(id, id).read();
      if (!currentItem || currentItem.DELETED) {
        errors.push({ IdPromoOK: id, error: `No se encontró la promoción con IdPromoOK: ${id}` });
        continue;
      }

      const updatedItem = {
        ...currentItem,
        ACTIVED: false,
        DELETED: true,
        MODUSER: user,
        MODDATE: new Date().toISOString(),
        HISTORY: [...(currentItem.HISTORY || []), { user, action: 'DELETE_LOGIC', date: new Date().toISOString(), changes: { ACTIVED: false, DELETED: true } }]
      };

      const { resource: replacedItem } = await container.item(currentItem.id, currentItem.partitionKey).replace(updatedItem);
      results.push(replacedItem);
    } catch (error) {
      errors.push({ IdPromoOK: id, error: error.message });
    }
  }
  
  // Si es un solo ID, devolver el resultado directo o lanzar error
  if (!Array.isArray(idPromoOK)) {
    if (errors.length > 0) throw new Error(errors[0].error);
    return results[0];
  }
  
  // Si son múltiples IDs, devolver resumen
  return {
    success: results.length,
    failed: errors.length,
    results: results,
    errors: errors
  };
}

async function DeleteHardZTPromocionCosmos(idPromoOK) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  const container = await getPromocionesCosmosContainer();
  
  // Manejar uno o varios IDs
  const ids = Array.isArray(idPromoOK) ? idPromoOK : [idPromoOK];
  const results = [];
  const errors = [];
  
  for (const id of ids) {
    try {
      await container.item(id, id).delete();
      results.push({ mensaje: 'Promoción eliminada permanentemente de Cosmos DB', IdPromoOK: id });
    } catch (error) {
      errors.push({ IdPromoOK: id, error: error.message });
    }
  }
  
  // Si es un solo ID, devolver el resultado directo o lanzar error
  if (!Array.isArray(idPromoOK)) {
    if (errors.length > 0) throw new Error(errors[0].error);
    return results[0];
  }
  
  // Si son múltiples IDs, devolver resumen
  return {
    success: results.length,
    failed: errors.length,
    results: results,
    errors: errors
  };
}

async function ActivateOneZTPromocionCosmos(idPromoOK, user) {
  if (!idPromoOK) throw new Error('IdPromoOK es requerido');
  const container = await getPromocionesCosmosContainer();
  
  // Manejar uno o varios IDs
  const ids = Array.isArray(idPromoOK) ? idPromoOK : [idPromoOK];
  const results = [];
  const errors = [];
  
  for (const id of ids) {
    try {
      const { resource: currentItem } = await container.item(id, id).read();
      if (!currentItem) {
        errors.push({ IdPromoOK: id, error: `No se encontró la promoción con IdPromoOK: ${id}` });
        continue;
      }

      const updatedItem = {
        ...currentItem,
        ACTIVED: true,
        DELETED: false,
        MODUSER: user,
        MODDATE: new Date().toISOString(),
        HISTORY: [...(currentItem.HISTORY || []), { user, action: 'ACTIVATE', date: new Date().toISOString(), changes: { ACTIVED: true, DELETED: false } }]
      };

      const { resource: replacedItem } = await container.item(currentItem.id, currentItem.partitionKey).replace(updatedItem);
      results.push(replacedItem);
    } catch (error) {
      errors.push({ IdPromoOK: id, error: error.message });
    }
  }
  
  // Si es un solo ID, devolver el resultado directo o lanzar error
  if (!Array.isArray(idPromoOK)) {
    if (errors.length > 0) throw new Error(errors[0].error);
    return results[0];
  }
  
  // Si son múltiples IDs, devolver resumen
  return {
    success: results.length,
    failed: errors.length,
    results: results,
    errors: errors
  };
}

//####################################################################################
//FIC: Methods for each operation with Bitacora - Capa 2
//####################################################################################

async function GetPromocionMethod(bitacora, params, paramString, body, req, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Obtener promoción(es)';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztpromociones/crudPromociones';
    data.queryString = paramString;
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Obtener promoción(es)';
    
    try {
        const processType = params.ProcessType;
        
        if (processType === 'GetAll') {
            bitacora.process = "Obtener todas las PROMOCIONES";
            data.process = "Consulta de todas las promociones";
            data.method = "GET";
            data.api = "/api/ztpromociones/crudPromociones?ProcessType=GetAll";
            data.principal = true;

            let promociones;
            switch (dbServer) {
                case 'MongoDB':
                    promociones = await GetAllZTPromociones();
                    break;
                case 'CosmosDB':
                    promociones = await GetAllZTPromocionesCosmos();
                    break;
                default:
                    throw new Error(`DBServer no soportado: ${dbServer}`);
            }
            
            data.dataRes = promociones;
            data.messageUSR = `Se obtuvieron ${promociones.length} promociones correctamente`;
            data.messageDEV = 'GetAllZTPromociones ejecutado sin errores';
            bitacora = AddMSG(bitacora, data, 'OK', 200, true);
            
        } else if (processType === 'GetOne') {
            bitacora.process = "Obtener UNA PROMOCIÓN";
            data.process = "Consulta de promoción específica";
            data.method = "GET";
            data.api = "/api/ztpromociones/crudPromociones?ProcessType=GetOne";
            data.principal = true;

            const idPromoOK = params.IdPromoOK;
            
            if (!idPromoOK) {
                data.messageUSR = "ID de promoción requerido";
                data.messageDEV = "IdPromoOK es requerido para obtener una promoción";
                bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
                bitacora.success = false;
                return bitacora;
            }

            let promocion;
            switch (dbServer) {
                case 'MongoDB':
                    promocion = await GetOneZTPromocion(idPromoOK);
                    break;
                case 'CosmosDB':
                    promocion = await GetOneZTPromocionCosmos(idPromoOK);
                    break;
                default:
                    throw new Error(`DBServer no soportado: ${dbServer}`);
            }
            
            data.dataRes = promocion;
            data.messageUSR = "Promoción encontrada correctamente";
            data.messageDEV = `Promoción con IdPromoOK ${idPromoOK} encontrada`;
            bitacora = AddMSG(bitacora, data, 'OK', 200, true);
        }
        
        bitacora.success = true;
        
        // Establecer status HTTP 200 igual que en AddPromocionMethod
        if (req?.http?.res) {
            req.http.res.status(200);
        }
        
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES 404 vs 500
        if (error.message.includes('No se encontró') || error.message.includes('no encontrado')) {
            data.messageUSR = 'Promoción no encontrada';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
        } else {
            data.messageUSR = 'Error al obtener la(s) promoción(es)';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        data.stack = process.env.NODE_ENV === 'development' ? error.stack : undefined; // eslint-disable-line
        bitacora.success = false;
        return bitacora;
    }
}

async function AddPromocionMethod(bitacora, params, paramString, body, req, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Agregar promoción';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztpromociones/crudPromociones';
    data.method = "POST";
    data.principal = true;
    data.queryString = paramString;
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Agregar promoción';
    bitacora.api = '/api/ztpromociones/crudPromociones';
    bitacora.queryString = paramString;
    
    try {
        let result;
        switch (dbServer) {
            case 'MongoDB':
                result = await AddOneZTPromocion(getPayload(req), params.LoggedUser);
                break;
            case 'CosmosDB':
                result = await AddOneZTPromocionCosmos(getPayload(req), params.LoggedUser);
                break;
            default:
                throw new Error(`DBServer no soportado: ${dbServer}`);
        }
        
        data.dataRes = result;
        data.messageUSR = 'Promoción creada exitosamente';
        data.messageDEV = 'AddOneZTPromocion ejecutado sin errores';
        bitacora = AddMSG(bitacora, data, 'OK', 201, true);
        bitacora.success = true;
        
        if (req?.http?.res) {
            req.http.res.status(201);
            const id = (result && (result.IdPromoOK)) || '';
            if (id) {
                req.http.res.set('Location', `/api/ztpromociones/Promociones('${id}')`);
            }
        }
        
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES
        if (error.message.includes('Faltan campos') || error.message.includes('Ya existe')) {
            data.messageUSR = 'Error al crear la promoción - datos no válidos';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        } else {
            // Cualquier otro error de negocio o BD
            data.messageUSR = 'Error al crear la promoción';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        bitacora.success = false;
        return bitacora;
    }
}

/**
 * UpdateOne: Actualiza una promoción
 * Usa saveWithAudit (con IdPromoOK)
 */
async function UpdatePromocionMethod(bitacora, params, paramString, body, req, user, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Actualizar promoción';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztpromociones/crudPromociones';
    data.method = "PUT";
    data.principal = true;
    data.queryString = paramString;
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Actualizar promoción';
    bitacora.api = '/api/ztpromociones/crudPromociones';
    bitacora.queryString = paramString;
    
    try {
        let result;
        const idPromoOK = params.IdPromoOK;
        const isActivate = params.operation === 'activate' || params.type === 'activate';
        
        switch (dbServer) {
            case 'MongoDB':
                if (isActivate) {
                    // Ahora ActivateOneZTPromocion acepta user como segundo parámetro
                    result = await ActivateOneZTPromocion(idPromoOK, user);
                } else {
                    result = await UpdateOneZTPromocion(
                        idPromoOK,
                        getPayload(req),
                        user
                    );
                }
                break;
            case 'CosmosDB':
                if (isActivate) {
                    result = await ActivateOneZTPromocionCosmos(idPromoOK, user);
                } else {
                    result = await UpdateOneZTPromocionCosmos(idPromoOK, getPayload(req), user);
                }
                break;
            default:
                throw new Error(`DBServer no soportado: ${dbServer}`);
        }
        
        data.dataRes = result;
        data.messageUSR = isActivate ? 'Promoción activada exitosamente' : 'Promoción actualizada exitosamente';
        data.messageDEV = isActivate ? 'ActivateOneZTPromocion ejecutado sin errores' : 'UpdateOneZTPromocion ejecutado sin errores';
        bitacora = AddMSG(bitacora, data, 'OK', 200, true);
        bitacora.success = true;
        
        // Establecer status HTTP 200 igual que en AddPromocionMethod
        if (req?.http?.res) {
            req.http.res.status(200);
        }
        
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES
        if (error.message.includes('No se encontró') || error.message.includes('no encontrado')) {
            data.messageUSR = 'Error al actualizar la promoción - promoción no encontrada';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
        } else if (error.message.includes('Faltan campos') || error.message.includes('no válido')) {
            data.messageUSR = 'Error al actualizar la promoción - datos no válidos';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 400, true);
        } else {
            data.messageUSR = 'Error al actualizar la promoción';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        bitacora.success = false;
        return bitacora;
    }
}

async function DeletePromocionMethod(bitacora, params, IdPromoOK, req, user, dbServer) {
    let data = DATA();
    
    // Configurar contexto de data
    data.process = 'Eliminar promoción';
    data.processType = params.ProcessType || '';
    data.loggedUser = params.LoggedUser || '';
    data.dbServer = dbServer;
    data.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    data.api = '/api/ztpromociones/crudPromociones';
    data.method = "DELETE";
    data.principal = true;
    data.queryString = params.paramString || '';
    
    // Propagar en bitácora
    bitacora.processType = params.ProcessType || '';
    bitacora.loggedUser = params.LoggedUser || '';
    bitacora.dbServer = dbServer;
    bitacora.server = process.env.SERVER_NAME || ''; // eslint-disable-line
    bitacora.process = 'Eliminar promoción';
    bitacora.api = '/api/ztpromociones/crudPromociones';
    bitacora.queryString = params.paramString || '';
    
    try {
        let result;
        const isHardDelete = params.ProcessType === 'DeleteHard';
        
        switch (dbServer) {
            case 'MongoDB':
                if (isHardDelete) {
                    result = await DeleteHardZTPromocion(IdPromoOK);
                } else {
                    result = await DeleteLogicZTPromocion(IdPromoOK, user);
                }
                break;
            case 'CosmosDB':
                if (isHardDelete) {
                    result = await DeleteHardZTPromocionCosmos(IdPromoOK);
                } else {
                    result = await DeleteLogicZTPromocionCosmos(IdPromoOK, user);
                }
                break;
            default:
                throw new Error(`DBServer no soportado: ${dbServer}`);
        }
        
        data.dataRes = result;
        data.messageUSR = isHardDelete ? 'Promoción eliminada físicamente' : 'Promoción eliminada lógicamente';
        data.messageDEV = isHardDelete ? 'DeleteHardZTPromocion ejecutado sin errores' : 'DeleteLogicZTPromocion ejecutado sin errores';
        bitacora = AddMSG(bitacora, data, 'OK', 200, true);
        bitacora.success = true;
        
        // Establecer status HTTP 200 igual que en AddPromocionMethod
        if (req?.http?.res) {
            req.http.res.status(200);
        }
        
        return bitacora;
        
    } catch (error) {
        // MANEJO ESPECÍFICO DE ERRORES
        if (error.message.includes('No se encontró') || error.message.includes('no encontrado')) {
            data.messageUSR = 'Error al eliminar la promoción - promoción no encontrada';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 404, true);
        } else {
            data.messageUSR = 'Error al eliminar la promoción';
            data.messageDEV = error.message;
            bitacora = AddMSG(bitacora, data, 'FAIL', 500, true);
        }
        bitacora.success = false;
        return bitacora;
    }
}

// ============================================
// CONEXIÓN SEGÚN DBSERVER
// ============================================
async function GetConnectionByDbServer(dbServer) {
  switch (dbServer) {
    case 'MongoDB':
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
      }
      return mongoose.connection;
      
    case 'HANA':
      throw new Error('HANA no implementado');
      
    case 'AzureCosmos':
      throw new Error('Azure Cosmos no implementado');
      
    default:
      throw new Error(`DBServer no soportado: ${dbServer}`);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    crudZTPromociones,
    GetAllZTPromociones,
    GetOneZTPromocion,
    AddOneZTPromocion,
    UpdateOneZTPromocion,
    DeleteLogicZTPromocion,
    DeleteHardZTPromocion,
    ActivateOneZTPromocion,
    // Cosmos DB Functions
    GetAllZTPromocionesCosmos,
    GetOneZTPromocionCosmos,
    AddOneZTPromocionCosmos,
    UpdateOneZTPromocionCosmos,
    DeleteLogicZTPromocionCosmos,
    DeleteHardZTPromocionCosmos,
    ActivateOneZTPromocionCosmos
};
