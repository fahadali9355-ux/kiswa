import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Receipt, Package, Tag, Users, Edit2, Trash2, Plus, X, Upload, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import AdminLogin from './AdminLogin';
import { useAdminAuth } from './hooks/useAdminAuth';

// Simple Toast Notification
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded border shadow-lg ${
        type === 'success' ? 'bg-[#0A2A1A] border-[#10B981] text-[#A7F3D0]' : 'bg-[#2A0A0A] border-[#EF4444] text-[#FECACA]'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-medium text-sm">{message}</span>
    </motion.div>
  );
};

export default function AdminDashboard() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route path="*" element={<AdminDashboardLayout />} />
    </Routes>
  );
}


function AdminDashboardLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAdminAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [navigate, isAuthenticated]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-foreground font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0D0D0D] border-r border-surface-2 flex flex-col">
        <div className="p-6 border-b border-surface-2 pb-8">
          <Link to="/">
            <h1 className="font-serif text-3xl font-bold text-accent tracking-wider mb-1">Kiswa</h1>
          </Link>
          <p className="text-xs text-foreground/50 tracking-widest uppercase">Admin Panel</p>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'orders', icon: Receipt, label: 'Orders' },
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'categories', icon: Tag, label: 'Categories' },
            { id: 'customers', icon: Users, label: 'Customers' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-surface-1 text-accent border-l-4 border-accent'
                    : 'text-foreground/70 hover:bg-surface-2 hover:text-foreground border-l-4 border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-foreground/50'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-2">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-red-500/80 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'categories' && <CategoriesView showToast={showToast} />}
          {activeTab === 'products' && <ProductsView showToast={showToast} />}
           {activeTab === 'orders' && <OrdersView showToast={showToast} />}
           {activeTab === 'customers' && <CustomersView showToast={showToast} />}
        </div>
      </main>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// Helper for making authenticated requests
export const authFetch = async (url: string, options: any = {}) => {
  const token = localStorage.getItem('kiswa_admin_token');
  const headers = { 
    ...options.headers, 
    'Authorization': token ? `Bearer ${token}` : '' 
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('kiswa_admin_token');
    localStorage.removeItem('kiswa_admin_user');
    window.location.href = '/admin/login';
  }
  return response;
};

// ----------------------------------------------------------------------
// DASHBOARD OVERVIEW
// ----------------------------------------------------------------------
function DashboardView() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    authFetch('/api/admin/orders?limit=5')
      .then((res) => res.json())
      .then((data) => {
        setRecentOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setRecentOrders([]);
        setLoading(false);
      });

    authFetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  const getStatusColor = (status: string) => {
    const map: any = { PENDING: 'text-amber-500', PROCESSING: 'text-blue-500', SHIPPED: 'text-purple-500', DELIVERED: 'text-green-500', CANCELLED: 'text-red-500' };
    return map[status] || 'text-foreground';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="font-serif text-3xl">Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Orders', value: stats.totalOrders.toLocaleString() },
          { label: "Today's Orders", value: stats.todayOrders.toLocaleString() },
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}` },
          { label: 'Pending Orders', value: stats.pendingOrders.toLocaleString() },
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-surface-2 border border-surface-2 rounded-sm shadow-sm flex flex-col justify-center">
            <p className="text-3xl font-serif text-accent mb-2">{stat.value}</p>
            <p className="text-sm text-foreground/60 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-1 border border-surface-2 p-6 rounded-sm mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-xl">Recent Orders</h3>
          <button className="text-accent text-sm hover:underline">View All Orders</button>
        </div>
        
        {loading ? (
          <div className="h-48 flex items-center justify-center text-foreground/40 text-sm">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-surface-2 text-foreground/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-2">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs">{order.id.slice(0,8)}</td>
                    <td className="px-4 py-4">{order.guestName || order.user?.name || 'Guest'}</td>
                    <td className="px-4 py-4">Rs. {order.totalAmount.toLocaleString()}</td>
                    <td className={`px-4 py-4 font-medium ${getStatusColor(order.status)}`}>{order.status}</td>
                    <td className="px-4 py-4 text-foreground/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => setSelectedOrder(order)} className="text-accent hover:underline text-xs">View</button>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-foreground/50">No recent orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            updateStatus={(id, status) => {
              authFetch(`/api/admin/orders/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
              }).then(() => {
                // Refresh local state
                setRecentOrders(recentOrders.map(o => o.id === id ? { ...o, status } : o));
                setSelectedOrder({ ...selectedOrder, status });
              });
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------------------------
// CATEGORIES MANAGEMENT
// ----------------------------------------------------------------------
function CategoriesView({ showToast }: { showToast: any }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchCategories = () => {
    setLoading(true);
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => { 
        setCategories(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => { 
        showToast('Error fetching categories', 'error'); 
        setCategories([]);
        setLoading(false); 
      });
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', name.toLowerCase().replace(/ /g, '-'));
    formData.append('description', description);
    formData.append('isActive', isActive.toString());
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
    const method = editingId ? 'PUT' : 'POST';

    authFetch(url, {
      method,
      body: formData,
    }).then(res => {
      if(!res.ok) throw new Error();
      showToast(editingId ? 'Category updated' : 'Category created', 'success');
      setIsFormOpen(false);
      fetchCategories();
    }).catch(() => showToast('Failed to save category', 'error'));
  };

  const handleDelete = (id: string) => {
    if(!confirm('Are you sure?')) return;
    authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      .then(res => {
        if(!res.ok) throw new Error();
        showToast('Category deleted', 'success');
        fetchCategories();
      }).catch(() => showToast('Failed to delete', 'error'));
  };

  const openForm = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name);
      setDescription(cat.description || '');
      setIsActive(cat.isActive);
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setImageFile(null);
    setImagePreview(cat?.image || null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-3xl">Categories</h2>
        <button onClick={() => openForm()} className="bg-accent text-background px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-surface-1 border border-surface-2 p-6 rounded-sm">
          <h3 className="text-xl font-serif mb-4">{editingId ? 'Edit Category' : 'New Category'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-4 py-2 focus:outline-none focus:border-accent text-sm" placeholder="e.g. Winter Collection" />
              </div>
              <div>
                 <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Slug (auto)</label>
                 <input disabled type="text" value={name.toLowerCase().replace(/ /g, '-')} className="w-full bg-surface-2/50 border border-surface-2 px-4 py-2 cursor-not-allowed text-foreground/50 text-sm" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Category Image</label>
              <div className="border border-dashed border-surface-2 bg-surface-2/50 p-4 rounded-sm flex flex-col items-center justify-center relative cursor-pointer hover:bg-surface-2 transition-colors">
                 <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleImageSelect} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                 {imagePreview ? (
                   <div className="flex flex-col items-center gap-2">
                     <img src={imagePreview} alt="Preview" className="h-24 object-cover rounded" />
                     <span className="text-xs text-foreground/50">Click to replace image</span>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-2 py-4">
                     <Upload className="w-6 h-6 text-foreground/40" />
                     <span className="text-xs text-foreground/50">Click to upload or drag image here</span>
                     <span className="text-[10px] text-foreground/40">JPG, PNG, WEBP allowed</span>
                   </div>
                 )}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-4 py-2 focus:outline-none focus:border-accent text-sm min-h-[80px]" placeholder="Optional description..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-accent w-4 h-4" />
              <label htmlFor="isActive" className="text-sm">Active</label>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-surface-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-foreground/60 hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" className="bg-accent text-background px-6 py-2 text-sm font-medium hover:bg-accent/90 transition-colors">Save Category</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface-1 border border-surface-2 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-surface-2 text-foreground/60">
            <tr>
              <th className="px-6 py-4 font-medium">Category Name</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-2">
            {loading ? <tr><td colSpan={4} className="py-8 text-center text-foreground/50">Loading categories...</td></tr> : 
            categories.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-foreground/50">No categories found. Add one above.</td></tr> :
            categories.map(cat => (
              <tr key={cat.id} className="hover:bg-surface-2/30 transition-colors">
                <td className="px-6 py-4 font-medium">{cat.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-foreground/60">{cat.slug}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded ${cat.isActive ? 'bg-green-500/10 text-green-500' : 'bg-surface-2 text-foreground/50'}`}>
                    {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-end gap-3">
                  <button onClick={() => openForm(cat)} className="text-accent hover:text-accent/70 transition-colors p-1" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500/80 hover:text-red-500 transition-colors p-1" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function ProductsView({ showToast }: { showToast: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<any[]>([]);

  const fetchProducts = () => {
    setLoading(true);
    // API returns all products, need to fetch categories for the form too
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ]).then(([prodData, catData]) => {
      setProducts(prodData.products || []);
      setCategories(Array.isArray(catData) ? catData : []);
      setLoading(false);
    }).catch(() => { 
      showToast('Error fetching data', 'error'); 
      setProducts([]);
      setCategories([]);
      setLoading(false); 
    });
  };

  useEffect(() => { fetchProducts(); }, []);

  const openForm = (prod?: any) => {
    if (prod) {
      setEditingId(prod.id);
      setName(prod.name);
      setDescription(prod.description || '');
      setBasePrice(prod.basePrice.toString());
      setCategoryId(prod.categoryId || '');
      setExistingImages(prod.images || []);
      setImages([]);
      setIsFeatured(prod.isFeatured);
      setIsActive(prod.isActive);
      setVariants(prod.variants || []);
    } else {
      setEditingId(null);
      setName('');
      setDescription('');
      setBasePrice('');
      setCategoryId(categories[0]?.id || '');
      setExistingImages([]);
      setImages([]);
      setIsFeatured(false);
      setIsActive(true);
      setVariants([]);
    }
    setIsFormOpen(true);
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', stockQty: 0, priceAdjustment: 0 }]);
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newV = [...variants];
    newV[index][field] = value;
    setVariants(newV);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', name.toLowerCase().replace(/ /g, '-'));
    formData.append('description', description);
    formData.append('basePrice', basePrice);
    formData.append('categoryId', categoryId);
    formData.append('isFeatured', isFeatured.toString());
    formData.append('isActive', isActive.toString());
    formData.append('existingImages', JSON.stringify(existingImages));
    // For editing, complex variant update logic comes here, but for now we send them
    formData.append('variants', JSON.stringify(variants.map(v => ({...v, stockQty: parseInt(v.stockQty) || 0, priceAdjustment: parseFloat(v.priceAdjustment) || 0}))));

    images.forEach(img => {
      formData.append('images', img);
    });

    const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
    const method = editingId ? 'PUT' : 'POST';

    authFetch(url, {
      method,
      body: formData,
    }).then(res => {
      if(!res.ok) throw new Error();
      showToast(editingId ? 'Product updated' : 'Product created', 'success');
      setIsFormOpen(false);
      fetchProducts();
    }).catch(() => showToast('Failed to save product', 'error'));
  };

  const handleDelete = (id: string) => {
    if(!confirm('Are you sure?')) return;
    authFetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      .then(res => {
        if(!res.ok) throw new Error();
        showToast('Product deleted', 'success');
        fetchProducts();
      }).catch(() => showToast('Failed to delete', 'error'));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-3xl">Products</h2>
        <button onClick={() => openForm()} className="bg-accent text-background px-4 py-2 text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-surface-1 border border-surface-2 p-6 rounded-sm">
          <h3 className="text-xl font-serif mb-4">{editingId ? 'Edit Product' : 'New Product'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-4 py-2 focus:outline-none focus:border-accent text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Category</label>
                <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-4 py-2 focus:outline-none focus:border-accent text-sm">
                  <option value="" disabled>Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Base Price (PKR)</label>
                <input required type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-4 py-2 focus:outline-none focus:border-accent text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Images (Max 5)</label>
                <div className="border border-dashed border-surface-2 p-4 flex flex-col items-center justify-center bg-surface-2/10 relative text-sm">
                   <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={(e) => {
                       if (e.target.files) {
                           setImages(Array.from(e.target.files).slice(0, 5));
                       }
                   }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   <Upload className="w-5 h-5 mb-2 text-foreground/50" />
                   <p className="text-foreground/70">Click or drag images here</p>
                </div>
                {images.length > 0 && <p className="text-xs text-foreground/60 mt-2">{images.length} file(s) selected.</p>}
                {existingImages.length > 0 && (
                   <div className="flex gap-2 mt-2">
                       {existingImages.map((img, i) => (
                           <div key={i} className="relative w-12 h-12">
                               <img src={img} className="w-full h-full object-cover" />
                               <button type="button" onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-500 rounded p-0.5 text-white">
                                   <X className="w-3 h-3" />
                               </button>
                           </div>
                       ))}
                   </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-4 py-2 focus:outline-none focus:border-accent text-sm min-h-[80px]" />
            </div>

            <div className="p-4 border border-surface-2 bg-surface-2/30 rounded-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium tracking-wider uppercase text-foreground/80">Variants</h4>
                <button type="button" onClick={addVariant} className="text-xs text-accent hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Variant
                </button>
              </div>
              {variants.length === 0 && <p className="text-xs text-foreground/50">No variants. Product uses base price and has infinite stock.</p>}
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input type="text" placeholder="Size (e.g. M)" value={v.size || ''} onChange={e => updateVariant(i, 'size', e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-2 py-1 text-xs" />
                    <input type="text" placeholder="Color" value={v.color || ''} onChange={e => updateVariant(i, 'color', e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-2 py-1 text-xs" />
                    <input type="number" placeholder="Stock" value={v.stockQty} onChange={e => updateVariant(i, 'stockQty', e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-2 py-1 text-xs" />
                    <input type="number" placeholder="+/- Price" value={v.priceAdjustment} onChange={e => updateVariant(i, 'priceAdjustment', e.target.value)} className="w-full bg-surface-2 border border-surface-2 px-2 py-1 text-xs" />
                    <button type="button" onClick={() => removeVariant(i)} className="p-1 text-red-500/80 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isFeatured" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="accent-accent w-4 h-4" />
                <label htmlFor="isFeatured" className="text-sm">Featured</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActiveProd" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-accent w-4 h-4" />
                <label htmlFor="isActiveProd" className="text-sm">Active</label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-2">
              <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm text-foreground/60 hover:text-foreground transition-colors">Cancel</button>
              <button type="submit" className="bg-accent text-background px-6 py-2 text-sm font-medium hover:bg-accent/90 transition-colors">Save Product</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface-1 border border-surface-2 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-surface-2 text-foreground/60">
            <tr>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Stock</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-2">
            {loading ? <tr><td colSpan={6} className="py-8 text-center text-foreground/50">Loading products...</td></tr> : 
            products.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-foreground/50">No products found. Add one above.</td></tr> :
            products.map(prod => (
              <tr key={prod.id} className="hover:bg-surface-2/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{prod.name}</div>
                  <div className="text-xs text-foreground/50 font-mono">{prod.slug}</div>
                </td>
                <td className="px-6 py-4 text-foreground/70">{prod.category?.name || 'Uncategorized'}</td>
                <td className="px-6 py-4 font-medium text-accent">Rs. {prod.basePrice.toLocaleString()}</td>
                <td className="px-6 py-4 text-foreground/70">
                  {prod.variants?.length ? prod.variants.reduce((acc: any, v: any) => acc + v.stockQty, 0) : '∞'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 items-start">
                    {prod.isFeatured && <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-accent/20 text-accent">FEATURED</span>}
                    <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded ${prod.isActive ? 'bg-green-500/10 text-green-500' : 'bg-surface-2 text-foreground/50'}`}>
                      {prod.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 flex justify-end gap-3 items-center h-full">
                  <button onClick={() => openForm(prod)} className="text-accent hover:text-accent/70 transition-colors p-1 mt-2" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(prod.id)} className="text-red-500/80 hover:text-red-500 transition-colors p-1 mt-2" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function OrdersView({ showToast }: { showToast: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    authFetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => { 
        setOrders(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => { 
        showToast('Error fetching orders', 'error'); 
        setOrders([]);
        setLoading(false); 
      });
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = (id: string, status: string) => {
    authFetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(res => {
      if(!res.ok) throw new Error();
      showToast('Order status updated', 'success');
      fetchOrders();
    }).catch(() => showToast('Failed to update status', 'error'));
  };

  const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const getStatusColor = (status: string) => {
    const map: any = { PENDING: 'text-amber-500 bg-amber-500/10', PROCESSING: 'text-blue-500 bg-blue-500/10', SHIPPED: 'text-purple-500 bg-purple-500/10', DELIVERED: 'text-green-500 bg-green-500/10', CANCELLED: 'text-red-500 bg-red-500/10' };
    return map[status] || 'text-foreground bg-surface-2';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="font-serif text-3xl">Orders</h2>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs font-bold tracking-wider rounded-sm transition-colors whitespace-nowrap ${filter === tab ? 'bg-accent text-background' : 'bg-surface-1 border border-surface-2 text-foreground/70 hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-surface-1 border border-surface-2 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-surface-2 text-foreground/60">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Items</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">WA</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-2">
            {loading ? <tr><td colSpan={7} className="py-8 text-center text-foreground/50">Loading orders...</td></tr> : 
            filteredOrders.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-foreground/50">No orders found.</td></tr> :
            filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-surface-2/30 transition-colors">
                <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                <td className="px-6 py-4">{order.guestName || order.user?.name || 'Guest'}</td>
                <td className="px-6 py-4 text-foreground/70">{order.items?.length || 0} items</td>
                <td className="px-6 py-4 font-medium">Rs. {order.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className={`text-xs font-bold tracking-wider rounded px-2 py-1 outline-none cursor-pointer appearance-none ${getStatusColor(order.status)}`}
                  >
                    {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => <option key={s} value={s} className="bg-[#111] text-foreground">{s}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center" title={order.whatsappSent ? "WhatsApp sent" : "WhatsApp not sent"}>
                    <MessageCircle className={`w-4 h-4 ${order.whatsappSent ? 'text-[#25D366]' : 'text-surface-2'}`} />
                  </div>
                </td>
                <td className="px-6 py-4 text-foreground/60">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="text-accent hover:underline text-xs font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} updateStatus={updateStatus} />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderDetailModal({ order, onClose, updateStatus }) {
  const getStatusColor = (status: string) => {
    const map: any = { PENDING: 'text-amber-500', PROCESSING: 'text-blue-500', SHIPPED: 'text-purple-500', DELIVERED: 'text-green-500', CANCELLED: 'text-red-500' };
    return map[status] || 'text-foreground';
  };

  const address = typeof order.shippingAddress === 'string' ? (order.shippingAddress.startsWith('{') ? JSON.parse(order.shippingAddress) : order.shippingAddress) : order.shippingAddress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0D0D0D] border border-surface-2 rounded-sm shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-surface-2 flex justify-between items-center bg-[#111]">
          <div>
            <h3 className="font-serif text-2xl text-accent">Order Details</h3>
            <p className="text-xs text-foreground/50 font-mono mt-1 uppercase tracking-widest">ID: {order.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customer & Shipping */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-foreground/40 font-bold mb-3">Customer Info</h4>
                <div className="bg-surface-1 p-4 rounded-sm border border-surface-2 space-y-2">
                  <p className="text-sm font-medium">{order.guestName || order.user?.name || 'Guest Customer'}</p>
                  <p className="text-xs text-foreground/60">{order.guestEmail || order.user?.email || 'No email provided'}</p>
                  <p className="text-xs text-foreground/60">{order.guestPhone || 'No phone provided'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-foreground/40 font-bold mb-3">Shipping Address</h4>
                <div className="bg-surface-1 p-4 rounded-sm border border-surface-2">
                  {typeof address === 'object' ? (
                    <div className="text-xs text-foreground/80 space-y-1">
                      <p>{address.address}</p>
                      <p>{address.city}, {address.postalCode}</p>
                      {address.country && <p>{address.country}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/80 leading-relaxed">{address}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-foreground/40 font-bold mb-3">Order Status</h4>
                <select 
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className={`w-full text-xs font-bold tracking-wider rounded px-3 py-2 outline-none cursor-pointer appearance-none bg-surface-2 border border-surface-2 ${getStatusColor(order.status)}`}
                >
                  {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => <option key={s} value={s} className="bg-[#111] text-foreground">{s}</option>)}
                </select>
              </div>
            </div>

            {/* Items & Payment */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-foreground/40 font-bold mb-3">Order Items</h4>
                <div className="bg-surface-1 rounded-sm border border-surface-2 overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase bg-surface-2 text-foreground/50 tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-medium">Product</th>
                        <th className="px-4 py-2 font-medium text-center">Qty</th>
                        <th className="px-4 py-2 font-medium text-right">Price</th>
                        <th className="px-4 py-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-2/50">
                      {order.items?.map((item: any) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{item.product?.name || 'Unknown Product'}</div>
                            {(item.variant?.size || item.variant?.color) && (
                              <div className="text-[10px] text-accent mt-0.5">
                                {item.variant.size && `Size: ${item.variant.size}`}
                                {item.variant.size && item.variant.color && ' | '}
                                {item.variant.color && `Color: ${item.variant.color}`}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">Rs. {item.price.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-accent">Rs. {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-surface-2/30">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-foreground/50 font-bold">Subtotal</td>
                        <td className="px-4 py-3 text-right font-bold text-accent">Rs. {order.totalAmount.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-1 p-4 rounded-sm border border-surface-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-2">Payment Method</h4>
                  <p className="text-sm font-medium text-accent uppercase">{order.paymentMethod || 'Not specified'}</p>
                </div>
                <div className="bg-surface-1 p-4 rounded-sm border border-surface-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mb-2">Order Date</h4>
                  <p className="text-sm font-medium">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-2 bg-[#111] flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-accent text-background text-sm font-bold uppercase tracking-widest hover:bg-accent/90 transition-colors"
          >
            Close Detail
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CustomersView({ showToast }: { showToast: any }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/customers')
      .then(res => res.json())
      .then(data => { 
        setCustomers(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => { 
        showToast('Error fetching customers', 'error'); 
        setCustomers([]);
        setLoading(false); 
      });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="font-serif text-3xl">Customers</h2>

      <div className="bg-surface-1 border border-surface-2 rounded-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-surface-2 text-foreground/60">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Total Orders</th>
              <th className="px-6 py-4 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-2">
            {loading ? <tr><td colSpan={4} className="py-8 text-center text-foreground/50">Loading customers...</td></tr> : 
            customers.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-foreground/50">No customers found.</td></tr> :
            customers.map(cust => (
               <tr key={cust.id} className="hover:bg-surface-2/30 transition-colors">
                 <td className="px-6 py-4 font-medium">{cust.name}</td>
                 <td className="px-6 py-4 text-foreground/70">{cust.email}</td>
                 <td className="px-6 py-4 text-accent font-medium">{cust._count?.orders || 0}</td>
                 <td className="px-6 py-4 text-foreground/60">{new Date(cust.createdAt).toLocaleDateString()}</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
