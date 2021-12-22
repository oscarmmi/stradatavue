var app = new Vue({
    el: '#app',
    data: {
        MAIL_FORMAT: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 
        RUTA_API: "http://localhost:8000/api/auth/", 
        SUBRUTA_LOGIN: "login", 
        SUBRUTA_LOGOUT: "logout", 
        ingreso:{
            email:'', 
            password:''
        },
        emailUsuario: '',
        token: undefined,
        busquedas:0,
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
        }
    }
});