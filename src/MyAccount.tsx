import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Heart, User as UserIcon, LogOut, CheckCircle, Package, Search } from 'lucide-react';

export default function MyAccount() {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>('orders');
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem('kiswa_token');
    const savedUser = localStorage.getItem('kiswa_user');
    
    if (!token) {
      navigate('/login', { state: { from: '/account' } });
      return;
    }
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Verify token and fetch fresh user data
    fetch('/api/auth/customer/me', {
       headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (res.status === 401) {
        handleLogout();
        return;
      }
      return res.json();
    })
    .then(data => {
      if (data?.success) {
        setUser(data.data);
        localStorage.setItem('kiswa_user', JSON.stringify(data.data));
      }
    });
  }, [navigate]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('kiswa_token');
    localStorage.removeItem('kiswa_user');
    navigate('/');
  };

  if (!user) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0].toUpperCase();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0A0A0A] text-[#F5F0E8] font-sans pt-24 pb-20">
      
      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 bg-[#111111] border border-accent text-accent px-6 py-3 rounded shadow-xl flex items-center gap-3 text-sm font-medium"
          >
            <CheckCircle className="w-5 h-5" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-8 lg:gap-12">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-[260px] shrink-0">
          
          <div className="bg-[#111] border border-surface-2 rounded-xl p-6 text-center mb-6">
            <div className="w-20 h-20 bg-accent text-[#0A0A0A] rounded-full flex items-center justify-center text-2xl font-serif font-bold mx-auto mb-4">
              {getInitials(user.name)}
            </div>
            <h2 className="font-serif text-lg text-accent mb-1">{user.name}</h2>
            <p className="text-sm text-foreground/50">{user.email}</p>
          </div>

          <div className="bg-[#111] border border-surface-2 rounded-xl overflow-hidden flex md:flex-col custom-scrollbar overflow-x-auto md:overflow-hidden">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-l-2 md:border-l-4 md:border-b-0 border-b-2 ${activeTab === 'orders' ? 'border-accent text-accent bg-white/5' : 'border-transparent text-foreground/70 hover:bg-white/5 hover:text-foreground'}`}
            >
              <Receipt className="w-4 h-4" /> My Orders
            </button>
            <button 
              onClick={() => setActiveTab('wishlist')}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-l-2 md:border-l-4 md:border-b-0 border-b-2 ${activeTab === 'wishlist' ? 'border-accent text-accent bg-white/5' : 'border-transparent text-foreground/70 hover:bg-white/5 hover:text-foreground'}`}
            >
              <Heart className="w-4 h-4" /> My Wishlist
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-l-2 md:border-l-4 md:border-b-0 border-b-2 flex-1 md:flex-none ${activeTab === 'profile' ? 'border-accent text-accent bg-white/5' : 'border-transparent text-foreground/70 hover:bg-white/5 hover:text-foreground'}`}
            >
              <UserIcon className="w-4 h-4" /> Profile Settings
            </button>
            <div className="hidden md:block h-px bg-surface-2 my-2 mx-4" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-4 text-sm font-medium whitespace-nowrap text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
             <motion.div 
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
             >
               {activeTab === 'orders' && <MyOrdersTab />}
               {activeTab === 'wishlist' && <MyWishlistTab showToast={showToast} />}
               {activeTab === 'profile' && <ProfileTab user={user} setUser={setUser} showToast={showToast} />}
             </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

// --- TAB COMPONENTS ---

function MyOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
     const token = localStorage.getItem('kiswa_token');
     fetch('/api/orders/my-orders', {
       headers: { 'Authorization': `Bearer ${token}` }
     })
     .then(res => res.json())
     .then(data => {
       if (data.success) {
         setOrders(data.data);
       }
       setLoading(false);
     });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'PROCESSING': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'SHIPPED': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'DELIVERED': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'CANCELLED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-foreground/60 bg-surface-2 border-surface-2';
    }
  };

  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status === filter.toUpperCase());

  if (loading) {
    return <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-2 pb-6">
        <h2 className="font-serif text-2xl text-accent flex items-center gap-3">
          My Orders 
          <span className="text-xs font-sans font-medium bg-accent text-[#0A0A0A] px-2 py-0.5 rounded-full">{orders.length}</span>
        </h2>
        <div className="flex bg-[#111] border border-surface-2 rounded-lg p-1 overflow-x-auto custom-scrollbar snap-x">
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors snap-start ${filter === f ? 'bg-surface-2 text-[#F5F0E8]' : 'text-foreground/50 hover:text-foreground/80'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-[#111] border border-surface-2 rounded-xl p-12 text-center">
          <Package className="w-12 h-12 text-surface-2 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-accent mb-2">No orders found</h3>
          <p className="text-sm text-foreground/50 mb-6">{filter === 'All' ? "You haven't placed any orders yet." : `You have no ${filter.toLowerCase()} orders.`}</p>
          <Link to="/clothing" className="inline-block border border-accent text-accent px-6 py-2.5 tracking-widest uppercase text-xs font-bold hover:bg-accent/10 transition-colors">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-[#111] border border-surface-2 rounded-xl p-5 sm:p-6 transition-all hover:border-surface-2/80">
               {/* TOP ROW */}
               <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                 <div>
                   <h3 className="font-mono font-bold text-accent text-sm mb-1">#KSW-{order.id.slice(-8).toUpperCase()}</h3>
                   <div className="text-xs text-foreground/50 flex items-center gap-2">
                     {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                     <span>•</span>
                     <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${getStatusColor(order.status)}`}>
                       {order.status}
                     </span>
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Total</div>
                   <div className="font-serif text-lg text-accent">Rs. {order.totalAmount.toLocaleString()}</div>
                 </div>
               </div>

               {/* ITEMS PREVIEW */}
               <div className="flex gap-3 mb-6">
                 {order.items.slice(0, 3).map((item: any) => (
                   <div key={item.id} className="w-12 h-16 bg-[#1A1A1A] border border-surface-2 rounded overflow-hidden shrink-0">
                     {item.product?.images ? (
                       <img src={item.product.images.split(',')[0]} alt="product" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-[10px] text-foreground/20">IMG</div>
                     )}
                   </div>
                 ))}
                 {order.items.length > 3 && (
                   <div className="w-12 h-16 bg-surface-2 rounded border border-surface-2 flex items-center justify-center text-xs font-bold text-foreground/70 shrink-0">
                     +{order.items.length - 3}
                   </div>
                 )}
               </div>

               {/* BOTTOM ACTIONS */}
               <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-surface-2">
                 <div className="text-xs text-foreground/50">
                   Paid via: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                 </div>
                 <div className="flex gap-3">
                   <button 
                     onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                     className="border border-accent text-accent px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-accent/10 transition-colors"
                   >
                     Track Order
                   </button>
                   <button 
                     onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                     className="bg-surface-2 text-[#F5F0E8] px-4 py-2 text-xs font-bold tracking-widest uppercase hover:bg-surface-2/80 transition-colors"
                   >
                     {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                   </button>
                 </div>
               </div>

               {/* EXPANDED DETAILS */}
               <AnimatePresence>
                 {expandedOrder === order.id && (
                   <motion.div 
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: 'auto', opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden"
                   >
                     <div className="pt-6 mt-6 border-t border-surface-2/50 grid grid-cols-1 md:grid-cols-2 gap-8">
                       
                       {/* Full Items List */}
                       <div>
                         <h4 className="text-xs text-foreground/50 uppercase tracking-widest mb-4">Items</h4>
                         <div className="space-y-4">
                           {order.items.map((item: any) => (
                             <div key={item.id} className="flex gap-3 text-sm">
                               <div className="w-10 h-12 bg-[#1A1A1A] rounded overflow-hidden shrink-0">
                                 {item.product?.images && (
                                   <img src={item.product.images.split(',')[0]} alt="product" className="w-full h-full object-cover" />
                                 )}
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="truncate font-medium">{item.product?.name || 'Item'}</div>
                                 <div className="text-xs text-foreground/50 mt-0.5">
                                   {item.variant?.size} {item.variant?.color && `• ${item.variant.color}`} x {item.quantity}
                                 </div>
                               </div>
                               <div className="text-right text-accent font-medium">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                             </div>
                           ))}
                         </div>
                       </div>

                       {/* Shipping & Meta */}
                       <div>
                         <h4 className="text-xs text-foreground/50 uppercase tracking-widest mb-4">Shipping To</h4>
                         <div className="text-sm bg-[#1A1A1A] p-4 rounded-lg border border-surface-2 mb-6">
                           {(() => {
                             try {
                               const sa = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
                               return (
                                 <>
                                   <div className="font-bold mb-1">{sa.firstName} {sa.lastName}</div>
                                   <div className="text-foreground/70">{sa.address}</div>
                                   {sa.apartment && <div className="text-foreground/70">{sa.apartment}</div>}
                                   <div className="text-foreground/70">{sa.city}, {sa.province} {sa.postalCode}</div>
                                   <div className="text-foreground/70 mt-2">{sa.phone}</div>
                                 </>
                               )
                             } catch(e) {
                               return <div>Address data unavailable</div>
                             }
                           })()}
                         </div>
                       </div>

                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyWishlistTab({ showToast }: { showToast: (msg:string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    const token = localStorage.getItem('kiswa_token');
    fetch('/api/wishlist', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setItems(data.data);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    // Check if there are local wishlist items to sync first
    const syncLocalWishlist = async () => {
      const token = localStorage.getItem('kiswa_token');
      try {
        const localStr = localStorage.getItem('kiswa_wishlist');
        if (localStr) {
          const localItems = JSON.parse(localStr);
          if (Array.isArray(localItems) && localItems.length > 0) {
            await fetch('/api/wishlist/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ productIds: localItems })
            });
            // Clear local after sync
            localStorage.removeItem('kiswa_wishlist');
          }
        }
      } catch (e) {
        console.error("Sync failed", e);
      }
      fetchWishlist();
    };
    
    syncLocalWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    const token = localStorage.getItem('kiswa_token');
    try {
      const res = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast("Removed from wishlist");
        setItems(items.filter(i => i.id !== productId));
      }
    } catch(e) {
       console.error("Remove from wishlist error", e);
    }
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-surface-2 pb-6">
        <h2 className="font-serif text-2xl text-accent flex items-center gap-3">
          My Wishlist 
          <span className="text-xs font-sans font-medium bg-accent text-[#0A0A0A] px-2 py-0.5 rounded-full">{items.length}</span>
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#111] border border-surface-2 rounded-xl p-12 text-center">
          <Heart className="w-12 h-12 text-surface-2 mx-auto mb-4" />
          <h3 className="font-serif text-xl text-accent mb-2">Your wishlist is empty</h3>
          <p className="text-sm text-foreground/50 mb-6">Save items you love to review them later.</p>
          <Link to="/clothing" className="inline-block border border-accent text-accent px-6 py-2.5 tracking-widest uppercase text-xs font-bold hover:bg-accent/10 transition-colors">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {items.map(product => (
            <div key={product.id} className="group relative border border-surface-2 rounded-lg bg-[#111] overflow-hidden flex flex-col transition-colors hover:border-surface-2/80">
              
              <button 
                onClick={() => handleRemove(product.id)}
                className="absolute top-2 right-2 z-10 w-8 h-8 bg-[#0A0A0A]/80 flex items-center justify-center rounded-full text-foreground/50 hover:text-red-400 transition-colors"
                title="Remove from Wishlist"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <Link to={`/product/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-[#1A1A1A]">
                {product.images && (
                  <img src={product.images.split(',')[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                )}
              </Link>
              
              <div className="p-4 flex flex-col flex-1">
                <Link to={`/product/${product.slug}`}>
                  <h3 className="font-serif text-sm sm:text-base text-[#F5F0E8] mb-1 line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                </Link>
                <div className="text-sm font-bold text-accent mb-4">Rs. {product.basePrice.toLocaleString()}</div>
                
                <Link 
                  to={`/product/${product.slug}`}
                  className="mt-auto block w-full border border-accent text-accent py-2 text-center text-xs tracking-widest uppercase font-bold hover:bg-accent/10 transition-colors rounded"
                >
                  View Product
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ user, setUser, showToast }: { user: any, setUser: any, showToast: (msg:string) => void }) {
  const [profileData, setProfileData] = useState({ name: user.name, phone: user.phone || '' });
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);
  
  const [profileErr, setProfileErr] = useState('');
  const [pwErr, setPwErr] = useState('');

  const getPasswordStrength = () => {
    const pw = pwData.newPassword;
    if (!pw) return 0;
    if (pw.length < 8) return 1;
    let score = 1;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score >= 3) return 3;
    return 2;
  };
  const strength = getPasswordStrength();
  const strengthColors = ['bg-surface-2', 'bg-red-500', 'bg-amber-500', 'bg-green-500'];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErr('');
    setLoadingProfile(true);
    
    try {
      const token = localStorage.getItem('kiswa_token');
      const res = await fetch('/api/auth/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (data.success) {
        setUser({ ...user, name: data.data.name });
        localStorage.setItem('kiswa_user', JSON.stringify({ ...user, name: data.data.name }));
        showToast("Profile updated successfully");
      } else {
        setProfileErr(data.message || 'Update failed');
      }
    } catch(err) {
      setProfileErr("A network error occurred");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErr('');
    
    if (pwData.newPassword.length < 8) {
      setPwErr("Password must be at least 8 characters");
      return;
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwErr("Passwords do not match");
      return;
    }

    setLoadingPw(true);
    try {
      const token = localStorage.getItem('kiswa_token');
      const res = await fetch('/api/auth/customer/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(pwData)
      });
      const data = await res.json();
      if (data.success) {
        setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showToast("Password updated successfully");
      } else {
        setPwErr(data.message || 'Update failed');
      }
    } catch(err) {
      setPwErr("A network error occurred");
    } finally {
      setLoadingPw(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* PERSONAL INFO */}
      <div>
        <h2 className="font-serif text-xl border-b border-surface-2 text-accent pb-4 mb-6">Personal Information</h2>
        
        <form onSubmit={handleProfileSubmit} className="max-w-md space-y-5">
           {profileErr && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded">{profileErr}</div>}
           
           <div className="space-y-1">
             <label className="text-sm text-foreground/70">Full Name</label>
             <input 
               type="text" 
               required
               value={profileData.name}
               onChange={(e) => setProfileData({...profileData, name: e.target.value})}
               className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
             />
           </div>

           <div className="space-y-1 opacity-60">
             <label className="text-sm text-foreground/70">Email Address (Cannot change)</label>
             <input 
               type="email" 
               disabled
               value={user.email}
               className="w-full bg-[#1A1A1A] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none cursor-not-allowed"
             />
           </div>

           <div className="space-y-1">
             <label className="text-sm text-foreground/70">Phone Number (Optional)</label>
             <input 
               type="tel" 
               value={profileData.phone}
               onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
               className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
               placeholder="e.g. 0300 1234567"
             />
           </div>

           <button 
             type="submit"
             disabled={loadingProfile}
             className="bg-accent text-[#0A0A0A] font-bold px-8 py-3 rounded hover:bg-accent/90 transition-colors uppercase tracking-widest text-sm"
           >
             {loadingProfile ? 'Saving...' : 'Save Changes'}
           </button>
        </form>
      </div>

      {/* CHANGE PASSWORD */}
      <div>
        <h2 className="font-serif text-xl border-b border-surface-2 text-accent pb-4 mb-6 pt-4">Change Password</h2>
        
        <form onSubmit={handlePwSubmit} className="max-w-md space-y-5">
           {pwErr && <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded">{pwErr}</div>}
           
           <div className="space-y-1">
             <label className="text-sm text-foreground/70">Current Password</label>
             <input 
               type="password" 
               required
               value={pwData.currentPassword}
               onChange={(e) => setPwData({...pwData, currentPassword: e.target.value})}
               className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
             />
           </div>

           <div className="space-y-1">
             <label className="text-sm text-foreground/70">New Password</label>
             <input 
               type="password" 
               required
               value={pwData.newPassword}
               onChange={(e) => setPwData({...pwData, newPassword: e.target.value})}
               className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
             />
             {pwData.newPassword.length > 0 && (
               <div className="flex bg-surface-2 h-1 rounded overflow-hidden mt-2">
                 <div className={`h-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${(strength / 3) * 100}%` }} />
               </div>
             )}
           </div>

           <div className="space-y-1">
             <label className="text-sm text-foreground/70">Confirm New Password</label>
             <input 
               type="password" 
               required
               value={pwData.confirmPassword}
               onChange={(e) => setPwData({...pwData, confirmPassword: e.target.value})}
               className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
             />
           </div>

           <button 
             type="submit"
             disabled={loadingPw || !pwData.currentPassword || !pwData.newPassword}
             className="border border-accent text-accent font-bold px-8 py-3 rounded hover:bg-accent/10 transition-colors uppercase tracking-widest text-sm disabled:opacity-50"
           >
             {loadingPw ? 'Updating...' : 'Update Password'}
           </button>
        </form>
      </div>

    </div>
  );
}
