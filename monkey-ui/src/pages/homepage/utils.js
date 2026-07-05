import { SCHOOL_CACHE_KEY, SCHOOL_CACHE_TTL, SCHOOL_RECENT_KEY } from "./const";

export function getCachedSchools() {
    try {
        const cached = localStorage.getItem(SCHOOL_CACHE_KEY);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        if (!parsed?.data || Date.now() - parsed.timestamp > SCHOOL_CACHE_TTL) {
            localStorage.removeItem(SCHOOL_CACHE_KEY);
            return null;
        }

        return parsed.data;
    } catch {
        return null;
    }
}

export function setCachedSchools(data) {
    try {
        localStorage.setItem(
            SCHOOL_CACHE_KEY,
            JSON.stringify({
                data,
                timestamp: Date.now(),
            }),
        );
    } catch {
        // ignore storage errors
    }
}

export function getRecentSchoolIds() {
    try {
        const cached = localStorage.getItem(SCHOOL_RECENT_KEY);
        if (!cached) return [];
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function setRecentSchoolIds(ids) {
    try {
        localStorage.setItem(SCHOOL_RECENT_KEY, JSON.stringify(ids));
    } catch {
        // ignore storage errors
    }
}

export function sortSchoolsByRecent(schools, recentIds = []) {
    const recentSet = new Set(recentIds);

    return [...schools].sort((a, b) => {
        const aRecent = recentSet.has(a.value) ? 1 : 0;
        const bRecent = recentSet.has(b.value) ? 1 : 0;

        if (aRecent !== bRecent) return bRecent - aRecent;
        return (a.label || "").localeCompare(b.label || "");
    });
}
