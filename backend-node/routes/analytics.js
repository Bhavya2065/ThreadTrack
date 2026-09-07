const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');
const { query } = require('../config/db');

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
        // Calculate days remaining based on Current Stock / Average daily usage from pending orders
        const fallbackResult = await query(`
            SELECT
                rm.name AS material,
                rm.currentstock,
                COALESCE(SUM(o.quantity * p.materialquantityperunit), 0) AS total_required,
                CASE
                    WHEN COALESCE(SUM(o.quantity * p.materialquantityperunit), 0) = 0 THEN 99
                    ELSE CAST((rm.currentstock / NULLIF(SUM(o.quantity * p.materialquantityperunit) / 30.0, 0)) AS INT)
                END AS days_remaining
            FROM rawmaterials rm
            LEFT JOIN productmaterials pm ON rm.materialid = pm.materialid
            LEFT JOIN products p ON pm.productid = p.productid
            LEFT JOIN orders o ON p.productid = o.productid AND o.status NOT IN ('Completed', 'Cancelled')
            GROUP BY rm.name, rm.currentstock
        `);

        res.json(fallbackResult.rows);
    } catch (err) {
        console.error('Predictions error:', err);
        res.status(500).json({ error: 'Failed to generate inventory forecast' });
    }
});

// Get Production Summary for Analytics (Available to Admin/Super Admin)
router.get('/production-summary', auth(['Admin', 'Super Admin']), async (req, res) => {
    try {
        // Log analytics access
        await logAction({
            userId: req.user.id,
            action: 'VIEW_PRODUCTION_SUMMARY',
            details: { timestamp: new Date().toISOString() },
            ipAddress: req.ip
        });

        // 1. Weekly Production Output (Last 7 days - ensuring all days are present)
        const weeklyResult = await query(`
            SELECT
                d.date::date AS date,
                COALESCE(SUM(pl.quantityproduced), 0)::int AS total
            FROM generate_series(
                (CURRENT_DATE - INTERVAL '6 days')::date,
                CURRENT_DATE::date,
                '1 day'::interval
            ) AS d(date)
            LEFT JOIN productionlogs pl ON pl.logdate::date = d.date::date
            GROUP BY d.date
            ORDER BY d.date ASC
        `);

        // 2. Worker Productivity (Total products logged per worker)
        const workerResult = await query(`
            SELECT
                u.username AS "Username",
                SUM(pl.quantityproduced)::int AS "totalQuantity",
                COUNT(pl.logid)::int AS "logCount"
            FROM productionlogs pl
            JOIN users u ON pl.workerid = u.userid
            GROUP BY u.username
            ORDER BY SUM(pl.quantityproduced) DESC
            LIMIT 5
        `);

        // 3. Overall Dashboard KPIs (with Historical Data for Trends)
        const statsResult = await query(`
            SELECT
                -- Active Orders & Trend
                (SELECT COUNT(*)::int FROM orders WHERE status NOT IN ('Completed', 'Cancelled')) AS "activeOrders",
                (SELECT COUNT(*)::int FROM orders WHERE status = 'Completed' AND completiondate::date = CURRENT_DATE) AS "completedToday",
                (SELECT
                    CASE
                        WHEN prev_active = 0 THEN 0
                        ELSE ROUND((((curr_active - prev_active)::numeric / prev_active) * 100), 1)::float8
                    END
                FROM (
                    SELECT (SELECT COUNT(*)::int FROM orders WHERE status NOT IN ('Completed', 'Cancelled')) AS curr_active,
                           (SELECT COUNT(*)::int FROM orders WHERE orderdate <= (NOW() - INTERVAL '7 days') AND (completiondate IS NULL OR completiondate > (NOW() - INTERVAL '7 days')) AND status != 'Cancelled') AS prev_active
                ) AS active_counts) AS "activeOrdersTrend",

                -- Factory Efficiency & Target
                (SELECT
                    CASE
                        WHEN COALESCE(SUM(o.quantity), 0) = 0 THEN 0
                        ELSE CAST(ROUND((SUM(COALESCE(pl.totalproduced, 0))::numeric / SUM(o.quantity)) * 100, 0) AS INT)
                    END
                FROM orders o
                LEFT JOIN (
                    SELECT orderid, SUM(quantityproduced) AS totalproduced
                    FROM productionlogs GROUP BY orderid
                ) pl ON o.orderid = pl.orderid
                WHERE o.status = 'Manufacturing') AS "efficiency",
                90 AS "targetEfficiency",

                -- Weekly Production & Trend
                (SELECT COALESCE(SUM(quantityproduced), 0)::int FROM productionlogs WHERE logdate >= (NOW() - INTERVAL '7 days')) AS "totalProduced",
                (SELECT COALESCE(SUM(quantityproduced), 0)::int FROM productionlogs WHERE logdate >= (NOW() - INTERVAL '14 days') AND logdate < (NOW() - INTERVAL '7 days')) AS "lastWeekProduced",
                (SELECT
                    CASE
                        WHEN prev = 0 THEN 0
                        ELSE ROUND((((curr - prev)::numeric / prev) * 100), 1)::float8
                    END
                FROM (
                    SELECT (SELECT COALESCE(SUM(quantityproduced), 0)::int FROM productionlogs WHERE logdate >= (NOW() - INTERVAL '7 days')) AS curr,
                           (SELECT COALESCE(SUM(quantityproduced), 0)::int FROM productionlogs WHERE logdate >= (NOW() - INTERVAL '14 days') AND logdate < (NOW() - INTERVAL '7 days')) AS prev
                ) AS production_counts) AS "productionTrend",

                -- Critical Alerts
                (SELECT COUNT(*)::int FROM rawmaterials WHERE currentstock < 10) AS "lowStockCount",
                ((SELECT COUNT(*)::int FROM rawmaterials WHERE currentstock < 10) +
                 (SELECT COUNT(*)::int FROM orders WHERE status = 'Pending' AND orderdate < (NOW() - INTERVAL '3 days'))) AS "alerts"
        `);

        res.json({
            weeklyProduction: weeklyResult.rows || [],
            workerPerformance: workerResult.rows || [],
            stats: (statsResult.rows && statsResult.rows[0]) || {
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
