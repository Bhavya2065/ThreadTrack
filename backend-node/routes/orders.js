const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const auth = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');

const logError = (err, route) => {
    const logPath = path.join(__dirname, '../error.log');
    const message = `[${new Date().toISOString()}] ERROR in ${route}: ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync(logPath, message);
};

// Get all Orders (Admin and Worker view)
router.get('/', auth(['Admin', 'Worker']), async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                o.*, 
                p.ProductName, 
                u.Username as BuyerName,
                COALESCE((SELECT SUM(QuantityProduced) FROM ProductionLogs WHERE OrderID = o.OrderID), 0) as ProducedQuantity
            FROM Orders o 
            JOIN Products p ON o.ProductID = p.ProductID 
            JOIN Users u ON o.BuyerID = u.UserID
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Order Details (with timeline)
router.get('/:id', auth(['Admin', 'Worker', 'Buyer']), async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(parseInt(id))) {
            return res.status(400).json({ error: 'Invalid Order ID' });
        }
        const pool = await poolPromise;

        // Fetch order details
        const orderResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    o.*, 
                    p.ProductName, 
                    u.Username as BuyerName,
                    COALESCE((SELECT SUM(QuantityProduced) FROM ProductionLogs WHERE OrderID = o.OrderID), 0) as ProducedQuantity
                FROM Orders o 
                JOIN Products p ON o.ProductID = p.ProductID 
                JOIN Users u ON o.BuyerID = u.UserID
                WHERE o.OrderID = @id
            `);

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.recordset[0];

        // Authorization check for Buyers
        if (req.user.role === 'Buyer' && order.BuyerID !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
        }

        // Fetch production timeline
        const logsResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    pl.*, 
                    u.Username as WorkerName 
                FROM ProductionLogs pl
                JOIN Users u ON pl.WorkerID = u.UserID
                WHERE pl.OrderID = @id
                ORDER BY pl.LogDate DESC
            `);

        res.json({
            ...order,
            timeline: logsResult.recordset
        });
    } catch (err) {
        logError(err, `GET /orders/${req.params.id}`);
        res.status(500).json({ error: err.message });
    }
});


// Create Order (B2B - Buyer only)
router.post('/', auth(['Buyer']), async (req, res) => {
    try {
        const { productId, quantity, items } = req.body;
        const buyerId = req.user.id;

        // Normalize input: handle both legacy (single item) and new (array of items)
        let orderItems = [];
        if (items && Array.isArray(items)) {
            orderItems = items;
        } else if (productId && quantity) {
            orderItems = [{ productId, quantity }];
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ error: 'At least one product and a positive quantity are required' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const item of orderItems) {
                const { productId: pId, quantity: qty } = item;

                if (!pId || !qty || qty <= 0) {
                    throw new Error('Each item must have a Product ID and a positive quantity');
                }

                // Validation for Raw Material Capacity (Consistency Check)
                const materialsCheck = await transaction.request()
                    .input('productId', sql.Int, pId)
                    .query(`
                        WITH Reserved AS (
                             SELECT pm_inner.MaterialID, SUM((o.Quantity - COALESCE(prod.ProducedQty, 0)) * p_inner.MaterialQuantityPerUnit) as ReservedStock
                             FROM Orders o
                             JOIN Products p_inner ON o.ProductID = p_inner.ProductID
                             JOIN ProductMaterials pm_inner ON p_inner.ProductID = pm_inner.ProductID
                             LEFT JOIN (
                                 SELECT OrderID, SUM(QuantityProduced) as ProducedQty
                                 FROM ProductionLogs
                                 GROUP BY OrderID
                             ) prod ON o.OrderID = prod.OrderID
                             WHERE o.Status NOT IN ('Completed', 'Cancelled')
                             GROUP BY pm_inner.MaterialID
                        )
                        SELECT 
                            p.MaterialQuantityPerUnit, 
                            rm.CurrentStock, 
                            p.ProductName,
                            rm.Name as MaterialName,
                            COALESCE(r.ReservedStock, 0) as ReservedStock
                        FROM Products p
                        JOIN ProductMaterials pm ON p.ProductID = pm.ProductID
                        JOIN RawMaterials rm ON pm.MaterialID = rm.MaterialID
                        LEFT JOIN Reserved r ON rm.MaterialID = r.MaterialID
                        WHERE p.ProductID = @productId
                    `);

                if (materialsCheck.recordset.length === 0) {
                   // Fallback for Products without ProductMaterials
                   const fallbackResult = await transaction.request()
                        .input('productId', sql.Int, pId)
                        .query(`
                            SELECT 
                                p.MaterialQuantityPerUnit, 
                                rm.CurrentStock, 
                                p.ProductName,
                                rm.Name as MaterialName,
                                COALESCE((
                                    SELECT SUM((o.Quantity - COALESCE(prod.ProducedQty, 0)) * p_inner.MaterialQuantityPerUnit)
                                    FROM Orders o
                                    JOIN Products p_inner ON o.ProductID = p_inner.ProductID
                                    LEFT JOIN (
                                        SELECT OrderID, SUM(QuantityProduced) as ProducedQty
                                        FROM ProductionLogs
                                        GROUP BY OrderID
                                    ) prod ON o.OrderID = prod.OrderID
                                    WHERE p_inner.BaseMaterialID = rm.MaterialID
                                    AND o.Status NOT IN ('Completed', 'Cancelled')
                                ), 0) as ReservedStock
                            FROM Products p
                            JOIN RawMaterials rm ON p.BaseMaterialID = rm.MaterialID
                            WHERE p.ProductID = @productId
                        `);
                    if (fallbackResult.recordset.length === 0) {
                        throw new Error(`Product or base material not found for item: ${pId}`);
                    }
                    materialsCheck.recordset = fallbackResult.recordset;
                }

                for (const material of materialsCheck.recordset) {
                    const { MaterialQuantityPerUnit, CurrentStock, ReservedStock, ProductName, MaterialName } = material;
                    const netStock = CurrentStock - ReservedStock;
                    const maxUnits = Math.floor(netStock / MaterialQuantityPerUnit);

                    if (qty > maxUnits) {
                        throw new Error(`Order volume for ${ProductName} exceeds ${MaterialName} capacity. Max available: ${maxUnits}`);
                    }
                }

                await transaction.request()
                    .input('buyerId', sql.Int, buyerId)
                    .input('productId', sql.Int, pId)
                    .input('quantity', sql.Int, qty)
                    .input('status', sql.NVarChar, 'Pending')
                    .query('INSERT INTO Orders (BuyerID, ProductID, Quantity, Status) VALUES (@buyerId, @productId, @quantity, @status)');
            }

            await transaction.commit();
            res.status(201).json({ message: 'Order(s) created successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Order Status (Admin only)
router.put('/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, completionNotes } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .input('notes', sql.NVarChar, completionNotes || null)
            .query(`
                UPDATE Orders 
                SET Status = @status, 
                    CompletionNotes = @notes,
                    CompletionDate = CASE WHEN @status = 'Completed' THEN GETUTCDATE() ELSE CompletionDate END
                WHERE OrderID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel Order (Buyer can cancel if Pending, Admin can cancel anytime)
router.delete('/:id', auth(['Buyer', 'Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // Accept reason from body
        const pool = await poolPromise;

        // Fetch order to check status and ownership
        const orderResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT BuyerID, Status FROM Orders WHERE OrderID = @id');

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.recordset[0];

        if (req.user.role === 'Buyer') {
            if (order.BuyerID !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You can only cancel your own orders.' });
            }
            if (order.Status !== 'Pending') {
                return res.status(400).json({ error: 'Cannot cancel order. It is already in progress or completed.' });
            }
        }

        // Soft delete for Admin (or Buyer) to preserve the reason
        await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, 'Cancelled')
            .input('notes', sql.NVarChar, reason || (req.user.role === 'Buyer' ? 'Cancelled by Buyer' : 'Cancelled by Admin'))
            .query('UPDATE Orders SET Status = @status, CompletionNotes = @notes WHERE OrderID = @id');

        res.json({ message: 'Order cancelled successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get orders for a specific buyer (Self or Admin)
router.get('/buyer/:buyerId', auth(['Buyer', 'Admin']), async (req, res) => {
    try {
        const { buyerId } = req.params;

        // Ensure buyer can only see their own orders unless they are an admin
        if (req.user.role !== 'Admin' && req.user.id !== parseInt(buyerId)) {
            return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('buyerId', sql.Int, buyerId)
            .query(`
                SELECT 
                    o.*, 
                    p.ProductName, 
                    u.Username as BuyerName,
                    COALESCE((SELECT SUM(QuantityProduced) FROM ProductionLogs WHERE OrderID = o.OrderID), 0) as ProducedQuantity
                FROM Orders o 
                JOIN Products p ON o.ProductID = p.ProductID 
                JOIN Users u ON o.BuyerID = u.UserID 
                WHERE o.BuyerID = @buyerId 
                ORDER BY o.OrderDate DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
