var express = require("express");
var bodyParser = require("body-parser"); // Leer parámetros que vienen en el cuerpo de la petición
var User = require("./models/user").User; // Incluyo mi modelo de Users (Mongoose)
//var session = require("express-session"); // Manejo de sesiones, no viene incorporado. 
                                            // Lo reemplazamos por cookies
//var cookieSession = require("cookie-session"); // Manejo de sesiones con cookies, no viene incorporado

var session = require("express-session"); // Reemplazo las cookies por trabajo con redis
var RedisStore = require("connect-redis")(session);
var http = require("http");
var realtime = require("./realtime");

var router_app = require("./routes_app");
var session_middleware = require("./middlewares/session");

var methodOverride = require("method-override"); // Middleware que a partir de parámetros se puedan implementar métodos REST no soportados de forma nativa 

var formidable = require("express-formidable"); // Middleware de formidable para Express. Se encarga de subida de archivos
                                                // Uso una versión más vieja para que funcione como el ejemplo



var app = express();
var server = http.Server(app);

var sessionMiddleware = session({
    store: new RedisStore({  }), // opciones de configuración de Redis
    secret: "super ultra secret word",
    resave: true, // Indica si la sesión se debe volver a guardar sin importar si ha cambiado o no
    saveUninitialized: false // Si la sessión se debe guardar por más que no ha sido inicializada
});

// Tanto Express como Socket.io compartirán la sesión// Para esto sirve Redis
realtime(server, sessionMiddleware);

// Solicitamos un middleware que necesitamos
// En este caso usamos un middleware built-in (que viene incorporado, en este caso en Express) que sirve para servir archivos estáticos, por ejemplo imágenes
// Cuando intento acceder a un recurso por URL, lo busca en la carpeta public, por ejemplo http://localhost:8080/app.css
// Puedo especificar un directorio virtual en caso de necesitar liberar una URL, por ejemplo /css
// Para esto, al use le pasamos un primer parámetro con el directorio virtual
// Se accedería desde http://localhost:8080/public/app.css
//app.use(express.static("public"));
app.use("/public", express.static("public"));

// Implemento el middleware para leer los parámetros de la petición
app.use(bodyParser.json()); // Para peticiones application/json
app.use(bodyParser.urlencoded({extended: true}));

// Indica el verdadero método a utilizar a partir del parámetro recibido
app.use(methodOverride("_method"));

// Implemento el middleware para manejo de sesiones
// Lo reemplacé por cookies. Solo cambia esto, la forma de acceder a la data no cambia
/*
app.use(session({
    secret: "dsadsadsagfdsgfd",
    resave: true, // Indica si la sesión se debe volver a guardar sin importar si ha cambiado o no
    saveUninitialized: false // Si la sessión se debe guardar por más que no ha sido inicializada
}));
*/

/*
// Lo reemplacé por Redis
app.use(cookieSession({
    name: "session",
    keys: ["llave-1", "llave-2"]
}));
*/


app.use(sessionMiddleware);

app.use(formidable.parse({
    keepExtensions: true // cuando mueva los archivos a carpetas temporales que mantenga las extensiones
}));

// Definimos el motor de vistas, con esto no es necesario especificar extensiones
app.set("view engine", "jade");

app.get("/", (req, res) => {
    console.log(req.session.user_id);
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signup", (req, res) => {
    User.find((err, doc) => {
        console.log(doc);
        res.render("signup");
    });
});

app.post("/users", (req, res) => {
    var user = new User({
                        email: req.body.email, 
                        password: req.body.password,
                        password_confirmation: req.body.password_confirmation,
                        username: req.body.username
                    });

    // Cuando termina la inserción llamamos a nuestro callback
    // El primer parámetro del callback es un objeto con error
    // El segundo parámetro es el documento que se creó (incluye el _id)
    // El tercer parámetro es un entero que indica la cantidad de documentos afectados (filas)
    /* 
    user.save((err, user, nro) => {
        // Esto retorna el error que devuelve el model
        if(err){
            console.log(String(err));
        }else{
            res.send("Guardamos tus datos");
        }
    });
    */

    // La forma correcta de trabajar, es no usar callbacks, sino que hay que usar PROMISES
    user.save().then((us) => {
        res.send("Guardamos tus datos");
    }, (err) => {
        res.send("No pudimos guardar la información");
    });  
});

app.post("/sessions", (req, res) => {
     // Vamos a validar el login
     // Para esto hay que usar el finder

     // find() Retorna un array de documentos que cumplen la condición
     // findOne() retorna un único documento
     // Para #1: query (opcional) son las condiciones de busqueda
     // Para #2: campos solicitados (opcional) es un string de campos separados por espacio
     // Para #3: callback
     User.findOne({email: req.body.email, password: req.body.password}, function(err, user){
         req.session.user_id = user._id;

         res.redirect('/app');
     });

     // Existe también un findById() pero para usarlo necesitamos conocer el dato
});

// Todas las rutas definidas dentro del router son relativas a /app
// La home sería http://localhost:8080/app
// Esto quiere decir que las peticiones hechas a /app pasarán por estos middlewares
app.use("/app", session_middleware);
app.use("/app", router_app);

// Modificado al implementar Socket.io
// EN lugar de que sea la app la que reciba las peticiones, va a ser el servidor
//app.listen(8080);
server.listen(8080);