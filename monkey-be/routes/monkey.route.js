const express = require("express");
const router = express.Router();

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
  const { students } = req.body;

  res.setHeader("Content-Type", "application/zip");

  res.setHeader("Content-Disposition", 'attachment; filename="videos.zip"');

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(res);

  const downloads = students.map(async (student) => {
    if (!student.video) return null;

    const response = await axios.get(student.video, {
      responseType: "stream",
    });

    return {
      stream: response.data,
      name: `${student.student_name}.mp4`,
    };
  });

  const files = await Promise.all(downloads);

  files.filter(Boolean).forEach((file) => {
    archive.append(file.stream, {
      name: file.name,
    });
  });

  await archive.finalize();
});

module.exports = router;
