const axios = require("axios");

const api = axios.create({
    baseURL: "https://web.monkeyenglish.net/classroom_go/api/v1",
    headers: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDY2Nzg3LCJuYW1lIjoidmFuaGFuaCBraW5keSIsImF2YXRhciI6IiIsImVtYWlsIjoidmFuaGFuaC5raW5keUBtb25rZXkuZWR1LnZuIiwicGhvbmUiOiIiLCJyb2xlcyI6WyJBZG1pbl9DbGFzcyJdLCJyb2xlX25hbWUiOnsiQWRtaW5fQ2xhc3MiOiJBZG1pbl9DbGFzcyJ9LCJyb2xlX3ByaW9yaXR5IjoiQWRtaW5fQ2xhc3MiLCJpc3MiOiJta19jbGFzc19nbyIsInN1YiI6IjQ2Njc4NyIsImF1ZCI6WyJtay1jbGFzcy1nby1jbGllbnQiXSwiZXhwIjoxNzgzNDUzMDIyLCJuYmYiOjE3ODA4NjEwMjIsImlhdCI6MTc4MDg2MTAyMiwianRpIjoiMzMyNjM0ODg2MjYzNjAzMyJ9.vIw5qjb6rgi-FOh5YiuxFm7vZ0EKQ1Qfxy_Slwo890Q",
        Origin: "https://class.monkey.edu.vn",
        Referer: "https://class.monkey.edu.vn/",
    },
});

async function getStatusList() {
    const { data } = await api.get(
        "/student-evaluation/status-list",
        {
            params: {
                school_id: 540,
                page: 1,
                limit: 100,
            },
        }
    );

    return data;
}

async function getFilters() {
    const { data } = await api.get(
        "/student-evaluation/filters",
        {
            params: {
                school_id: 496,
            },
        }
    );

    return data;
}

module.exports = {
    getStatusList,
    getFilters,
};