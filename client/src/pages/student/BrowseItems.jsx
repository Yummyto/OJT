import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { itemsAPI, categoriesAPI } from '../../services/api.js';
import { Search, Package, MapPin, Filter } from 'lucide-react';

export default function BrowseItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    categoriesAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadItems();
  }, [page, search, filterCategory]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, available: 'true' };
      if (search) params.search = search;
      if (filterCategory) params.category_id = filterCategory;
      const { data } = await itemsAPI.getAll(params);
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="browse-page">
      {/* Hero Section */}
      <div className="browse-hero">
        <div className="hero-content">
          <h1 className="hero-title">School Equipment & Tools</h1>
          <p className="hero-subtitle">Browse available items, borrow tools, and book equipment for your projects</p>
          <div className="hero-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search for items..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-chips">
        <button
          className={`chip ${filterCategory === '' ? 'active' : ''}`}
          onClick={() => { setFilterCategory(''); setPage(1); }}
        >
          <Filter size={14} /> All Items
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`chip ${filterCategory === c.id ? 'active' : ''}`}
            onClick={() => { setFilterCategory(c.id); setPage(1); }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>No items found</h3>
          <p>{search ? 'Try a different search term.' : 'No items available at the moment.'}</p>
        </div>
      ) : (
        <>
          <div className="student-items-grid">
            {items.map((item) => (
              <Link to={`/items/${item.id}`} key={item.id} className="student-item-card">
                <div className="student-card-image">
                  {item.images?.length > 0 ? (
                    <img src={item.images[0]} alt={item.name} />
                  ) : (
                    <div className="image-placeholder">
                      <Package size={36} />
                    </div>
                  )}
                  <div className="card-category-badge">
                    {item.categories?.name || 'General'}
                  </div>
                </div>
                <div className="student-card-body">
                  <h3 className="student-card-title">{item.name}</h3>
                  <p className="student-card-desc">
                    {item.description?.substring(0, 100) || 'No description available'}
                    {item.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="student-card-meta">
                    <span className={`availability ${item.available_quantity > 0 ? 'available' : 'unavailable'}`}>
                      {item.available_quantity > 0 ? `${item.available_quantity} available` : 'Out of stock'}
                    </span>
                    {item.location && (
                      <span className="location">
                        <MapPin size={14} /> {item.location}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
