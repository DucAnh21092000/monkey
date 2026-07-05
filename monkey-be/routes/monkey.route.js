const express = require("express");
const router = express.Router();
const pLimit = require("p-limit");
const axios = require("axios");
const fs = require("fs");
const archiver = require("archiver");
const EXPORT_DIR = "/tmp/exports";
const exportJobs = {};
const path = require("path");
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}
const { randomUUID } = require("crypto");

router.get("/test", (req, res) => {
  console.log("object");
  res.json("OK");
});
// create a file to stream archive data to.
const output = fs.createWriteStream(__dirname + "/example.zip");
const archive = archiver("zip", {
  zlib: { level: 0 }, // Sets the compression level.
});
const limit = pLimit(5);
const { getStatusList, getFilters, getSchools } = require("../services/monkey.service");

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

router.get("/download-file/:id", (req, res) => {
  const filePath = path.join(__dirname, "../temp", `${req.params.id}.mp4`);

  res.download(filePath);
});

router.get("/download/:file", (req, res) => {
  const filePath = path.join(EXPORT_DIR, req.params.file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "File không tồn tại",
    });
  }

  res.download(filePath, req.params.file, (err) => {
    if (err) {
      console.log(err);
      return;
    }

    fs.unlink(filePath, () => {});
  });
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
  const jobId = randomUUID();

  exportJobs[jobId] = {
    status: "processing",
    current: 0,
    total: req.body.students?.length || 0,
    percent: 0,
    url: "",
    error: "",
  };

  res.json({
    success: true,
    jobId,
  });

  exportZip(jobId, req.body).catch((err) => {
    console.error(err);

    exportJobs[jobId].status = "failed";
    exportJobs[jobId].error = err.message;
  });
});

async function exportZip(jobId, body) {
  const { students = [], fileName } = body;

  const filePath = path.join(EXPORT_DIR, fileName);

  const output = fs.createWriteStream(filePath);

  const archive = archiver("zip", {
    forceZip64: true,
    zlib: {
      level: 0,
    },
  });

  archive.pipe(output);

  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    if (!student.video) continue;

    const safeName = (student.student_name || "unknown").replace(/[<>:"/\\|?*]/g, "_").trim();

    try {
      const response = await axios({
        method: "GET",
        url: student.video,
        responseType: "stream",
        timeout: 0,
      });

      archive.append(response.data, {
        name: `${i + 1}-${safeName}.mp4`,
      });

      await new Promise((resolve, reject) => {
        response.data.on("end", resolve);
        response.data.on("error", reject);
      });

      exportJobs[jobId].current++;

      exportJobs[jobId].percent = Math.round(
        (exportJobs[jobId].current / exportJobs[jobId].total) * 100,
      );

      console.log(`${exportJobs[jobId].current}/${exportJobs[jobId].total}`);
    } catch (err) {
      console.log(err.message);
    }
  }

  await archive.finalize();

  await new Promise((resolve) => {
    output.on("close", resolve);
  });

  exportJobs[jobId].status = "done";
  exportJobs[jobId].url = `/download/${fileName}`;

  console.log("DONE");
}

router.get("/export-progress/:jobId", (req, res) => {
  const job = exportJobs[req.params.jobId];

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job không tồn tại",
    });
  }

  res.json(job);
});

module.exports = router;
