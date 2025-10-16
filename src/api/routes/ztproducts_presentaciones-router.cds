using { mongodb as myur } from '../models/ztproducts_presentaciones';

@impl: 'src/api/controllers/ztproducts_presentaciones-controller.js'

service ZTProductsPresentacionesService @(path:'/api/ztproducts-presentaciones') {

  // Entidad básica
  entity Presentaciones as projection on myur.ZTPRODUCTS_PRESENTACIONES;

  // CRUD de Presentaciones de Productos
  @Core.Description: 'CRUD de Presentaciones de Productos'
  @path: 'productsPresentacionesCRUD'
  action productsPresentacionesCRUD()
  returns array of Presentaciones;

  // ================== EJEMPLOS DE USO ==================
  // GET ALL PRESENTACIONES
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=get&type=all

  // GET ONE PRESENTACION
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=get&type=one&idpresentaok=ID123

  // CREATE PRESENTACION
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=post

  // UPDATE PRESENTACION
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=put&idpresentaok=ID123

  // DELETE LOGIC
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=delete&type=logic&idpresentaok=ID123

  // DELETE HARD
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=delete&type=hard&idpresentaok=ID123

  // ACTIVATE PRESENTACION
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=activate&idpresentaok=ID123
}
