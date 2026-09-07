const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../config/db');
const auth = require('../middleware/authMiddleware');
const fs = require('fs');
const path = require('path');
const { sendPushNotification } = require('../config/notifications');
const { logAction } = require('../utils/auditLogger');

const logError = (err, route) => {
    const logPath = path.join(__dirname, '../error.log');
    const message = `[${new Date().toISOString()}] ERROR in ${route}: ${err.message}\n${err.stack}\n\n`;
    fs.appendFileSync(logPath, message);
};

// Get all Orders (Admin and Worker view)
router.get('/', auth(['Admin', 'Worker']), async (req, res) => {
    try {
        const result = await query(`
            SELECT
                o.*,
                p.productname AS "ProductName",
                u.username AS "BuyerName",
                COALESCE((SELECT SUM(quantityproduced) FROM productionlogs WHERE orderid = o.orderid), 0)::int AS "ProducedQuantity"
            FROM orders o
            JOIN products p ON o.productid = p.productid
            JOIN users u ON o.buyerid = u.userid
            ${req.user.role === 'Worker' ? "WHERE o.status = 'Manufacturing'" : ""}
            ORDER BY o.orderdate DESC
        `);
        res.json(result.rows);
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

        // Fetch order details
        const orderResult = await query(
            `
                SELECT
                    o.*,
                    p.productname AS "ProductName",
                    u.username AS "BuyerName",
                    COALESCE((SELECT SUM(quantityproduced) FROM productionlogs WHERE orderid = o.orderid), 0)::int AS "ProducedQuantity"
                FROM orders o
                JOIN products p ON o.productid = p.productid
                JOIN users u ON o.buyerid = u.userid
                WHERE o.orderid = $1
            `,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Authorization check for Buyers
        if (req.user.role === 'Buyer' && order.BuyerID !== req.user.id) {
            return res.status(403).json({ error: 'Access denied. You can only view your own orders.' });
        }

        // Fetch production timeline
        const logsResult = await query(
            `
                SELECT
                    pl.*,
                    u.username AS "WorkerName"
                FROM productionlogs pl
                JOIN users u ON pl.workerid = u.userid
                WHERE pl.orderid = $1
                ORDER BY pl.logdate DESC
            `,
            [id]
        );

        res.json({
            ...order,
            timeline: logsResult.rows
        });
    } catch (err) {
        logError(err, `GET /orders/${req.params.id}`);
        res.status(500).json({ error: err.message });
    }
});


// Create Order (B2B - Buyer only)
router.post('/', auth(['Buyer']), async (req, res) => {
    try {
        const { productId, quantity, items, status } = req.body;
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

        await withTransaction(async (tx) => {
            for (const item of orderItems) {
                const { productId: pId, quantity: qty } = item;

                if (!pId || !qty || qty <= 0) {
                    throw new Error('Each item must have a Product ID and a positive quantity');
                }

                // Validation for Raw Material Capacity (Consistency Check)
                const materialsCheck = await tx.query(
                    `
                        WITH Reserved AS (
                             SELECT pm_inner.materialid, SUM((o.quantity - COALESCE(prod.producedqty, 0)) * p_inner.materialquantityperunit) AS ReservedStock
                             FROM orders o
                             JOIN products p_inner ON o.productid = p_inner.productid
                             JOIN productmaterials pm_inner ON p_inner.productid = pm_inner.productid
                             LEFT JOIN (
                                 SELECT orderid, SUM(quantityproduced) AS producedqty
                                 FROM productionlogs
                                 GROUP BY orderid
                             ) prod ON o.orderid = prod.orderid
                             WHERE o.status NOT IN ('Completed', 'Cancelled', 'Inquiry')
                             GROUP BY pm_inner.materialid
                        )
                        SELECT
                            p.materialquantityperunit AS "MaterialQuantityPerUnit",
                            rm.currentstock AS "CurrentStock",
                            p.productname AS "ProductName",
                            rm.name AS "MaterialName",
                            COALESCE(r.reservedstock, 0) AS "ReservedStock"
                        FROM products p
                        JOIN productmaterials pm ON p.productid = pm.productid
                        JOIN rawmaterials rm ON pm.materialid = rm.materialid
                        LEFT JOIN Reserved r ON rm.materialid = r.materialid
                        WHERE p.productid = $1
                    `,
                    [pId]
                );

                if (materialsCheck.rows.length === 0) {
                    // Fallback for Products without ProductMaterials
                    const fallbackResult = await tx.query(
                        `
                            SELECT
                                p.materialquantityperunit AS "MaterialQuantityPerUnit",
                                rm.currentstock AS "CurrentStock",
                                p.productname AS "ProductName",
                                rm.name AS "MaterialName",
                                COALESCE((
                                    SELECT SUM((o.quantity - COALESCE(prod.producedqty, 0)) * p_inner.materialquantityperunit)
                                    FROM orders o
                                    JOIN products p_inner ON o.productid = p_inner.productid
                                    LEFT JOIN (
                                        SELECT orderid, SUM(quantityproduced) AS producedqty
                                        FROM productionlogs
                                        GROUP BY orderid
                                    ) prod ON o.orderid = prod.orderid
                                    WHERE p_inner.basematerialid = rm.materialid
                                    AND o.status NOT IN ('Completed', 'Cancelled', 'Inquiry')
                                ), 0) AS "ReservedStock"
                            FROM products p
                            JOIN rawmaterials rm ON p.basematerialid = rm.materialid
                            WHERE p.productid = $1
                        `,
                        [pId]
                    );
                    if (fallbackResult.rows.length === 0) {
                        throw new Error(`Product or base material not found for item: ${pId}`);
                    }
                    materialsCheck.rows = fallbackResult.rows;
                }

                for (const material of materialsCheck.rows) {
                    const { MaterialQuantityPerUnit, CurrentStock, ReservedStock, ProductName, MaterialName } = material;
                    const netStock = CurrentStock - ReservedStock;
                    const maxUnits = Math.floor(netStock / MaterialQuantityPerUnit);

                    if (qty > maxUnits && status !== 'Inquiry') {
                        throw new Error(`Order volume for ${ProductName} exceeds ${MaterialName} capacity. Max available: ${maxUnits}. Use Bulk Inquiry instead.`);
                    }
                }

                const orderResult = await tx.query(
                    'INSERT INTO orders (buyerid, productid, quantity, status) VALUES ($1, $2, $3, $4) RETURNING orderid AS "OrderID"',
                    [buyerId, pId, qty, status || 'Pending']
                );

                const newOrderId = orderResult.rows[0].OrderID;

                // Log order creation
                await logAction({
                    userId: buyerId,
                    action: 'CREATE_ORDER',
                    entityName: 'Orders',
                    entityId: newOrderId,
                    details: {
                        productId: pId,
                        quantity: qty,
                        status: status || 'Pending',
                        timestamp: new Date().toISOString()
                    },
                    ipAddress: req.ip
                });
            }
        });

        res.status(201).json({ message: 'Order(s) created successfully' });
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

        const result = await query(
            `
                UPDATE orders
                SET status = $1,
                    completionnotes = $2,
                    completiondate = CASE WHEN $1 = 'Completed' THEN NOW() ELSE completiondate END
                WHERE orderid = $3
            `,
            [status, completionNotes || null, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Log status update
        await logAction({
            userId: req.user.id,
            action: 'UPDATE_ORDER_STATUS',
            entityName: 'Orders',
            entityId: id,
            details: {
                newStatus: status,
                notes: completionNotes || 'None',
                updatedBy: req.user.username,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip
        });

        // Send Push Notification to Buyer
        try {
            const buyerInfo = await query(
                `
                    SELECT u.pushtoken AS "PushToken", p.productname AS "ProductName"
                    FROM orders o
                    JOIN users u ON o.buyerid = u.userid
                    JOIN products p ON o.productid = p.productid
                    WHERE o.orderid = $1
                `,
                [id]
            );

            const buyer = buyerInfo.rows[0];
            if (buyer && buyer.PushToken) {
                await sendPushNotification(
                    buyer.PushToken,
                    'Order Status Updated',
                    `Your order for ${buyer.ProductName} is now ${status}.`,
                    { url: `/buyer` }
                );
            }
        } catch (pushErr) {
            console.error('[Push] Silent failure sending order update:', pushErr.message);
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. Approve Order (Level 1)
router.put('/:id/approve', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "UPDATE orders SET status = 'Approved' WHERE orderid = $1 AND status IN ('Pending', 'Inquiry')",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ error: 'Order not found or not in valid state for approval' });
        }

        await logAction({
            userId: req.user.id,
            action: 'APPROVE_ORDER',
            entityName: 'Orders',
            entityId: id,
            details: { message: 'Order approved by Admin', timestamp: new Date().toISOString() },
            ipAddress: req.ip
        });

        res.json({ message: 'Order approved successfully. Buyer notified of progress.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Start Manufacturing (Level 2)
router.put('/:id/manufacture', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(
            "UPDATE orders SET status = 'Manufacturing' WHERE orderid = $1 AND status = 'Approved'",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(400).json({ error: 'Order not found or must be Approved first' });
        }

        await logAction({
            userId: req.user.id,
            action: 'START_MANUFACTURING',
            entityName: 'Orders',
            entityId: id,
            details: { message: 'Order released to factory floor', timestamp: new Date().toISOString() },
            ipAddress: req.ip
        });

        res.json({ message: 'Order released to Workers.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel Order (Buyer can cancel if Pending, Admin can cancel anytime)
router.delete('/:id', auth(['Buyer', 'Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // Accept reason from body

        // Fetch order to check status and ownership
        const orderResult = await query(
            'SELECT buyerid AS "BuyerID", status AS "Status" FROM orders WHERE orderid = $1',
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        if (req.user.role === 'Buyer') {
            if (order.BuyerID !== req.user.id) {
                return res.status(403).json({ error: 'Access denied. You can only cancel your own orders.' });
            }
            const nonCancellable = ['Completed', 'Cancelled'];
            if (nonCancellable.includes(order.Status)) {
                return res.status(400).json({ error: `Cannot cancel order. It is already ${order.Status.toLowerCase()}.` });
            }
        }

        // Soft delete for Admin (or Buyer) to preserve the reason
        await query(
            'UPDATE orders SET status = $1, completionnotes = $2 WHERE orderid = $3',
            ['Cancelled', reason || (req.user.role === 'Buyer' ? 'Cancelled by Buyer' : 'Rejected by Admin'), id]
        );

        // Log cancellation
        await logAction({
            userId: req.user.id,
            action: 'REJECT_ORDER',
            entityName: 'Orders',
            entityId: id,
            details: {
                reason: reason || 'Not specified',
                rejectedBy: req.user.username,
                role: req.user.role,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip
        });

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

        const result = await query(
            `
                SELECT
                    o.*,
                    p.productname AS "ProductName",
                    u.username AS "BuyerName",
                    COALESCE((SELECT SUM(quantityproduced) FROM productionlogs WHERE orderid = o.orderid), 0)::int AS "ProducedQuantity"
                FROM orders o
                JOIN products p ON o.productid = p.productid
                JOIN users u ON o.buyerid = u.userid
                WHERE o.buyerid = $1
                ORDER BY o.orderdate DESC
            `,
            [buyerId]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
