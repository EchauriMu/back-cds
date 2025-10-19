# POSTMAN GUI - Configuración Rápida

## ENVIRONMENT
```
BASE_URL = http://localhost:3033
LOGGED_USER = lpaniaguag
DB_SERVER = MongoDB
```

## REQUESTS

### 1. Get All
- **POST** {{BASE_URL}}/api/ztpromociones/crudPromociones
- **Query:** ProcessType=GetFilters, DBServer={{DB_SERVER}}, LoggedUser={{LOGGED_USER}}, limit=50, offset=0
- **Body:** None

### 2. Get One (PROMO001)
- **POST** {{BASE_URL}}/api/ztpromociones/crudPromociones
- **Query:** ProcessType=GetFilters, DBServer={{DB_SERVER}}, LoggedUser={{LOGGED_USER}}, IdPromoOK=PROMO001
- **Body:** None

### 3. Get By Product (P001)
- **POST** {{BASE_URL}}/api/ztpromociones/crudPromociones
- **Query:** ProcessType=GetFilters, DBServer={{DB_SERVER}}, LoggedUser={{LOGGED_USER}}, SKUID=P001
- **Body:** None

### 4. Create
- **POST** {{BASE_URL}}/api/ztpromociones/crudPromociones
- **Query:** ProcessType=AddMany, DBServer={{DB_SERVER}}, LoggedUser={{LOGGED_USER}}
- **Body (JSON):**
```json
{
  "promociones": [
    {
      "IdPromoOK": "PROMO002",
      "Titulo": "Descuento otoño",
      "Descripcion": "15% de descuento en producto P002",
      "FechaIni": "2024-10-19T00:00:00Z",
      "FechaFin": "2024-12-31T00:00:00Z",
      "SKUID": "P002",
      "IdListaOK": null,
      "Descuento%": 15
    }
  ]
}
```

### 5. Update
- **POST** {{BASE_URL}}/api/ztpromociones/crudPromociones
- **Query:** ProcessType=UpdateMany, DBServer={{DB_SERVER}}, LoggedUser={{LOGGED_USER}}
- **Body (JSON):**
```json
{
  "filter": {"IdPromoOK": "PROMO001"},
  "updates": {
    "Titulo": "Descuento verano EXTENDIDO",
    "Descuento%": 15
  }
}
```

### 6. Delete Lógico
- **POST** {{BASE_URL}}/api/ztpromociones/crudPromociones
- **Query:** ProcessType=DeleteMany, DBServer={{DB_SERVER}}, LoggedUser={{LOGGED_USER}}, deleteType=logic
- **Body (JSON):**
```json
{
  "filter": {"IdPromoOK": "PROMO001"},
  "deleteType": "logic"
}
```

### 7. Legacy (Deprecado)
- **POST** {{BASE_URL}}/api/ztpromociones/promocionesCRUD
- **Query:** procedure=get, type=all
- **Body:** None

**Headers para todos:** Content-Type = application/json