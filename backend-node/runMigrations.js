const { poolPromise, sql } = require('./config/db');

async function runMigrations() {
    try {
        const pool = await poolPromise;
        console.log('Running migrations...');

        // 1. Update Products table
        console.log('Updating Products table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'IsActive')
            BEGIN
                ALTER TABLE Products ADD IsActive BIT DEFAULT 1;
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'Price')
            BEGIN
                ALTER TABLE Products ADD Price DECIMAL(10,2);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'ImageURL')
            BEGIN
                ALTER TABLE Products ADD ImageURL NVARCHAR(500);
            END
        `);

        // 2. Update Orders table
        console.log('Updating Orders table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'Notes')
            BEGIN
                ALTER TABLE Orders ADD Notes NVARCHAR(MAX);
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'ShippingAddress')
            BEGIN
                ALTER TABLE Orders ADD ShippingAddress NVARCHAR(500);
            END
        `);

        // 3. Create Notifications table
        console.log('Creating Notifications table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('Notifications') AND type = 'U')
            BEGIN
                CREATE TABLE Notifications (
                    NotificationID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT FOREIGN KEY REFERENCES Users(UserID),
                    Title NVARCHAR(100),
                    Message NVARCHAR(MAX),
                    IsRead BIT DEFAULT 0,
                    CreatedAt DATETIME DEFAULT GETUTCDATE()
                );
            END
        `);

        // 4. Create ProductMaterials table for multiple materials support
        console.log('Creating ProductMaterials table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('ProductMaterials') AND type = 'U')
            BEGIN
                CREATE TABLE ProductMaterials (
                    ProductMaterialID INT PRIMARY KEY IDENTITY(1,1),
                    ProductID INT FOREIGN KEY REFERENCES Products(ProductID) ON DELETE CASCADE,
                    MaterialID INT FOREIGN KEY REFERENCES RawMaterials(MaterialID) ON DELETE CASCADE,
                    UNIQUE(ProductID, MaterialID)
                );

                -- Migrate existing data from Products.BaseMaterialID
                INSERT INTO ProductMaterials (ProductID, MaterialID)
                SELECT ProductID, BaseMaterialID 
                FROM Products 
                WHERE BaseMaterialID IS NOT NULL 
                AND NOT EXISTS (
                    SELECT 1 FROM ProductMaterials pm 
                    WHERE pm.ProductID = Products.ProductID 
                    AND pm.MaterialID = Products.BaseMaterialID
                );
            END
        `);

        console.log('✅ Migrations completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
