const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Get Inventory Predictions (Available to Admin only)
router.get('/predict', auth(['Admin', 'Super Admin']), async (req, res) => {
    try {
        const days = req.query.days || 7;

        // Log analytics access
        await logAction({
            userId: req.user.id,
            action: 'VIEW_PREDICTIONS',
            details: { days, timestamp: new Date().toISOString() },
            ipAddress: req.ip
        });

        const response = await axios.get(`${PYTHON_SERVICE_URL}/predict?days=${days}`).catch(() => null);
        
        if (response && response.data) {
            return res.json(response.data);
        }

        // --- SMART FALLBACK: Calculate basic burn rate if ML service is offline ---
        const { poolPromise } = require('../config/db');
        const pool = await poolPromise;
        
        // Calculate days remaining based on Current Stock / Average daily usage from pending orders
        const fallbackResult = await pool.request().query(`
            SELECT 
                rm.Name as material,
                rm.CurrentStock,
                COALESCE(SUM(o.Quantity * p.MaterialQuantityPerUnit), 0) as total_required,
                CASE 
                    WHEN COALESCE(SUM(o.Quantity * p.MaterialQuantityPerUnit), 0) = 0 THEN 99
                    ELSE CAST((rm.CurrentStock / NULLIF(SUM(o.Quantity * p.MaterialQuantityPerUnit) / 30.0, 0)) AS INT)
                END as days_remaining
            FROM RawMaterials rm
            LEFT JOIN ProductMaterials pm ON rm.MaterialID = pm.MaterialID
            LEFT JOIN Products p ON pm.ProductID = p.ProductID
            LEFT JOIN Orders o ON p.ProductID = o.ProductID AND o.Status NOT IN ('Completed', 'Cancelled')
            GROUP BY rm.Name, rm.CurrentStock
        `);

        res.json(fallbackResult.recordset);
    } catch (err) {
        console.error('Predictions error:', err);
        res.status(500).json({ error: 'Failed to generate inventory forecast' });
    }
});

// Get Production Summary for Analytics (Available to Admin/Super Admin)
router.get('/production-summary', auth(['Admin', 'Super Admin']), async (req, res) => {
    try {
        const { poolPromise, sql } = require('../config/db');
        const pool = await poolPromise;

        // Log analytics access
        await logAction({
            userId: req.user.id,
            action: 'VIEW_PRODUCTION_SUMMARY',
            details: { timestamp: new Date().toISOString() },
            ipAddress: req.ip
        });

        // 1. Weekly Production Output (Last 7 days - ensuring all days are present)
        const weeklyResult = await pool.request().query(`
            WITH Last7Days AS (
                SELECT CAST(DATEADD(day, -6, GETUTCDATE()) AS DATE) as date
                UNION ALL
                SELECT DATEADD(day, 1, date)
                FROM Last7Days
                WHERE date < CAST(GETUTCDATE() AS DATE)
            )
            SELECT 
                d.date, 
                COALESCE(SUM(pl.QuantityProduced), 0) as total
            FROM Last7Days d
            LEFT JOIN ProductionLogs pl ON CAST(pl.LogDate AS DATE) = d.date
            GROUP BY d.date
            ORDER BY d.date ASC
        `);

        // 2. Worker Productivity (Total products logged per worker)
        const workerResult = await pool.request().query(`
            SELECT TOP 5
                u.Username, 
                SUM(pl.QuantityProduced) as totalQuantity,
                COUNT(pl.LogID) as logCount
            FROM ProductionLogs pl
            JOIN Users u ON pl.WorkerID = u.UserID
            GROUP BY u.Username
            ORDER BY totalQuantity DESC
        `);

        // 3. Overall Dashboard KPIs
        const statsResult = await pool.request().query(`
            SELECT 
                -- Active Orders Count
                (SELECT COUNT(*) FROM Orders WHERE Status NOT IN ('Completed', 'Cancelled')) as activeOrders,
                
                -- Factory Efficiency (Produced / Total ordered for all active manufacturing)
                (SELECT 
                    CASE 
                        WHEN SUM(o.Quantity) = 0 THEN 0
                        ELSE CAST(ROUND((SUM(CAST(COALESCE(pl.TotalProduced, 0) AS FLOAT)) / SUM(o.Quantity)) * 100, 0) AS INT)
                    END
                FROM Orders o
                LEFT JOIN (
                    SELECT OrderID, SUM(QuantityProduced) as TotalProduced 
                    FROM ProductionLogs GROUP BY OrderID
                ) pl ON o.OrderID = pl.OrderID
                WHERE o.Status = 'Manufacturing') as efficiency,

                -- Weekly Growth (% change in output vs previous week)
                (SELECT 
                    CASE 
                        WHEN prev.total = 0 THEN 0
                        ELSE CAST(ROUND(((curr.total - prev.total) / CAST(prev.total AS FLOAT)) * 100, 0) AS INT)
                    END
                FROM (
                    SELECT COALESCE(SUM(QuantityProduced), 0) as total 
                    FROM ProductionLogs 
                    WHERE LogDate >= DATEADD(day, -7, GETUTCDATE())
                ) curr,
                (
                    SELECT COALESCE(SUM(QuantityProduced), 0) as total 
                    FROM ProductionLogs 
                    WHERE LogDate >= DATEADD(day, -14, GETUTCDATE()) AND LogDate < DATEADD(day, -7, GETUTCDATE())
                ) prev) as growth,

                -- Critical Alerts (Low stock and Overdue orders)
                ((SELECT COUNT(*) FROM RawMaterials WHERE CurrentStock < 10) + 
                 (SELECT COUNT(*) FROM Orders WHERE Status = 'Pending' AND OrderDate < DATEADD(day, -3, GETUTCDATE()))) as alerts
        `);

        res.json({
            weeklyProduction: weeklyResult.recordset,
            workerPerformance: workerResult.recordset,
            stats: statsResult.recordset[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
