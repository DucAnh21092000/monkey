const express = require("express");
const router = express.Router();
const fs = require("fs");
const archiver = require("archiver");

// create a file to stream archive data to.
const output = fs.createWriteStream(__dirname + "/example.zip");
const archive = archiver("zip", {
  zlib: { level: 9 }, // Sets the compression level.
});

const {
  getStatusList,
  getFilters,
  getSchools,
} = require("../services/monkey.service");

router.get("/status-list", async (req, res) => {
  const { school_id, page, pageSize } = req.query;
  try {
    const data = await getStatusList(school_id, page, pageSize);

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
    const { students } = req.body;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="videos.zip"');

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.pipe(res);

    for (const student of students) {
      if (!student.video) continue;

      try {
        const response = await axios.get(student.video, {
          responseType: "stream",
        });

        archive.append(response.data, {
          name: `${student.student_name}.mp4`,
        });
      } catch (err) {
        console.error(err);
      }
    }

    await archive.finalize();

    console.log("ZIP generated");
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;
