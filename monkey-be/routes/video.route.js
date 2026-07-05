const express = require("express");
const router = express.Router();
const controller = require("../controllers/video.controller");

router.post("/download", controller.download);
router.get("/progress/:id", controller.progress);

module.exports = router;
