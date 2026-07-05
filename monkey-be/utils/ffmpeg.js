const { spawn } = require("child_process");

function runFFmpeg(args, onProgress) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args);

    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      const msg = data.toString();

      stderr += msg;

      console.log(msg); // <-- log toàn bộ ffmpeg

      const timeMatch = msg.match(/time=(\d+:\d+:\d+\.\d+)/);

      if (timeMatch && onProgress) {
        onProgress(timeMatch[1]);
      }
    });

    ffmpeg.on("error", reject);

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(stderr));
      }

      resolve(true);
    });
  });
}

module.exports = { runFFmpeg };
