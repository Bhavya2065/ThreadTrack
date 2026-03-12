const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/authMiddleware');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Get Inventory Predictions (Available to Admin only)
router.get('/predict', auth(['Admin']), async (req, res) => {
    try {
        const days = req.query.days || 7;
        const response = await axios.get(`${PYTHON_SERVICE_URL}/predict?days=${days}`);
        res.json(response.data);
    } catch (err) {

        res.status(502).json({ error: 'Predictive service is currently unavailable' });
    }
});

// Get Production Summary for Analytics (Available to Admin only)
router.get('/production-summary', auth(['Admin']), async (req, res) => {
    try {
        const { poolPromise, sql } = require('../config/db');
        const pool = await poolPromise;

        // 1. Weekly Production Output (Last 7 days)
        const weeklyResult = await pool.request().query(`
            SELECT 
                CAST(LogDate AS DATE) as date, 
                SUM(QuantityProduced) as total
            FROM ProductionLogs
            WHERE LogDate >= DATEADD(day, -7, GETUTCDATE())
            GROUP BY CAST(LogDate AS DATE)
            ORDER BY date ASC
        `);

        // 2. Worker Productivity (Total products logged per worker)
        const workerResult = await pool.request().query(`
            SELECT 
                u.Username, 
                SUM(pl.QuantityProduced) as totalQuantity,
                COUNT(pl.LogID) as logCount
            FROM ProductionLogs pl
            JOIN Users u ON pl.WorkerID = u.UserID
            GROUP BY u.Username
            ORDER BY totalQuantity DESC
        `);

        res.json({
            weeklyProduction: weeklyResult.recordset,
            workerPerformance: workerResult.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
