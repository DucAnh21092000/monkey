const progress = require("../services/progress.service");
const downloadService = require("../services/download.service");
const crypto = require("crypto");
const path = require("path");

const { spawn } = require("child_process");
const fs = require("fs");
const { randomUUID } = require("crypto");
const path = require("path");

const ytDlpPath = path.join(process.cwd(), "bin", "yt-dlp");

function downloadYoutube(url) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const output = path.join(tempDir, "video");

    const yt = spawn(ytDlpPath, [
      "-f",
      "bestvideo+bestaudio/best",
      "--merge-output-format",
      "mp4",
      "--print",
      "after_move:filepath",
      "-o",
      output,
      url,
    ]);

    let stderr = "";
    let finalPath = "";

    yt.stdout.on("data", (data) => {
      const text = data.toString();

      console.log(text);

      finalPath += text;
    });

    yt.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log(data.toString());
    });

    yt.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr));
      }

      resolve(finalPath.trim());
    });

    yt.on("error", reject);
  });
}

function convertToPremiere(input) {
  return new Promise((resolve, reject) => {
    const output = input.replace(/\.mp4$/i, "_premiere.mp4");

    const ffmpeg = spawn("ffmpeg", [
      "-y",

      "-i",
      input,

      // Video
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-profile:v",
      "high",
      "-level",
      "4.1",

      // Audio
      "-c:a",
      "aac",
      "-profile:a",
      "aac_low",
      "-b:a",
      "192k",
      "-ar",
      "48000",
      "-ac",
      "2",

      // Tối ưu MP4
      "-movflags",
      "+faststart",

      output,
    ]);

    let stderr = "";

    ffmpeg.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr));
      }

      resolve(output);
    });

    ffmpeg.on("error", reject);
  });
}

const download = async (req, res) => {
  const { url } = req.body;

  const jobId = randomUUID();

  progressService.set(jobId, {
    status: "waiting",
    progress: 0,
    fileName: "",
    filePath: "",
    originalFile: "",
  });

  res.json({
    success: true,
    jobId,
  });

  (async () => {
    try {
      progressService.update(jobId, {
        status: "downloading",
        progress: 20,
      });

      const downloadedFile = await downloadYoutube(url);

      progressService.update(jobId, {
        status: "converting",
        progress: 80,
      });

      const premiereFile = await convertToPremiere(downloadedFile);

      progressService.update(jobId, {
        status: "done",
        progress: 100,
        fileName: path.basename(downloadedFile),
        filePath: premiereFile,
        originalFile: downloadedFile,
      });
    } catch (err) {
      progressService.update(jobId, {
        status: "error",
        error: err.message,
      });
    }
  })();
};

const progressService = require("../services/progress.service");

const progressFun = (req, res) => {
  const job = progressService.get(req.params.id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  res.json({
    success: true,
    data: {
      status: job.status,
      progress: job.progress,
      fileName: job.fileName,
      ready: job.status === "done",
    },
  });
};

const downloadFile = (req, res) => {
  const job = progressService.get(req.params.id);

  if (!job) {
    return res.sendStatus(404);
  }

  if (job.status !== "done") {
    return res.status(400).json({
      success: false,
      message: "File not ready",
    });
  }

  res.download(job.filePath, job.fileName, (err) => {
    if (err) {
      console.error(err);
    }

    fs.unlink(job.filePath, () => {});
    fs.unlink(job.originalFile, () => {});

    progressService.delete(req.params.id);
  });
};

module.exports = {
  download,
  progress: progressFun,
  downloadFile,
};
