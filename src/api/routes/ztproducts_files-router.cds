using { mongodb as myur } from '../models/ztproducts_files';

@impl: 'src/api/controllers/ztproducts_files-controller.js'

service ZTProductFilesService @(path:'/api/ztproducts-files') {
    
    // Entidad básica
    entity Files as projection on myur.ZTPRODUCTS_FILES;
    
    // CRUD de Archivos de Productos
    @Core.Description: 'CRUD de Archivos de Productos'
    @path: 'productsFilesCRUD'
    action productsFilesCRUD()
    returns array of Files;
    
    
    // GET ALL FILES
    // POST /api/ztproducts/files/productsFilesCRUD?procedure=get&type=all
    
    // GET ONE FILE
    // POST /api/ztproducts/files/productsFilesCRUD?procedure=get&type=one&fileid=FILE123
    
    // CREATE FILE
    // POST /api/ztproducts/files/productsFilesCRUD?procedure=post
    
    // UPDATE FILE
    // POST /api/ztproducts/files/productsFilesCRUD?procedure=put&fileid=FILE123
    
    // DELETE LOGIC
    // POST /api/ztproducts/files/productsFilesCRUD?procedure=delete&type=logic&fileid=FILE123
    
    // DELETE HARD
    // POST /api/ztproducts/files/productsFilesCRUD?procedure=delete&type=hard&fileid=FILE123
    
    // ACTIVATE FILE
    // POST /api/ztproducts/files/productsFilesCRUD?procedure=activate&fileid=FILE123
}