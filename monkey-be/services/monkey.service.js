const axios = require("axios");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");
const pLimit = require("p-limit").default;

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
const IMAGE_BUFFER_CACHE = new Map();
const CACHE_LIMIT = 200;

function setCacheValue(cache, key, value) {
  if (cache.size >= CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, value);
}

/**
 * Crop vùng "Test result"
 * Layout dựa trên ảnh mẫu cậu gửi
 */
async function getImageBuffer(imageUrl) {
  if (IMAGE_BUFFER_CACHE.has(imageUrl)) {
    return IMAGE_BUFFER_CACHE.get(imageUrl);
  }

  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 10000,
    maxContentLength: 5 * 1024 * 1024,
  });

  const imageBuffer = Buffer.from(response.data);
  setCacheValue(IMAGE_BUFFER_CACHE, imageUrl, imageBuffer);

  return imageBuffer;
}

async function extractTestResult(imageUrl) {
  try {
    if (!imageUrl) return null;

    if (OCR_CACHE.has(imageUrl)) {
      return OCR_CACHE.get(imageUrl);
    }

    const imageBuffer = await getImageBuffer(imageUrl);

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
      psm: 3,
      oem: 1,
      logger: () => { },
    });

    const lower = text.toLowerCase();

    let result = null;

    if (lower.includes("very good")) {
      result = "Very good";
    } else if (lower.includes("good")) {
      result = "Good";
    } else if (lower.includes("excellen")) {
      result = "Excellent";
    } else if (lower.includes("improv")) {
      result = "Need improvement";
    }

    console.log(lower);
    setCacheValue(OCR_CACHE, imageUrl, result);

    return result;
  } catch (error) {
    console.error("OCR Error:", imageUrl, error.message);

    return null;
  }
}

async function getStatusList(school_id) {
  const { data } = await api.get("/student-evaluation/status-list", {
    params: {
      school_id: school_id,
      page: 1,
      limit: 1000,
    },
  });

  const records = data.data.data || [];

  const enrichedData = await Promise.all(
    records.map((item, index) =>
      limit(async () => {
        const testResult = await extractTestResult(item.image);

        return {
          ...item,
          test_result: testResult,
          stt: index + 1,
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

const getSchools = async () => {
  const { data } = await api.get("https://web.monkeyenglish.net/classroom_go/api/v2/auth/get-meta-info");

  // sửa lại field theo response thực tế
  return data?.data?.schools || [];
};


module.exports = {
  getStatusList,
  getFilters,
  getSchools
};
