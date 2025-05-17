const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

let waiting = null;

io.on('connection', (socket) => {
  socket.on('join', () => {
    if (waiting) {
      socket.partner = waiting;
      waiting.partner = socket;
      waiting = null;
    } else {
      waiting = socket;
    }
  });

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    if (waiting === socket) {
      waiting = null;
    }
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit('message', 'Stranger disconnected.');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
