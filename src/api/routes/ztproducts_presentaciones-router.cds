using { mongodb as myur } from '../models/ztproducts_presentaciones';

@impl: 'src/api/controllers/ztproducts_presentaciones-controller.js'

service ZTProductsPresentacionesService @(path:'/api/ztproducts-presentaciones') {

  // ===== Entidad básica =====
  entity Presentaciones as projection on myur.ZTPRODUCTS_PRESENTACIONES;

  // ===== CRUD de Presentaciones de Productos =====
  @Core.Description: 'CRUD de Presentaciones de Productos'
  @path: 'productsPresentacionesCRUD'
  action productsPresentacionesCRUD(
    ProcessType    : String,          // AddOne | GetAll | GetOne | UpdateOne | Delete | Activate ...
    IdPresentaOK   : String,
    SKUID          : String,
    Descripcion    : String,
    CostoIni       : Decimal(15,2),
    CostoFin       : Decimal(15,2),
    Precio         : Decimal(15,2),
    Stock          : Integer,
    ACTIVED        : Boolean,
    DELETED        : Boolean,
    REGUSER        : String
    // Nota: MODUSER/MODDATE los rellena tu helper/update; no hace falta exponerlos aquí
  ) returns array of Presentaciones;


  // ================== EJEMPLOS DE USO ==================

  // GET ALL PRESENTACIONES
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=get&type=all

  // GET ONE PRESENTACION (por IdPresentaOK)
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=get&type=one&idpresentaok=PRE-001

  // CREATE (AddOne)
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=post
  // Body o query pueden incluir: IdPresentaOK, SKUID, Descripcion, CostoIni, CostoFin, Precio, Stock, ACTIVED, DELETED, REGUSER
  // En el controller se leerá ProcessType=AddOne para devolver 201 + Location

  // UPDATE (UpdateOne)
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=put&idpresentaok=PRE-001
  // Campos a actualizar en body o query (Precio, Stock, etc.)

  // DELETE LOGIC (marcar DELETED=true)
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=delete&type=logic&idpresentaok=PRE-001

  // DELETE HARD (si implementas borrado físico)
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=delete&type=hard&idpresentaok=PRE-001

  // ACTIVATE (ACTIVED=true)
  // POST /api/ztproducts-presentaciones/productsPresentacionesCRUD?procedure=activate&idpresentaok=PRE-001
}
