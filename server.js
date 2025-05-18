const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let waiting = null;

// Serve the public directory as static
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
