const router = require('express').Router();
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// GET /api/dashboard/stats — Dashboard statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    // Total items
    const { count: totalItems } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true });

    // Total categories
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    // Pending borrow requests
    const { count: pendingBorrows } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Active borrows (approved + borrowed)
    const { count: activeBorrows } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['approved', 'borrowed']);

    // Overdue borrows
    const { count: overdueBorrows } = await supabase
      .from('borrow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'overdue');

    // Pending bookings
    const { count: pendingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Recent borrow requests
    const { data: recentBorrows } = await supabase
      .from('borrow_requests')
      .select('*, items(id, name)')
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('*, items(id, name)')
      .order('created_at', { ascending: false })
      .limit(5);

    // Low stock items (available_quantity <= 2)
    const { data: lowStockItems } = await supabase
      .from('items')
      .select('id, name, quantity, available_quantity, categories(name)')
      .lte('available_quantity', 2)
      .gt('quantity', 0)
      .order('available_quantity')
      .limit(5);

    res.json({
      stats: {
        totalItems: totalItems || 0,
        totalCategories: totalCategories || 0,
        pendingBorrows: pendingBorrows || 0,
        activeBorrows: activeBorrows || 0,
        overdueBorrows: overdueBorrows || 0,
        pendingBookings: pendingBookings || 0
      },
      recentBorrows: recentBorrows || [],
      recentBookings: recentBookings || [],
      lowStockItems: lowStockItems || []
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
});

module.exports = router;
