service ZTProductFilesService @(path:'/api/ztproducts/files') {
  entity ZTProductFiles as projection on myur.ZTPRODUCTS_FILES;

  @Core.Description: 'CRUD de Archivos de Productos'
  @path: 'productsCRUD'
  action productsCRUD()
    returns array of ZTProductFiles;
}
