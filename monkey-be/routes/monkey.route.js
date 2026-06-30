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

const { finished } = require("stream/promises");

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
        level: 0, // video không cần nén
      },
    });

    archive.pipe(res);

    archive.on("warning", console.warn);

    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.destroy(err);
    });

    archive.on("progress", (progress) => {
      console.log(progress);
    });

    archive.on("finish", () => {
      console.log("ARCHIVE FINISH");
    });

    archive.on("close", () => {
      console.log("ARCHIVE CLOSE");
    });

    res.on("finish", () => {
      console.log("RESPONSE FINISH");
    });

    const limit = pLimit(2);

    await Promise.all(
      students.map((student, index) =>
        limit(async () => {
          if (!student.video) return;

          const safeName = (student.student_name || "unknown")
            .replace(/[<>:"/\\|?*]/g, "_")
            .trim();

          try {
            const response = await axios({
              url: student.video,
              method: "GET",
              responseType: "stream",
              timeout: 0,
              maxRedirects: 5,
            });

            archive.append(response.data, {
              name: `${index + 1}-${safeName}.mp4`,
            });

            // đợi stream HTTP tải xong
            await finished(response.data);

            console.log(`✔ Finished ${safeName}`);
          } catch (err) {
            console.error(`${safeName}:`, err.message);
          }
        })
      )
    );

    console.log("All streams finished");

    await archive.finalize();

    console.log("ZIP finalized");
  } catch (err) {
    console.error(err);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
});
module.exports = router;
