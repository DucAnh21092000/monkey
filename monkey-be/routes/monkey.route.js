const express = require("express");
const router = express.Router();

const {
    getStatusList,
    getFilters,
    getSchools,
} = require("../services/monkey.service");


router.get("/status-list", async (req, res) => {
   
    const { school_id, page, pageSize } = req.query;
    try {
        const data = await getStatusList(school_id, page, pageSize);

        res.json(data);
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
});

router.get("/filters", async (req, res) => {
    try {
        const data = await getFilters();

        res.json(data);
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
});

router.get("/school-list", async (req, res) => {
    console.log("Received request for school list");
    try {
        const schools = await getSchools();

        res.json({
            success: true,
            data: schools,
        });
    } catch (error) {
        console.error("Get schools error:", error);

        res.status(500).json({
            success: false,
            message: error.response?.data || error.message,
        });
    }
});

module.exports = router;