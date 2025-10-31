namespace mongodb;

entity ZTPRODUCTS_PRESENTACIONES {
  key IdPresentaOK : String(64);
      NOMBREPRESENTACION : String;
      SKUID        : String(64);
      Descripcion  : String;
    
      ACTIVED      : Boolean;
      DELETED      : Boolean;
      REGUSER      : String(64);
      REGDATE      : DateTime;
      MODUSER      : String(64);
      MODDATE      : DateTime;
      createdAt    : DateTime;
      updatedAt    : DateTime;
}
