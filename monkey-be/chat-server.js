const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const roomMessages = new Map();

io.on('connection', (socket) => {
  socket.on('join', ({ room, username }) => {
    const cleanRoom = String(room || 'default-room').trim();
    const cleanName = String(username || 'User').trim() || 'User';

    socket.join(cleanRoom);
    socket.data.room = cleanRoom;
    socket.data.username = cleanName;

    socket.emit('history', roomMessages.get(cleanRoom) || []);

    socket.to(cleanRoom).emit('system_message', {
      text: `${cleanName} vừa tham gia phòng`,
      createdAt: new Date().toISOString(),
    });

    const members = io.sockets.adapter.rooms.get(cleanRoom);
    io.to(cleanRoom).emit('room_users', {
      room: cleanRoom,
      count: members ? members.size : 0,
    });
  });

  socket.on('send_message', ({ room, username, text }) => {
    const cleanRoom = String(room || 'default-room').trim();
    const cleanName = String(username || socket.data.username || 'User').trim() || 'User';
    const cleanText = String(text || '').trim();

    if (!cleanText) return;

    const payload = {
      username: cleanName,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    const history = roomMessages.get(cleanRoom) || [];
    history.push(payload);
    if (history.length > 100) history.shift();
    roomMessages.set(cleanRoom, history);

    io.to(cleanRoom).emit('new_message', payload);
  });

  socket.on('disconnect', () => {
    const room = socket.data.room;
    if (!room) return;

    const members = io.sockets.adapter.rooms.get(room);
    if (members && members.size > 0) {
      io.to(room).emit('room_users', {
        room,
        count: members.size,
      });
    } else {
      roomMessages.delete(room);
    }
  });
});

module.exports = { app, server, io };
