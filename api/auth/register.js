const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const dbConfig = {
  server: 'team8-webbapp-server.database.windows.net',
  database: 'Team8-Webapp-db',
  user: 'webapp-admin',
  password: 'VfsaD.P47P_pa@gKZMZM',
  port: 1433,
  options: {
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: false
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'team8-webapp-super-secret-jwt-key-change-in-production-2024';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await sql.connect(dbConfig);

    // Check if user already exists
    const checkUserQuery = 'SELECT id FROM Users WHERE email = @email';
    const checkRequest = new sql.Request();
    checkRequest.input('email', sql.NVarChar, email);
    const existingUser = await checkRequest.query(checkUserQuery);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertQuery = `
      INSERT INTO Users (email, password_hash, created_at, updated_at) 
      VALUES (@email, @password_hash, GETDATE(), GETDATE());
      SELECT SCOPE_IDENTITY() as id;
    `;
    
    const insertRequest = new sql.Request();
    insertRequest.input('email', sql.NVarChar, email);
    insertRequest.input('password_hash', sql.NVarChar, hashedPassword);
    
    const result = await insertRequest.query(insertQuery);
    const userId = result.recordset[0].id;

    // Generate JWT token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, email }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await sql.close();
  }
}