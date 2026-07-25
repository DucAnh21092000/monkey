const express = require("express");
const router = express.Router();
const controller = require("../controllers/video.controller");

router.post("/download", controller.download);
router.post("/rotate", controller.rotate);
router.get("/progress/:id", controller.progress);
router.get("/download/:id", controller.downloadFile);
router.get("/rotate/download/:id", controller.downloadRotateFile);

module.exports = router;
