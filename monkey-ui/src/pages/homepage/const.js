// deploy in render
//export const baseUrl = "https://monkey-1gz4.onrender.com";
// deploy in local
export const baseUrl = "http://localhost:3000";

export const SCHOOL_CACHE_KEY = "monkey-school-list-cache";
export const SCHOOL_RECENT_KEY = "monkey-school-recent-cache";
export const SCHOOL_CACHE_TTL = 1000 * 60 * 60 * 24 * 7;

export const resultMap = {
  1: {
    label: "Cần cải thiện - Need Improvement",
    color: "error",
  },
  2: {
    label: "Đạt - Good",
    color: "processing",
  },
  3: {
    label: "Rất tốt - Very Good",
    color: "success",
  },
  4: {
    label: "Vượt trội - Excellent",
    color: "gold",
  },
};

export const verdictColors = {
  1: "#CBD5E1", // Need Improvement
  2: "#FCD34D", // Good
  3: "#4ADE80", // Very Good
  4: "#16A34A", // Excellent
};
