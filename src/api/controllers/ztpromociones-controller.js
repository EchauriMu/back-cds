const cds = require('@sap/cds');
const { crudZTPromociones, ZTPromocionesCRUD } = require('../services/ztpromociones-service');

/**
 * Controller de Promociones - SAP CAP
 * 
 * ESTRUCTURA ESTANDARIZADA DE ENDPOINTS:
 * Todos los endpoints deben incluir los siguientes campos base (case-sensitive):
 * 
 * @param {string} ProcessType - Tipo de operación (GetFilters, AddMany, UpdateMany, DeleteMany)
 * @param {string} DBServer - Motor de BD (MongoDB, HANA, AzureCosmos) [default: MongoDB]
 * @param {string} LoggedUser - Usuario ejecutor formato: [primera letra nombre][apellido paterno][primera letra apellido materno] (ej: jlopezm)
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {string} api - Ruta del endpoint (ej: /api/ztpromociones/crudPromociones)
 * 
 * Endpoints:
 * - crudPromociones: Endpoint estándar con bitácora completa
 * - promocionesCRUD: Legacy (deprecado)
 */
class ZTPromocionesService extends cds.ApplicationService {
  async init() {
      
      /**
       * Endpoint Principal: POST /api/ztpromociones/crudPromociones
       * 
       * PARÁMETROS OBLIGATORIOS (Query String):
       * - ProcessType: Tipo de operación a ejecutar
       * - LoggedUser: Usuario que ejecuta la operación
       * 
       * PARÁMETROS OPCIONALES (Query String):
       * - DBServer: Motor de base de datos (default: MongoDB)
       * 
       * Ejemplo: ?ProcessType=GetFilters&LoggedUser=jlopezm&DBServer=MongoDB
       */
      this.on('crudPromociones', async (req) => {
        try {
          // ============================================
          // DEBUG: Ver estructura completa del request
          // ============================================
          if (process.env.NODE_ENV === 'development') { // eslint-disable-line
            console.log('[CONTROLLER DEBUG] ═══════════════════════════════════════');
            console.log('[CONTROLLER DEBUG] req.data:', req.data);
            console.log('[CONTROLLER DEBUG] req.req.body:', req.req?.body);
            console.log('[CONTROLLER DEBUG] req.req.query:', req.req?.query);
            console.log('[CONTROLLER DEBUG] ═══════════════════════════════════════');
          }
          
          // ============================================
          // 1. VALIDAR Y EXTRAER PARÁMETROS BASE
          // ============================================
          // Extraer parámetros del query string
          const params = req.req?.query || {};
          
          // Serializar parámetros a cadena HTML/String usando URLSearchParams
          const paramString = params ? new URLSearchParams(params).toString().trim() : '';
          
          // Desestructurar campos obligatorios
          const {
            ProcessType,
            LoggedUser,
            DBServer = 'MongoDB', // Default si no se proporciona
          } = params;
          
          // Extraer campos autoconfigurados
          const method = req.req?.method || 'POST';
          const api = '/api/ztpromociones/crudPromociones';
          
          // ============================================
          // 2. VALIDAR PARÁMETROS OBLIGATORIOS
          // ============================================
          // Validar ProcessType (obligatorio)
          if (!ProcessType) {
            const error = new Error('Parámetro obligatorio faltante: ProcessType');
            error.code = 400;
            throw error;
          }
          
          // Validar valores permitidos de ProcessType (case-sensitive)
          const validProcessTypes = ['GetFilters', 'AddMany', 'UpdateMany', 'DeleteMany'];
          if (!validProcessTypes.includes(ProcessType)) {
            const error = new Error(`ProcessType inválido: "${ProcessType}". Valores permitidos: ${validProcessTypes.join(', ')}`);
            error.code = 400;
            throw error;
          }
          
          // Validar LoggedUser (obligatorio)
          if (!LoggedUser) {
            const error = new Error('Parámetro obligatorio faltante: LoggedUser (formato: jlopezm)');
            error.code = 400;
            throw error;
          }
          
          // Validar formato de LoggedUser
          const userRegex = /^[a-z][a-z]+[a-z]$/i;
          if (!userRegex.test(LoggedUser)) {
            console.warn(`[ZTPROMOCIONES] ⚠️  LoggedUser con formato inusual: "${LoggedUser}"`);
            console.warn('[ZTPROMOCIONES] ℹ️  Formato esperado: [1ª letra nombre][apellido paterno][1ª letra apellido materno]');
          }
          
          // Validar DBServer (opcional pero debe ser válido si se proporciona)
          const validDBServers = ['MongoDB', 'HANA', 'AzureCosmos'];
          if (DBServer && !validDBServers.includes(DBServer)) {
            const error = new Error(`DBServer inválido: "${DBServer}". Valores permitidos: ${validDBServers.join(', ')}`);
            error.code = 400;
            throw error;
          }
          
          // ============================================
          // 3. LOG DE CONTEXTO (Desarrollo)
          // ============================================
          if (process.env.NODE_ENV === 'development') { // eslint-disable-line
            console.log('[ZTPROMOCIONES] ═══════════════════════════════════════');
            console.log('[ZTPROMOCIONES] Contexto del endpoint:');
            console.log(`[ZTPROMOCIONES]   • ProcessType: ${ProcessType}`);
            console.log(`[ZTPROMOCIONES]   • LoggedUser: ${LoggedUser}`);
            console.log(`[ZTPROMOCIONES]   • DBServer: ${DBServer}`);
            console.log(`[ZTPROMOCIONES]   • Method: ${method}`);
            console.log(`[ZTPROMOCIONES]   • API: ${api}`);
            console.log(`[ZTPROMOCIONES]   • Query String: ${paramString}`);
            console.log('[ZTPROMOCIONES] ═══════════════════════════════════════');
          }
          
          // ============================================
          // 4. EJECUTAR LÓGICA DE NEGOCIO
          // ============================================
          const result = await crudZTPromociones(req);

          // ============================================
          // 5. CONFIGURAR RESPUESTA HTTP
          // ============================================
          if (!result.success && req.http?.res) {
            // Error: establecer status HTTP según el código
            req.http.res.status(result.status || 500);
          } 
          else if (ProcessType === 'AddMany' && result.success && req.http?.res) {
            // AddMany exitoso: status 201 Created + header personalizado
            req.http.res.status(201);
            const promoCount = result.dataRes?.length || result.countDataRes || 0;
            if (promoCount > 0) {
              req.http.res.set('X-Created-Count', promoCount.toString());
            }
          }
          else if (result.success && req.http?.res) {
            // Otros tipos exitosos: status 200 OK (por defecto)
            req.http.res.status(200);
          }
          
          // ============================================
          // 6. ENRIQUECER RESPUESTA CON METADATOS
          // ============================================
          if (result && typeof result === 'object') {
            result._metadata = {
              processType: ProcessType,
              dbServer: DBServer,
              loggedUser: LoggedUser,
              method: method,
              api: api,
              queryString: paramString, // Cadena HTML/String serializada
              timestamp: new Date().toISOString()
            };
          }
          
          // ============================================
          // 7. RETORNAR RESULTADO
          // ============================================
          return result;
          
        } catch (error) {
          // ============================================
          // 8. MANEJO DE ERRORES
          // ============================================
          console.error('[ZTPROMOCIONES] ❌ Error en controller:', error.message);
          
          // Si es un error de validación (400), mantener el código
          const errorCode = error.code || 500;
          
          req.error(errorCode, error.message);
        }
      });

      /**
       * Endpoint Legacy (DEPRECADO)
       * 
       * ADVERTENCIA: Este endpoint está obsoleto.
       * Migre a 'crudPromociones' con los parámetros estandarizados.
       * 
       * El endpoint legacy no garantiza la estructura base obligatoria:
       * - ProcessType
       * - DBServer
       * - LoggedUser
       * - method/api
       * 
       * Se mantendrá por compatibilidad pero puede eliminarse en futuras versiones.
       */
      this.on('promocionesCRUD', async (req) => {
        console.warn("[LEGACY] ⚠️  Endpoint 'promocionesCRUD' está DEPRECADO");
        console.warn("[LEGACY] ↪️  Migre a 'crudPromociones' con estructura estandarizada");
        
        try {
          // ============================================
          // MAPEO DE PARÁMETROS LEGACY A ESTÁNDAR
          // ============================================
          const legacyParams = req.req?.query || {};
          
          // Validar si se proporcionó LoggedUser (obligatorio en estándar)
          if (!legacyParams.LoggedUser) {
            console.warn("[LEGACY] LoggedUser no proporcionado, usando 'system_legacy'");
          }
          
          // ============================================
          // EJECUTAR LÓGICA LEGACY
          // ============================================
          const resultado = await ZTPromocionesCRUD(req);
          
          // ============================================
          // ENRIQUECER RESPUESTA CON ADVERTENCIAS
          // ============================================
          if (resultado && typeof resultado === 'object') {
            resultado._deprecated = true;
            resultado._migration_info = {
              message: "Este endpoint está deprecado. Use 'crudPromociones' con estructura estandarizada",
              new_endpoint: "/api/ztpromociones/crudPromociones",
              required_params: {
                ProcessType: "GetFilters | AddMany | UpdateMany | DeleteMany",
                LoggedUser: "Usuario formato: jlopezm",
                DBServer: "MongoDB | HANA | AzureCosmos (opcional, default: MongoDB)"
              },
              example: "/api/ztpromociones/crudPromociones?ProcessType=GetFilters&LoggedUser=jlopezm&DBServer=MongoDB"
            };
          }
          
          return resultado;
          
        } catch (error) {
          console.error("[LEGACY] Error:", error.message);
          req.error(error.code || 500, error.message);
        }
      });

      return super.init();
  }
}

module.exports = ZTPromocionesService;