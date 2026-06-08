import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state for adding/updating items
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/items/all');
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        // Update item
        await api(`/items/update/${editingId}`, {
          method: 'PUT',
          body: { name, description, quantity, price },
        });
      } else {
        // Create item
        await api('/items/add', {
          method: 'POST',
          body: { name, description, quantity, price },
        });
      }

      // Reset form
      setName('');
      setDescription('');
      setQuantity(0);
      setPrice(0);
      setEditingId(null);
      setShowForm(false);
      
      // Refresh items
      fetchItems();
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setName(item.name);
    setDescription(item.description || '');
    setQuantity(item.quantity || 0);
    setPrice(item.price || 0);
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setError('');

    try {
      await api(`/items/delete/${id}`, {
        method: 'DELETE',
      });
      fetchItems();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setQuantity(0);
    setPrice(0);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pt-20">
      {/* Top Navbar */}
      <header className="fixed top-0 w-full glass-header border-b border-outline-variant/30 h-20 px-margin-mobile md:px-margin-desktop flex items-center justify-between z-50 bg-white/70 backdrop-blur-md">
        <div className="font-headline-md text-headline-md tracking-tighter font-light text-primary">
          Lumina
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="font-label-caps text-xs text-on-surface-variant uppercase">Welcome</p>
            <p className="font-semibold text-sm">{user?.fullName}</p>
          </div>
          <button 
            onClick={logout}
            className="font-label-caps text-label-caps tracking-widest uppercase border border-primary px-5 py-2.5 hover:bg-primary hover:text-on-primary transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">Curated Atelier Inventory</h1>
            <p className="text-on-surface-variant">Manage high-end architectural items and designer products.</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest py-4 px-6 hover:bg-secondary transition-all active:scale-[0.98]"
            >
              Add New Item
            </button>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-error-container text-on-error-container border border-error/20 text-sm">
            {error}
          </div>
        )}

        {/* Form Overlay or Section */}
        {showForm && (
          <div className="mb-10 p-8 border border-outline-variant bg-surface-container-lowest max-w-2xl">
            <h2 className="font-headline-md text-headline-md text-primary mb-6">
              {editingId ? 'Edit Inventory Item' : 'New Inventory Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Minimalist Floor Lamp"
                  className="w-full border-none border-b border-outline-variant py-2.5 bg-transparent placeholder:text-outline-variant/50 focus:ring-0 focus:border-primary rounded-none px-0"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase">Description</label>
                <textarea
                  placeholder="Atmospheric lighting made with brass and wood..."
                  className="w-full border-none border-b border-outline-variant py-2.5 bg-transparent placeholder:text-outline-variant/50 focus:ring-0 focus:border-primary rounded-none px-0 h-20 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full border-none border-b border-outline-variant py-2.5 bg-transparent focus:ring-0 focus:border-primary rounded-none px-0"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase">Price ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full border-none border-b border-outline-variant py-2.5 bg-transparent focus:ring-0 focus:border-primary rounded-none px-0"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest py-4 px-6 hover:bg-secondary transition-all"
                >
                  {editingId ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="border border-outline-variant font-label-caps text-label-caps uppercase tracking-widest py-4 px-6 hover:bg-surface-container-low transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory Table / Grid */}
        {loading ? (
          <div className="text-center py-20 text-on-surface-variant font-light">
            Loading curated items...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-outline-variant text-on-surface-variant">
            No items in inventory. Click "Add New Item" to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <div 
                key={item._id} 
                className="border border-outline-variant/40 bg-surface-container-lowest p-6 hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-headline-md text-lg text-primary font-medium">{item.name}</h3>
                    <span className="font-label-caps text-xs bg-surface-container px-2.5 py-1">
                      Qty: {item.quantity}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant font-light mb-6 line-clamp-3">
                    {item.description || 'No description provided.'}
                  </p>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
                  <span className="font-bold text-lg text-primary">
                    ${item.price?.toLocaleString() || '0.00'}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-xs font-semibold uppercase tracking-wider text-secondary hover:text-primary transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-outline-variant/30">|</span>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-xs font-semibold uppercase tracking-wider text-error hover:opacity-80 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
