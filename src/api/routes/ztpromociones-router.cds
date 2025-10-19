using { mongodb as myur } from '../models/ztpromociones';

@impl: 'src/api/controllers/ztpromociones-controller.js'

/**
 * Router de Promociones - SAP CDS
 * 
 * Parámetros obligatorios:
 * - ProcessType: GetFilters | AddMany | UpdateMany | DeleteMany
 * - LoggedUser: Usuario formato jlopezm
 * 
 * Parámetro opcional:
 * - DBServer: MongoDB (default) | HANA | AzureCosmos
 */
service ZTPromocionesService @(path:'/api/ztpromociones') {

  entity Promociones as projection on myur.ZTPROMOCIONES;

  // ========================================
  // ENDPOINT PRINCIPAL
  // ========================================
  
  @Core.Description: 'CRUD Promociones con bitácora'
  @Common.SideEffects.TargetEntities: [Promociones]
  action crudPromociones(
    ProcessType: String,
    LoggedUser: String,
    DBServer: String,
    IdPromoOK: String,
    SKUID: String,
    IdListaOK: String,
    Titulo: String,
    Descripcion: String,
    FechaIni: String,
    FechaFin: String,
    DescuentoPorcentaje: Double,
    vigentes: String,
    limit: Integer,
    offset: Integer,
    deleteType: String,
    ACTIVED: Boolean,
    DELETED: Boolean
  )
  returns array of Promociones;

  // ========================================
  // EJEMPLOS DE USO
  // ========================================

  // GET FILTERS (genérico)
  // POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm
  // Filtros opcionales: IdPromoOK, SKUID, IdListaOK, vigentes, limit, offset

  // ADD MANY
  // POST /api/ztpromociones/crudPromociones?ProcessType=AddMany&LoggedUser=jlopezm
  // Body: { "promociones": [{ "IdPromoOK": "PROMO001", "Titulo": "...", ... }] }

  // UPDATE MANY
  // POST /api/ztpromociones/crudPromociones?ProcessType=UpdateMany&LoggedUser=jlopezm
  // Body: { "filter": { "IdListaOK": "LISTA001" }, "updates": { "ACTIVED": false } }

  // DELETE MANY
  // POST /api/ztpromociones/crudPromociones?ProcessType=DeleteMany&LoggedUser=jlopezm
  // Body: { "filter": { "FechaFin": { "$lt": "2024-01-01" } }, "deleteType": "logic" }

  // ========================================
  // LEGACY (DEPRECADO)
  // ========================================

  @Core.Description: 'CRUD Legacy - DEPRECADO: Use crudPromociones'
  @path: 'promocionesCRUD'
  action promocionesCRUD()
  returns array of Promociones;

}