const path = require("path");
const fs = require("fs");

const { createTempFile } = require("../utils/file");
const { runFFmpeg } = require("../utils/ffmpeg");
const progress = require("./progress.service");

exports.processVideo = async (id, inputPath) => {
  const output = createTempFile();

  progress.update(id, 5);

  await runFFmpeg(
    ["-i", inputPath, "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", output],
    (time) => {
      progress.update(id, 50);
    },
  );

  progress.finish(id);

  return output;
};
