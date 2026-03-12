const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const auth = require('../middleware/authMiddleware');

// Get all Raw Materials (Available to all authenticated users)
router.get('/materials', auth(), async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                rm.*,
                COALESCE((
                    SELECT SUM((o.Quantity - COALESCE(prod.ProducedQty, 0)) * p.MaterialQuantityPerUnit)
                    FROM Orders o
                    JOIN Products p ON o.ProductID = p.ProductID
                    LEFT JOIN (
                        SELECT OrderID, SUM(QuantityProduced) as ProducedQty
                        FROM ProductionLogs
                        GROUP BY OrderID
                    ) prod ON o.OrderID = prod.OrderID
                    WHERE p.BaseMaterialID = rm.MaterialID
                    AND o.Status NOT IN ('Completed', 'Cancelled')
                ), 0) as ReservedStock
            FROM RawMaterials rm
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Raw Material (Admin only)
router.put('/materials/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, name, unit, minimumRequired } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('quantity', sql.Float, quantity)
            .input('name', sql.NVarChar, name)
            .input('unit', sql.NVarChar, unit)
            .input('min', sql.Float, minimumRequired)
            .query(`
                UPDATE RawMaterials 
                SET CurrentStock = COALESCE(@quantity, CurrentStock),
                    Name = COALESCE(@name, Name),
                    Unit = COALESCE(@unit, Unit),
                    MinimumRequired = COALESCE(@min, MinimumRequired),
                    LastUpdated = GETUTCDATE() 
                WHERE MaterialID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }

        res.json({ message: 'Material updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Create New Raw Material (Admin only)
router.post('/materials', auth(['Admin']), async (req, res) => {
    try {
        const { materialName, currentStock, unit, minimumRequired } = req.body;
        if (!materialName || currentStock === undefined || !unit) {
            return res.status(400).json({ error: 'Material name, stock, and unit are required' });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.NVarChar, materialName)
            .input('stock', sql.Float, currentStock)
            .input('unit', sql.NVarChar, unit)
            .input('min', sql.Float, minimumRequired || 0)
            .query('INSERT INTO RawMaterials (Name, CurrentStock, Unit, MinimumRequired) VALUES (@name, @stock, @unit, @min)');

        res.status(201).json({ message: 'Material created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Delete Raw Material (Admin only)
router.delete('/materials/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Check if material is being used by products
        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Products WHERE BaseMaterialID = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete material: It is being used by existing products.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM RawMaterials WHERE MaterialID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }

        res.json({ message: 'Material deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add stock to an existing material (Admin only)
router.put('/materials/:id/add-stock', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || isNaN(parseFloat(quantity))) {
            return res.status(400).json({ error: 'Valid quantity is required' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('qty', sql.Float, parseFloat(quantity))
            .query('UPDATE RawMaterials SET CurrentStock = CurrentStock + @qty WHERE MaterialID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }

        res.json({ message: 'Stock updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all Products (Available to all authenticated users)
router.get('/products', auth(), async (req, res) => {
    try {
        const pool = await poolPromise;
        const isAdmin = req.user.role === 'Admin' ? 1 : 0;


        const result = await pool.request()
            .input('isUserAdmin', sql.Bit, isAdmin)
            .query('SELECT * FROM Products WHERE ISNULL(IsActive, 1) = 1 OR @isUserAdmin = 1');


        res.json(result.recordset);
    } catch (err) {

        res.status(500).json({ error: err.message });
    }
});

// Create New Product (Admin only)
router.post('/products', auth(['Admin']), async (req, res) => {
    try {
        const { productName, baseMaterialId, materialQuantityPerUnit, price, imageUrl } = req.body;
        if (!productName || !baseMaterialId || !materialQuantityPerUnit) {
            return res.status(400).json({ error: 'Product name, material ID, and quantity per unit are required' });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.NVarChar, productName)
            .input('materialId', sql.Int, baseMaterialId)
            .input('qty', sql.Float, materialQuantityPerUnit)
            .input('price', sql.Decimal(10, 2), price || null)
            .input('imageUrl', sql.NVarChar, imageUrl || null)
            .query('INSERT INTO Products (ProductName, BaseMaterialID, MaterialQuantityPerUnit, Price, ImageURL, IsActive) VALUES (@name, @materialId, @qty, @price, @imageUrl, 1)');

        res.status(201).json({ message: 'Product created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Product (Admin only)
router.put('/products/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, baseMaterialId, materialQuantityPerUnit, price, imageUrl, isActive } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, productName)
            .input('materialId', sql.Int, baseMaterialId)
            .input('qty', sql.Float, materialQuantityPerUnit)
            .input('price', sql.Decimal(10, 2), price)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
            .query(`
                UPDATE Products 
                SET ProductName = COALESCE(@name, ProductName),
                    BaseMaterialID = COALESCE(@materialId, BaseMaterialID),
                    MaterialQuantityPerUnit = COALESCE(@qty, MaterialQuantityPerUnit),
                    Price = @price,
                    ImageURL = @imageUrl,
                    IsActive = @isActive
                WHERE ProductID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Product (Soft delete or hard delete?) 
// For now, let's do hard delete but check for orders
router.delete('/products/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT COUNT(*) as count FROM Orders WHERE ProductID = @id');

        if (checkResult.recordset[0].count > 0) {
            // Suggest soft delete instead
            await pool.request()
                .input('id', sql.Int, id)
                .query('UPDATE Products SET IsActive = 0 WHERE ProductID = @id');
            return res.json({ message: 'Product is used in orders. It has been deactivated instead of deleted.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Products WHERE ProductID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
