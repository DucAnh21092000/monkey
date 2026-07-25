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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
