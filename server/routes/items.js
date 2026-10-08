const router = require('express').Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// GET /api/items — List items with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { category_id, search, available, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('items')
      .select('*, categories(id, name, icon)', { count: 'exact' });

    if (category_id) query = query.eq('category_id', category_id);
    if (available === 'true') query = query.eq('is_available', true);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      items: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (err) {
    console.error('Get items error:', err);
    res.status(500).json({ error: 'Failed to fetch items.' });
  }
});

// GET /api/items/:id — Single item with full details
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*, categories(id, name, icon, custom_fields)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Item not found.' });

    res.json(data);
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Failed to fetch item.' });
  }
});

// POST /api/items — Create item (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, category_id, description, quantity, condition,
      location, images, custom_data, allow_booking, allow_borrowing
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Item name is required.' });
    }

    const newItem = {
      name,
      category_id: category_id || null,
      description: description || '',
      quantity: quantity || 1,
      available_quantity: quantity || 1,
      condition: condition || 'Good',
      location: location || '',
      images: images || [],
      custom_data: custom_data || {},
      is_available: true,
      allow_booking: allow_booking !== false,
      allow_borrowing: allow_borrowing !== false
    };

    const { data, error } = await supabase
      .from('items')
      .insert([newItem])
      .select('*, categories(id, name, icon)');

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Failed to create item.' });
  }
});

// PUT /api/items/:id — Update item (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name, category_id, description, quantity, available_quantity,
      condition, location, images, custom_data, is_available,
      allow_booking, allow_borrowing
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (available_quantity !== undefined) updateData.available_quantity = available_quantity;
    if (condition !== undefined) updateData.condition = condition;
    if (location !== undefined) updateData.location = location;
    if (images !== undefined) updateData.images = images;
    if (custom_data !== undefined) updateData.custom_data = custom_data;
    if (is_available !== undefined) updateData.is_available = is_available;
    if (allow_booking !== undefined) updateData.allow_booking = allow_booking;
    if (allow_borrowing !== undefined) updateData.allow_borrowing = allow_borrowing;

    const { data, error } = await supabase
      .from('items')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, categories(id, name, icon)');

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Item not found.' });

    res.json(data[0]);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

// DELETE /api/items/:id — Delete item (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;
