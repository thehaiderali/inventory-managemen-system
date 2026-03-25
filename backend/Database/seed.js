const sql = require("mssql");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });


const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};


async function seed() {
  let pool;

  try {
    console.log("🔌 Connecting to database...");
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to database!");

    
    console.log("📦 Seeding Categories...");
    await pool.request().query(`
      INSERT INTO Categories (CategoryName, Description) VALUES
      ('Electronics',       'Electronic devices and gadgets'),
      ('Clothing',          'Apparel and footwear'),
      ('Home & Garden',     'Household items and gardening tools'),
      ('Sports & Outdoors', 'Sports equipment and outdoor gear'),
      ('Books & Media',     'Books, DVDs, and digital media')
    `);
    console.log("✅ Categories seeded!");

    
    console.log("🏭 Seeding Suppliers...");
    await pool.request().query(`
      INSERT INTO Suppliers (SupplierName, Phone, Email, Address) VALUES
      ('TechWorld Supplies',    '1-800-123-4567', 'info@techworld.com',         '123 Tech Avenue, Silicon Valley, CA'),
      ('Fashion Imports Inc',   '1-800-234-5678', 'contact@fashionimports.com', '456 Style Street, New York, NY'),
      ('Global Home Solutions', '1-800-345-6789', 'sales@globalhome.com',       '789 Home Lane, Austin, TX'),
      ('Sports & Adventure Co', '1-800-456-7890', 'support@sportsadventure.com','321 Sport Boulevard, Denver, CO'),
      ('Digital Publishers Ltd','1-800-567-8901', 'info@digitalpub.com',        '654 Media Drive, Los Angeles, CA')
    `);
    console.log("✅ Suppliers seeded!");

    
    console.log("🏢 Seeding Warehouses...");
    await pool.request().query(`
      INSERT INTO Warehouses (WarehouseName, Location) VALUES
      ('Main Warehouse',   'New York, NY'),
      ('Central Hub',      'Chicago, IL'),
      ('West Coast Depot', 'Los Angeles, CA'),
      ('Southern Storage', 'Atlanta, GA')
    `);
    console.log("✅ Warehouses seeded!");

    
    console.log("👤 Seeding Users...");
    const saltRounds = 10;

    const users = [
    { username: "admin",   email: "admin@ims.local",          password: process.env.SEED_ADMIN_PASSWORD,   role: "Admin"   },
    { username: "manager", email: "manager@ims.local",        password: process.env.SEED_MANAGER_PASSWORD, role: "Manager" },
    { username: "staff1",  email: "staff1@ims.local",         password: process.env.SEED_STAFF_PASSWORD,   role: "Staff"   },
    { username: "alice",   email: "alice.cooper@company.com", password: process.env.SEED_ALICE_PASSWORD,   role: "Manager" },
    { username: "emma",    email: "emma.taylor@company.com",  password: process.env.SEED_EMMA_PASSWORD,    role: "Manager" },
    ];
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      console.log(`   🔐 Hashing password for ${user.username}...`);
      await pool
        .request()
        .input("username", sql.VarChar, user.username)
        .input("email",    sql.VarChar, user.email)
        .input("hash",     sql.VarChar, hashedPassword)
        .input("role",     sql.VarChar, user.role)
        .query(`
          INSERT INTO Users (Username, Email, PasswordHash, Role)
          VALUES (@username, @email, @hash, @role)
        `);
    }
    console.log("✅ Users seeded!");

    
    console.log("👷 Seeding Staff...");
    await pool.request().query(`
      INSERT INTO Staff (StaffName, Role, Phone, Email, HireDate, UserID) VALUES
      ('Alice Cooper', 'Manager',           '555-1001', 'alice.cooper@company.com', '2022-01-15', 4),
      ('Bob Johnson',  'Warehouse Staff',   '555-1002', 'bob.johnson@company.com',  '2022-06-20', NULL),
      ('Carol White',  'Sales Associate',   '555-1003', 'carol.white@company.com',  '2023-03-10', NULL),
      ('David Lee',    'Inventory Officer', '555-1004', 'david.lee@company.com',    '2023-01-05', NULL),
      ('Emma Taylor',  'Manager',           '555-1005', 'emma.taylor@company.com',  '2022-11-12', 5)
    `);
    console.log("✅ Staff seeded!");

    
    console.log("🛒 Seeding Products...");
    await pool.request().query(`
      INSERT INTO Products (ProductName, SKU, CategoryID, SupplierID, CostPrice, SellingPrice, IsActive) VALUES
      ('Laptop Pro 15',   'SKU-001', 1, 1, 600.00, 999.99, 1),
      ('Wireless Mouse',  'SKU-002', 1, 1,  15.00,  29.99, 1),
      ('USB-C Cable',     'SKU-003', 1, 1,   3.50,  12.99, 1),
      ('Cotton T-Shirt',  'SKU-004', 2, 2,   8.00,  24.99, 1),
      ('Denim Jeans',     'SKU-005', 2, 2,  25.00,  79.99, 1),
      ('Running Shoes',   'SKU-006', 2, 2,  35.00,  99.99, 1),
      ('LED Floor Lamp',  'SKU-007', 3, 3,  40.00,  89.99, 1),
      ('Garden Tool Set', 'SKU-008', 3, 3,  50.00, 129.99, 1),
      ('Yoga Mat',        'SKU-009', 4, 4,  20.00,  59.99, 1),
      ('Tennis Racket',   'SKU-010', 4, 4,  80.00, 199.99, 1),
      ('Bestseller Novel','SKU-011', 5, 5,  12.00,  24.99, 1),
      ('Programming Guide','SKU-012',5, 5,  40.00,  79.99, 1)
    `);
    console.log("✅ Products seeded!");

    
    console.log("🧑‍🤝‍🧑 Seeding Customers...");
    await pool.request().query(`
      INSERT INTO Customers (CustomerName, Phone, Email, Address) VALUES
      ('John Smith',      '555-0101', 'john.smith@email.com', '111 Main St, New York, NY'),
      ('Sarah Johnson',   '555-0102', 'sarah.j@email.com',    '222 Oak Ave, Los Angeles, CA'),
      ('Mike Davis',      '555-0103', 'mike.davis@email.com', '333 Elm St, Chicago, IL'),
      ('Emily Wilson',    '555-0104', 'emily.w@email.com',    '444 Pine Rd, Houston, TX'),
      ('Robert Brown',    '555-0105', 'rbrown@email.com',     '555 Maple Dr, Phoenix, AZ'),
      ('Jennifer Lee',    '555-0106', 'jlee@email.com',       '666 Cedar Ln, Philadelphia, PA'),
      ('William Martinez','555-0107', 'wmartinez@email.com',  '777 Birch Way, San Antonio, TX'),
      ('Lisa Anderson',   '555-0108', 'landerson@email.com',  '888 Spruce St, San Diego, CA')
    `);
    console.log("✅ Customers seeded!");

    
    console.log("📊 Seeding Inventory...");
    await pool.request().query(`
      INSERT INTO Inventory (ProductID, WarehouseID, Quantity, ReorderLevel) VALUES
      (1,  1, 45,  10),
      (1,  2, 30,  10),
      (2,  1, 200, 50),
      (2,  3, 150, 50),
      (3,  1, 500, 100),
      (4,  2, 300, 75),
      (5,  2, 150, 40),
      (6,  3, 120, 30),
      (7,  4, 80,  20),
      (8,  4, 60,  15),
      (9,  1, 250, 60),
      (10, 3, 90,  20),
      (11, 2, 180, 45),
      (12, 1, 75,  20)
    `);
    console.log("✅ Inventory seeded!");

    
    console.log("📋 Seeding Orders...");
    await pool.request().query(`
      INSERT INTO Orders (CustomerID, StaffID, OrderDate, Status, TotalAmount) VALUES
      (1, 1, '2024-01-10', 'Completed',  1029.97),
      (2, 3, '2024-01-12', 'Completed',   249.98),
      (3, 1, '2024-01-15', 'Shipped',    1299.97),
      (4, 2, '2024-01-18', 'Processing',  189.98),
      (5, 3, '2024-01-20', 'Completed',   359.97),
      (6, 1, '2024-01-22', 'Pending',     899.97),
      (7, 2, '2024-02-01', 'Completed',   449.97),
      (8, 3, '2024-02-05', 'Processing',  599.96)
    `);
    console.log("✅ Orders seeded!");

    
    console.log("🛍️  Seeding OrderItems...");
    await pool.request().query(`
      INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) VALUES
      (1,  1,  1, 999.99),
      (1,  2,  1,  29.99),
      (2,  4,  2,  24.99),
      (2,  11, 5,  24.99),
      (3,  1,  1, 999.99),
      (3,  12, 3,  79.99),
      (4,  6,  1,  99.99),
      (4,  9,  1,  89.99),
      (5,  10, 1, 199.99),
      (5,  5,  1,  79.99),
      (6,  7,  5,  89.99),
      (6,  8,  2, 129.99),
      (7,  3,  10, 12.99),
      (7,  4,  3,  24.99),
      (8,  2,  8,  29.99),
      (8,  6,  2,  99.99)
    `);
    console.log("✅ OrderItems seeded!");

    console.log("💳 Seeding Payments...");
    await pool.request().query(`
      INSERT INTO Payments (OrderID, PaymentDate, PaymentMethod, Amount, Status) VALUES
      (1, '2024-01-10', 'Credit Card', 1029.97, 'Completed'),
      (2, '2024-01-13', 'Debit Card',   249.98, 'Completed'),
      (3, '2024-01-15', 'Credit Card', 1299.97, 'Pending'),
      (4, '2024-01-19', 'PayPal',       189.98, 'Completed'),
      (5, '2024-01-21', 'Credit Card',  359.97, 'Completed'),
      (6, '2024-01-23', 'Debit Card',   899.97, 'Pending'),
      (7, '2024-02-02', 'Credit Card',  449.97, 'Completed'),
      (8, '2024-02-06', 'PayPal',       599.96, 'Processing')
    `);
    console.log("✅ Payments seeded!");

    console.log("↩️  Seeding Returns...");
    await pool.request().query(`
      INSERT INTO Returns (OrderItemID, ReturnDate, Quantity, Reason, RefundAmount) VALUES
      (2,  '2024-01-15', 1, 'Defective',    29.99),
      (8,  '2024-01-28', 1, 'Wrong size',   99.99),
      (10, '2024-02-02', 1, 'Changed mind', 79.99)
    `);
    console.log("✅ Returns seeded!");


    console.log("");
    console.log("🎉 Database seeded successfully!");

  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log("🔌 Database connection closed.");
    }
  }
}

seed();