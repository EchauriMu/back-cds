const mongoose = require('mongoose');

const ZTPromocionesSchema = new mongoose.Schema({
  IdPromoOK: { 
    type: String, 
    required: true, 
    unique: true,   // Identificador único
    trim: true 
  },
  Titulo: { 
    type: String, 
    required: true, 
    trim: true 
  },
  Descripcion: { 
    type: String, 
    required: false,
    trim: true 
  },
  FechaIni: { 
    type: Date, 
    required: true 
  },
  FechaFin: { 
    type: Date, 
    required: true 
  },
  SKUID: { 
    type: String, 
    ref: "ZTPRODUCTS",  // Referencia opcional a productos
    trim: true,
    default: null
  },
  IdListaOK: { 
    type: String, 
    ref: "ZTPRECIOS_LISTAS",  // Referencia opcional a listas de precios
    trim: true,
    default: null
  },
  DescuentoPorcentaje: { 
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  REGUSER: { 
    type: String, 
    required: true 
  },
  REGDATE: { 
    type: Date, 
    default: Date.now 
  },
  MODUSER: { 
    type: String, 
    default: null 
  },
  MODDATE: { 
    type: Date, 
    default: null 
  },
  ACTIVED: { 
    type: Boolean, 
    default: true 
  },
  DELETED: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true  // Maneja automáticamente createdAt y updatedAt
});

// Validación personalizada: al menos uno de SKUID o IdListaOK debe estar presente
ZTPromocionesSchema.pre('validate', function(next) {
  if (!this.SKUID && !this.IdListaOK) {
    return next(new Error('Debe especificar al menos un SKUID o IdListaOK'));
  }
  next();
});

// Validación de fechas: FechaFin debe ser mayor que FechaIni
ZTPromocionesSchema.pre('validate', function(next) {
  if (this.FechaFin <= this.FechaIni) {
    return next(new Error('La fecha fin debe ser posterior a la fecha inicio'));
  }
  next();
});

// Exportar el modelo
module.exports = mongoose.model('ZTPROMOCIONES', ZTPromocionesSchema, 'ZTPROMOCIONES');