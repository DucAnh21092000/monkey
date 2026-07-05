require("dotenv").config();

const express = require("express");
const cors = require("cors");

const monkeyRoutes = require("./routes/monkey.route");
const videoRoutes = require("./routes/video.route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", monkeyRoutes);
app.use("/api/video", videoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
