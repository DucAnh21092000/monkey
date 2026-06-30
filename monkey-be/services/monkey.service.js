const axios = require("axios");
const sharp = require("sharp");
const Tesseract = require("tesseract.js");
const pLimit = require("p-limit");
const { createWorker, createScheduler } = require('tesseract.js');
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




function checkTestResultClean(ocrText) {
  if (!ocrText) return "";

  // 1. Làm sạch text: chuyển chữ thường, chuẩn hóa khoảng trắng
  const cleanText = ocrText.toLowerCase().replace(/\s+/g, ' ');

  // 2. Regex bóc tách phần kết quả đứng sau cụm "kết quả bài test / test result"
  // Chấp nhận các lỗi quét chữ l/t/1 như: test result, test resuttr, test resu1t...
  const regex = /(?:kết\s*quả\s*bài\s*test\s*[\/\-]?\s*test\s*resu[lt1]t)[:\s-]*(.*)/i;
  const match = cleanText.match(regex);

  if (match && match[1]) {
    const resultPart = match[1].trim();

    // KIỂM TRA TRẠNG THÁI 1: Vượt trội - Excellent
    if (resultPart.includes("vượt trội") || resultPart.includes("excellent")) {
      return "Vượt trội - Excellent";
    }

    // KIỂM TRA TRẠNG THÁI 2: Rất tốt - Very good
    if (resultPart.includes("rất tốt") || resultPart.includes("very good")) {
      return "Rất tốt - Very good";
    }

    // KIỂM TRA TRẠNG THÁI 3: Cần cải thiện - Need Improvement
    if (resultPart.includes("cần cải thiện") || resultPart.includes("need improvement")) {
      return "Cần cải thiện - Need Improvement";
    }

    // KIỂM TRA TRẠNG THÁI 4: Đạt - Good
    // Loại trừ trường hợp chứa "very good" vì "very good" cũng có chữ "good"
    if (resultPart.includes("đạt") || (resultPart.includes("good") && !resultPart.includes("very good"))) {
      return "Đạt - Good";
    }
  }

  // 3. Phương án dự phòng: Nếu OCR quét thiếu cụm tiêu đề "Kết quả bài test" ở trước
  if (cleanText.includes("vượt trội") || cleanText.includes("excellent")) {
    return "Vượt trội - Excellent";
  }
  if (cleanText.includes("rất tốt") || cleanText.includes("very good")) {
    return "Rất tốt - Very good";
  }
  if (cleanText.includes("cần cải thiện") || cleanText.includes("need improvement")) {
    return "Cần cải thiện - Need Improvement";
  }
  if (cleanText.includes("đạt") || (cleanText.includes("good") && !cleanText.includes("very good"))) {
    return "Đạt - Good";
  }

  return ""; // Không khớp bất kỳ trạng thái nào
}

async function extractTestResult(imageUrl, scheduler) {
  try {
    if (!imageUrl) return null;

    if (OCR_CACHE.has(imageUrl)) {
      return OCR_CACHE.get(imageUrl);
    }

    let result = "";

    // Sử dụng scheduler.add thay vì worker.recognize
    const ret = await scheduler.addJob('recognize', imageUrl);
    const text = ret.data.text;
    result = checkTestResultClean(text);
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

  const records = data?.data?.data || [];

  // 1. Khởi tạo Scheduler và các Workers chạy song song
  const scheduler = createScheduler();

  // Tạo số lượng worker tùy thuộc vào cấu hình (Ví dụ: 4 workers chạy cùng lúc)
  const CONCURRENT_WORKERS = 4;
  for (let i = 0; i < CONCURRENT_WORKERS; i++) {
    const worker = await createWorker('vie');
    scheduler.addWorker(worker);
  }

  // 2. Chạy Promise.all thực sự song song nhờ Scheduler phân phối
  const newData = await Promise.all(
    records.map(async (item) => {
      let testResultText = "";

      if (item.image) {
        // Truyền scheduler vào thay vì worker
        testResultText = await extractTestResult(item.image, scheduler);
      }

      return {
        ...item,
        test_result: testResultText
      };
    })
  );

  // 3. Dọn dẹp scheduler (Nó sẽ tự terminate tất cả worker đã add vào)
  await scheduler.terminate();

  data.data.data = newData;
  return data;
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
