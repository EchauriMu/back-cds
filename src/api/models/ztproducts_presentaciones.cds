namespace mongodb;

entity ZTPRODUCTS_PRESENTACIONES {
  key IdPresentaOK : String(64);
      SKUID        : String(64);
      Descripcion  : String;
      CostoIni     : Decimal(15,2);
      CostoFin     : Decimal(15,2);
      Precio       : Decimal(15,2);
      Stock        : Integer;
      ACTIVED      : Boolean;
      DELETED      : Boolean;
      REGUSER      : String(64);
      REGDATE      : DateTime;
      MODUSER      : String(64);
      MODDATE      : DateTime;
      createdAt    : DateTime;
      updatedAt    : DateTime;
}
