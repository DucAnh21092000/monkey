const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();
const mongoose = require("mongoose");

const Message = require("./models/message.model");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

app.use(cors());
app.use(express.json());

const roomMessages = new Map(); // fallback in-memory cache when DB not configured

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected for chat storage"))
    .catch((err) => console.error("MongoDB connect error:", err));
} else {
  console.warn("MONGODB_URI not set - chat history will be stored in-memory only");
}

io.on("connection", (socket) => {
  socket.on("join", async ({ room, username }) => {
    const cleanRoom = String(room || "default-room").trim();
    const cleanName = String(username || "User").trim() || "User";

    socket.join(cleanRoom);
    socket.data.room = cleanRoom;
    socket.data.username = cleanName;

    // Try to load history from DB if connected, otherwise from in-memory cache
    try {
      if (mongoose.connection.readyState === 1) {
        const docs = await Message.find({ room: cleanRoom })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
        const history = docs.reverse().map((d) => ({
          username: d.username,
          text: d.text,
          createdAt: d.createdAt.toISOString(),
        }));
        socket.emit("history", history);
      } else {
        socket.emit("history", roomMessages.get(cleanRoom) || []);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
      socket.emit("history", roomMessages.get(cleanRoom) || []);
    }

    socket.to(cleanRoom).emit("system_message", {
      text: `${cleanName} vừa tham gia phòng`,
      createdAt: new Date().toISOString(),
    });

    const members = io.sockets.adapter.rooms.get(cleanRoom);
    io.to(cleanRoom).emit("room_users", {
      room: cleanRoom,
      count: members ? members.size : 0,
    });
  });

  socket.on("send_message", async ({ room, username, text }) => {
    const cleanRoom = String(room || "default-room").trim();
    const cleanName = String(username || socket.data.username || "User").trim() || "User";
    const cleanText = String(text || "").trim();

    if (!cleanText) return;

    const payload = {
      username: cleanName,
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    // update in-memory cache
    const history = roomMessages.get(cleanRoom) || [];
    history.push(payload);
    if (history.length > 100) history.shift();
    roomMessages.set(cleanRoom, history);

    // persist to DB when available
    if (mongoose.connection.readyState === 1) {
      try {
        await Message.create({
          room: cleanRoom,
          username: cleanName,
          text: cleanText,
          createdAt: payload.createdAt,
        });
      } catch (err) {
        console.error("Failed to save message to DB:", err);
      }
    }

    io.to(cleanRoom).emit("new_message", payload);
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;
    if (!room) return;

    const members = io.sockets.adapter.rooms.get(room);
    if (members && members.size > 0) {
      io.to(room).emit("room_users", {
        room,
        count: members.size,
      });
    }
  });
});

module.exports = { app, server, io };
