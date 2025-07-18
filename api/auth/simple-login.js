// Simple login without external dependencies for Vercel Functions
const JWT_SECRET = process.env.JWT_SECRET || 'team8-webapp-super-secret-jwt-key-change-in-production-2024';

// Temporary users for testing (replace with database in production)
const users = [
  { id: 1, email: 'test@test.com', password: 'test123' },
  { id: 2, email: 'admin@team8.se', password: 'admin123' }
];

// Simple base64 encoding for basic token (not secure, just for testing)
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

    // Find user (simple check for testing)
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate simple token
    const tokenPayload = { 
      userId: user.id, 
      email: user.email, 
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    const token = createSimpleToken(tokenPayload);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}