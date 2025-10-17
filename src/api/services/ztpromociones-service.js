// src/api/services/ztpromociones-service.js

// Importar el modelo mongoose
// Servicio para ZTPROMOCIONES (promociones)
const mongoose = require('mongoose');
const ZTPromociones = require('../models/mongodb/ztpromociones');

//FIC: Imports fuctions/methods
const {OK, FAIL, BITACORA, DATA, AddMSG} = require('../../middlewares/respPWA.handler');

//----------------------------------------
//FIC: CRUD Promociones Service with Bitacora
//----------------------------------------
/* EndPoint: localhost:8080/api/ztpromociones/crud?ProcessType='GetAll'  */
async function crudZTPromociones(req) {
  
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
            //FIC: Get All Promociones Method
            //------------------------------------------------------           
            bitacora = await GetAllPromocionesMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;

      case 'GetOne':
            //FIC: Get One Promocion Method
            //------------------------------------------------------           
            bitacora = await GetOnePromocionMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;
    
      case 'AddOne':
            //FIC: Add One Promocion Method
            //------------------------------------------------------           
            bitacora = await AddOnePromocionMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;

      case 'UpdateOne':
            //FIC: Update One Promocion Method
            //------------------------------------------------------           
            bitacora = await UpdateOnePromocionMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                return bitacora;
            });
        break;

      case 'DeleteOne':
            //FIC: Delete One Promocion Method
            //------------------------------------------------------           
            bitacora = await DeleteOnePromocionMethod(bitacora, params, paramString, body)
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
            data.messageUSR = data.messageUSR || "<<ERROR CATCH>> La operación con PROMOCIONES <<NO>> tuvo éxito.";
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

async function GetAllPromocionesMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Obtener todas las PROMOCIONES";
        data.method = "GET";
        data.api = "/crud?ProcessType=GetAll";
        data.process = "Consulta de promociones";
        data.principal = true;

        // Call the original function
        const promociones = await GetAllZTPromociones();
        
        data.status = 200;
        data.messageUSR = `Se obtuvieron ${promociones.length} promociones correctamente`;
        data.messageDEV = `Query ejecutada exitosamente. Promociones encontradas: ${promociones.length}`;
        data.dataRes = promociones;
        
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al obtener las promociones";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function GetOnePromocionMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Obtener UNA PROMOCION";
        data.method = "GET";
        data.api = "/crud?ProcessType=GetOne";
        data.process = "Consulta de promoción específica";
        data.principal = true;

        const idPromoOK = params.idPromoOK || params.IdPromoOK;
        
        if (!idPromoOK) {
            data.status = 400;
            data.messageDEV = "IdPromoOK es requerido para obtener una promoción";
            data.messageUSR = "ID de promoción requerido";
            data.dataRes = null;
            bitacora = AddMSG(bitacora, data, "FAIL");
            return bitacora;
        }

        // Call the original function
        const promocion = await GetOneZTPromocion(idPromoOK);
        
        if (!promocion) {
            data.status = 404;
            data.messageUSR = "Promoción no encontrada";
            data.messageDEV = `Promoción con IdPromoOK ${idPromoOK} no encontrada`;
            data.dataRes = null;
        } else {
            data.status = 200;
            data.messageUSR = "Promoción encontrada correctamente";
            data.messageDEV = `Promoción con IdPromoOK ${idPromoOK} encontrada`;
            data.dataRes = promocion;
        }
        
        bitacora = AddMSG(bitacora, data, promocion ? "OK" : "FAIL", data.status, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al obtener la promoción";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function AddOnePromocionMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Agregar UNA PROMOCION";
        data.method = "POST";
        data.api = "/crud?ProcessType=AddOne";
        data.process = "Creación de promoción";
        data.principal = true;

        // Simulate req object for CreateZTPromocion
        const mockReq = {
            req: {
                data: body || {},
                body: body || {}
            }
        };

        // Call the original function
        const resultado = await CreateZTPromocion(mockReq);
        
        data.status = 201;
        data.messageUSR = "Promoción creada exitosamente";
        data.messageDEV = "Promoción insertada en la base de datos";
        data.dataRes = resultado;
        
        bitacora = AddMSG(bitacora, data, "OK", 201, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al crear la promoción";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function UpdateOnePromocionMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Actualizar UNA PROMOCION";
        data.method = "PUT";
        data.api = "/crud?ProcessType=UpdateOne";
        data.process = "Actualización de promoción";
        data.principal = true;

        const idPromoOK = params.idPromoOK || params.IdPromoOK;
        
        if (!idPromoOK) {
            data.status = 400;
            data.messageDEV = "IdPromoOK es requerido para actualizar una promoción";
            data.messageUSR = "ID de promoción requerido";
            data.dataRes = null;
            bitacora = AddMSG(bitacora, data, "FAIL");
            return bitacora;
        }

        // Simulate req object for UpdateZTPromocion
        const mockReq = {
            req: {
                data: { idPromoOK, ...body },
                body: body || {}
            }
        };

        // Call the original function
        const resultado = await UpdateZTPromocion(mockReq, idPromoOK);
        
        data.status = 200;
        data.messageUSR = "Promoción actualizada exitosamente";
        data.messageDEV = `Promoción con IdPromoOK ${idPromoOK} actualizada`;
        data.dataRes = resultado;
        
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al actualizar la promoción";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

async function DeleteOnePromocionMethod(bitacora, params, paramString, body) {
    let data = DATA();
    
    try {
        //FIC: Log configuration
        bitacora.process = "Eliminar UNA PROMOCION";
        data.method = "DELETE";
        data.api = "/crud?ProcessType=DeleteOne";
        data.process = "Eliminación de promoción";
        data.principal = true;

        const idPromoOK = params.idPromoOK || params.IdPromoOK;
        
        if (!idPromoOK) {
            data.status = 400;
            data.messageDEV = "IdPromoOK es requerido para eliminar una promoción";
            data.messageUSR = "ID de promoción requerido";
            data.dataRes = null;
            bitacora = AddMSG(bitacora, data, "FAIL");
            return bitacora;
        }

        // Call the original function (logic delete)
        const resultado = await DeleteZTPromocionLogic(idPromoOK);
        
        data.status = 200;
        data.messageUSR = "Promoción eliminada exitosamente";
        data.messageDEV = `Promoción con IdPromoOK ${idPromoOK} eliminada lógicamente`;
        data.dataRes = resultado;
        
        bitacora = AddMSG(bitacora, data, "OK", 200, true);
        
        return bitacora;
        
    } catch (error) {
        data.status = 500;
        data.messageDEV = error.message;
        data.messageUSR = "Error al eliminar la promoción";
        data.dataRes = null;
        
        bitacora = AddMSG(bitacora, data, "FAIL");
        return bitacora;
    }
}

// GET ALL PROMOCIONES
async function GetAllZTPromociones() {
  try {
    const promociones = await ZTPromociones.find({ ACTIVED: true, DELETED: false }).lean();
    console.log('[ZTPromociones] Promociones encontradas:', promociones.length);
    return promociones;
  } catch (error) {
    console.error('[ZTPromociones] Error obteniendo promociones:', error.message);
    throw error;
  }
}

// GET ONE PROMOCION BY IdPromoOK
async function GetOneZTPromocion(idPromoOK) {
  try {
    console.log('[ZTPromociones] Buscando promoción por IdPromoOK:', idPromoOK);
    const promocion = await ZTPromociones.findOne({ IdPromoOK: idPromoOK, ACTIVED: true, DELETED: false }).lean();
    
    if (!promocion) {
      console.log('[ZTPromociones] No se encontró la promoción en la base de datos.');
      return null;
    }
    
    console.log('[ZTPromociones] Promoción encontrada:', promocion);
    return promocion;
  } catch (error) {
    console.error('[ZTPromociones] Error buscando promoción:', error.message);
    throw error;
  }
}

// CREATE PROMOCION
async function CreateZTPromocion(req) {
  try {
    
    // Obtener datos de diferentes posibles ubicaciones
    let data = req.req.data || req.data || {};
    
    // Remover el campo 'procedure' si existe en los datos
    if (data.procedure) {
      delete data.procedure;
    }
    
    console.log('[ZTPromociones] Datos finales para crear:', data);
    
    // Validar que tengamos los campos mínimos requeridos
    if (!data.IdPromoOK || !data.Titulo || !data.FechaIni || !data.FechaFin || !data.REGUSER) {
      const error = 'Faltan campos requeridos: IdPromoOK, Titulo, FechaIni, FechaFin, REGUSER';
      console.log('[ZTPromociones]', error);
      return { error: true, message: error };
    }
    
    // Verificar que el IdPromoOK no exista ya
    const promocionExistente = await ZTPromociones.findOne({ IdPromoOK: data.IdPromoOK }).lean();
    if (promocionExistente) {
      console.log('[ZTPromociones] La promoción ya existe');
      return { error: true, message: 'Ya existe una promoción con ese IdPromoOK' };
    }
    
    const nuevaPromocion = new ZTPromociones({
      ...data,
      ACTIVED: true,
      DELETED: false,
      REGDATE: new Date(),
      MODDATE: new Date()
    });
    
    const promocionGuardada = await nuevaPromocion.save();
    console.log('[ZTPromociones] Promoción creada exitosamente');
    
    // Retornar objeto limpio para evitar errores de CDS
    return {
      success: true,
      message: 'Promoción creada exitosamente',
      data: {
        IdPromoOK: promocionGuardada.IdPromoOK,
        Titulo: promocionGuardada.Titulo,
        Descripcion: promocionGuardada.Descripcion,
        FechaIni: promocionGuardada.FechaIni,
        FechaFin: promocionGuardada.FechaFin,
        REGUSER: promocionGuardada.REGUSER,
        ACTIVED: promocionGuardada.ACTIVED,
        DELETED: promocionGuardada.DELETED,
        REGDATE: promocionGuardada.REGDATE
      }
    };
  } catch (error) {
    console.error('[ZTPromociones] Error creando promoción:', error.message);
    if (error.name === 'ValidationError') {
      return { error: true, message: error.message };
    }
    throw error;
  }
}

// UPDATE PROMOCION
async function UpdateZTPromocion(req, idPromoOK) {
  try {
    let data = req.req.data || req.data || {};
    
    // Si no hay datos, devolver error
    if (!data || Object.keys(data).length === 0) {
      return { error: true, message: 'No se recibieron datos para actualizar' };
    }
    
    // Verificar que la promoción existe ANTES de actualizar
    const promocionExistente = await ZTPromociones.findOne({ IdPromoOK: idPromoOK }).lean();
    console.log('[ZTPromociones] Promoción existente ANTES:', promocionExistente ? 'SÍ EXISTE' : 'NO EXISTE');
    if (promocionExistente) {
      console.log('[ZTPromociones] Estado actual - ACTIVED:', promocionExistente.ACTIVED, 'DELETED:', promocionExistente.DELETED);
    }
    
    // Realizar la actualización
    console.log('[ZTPromociones] Ejecutando findOneAndUpdate...');
    const promocionActualizada = await ZTPromociones.findOneAndUpdate(
      { IdPromoOK: idPromoOK, ACTIVED: true, DELETED: false },
      { 
        ...data,
        MODDATE: new Date()
      },
      { new: true }
    ).lean();
    
    console.log('[ZTPromociones] Resultado de findOneAndUpdate:', promocionActualizada ? 'ENCONTRADO Y ACTUALIZADO' : 'NO ENCONTRADO');
    
    if (!promocionActualizada) {
      return { error: true, message: 'Promoción no encontrada para actualizar' };
    }
    
    // Verificar que realmente se actualizó en la BD
    const verificacion = await ZTPromociones.findOne({ IdPromoOK: idPromoOK }).lean();
    console.log('[ZTPromociones] Verificación post-actualización:', verificacion);
    
    console.log('[ZTPromociones] Promoción actualizada exitosamente');
    return {
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: {
        IdPromoOK: promocionActualizada.IdPromoOK,
        Titulo: promocionActualizada.Titulo,
        Descripcion: promocionActualizada.Descripcion,
        FechaIni: promocionActualizada.FechaIni,
        FechaFin: promocionActualizada.FechaFin,
        MODDATE: promocionActualizada.MODDATE
      }
    };
  } catch (error) {
    console.error('[ZTPromociones] Error actualizando promoción:', error.message);
    console.error('[ZTPromociones] Stack trace:', error.stack);
    throw error;
  }
}

// DELETE LOGIC (SOFT DELETE)
async function DeleteZTPromocionLogic(idPromoOK) {
  try {
    console.log('[ZTPromociones] Eliminación lógica de la promoción IdPromoOK:', idPromoOK);
    
    const promocionEliminada = await ZTPromociones.findOneAndUpdate(
      { IdPromoOK: idPromoOK, ACTIVED: true, DELETED: false },
      { 
        DELETED: true,
        ACTIVED: false,
        MODDATE: new Date()
      },
      { new: true }
    ).lean(); 
    
    if (!promocionEliminada) {
      console.log('[ZTPromociones] No se encontró la promoción para eliminar');
      return { error: true, message: 'Promoción no encontrada o ya eliminada' };
    }
    
    console.log('[ZTPromociones] Promoción eliminada lógicamente');
    return {
      success: true,
      message: 'Promoción eliminada lógicamente',
      data: {
        IdPromoOK: promocionEliminada.IdPromoOK,
        Titulo: promocionEliminada.Titulo,
        ACTIVED: promocionEliminada.ACTIVED,
        DELETED: promocionEliminada.DELETED
      }
    };
  } catch (error) {
    console.error('[ZTPromociones] Error en eliminación lógica:', error.message);
    throw error;
  }
}

// DELETE HARD (PHYSICAL DELETE)
async function DeleteZTPromocionHard(idPromoOK) {
  try {
    console.log('[ZTPromociones] Eliminación física de la promoción IdPromoOK:', idPromoOK);
    
    const promocionEliminada = await ZTPromociones.findOneAndDelete({ IdPromoOK: idPromoOK });
    
    if (!promocionEliminada) {
      console.log('[ZTPromociones] No se encontró la promoción para eliminar');
      return null;
    }
    
    console.log('[ZTPromociones] Promoción eliminada físicamente:', promocionEliminada);
    return promocionEliminada;
  } catch (error) {
    console.error('[ZTPromociones] Error en eliminación física:', error.message);
    throw error;
  }
}

// ACTIVATE PROMOCION
async function ActivateZTPromocion(idPromoOK) {
  try {
    console.log('[ZTPromociones] Activando promoción IdPromoOK:', idPromoOK);
    
    const promocionActivada = await ZTPromociones.findOneAndUpdate(
      { IdPromoOK: idPromoOK },
      { 
        ACTIVED: true,
        DELETED: false,
        MODDATE: new Date()
      },
      { new: true }
    ).lean();
    
    if (!promocionActivada) {
      console.log('[ZTPromociones] No se encontró la promoción para activar');
      return { error: true, message: 'Promoción no encontrada' };
    }
    
    console.log('[ZTPromociones] Promoción activada exitosamente');
    // Retornar objeto limpio sin metadatos de MongoDB
    return {
      success: true,
      message: 'Promoción activada exitosamente',
      data: {
        IdPromoOK: promocionActivada.IdPromoOK,
        Titulo: promocionActivada.Titulo,
        ACTIVED: promocionActivada.ACTIVED,
        DELETED: promocionActivada.DELETED
      }
    };
  } catch (error) {
    console.error('[ZTPromociones] Error activando promoción:', error.message);
    throw error;
  }
} 


async function ZTPromocionesCRUD(req) {
  try {
    const { procedure, type, idPromoOK } = req.req.query;
    let res;
    
    switch (procedure) {
      case 'get':
        switch (type) {
          case 'all':
            res = await GetAllZTPromociones();
            break;
          case 'one':
            res = await GetOneZTPromocion(idPromoOK);
            break;
          default:
            throw new Error('Coloca un tipo de búsqueda válido (all o one)');
        }
        break;
        
      case 'post':
        res = await CreateZTPromocion(req);
        break;
        
      case 'put':
        res = await UpdateZTPromocion(req, idPromoOK);
        break;
        
      case 'delete':
        switch (type) {
          case 'logic':
            res = await DeleteZTPromocionLogic(idPromoOK);
            break;
          case 'hard':
            res = await DeleteZTPromocionHard(idPromoOK);
            break;
          default:
            throw new Error('Tipo de borrado inválido (logic o hard)');
        }
        break;
        
      case 'activate':
        res = await ActivateZTPromocion(idPromoOK);
        break;
        
      default:
        throw new Error('Parámetros inválidos o incompletos');
    }
    
    return res;
  } catch (error) {
    console.error('Error en ZTPromocionesCRUD:', error);
    return { error: true, message: error.message };
  }
}


module.exports = {
  GetAllZTPromociones,
  GetOneZTPromocion,
  CreateZTPromocion,
  UpdateZTPromocion,
  DeleteZTPromocionLogic,
  DeleteZTPromocionHard,
  ActivateZTPromocion,
  ZTPromocionesCRUD,
  crudZTPromociones
};

// -----------------------------
// GET ONE
// -----------------------------
async function GetOneZTPromocion(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');
  const item = await ZTPromociones.findOne({ 
    IdPromoOK: idpromoOK, 
    ACTIVED: true, 
    DELETED: false 
  }).lean();
  if (!item) throw new Error('No se encontró la promoción');
  return item;
}

// -----------------------------
// CREATE
// -----------------------------
async function CreateZTPromocion(req) {
  const data = req.req.body || {};

  // Valida mínimos obligatorios
  if (!data.IdPromoOK || !data.Titulo || !data.FechaIni || !data.FechaFin || !data.REGUSER) {
    throw new Error('Faltan campos obligatorios (IdPromoOK, Titulo, FechaIni, FechaFin, REGUSER)');
  }

  // Validación de fechas
  const fechaIni = new Date(data.FechaIni);
  const fechaFin = new Date(data.FechaFin);
  if (fechaFin <= fechaIni) {
    throw new Error('La fecha fin debe ser posterior a la fecha inicio');
  }

  // Validación de referencias (al menos una debe estar presente)
  if (!data.SKUID && !data.IdListaOK) {
    throw new Error('Debe especificar al menos un SKUID o IdListaOK');
  }

  // Evita duplicados por clave
  const existe = await ZTPromociones.findOne({ IdPromoOK: data.IdPromoOK });
  if (existe) throw new Error('Ya existe una promoción con ese IdPromoOK');

  // Establecer valores por defecto
  data.REGDATE = new Date();
  data.ACTIVED = data.ACTIVED !== undefined ? data.ACTIVED : true;
  data.DELETED = data.DELETED !== undefined ? data.DELETED : false;

  const nuevo = await ZTPromociones.create(data);
  return nuevo.toObject();
}

// -----------------------------
// UPDATE
// -----------------------------
async function UpdateZTPromocion(req, idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const cambios = req.req.body;
  if (!cambios || Object.keys(cambios).length === 0) {
    throw new Error('No se enviaron datos para actualizar');
  }

  // Validación de fechas si se están actualizando
  if (cambios.FechaIni || cambios.FechaFin) {
    const promocionActual = await ZTPromociones.findOne({ IdPromoOK: idpromoOK });
    if (!promocionActual) throw new Error('No se encontró la promoción');

    const fechaIni = new Date(cambios.FechaIni || promocionActual.FechaIni);
    const fechaFin = new Date(cambios.FechaFin || promocionActual.FechaFin);
    
    if (fechaFin <= fechaIni) {
      throw new Error('La fecha fin debe ser posterior a la fecha inicio');
    }
  }

  // Validación de referencias si se están actualizando
  if (cambios.hasOwnProperty('SKUID') || cambios.hasOwnProperty('IdListaOK')) {
    const promocionActual = await ZTPromociones.findOne({ IdPromoOK: idpromoOK });
    if (!promocionActual) throw new Error('No se encontró la promoción');

    const nuevoSKUID = cambios.hasOwnProperty('SKUID') ? cambios.SKUID : promocionActual.SKUID;
    const nuevoIdListaOK = cambios.hasOwnProperty('IdListaOK') ? cambios.IdListaOK : promocionActual.IdListaOK;

    if (!nuevoSKUID && !nuevoIdListaOK) {
      throw new Error('Debe especificar al menos un SKUID o IdListaOK');
    }
  }

  // Agregar info de modificación
  cambios.MODDATE = new Date();
  if (req.req.body.MODUSER) {
    cambios.MODUSER = req.req.body.MODUSER;
  }

  const actualizado = await ZTPromociones.findOneAndUpdate(
    { IdPromoOK: idpromoOK },
    { $set: cambios },
    { new: true, runValidators: true }
  );

  if (!actualizado) throw new Error('No se encontró la promoción para actualizar');
  return actualizado.toObject();
}

// -----------------------------
// DELETE LOGIC
// -----------------------------
async function DeleteZTPromocionLogic(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const actualizado = await ZTPromociones.findOneAndUpdate(
    { IdPromoOK: idpromoOK },
    { $set: { ACTIVED: false, DELETED: true, MODDATE: new Date() } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la promoción para eliminar');
  return actualizado.toObject();
}

// -----------------------------
// DELETE HARD
// -----------------------------
async function DeleteZTPromocionHard(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const eliminado = await ZTPromociones.findOneAndDelete({ IdPromoOK: idpromoOK });
  if (!eliminado) throw new Error('No se encontró la promoción para eliminar');
  return { message: 'Promoción eliminada permanentemente', eliminado: eliminado.toObject() };
}

// -----------------------------
// ACTIVATE
// -----------------------------
async function ActivateZTPromocion(idpromoOK) {
  if (!idpromoOK) throw new Error('Falta parámetro IdPromoOK');

  const actualizado = await ZTPromociones.findOneAndUpdate(
    { IdPromoOK: idpromoOK },
    { $set: { ACTIVED: true, DELETED: false, MODDATE: new Date() } },
    { new: true }
  );

  if (!actualizado) throw new Error('No se encontró la promoción para activar');
  return actualizado.toObject();
}

// -----------------------------
// GET PROMOCIONES BY PRODUCT
// -----------------------------
async function GetPromocionesByProduct(skuid) {
  if (!skuid) throw new Error('Falta parámetro SKUID');
  
  const now = new Date();
  return await ZTPromociones.find({
    SKUID: skuid,
    ACTIVED: true,
    DELETED: false,
    FechaIni: { $lte: now },
    FechaFin: { $gte: now }
  }).lean();
}

// -----------------------------
// GET PROMOCIONES BY LISTA
// -----------------------------
async function GetPromocionesByLista(idListaOK) {
  if (!idListaOK) throw new Error('Falta parámetro IdListaOK');
  
  const now = new Date();
  return await ZTPromociones.find({
    IdListaOK: idListaOK,
    ACTIVED: true,
    DELETED: false,
    FechaIni: { $lte: now },
    FechaFin: { $gte: now }
  }).lean();
}

// -----------------------------
// GET PROMOCIONES VIGENTES
// -----------------------------
async function GetPromocionesVigentes() {
  const now = new Date();
  return await ZTPromociones.find({
    ACTIVED: true,
    DELETED: false,
    FechaIni: { $lte: now },
    FechaFin: { $gte: now }
  }).lean();
}

// -----------------------------
// CRUD ROUTER (entrypoint para @impl)
// -----------------------------
async function ZTPromocionesCRUD(req) {
  try {
    const { procedure, type, idpromoOK, skuid, idlistaok } = req.req.query || {};
    let res;

    switch (procedure) {
      case 'get':
        switch (type) {
          case 'all':
            res = await GetAllZTPromociones();
            break;
          case 'one':
            res = await GetOneZTPromocion(idpromoOK);
            break;
          case 'by-product':
            res = await GetPromocionesByProduct(skuid);
            break;
          case 'by-lista':
            res = await GetPromocionesByLista(idlistaok);
            break;
          case 'vigentes':
            res = await GetPromocionesVigentes();
            break;
          default:
            throw new Error('Coloca un tipo de búsqueda válido (all, one, by-product, by-lista, vigentes)');
        }
        break;

      case 'post':
        res = await CreateZTPromocion(req);
        break;

      case 'put':
        res = await UpdateZTPromocion(req, idpromoOK);
        break;

      case 'delete':
        switch (type) {
          case 'logic':
            res = await DeleteZTPromocionLogic(idpromoOK);
            break;
          case 'hard':
            res = await DeleteZTPromocionHard(idpromoOK);
            break;
          default:
            throw new Error('Tipo de borrado inválido (logic o hard)');
        }
        break;

      case 'activate':
        res = await ActivateZTPromocion(idpromoOK);
        break;

      default:
        throw new Error('Parámetros inválidos o incompletos');
    }

    return res;
  } catch (error) {
    console.error('Error en ZTPromocionesCRUD:', error);
    return { error: true, message: error.message };
  }
}

module.exports = {
  ZTPromocionesCRUD,
  crudZTPromociones,
  GetAllZTPromociones,
  GetOneZTPromocion,
  CreateZTPromocion,
  UpdateZTPromocion,
  DeleteZTPromocionLogic,
  DeleteZTPromocionHard,
  ActivateZTPromocion,
  GetPromocionesByProduct,
  GetPromocionesByLista,
  GetPromocionesVigentes
};