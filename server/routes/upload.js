const router = require('express').Router();
const multer = require('multer');
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
  }
});

// POST /api/upload — Upload image to Supabase Storage (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const ext = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return res.status(500).json({ error: 'Failed to upload image. Make sure the "item-images" bucket exists in Supabase Storage.' });
    }

    const { data: urlData } = supabase.storage
      .from('item-images')
      .getPublicUrl(data.path);

    res.json({ url: urlData.publicUrl, path: data.path });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload image.' });
  }
});

// DELETE /api/upload — Delete image from Supabase Storage (admin only)
router.delete('/', auth, async (req, res) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Image path is required.' });
    }

    const { error } = await supabase.storage
      .from('item-images')
      .remove([path]);

    if (error) throw error;
    res.json({ message: 'Image deleted successfully.' });
  } catch (err) {
    console.error('Delete image error:', err);
    res.status(500).json({ error: 'Failed to delete image.' });
  }
});

module.exports = router;
