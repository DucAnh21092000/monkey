const crypto = require("crypto");
const os = require("os");
const path = require("path");

exports.createTempFile = () => {
  
  return path.join(os.tmpdir(), crypto.randomUUID() + ".mp4");
};
