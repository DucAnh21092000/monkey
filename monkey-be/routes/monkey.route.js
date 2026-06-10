const express = require("express");
const router = express.Router();

const {
    getStatusList,
    getFilters,
} = require("../services/monkey.service");

router.get("/status-list", async (req, res) => {
    try {
        const data = await getStatusList();

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

module.exports = router;