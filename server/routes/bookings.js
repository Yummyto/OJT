const router = require('express').Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// GET /api/bookings — List all (admin) or filter by student
router.get('/', async (req, res) => {
  try {
    const { status, student_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('bookings')
      .select('*, items(id, name, images, location)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (student_id) query = query.eq('student_id', student_id);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      bookings: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// GET /api/bookings/student/:studentId — By student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, items(id, name, images, location)')
      .eq('student_id', req.params.studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get student bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch student bookings.' });
  }
});

// POST /api/bookings — Create booking (student)
router.post('/', async (req, res) => {
  try {
    const {
      item_id, student_id, student_name, student_email,
      student_department, purpose, quantity, start_date, end_date
    } = req.body;

    if (!item_id || !student_id || !student_name || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Item, student ID, student name, start date, and end date are required.'
      });
    }

    // Check item availability
    const { data: item } = await supabase
      .from('items')
      .select('available_quantity, allow_booking, name')
      .eq('id', item_id)
      .single();

    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (!item.allow_booking) return res.status(400).json({ error: 'This item is not available for booking.' });

    // Check for overlapping bookings
    const { data: overlapping } = await supabase
      .from('bookings')
      .select('id')
      .eq('item_id', item_id)
      .in('status', ['pending', 'approved'])
      .lte('start_date', end_date)
      .gte('end_date', start_date);

    const totalBooked = overlapping ? overlapping.length * (quantity || 1) : 0;
    if (item.available_quantity - totalBooked < (quantity || 1)) {
      return res.status(400).json({ error: 'Item not available for the selected dates.' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        item_id, student_id, student_name, student_email,
        student_department, purpose, quantity: quantity || 1,
        start_date, end_date, status: 'pending'
      }])
      .select('*, items(id, name, images)');

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});

// PUT /api/bookings/:id/status — Update status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updateData = { status };
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, items(id, name, images)');

    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Booking not found.' });

    res.json(data[0]);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
});

module.exports = router;
