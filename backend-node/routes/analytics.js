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
            WITH RECURSIVE Last7Days AS (
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

        // 3. Overall Dashboard KPIs (with Historical Data for Trends)
        const statsResult = await pool.request().query(`
            SELECT 
                -- Active Orders & Trend
                (SELECT COUNT(*) FROM Orders WHERE Status NOT IN ('Completed', 'Cancelled')) as activeOrders,
                (SELECT COUNT(*) FROM Orders WHERE Status = 'Completed' AND CAST(CompletionDate AS DATE) = CAST(GETUTCDATE() AS DATE)) as completedToday,
                (SELECT 
                    CASE 
                        WHEN prev_active = 0 THEN 0
                        ELSE CAST(ROUND(((curr_active - prev_active) / CAST(prev_active AS FLOAT)) * 100, 1) AS FLOAT)
                    END
                FROM (
                    SELECT (SELECT COUNT(*) FROM Orders WHERE Status NOT IN ('Completed', 'Cancelled')) as curr_active,
                           (SELECT COUNT(*) FROM Orders WHERE OrderDate <= DATEADD(day, -7, GETUTCDATE()) AND (CompletionDate IS NULL OR CompletionDate > DATEADD(day, -7, GETUTCDATE())) AND Status != 'Cancelled') as prev_active
                ) as active_counts) as activeOrdersTrend,

                -- Factory Efficiency & Target
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
                90 as targetEfficiency,

                -- Weekly Production & Trend
                (SELECT COALESCE(SUM(QuantityProduced), 0) FROM ProductionLogs WHERE LogDate >= DATEADD(day, -7, GETUTCDATE())) as totalProduced,
                (SELECT COALESCE(SUM(QuantityProduced), 0) FROM ProductionLogs WHERE LogDate >= DATEADD(day, -14, GETUTCDATE()) AND LogDate < DATEADD(day, -7, GETUTCDATE())) as lastWeekProduced,
                (SELECT 
                    CASE 
                        WHEN prev = 0 THEN 0
                        ELSE CAST(ROUND(((curr - prev) / CAST(prev AS FLOAT)) * 100, 1) AS FLOAT)
                    END
                FROM (
                    SELECT (SELECT COALESCE(SUM(QuantityProduced), 0) FROM ProductionLogs WHERE LogDate >= DATEADD(day, -7, GETUTCDATE())) as curr,
                           (SELECT COALESCE(SUM(QuantityProduced), 0) FROM ProductionLogs WHERE LogDate >= DATEADD(day, -14, GETUTCDATE()) AND LogDate < DATEADD(day, -7, GETUTCDATE())) as prev
                ) as production_counts) as productionTrend,

                -- Critical Alerts
                (SELECT COUNT(*) FROM RawMaterials WHERE CurrentStock < 10) as lowStockCount,
                ((SELECT COUNT(*) FROM RawMaterials WHERE CurrentStock < 10) + 
                 (SELECT COUNT(*) FROM Orders WHERE Status = 'Pending' AND OrderDate < DATEADD(day, -3, GETUTCDATE()))) as alerts
        `);

        res.json({
            weeklyProduction: weeklyResult.recordset || [],
            workerPerformance: workerResult.recordset || [],
            stats: (statsResult.recordset && statsResult.recordset[0]) || {
                activeOrders: 0,
                completedToday: 0,
                activeOrdersTrend: 0,
                efficiency: 90,
                targetEfficiency: 90,
                totalProduced: 0,
                productionTrend: 0,
                lowStockCount: 0,
                alerts: 0
            }
        });
    } catch (err) {
        console.error('Analytics Production Summary Error:', err.message);
        res.json({
            weeklyProduction: [],
            workerPerformance: [],
            stats: {
                activeOrders: 0,
                completedToday: 0,
                activeOrdersTrend: 0,
                efficiency: 90,
                targetEfficiency: 90,
                totalProduced: 0,
                productionTrend: 0,
                lowStockCount: 0,
                alerts: 0
            }
        });
    }
});


module.exports = router;
