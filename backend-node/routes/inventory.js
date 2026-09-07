const express = require('express');
const router = express.Router();
const { query, withTransaction } = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { logAction } = require('../utils/auditLogger');

// Get all Raw Materials (Available to all authenticated users)
router.get('/materials', auth(), async (req, res) => {
    try {
        const result = await query(`
            SELECT
                rm.*,
                mt.typename AS "TypeName",
                COALESCE((
                    SELECT SUM((o.quantity - COALESCE(prod.producedqty, 0)) * p.materialquantityperunit)
                    FROM orders o
                    JOIN products p ON o.productid = p.productid
                    JOIN productmaterials pm ON p.productid = pm.productid
                    LEFT JOIN (
                        SELECT orderid, SUM(quantityproduced) AS producedqty
                        FROM productionlogs
                        GROUP BY orderid
                    ) prod ON o.orderid = prod.orderid
                    WHERE pm.materialid = rm.materialid
                    AND o.status NOT IN ('Completed', 'Cancelled', 'Inquiry')
                ), 0) AS "ReservedStock"
            FROM rawmaterials rm
            LEFT JOIN materialtypes mt ON rm.typeid = mt.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Raw Material (Admin only)
router.put('/materials/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, name, unit, minimumRequired, typeId } = req.body;

        const result = await query(
            `
                UPDATE rawmaterials
                SET currentstock = COALESCE($1, currentstock),
                    name = COALESCE($2, name),
                    unit = COALESCE($3, unit),
                    minimumrequired = COALESCE($4, minimumrequired),
                    typeid = COALESCE($5, typeid),
                    lastupdated = NOW()
                WHERE materialid = $6
            `,
            [quantity ?? null, name ?? null, unit ?? null, minimumRequired ?? null, typeId ?? null, id]
        );

        if (result.rowCount === 0) {
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
        const result = await query('SELECT * FROM materialtypes ORDER BY typename ASC');
        res.json(result.rows);
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

        let finalTypeId = typeId || null;

        const newMaterialId = await withTransaction(async (tx) => {

            // If no typeId provided, try to find or create one based on the name
            if (!finalTypeId) {
                // Check if a type with this name already exists
                const typeCheck = await tx.query(
                    'SELECT id AS "ID" FROM materialtypes WHERE typename = $1',
                    [materialName]
                );

                if (typeCheck.rows.length > 0) {
                    finalTypeId = typeCheck.rows[0].ID;
                } else {
                    // Create a new MaterialType
                    const newTypeResult = await tx.query(
                        `
                            INSERT INTO materialtypes (typename, cre_usr_id, cre_usr_dt, last_usr_id, last_usr_dt, last_usr_ver)
                            VALUES ($1, $2, NOW(), $2, NOW(), NULL)
                            RETURNING id AS "ID"
                        `,
                        [materialName, req.user.username || 'admin']
                    );
                    finalTypeId = newTypeResult.rows[0].ID;
                }
            }

            const result = await tx.query(
                `
                    INSERT INTO rawmaterials (name, currentstock, unit, minimumrequired, typeid)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING materialid AS "MaterialID"
                `,
                [materialName, currentStock, unit, minimumRequired || 0, finalTypeId]
            );

            return result.rows[0].MaterialID;
        });

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

        res.status(201).json({ message: 'Material created successfully', materialId: newMaterialId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Delete Raw Material (Admin only)
router.delete('/materials/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if material is being used by products
        const checkResult = await query(
            'SELECT COUNT(*) AS count FROM productmaterials WHERE materialid = $1',
            [id]
        );

        if (checkResult.rows[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete material: It is being used by existing products.' });
        }

        const result = await query('DELETE FROM rawmaterials WHERE materialid = $1', [id]);

        if (result.rowCount === 0) {
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

        const result = await query(
            'UPDATE rawmaterials SET currentstock = currentstock + $1, lastupdated = NOW() WHERE materialid = $2',
            [parseFloat(quantity), id]
        );

        if (result.rowCount === 0) {
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
        const isUserAdmin = req.user.role === 'Admin';

        const result = await query(
            `
                SELECT p.*,
                    (
                        SELECT json_agg(json_build_object('MaterialID', pm.materialid))
                        FROM productmaterials pm
                        WHERE pm.productid = p.productid
                    ) AS "MaterialIDs"
                FROM products p
                WHERE p.isactive = true OR p.isactive IS NULL OR $1 = true
            `,
            [isUserAdmin]
        );

        // MaterialIDs arrives as a JSON array (or NULL when the product has no materials)
        const products = result.rows.map(p => ({
            ...p,
            MaterialIDs: Array.isArray(p.MaterialIDs) ? p.MaterialIDs.map(m => m.MaterialID) : []
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

        const productId = await withTransaction(async (tx) => {
            const productResult = await tx.query(
                `
                    INSERT INTO products (productname, basematerialid, materialquantityperunit, price, imageurl, isactive)
                    VALUES ($1, $2, $3, $4, $5, true)
                    RETURNING productid AS "ProductID"
                `,
                // Keep the first material in BaseMaterialID for backward compatibility
                [productName, materialIds[0], materialQuantityPerUnit, price || null, imageUrl || null]
            );

            const newProductId = productResult.rows[0].ProductID;

            for (const mId of materialIds) {
                await tx.query(
                    'INSERT INTO productmaterials (productid, materialid) VALUES ($1, $2)',
                    [newProductId, mId]
                );
            }

            return newProductId;
        });

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

        res.status(201).json({ message: 'Product created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Product (Admin only)
router.put('/products/:id', auth(['Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { productName, materialIds, materialQuantityPerUnit, price, imageUrl, isActive } = req.body;
        const activeFlag = isActive === undefined ? true : Boolean(isActive);

        await withTransaction(async (tx) => {
            await tx.query(
                `
                    UPDATE products
                    SET productname = COALESCE($2, productname),
                        basematerialid = COALESCE($3, basematerialid),
                        materialquantityperunit = COALESCE($4, materialquantityperunit),
                        price = $5,
                        imageurl = $6,
                        isactive = $7
                    WHERE productid = $1
                `,
                [
                    id,
                    productName ?? null,
                    Array.isArray(materialIds) && materialIds.length > 0 ? materialIds[0] : null,
                    materialQuantityPerUnit ?? null,
                    price ?? null,
                    imageUrl ?? null,
                    activeFlag
                ]
            );

            if (Array.isArray(materialIds)) {
                await tx.query('DELETE FROM productmaterials WHERE productid = $1', [id]);
                for (const mId of materialIds) {
                    await tx.query(
                        'INSERT INTO productmaterials (productid, materialid) VALUES ($1, $2)',
                        [id, mId]
                    );
                }
            }
        });

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

        const checkResult = await query(
            'SELECT COUNT(*) AS count FROM orders WHERE productid = $1',
            [id]
        );

        if (checkResult.rows[0].count > 0) {
            // Suggest soft delete instead
            await query('UPDATE products SET isactive = false WHERE productid = $1', [id]);
            return res.json({ message: 'Product is used in orders. It has been deactivated instead of deleted.' });
        }

        const result = await query('DELETE FROM products WHERE productid = $1', [id]);

        if (result.rowCount === 0) {
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
