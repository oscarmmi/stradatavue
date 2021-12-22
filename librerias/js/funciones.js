
var RUTA_API = "http://localhost:8000/api/auth/";
var SUBRUTA_BUSQUEDA_COINCIDENCIAS ="busquedaCoincidencias";
var SUBRUTA_LOG_COINCIDENCIAS ="logCoincidencias";
var SUBRUTA_LOGIN ="login";
var SUBRUTA_LOGOUT ="logout";

var MAIL_FORMAT = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

$(document).ready(function () {
    funcionesClick();
    crearTablaCorrespondiente('tablaResultados', []);
    $("#graficaResultados").addClass('hidden');
    let token = localStorage.getItem('straDataToken');
    if(token){
        accionesUsuarioLogueado();
    }
});

function funcionesClick(){
    $("#btnBuscar").click(buscar);
    $("#btnExportar").click(function(){
        confirmarExportar(0);
    });
    $("#btnBuscarUuid").click(buscarLog);
    $("#btnExportarLog").click(function(){
        confirmarExportar(1);
    });
    $("#btnIngreso").click(abrirModalAuth);
    $("#btnIngresarLogin").click(ingresarLogin);
    $("#btnCerrarSesion").click(confirmarCerrarSesion);
}

function confirmarCerrarSesion(){
    let token = localStorage.getItem('straDataToken');
    if(!token){
        alertify.error('- Su sesión se cerrara automaticamente');
        accionesCerrarSesion();    
        return;
    }
    alertify.confirm(
        'Esta seguro que desea cerrar su sesión? ',
        function () {
            cerrarSesion(token);
        }
    );
}

function accionesCerrarSesion(){
    localStorage.removeItem('straDataToken');
    localStorage.removeItem('straDataEmail');
    location.reload();
}

function cerrarSesion(token){
    $.ajax({
        url: RUTA_API+SUBRUTA_LOGOUT,
        data: {
            token
        },
        type: 'POST',
        dataType: 'json',
        success: function (respuesta) {            
            alertify.success(respuesta.message);
            accionesCerrarSesion();            
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            alertify.error("- Se presento un problema al cerrar la sesión");
        }     
    });
}

function ingresarLogin(){
    let email = document.querySelector("#ingreso_email").value.trim();
    if(!email){
        alertify.error("- El email no puede estar vacío");
        return;
    }
    if (!MAIL_FORMAT.test(email)) {
        alertify.error("- El correo ingresado no es válido");
        document.querySelector("#ingreso_email").value = '';
        return;
    }
    let password = document.querySelector("#ingreso_password").value;
    if(!password){
        alertify.error("- La contraseña no puede estar vacía");
        return;
    }
    if(password.length<6){
        alertify.error("- La contraseña debe tener al menos 6 caracteres");
        return;
    }
    $.ajax({
        url: RUTA_API+SUBRUTA_LOGIN,
        data: {
            email, 
            password         
        },
        type: 'POST',
        dataType: 'json',
        hrFields: {
            withCredentials: true
        },
        success: function (respuesta) {
            localStorage.setItem('straDataToken', respuesta.access_token);
            localStorage.setItem('straDataEmail', email);
            alertify.success('- Usuario validado exitosamente');
            $("#modalAuth").modal('hide');
            accionesUsuarioLogueado();            
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            alertify.error("- Error al loguearse");
            if(XMLHttpRequest.responseJSON.error=="Unauthorized"){
                alertify.error("- Error de las credenciales de acceso");
            }
        }     
    });
}

function accionesUsuarioLogueado(){
    let email= localStorage.getItem('straDataEmail') ? localStorage.getItem('straDataEmail'): 'Usuario';
    if(!$("#botonesIngreso").hasClass('hidden')){
        $("#botonesIngreso").addClass('hidden');
    }
    if($("#botonesLogueado").hasClass('hidden')){
        $("#botonesLogueado").removeClass('hidden');
    }      
    $("#emailUsuario").html(email);
}

function abrirModalAuth(){
    $("#modalAuth").modal('show');
}

function validarEmail(element) {
    if(!element.value){
        alertify.error("- El email no puede estar vacío");
        return;
    }    
    if (!MAIL_FORMAT.test(element.value)) {
        alertify.error("- El correo ingresado no es válido");
        element.value='';
        return;
    }
}

function validarNombre(element){
    if(!element.value){
        alertify.error("- El nombre no puede estar vacío");
        return;
    }
    if(element.value.length<3){
        alertify.error("- El nombre debe tener al menos 3 caracteres");
        return;
    }
}

function validarPassword(element){
    if(!element.value){
        alertify.error("- La contraseña no puede estar vacía");
        return;
    }
    if(element.value.length<6){
        alertify.error("- La contraseña debe tener al menos 6 caracteres");
        return;
    }
 }

function validarCamposLog(){
    let respuesta = {
        errores: [], 
        uuid:0
    };
    respuesta.uuid = document.querySelector("#uuid").value;
    if(respuesta.uuid==''){
        respuesta.errores.push("- El uuid no puede estar vacío");
    }else if(!$.isNumeric(respuesta.uuid)){
        respuesta.errores.push("- El uuid debe ser un valor númerico");
    }else if(!Number.isInteger(parseInt(respuesta.uuid))){
        respuesta.errores.push("- El uuid debe ser un valor entero");
    }
    return respuesta;
}

function buscarLog(){
    let token =localStorage.getItem('straDataToken');
    if(!token){
        alertify.error('- Debe loguearse para poder enviar realizar las consultas');
        $("#btnIngreso").click();
        return;
    }
    let respuesta = validarCamposLog();
    if(parseInt(respuesta.errores.length)){
        for (const a in respuesta.errores) {
            alertify.error(respuesta.errores[a]);
        }
        return;
    }
    $("#texto_uuid").html('');
    crearTablaCorrespondiente('tablaResultadosLog', []);
    if($("#resultadosLog").hasClass('hidden')){
        $("#resultadosLog").removeClass('hidden');
        $(".busqueda_log_error").hide();
        $(".busqueda_log_exitoso").hide();
    }
    $("#btnExportarLog").addClass('hidden');
    $.ajax({
        url: RUTA_API+SUBRUTA_LOG_COINCIDENCIAS,
        data: {
            uuid: respuesta.uuid, 
            token
        },
        type: 'POST',
        dataType: 'json',
        success: function (respuesta) {     
            validarEstadoToken(respuesta);       
            if($("#btnExportarLog").hasClass('hidden')){
                $("#btnExportarLog").removeClass('hidden');
            }
            if(respuesta.estado_ejecucion){
                alertify.success(respuesta.estado_ejecucion);
            }
            if(respuesta.uuid){
                $("#texto_uuid").html(respuesta.uuid);
            }
            $(".busqueda_log_error").hide();
            $(".busqueda_log_exitoso").show();
            cargarCamposDatosLog(respuesta.datos);
            crearTablaCorrespondiente('tablaResultadosLog', respuesta.detalles);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            $(".busqueda_log_error").show();
            $(".busqueda_log_exitoso").hide();
            if(XMLHttpRequest.responseJSON.estado_ejecucion){
                alertify.error(XMLHttpRequest.responseJSON.estado_ejecucion);
            }
            if(respuesta.uuid){
                $("#texto_uuid").html(respuesta.uuid);
            }
            if(XMLHttpRequest.responseJSON.errors && parseInt(XMLHttpRequest.responseJSON.errors.length)){
                let numeroErrores = parseInt(XMLHttpRequest.responseJSON.errors.length);
                for(let i=0; i<numeroErrores; i++){
                    alertify.error(XMLHttpRequest.responseJSON.errors[i]['message']);
                }
            }
        }     
    });
}

function validarEstadoToken(respuesta){
    let flag = 0;
    if(respuesta.status){
        if(respuesta.status=='Token is Invalid'){
            flag = 1;
        }else if(respuesta.status=='Token is Expired'){
            flag = 1;
        }else if(respuesta.status=='Authorization Token not found'){
            flag = 1;
        }
    }
    if(flag){
        alertify.error("- Hay un problema con su sesión, por lo tanto se recargara la aplicación");
        setTimeout(function(){ 
            accionesCerrarSesion();
        }, 2000);
    }
}

function cargarCamposDatosLog(datos){
    for (const a in datos) {
        $("#log_"+a).html(datos[a]);
    }
}

function confirmarExportar(tipo){
    let datos = [];
    let nombreArchivo = 'resultadoCoincidencias_';
    if(!tipo){
        datos = $('#tablaResultados').dataTable().fnGetData();
    }else if(tipo===1){
        datos = $('#tablaResultadosLog').dataTable().fnGetData();
        nombreArchivo = 'resultadoLogCoincidencias_';
    }
    nombreArchivo += Math.floor(Math.random() * 1000);
    if(!parseInt(datos.length)){
        alertify.error("- No hay datos para generar un CSV");
        return;
    }
    alertify.confirm(
        'Esta seguro que desea exportar los resultados actuales como archivo CSV? ',
        function () {
            exportToCsv(nombreArchivo, datos, tipo);
        }
    );
}

function validarCampos(){
    let respuesta = {
        errores: [], 
        datos: {}
    };
    respuesta.datos.nombre_buscado = document.querySelector("#nombre_buscado").value;
    if(respuesta.datos.nombre_buscado==''){
        respuesta.errores.push("- El nombre no puede estar vacío");
    }
    respuesta.datos.porcentaje_buscado = document.querySelector("#porcentaje_buscado").value;
    if(respuesta.datos.porcentaje_buscado==''){
        respuesta.errores.push("- El porcentaje de coincidencia no puede estar vacío");
    }else if(!$.isNumeric(respuesta.datos.porcentaje_buscado)){
        respuesta.errores.push("- El porcentaje de coincidencia debe ser un valor númerico");
    }else if(!Number.isInteger(parseInt(respuesta.datos.porcentaje_buscado))){
        respuesta.errores.push("- El porcentaje de coincidencia debe ser un valor entero");
    }else if(parseInt(respuesta.datos.porcentaje_buscado)<0 || parseInt(respuesta.datos.porcentaje_buscado)>100){
        respuesta.errores.push("- El porcentaje de coincidencia debe estar entre el rango de 0 a 100");
    }
    return respuesta;
}

function buscar(){
    let token =localStorage.getItem('straDataToken');
    if(!token){
        alertify.error('- Debe loguearse para poder enviar realizar las consultas');
        $("#btnIngreso").click();
        return;
    }
    let respuesta = validarCampos();
    if(parseInt(respuesta.errores.length)){
        for (const a in respuesta.errores) {
            alertify.error(respuesta.errores[a]);
        }
        return;
    }
    let datos = respuesta.datos;
    crearTablaCorrespondiente('tablaResultados', []);
    $.ajax({
        url: RUTA_API+SUBRUTA_BUSQUEDA_COINCIDENCIAS,
        data: {
            datos, 
            token
        },
        type: 'POST',
        dataType: 'json',
        success: function (respuesta) {
            validarEstadoToken(respuesta);  
            if($("#graficaResultados").hasClass('hidden')){
                $("#graficaResultados").removeClass('hidden');
            }
            if($("#btnExportar").hasClass('hidden')){
                $("#btnExportar").removeClass('hidden');
            }
            if(respuesta.estado_ejecucion){
                alertify.success(respuesta.estado_ejecucion);
            }
            $("#texto_uuid").html(respuesta.uuid);
            crearTablaCorrespondiente('tablaResultados', respuesta.datos);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) { 
            if(XMLHttpRequest.responseJSON.estado_ejecucion){
                alertify.error(XMLHttpRequest.responseJSON.estado_ejecucion);
            }
            if(respuesta.uuid){
                $("#texto_uuid").html(respuesta.uuid);
            }
            if(XMLHttpRequest.responseJSON.errors && parseInt(XMLHttpRequest.responseJSON.errors.length)){
                let numeroErrores = parseInt(XMLHttpRequest.responseJSON.errors.length);
                for(let i=0; i<numeroErrores; i++){
                    alertify.error(XMLHttpRequest.responseJSON.errors[i]['message']);
                }
            }
        }     
    });
}

function crearTablaCorrespondiente(id, datos) {
    if (parseInt(datos.length) === 0) {
        datos = [];
    }
    $('#' + id).DataTable({
        paging: 'numbers',
        bFilter: false,
        destroy: true,
        select: true,
        dom: 'T<"clear">lfrtip', // Permite cargar la herramienta tableTools
        tableTools: {
            aButtons: [],
            sRowSelect: "single"
        },
        data: datos,
        columns: [{
                data: 'nombre_encontrado',
                title: 'Nombre',
                className: 'text-capitalize'
            },
            {
                data: 'tipo_persona',
                title: 'Tipo Persona',
                className: 'text-capitalize dt-body-center dt-head-center'
            },
            {
                data: 'tipo_cargo',
                title: 'Tipo Cargo',
                className: 'text-capitalize dt-body-center dt-head-center'
            },
            {
                data: 'departamento',
                title: 'Departamento',
                className: 'text-capitalize dt-body-center dt-head-center'
            },
            {
                data: 'municipio',
                title: 'Municipio',
                className: 'text-capitalize dt-body-center dt-head-center'
            }
            ,
            {
                data: 'porcentaje_encontrado',
                title: '% Coincidencia',
                className: 'text-capitalize dt-body-center dt-head-center',
                render: function (data, type, full, meta) {
                    return data+' %';
                }
            }
        ]
    });
}

function exportToCsv(filename, rows, tipo) {
    var processRow = function (row, uuid) {
        let aCampos = [];
        if(uuid){
            aCampos.push(uuid);
        }
        for (const a in row) {
            aCampos.push(row[a]);
        }
        return aCampos.join(",")+ '\n';
    };
    let csvFile = '';
    let uuid = '';
    if(!tipo){
        csvFile = 'Nombre, Tipo Persona, Tipo Cargo, Departamento, Municipio, % Coincidencia\n';
    }else if(tipo===1){
        uuid = document.getElementById('log_uuid').innerHTML;
        csvFile = 'Uuid, Nombre, Tipo Persona, Tipo Cargo, Departamento, Municipio, % Coincidencia\n';
    }
    
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i], uuid);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }    
}