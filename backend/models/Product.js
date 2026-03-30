import { connectDB, sql } from '../config/db.js';

const Product = {
  async findAll({ categoryId, supplierId, isActive } = {}) {
    const pool = await connectDB();
    const req = pool.request();
    let where = 'WHERE 1=1';
    if (categoryId !== undefined) { req.input('CategoryID', sql.Int, categoryId); where += ' AND p.CategoryID = @CategoryID'; }
    if (supplierId !== undefined) { req.input('SupplierID', sql.Int, supplierId); where += ' AND p.SupplierID = @SupplierID'; }
    if (isActive   !== undefined) { req.input('IsActive',   sql.Bit, isActive);   where += ' AND p.IsActive = @IsActive'; }

    const result = await req.query(`
      SELECT p.*, c.CategoryName, s.SupplierName
      FROM Products p
      LEFT JOIN Categories c ON c.CategoryID = p.CategoryID
      LEFT JOIN Suppliers  s ON s.SupplierID = p.SupplierID
      ${where}
    `);
    return result.recordset;
  },

  async findById(id) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('ProductID', sql.Int, id)
      .query(`
        SELECT p.*, c.CategoryName, s.SupplierName
        FROM Products p
        LEFT JOIN Categories c ON c.CategoryID = p.CategoryID
        LEFT JOIN Suppliers  s ON s.SupplierID = p.SupplierID
        WHERE p.ProductID = @ProductID
      `);
    return result.recordset[0];
  },

  async create({ productName, sku, categoryId, supplierId, costPrice, sellingPrice }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('ProductName',  sql.VarChar,      productName)
      .input('SKU',          sql.VarChar,      sku)
      .input('CategoryID',   sql.Int,          categoryId)
      .input('SupplierID',   sql.Int,          supplierId)
      .input('CostPrice',    sql.Decimal(10,2), costPrice)
      .input('SellingPrice', sql.Decimal(10,2), sellingPrice)
      .query(`
        INSERT INTO Products (ProductName, SKU, CategoryID, SupplierID, CostPrice, SellingPrice)
        OUTPUT INSERTED.*
        VALUES (@ProductName, @SKU, @CategoryID, @SupplierID, @CostPrice, @SellingPrice)
      `);
    return result.recordset[0];
  },

  async update(id, { productName, sku, categoryId, supplierId, costPrice, sellingPrice, isActive }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('ProductID',    sql.Int,          id)
      .input('ProductName',  sql.VarChar,      productName)
      .input('SKU',          sql.VarChar,      sku)
      .input('CategoryID',   sql.Int,          categoryId)
      .input('SupplierID',   sql.Int,          supplierId)
      .input('CostPrice',    sql.Decimal(10,2), costPrice)
      .input('SellingPrice', sql.Decimal(10,2), sellingPrice)
      .input('IsActive',     sql.Bit,          isActive)
      .query(`
        UPDATE Products SET
          ProductName  = COALESCE(@ProductName,  ProductName),
          SKU          = COALESCE(@SKU,          SKU),
          CategoryID   = COALESCE(@CategoryID,   CategoryID),
          SupplierID   = COALESCE(@SupplierID,   SupplierID),
          CostPrice    = COALESCE(@CostPrice,    CostPrice),
          SellingPrice = COALESCE(@SellingPrice, SellingPrice),
          IsActive     = COALESCE(@IsActive,     IsActive)
        OUTPUT INSERTED.*
        WHERE ProductID = @ProductID
      `);
    return result.recordset[0];
  },

  async delete(id) {
    const pool = await connectDB();
    await pool.request()
      .input('ProductID', sql.Int, id)
      .query(`UPDATE Products SET IsActive = 0 WHERE ProductID = @ProductID`);
  },
};

export default Product;