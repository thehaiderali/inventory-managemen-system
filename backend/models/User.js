import { connectDB, sql } from '../config/db.js';

const User = {
  async findAll() {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT UserID, Username, Email, Role, IsActive, CreatedAt FROM Users
    `);
    return result.recordset;
  },

  async findById(id) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('UserID', sql.Int, id)
      .query(`SELECT UserID, Username, Email, Role, IsActive, CreatedAt FROM Users WHERE UserID = @UserID`);
    return result.recordset[0];
  },

  async findByUsername(username) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('Username', sql.VarChar, username)
      .query(`SELECT * FROM Users WHERE Username = @Username`);
    return result.recordset[0];
  },

  async findByEmail(email) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('Email', sql.VarChar, email)
      .query(`SELECT * FROM Users WHERE Email = @Email`);
    return result.recordset[0];
  },

  async create({ username, email, passwordHash, role = 'Staff' }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('Username', sql.VarChar, username)
      .input('Email', sql.VarChar, email)
      .input('PasswordHash', sql.VarChar, passwordHash)
      .input('Role', sql.VarChar, role)
      .query(`
        INSERT INTO Users (Username, Email, PasswordHash, Role)
        OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Role, INSERTED.CreatedAt
        VALUES (@Username, @Email, @PasswordHash, @Role)
      `);
    return result.recordset[0];
  },

  async update(id, { username, email, role, isActive }) {
    const pool = await connectDB();
    const result = await pool.request()
      .input('UserID', sql.Int, id)
      .input('Username', sql.VarChar, username)
      .input('Email', sql.VarChar, email)
      .input('Role', sql.VarChar, role)
      .input('IsActive', sql.Bit, isActive)
      .query(`
        UPDATE Users SET
          Username = COALESCE(@Username, Username),
          Email = COALESCE(@Email, Email),
          Role = COALESCE(@Role, Role),
          IsActive = COALESCE(@IsActive, IsActive)
        OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Role, INSERTED.IsActive
        WHERE UserID = @UserID
      `);
    return result.recordset[0];
  },

  async delete(id) {
    const pool = await connectDB();
    await pool.request()
      .input('UserID', sql.Int, id)
      .query(`DELETE FROM Users WHERE UserID = @UserID`);
  },

  async updateLastLogin(userId) {
    const pool = await connectDB();
    await pool.request()
      .input('UserID', sql.Int, userId)
      .query(`UPDATE Users SET LastLogin = GETDATE() WHERE UserID = @UserID`);
  }
};

export default User;