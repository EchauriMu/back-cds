using { mongodb as myur } from '../models/ztpromociones';

@impl: 'src/api/controllers/ztpromociones-controller.js'

service ZTPromocionesService @(path:'/api/ztpromociones') {

  entity Promociones as projection on myur.ZTPROMOCIONES;

  @Core.Description: 'CRUD de Promociones'
  @path: 'promocionesCRUD'
  action promocionesCRUD()
  returns array of Promociones;

  @Core.Description: 'CRUD de Promociones con Bitácora'
  @path: 'crudPromociones'
  action crudPromociones()
  returns array of Promociones;

  // GET ALL PROMOCIONES
  // POST /api/ztpromociones/promocionesCRUD?procedure=get&type=all

  // GET ONE PROMOCION
  // POST /api/ztpromociones/promocionesCRUD?procedure=get&type=one&idpromoOK=PROMO123

  // GET PROMOCIONES BY PRODUCT
  // POST /api/ztpromociones/promocionesCRUD?procedure=get&type=by-product&skuid=SKU123

  // GET PROMOCIONES BY LISTA
  // POST /api/ztpromociones/promocionesCRUD?procedure=get&type=by-lista&idlistaok=LISTA123

  // GET PROMOCIONES VIGENTES
  // POST /api/ztpromociones/promocionesCRUD?procedure=get&type=vigentes

  // CREATE PROMOCION
  // POST /api/ztpromociones/promocionesCRUD?procedure=post

  // UPDATE PROMOCION
  // POST /api/ztpromociones/promocionesCRUD?procedure=put&idpromoOK=PROMO123

  // DELETE LOGIC
  // POST /api/ztpromociones/promocionesCRUD?procedure=delete&type=logic&idpromoOK=PROMO123

  // DELETE HARD
  // POST /api/ztpromociones/promocionesCRUD?procedure=delete&type=hard&idpromoOK=PROMO123

  // ACTIVATE PROMOCION
  // POST /api/ztpromociones/promocionesCRUD?procedure=activate&idpromoOK=PROMO123
}