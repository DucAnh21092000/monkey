const axios = require("axios");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");
const pLimit = require("p-limit");

const limit = pLimit(3);

const api = axios.create({
  baseURL: "https://web.monkeyenglish.net/classroom_go/api/v1",
  headers: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDY2Nzg3LCJuYW1lIjoidmFuaGFuaCBraW5keSIsImF2YXRhciI6IiIsImVtYWlsIjoidmFuaGFuaC5raW5keUBtb25rZXkuZWR1LnZuIiwicGhvbmUiOiIiLCJyb2xlcyI6WyJBZG1pbl9DbGFzcyJdLCJyb2xlX25hbWUiOnsiQWRtaW5fQ2xhc3MiOiJBZG1pbl9DbGFzcyJ9LCJyb2xlX3ByaW9yaXR5IjoiQWRtaW5fQ2xhc3MiLCJpc3MiOiJta19jbGFzc19nbyIsInN1YiI6IjQ2Njc4NyIsImF1ZCI6WyJtay1jbGFzcy1nby1jbGllbnQiXSwiZXhwIjoxNzgzNDUzMDIyLCJuYmYiOjE3ODA4NjEwMjIsImlhdCI6MTc4MDg2MTAyMiwianRpIjoiMzMyNjM0ODg2MjYzNjAzMyJ9.vIw5qjb6rgi-FOh5YiuxFm7vZ0EKQ1Qfxy_Slwo890Q",
    Origin: "https://class.monkey.edu.vn",
    Referer: "https://class.monkey.edu.vn/",
  },
});

const OCR_CACHE = new Map();

/**
 * Crop vùng "Test result"
 * Layout dựa trên ảnh mẫu cậu gửi
 */
async function extractTestResult(imageUrl) {
  try {
    if (!imageUrl) return null;

    if (OCR_CACHE.has(imageUrl)) {
      return OCR_CACHE.get(imageUrl);
    }

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });

    const imageBuffer = Buffer.from(response.data);

    const metadata = await sharp(imageBuffer).metadata();

    const width = metadata.width;
    const height = metadata.height;

    /**
     * Ảnh mẫu:
     * Test result nằm khoảng 75~85% chiều cao ảnh
     */

    const cropBuffer = await sharp(imageBuffer)
      .extract({
        left: Math.floor(width * 0.45),
        top: Math.floor(height * 0.72),
        width: Math.floor(width * 0.45),
        height: Math.floor(height * 0.15),
      })
      .grayscale()
      .normalize()
      .png()
      .toBuffer();

    const {
      data: { text },
    } = await Tesseract.recognize(cropBuffer, "eng", {
      logger: () => {},
    });

    const lower = text.toLowerCase();

    let result = null;

    if (lower.includes("very good")) {
      result = "Very good";
    } else if (lower.includes("good")) {
      result = "Good";
    } else if (lower.includes("average")) {
      result = "Average";
    } else if (lower.includes("poor")) {
      result = "Poor";
    }

    OCR_CACHE.set(imageUrl, result);

    return result;
  } catch (error) {
    console.error("OCR Error:", imageUrl, error.message);

    return null;
  }
}

async function getStatusList() {
  const { data } = await api.get("/student-evaluation/status-list", {
    params: {
      school_id: 540,
      page: 1,
      limit: 100,
    },
  });

  const records = data.data || [];

  const enrichedData = await Promise.all(
    records.map((item) =>
      limit(async () => {
        const testResult = await extractTestResult(item.image);

        return {
          ...item,
          test_result: testResult,
        };
      }),
    ),
  );

  return {
    ...data,
    data: enrichedData,
  };
}

async function getFilters() {
  const { data } = await api.get("/student-evaluation/filters", {
    params: {
      school_id: 496,
    },
  });

  return data;
}

module.exports = {
  getStatusList,
  getFilters,
};
