# 📚 Documentación: Estructura Estandarizada de Endpoints

## 🎯 Resumen Ejecutivo

**[📊 Ver Resumen Ejecutivo Completo](../RESUMEN_EJECUTIVO.md)** - Estado del proyecto, métricas, roadmap

---

## 📑 Índice de Documentación

Este directorio contiene la documentación completa sobre la **estructura estandarizada** que deben seguir todos los endpoints del proyecto SAP CAP.

**Estado General**: ✅ **99% Completado** (8 TODOs pendientes)

---

## 📖 Guías Disponibles

### 1️⃣ [Guía Rápida de Endpoints](../../GUIA_RAPIDA_ENDPOINTS.md)
**Para usuarios nuevos - Comienza aquí**

- ✅ Ejemplos prácticos de uso
- ✅ Casos comunes (GetFilters, AddMany, UpdateMany, DeleteMany)
- ✅ Errores típicos y soluciones
- ✅ Testing con Postman
- ✅ Variables de entorno

**Usa esta guía para**: Aprender rápidamente cómo usar los endpoints.

---

### 2️⃣ [Estructura Completa de Endpoints](../../ESTRUCTURA_ESTANDAR_ENDPOINTS.md)
**Documentación técnica detallada**

- 📋 Campos base obligatorios
- 📝 Validaciones requeridas
- 📊 Manejo de errores
- 🔧 Ejemplos de implementación
- 📚 Respuestas estandarizadas

**Usa esta guía para**: Implementar nuevos endpoints o entender la arquitectura completa.

---

### 3️⃣ [Estructura y Validación de Parámetros](../../ESTRUCTURA_PARAMETROS.md) ⭐ NUEVO
**Guía detallada de parámetros**

- 🔍 Serialización con URLSearchParams
- ✅ Validación de parámetros obligatorios
- 🎯 ProcessType: GetFilters como proceso genérico
- 📊 Filtros dinámicos y paginación
- ✅ Mejores prácticas con datos reales
- ❌ Evitar valores "basura" o ficticios

**Usa esta guía para**: Entender cómo estructurar y validar parámetros correctamente.

---

### 4️⃣ [Resumen de Cambios](../../RESUMEN_CAMBIOS.md)
**Comparativa antes/después**

- ✅ Cambios implementados en controller
- 📊 Comparativa de respuestas
- 🎯 Campos base obligatorios
- 🧪 Ejemplos de testing
- 🎓 Lecciones aprendidas

**Usa esta guía para**: Entender qué cambió y por qué.

---

### 5️⃣ [Diagrama de Flujo](../../DIAGRAMA_FLUJO.md)
**Visualización del flujo completo**

- 🔄 Flujo de una request completa
- 🎯 Puntos clave de validación
- 🔐 Validaciones por capa
- 📊 Códigos HTTP por escenario
- 🧩 Arquitectura del sistema

**Usa esta guía para**: Visualizar y entender el flujo de datos.

---

### 6️⃣ [Configuración de Bitácora](../CONFIGURACION_BITACORA.md) ⭐ NUEVO
**Guía completa de la bitácora**

- 📊 Campos obligatorios de la bitácora
- 🔧 Configuración inicial en el servicio
- 🎨 Configuración en métodos locales
- ⚠️ Validaciones obligatorias (ProcessType, LoggedUser)
- 📤 Estructura de respuesta final
- ✅ Checklist de implementación

**Usa esta guía para**: Entender cómo configurar correctamente la bitácora y qué campos son obligatorios.

---

### 7️⃣ [Estructura del Flujo Principal](../ESTRUCTURA_FLUJO_SERVICIO.md) ⭐ NUEVO
**Guía del flujo del servicio principal**

- 🏗️ Responsabilidades del servicio principal
- 🔄 Patrón de evaluación de promesas con .then()
- ⚠️ Manejo de errores capturados en catch
- 🔌 Cierre de conexión en finally
- 💡 Ejemplos completos por ProcessType
- 🎯 Resumen visual del flujo

**Usa esta guía para**: Entender la estructura completa del flujo principal y cómo evaluar promesas correctamente.

---

### 8️⃣ [Métodos Locales](../METODOS_LOCALES.md) ⭐ NUEVO
**Guía de métodos locales**

- 🎯 Estructura estándar de métodos locales
- ⚠️ Manejo de errores con try/catch
- 🔌 Gestión de conexiones (MongoDB, HANA, Pool)
- 📤 Retorno de promesas
- 💡 Ejemplos completos por tecnología
- ✅ Mejores prácticas DO vs DON'T

**Usa esta guía para**: Implementar métodos locales con manejo correcto de errores y conexiones.

---

### 9️⃣ [Manejo de Errores y Bitácora](../MANEJO_ERRORES_BITACORA.md) ⭐ NUEVO
**Guía completa de manejo de errores**

- ⚠️ Flujo general de errores
- 📊 Estrategia de optimización (1 registro vs error chain)
- 🎯 Centralización en catch del servicio
- 🔴 Tipos de errores (validación, BD, inesperado, negocio)
- 📦 Estructura de error en bitácora
- 💡 Ejemplos completos de cada tipo
- 🔄 Diagrama de flujo visual
- ✅ Mejores prácticas DO vs DON'T

**Usa esta guía para**: Entender el flujo completo de manejo de errores y la estrategia de optimización de bitácora.

---

### 🔟 [Estructura CRUD en el Servicio](../ESTRUCTURA_CRUD_SERVICIO.md) ⭐ NUEVO
**Guía del switch sobre ProcessType**

- 🔄 Concepto general del patrón switch
- 🏗️ Estructura del switch sobre ProcessType
- 📊 ProcessTypes disponibles (GetFilters, AddMany, UpdateMany, DeleteMany)
- 🔄 Patrón de ejecución con await + .then()
- ✅ Validación de ProcessType (estrategias)
- 💡 Ejemplos completos (3 variantes)
- 🔧 Extensibilidad (agregar nuevos ProcessTypes)
- ✅ Mejores prácticas DO vs DON'T
- 🎯 Verificación de implementación

**Usa esta guía para**: Entender cómo el switch enruta las operaciones CRUD a los métodos correspondientes.

---

### 1️⃣1️⃣ [Códigos de Estado HTTP](../CODIGOS_ESTADO_HTTP.md) ⭐ NUEVO
**Guía completa de códigos HTTP**

- 🎯 Códigos HTTP estándar (2xx, 4xx, 5xx)
- 📊 Uso por operación CRUD
- 📦 Códigos en bitácora (AddMSG)
- ✅ Respuestas exitosas vs errores
- 🎨 Códigos personalizados (por qué evitarlos)
- 💡 Ejemplos por escenario (8 casos)
- 🧪 Testing en Postman
- ✅ Mejores prácticas DO vs DON'T
- 📊 Tabla de referencia rápida

**Usa esta guía para**: Entender qué código HTTP usar en cada escenario y cómo implementarlo correctamente.

---

### 8️⃣ [Métodos Locales (Local Methods)](../METODOS_LOCALES.md) ⭐ NUEVO
**Guía completa de métodos locales**

- 🎯 Características clave de métodos locales
- 📊 Responsabilidades y restricciones
- 🏗️ Estructura estándar con try/catch/finally
- ⚠️ Manejo de errores internos
- 🔌 Manejo de conexiones por escenario
- 💡 Ejemplos completos (MongoDB, HANA, Pool)
- ✅ Mejores prácticas (DO/DON'T)

**Usa esta guía para**: Implementar correctamente métodos que ejecutan operaciones reales sobre la base de datos.

---

## 🚀 Quick Start

### Para Desarrolladores Nuevos

1. Lee la **[Guía Rápida](./GUIA_RAPIDA_ENDPOINTS.md)** (15 min)
2. Prueba los ejemplos con Postman
3. Revisa el **[Diagrama de Flujo](./DIAGRAMA_FLUJO.md)** (5 min)

### Para Implementar un Nuevo Endpoint

1. Lee la **[Estructura Completa](./ESTRUCTURA_ESTANDAR_ENDPOINTS.md)** (30 min)
2. Sigue el checklist de implementación
3. Valida con los tests sugeridos

### Para Migrar Código Legacy

1. Lee el **[Resumen de Cambios](./RESUMEN_CAMBIOS.md)** (20 min)
2. Compara tu código actual con los ejemplos
3. Aplica las mejoras paso a paso

---

## 🎯 Campos Base Obligatorios (Resumen)

Todos los endpoints deben incluir:

| Campo | Obligatorio | Default | Fuente |
|-------|------------|---------|--------|
| **ProcessType** | ✅ SÍ | - | Query string |
| **LoggedUser** | ✅ SÍ | - | Query string |
| **DBServer** | ⚠️ Opcional | `MongoDB` | Query string |
| **method** | ✅ SÍ | `POST` | Autoconfigurado |
| **api** | ✅ SÍ | - | Autoconfigurado |

---

## 📝 Ejemplo Mínimo

```http
POST /api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "bitacora": [ /* ... */ ],
  "_metadata": {
    "processType": "GetFilters",
    "dbServer": "MongoDB",
    "loggedUser": "jlopezm",
    "method": "POST",
    "api": "/api/ztpromociones/crudPromociones",
    "timestamp": "2025-10-19T12:30:00.000Z"
  }
}
```

---

## 🔍 ¿Qué Guía Necesito?

### Pregunta: "¿Cómo uso el endpoint para consultar promociones?"
**→ [Guía Rápida](./GUIA_RAPIDA_ENDPOINTS.md)** - Sección "GetFilters"

### Pregunta: "¿Qué campos son obligatorios al crear un endpoint?"
**→ [Estructura Completa](./ESTRUCTURA_ESTANDAR_ENDPOINTS.md)** - Sección "Campos Base Obligatorios"

### Pregunta: "¿Qué cambió en el código actual?"
**→ [Resumen de Cambios](./RESUMEN_CAMBIOS.md)** - Sección "Comparativa antes/después"

### Pregunta: "¿Cómo funciona el flujo interno?"
**→ [Diagrama de Flujo](./DIAGRAMA_FLUJO.md)** - Flujo completo visualizado

### Pregunta: "¿Cómo valido el formato de LoggedUser?"
**→ [Estructura Completa](./ESTRUCTURA_ESTANDAR_ENDPOINTS.md)** - Sección "Validaciones"

### Pregunta: "¿Qué código HTTP debo retornar?"
**→ [Diagrama de Flujo](./DIAGRAMA_FLUJO.md)** - Tabla "Códigos HTTP por Escenario"

### Pregunta: "¿Cómo pruebo el endpoint con Postman?"
**→ [Guía Rápida](./GUIA_RAPIDA_ENDPOINTS.md)** - Sección "Testing con Postman"

### Pregunta: "¿Por qué necesito DBServer si solo uso MongoDB?"
**→ [Resumen de Cambios](../../RESUMEN_CAMBIOS.md)** - Sección "Lecciones Aprendidas"

### Pregunta: "¿Cómo serializo los parámetros correctamente?"
**→ [Estructura de Parámetros](../../ESTRUCTURA_PARAMETROS.md)** - Sección "Estructura de Parámetros"

### Pregunta: "¿GetFilters es lo mismo que GetAll, GetOne y GetSome?"
**→ [Estructura de Parámetros](../../ESTRUCTURA_PARAMETROS.md)** - Sección "ProcessType: GetFilters"

### Pregunta: "¿Puedo usar datos de prueba ficticios?"
**→ [Estructura de Parámetros](../../ESTRUCTURA_PARAMETROS.md)** - Sección "Mejores Prácticas"

### Pregunta: "¿Qué campos obligatorios debe tener la bitácora?"
**→ [Configuración de Bitácora](../CONFIGURACION_BITACORA.md)** - Sección "Campos Obligatorios"

### Pregunta: "¿Cómo configuro la bitácora en el servicio?"
**→ [Configuración de Bitácora](../CONFIGURACION_BITACORA.md)** - Sección "Configuración Inicial"

### Pregunta: "¿Qué pasa si falta ProcessType o LoggedUser?"
**→ [Configuración de Bitácora](../CONFIGURACION_BITACORA.md)** - Sección "Validaciones Obligatorias"

### Pregunta: "¿Cómo estructuro el servicio principal?"
**→ [Estructura del Flujo Principal](../ESTRUCTURA_FLUJO_SERVICIO.md)** - Sección "Estructura General"

### Pregunta: "¿Cómo evalúo promesas con .then()?"
**→ [Estructura del Flujo Principal](../ESTRUCTURA_FLUJO_SERVICIO.md)** - Sección "Patrón de Evaluación de Promesas"

### Pregunta: "¿Cómo manejo errores en catch?"
**→ [Estructura del Flujo Principal](../ESTRUCTURA_FLUJO_SERVICIO.md)** - Sección "Manejo de Errores Capturados"

### Pregunta: "¿Cuándo cerrar la conexión a la BD?"
**→ [Estructura del Flujo Principal](../ESTRUCTURA_FLUJO_SERVICIO.md)** - Sección "Cierre de Conexión en Finally"

### Pregunta: "¿Cómo implemento un método local?"
**→ [Métodos Locales](../METODOS_LOCALES.md)** - Sección "Estructura Estándar"

### Pregunta: "¿Los métodos locales manejan sus propios errores?"
**→ [Métodos Locales](../METODOS_LOCALES.md)** - Sección "Manejo de Errores"

### Pregunta: "¿Cuándo usar try/catch/finally en métodos locales?"
**→ [Métodos Locales](../METODOS_LOCALES.md)** - Sección "Características Clave"

### Pregunta: "¿Diferencia entre Mongoose y HANA en métodos locales?"
**→ [Métodos Locales](../METODOS_LOCALES.md)** - Sección "Manejo de Conexiones"

### Pregunta: "¿Puedo usar res.error() en un método local?"
**→ [Métodos Locales](../METODOS_LOCALES.md)** - Sección "Mejores Prácticas (DON'T)"

### Pregunta: "¿Cómo manejo errores de BD en el servicio?"
**→ [Manejo de Errores y Bitácora](../MANEJO_ERRORES_BITACORA.md)** - Sección "Error de BD (manejado)"

### Pregunta: "¿Cuándo uso finalRes = true?"
**→ [Manejo de Errores y Bitácora](../MANEJO_ERRORES_BITACORA.md)** - Sección "Flujo General de Errores"

### Pregunta: "¿Qué es la estrategia de optimización de bitácora?"
**→ [Manejo de Errores y Bitácora](../MANEJO_ERRORES_BITACORA.md)** - Sección "Estrategia de Optimización"

### Pregunta: "¿Cuántos registros guardo en bitácora si todo sale bien?"
**→ [Manejo de Errores y Bitácora](../MANEJO_ERRORES_BITACORA.md)** - Sección "Flujo Completo y Correcto"

### Pregunta: "¿Qué tipos de errores existen?"
**→ [Manejo de Errores y Bitácora](../MANEJO_ERRORES_BITACORA.md)** - Sección "Tipos de Errores"

### Pregunta: "¿Cómo funciona el switch sobre ProcessType?"
**→ [Estructura CRUD en el Servicio](../ESTRUCTURA_CRUD_SERVICIO.md)** - Sección "Estructura del Switch"

### Pregunta: "¿Qué ProcessTypes están disponibles?"
**→ [Estructura CRUD en el Servicio](../ESTRUCTURA_CRUD_SERVICIO.md)** - Sección "ProcessTypes Disponibles"

### Pregunta: "¿Por qué usar .then() en el switch?"
**→ [Estructura CRUD en el Servicio](../ESTRUCTURA_CRUD_SERVICIO.md)** - Sección "Patrón de Ejecución"

### Pregunta: "¿Cómo agrego un nuevo ProcessType?"
**→ [Estructura CRUD en el Servicio](../ESTRUCTURA_CRUD_SERVICIO.md)** - Sección "Extensibilidad"

### Pregunta: "¿Qué pasa si ProcessType es inválido?"
**→ [Estructura CRUD en el Servicio](../ESTRUCTURA_CRUD_SERVICIO.md)** - Sección "Validación de ProcessType"

### Pregunta: "¿Qué código HTTP debo usar para GET exitoso?"
**→ [Códigos de Estado HTTP](../CODIGOS_ESTADO_HTTP.md)** - Sección "GetFilters (Consultar)"

### Pregunta: "¿Cuándo usar 200 vs 201?"
**→ [Códigos de Estado HTTP](../CODIGOS_ESTADO_HTTP.md)** - Sección "Códigos HTTP Estándar"

### Pregunta: "¿Uso 404 si GetFilters no encuentra resultados?"
**→ [Códigos de Estado HTTP](../CODIGOS_ESTADO_HTTP.md)** - Sección "GetFilters (Consultar)"

### Pregunta: "¿Puedo usar códigos personalizados como 291?"
**→ [Códigos de Estado HTTP](../CODIGOS_ESTADO_HTTP.md)** - Sección "Códigos Personalizados"

### Pregunta: "¿Qué código usar para error de validación?"
**→ [Códigos de Estado HTTP](../CODIGOS_ESTADO_HTTP.md)** - Sección "Códigos de Error del Cliente (4xx)"

---

## 🛠️ Archivos del Proyecto

### Controllers
- `src/api/controllers/ztpromociones-controller.js` ✅ Actualizado

### Services
- `src/api/services/ztpromociones-service.js` ✅ Actualizado

### Routers
- `src/api/routes/ztpromociones-router.cds` ✅ Documentado

### Postman
- `src/api/postman/ZTPROMOCIONES_Postman_Collection.json`
- `src/api/postman/ZTPROMOCIONES_Environment.json`

---

## ✅ Checklist de Implementación

Antes de hacer commit de un nuevo endpoint:

- [ ] ✅ ProcessType validado en controller
- [ ] ✅ LoggedUser validado en controller
- [ ] ✅ Formato de LoggedUser verificado (regex)
- [ ] ✅ DBServer configurado (default: MongoDB)
- [ ] ✅ method y api autoconfigurados
- [ ] ✅ Bitácora incluye todos los campos base
- [ ] ✅ _metadata agregado en respuesta
- [ ] ✅ HTTP status configurados (200, 201, 400, 500)
- [ ] ✅ Logs de contexto en desarrollo
- [ ] ✅ Errores con códigos correctos
- [ ] ✅ Documentado en router (.cds)
- [ ] ✅ Probado con Postman
- [ ] ✅ Sin errores de ESLint

---

## 🎓 Mejores Prácticas

### ✅ DO
- ✅ Validar parámetros obligatorios en controller
- ✅ Usar regex para validar formato de LoggedUser
- ✅ Configurar DBServer con default
- ✅ Incluir _metadata en toda respuesta
- ✅ Usar códigos HTTP correctos
- ✅ Logs estructurados en desarrollo
- ✅ Documentar en el router

### ❌ DON'T
- ❌ Asumir valores de parámetros obligatorios
- ❌ Dejar validaciones solo en el service
- ❌ Hardcodear valores de usuario
- ❌ Ignorar errores de formato
- ❌ Retornar siempre 200 OK
- ❌ Logs en producción sin control
- ❌ Endpoints sin documentar

---

## 📊 Estadísticas de Implementación

| Componente | Estado | Cobertura |
|-----------|--------|-----------|
| Controller | ✅ Completo | 100% |
| Service | ✅ Completo | 100% |
| Router | ✅ Documentado | 100% |
| Tests | ⚠️ Pendiente | 0% |
| Postman | ⚠️ Por actualizar | 50% |

---

## 🚀 Próximos Pasos

### Fase 1: Documentación ✅ COMPLETADO
- [x] Crear guía rápida
- [x] Documentar estructura completa
- [x] Crear resumen de cambios
- [x] Crear diagrama de flujo
- [x] Crear índice central

### Fase 2: Implementación ⏳ EN PROGRESO
- [x] Actualizar controller de promociones
- [ ] Actualizar otros controllers
- [ ] Crear tests unitarios
- [ ] Actualizar colección Postman

### Fase 3: Capacitación ⏳ PENDIENTE
- [ ] Presentación al equipo
- [ ] Workshop práctico
- [ ] Code review de implementaciones
- [ ] Q&A session

---

## 📞 Soporte

Para dudas o sugerencias:

1. **Primero**: Consulta las guías de este directorio
2. **Si no encuentras respuesta**: Contacta al equipo Back-CDS
3. **Para bugs**: Crea un issue en el repositorio

---

## 🔄 Historial de Versiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2025-10-19 | Versión inicial con estructura completa |

---

## 📜 Licencia

Este proyecto es propiedad de [Tu Organización].  
Uso interno exclusivo.

---

**Última actualización**: 2025-10-19  
**Versión**: 1.0.0  
**Autor**: Equipo Back-CDS  
**Contacto**: [email/slack del equipo]
