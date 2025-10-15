using { mongodb as myur } from '../models/ztprecios_items';

@impl: 'src/api/controllers/ztprecios_items-controller.js'

service ZTPreciosItemsService @(path:'/api/ztprecios-items') {

    // Entidad básica
    entity PreciosItems as projection on myur.ZTPRECIOS_ITEMS;

    // CRUD de Precios de Productos
    @Core.Description: 'CRUD de Precios de Productos'
    @path: 'preciosItemsCRUD'
    action preciosItemsCRUD()
    returns array of PreciosItems;

    // GET ALL PRECIOS
    // POST /api/ztprecios-items/preciosItemsCRUD?procedure=get&type=all

    // GET ONE PRECIO
    // POST /api/ztprecios-items/preciosItemsCRUD?procedure=get&type=one&idPrecioOK=PRECIO001

    // CREATE PRECIO
    // POST /api/ztprecios-items/preciosItemsCRUD?procedure=post

    // UPDATE PRECIO
    // POST /api/ztprecios-items/preciosItemsCRUD?procedure=put&idPrecioOK=PRECIO001

    // DELETE LOGIC
    // POST /api/ztprecios-items/preciosItemsCRUD?procedure=delete&type=logic&idPrecioOK=PRECIO001

    // DELETE HARD
    // POST /api/ztprecios-items/preciosItemsCRUD?procedure=delete&type=hard&idPrecioOK=PRECIO001

    // ACTIVATE PRECIO
    // POST /api/ztprecios-items/preciosItemsCRUD?procedure=activate&idPrecioOK=PRECIO001
}
