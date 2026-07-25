const express = require("express");
const router = express.Router();
const controller = require("../controllers/video.controller");
console.log(
  "video.controller exports:",
  Object.keys(controller || {}),
  "types:",
  typeof controller.download,
  typeof controller.rotate,
  typeof controller.progress,
);

router.post("/download", controller.download);
router.post("/rotate", controller.rotate);
router.get("/progress/:id", controller.progress);
router.get("/download/:id", controller.downloadFile);
router.get("/rotate/download/:id", controller.downloadRotateFile);

module.exports = router;
