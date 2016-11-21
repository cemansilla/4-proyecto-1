var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Establezco conexión
// Uso localhost porque está en mi máquina
mongoose.connect("mongodb://localhost/fotos");

/*
// Tipos de datos para un documento
String
Number
Date
Buffer
Boolean
Mized
Objectid
Array
*/

// Defino el schema, sería la estructura de la tabla
// Colecciones => Tablas
// Documentos => Filas
// Un esquema corresponde a una colección y define la forma que van a tener los documentos

// Vamos a implementar validaciones
// Estas se hacen a nivel del modelo (schema)

// Defino algunos arrays / objetos con validaciones a usar en el schema
var sex_posibles_valores = ["M", "F"];
var email_match = [/^\w+([\.\+\-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/, "El email es incorrecto"];
var password_validation = {
    validator: function(pass){
        // Validamos que nuestro virtual sea igual al dato ingresado
        return this.password_confirmation == pass; // this hace referencia al documento que está tratando de guardarse
    },
    message: "Las contraseñas no son iguales"
};

var user_schema = new Schema({
    name: String,
    username: {
        type: String,
        required: true,
        maxlength: 50
    },
    password: {
        type: String,
        minlength: [3, "El password debe tener un mínimo de 3 caracteres"],
        validate: password_validation
    },
    age: {
        type: Number,
        min: [5, "La edad no puede ser menor que 5"], // Podemos definir mensajes de error
        max: 100
    },
    email: {
        type: String, 
        required: true, // En lugar de setear true, se puede definir un string, lo que hará eso es validar sobre requerido y en caso de error retornará dicho string
        match: email_match
    },
    date_of_birth: Date,
    sex: {
        type: String,
        enum: {
            values: sex_posibles_valores, // Rango de valores definidos en un arreglo
            message: "Opción no válida" // Esta es la forma de enviar mensajes ne validación de tipo enum
        } 
    }
});

// Los virtuals son propiedades que no existen en la DB y son calculadas dinamicamente
// Para esto se vale de setters y getters para preprocesar la info con nuestra lógica antes de obtenerla o insertarla
user_schema.virtual("password_confirmation").get(() => {
    return this.p_c;
}).set((password) => {
    this.p_c = password;
});

/*
Los modelos son instancias en Mongoose que permiten usar métodos para ejecutar acciones en la base de datos, sin necesidad de entender que es lo que pasa efectivamente en la DB
Toda la interacción con la base de datos se hace a través de modelos
*/
var User = mongoose.model("User", user_schema);

module.exports.User = User;