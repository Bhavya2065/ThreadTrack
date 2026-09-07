const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');

// Log Production (Worker only)
router.post('/log', auth(['Worker']), async (req, res) => {
    try {
        const { productId, orderId, quantityProduced } = req.body;
        const workerId = req.user.id;

        const qty = Number(quantityProduced);

        if (!productId || isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({ error: 'Product ID and a positive whole number quantity are required' });
        }

        // Use a transaction to update production logs and raw materials simultaneously
        const newLogId = await withTransaction(async (tx) => {
            // 1. Validation for Over-production if OrderID is provided
            if (orderId) {
                const orderCheck = await tx.query(
                    `SELECT quantity AS "Quantity", status AS "Status",
                            (SELECT COALESCE(SUM(quantityproduced), 0) FROM productionlogs WHERE orderid = $1) AS "ProducedQuantity"
                     FROM orders WHERE orderid = $1`,
                    [orderId]
                );

                if (orderCheck.rows.length === 0) {
                    throw new Error('Associated order not found');
                }

                const { Quantity, Status, ProducedQuantity } = orderCheck.rows[0];
                if (Status !== 'Manufacturing') {
                    const error = new Error(`Cannot log production. Order status is ${Status}, but it must be 'Manufacturing'.`);
                    error.statusCode = 400;
                    throw error;
                }

                const remaining = Quantity - ProducedQuantity;
                if (qty > remaining) {
                    const error = new Error(`You can't log ${qty} units because this order only needs ${remaining} more to finish.`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            // 2. Insert Log
            const productionResult = await tx.query(
                `INSERT INTO productionlogs (workerid, productid, orderid, quantityproduced, logdate)
                 VALUES ($1, $2, $3, $4, NOW())
                 RETURNING logid AS "LogID"`,
                [workerId, productId, orderId || null, qty]
            );

            const logId = productionResult.rows[0].LogID;

            // Log production event in AuditLogs
            await logAction({
                userId: workerId,
                action: 'LOG_PRODUCTION',
                entityName: 'ProductionLogs',
                entityId: logId,
                details: {
                    productId: productId,
                    orderId: orderId || 'None',
                    quantityLogged: qty,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip
            });

            // 3. Fetch Material consumption info and current stock for all materials
            const materialsResult = await tx.query(
                `
                    SELECT pm.materialid AS "MaterialID", p.materialquantityperunit AS "MaterialQuantityPerUnit",
                           rm.currentstock AS "CurrentStock", rm.name AS "MaterialName", rm.unit AS "Unit"
                    FROM productmaterials pm
                    JOIN products p ON pm.productid = p.productid
                    JOIN rawmaterials rm ON pm.materialid = rm.materialid
                    WHERE pm.productid = $1
                `,
                [productId]
            );

            if (materialsResult.rows.length === 0) {
                // Fallback for Products that might not have ProductMaterials entries yet
                const fallbackResult = await tx.query(
                    `
                        SELECT p.basematerialid AS "MaterialID", p.materialquantityperunit AS "MaterialQuantityPerUnit",
                               rm.currentstock AS "CurrentStock", rm.name AS "MaterialName", rm.unit AS "Unit"
                        FROM products p
                        JOIN rawmaterials rm ON p.basematerialid = rm.materialid
                        WHERE p.productid = $1
                    `,
                    [productId]
                );

                if (fallbackResult.rows.length === 0) {
                    throw new Error('Product or its base material not found');
                }
                materialsResult.rows = fallbackResult.rows;
            }

            for (const material of materialsResult.rows) {
                const { MaterialID, MaterialQuantityPerUnit, CurrentStock, MaterialName } = material;
                const totalConsumed = qty * MaterialQuantityPerUnit;

                // Check for Insufficient Stock (Strict - no negative inventory allowed)
                if (totalConsumed > CurrentStock) {
                    const error = new Error(`Not enough ${MaterialName} in stock. You need ${totalConsumed.toFixed(2)} ${material.Unit || 'units'} but we only have ${CurrentStock.toFixed(2)} ${material.Unit || 'units'} left.`);
                    error.statusCode = 400;
                    throw error;
                }

                // 4. Deduct from Raw Materials
                await tx.query(
                    'UPDATE rawmaterials SET currentstock = currentstock - $1, lastupdated = NOW() WHERE materialid = $2',
                    [totalConsumed, MaterialID]
                );
            }

            // 5. Update Order Status based on production progress
            if (orderId) {
                await tx.query(
                    `
                    UPDATE orders
                    SET status = CASE
                        WHEN (SELECT COALESCE(SUM(quantityproduced), 0) FROM productionlogs WHERE orderid = $1) >= quantity THEN 'Completed'
                        WHEN status = 'Manufacturing' THEN 'Manufacturing'
                        ELSE 'In Progress'
                    END
                    WHERE orderid = $1
                   `,
                    [orderId]
                );
            }

            return logId;
        });

        res.status(201).json({ message: 'Production logged and inventory updated', logId: newLogId });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
});

// Get logs for a worker (Self or Admin)
router.get('/logs/:workerId', auth(['Worker', 'Admin']), async (req, res) => {
    try {
        const { workerId } = req.params;

        if (req.user.role !== 'Admin' && req.user.id !== parseInt(workerId)) {
            return res.status(403).json({ error: 'Access denied. You can only view your own logs.' });
        }

        const result = await query(
            `SELECT pl.*, p.productname AS "ProductName"
             FROM productionlogs pl
             JOIN products p ON pl.productid = p.productid
             WHERE pl.workerid = $1
             ORDER BY pl.logdate DESC`,
            [workerId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
