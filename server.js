const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let waiting = null;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  socket.on('join', () => {
    if (waiting) {
      const partner = waiting;
      waiting = null;
      socket.partner = partner;
      partner.partner = socket;
      socket.emit('matched');
      partner.emit('matched');
    } else {
      waiting = socket;
    }
  });

  socket.on('offer', data => {
    if (socket.partner) socket.partner.emit('offer', data);
  });

  socket.on('answer', data => {
    if (socket.partner) socket.partner.emit('answer', data);
  });

  socket.on('ice-candidate', data => {
    if (socket.partner) socket.partner.emit('ice-candidate', data);
  });

  socket.on('chat-message', msg => {
    if (socket.partner) socket.partner.emit('chat-message', msg);
  });

  socket.on('disconnect', () => {
    if (waiting === socket) {
      waiting = null;
    }
    if (socket.partner) {
      socket.partner.emit('disconnect');
      socket.partner.partner = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
