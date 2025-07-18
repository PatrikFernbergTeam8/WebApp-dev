const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
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

// Connect to database
async function connectDB() {
  try {
    await sql.connect(dbConfig);
    console.log('✅ Connected to Azure SQL Database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

// JWT Secret (in production, use a secure random string)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Register user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

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
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const query = 'SELECT id, email, password_hash FROM Users WHERE email = @email';
    const request = new sql.Request();
    request.input('email', sql.NVarChar, email);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.recordset[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT id, email, created_at FROM Users WHERE id = @userId';
    const request = new sql.Request();
    request.input('userId', sql.Int, req.user.userId);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.recordset[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDB();
});

module.exports = app;