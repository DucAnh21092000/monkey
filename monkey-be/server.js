require("dotenv").config();

const express = require("express");
const cors = require("cors");

const monkeyRoutes = require("./routes/monkey.route");
const videoRoutes = require("./routes/video.route");
const { app, server } = require("./chat-server");

app.use(cors());
app.use(express.json());

app.use("/api", monkeyRoutes);
app.use("/api/video", videoRoutes);

const PORT = Number(process.env.PORT) || 3000;

const startServer = (port) => {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use, trying ${nextPort}...`);
      startServer(nextPort);
    } else {
      throw error;
    }
  });

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer(PORT);
