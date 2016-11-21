/*
Valido si el usuario tiene permisos para ver las imagenes (true | false)
*/
var Imagen = require("../models/imagenes");

module.exports = (image, req, res) => {
    // Para los casos de imágenes sin propietarios
    if(typeof image.creator == "undefined"){
        return false;
    }

    // Validación de visualización
    // Mi lógica indica que cualquiera puede ver
    if(req.method === "GET" && req.path.indexOf("edit") < 0){ 
        return true;
    }

    // Si el creador de la imagen es el mismo que está logueado...
    if(image.creator._id.toString() == res.locals.user._id){
        return true;
    }

    return false;
}