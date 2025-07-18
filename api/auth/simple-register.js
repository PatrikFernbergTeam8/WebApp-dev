// Simple registration without external dependencies for Vercel Functions
const JWT_SECRET = process.env.JWT_SECRET || 'team8-webapp-super-secret-jwt-key-change-in-production-2024';

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

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // For testing - simulate successful registration
    // In production, you would check if user exists and save to database
    const newUser = {
      id: Math.floor(Math.random() * 1000000),
      email: email
    };

    // Generate simple token
    const tokenPayload = { 
      userId: newUser.id, 
      email: newUser.email, 
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    const token = createSimpleToken(tokenPayload);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: newUser.id, email: newUser.email }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}