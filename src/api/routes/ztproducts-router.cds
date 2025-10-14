using { ZTPRODUCTS } from '../models/ztproducts';

@impl: 'src/api/controllers/ztproducts-controller.js'
service ZTProductsService @(path:'/api/ztproducts') {
  entity Products as projection on ZTPRODUCTS;

  @Core.Description: 'Obtener todos los productos'
  @path: 'getAllProducts'
  action getAllProducts() returns array of Products;

  @Core.Description: 'Obtener un producto por SKUID'
  @path: 'getOneProduct'
  action getOneProduct(skuid: String) returns Products;
}
