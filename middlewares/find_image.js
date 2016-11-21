var Imagen = require("../models/imagenes");
var owner_check = require("./image_permissions");

module.exports = (req, res, next) => {
    Imagen.findById(req.params.id)
    .populate("creator") // Sería un JOIN en DBs relacionales, lo que hace es crear un objeto basado en un objectId
    .exec((err, imagen) => { // Una vez que se creó el campo "creator" sigo con mi lógica, en este caso mostrar el email del creador
        if(imagen != null && owner_check(imagen, req, res)){            
            res.locals.imagen = imagen;
            next();
        }else{
            res.redirect("/app");
        }
    });
}