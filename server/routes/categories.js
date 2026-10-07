const router = require('express').Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// GET /api/categories — List all categories with item counts
router.get('/', async (_req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    // Get item counts per category
    const { data: items } = await supabase
      .from('items')
      .select('category_id');

    const counts = {};
    if (items) {
      items.forEach(item => {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      });
    }

    const result = categories.map(cat => ({
      ...cat,
      item_count: counts[cat.id] || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// GET /api/categories/:id — Single category
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Category not found.' });

    res.json(data);
  } catch (err) {
    console.error('Get category error:', err);
    res.status(500).json({ error: 'Failed to fetch category.' });
  }
});

// POST /api/categories — Create category (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, icon, custom_fields } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description, icon: icon || 'box', custom_fields: custom_fields || [] }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id — Update category (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, icon, custom_fields } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Category not found.' });

    res.json(data[0]);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

// DELETE /api/categories/:id — Delete category (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

module.exports = router;
