// Simple registration for Vercel Functions (no external dependencies)
import crypto from 'crypto';

// Simple password hashing using built-in crypto
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Simple base64 encoding for basic token
function createSimpleToken(payload) {
  const header = { alg: 'none', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedHeader}.${encodedPayload}.`;
}

// Temporary in-memory storage (for testing - replace with database)
const users = new Map();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

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

    // Check if user already exists in memory storage
    if (users.has(email)) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const salt = crypto.randomBytes(32).toString('hex');
    const hashedPassword = hashPassword(password, salt);

    // Create user
    const userId = Math.floor(Math.random() * 1000000);
    const newUser = {
      id: userId,
      email: email,
      password_hash: hashedPassword,
      salt: salt,
      created_at: new Date().toISOString()
    };

    // Store user in memory (temporary solution)
    users.set(email, newUser);

    // Generate token
    const tokenPayload = { 
      userId: userId, 
      email: email, 
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    const token = createSimpleToken(tokenPayload);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: userId, email: email }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}