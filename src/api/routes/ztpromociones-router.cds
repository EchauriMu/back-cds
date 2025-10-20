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
  @path: 'crudPromociones'
  action crudPromociones() returns String;

  
  // GET FILTERS (genérico)
  // POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm
  
  // GET ONE PROMOCION
  // POST /api/ztpromociones/crudPromociones?ProcessType=GetOne&LoggedUser=jlopezm&IdPromoOK=PROMO001
  
  // ADD MANY
  // POST /api/ztpromociones/crudPromociones?ProcessType=AddMany&LoggedUser=jlopezm
  // Body: { "promociones": [{ "IdPromoOK": "PROMO001", "Titulo": "...", ... }] }
  
  // UPDATE MANY
  // POST /api/ztpromociones/crudPromociones?ProcessType=UpdateMany&LoggedUser=jlopezm
  // Body: { "filter": { "IdListaOK": "LISTA001" }, "updates": { "ACTIVED": false } }
  
  // DELETE LOGIC
  // POST /api/ztpromociones/crudPromociones?ProcessType=DeleteMany&LoggedUser=jlopezm&deleteType=logic
  // Body: { "filter": { "IdPromoOK": "PROMO001" } }
  
  // DELETE HARD
  // POST /api/ztpromociones/crudPromociones?ProcessType=DeleteMany&LoggedUser=jlopezm&deleteType=hard
  // Body: { "filter": { "IdPromoOK": "PROMO001" } }
  
  // ACTIVATE PROMOCION
  // POST /api/ztpromociones/crudPromociones?ProcessType=Activate&LoggedUser=jlopezm&IdPromoOK=PROMO001

  // ========================================
  // LEGACY (DEPRECADO)
  // ========================================

  @Core.Description: 'CRUD Legacy - DEPRECADO: Use crudPromociones'
  @path: 'promocionesCRUD'
  action promocionesCRUD()
  returns array of Promociones;

}