namespace mongodb;

entity ZTPRODUCTS {
  key SKUID     : String(100);
  PRODUCTNAME   : String(255);
  DESSKU        : String(255);
  MARCA         : String(100);
  CATEGORIAS    : many String;
  IDUNIDADMEDIDA: String(50);
  BARCODE       : String(100);
  INFOAD        : String(255);
  REGUSER       : String(100);
  REGDATE       : DateTime;
  MODUSER       : String(100);
  MODDATE       : DateTime;
  ACTIVED       : Boolean;
  DELETED       : Boolean;
}
