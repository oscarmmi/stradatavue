var app = new Vue({
    el: '#app',
    data: {
        MAIL_FORMAT: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 
        RUTA_API: "http://localhost:8000/api/auth/", 
        SUBRUTA_LOGIN: "login", 
        SUBRUTA_LOGOUT: "logout", 
        SUBRUTA_BUSQUEDA_COINCIDENCIAS: "busquedaCoincidencias", 
        SUBRUTA_LOG_COINCIDENCIAS: "logCoincidencias", 
        ingreso:{
            email:'', 
            password:''
        },
        emailUsuario: '',
        token: undefined,
        busquedas:0,
        busqueda:{
            nombre_buscado:'',
            porcentaje_buscado:'',
            uuid: ''
        }
    }, 
    created() {
        let token = localStorage.getItem('straDataToken');
        if(token){
            this.token = token;
            this.accionesUsuarioLogueado();
        }
    },
    methods: {
        abrirModalAuth: function(){
            this.ingreso.email = '';
            this.ingreso.password = '';
            $("#modalAuth").modal('show');
        },
        ingresarLogin: function(){
            let email = this.ingreso.email.trim();
            if(!email){
                alertify.error("- El email no puede estar vacío");
                return;
            }
            if (!this.MAIL_FORMAT.test(email)) {
                alertify.error("- El correo ingresado no es válido");
                document.querySelector("#ingreso_email").value = '';
                return;
            }
            let password = this.ingreso.password;
            if(!password){
                alertify.error("- La contraseña no puede estar vacía");
                return;
            }
            if(password.length<6){
                alertify.error("- La contraseña debe tener al menos 6 caracteres");
                return;
            }
            let that = this;
            $.ajax({
                url: this.RUTA_API+this.SUBRUTA_LOGIN,
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
                    that.token = respuesta.access_token;
                    localStorage.setItem('straDataEmail', email);
                    alertify.success('- Usuario validado exitosamente');
                    $("#modalAuth").modal('hide');
                    that.accionesUsuarioLogueado();            
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) { 
                    alertify.error("- Error al loguearse");
                    if(XMLHttpRequest.responseJSON.error=="Unauthorized"){
                        alertify.error("- Error de las credenciales de acceso");
                        this.accionesCerrarSesion();    
                    }
                }     
            });
        },
        accionesUsuarioLogueado: function(){
            this.emailUsuario = localStorage.getItem('straDataEmail') ? localStorage.getItem('straDataEmail'): 'Usuario';
        },
        confirmarCerrarSesion: function(){
            if(!this.token){
                alertify.error('- Su sesión se cerrara automaticamente');
                this.accionesCerrarSesion();    
                return;
            }
            let that = this;
            alertify.confirm(
                'Esta seguro que desea cerrar su sesión? ',
                function () {
                    that.cerrarSesion(that.token);
                }
            );
        },
        accionesCerrarSesion: function(){
            localStorage.removeItem('straDataToken');
            this.token = undefined;
            localStorage.removeItem('straDataEmail');
            this.emailUsuario = '';
        },
        cerrarSesion: function(token){
            let that = this;
            $.ajax({
                url: this.RUTA_API+this.SUBRUTA_LOGOUT,
                data: {
                    token
                },
                type: 'POST',
                dataType: 'json',
                success: function (respuesta) {            
                    alertify.success(respuesta.message);
                    that.accionesCerrarSesion();            
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) { 
                    alertify.error("- Su sesión se cerrara automaticamente");
                    that.accionesCerrarSesion();   
                }     
            });
        },
        buscar:function(){
            if(!this.token){
                alertify.error('- Debe loguearse para poder enviar realizar las consultas');
                this.abrirModalAuth();
                return;
            }
            let respuesta = this.validarCampos();
            if(parseInt(respuesta.errores.length)){
                for (const a in respuesta.errores) {
                    alertify.error(respuesta.errores[a]);
                }
                return;
            }
            let token = this.token;
            let datos = respuesta.datos;
            let that = this;
            that.busquedas++;
            this.crearTablaCorrespondiente('tablaResultados', []);
            $.ajax({
                url: this.RUTA_API+this.SUBRUTA_BUSQUEDA_COINCIDENCIAS,
                data: {
                    datos, 
                    token
                },
                type: 'POST',
                dataType: 'json',
                success: function (respuesta) {
                    that.validarEstadoToken(respuesta);                      
                    if(respuesta.estado_ejecucion){
                        alertify.success(respuesta.estado_ejecucion);
                    }
                    if(respuesta.uuid){
                        that.busqueda.uuid = respuesta.uuid;
                    }
                    that.crearTablaCorrespondiente('tablaResultados', respuesta.datos);
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
        },
        crearTablaCorrespondiente: function(id, datos) {
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
        },
        validarEstadoToken: function(respuesta){
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
                    this.accionesCerrarSesion();
                }, 2000);
            }
        },
        validarCampos: function(){
            let respuesta = {
                errores: [], 
                datos: {}
            };
            respuesta.datos.nombre_buscado = this.busqueda.nombre_buscado;
            if(respuesta.datos.nombre_buscado==''){
                respuesta.errores.push("- El nombre no puede estar vacío");
            }
            respuesta.datos.porcentaje_buscado = this.busqueda.porcentaje_buscado;
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
        },
        confirmarExportar: function(tipo){
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
            let that = this;
            alertify.confirm(
                'Esta seguro que desea exportar los resultados actuales como archivo CSV? ',
                function () {
                    that.exportToCsv(nombreArchivo, datos, tipo);
                }
            );
        },
        exportToCsv: function(filename, rows, tipo) {
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
    }    
});