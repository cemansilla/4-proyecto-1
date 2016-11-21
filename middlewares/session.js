// Dado que este es el punto de entrada a /app, uso este middleware para consultar la info del usuario que enviaré a todas las vistas que pasaron por acá
var User = require("../models/user").User; 

module.exports = function(req, res, next){
    if(!req.session.user_id){
        res.redirect("/login")
    }else{
        User.findById(req.session.user_id, (err, user) => {
            if(err){
                console.log(err);
                res.redirect("/login");
            }else{
                res.locals = { user: user }; // Hace merge con la info de cada vista, se stackea
                next();
            }
        });
    }
}