const mongoose = require('mongoose');

const ZTProductSchema = new mongoose.Schema({
  SKUID: { 
    type: String, 
    required: true, 
    unique: true,   // Identificador único
    trim: true 
  },
  DESSKU: { 
    type: String, 
    required: true, 
    trim: true 
  },
  CATEGORIAS: [{ type: String, ref: "ZTCATEGORIAS" }],

  IDUNIDADMEDIDA: { 
    type: String, 
    required: true 
  },
  BARCODE: { 
    type: String, 
    index: true,   // Índice para búsquedas rápidas
    unique: true,
    sparse: true   // Evita conflictos si hay productos sin código de barras
  },
    INFOAD: {
      type: String,
      default: "",
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

// Exportar el modelo
module.exports = mongoose.model('ZTPRODUCTS', ZTProductSchema, 'ZTPRODUCTS');
