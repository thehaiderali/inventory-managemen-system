import { connectDB, sql } from '../config/db.js';

const Order = {
  async findAll({ status, customerId } = {}) {
    const pool = await connectDB();
    const req = pool.request();
    let where = 'WHERE 1=1';
    if (status)     { req.input('Status',     sql.VarChar, status);     where += ' AND o.Status = @Status'; }
    if (customerId) { req.input('CustomerID', sql.Int,     customerId); where += ' AND o.CustomerID = @CustomerID'; }

    const result = await req.query(`
      SELECT o.*, c.CustomerName, s.StaffName
      FROM Orders o
      LEFT JOIN Customers c ON c.CustomerID = o.CustomerID
      LEFT JOIN Staff     s ON s.StaffID    = o.StaffID
      ${where}
      ORDER BY o.OrderDate DESC
    `);
    return result.recordset;
  },

  async findById(id) {
    const pool = await connectDB();
    const orderResult = await pool.request()
      .input('OrderID', sql.Int, id)
      .query(`
        SELECT o.*, c.CustomerName, s.StaffName
        FROM Orders o
        LEFT JOIN Customers c ON c.CustomerID = o.CustomerID
        LEFT JOIN Staff     s ON s.StaffID    = o.StaffID
        WHERE o.OrderID = @OrderID
      `);

    const itemsResult = await pool.request()
      .input('OrderID', sql.Int, id)
      .query(`
        SELECT oi.*, p.ProductName, p.SKU
        FROM OrderItems oi
        JOIN Products p ON p.ProductID = oi.ProductID
        WHERE oi.OrderID = @OrderID
      `);

    const order = orderResult.recordset[0];
    if (order) order.items = itemsResult.recordset;
    return order;
  },

  async create({ customerId, staffId, discountAmount = 0, taxRate = 0, createdByUserId, items }) {
    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Calculate total
      let subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const totalAmount = (subtotal - discountAmount) * (1 + taxRate);

      // Insert order
      const orderResult = await transaction.request()
        .input('CustomerID',      sql.Int,          customerId)
        .input('StaffID',         sql.Int,          staffId)
        .input('DiscountAmount',  sql.Decimal(10,2), discountAmount)
        .input('TaxRate',         sql.Decimal(5,4),  taxRate)
        .input('TotalAmount',     sql.Decimal(10,2), totalAmount)
        .input('CreatedByUserID', sql.Int,          createdByUserId)
        .query(`
          INSERT INTO Orders (CustomerID, StaffID, DiscountAmount, TaxRate, TotalAmount, CreatedByUserID)
          OUTPUT INSERTED.OrderID
          VALUES (@CustomerID, @StaffID, @DiscountAmount, @TaxRate, @TotalAmount, @CreatedByUserID)
        `);

      const orderId = orderResult.recordset[0].OrderID;

      // Insert order items & deduct inventory
      for (const item of items) {
        await transaction.request()
          .input('OrderID',   sql.Int,          orderId)
          .input('ProductID', sql.Int,          item.productId)
          .input('Quantity',  sql.Int,          item.quantity)
          .input('UnitPrice', sql.Decimal(10,2), item.unitPrice)
          .query(`
            INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice)
            VALUES (@OrderID, @ProductID, @Quantity, @UnitPrice)
          `);

        // Deduct from inventory
        await transaction.request()
          .input('ProductID', sql.Int, item.productId)
          .input('Quantity',  sql.Int, item.quantity)
          .query(`
            UPDATE Inventory SET
              Quantity    = Quantity - @Quantity,
              LastUpdated = GETDATE()
            WHERE ProductID = @ProductID
          `);

        // Log inventory transaction
        await transaction.request()
          .input('ProductID',       sql.Int,     item.productId)
          .input('Quantity',        sql.Int,     item.quantity)
          .input('ReferenceID',     sql.Int,     orderId)
          .input('CreatedByUserID', sql.Int,     createdByUserId)
          .query(`
            INSERT INTO InventoryTransactions (ProductID, WarehouseID, Quantity, TransactionType, ReferenceID, CreatedByUserID)
            SELECT @ProductID, WarehouseID, @Quantity, 'Sale', @ReferenceID, @CreatedByUserID
            FROM Inventory WHERE ProductID = @ProductID
          `);
      }

      await transaction.commit();
      return this.findById(orderId);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async updateStatus(id, status) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('OrderID', sql.Int,     id)
      .input('Status',  sql.VarChar, status)
      .query(`
        UPDATE Orders SET Status = @Status
        OUTPUT INSERTED.*
        WHERE OrderID = @OrderID
      `);
    return result.recordset[0];
  },
};

export default Order;