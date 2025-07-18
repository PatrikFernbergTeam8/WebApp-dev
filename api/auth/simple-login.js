// Simple login without external dependencies for Vercel Functions
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'team8-webapp-super-secret-jwt-key-change-in-production-2024';

// Hardcoded test users + registered users from memory
const testUsers = [
  { id: 1, email: 'test@test.com', password: 'test123' },
  { id: 2, email: 'admin@team8.se', password: 'admin123' }
];

// This should be shared with registration (in real app, use database)
const registeredUsers = new Map();

// Password verification
function verifyPassword(password, hash, salt) {
  const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return computedHash === hash;
}

// Simple base64 encoding for basic token
function createSimpleToken(payload) {
  const header = { alg: 'none', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encodedHeader}.${encodedPayload}.`;
}

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

    // First check test users (simple password check)
    const testUser = testUsers.find(u => u.email === email && u.password === password);
    
    if (testUser) {
      const tokenPayload = { 
        userId: testUser.id, 
        email: testUser.email, 
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };
      const token = createSimpleToken(tokenPayload);

      return res.json({
        message: 'Login successful',
        token,
        user: { id: testUser.id, email: testUser.email }
      });
    }

    // Then check registered users (hashed password check)
    const registeredUser = registeredUsers.get(email);
    
    if (registeredUser && verifyPassword(password, registeredUser.password_hash, registeredUser.salt)) {
      const tokenPayload = { 
        userId: registeredUser.id, 
        email: registeredUser.email, 
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
      };
      const token = createSimpleToken(tokenPayload);

      return res.json({
        message: 'Login successful',
        token,
        user: { id: registeredUser.id, email: registeredUser.email }
      });
    }

    // No user found
    return res.status(401).json({ error: 'Invalid email or password' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}