import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsAPI, borrowAPI } from '../../services/api.js';
import {
  ArrowLeft, Package, MapPin, CheckCircle, XCircle,
  ClipboardList, ChevronLeft, ChevronRight
} from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import toast from 'react-hot-toast';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [borrowModal, setBorrowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [borrowForm, setBorrowForm] = useState({
    student_id: '', student_name: '', student_email: '',
    department: '', requester_type: 'student', priority: 'medium', ticket_category: 'borrow',
    purpose: '', quantity: 1,
    borrow_date: '', expected_return_date: ''
  });

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const { data } = await itemsAPI.getById(id);
      setItem(data);
    } catch (err) {
      toast.error('Item not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await borrowAPI.create({ ...borrowForm, item_id: id });
      toast.success('Borrow request submitted! Please wait for admin approval.');
      setBorrowModal(false);
      setBorrowForm({ student_id: '', student_name: '', student_email: '', department: '', requester_type: 'student', priority: 'medium', ticket_category: 'borrow', purpose: '', quantity: 1, borrow_date: '', expected_return_date: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading item...</p></div>;
  }

  if (!item) return null;

  const images = item.images?.length > 0 ? item.images : [];
  const customFields = item.categories?.custom_fields || [];

  return (
    <div className="item-details-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to Browse
      </button>

      <div className="item-details-grid">
        {/* Image Gallery */}
        <div className="item-gallery">
          <div className="gallery-main">
            {images.length > 0 ? (
              <>
                <img src={images[currentImage]} alt={item.name} />
                {images.length > 1 && (
                  <>
                    <button className="gallery-nav prev" onClick={() => setCurrentImage(i => i > 0 ? i - 1 : images.length - 1)}>
                      <ChevronLeft size={20} />
                    </button>
                    <button className="gallery-nav next" onClick={() => setCurrentImage(i => i < images.length - 1 ? i + 1 : 0)}>
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="image-placeholder large">
                <Package size={64} />
                <p>No image available</p>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`thumb ${i === currentImage ? 'active' : ''}`}
                  onClick={() => setCurrentImage(i)}
                >
                  <img src={img} alt={`${item.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item Info */}
        <div className="item-info">
          <div className="item-category-tag">{item.categories?.name || 'General'}</div>
          <h1 className="item-title">{item.name}</h1>

          <div className="item-status-row">
            {item.available_quantity > 0 ? (
              <span className="status-indicator available">
                <CheckCircle size={16} /> {item.available_quantity} of {item.quantity} Available
              </span>
            ) : (
              <span className="status-indicator unavailable">
                <XCircle size={16} /> Out of Stock
              </span>
            )}
            <span className="condition-tag">{item.condition}</span>
          </div>

          {item.location && (
            <p className="item-location"><MapPin size={16} /> {item.location}</p>
          )}

          <div className="item-description">
            <h3>Description</h3>
            <p>{item.description || 'No description provided.'}</p>
          </div>

          {/* Custom Fields */}
          {Object.keys(item.custom_data || {}).length > 0 && (
            <div className="item-specs">
              <h3>Specifications</h3>
              <div className="specs-grid">
                {Object.entries(item.custom_data).map(([key, value]) => (
                  value && (
                    <div key={key} className="spec-item">
                      <span className="spec-label">{key}</span>
                      <span className="spec-value">{value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="item-actions">
            {item.allow_borrowing && item.available_quantity > 0 && (
              <button className="btn btn-primary btn-lg" onClick={() => setBorrowModal(true)}>
                <ClipboardList size={18} /> Request to Borrow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Borrow Modal */}
      <Modal isOpen={borrowModal} onClose={() => setBorrowModal(false)} title="Borrow Request" size="lg">
        <form onSubmit={handleBorrow} className="modal-form">
          <div className="ticket-form-intro">
            <span className="ticket-kicker">New request ticket</span>
            <p>Tell us who you are and what you need. No account is required.</p>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ID Number *</label>
              <input type="text" value={borrowForm.student_id} onChange={(e) => setBorrowForm({ ...borrowForm, student_id: e.target.value })} placeholder="School or employee ID" required />
            </div>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={borrowForm.student_name} onChange={(e) => setBorrowForm({ ...borrowForm, student_name: e.target.value })} placeholder="Juan Dela Cruz" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department *</label>
              <select value={borrowForm.department} onChange={(e) => setBorrowForm({ ...borrowForm, department: e.target.value })} required>
                <option value="">Select department</option>
                <option value="COT">COT</option>
                <option value="COED">COED</option>
                <option value="COHTM">COHTM</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>I am a *</label>
              <select value={borrowForm.requester_type} onChange={(e) => setBorrowForm({ ...borrowForm, requester_type: e.target.value })} required>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={borrowForm.student_email} onChange={(e) => setBorrowForm({ ...borrowForm, student_email: e.target.value })} placeholder="student@school.edu" />
            </div>
            <div className="form-group">
              <label>Priority *</label>
              <select value={borrowForm.priority} onChange={(e) => setBorrowForm({ ...borrowForm, priority: e.target.value })} required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Purpose *</label>
            <textarea value={borrowForm.purpose} onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })} placeholder="Why do you need this item?" rows={3} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min={1} max={item.available_quantity} value={borrowForm.quantity} onChange={(e) => setBorrowForm({ ...borrowForm, quantity: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="form-group">
              <label>Borrow Date *</label>
              <input type="date" value={borrowForm.borrow_date} onChange={(e) => setBorrowForm({ ...borrowForm, borrow_date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Return Date *</label>
              <input type="date" value={borrowForm.expected_return_date} onChange={(e) => setBorrowForm({ ...borrowForm, expected_return_date: e.target.value })} required />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setBorrowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
