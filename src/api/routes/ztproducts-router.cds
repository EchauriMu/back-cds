using { mongodb as mypr } from '../models/ztproducts';

@impl: 'src/api/controllers/ztproducts-controller.js'

service ZTProductsService @(path:'/api/ztproducts') {

  entity Products as projection on mypr.ZTPRODUCTS;

  @Core.Description: 'CRUD de Prodcutos'
  @path: 'ZTProductCRUD'
  action ZTProductCRUD() returns array of Products;
}
