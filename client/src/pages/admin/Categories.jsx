import { useState, useEffect } from 'react';
import { categoriesAPI } from '../../services/api.js';
import { Plus, Edit2, Trash2, X, FolderOpen } from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import toast from 'react-hot-toast';

const FIELD_TYPES = ['text', 'number', 'textarea'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: 'box', custom_fields: [] });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(data);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: 'box', custom_fields: [] });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'box',
      custom_fields: cat.custom_fields || []
    });
    setModalOpen(true);
  };

  const addField = () => {
    setForm({
      ...form,
      custom_fields: [...form.custom_fields, { name: '', type: 'text', required: false }]
    });
  };

  const updateField = (index, key, value) => {
    const fields = [...form.custom_fields];
    fields[index] = { ...fields[index], [key]: value };
    setForm({ ...form, custom_fields: fields });
  };

  const removeField = (index) => {
    setForm({
      ...form,
      custom_fields: form.custom_fields.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await categoriesAPI.update(editing.id, form);
        toast.success('Category updated!');
      } else {
        await categoriesAPI.create(form);
        toast.success('Category created!');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"? Items in this category will become uncategorized.`)) return;
    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted');
      loadCategories();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>Loading categories...</p></div>;
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your inventory items into categories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={48} />
          <h3>No categories yet</h3>
          <p>Create your first category to organize inventory items.</p>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> Create Category
          </button>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="category-card">
              <div className="category-card-header">
                <div className="category-icon-wrap">
                  <FolderOpen size={22} />
                </div>
                <div className="category-actions">
                  <button className="icon-btn" onClick={() => openEdit(cat)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(cat.id, cat.name)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="category-name">{cat.name}</h3>
              <p className="category-desc">{cat.description || 'No description'}</p>
              <div className="category-meta">
                <span className="category-count">{cat.item_count} item{cat.item_count !== 1 ? 's' : ''}</span>
                {cat.custom_fields?.length > 0 && (
                  <span className="category-fields">{cat.custom_fields.length} custom field{cat.custom_fields.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'New Category'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="cat-name">Category Name *</label>
            <input
              id="cat-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Computers"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this category"
              rows={3}
            />
          </div>

          {/* Custom Fields Builder */}
          <div className="form-section">
            <div className="section-header">
              <h4>Custom Fields</h4>
              <p className="section-hint">Define what info to collect for items in this category</p>
            </div>

            {form.custom_fields.map((field, i) => (
              <div key={i} className="custom-field-row">
                <input
                  type="text"
                  placeholder="Field name"
                  value={field.name}
                  onChange={(e) => updateField(i, 'name', e.target.value)}
                  required
                />
                <select
                  value={field.type}
                  onChange={(e) => updateField(i, 'type', e.target.value)}
                >
                  {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(i, 'required', e.target.checked)}
                  />
                  Required
                </label>
                <button type="button" className="icon-btn danger" onClick={() => removeField(i)}>
                  <X size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="btn btn-outline btn-sm" onClick={addField}>
              <Plus size={16} /> Add Field
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
