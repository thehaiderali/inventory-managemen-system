-- Table : Categories
CREATE TABLE Categories(
	CategoryID INT IDENTITY(1,1) PRIMARY KEY,
	CategoryName VARCHAR(100) NOT NULL,
	Description VARCHAR(255)
);
 
-- Table : Suppliers
CREATE TABLE Suppliers(
	SupplierID INT IDENTITY(1,1) PRIMARY KEY,
	SupplierName VARCHAR(100) NOT NULL,
	Phone VARCHAR(20),
	Email VARCHAR(100),
	Address VARCHAR(200),
	CreatedAt DATETIME DEFAULT GETDATE()
);
 
-- Table : Warehouses
CREATE TABLE Warehouses(
	WarehouseID INT IDENTITY(1,1) PRIMARY KEY,
	WarehouseName VARCHAR(100) NOT NULL,
	Location VARCHAR(200)
);
 
-- Table : Users
CREATE TABLE Users(
	UserID INT IDENTITY(1,1) PRIMARY KEY,
	Username VARCHAR(100) NOT NULL UNIQUE,
	Email VARCHAR(100) NOT NULL UNIQUE,
	PasswordHash VARCHAR(255) NOT NULL,
	Role VARCHAR(50) NOT NULL DEFAULT 'Staff',  --'Admin', 'Manager', 'Staff'--
	IsActive BIT DEFAULT 1,
	CreatedAt DATETIME DEFAULT GETDATE()
);
 
-- Table : Staff
CREATE TABLE Staff(
	StaffID INT IDENTITY(1,1) PRIMARY KEY,
	StaffName VARCHAR(100),
	Role VARCHAR(50),
	Phone VARCHAR(20),
	Email VARCHAR(100),
	HireDate DATE,
	UserID INT NULL UNIQUE,
	FOREIGN KEY(UserID) REFERENCES Users(UserID) ON DELETE SET NULL
);
 
-- Table : Products
CREATE TABLE Products(
	ProductID INT IDENTITY(1,1) PRIMARY KEY,
	ProductName VARCHAR(100) NOT NULL,
	SKU VARCHAR(50) UNIQUE,
	CategoryID INT,
	SupplierID INT,
	CostPrice DECIMAL(10,2),
	SellingPrice DECIMAL(10,2),
	IsActive BIT DEFAULT 1,
	CreatedAt DATETIME DEFAULT GETDATE(),
	FOREIGN KEY(CategoryID) REFERENCES Categories(CategoryID),
	FOREIGN KEY(SupplierID) REFERENCES Suppliers(SupplierID)
);
 
-- Table : Inventory
CREATE TABLE Inventory(
	InventoryID INT IDENTITY(1,1) PRIMARY KEY,
	ProductID INT NOT NULL,
	WarehouseID INT NOT NULL,
	Quantity INT DEFAULT 0,
	ReorderLevel INT DEFAULT 5,
	LastUpdated DATETIME DEFAULT GETDATE(),
	FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
	FOREIGN KEY(WarehouseID) REFERENCES Warehouses(WarehouseID),
	UNIQUE(ProductID, WarehouseID)
);
 
-- Table : Customers
CREATE TABLE Customers(
	CustomerID INT IDENTITY(1,1) PRIMARY KEY,
	CustomerName VARCHAR(100) NOT NULL,
	Phone VARCHAR(20),
	Email VARCHAR(100),
	Address VARCHAR(200),
	CreatedAt DATETIME DEFAULT GETDATE()
);
 
-- Table : Orders
CREATE TABLE Orders(
	OrderID INT IDENTITY(1,1) PRIMARY KEY,
	CustomerID INT,
	StaffID INT,
	OrderDate DATETIME DEFAULT GETDATE(),
	Status VARCHAR(20) DEFAULT 'Pending',
	TotalAmount DECIMAL(10,2),
	CreatedByUserID INT NULL,
	FOREIGN KEY(CustomerID) REFERENCES Customers(CustomerID),
	FOREIGN KEY(StaffID) REFERENCES Staff(StaffID),
	FOREIGN KEY(CreatedByUserID) REFERENCES Users(UserID)
);
 
-- Table : OrderItems
CREATE TABLE OrderItems(
	OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
	OrderID INT NOT NULL,
	ProductID INT NOT NULL,
	Quantity INT NOT NULL,
	UnitPrice DECIMAL(10,2) NOT NULL,
	SubTotal AS (Quantity * UnitPrice),
	FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
	FOREIGN KEY(ProductID) REFERENCES Products(ProductID)
);
 
-- Table : Payments
CREATE TABLE Payments(
	PaymentID INT IDENTITY(1,1) PRIMARY KEY,
	OrderID INT,
	PaymentDate DATETIME DEFAULT GETDATE(),
	PaymentMethod VARCHAR(50),
	Amount DECIMAL(10,2),
	Status VARCHAR(20),
	FOREIGN KEY(OrderID) REFERENCES Orders(OrderID)
);
 
-- Table : Returns
CREATE TABLE Returns(
	ReturnID INT IDENTITY(1,1) PRIMARY KEY,
	OrderItemID INT,
	ReturnDate DATETIME DEFAULT GETDATE(),
	Quantity INT,
	Reason VARCHAR(255),
	RefundAmount DECIMAL(10,2),
	FOREIGN KEY(OrderItemID) REFERENCES OrderItems(OrderItemID)
);
 
-- Table : InventoryTransactions
CREATE TABLE InventoryTransactions(
	TransactionID INT IDENTITY(1,1) PRIMARY KEY,
	ProductID INT,
	WarehouseID INT,
	Quantity INT,
	TransactionType VARCHAR(20),
	ReferenceID INT,
	TransactionDate DATETIME DEFAULT GETDATE(),
	CreatedByUserID INT NULL,
	FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
	FOREIGN KEY(WarehouseID) REFERENCES Warehouses(WarehouseID),
	FOREIGN KEY(CreatedByUserID) REFERENCES Users(UserID)
);


