

Tanto en el ocntrolador como el servicio poner el ejemplo del endpoint, posibles valores o parámetros que puede tener el crud

1-2 encondpoint se dividen entre diferentes procesos "processType"

Siempre inicar el servicio principal con la instancia de la bitacora de data


> Miércoles 1 de las apis transformar completa y presentar jalando

Instanciamos para los atributos
la bitacora es una tipo estructura, se peude hacer tipo clase-objeto

En la libreria de bitacora todos los metodos se agrego processtype para que sea bitacora.processtype y vaya el tipo de proceso que se este ejecutando en el momento

add data, addmessage, metodo ok, metodo fail.

por estandar simepre va haber un processtype y un loguser (quien esta ejecutando  la api), porque ya no se va hacer apis por cada proceso que tienes

"url efectiva -> todo un proceso
cuando realmete ocupas la imagen"

por defecto esta en false

si algunas apis no la ocupan, va tronar. Cuando se que es una propiedad que puede o no venir, esta la sintaxis 


--


si ya rescate processtype y loginuser en el switch hay que meterlo de una vez en la bitacora antes de enviarla.

"bitacora login user, bitacora processtype"

si yo sé que mi consulta puede tener un producto en especifico con tal marca,sabor,categoria, podemos tener get all, get some o get one pero entonces manjealo como un get filters.. un proceso getfilters que abarca todo

metodo local
enviamos ibtacora
    si retorna vacía, hay un error, si esta llena entra, si hay un error que lo respete.
enviamos params
    trip,body,..

"/----------------------------------------
//FIC: Get All Products (filters)
//----------------------------------------
//async function GetProductsAllFilters(req, products) {   
async function GetProductsAllFilters(req) {     

    let bitacora = BITACORA();
    let data = DATA();

    const dbServer = req.req.query.dbServer ? req.req.query.dbServer : process.env.CONNECTION_TO_HANA;
    
    try {
        //FIC: Log configuration
        bitacora.process = "Extraer todos los PRODUCTOS";
        bitacora.dbServer= dbServer;
        data.method = "GET";
        data.api = "/getall";

        const params = {
            WithImagesURL : req.req.query?.WithImagesURL
            //ProcessType:  req.req.query?.ProcessType,
            //LoggedUser  : req.req.query?.LoggedUser
        };

        bitacora = await GetProductsMethod(bitacora, params)
                    .then((bitacora) => {
                        if (!bitacora.success) {
                            bitacora.finalRes = true;
                            throw bitacora;
                            //throw Error(bitacora.messageDEV);
                        };
                        return bitacora;
                    });

        //FIC: Return response OK
        return OK(bitacora);
        
        // OK(bitacora);

        // req.reply({
        //     code: 'Internal-Server-Error',
        //     status: bitacora.status,
        //     message: bitacora.messageUSR,
        //     target: bitacora.messageDEV,
        //     innererror: bitacora
        // });
        //return

    } catch (errorBita) {
        //FIC: Unhandled error response configuration
        if(!errorBita.finalRes) {
            data.status = data.status || 500;
            data.messageDEV = data.messageDEV || errorBita.message;
            data.messageUSR = data.messageUSR || "<<ERROR CATCH>> La extracción de los PRODUCTOS <<NO>> tuvo éxito.";
            data.dataRes = data.dataRes || errorBita;
            errorBita = AddMSG(bitacora, data, "FAIL");
        };
        console.log(<<Message USR>> ${errorBita.messageUSR});
        console.log(<<Message DEV>> ${errorBita.messageDEV});

        // FAIL(errorBita);
        // // Manejo de errores adicionales si es necesario
        // req.error({
        //     code: 'Internal-Server-Error',
        //     status: errorBita.status,
        //     message: errorBita.messageUSR,
        //     target: errorBita.messageDEV,
        //     numericSeverity: 1,
        //     //longtext_url: 'https://example.com/error-details',
        //     innererror: errorBita
        // });
        
        return FAIL(errorBita);

    } finally {
        //FIC: Close the connection to HANA after the query
        //if (conn) {
            //conn.disconnect();
            //console.log(<<OK>> Se finalizo la conexion a Hana Client desde el Catch Principal);
        //}
    }
};
AHORA AQUI DEJO EL CODIGO DEL METODO LOCAL QUE SE MANDA LLAMAR EN EL SERVICIO PRINCIPAL EL CUAL ES EL QUE REALMENTE EXTRAE, INSERTA, MODIFICA O ELIMINA LA INFORMACION EN LA BASE DE DATOS
No olviden importar la librería de Bitacora en el Servicio
//FIC: Imports fuctions/methods
import {OK, FAIL, BITACORA, DATA, AddMSG} from '../../middlewares/respPWA.handler';
ESTA SERIA LA IDEA DEL ESTANDAR QUE QUEREMOS LOGRAR SOBRE LA ESTRUCTURA BASE DEL SERVICIO PRINCIPAL
/* EndPoint: localhost:8080/api/inv/crud?ProcessType='AddMany'  */

export async function crudPricesHistory(req) {
  
  let bitacora = BITACORA();
  let data = DATA();
  
  let ProcessType = req.req.query?.ProcessType;
  const {LoggedUser} = req.req.query;
  //FIC: get query params
  let params = req.req.query;
  //FIC: get params of the service and convert in string
  let paramString = req.req.query ? new URLSearchParams(req.req.query).toString().trim() : '';
  //FIC: get body 
  const body = req.req.body;

  //FIC: start fill some properties of the bitacora
  bitacora.loggedUser = LoggedUser;
  bitacora.processType = ProcessType;

  try {

    switch (ProcessType) {

      case 'GetFilters':
            //FIC: Get One, Some or All Prices History Method
            //------------------------------------------------------           
            bitacora = await GetFiltersPricesHistoryMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });
        break;

      // case 'GetOne':
      
      //   break;
    
      // case 'AddOne':
        
      //   break;

      case 'AddMany':
            //FIC: Add One or Many Prices History Method
            //------------------------------------------------------           
            bitacora = await AddManyPricesHistoryMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });

        break;

        // case 'UpdateOne':
        
        //   break;

        case 'UpdateMany': //UpdateSome
            //FIC: Update One or Many Prices History Method
            //------------------------------------------------------           
            bitacora = await UpdateManyPricesHistoryMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });
        break;

        // case 'DeleteOne':
        
        //   break;

        case 'DeleteMany':
            //FIC: Delete (logic/physical) One or Many Prices History Method
            //------------------------------------------------------           
            bitacora = await DeleteManyPricesHistoryMethod(bitacora, params, paramString, body)
            .then((bitacora) => {
                if (!bitacora.success) {
                    bitacora.finalRes = true;
                    throw bitacora;
                };
                //let countData = bitacora.countData - 1;
                //newInventorieItem = bitacora.data[countData].dataRes;
                return bitacora;
            });
        break;


      default:
        break;
    };


    //FIC: Return response OK
    return OK(bitacora);


  } catch (errorBita) {
        //FIC: Unhandled error response configuration 
        if(!errorBita?.finalRes) {
            data.status = data.status || 500;
            data.messageDEV = data.messageDEV || errorBita.message;
            data.messageUSR = data.messageUSR || "<<ERROR CATCH>> La extracción de la información de AZURE <<NO>> tuvo exito";
            data.dataRes = data.dataRes || errorBita;
            errorBita = AddMSG(bitacora, data, "FAIL");
        };
        console.log(<<Message USR>> ${errorBita.messageUSR});
        console.log(<<Message DEV>> ${errorBita.messageDEV});

        FAIL(errorBita);
        //FIC: Manejo de errores adicionales si es necesario
        req.error({
            code: 'Internal-Server-Error',
            status: errorBita.status,
            message: errorBita.messageUSR,
            target: errorBita.messageDEV,
            numericSeverity: 1,
            //longtext_url: 'https://example.com/error-details',
            innererror: errorBita
        });
    
        return

    } finally {
      
    }

}"