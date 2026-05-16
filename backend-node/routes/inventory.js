const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');

// Get all Raw Materials (Available to all authenticated users)
router.get('/materials', auth(), async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                rm.*,
                mt.TypeName,
                COALESCE((
                    SELECT SUM((o.Quantity - COALESCE(prod.ProducedQty, 0)) * p.MaterialQuantityPerUnit)
                    FROM Orders o
                    JOIN Products p ON o.ProductID = p.ProductID
                    JOIN ProductMaterials pm ON p.ProductID = pm.ProductID
                    LEFT JOIN (
                        SELECT OrderID, SUM(QuantityProduced) as ProducedQty
                        FROM ProductionLogs
                        GROUP BY OrderID
                    ) prod ON o.OrderID = prod.OrderID
                    WHERE pm.MaterialID = rm.MaterialID
                    AND o.Status NOT IN ('Completed', 'Cancelled', 'Inquiry')
                ), 0) as ReservedStock
            FROM RawMaterials rm
            LEFT JOIN MaterialTypes mt ON rm.TypeID = mt.ID
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
        const { quantity, name, unit, minimumRequired, typeId } = req.body;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('quantity', sql.Float, quantity)
            .input('name', sql.NVarChar, name)
            .input('unit', sql.NVarChar, unit)
            .input('min', sql.Float, minimumRequired)
            .input('typeId', sql.Int, typeId || null)
            .query(`
                UPDATE RawMaterials 
                SET CurrentStock = COALESCE(@quantity, CurrentStock),
                    Name = COALESCE(@name, Name),
                    Unit = COALESCE(@unit, Unit),
                    MinimumRequired = COALESCE(@min, MinimumRequired),
                    TypeID = COALESCE(@typeId, TypeID),
                    LastUpdated = GETUTCDATE() 
                WHERE MaterialID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }

        // Log material update
        await logAction({
            userId: req.user.id,
            action: 'UPDATE_MATERIAL',
            entityName: 'RawMaterials',
            entityId: id,
            details: {
                updatedBy: req.user.username,
                updates: { quantity, name, unit, minimumRequired },
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip
        });

        res.json({ message: 'Material updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get all Material Types
router.get('/material-types', auth(), async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM MaterialTypes ORDER BY TypeName ASC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Create New Raw Material (Admin only)
router.post('/materials', auth(['Admin']), async (req, res) => {
    try {
        const { materialName, currentStock, unit, minimumRequired, typeId } = req.body;
        if (!materialName || currentStock === undefined || !unit) {
            return res.status(400).json({ error: 'Material name, stock, and unit are required' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            let finalTypeId = typeId || null;

            // If no typeId provided, try to find or create one based on the name
            if (!finalTypeId) {
                // Check if a type with this name already exists
                const typeCheck = await transaction.request()
                    .input('name', sql.NVarChar, materialName)
                    .query('SELECT ID FROM MaterialTypes WHERE TypeName = @name');

                if (typeCheck.recordset.length > 0) {
                    finalTypeId = typeCheck.recordset[0].ID;
                } else {
                    // Create a new MaterialType
                    const newTypeResult = await transaction.request()
                        .input('name', sql.NVarChar, materialName)
                        .input('usr', sql.VarChar, req.user.username || 'admin')
                        .input('now', sql.DateTime, new Date())
                        .query(`
                            INSERT INTO MaterialTypes (TypeName, CRE_USR_ID, CRE_USR_DT, LAST_USR_ID, LAST_USR_DT, LAST_USR_VER)
                            OUTPUT INSERTED.ID
                            VALUES (@name, @usr, @now, @usr, @now, NULL)
                        `);
                    finalTypeId = newTypeResult.recordset[0].ID;
                }
            }

            const result = await transaction.request()
                .input('name', sql.NVarChar, materialName)
                .input('stock', sql.Float, currentStock)
                .input('unit', sql.NVarChar, unit)
                .input('min', sql.Float, minimumRequired || 0)
                .input('typeId', sql.Int, finalTypeId)
                .query(`
                    INSERT INTO RawMaterials (Name, CurrentStock, Unit, MinimumRequired, TypeID) 
                    OUTPUT INSERTED.MaterialID
                    VALUES (@name, @stock, @unit, @min, @typeId)
                `);

            const newMaterialId = result.recordset[0].MaterialID;

            // Log material creation
            await logAction({
                userId: req.user.id,
                action: 'CREATE_MATERIAL',
                entityName: 'RawMaterials',
                entityId: newMaterialId,
                details: {
                    name: materialName,
                    initialStock: currentStock,
                    unit: unit,
                    typeId: finalTypeId,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip
            });

            await transaction.commit();
            res.status(201).json({ message: 'Material created successfully', materialId: newMaterialId });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
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
            .query('SELECT COUNT(*) as count FROM ProductMaterials WHERE MaterialID = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete material: It is being used by existing products.' });
        }

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM RawMaterials WHERE MaterialID = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Material not found' });
        }

        // Log material deletion
        await logAction({
            userId: req.user.id,
            action: 'DELETE_MATERIAL',
            entityName: 'RawMaterials',
            entityId: id,
            details: {
                timestamp: new Date().toISOString(),
                deletedBy: req.user.username
            },
            ipAddress: req.ip
        });

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

        // Log stock addition
        await logAction({
            userId: req.user.id,
            action: 'ADD_STOCK',
            entityName: 'RawMaterials',
            entityId: id,
            details: {
                addedQuantity: quantity,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip
        });

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
            .query(`
                SELECT p.*, 
                    (SELECT MaterialID FROM ProductMaterials pm WHERE pm.ProductID = p.ProductID FOR JSON PATH) as MaterialIDs
                FROM Products p 
                WHERE ISNULL(p.IsActive, 1) = 1 OR @isUserAdmin = 1
            `);

        // Parse MaterialIDs from JSON string if necessary
        const products = result.recordset.map(p => ({
            ...p,
            MaterialIDs: p.MaterialIDs ? JSON.parse(p.MaterialIDs).map(m => m.MaterialID) : []
        }));

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create New Product (Admin only)
router.post('/products', auth(['Admin']), async (req, res) => {
    try {
        const { productName, materialIds, materialQuantityPerUnit, price, imageUrl } = req.body;
        if (!productName || !materialIds || !Array.isArray(materialIds) || materialIds.length === 0 || !materialQuantityPerUnit) {
            return res.status(400).json({ error: 'Product name, at least one material ID, and quantity per unit are required' });
        }

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const productResult = await transaction.request()
                .input('name', sql.NVarChar, productName)
                .input('materialId', sql.Int, materialIds[0]) // Still keep the first one in BaseMaterialID for backward compatibility
                .input('qty', sql.Float, materialQuantityPerUnit)
                .input('price', sql.Decimal(10, 2), price || null)
                .input('imageUrl', sql.NVarChar, imageUrl || null)
                .query('INSERT INTO Products (ProductName, BaseMaterialID, MaterialQuantityPerUnit, Price, ImageURL, IsActive) OUTPUT INSERTED.ProductID VALUES (@name, @materialId, @qty, @price, @imageUrl, 1)');

            const productId = productResult.recordset[0].ProductID;

            for (const mId of materialIds) {
                await transaction.request()
                    .input('pId', sql.Int, productId)
                    .input('mId', sql.Int, mId)
                    .query('INSERT INTO ProductMaterials (ProductID, MaterialID) VALUES (@pId, @mId)');
            }

            // Log product creation
            await logAction({
                userId: req.user.id,
                action: 'CREATE_PRODUCT',
                entityName: 'Products',
                entityId: productId,
                details: {
                    name: productName,
                    materialIds: materialIds,
                    price: price,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip
            });

            await transaction.commit();
            res.status(201).json({ message: 'Product created successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Product (Admin only)
router.put('/products/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, materialIds, materialQuantityPerUnit, price, imageUrl, isActive } = req.body;

        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            await transaction.request()
                .input('id', sql.Int, id)
                .input('name', sql.NVarChar, productName)
                .input('materialId', sql.Int, Array.isArray(materialIds) && materialIds.length > 0 ? materialIds[0] : null)
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

            if (Array.isArray(materialIds)) {
                await transaction.request().input('id', sql.Int, id).query('DELETE FROM ProductMaterials WHERE ProductID = @id');
                for (const mId of materialIds) {
                    await transaction.request()
                        .input('pId', sql.Int, id)
                        .input('mId', sql.Int, mId)
                        .query('INSERT INTO ProductMaterials (ProductID, MaterialID) VALUES (@pId, @mId)');
                }
            }

            // Log product update
            await logAction({
                userId: req.user.id,
                action: 'UPDATE_PRODUCT',
                entityName: 'Products',
                entityId: id,
                details: {
                    name: productName,
                    price: price,
                    isActive: isActive,
                    timestamp: new Date().toISOString()
                },
                ipAddress: req.ip
            });

            await transaction.commit();
            res.json({ message: 'Product updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
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

        // Log product deletion
        await logAction({
            userId: req.user.id,
            action: 'DELETE_PRODUCT',
            entityName: 'Products',
            entityId: id,
            details: {
                deletedBy: req.user.username,
                timestamp: new Date().toISOString()
            },
            ipAddress: req.ip
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
