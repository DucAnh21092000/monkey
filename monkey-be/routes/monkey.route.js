const express = require("express");
const router = express.Router();
const pLimit = require("p-limit");
const axios = require("axios");
const fs = require("fs")
const archiver = require("archiver");

// create a file to stream archive data to.
const output = fs.createWriteStream(__dirname + "/example.zip");
const archive = archiver("zip", {
  zlib: { level: 0 }, // Sets the compression level.
});
const limit = pLimit(5);
const {
  getStatusList,
  getFilters,
  getSchools,
} = require("../services/monkey.service");

router.get("/status-list", async (req, res) => {
  const { school_id, page, pageSize } = req.query;
  try {
    const data = await getStatusList(school_id, page, pageSize);
    console.log("data", data);
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/filters", async (req, res) => {
  try {
    const data = await getFilters();

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

router.get("/school-list", async (req, res) => {
  try {
    const schools = await getSchools();

    res.json({
      success: true,
      data: schools,
    });
  } catch (error) {
    console.error("Get schools error:", error);

    res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
});

router.post("/export-videos", async (req, res) => {
  try {
    const { students = [] } = req.body;

    if (!students.length) {
      return res.status(400).json({
        success: false,
        message: "Không có học sinh nào được chọn",
      });
    }

    req.setTimeout(0);
    res.setTimeout(0);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="videos-${Date.now()}.zip"`
    );

    const archive = archiver("zip", {
      forceZip64: true,
      zlib: {
        level: 0,
      },
    });

    archive.pipe(res);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      try {
        if (!student?.video) continue;

        const response = await axios.get(student.video, {
          responseType: "arraybuffer",
          timeout: 0,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        const safeName = (student.student_name || "unknown")
          .replace(/[<>:"/\\|?*]/g, "_")
          .trim();

        archive.append(Buffer.from(response.data), {
          name: `${i + 1}-${safeName}.mp4`,
        });

      } catch (err) {
        console.error(
          `Cannot download video of ${student.student_name}:`,
          err.message
        );
      }
    }

    await archive.finalize();

  } catch (error) {
    console.error("Export videos error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
});
module.exports = router;
