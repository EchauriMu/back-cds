namespace mongodb;

entity ZTPROMOCIONES {
  key IdPromoOK    : String(100);
  Titulo           : String(255);
  Descripcion      : String(500);
  FechaIni         : DateTime;
  FechaFin         : DateTime;
  SKUID            : String(100);
  IdListaOK        : String(100);
  DescuentoPorcentaje : Double;
  ACTIVED          : Boolean;
  DELETED          : Boolean;
  REGUSER          : String(100);
  REGDATE          : DateTime;
  MODUSER          : String(100);
  MODDATE          : DateTime;
  createdAt        : DateTime;
  updatedAt        : DateTime;
}