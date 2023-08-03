const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const activeUsers = new Map();

io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('join', (username) => {
        socket.username = username;
        activeUsers.set(socket.id, username);
        io.emit('activeUsers', Array.from(activeUsers.values()));
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            activeUsers.delete(socket.id);
            io.emit('activeUsers', Array.from(activeUsers.values()));
        }
    });

    socket.on('sendMessage', (data) => {
        if (socket.username && data.recipient) {
            const recipientMessage = `[From ${socket.username}]: ${data.message}`;

            const recipientSocketId = getKeyByValue(activeUsers, data.recipient);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('chatMessage', {
                    message: recipientMessage,
                });
            }
        }
    });
});

function getKeyByValue(map, value) {
    for (let [key, val] of map.entries()) {
        if (val === value) {
            return key;
        }
    }
    return null;
}

const PORT = 3000;

// Serve the index.html file from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
