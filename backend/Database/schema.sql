-- Table: Categories
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    Description VARCHAR(255)
);

-- Table: Suppliers
CREATE TABLE Suppliers (
    SupplierID INT IDENTITY(1,1) PRIMARY KEY,
    SupplierName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Address VARCHAR(200),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Table: Warehouses
CREATE TABLE Warehouses (
    WarehouseID INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseName VARCHAR(100) NOT NULL,
    Location VARCHAR(200)
);

-- Table: Users
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL DEFAULT 'Staff',
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Table: Staff
CREATE TABLE Staff (
    StaffID INT IDENTITY(1,1) PRIMARY KEY,
    StaffName VARCHAR(100),
    Role VARCHAR(50),
    Phone VARCHAR(20),
    Email VARCHAR(100),
    HireDate DATE,
    UserID INT NULL UNIQUE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL
);

-- Table: Products
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    SKU VARCHAR(50) UNIQUE,
    CategoryID INT,
    SupplierID INT,
    CostPrice DECIMAL(10,2) CHECK (CostPrice >= 0),
    SellingPrice DECIMAL(10,2) CHECK (SellingPrice >= 0),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID)
);

-- Table: Inventory
CREATE TABLE Inventory (
    InventoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    WarehouseID INT NOT NULL,
    Quantity INT DEFAULT 0,
    ReorderLevel INT DEFAULT 5,
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    UNIQUE (ProductID, WarehouseID)
);

-- Table: Customers
CREATE TABLE Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName VARCHAR(100) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    Address VARCHAR(200),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Table: Orders
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT,
    StaffID INT,
    OrderDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
    DiscountAmount DECIMAL(10,2) DEFAULT 0.00 CHECK (DiscountAmount >= 0),
    TaxRate DECIMAL(5,4) DEFAULT 0.0000 CHECK (TaxRate BETWEEN 0 AND 1),
    TotalAmount DECIMAL(10,2),
    CreatedByUserID INT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID),
    FOREIGN KEY (CreatedByUserID) REFERENCES Users(UserID)
);

-- Table: OrderItems
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    SubTotal AS (Quantity * UnitPrice),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- Table: Payments
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT,
    PaymentDate DATETIME DEFAULT GETDATE(),
    PaymentMethod VARCHAR(50),
    Amount DECIMAL(10,2),
    Status VARCHAR(20) CHECK (Status IN ('Pending', 'Completed', 'Failed', 'Refunded')),
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);

-- Table: Returns
CREATE TABLE Returns (
    ReturnID INT IDENTITY(1,1) PRIMARY KEY,
    OrderItemID INT,
    ReturnDate DATETIME DEFAULT GETDATE(),
    Quantity INT,
    Reason VARCHAR(255),
    RefundAmount DECIMAL(10,2),
    FOREIGN KEY (OrderItemID) REFERENCES OrderItems(OrderItemID)
);

-- Table: InventoryTransactions
CREATE TABLE InventoryTransactions (
    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT,
    WarehouseID INT,
    Quantity INT NOT NULL,
    TransactionType VARCHAR(20) CHECK (TransactionType IN ('Purchase', 'Sale', 'Return', 'Adjustment', 'Transfer')),
    ReferenceID INT,
    TransactionDate DATETIME DEFAULT GETDATE(),
    CreatedByUserID INT NULL,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    FOREIGN KEY (CreatedByUserID) REFERENCES Users(UserID)
);

GO
CREATE TRIGGER trg_Return_Inventory
ON Returns
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE inv
    SET
        inv.Quantity = inv.Quantity + i.Quantity,
        inv.LastUpdated = GETDATE()
    FROM Inventory inv
    JOIN OrderItems oi ON oi.ProductID = inv.ProductID
    JOIN inserted i ON i.OrderItemID = oi.OrderItemID;
    INSERT INTO InventoryTransactions
        (ProductID, WarehouseID, Quantity, TransactionType, ReferenceID, CreatedByUserID)
    SELECT
        oi.ProductID,
        inv.WarehouseID,
        i.Quantity,
        'Return',
        i.ReturnID,
        NULL
    FROM inserted i
    JOIN OrderItems oi ON oi.OrderItemID = i.OrderItemID
    JOIN Inventory inv ON inv.ProductID = oi.ProductID;
END;
GO

CREATE INDEX IX_Orders_CustomerID ON Orders(CustomerID);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate);
CREATE INDEX IX_OrderItems_OrderID ON OrderItems(OrderID);
CREATE INDEX IX_OrderItems_ProductID ON OrderItems(ProductID);
CREATE INDEX IX_Inventory_ProductID ON Inventory(ProductID);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_Payments_OrderID ON Payments(OrderID);