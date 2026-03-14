const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const auth = require('../middleware/authMiddleware');

// Log Production (Worker only)
router.post('/log', auth(['Worker']), async (req, res) => {
    try {
        const { productId, orderId, quantityProduced } = req.body;
        const workerId = req.user.id;

        if (!productId || !quantityProduced || quantityProduced <= 0) {
            return res.status(400).json({ error: 'Product ID and a positive quantity are required' });
        }

        const pool = await poolPromise;

        // Use a transaction to update production logs and raw materials simultaneously
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Validation for Over-production if OrderID is provided
            if (orderId) {
                const orderCheck = await transaction.request()
                    .input('orderId', sql.Int, orderId)
                    .query('SELECT Quantity, Status, (SELECT COALESCE(SUM(QuantityProduced), 0) FROM ProductionLogs WHERE OrderID = @orderId) as ProducedQuantity FROM Orders WHERE OrderID = @orderId');

                if (orderCheck.recordset.length === 0) {
                    throw new Error('Associated order not found');
                }

                const { Quantity, Status, ProducedQuantity } = orderCheck.recordset[0];
                if (Status === 'Completed') {
                    const error = new Error('This order is already completed.');
                    error.statusCode = 400;
                    throw error;
                }

                const remaining = Quantity - ProducedQuantity;
                if (quantityProduced > remaining) {
                    const error = new Error(`Over-production detected. This order only needs ${remaining} more units, but you tried to log ${quantityProduced}.`);
                    error.statusCode = 400;
                    throw error;
                }
            }

            // 2. Insert Log
            await transaction.request()
                .input('workerId', sql.Int, workerId)
                .input('productId', sql.Int, productId)
                .input('orderId', sql.Int, orderId || null)
                .input('quantity', sql.Int, quantityProduced)
                .query('INSERT INTO ProductionLogs (WorkerID, ProductID, OrderID, QuantityProduced, LogDate) VALUES (@workerId, @productId, @orderId, @quantity, GETUTCDATE())');

            // 3. Fetch Material consumption info and current stock for all materials
            const materialsResult = await transaction.request()
                .input('productId', sql.Int, productId)
                .query(`
                    SELECT pm.MaterialID, p.MaterialQuantityPerUnit, rm.CurrentStock, rm.Name as MaterialName
                    FROM ProductMaterials pm
                    JOIN Products p ON pm.ProductID = p.ProductID
                    JOIN RawMaterials rm ON pm.MaterialID = rm.MaterialID
                    WHERE pm.ProductID = @productId
                `);

            if (materialsResult.recordset.length === 0) {
                // Fallback for Products that might not have ProductMaterials entries yet
                const fallbackResult = await transaction.request()
                    .input('productId', sql.Int, productId)
                    .query(`
                        SELECT p.BaseMaterialID as MaterialID, p.MaterialQuantityPerUnit, rm.CurrentStock, rm.Name as MaterialName
                        FROM Products p
                        JOIN RawMaterials rm ON p.BaseMaterialID = rm.MaterialID
                        WHERE p.ProductID = @productId
                    `);
                
                if (fallbackResult.recordset.length === 0) {
                    throw new Error('Product or its base material not found');
                }
                materialsResult.recordset = fallbackResult.recordset;
            }

            for (const material of materialsResult.recordset) {
                const { MaterialID, MaterialQuantityPerUnit, CurrentStock, MaterialName } = material;
                const totalConsumed = quantityProduced * MaterialQuantityPerUnit;

                // Check for Insufficient Stock
                if (totalConsumed > CurrentStock) {
                    const error = new Error(`Insufficient stock for ${MaterialName}. Available: ${CurrentStock}, Required: ${totalConsumed}`);
                    error.statusCode = 400;
                    throw error;
                }

                // 4. Deduct from Raw Materials
                await transaction.request()
                    .input('materialId', sql.Int, MaterialID)
                    .input('consumed', sql.Float, totalConsumed)
                    .query('UPDATE RawMaterials SET CurrentStock = CurrentStock - @consumed WHERE MaterialID = @materialId');
            }

            // 5. Update Order Status based on production progress
            if (orderId) {
                await transaction.request()
                    .input('orderId', sql.Int, orderId)
                    .query(`
                    UPDATE Orders 
                    SET Status = CASE 
                        WHEN (SELECT COALESCE(SUM(QuantityProduced), 0) FROM ProductionLogs WHERE OrderID = @orderId) >= Quantity THEN 'Completed'
                        ELSE 'In Progress'
                    END
                    WHERE OrderID = @orderId
                   `);
            }

            await transaction.commit();
            res.status(201).json({ message: 'Production logged and inventory updated' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
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

        const pool = await poolPromise;
        const result = await pool.request()
            .input('workerId', sql.Int, workerId)
            .query('SELECT pl.*, p.ProductName FROM ProductionLogs pl JOIN Products p ON pl.ProductID = p.ProductID WHERE pl.WorkerID = @workerId ORDER BY pl.LogDate DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
