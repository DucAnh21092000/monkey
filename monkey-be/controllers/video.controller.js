const progress = require("../services/progress.service");
const downloadService = require("../services/download.service");
const crypto = require("crypto");
const path = require("path");

const { spawn } = require("child_process");
const fs = require("fs");
const { randomUUID } = require("crypto");

function downloadYoutube(url) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const output = path.join(tempDir, `${randomUUID()}.mp4`);

    const yt = spawn("yt-dlp", [
      "-f",
      "bestvideo+bestaudio/best",
      "--merge-output-format",
      "mp4",
      "-o",
      output,
      url,
    ]);

    let stderr = "";

    yt.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    yt.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log(data.toString());
    });

    yt.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr));
      }

      resolve(output);
    });

    yt.on("error", reject);
  });
}

const download = async (req, res) => {
  console.log("HIT DOWNLOAD");

  try {
    const { url } = req.body;

    console.log("Start download...");

    const file = await downloadYoutube(url);

    console.log("Download finished:", file);

    res.download(file, (err) => {
      console.log("Download callback:", err);

      fs.unlink(file, () => {});
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const progressService = require("../services/progress.service");

const progressFun = (req, res) => {
  const { id } = req.params;

  const job = progressService.get(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  return res.json({
    success: true,
    data: job,
  });
};

module.exports = {
  download,
  progress: progressFun,
};
