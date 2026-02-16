const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static("public"));

// Conexion a mongo local
mongoose.connect("mongodb://127.0.0.1:27017/chatroom")
    .then(() => console.log("Se conecto con Mongodb"))
    .catch(err => console.log("Error al conectar:", err.message));

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true }
});

const messageSchema = new mongoose.Schema({
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
    user: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Room = mongoose.model("Room", roomSchema);
const Message = mongoose.model("Message", messageSchema);

// socket.io
io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});


app.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear una sala nueva
app.post('/rooms', async (req, res) => {
    try {
        const newRoom = new Room({ name: req.body.name });
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/rooms/:id/messages', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).send("Sala no encontrada en la base de datos local");
        }

        const message = new Message({
    roomId: room._id,
    user: req.body.user,
    text: req.body.text
});

await message.save(); 
        await message.save();
        io.emit('new_message', message);

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: "Error al enviar mensaje. Revisa si el ID es válido." });
    }
});
app.get('/rooms/:id/messages', async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.id });
        res.json(messages); 
    } catch (error) {
        res.status(500).send("Error al obtener mensajes de la DB");
    }
});
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});