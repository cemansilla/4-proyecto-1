// Conecta al socket a través de la librería que se carga en el layout
var socket = io();

// Listener de un mensaje
socket.on("new image", (data) => {
    data = JSON.parse(data);

    console.log("data en el cliente");
    console.log(data);

    var container = document.querySelector("#imagenes");

    // Obtengo el template
    var source = document.querySelector("#image-template").innerHTML;

    var template = Handlebars.compile(source);

    container.innerHTML = template(data) + container.innerHTML;
});