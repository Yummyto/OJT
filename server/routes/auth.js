const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const { data: admins, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .limit(1);

    if (error) throw error;
    if (!admins || admins.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me — Get current admin from token
router.get('/me', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, name, created_at')
      .eq('id', req.admin.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get admin error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/setup — Create first admin (only works if no admins exist)
router.post('/setup', async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Admin account already exists. Use login.' });
    }

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('admins')
      .insert([{ email: email.toLowerCase().trim(), password_hash, name }])
      .select('id, email, name');

    if (error) throw error;

    res.status(201).json({
      message: 'Admin created successfully!',
      admin: data[0]
    });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Server error during setup.' });
  }
});

module.exports = router;
