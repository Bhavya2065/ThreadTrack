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

            -- Add PushToken to Users table
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PushToken')
            BEGIN
                ALTER TABLE Users ADD PushToken NVARCHAR(255);
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

            -- Update Status constraint to include 'Inquiry'
            DECLARE @ConstraintName nvarchar(200)
            SELECT @ConstraintName = name FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('Orders') AND definition LIKE '%Status%'
            
            IF @ConstraintName IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE Orders DROP CONSTRAINT ' + @ConstraintName)
            END
            
            IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Orders_Status')
            BEGIN
                ALTER TABLE Orders ADD CONSTRAINT CK_Orders_Status CHECK (Status IN ('Inquiry', 'Pending', 'Approved', 'Manufacturing', 'In Progress', 'Completed', 'Cancelled'))
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

        // 5. Create AuditLogs table
        console.log('Creating AuditLogs table...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('AuditLogs') AND type = 'U')
            BEGIN
                CREATE TABLE AuditLogs (
                    LogID INT PRIMARY KEY IDENTITY(1,1),
                    UserID INT FOREIGN KEY REFERENCES Users(UserID),
                    Action NVARCHAR(100) NOT NULL,
                    EntityName NVARCHAR(50),
                    EntityID INT,
                    Details NVARCHAR(MAX),
                    IPAddress NVARCHAR(50),
                    CreatedAt DATETIME DEFAULT GETUTCDATE()
                );
            END
        `);

        // 6. Create Roles table and Update Users table
        console.log('Setting up Roles...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('Roles') AND type = 'U')
            BEGIN
                CREATE TABLE Roles (
                    RoleID INT PRIMARY KEY IDENTITY(1,1),
                    RoleName NVARCHAR(50) NOT NULL UNIQUE,
                    IsPublic BIT DEFAULT 1
                );
            END
        `);

        // Check if roles are already seeded
        const roleCount = await pool.request().query("SELECT COUNT(*) as count FROM Roles");
        if (roleCount.recordset[0].count === 0) {
            await pool.request().query(`
                INSERT INTO Roles (RoleName, IsPublic) VALUES 
                ('Super Admin', 0),
                ('Admin', 1),
                ('Worker', 1),
                ('Buyer', 1);
            `);
        }

        console.log('Verifying Users columns...');
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Status')
            BEGIN
                ALTER TABLE Users ADD Status NVARCHAR(20) DEFAULT 'Pending';
            END

            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'RequestedRole')
            BEGIN
                ALTER TABLE Users ADD RequestedRole NVARCHAR(50);
            END
        `);

        console.log('Ensuring existing users are approved...');
        await pool.request().query("UPDATE Users SET Status = 'Approved' WHERE Status IS NULL");

        console.log('Updating Users Role constraint...');
        await pool.request().query(`
            DECLARE @ConstraintName nvarchar(200)
            SELECT @ConstraintName = name FROM sys.check_constraints 
            WHERE parent_object_id = OBJECT_ID('Users') AND definition LIKE '%Role%'
            
            IF @ConstraintName IS NOT NULL
            BEGIN
                EXEC('ALTER TABLE Users DROP CONSTRAINT ' + @ConstraintName)
            END
            
            IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_Role')
            BEGIN
                ALTER TABLE Users ADD CONSTRAINT CK_Users_Role CHECK (Role IN ('Admin', 'Worker', 'Buyer', 'Pending', 'Super Admin'))
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
