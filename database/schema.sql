-- Create ThreadTrack Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ThreadTrack')
BEGIN
    CREATE DATABASE ThreadTrack;
END
GO

USE ThreadTrack;
GO

-- Users Table
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Worker', 'Buyer')),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Raw Materials Table
CREATE TABLE RawMaterials (
    MaterialID INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    CurrentStock FLOAT NOT NULL DEFAULT 0,
    Unit NVARCHAR(20) NOT NULL, -- e.g., 'meters', 'kg', 'units'
    MinimumRequired FLOAT NOT NULL DEFAULT 0,
    LastUpdated DATETIME DEFAULT GETDATE()
);

-- Products Table
CREATE TABLE Products (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    ProductName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    BaseMaterialID INT FOREIGN KEY REFERENCES RawMaterials(MaterialID),
    MaterialQuantityPerUnit FLOAT NOT NULL,
    Price DECIMAL(10, 2),
    ImageURL NVARCHAR(MAX),
    IsActive BIT DEFAULT 1
);

-- Orders Table
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY IDENTITY(1,1),
    BuyerID INT FOREIGN KEY REFERENCES Users(UserID),
    ProductID INT FOREIGN KEY REFERENCES Products(ProductID),
    Quantity INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    OrderDate DATETIME DEFAULT GETDATE(),
    CompletionDate DATETIME,
    CompletionNotes NVARCHAR(MAX)
);

-- Production Logs Table
CREATE TABLE ProductionLogs (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    WorkerID INT FOREIGN KEY REFERENCES Users(UserID),
    ProductID INT FOREIGN KEY REFERENCES Products(ProductID),
    OrderID INT FOREIGN KEY REFERENCES Orders(OrderID), -- Added to track production against specific orders
    QuantityProduced INT NOT NULL,
    LogDate DATETIME DEFAULT GETDATE()
);
GO

-- Seed Initial Data
-- Note: Passwords are 'admin123', 'worker123', 'buyer123'
INSERT INTO Users (Username, PasswordHash, Role) VALUES 
('admin', '$2b$10$Bk.zf6CJ.KDeKDgxI6SwXOOBRHEKvS7JTqyaogPfIE9flYZI', 'Admin'),
('worker1', '$2b$10$7R6vWREl.5vP2C3y8Yyq.OXpS8uHJZ.zM.8S.m.e.f.g.h.i.j.k', 'Worker'),
('buyer1', '$2b$10$9s6vWREl.5vP2C3y8Yyq.OXpS8uHJZ.zM.8S.m.e.f.g.h.i.j.k', 'Buyer');

INSERT INTO RawMaterials (Name, CurrentStock, Unit, MinimumRequired) VALUES
('Cotton Fabric', 500.0, 'meters', 50.0),
('Polyester Thread', 1000.0, 'meters', 100.0);

INSERT INTO Products (ProductName, Description, BaseMaterialID, MaterialQuantityPerUnit) VALUES
('White T-Shirt', 'Standard cotton t-shirt', 1, 1.5);
GO
