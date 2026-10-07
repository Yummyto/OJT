import { useState, useEffect } from 'react';
import { itemsAPI, categoriesAPI, uploadAPI } from '../../services/api';
import { Plus, Edit2, Trash2, Search, Package, Upload, X, Image } from 'lucide-react';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', category_id: '', description: '', quantity: 1,
    condition: 'Good', location: '', images: [], custom_data: {},
    allow_booking: true, allow_borrowing: true
  });

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadItems();
  }, [page, search, filterCategory]);

  const loadItems = async () => {
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (filterCategory) params.category_id = filterCategory;
      const { data } = await itemsAPI.getAll(params);
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', category_id: '', description: '', quantity: 1,
      condition: 'Good', location: '', images: [], custom_data: {},
      allow_booking: true, allow_borrowing: true
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      category_id: item.category_id || '',
      description: item.description || '',
      quantity: item.quantity,
      condition: item.condition || 'Good',
      location: item.location || '',
      images: item.images || [],
      custom_data: item.custom_data || {},
      allow_booking: item.allow_booking,
      allow_borrowing: item.allow_borrowing
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadAPI.uploadImage(file);
      setForm({ ...form, images: [...form.images, data.url] });
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, category_id: form.category_id || null };
      if (editing) {
        await itemsAPI.update(editing.id, payload);
        toast.success('Item updated!');
      } else {
        await itemsAPI.create(payload);
        toast.success('Item added to inventory!');
      }
      setModalOpen(false);
      loadItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save item');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" from inventory?`)) return;
    try {
      await itemsAPI.delete(id);
      toast.success('Item deleted');
      loadItems();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  // Get custom fields for selected category
  const selectedCategory = categories.find(c => c.id === form.category_id);
  const customFields = selectedCategory?.custom_fields || [];

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading inventory...</p></div>;
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Manage all school equipment and items</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>No items found</h3>
          <p>{search || filterCategory ? 'Try adjusting your filters.' : 'Add your first inventory item to get started.'}</p>
          {!search && !filterCategory && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} /> Add Item
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-card-image">
                  {item.images?.length > 0 ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="image-placeholder">
                      <Package size={32} />
                    </div>
                  )}
                  <div className="item-card-overlay">
                    <button className="icon-btn light" onClick={() => openEdit(item)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn light danger" onClick={() => handleDelete(item.id, item.name)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="item-card-body">
                  <div className="item-card-category">
                    {item.categories?.name || 'Uncategorized'}
                  </div>
                  <h3 className="item-card-title">{item.name}</h3>
                  <p className="item-card-desc">{item.description?.substring(0, 80) || 'No description'}{item.description?.length > 80 ? '...' : ''}</p>
                  <div className="item-card-footer">
                    <span className={`stock-badge ${item.available_quantity === 0 ? 'out' : item.available_quantity <= 2 ? 'low' : 'ok'}`}>
                      {item.available_quantity}/{item.quantity} available
                    </span>
                    <span className="condition-text">{item.condition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Item' : 'Add New Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="item-name">Item Name *</label>
              <input
                id="item-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Dell Laptop"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="item-category">Category</label>
              <select
                id="item-category"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value, custom_data: {} })}
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="item-desc">Description</label>
            <textarea
              id="item-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the item"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="item-qty">Quantity</label>
              <input
                id="item-qty"
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="item-condition">Condition</label>
              <select
                id="item-condition"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="item-location">Location</label>
              <input
                id="item-location"
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Room 101"
              />
            </div>
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.allow_borrowing}
                onChange={(e) => setForm({ ...form, allow_borrowing: e.target.checked })}
              />
              Allow Borrowing
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.allow_booking}
                onChange={(e) => setForm({ ...form, allow_booking: e.target.checked })}
              />
              Allow Booking
            </label>
          </div>

          {/* Image Upload */}
          <div className="form-section">
            <h4>Images</h4>
            <div className="image-upload-area">
              {form.images.map((url, i) => (
                <div key={i} className="uploaded-image">
                  <img src={url} alt={`Item ${i + 1}`} />
                  <button type="button" className="remove-image" onClick={() => removeImage(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <label className="upload-btn">
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                {uploading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Custom Fields (from category) */}
          {customFields.length > 0 && (
            <div className="form-section">
              <h4>Category Details</h4>
              {customFields.map((field) => (
                <div key={field.name} className="form-group">
                  <label>{field.name} {field.required && '*'}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={form.custom_data[field.name] || ''}
                      onChange={(e) => setForm({
                        ...form,
                        custom_data: { ...form.custom_data, [field.name]: e.target.value }
                      })}
                      rows={2}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={form.custom_data[field.name] || ''}
                      onChange={(e) => setForm({
                        ...form,
                        custom_data: { ...form.custom_data, [field.name]: e.target.value }
                      })}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
