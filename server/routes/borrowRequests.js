const router = require('express').Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');
const { sendTicketEmail } = require('../services/mailer');

// GET /api/borrow-requests — List all (admin) or filter by student
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, student_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('borrow_requests')
      .select('*, items(id, name, images, location)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
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
// GET /api/borrow-requests/lookup/:identifier — Find tickets by Student ID or ticket number
router.get('/lookup/:identifier', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier).trim();
    let { data, error } = await supabase
      .from('borrow_requests')
      .select('*, items(id, name, images, location)')
      .eq('student_id', identifier)
      .order('created_at', { ascending: false });

    if (!error && data.length === 0) {
      ({ data, error } = await supabase
        .from('borrow_requests')
        .select('*, items(id, name, images, location)')
        .eq('ticket_number', identifier)
        .order('created_at', { ascending: false }));
    }

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Lookup borrow requests error:', err);
    res.status(500).json({ error: 'Failed to look up tickets.' });
  }
});

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
      student_department, department, requester_type, priority,
      ticket_category, purpose, quantity, borrow_date, expected_return_date
    } = req.body;

    const validDepartments = ['COT', 'COED', 'COHTM', 'Admin'];
    const validRequesterTypes = ['student', 'teacher', 'admin'];
    const validPriorities = ['low', 'medium', 'high'];
    const validTicketCategories = ['borrow', 'tech_support', 'tool_borrow', 'manpower', 'other'];

    if (!student_id || !student_name || !student_email || !department || !requester_type || !priority || !ticket_category || !purpose) {
      return res.status(400).json({
        error: 'ID number, name, department, requester type, priority, ticket category, and request details are required.'
      });
    }
    if (!validDepartments.includes(department)) return res.status(400).json({ error: 'Invalid department.' });
    if (!validRequesterTypes.includes(requester_type)) return res.status(400).json({ error: 'Invalid requester type.' });
    if (!validPriorities.includes(priority)) return res.status(400).json({ error: 'Invalid priority.' });
    if (!validTicketCategories.includes(ticket_category)) return res.status(400).json({ error: 'Invalid ticket category.' });
    const { data, error } = await supabase
      .from('borrow_requests')
      .insert([{
        ticket_number: `BR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        item_id: null, student_id, student_name, student_email,
        student_department: department, department, requester_type, priority,
        ticket_category,
        purpose, quantity: quantity || 1,
        borrow_date: null, expected_return_date: null, status: 'open'
      }])
      .select('*, items(id, name, images)');

    if (error) throw error;
    await sendTicketEmail({
      to: student_email,
      ticketNumber: data[0].ticket_number,
      subject: 'Ticket received',
      message: `We received your ${ticket_category.replace('_', ' ')} request. Its current status is open. Our support team will review it and reply by email.`
    });
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Create borrow request error:', err);
    res.status(500).json({ error: 'Failed to create borrow request.' });
  }
});

// PUT /api/borrow-requests/:id/status — Update status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, admin_notes, tags } = req.body;
    const validStatuses = ['pending', 'open', 'closed', 'approved', 'rejected', 'borrowed', 'returned', 'overdue'];

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
    if (Array.isArray(tags)) updateData.tags = tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim().slice(0, 40));
    if (admin_notes && admin_notes.trim()) {
      updateData.assigned_to = req.admin.id;
      updateData.assigned_at = new Date().toISOString();
    }
    if (status === 'returned') updateData.actual_return_date = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('borrow_requests')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*, items(id, name, images)');

    if (error) throw error;
    if (admin_notes) {
      await sendTicketEmail({
        to: request.student_email,
        ticketNumber: request.ticket_number,
        subject: `Support replied (${status})`,
        message: admin_notes,
        agentName: req.admin.name
      });
    }
    res.json(data[0]);
  } catch (err) {
    console.error('Update borrow request error:', err);
    res.status(500).json({ error: 'Failed to update borrow request.' });
  }
});

module.exports = router;
