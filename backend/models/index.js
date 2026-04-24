import { connectDB, sql } from '../config/db.js';

const Category = {
  async findAll() {
    const pool = await connectDB();
    const result = await pool.request().query(`SELECT * FROM Categories`);
    return result.recordset;
  },
  async findById(id) {
    const pool = await connectDB();
    const result = await pool.request().input('CategoryID', sql.Int, id).query(`SELECT * FROM Categories WHERE CategoryID = @CategoryID`);
    return result.recordset[0];
  },
  async create({ categoryName, description }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('CategoryName', sql.VarChar, categoryName)
      .input('Description',  sql.VarChar, description)
      .query(`INSERT INTO Categories (CategoryName, Description) OUTPUT INSERTED.* VALUES (@CategoryName, @Description)`);
    return result.recordset[0];
  },
  async update(id, { categoryName, description }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('CategoryID',   sql.Int,     id)
      .input('CategoryName', sql.VarChar, categoryName)
      .input('Description',  sql.VarChar, description)
      .query(`UPDATE Categories SET CategoryName = COALESCE(@CategoryName, CategoryName), Description = COALESCE(@Description, Description) OUTPUT INSERTED.* WHERE CategoryID = @CategoryID`);
    return result.recordset[0];
  },
  async delete(id) {
    const pool = await connectDB();
    await pool.request().input('CategoryID', sql.Int, id).query(`DELETE FROM Categories WHERE CategoryID = @CategoryID`);
  },
};

const Supplier = {
  async findAll() {
    const pool = await connectDB();
    const result = await pool.request().query(`SELECT * FROM Suppliers`);
    return result.recordset;
  },
  async findById(id) {
    const pool = await connectDB();
    const result = await pool.request().input('SupplierID', sql.Int, id).query(`SELECT * FROM Suppliers WHERE SupplierID = @SupplierID`);
    return result.recordset[0];
  },
  async create({ supplierName, phone, email, address }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('SupplierName', sql.VarChar, supplierName)
      .input('Phone',        sql.VarChar, phone)
      .input('Email',        sql.VarChar, email)
      .input('Address',      sql.VarChar, address)
      .query(`INSERT INTO Suppliers (SupplierName, Phone, Email, Address) OUTPUT INSERTED.* VALUES (@SupplierName, @Phone, @Email, @Address)`);
    return result.recordset[0];
  },
  async update(id, { supplierName, phone, email, address }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('SupplierID',   sql.Int,     id)
      .input('SupplierName', sql.VarChar, supplierName)
      .input('Phone',        sql.VarChar, phone)
      .input('Email',        sql.VarChar, email)
      .input('Address',      sql.VarChar, address)
      .query(`UPDATE Suppliers SET SupplierName = COALESCE(@SupplierName, SupplierName), Phone = COALESCE(@Phone, Phone), Email = COALESCE(@Email, Email), Address = COALESCE(@Address, Address) OUTPUT INSERTED.* WHERE SupplierID = @SupplierID`);
    return result.recordset[0];
  },
  async delete(id) {
    const pool = await connectDB();
    await pool.request().input('SupplierID', sql.Int, id).query(`DELETE FROM Suppliers WHERE SupplierID = @SupplierID`);
  },
};

const Warehouse = {
  async findAll() {
    const pool = await connectDB();
    const result = await pool.request().query(`SELECT * FROM Warehouses`);
    return result.recordset;
  },
  async findById(id) {
    const pool = await connectDB();
    const result = await pool.request().input('WarehouseID', sql.Int, id).query(`SELECT * FROM Warehouses WHERE WarehouseID = @WarehouseID`);
    return result.recordset[0];
  },
  async create({ warehouseName, location }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('WarehouseName', sql.VarChar, warehouseName)
      .input('Location',      sql.VarChar, location)
      .query(`INSERT INTO Warehouses (WarehouseName, Location) OUTPUT INSERTED.* VALUES (@WarehouseName, @Location)`);
    return result.recordset[0];
  },
  async update(id, { warehouseName, location }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('WarehouseID',   sql.Int,     id)
      .input('WarehouseName', sql.VarChar, warehouseName)
      .input('Location',      sql.VarChar, location)
      .query(`UPDATE Warehouses SET WarehouseName = COALESCE(@WarehouseName, WarehouseName), Location = COALESCE(@Location, Location) OUTPUT INSERTED.* WHERE WarehouseID = @WarehouseID`);
    return result.recordset[0];
  },
  async delete(id) {
    const pool = await connectDB();
    await pool.request().input('WarehouseID', sql.Int, id).query(`DELETE FROM Warehouses WHERE WarehouseID = @WarehouseID`);
  },
};

const Customer = {
  async findAll() {
    const pool = await connectDB();
    const result = await pool.request().query(`SELECT * FROM Customers`);
    return result.recordset;
  },
  async findById(id) {
    const pool = await connectDB();
    const result = await pool.request().input('CustomerID', sql.Int, id).query(`SELECT * FROM Customers WHERE CustomerID = @CustomerID`);
    return result.recordset[0];
  },
  async create({ customerName, phone, email, address }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('CustomerName', sql.VarChar, customerName)
      .input('Phone',        sql.VarChar, phone)
      .input('Email',        sql.VarChar, email)
      .input('Address',      sql.VarChar, address)
      .query(`INSERT INTO Customers (CustomerName, Phone, Email, Address) OUTPUT INSERTED.* VALUES (@CustomerName, @Phone, @Email, @Address)`);
    return result.recordset[0];
  },
  async update(id, { customerName, phone, email, address }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('CustomerID',   sql.Int,     id)
      .input('CustomerName', sql.VarChar, customerName)
      .input('Phone',        sql.VarChar, phone)
      .input('Email',        sql.VarChar, email)
      .input('Address',      sql.VarChar, address)
      .query(`UPDATE Customers SET CustomerName = COALESCE(@CustomerName, CustomerName), Phone = COALESCE(@Phone, Phone), Email = COALESCE(@Email, Email), Address = COALESCE(@Address, Address) OUTPUT INSERTED.* WHERE CustomerID = @CustomerID`);
    return result.recordset[0];
  },
  async delete(id) {
    const pool = await connectDB();
    await pool.request().input('CustomerID', sql.Int, id).query(`DELETE FROM Customers WHERE CustomerID = @CustomerID`);
  },
};

const Inventory = {
  async findAll() {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT i.*, p.ProductName, p.SKU, w.WarehouseName
      FROM Inventory i
      JOIN Products   p ON p.ProductID   = i.ProductID
      JOIN Warehouses w ON w.WarehouseID = i.WarehouseID
    `);
    return result.recordset;
  },
  async findLowStock() {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT i.*, p.ProductName, p.SKU, w.WarehouseName
      FROM Inventory i
      JOIN Products   p ON p.ProductID   = i.ProductID
      JOIN Warehouses w ON w.WarehouseID = i.WarehouseID
      WHERE i.Quantity <= i.ReorderLevel
    `);
    return result.recordset;
  },
  async adjust({ productId, warehouseId, quantity, type, referenceId, createdByUserId }) {
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    // Check if inventory record exists
    const checkResult = await transaction.request()
      .input('ProductID', sql.Int, productId)
      .input('WarehouseID', sql.Int, warehouseId)
      .query(`SELECT * FROM Inventory WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID`);
    
    if (checkResult.recordset.length === 0) {
      // Create new inventory record if doesn't exist
      await transaction.request()
        .input('ProductID', sql.Int, productId)
        .input('WarehouseID', sql.Int, warehouseId)
        .input('Quantity', sql.Int, quantity > 0 ? quantity : 0)
        .input('ReorderLevel', sql.Int, 5)
        .query(`
          INSERT INTO Inventory (ProductID, WarehouseID, Quantity, ReorderLevel)
          VALUES (@ProductID, @WarehouseID, @Quantity, @ReorderLevel)
        `);
    } else {
      // Update existing inventory
      await transaction.request()
        .input('ProductID', sql.Int, productId)
        .input('WarehouseID', sql.Int, warehouseId)
        .input('Quantity', sql.Int, quantity)
        .query(`
          UPDATE Inventory SET Quantity = Quantity + @Quantity, LastUpdated = GETDATE()
          WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID
        `);
    }

    await transaction.request()
      .input('ProductID', sql.Int, productId)
      .input('WarehouseID', sql.Int, warehouseId)
      .input('Quantity', sql.Int, quantity)
      .input('TransactionType', sql.VarChar, type)
      .input('ReferenceID', sql.Int, referenceId)
      .input('CreatedByUserID', sql.Int, createdByUserId)
      .query(`
        INSERT INTO InventoryTransactions (ProductID, WarehouseID, Quantity, TransactionType, ReferenceID, CreatedByUserID)
        VALUES (@ProductID, @WarehouseID, @Quantity, @TransactionType, @ReferenceID, @CreatedByUserID)
      `);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
},
};

const Payment = {
  async findByOrder(orderId) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('OrderID', sql.Int, orderId)
      .query(`SELECT * FROM Payments WHERE OrderID = @OrderID`);
    return result.recordset;
  },
  async create({ orderId, paymentMethod, amount, status = 'Pending' }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('OrderID',       sql.Int,          orderId)
      .input('PaymentMethod', sql.VarChar,      paymentMethod)
      .input('Amount',        sql.Decimal(10,2), amount)
      .input('Status',        sql.VarChar,      status)
      .query(`INSERT INTO Payments (OrderID, PaymentMethod, Amount, Status) OUTPUT INSERTED.* VALUES (@OrderID, @PaymentMethod, @Amount, @Status)`);
    return result.recordset[0];
  },
  async updateStatus(id, status) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('PaymentID', sql.Int,     id)
      .input('Status',    sql.VarChar, status)
      .query(`UPDATE Payments SET Status = @Status OUTPUT INSERTED.* WHERE PaymentID = @PaymentID`);
    return result.recordset[0];
  },
};

const Return = {
  async create({ orderItemId, quantity, reason, refundAmount }) {
    const pool = await connectDB();
    await pool.request()
      .input('OrderItemID', sql.Int, orderItemId)
      .input('Quantity', sql.Int, quantity)
      .input('Reason', sql.VarChar, reason)
      .input('RefundAmount', sql.Decimal(10,2), refundAmount)
      .query(`INSERT INTO Returns (OrderItemID, Quantity, Reason, RefundAmount) VALUES (@OrderItemID, @Quantity, @Reason, @RefundAmount)`);
    
    const idResult = await pool.request().query(`SELECT SCOPE_IDENTITY() AS ReturnID`);
    const returnId = idResult.recordset[0].ReturnID;
    
    const returnResult = await pool.request()
      .input('ReturnID', sql.Int, returnId)
      .query(`
        SELECT r.*, oi.ProductID, oi.OrderID, p.ProductName
        FROM Returns r
        JOIN OrderItems oi ON oi.OrderItemID = r.OrderItemID
        JOIN Products p ON p.ProductID = oi.ProductID
        WHERE r.ReturnID = @ReturnID
      `);
    
    return returnResult.recordset[0];
  },
  async findAll() {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT r.*, oi.ProductID, oi.OrderID, p.ProductName
      FROM Returns r
      JOIN OrderItems oi ON oi.OrderItemID = r.OrderItemID
      JOIN Products p ON p.ProductID = oi.ProductID
    `);
    return result.recordset;
  },
};

export { Category, Supplier, Warehouse, Customer, Inventory, Payment, Return };