/*using { mongodb as myur } from '../models/ztprecios_listas';

@impl: 'src/api/controllers/ztprecios_listas-controller.js'
service ZTPPreciosListasService @(path: '/api/ztprecios-listas') {

  entity PreciosListas as projection on myur.ZTPRECIOS_LISTAS;

  @Core.Description: 'CRUD de Listas de Precios'
  @path: 'preciosListasCRUD'
  action preciosListasCRUD(req: String) returns array of PreciosListas;

}*/

using { mongodb as myur } from '../models/ztprecios_listas';

@impl: 'src/api/controllers/ztprecios_listas-controller.js'
service ZTPreciosListasService @(path: '/api/ztprecios-listas') {

  entity PreciosListas as projection on myur.ZTPRECIOS_LISTAS;

  @Core.Description: 'CRUD de Listas de Precios'
  @path: 'preciosListasCRUD'
  action preciosListasCRUD(
    req: String
  ) returns array of PreciosListas;
}

