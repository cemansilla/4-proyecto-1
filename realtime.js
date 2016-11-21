module.exports = (server, sessionMiddleware) => {
    var io = require("socket.io")(server);
    
    var redis = require("redis");
    var client = redis.createClient();

    client.subscribe("images");

    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res, next);
    });

    client.on("message", (channel, message) => {
        console.log("Recibimos un mensaje del canal " + channel);
        
        // Valido para trabajar sobre el canal que me interesa
        // Puedo estar subscripto a varios
        if(channel == "images"){
            // Envio a los clientes conectados
            io.emit("new image", message);
        }
    });

    io.sockets.on("connection", (socket) => {
        console.log(socket.request.session.user_id);
    });
}