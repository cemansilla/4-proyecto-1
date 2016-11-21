var express = require("express");
var Imagen = require("./models/imagenes");
var image_finder_middleware = require("./middlewares/find_image");
var router = express.Router();
var mv = require("mv"); // Manejo de archivos

var redis = require("redis");
var client = redis.createClient();

router.get("/", function(req, res){
    Imagen.find({})
          .populate("creator") 
          .exec((err, imagenes) => {
              if(err){
                  console.log;
              }else{
                  res.render("app/home", {imagenes:imagenes});
              }
          });
});

/* REST */
// GET: Solicitar
// PUT: Actualizar
// DELETE: Eliminar
// POST: Crear

router.get("/imagenes/new", function(req, res){
    res.render("app/imagenes/new");
});

// Acá indico que todo lo que entre por esta forma de URL pase por mi middleware
router.all("/imagenes/:id*", image_finder_middleware);

router.get("/imagenes/:id/edit", function(req, res){
    // Comento la búsqueda que estaba haciendo porque ahora implementé el image_finder_middleware
    //Imagen.findById(req.params.id, (err, imagen) => {  // Con req.params accedo al parámetro routeado        
        
        // Al usar el image_finder_middleware no necesitamos el segundo parámetro, ya que con el locals la variable es accesible a las vistas  
        //res.render("app/imagenes/edit", {imagen:imagen});
        res.render("app/imagenes/edit");
    //});    
});

router.route("/imagenes/:id") // Recurso sobre el que opero
    .get((req, res) => { // Acciones de GET
        // Comento la búsqueda que estaba haciendo porque ahora implementé el image_finder_middleware
        //Imagen.findById(req.params.id, (err, imagen) => {

            // Al usar el image_finder_middleware no necesitamos el segundo parámetro, ya que con el locals la variable es accesible a las vistas
            //res.render("app/imagenes/show", {imagen:imagen});
            res.render("app/imagenes/show");
        //});        
    })
    .put((req, res) => { // Acciones de PUT
        // Comento la búsqueda que estaba haciendo porque ahora implementé el image_finder_middleware
        //Imagen.findById(req.params.id, (err, imagen) => {
            // Preparo la actualización de info
            res.locals.imagen.title = req.body.titulo;
            //res.locals.imagen.creator = res.locals.user._id; // Esto lo hice porque ya tengía imágenes creadas pero sin el id del usuario asignado

            // Hago efectiva la actualización
            res.locals.imagen.save((err) => {
                if(!err){
                    //res.render("app/imagenes/show", {imagen:imagen});
                    res.render("app/imagenes/show");
                }else{
                    //res.render("app/imagenes/"+imagen.id+"/edit", {imagen:imagen});
                    res.render("app/imagenes/"+res.locals.imagen.id+"/edit");
                }
            });
        //});  
    })
    .delete((req, res) => { // Acciones de DELETE
        // Con el método findOneAndRemove() busco un elemento según los criterios del primer parámetro y luego lo elimina
        // Se podría usar findById() en caso de que se necesite hacer algo antes de borrar con image.remove()
        Imagen.findOneAndRemove({_id:req.params.id}, (err) => {
            if(!err){
                res.redirect("/app/imagenes");
            }else{
                console.log(err);
                res.redirect("/app/imagenes/"+req.params.id);
            }
        })
    });

router.route("/imagenes")
    .get((req, res) => {
        // Busco imágenes que le pertenezcan al usuario logueado
        Imagen.find({creator: res.locals.user._id}, (err, imagenes) => {
            if(err){ res.redirect("/app"); return; }

            res.render("app/imagenes/index", {imagenes:imagenes});
        });
    })
    .post((req, res) => { // Creo un elemento de la colección
        var extension = req.body.archivo.name.split(".").pop();

        var data = {
            title: req.body.titulo,
            creator: res.locals.user._id, // Lo definí en el middleware session
            extension: extension
        }

        var imagen = new Imagen(data);

        imagen.save((err) => {
            if(!err){
                // Envio un mensaje al socket "images" y le envio la imagen subida
                // Esto lo hago a través de publicación en Redis
                var imgJSON = {
                    "id" : imagen._id,
                    "title": imagen.title,
                    "extension": imagen.extension
                }
                client.publish("images", JSON.stringify(imgJSON));

                // Muevo el archivo del directorio temporal a la carpeta que especifico
                mv(req.body.archivo.path, "public/imagenes/" + imagen._id + "." + extension, (err) => {
                    if(err)
                        console.log(err);
                });

                res.redirect("/app/imagenes/" + imagen._id);
            }else{
                //res.render(err);
            }
        });
    });

module.exports = router;