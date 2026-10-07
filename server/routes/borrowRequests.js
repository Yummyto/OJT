const router = require('express').Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// GET /api/borrow-requests — List all (admin) or filter by student
router.get('/', async (req, res) => {
  try {
    const { status, student_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('borrow_requests')
      .select('*, items(id, name, images, location)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (student_id) query = query.eq('student_id', student_id);

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      requests: data,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit))
    });
  } catch (err) {
    console.error('Get borrow requests error:', err);
    res.status(500).json({ error: 'Failed to fetch borrow requests.' });
  }
});

// GET /api/borrow-requests/student/:studentId — Get all requests by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('borrow_requests')
      .select('*, items(id, name, images, location)')
      .eq('student_id', req.params.studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get student requests error:', err);
    res.status(500).json({ error: 'Failed to fetch student requests.' });
  }
});

// POST /api/borrow-requests — Create borrow request (student)
router.post('/', async (req, res) => {
  try {
    const {
      item_id, student_id, student_name, student_email,
      student_department, purpose, quantity, borrow_date, expected_return_date
    } = req.body;

    if (!item_id || !student_id || !student_name || !borrow_date || !expected_return_date) {
      return res.status(400).json({
        error: 'Item, student ID, student name, borrow date, and return date are required.'
      });
    }

    // Check item availability
    const { data: item } = await supabase
      .from('items')
      .select('available_quantity, allow_borrowing, name')
      .eq('id', item_id)
      .single();

    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (!item.allow_borrowing) return res.status(400).json({ error: 'This item is not available for borrowing.' });
    if (item.available_quantity < (quantity || 1)) {
      return res.status(400).json({ error: 'Not enough items available.' });
    }

    const { data, error } = await supabase
      .from('borrow_requests')
      .insert([{
        item_id, student_id, student_name, student_email,
        student_department, purpose, quantity: quantity || 1,
        borrow_date, expected_return_date, status: 'pending'
      }])
      .select('*, items(id, name, images)');

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Create borrow request error:', err);
    res.status(500).json({ error: 'Failed to create borrow request.' });
  }
});

// PUT /api/borrow-requests/:id/status — Update status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // Get the request to check item quantities
    const { data: request } = await supabase
      .from('borrow_requests')
      .select('*, items(id, available_quantity)')
      .eq('id', req.params.id)
      .single();

    if (!request) return res.status(404).json({ error: 'Request not found.' });

    // Update available quantity based on status change
    if (status === 'approved' && request.status === 'pending') {
      const newQty = request.items.available_quantity - request.quantity;
      if (newQty < 0) return res.status(400).json({ error: 'Not enough items available.' });

      await supabase
        .from('items')
        .update({ available_quantity: newQty })
        .eq('id', request.item_id);
    } else if (status === 'returned' && ['approved', 'borrowed', 'overdue'].includes(request.status)) {
      await supabase
        .from('items')
        .update({ available_quantity: request.items.available_quantity + request.quantity })
        .eq('id', request.item_id);
    } else if (status === 'rejected' && request.status === 'approved') {
      // If rejecting after approval, restore quantity
      await supabase
        .from('items')
        .update({ available_quantity: request.items.available_quantity + request.quantity })
        .eq('id', request.item_id);
    }

    const updateData = { status };
    if (admin_notes !== undefined) updateData.admin_notes = admin_notes;
    if (status === 'returned') updateData.actual_return_date = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('borrow_requests')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, items(id, name, images)');

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    console.error('Update borrow request error:', err);
    res.status(500).json({ error: 'Failed to update borrow request.' });
  }
});

module.exports = router;
