import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { Search, Heart, ShoppingBag, Menu, ShieldCheck, Truck, Banknote, Instagram, MessageCircle, X } from 'lucide-react';

import { BrowserRouter, Routes, Route, Link, Outlet, useNavigate } from 'react-router-dom';

import { CartProvider, useCart } from './CartContext';
import CartDrawer from './CartDrawer';
import Checkout from './Checkout';
import OrderConfirmation from './OrderConfirmation';
import AuthPage from './AuthPage';
import OrderTracking from './OrderTracking';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { cartCount, openDrawer } = useCart();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Check auth status
    const token = localStorage.getItem('kiswa_token');
    const savedUser = localStorage.getItem('kiswa_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('kiswa_token');
      const savedUser = localStorage.getItem('kiswa_user');
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kiswa_auth_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kiswa_auth_change', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('kiswa_token');
    localStorage.removeItem('kiswa_user');
    setUser(null);
    setUserDropdownOpen(false);
    window.dispatchEvent(new Event('kiswa_auth_change'));
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0D0D0D]/95 backdrop-blur-md border-b border-surface-2' : 'bg-transparent py-2'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Left: Menu Mobile */}
            <div className="flex-1 flex items-center md:hidden">
               <button onClick={() => setMobileMenuOpen(true)} className="text-foreground hover:text-accent transition-colors">
                 <Menu className="w-6 h-6" />
               </button>
            </div>
          
            {/* Logo */}
            <div className="flex-1 md:flex-none flex justify-center md:justify-start">
              <Link to="/" className="font-serif text-3xl font-bold text-accent tracking-wider">
                Kiswa
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex flex-1 justify-center space-x-10">
              <Link to="/" className="text-sm font-medium hover:text-accent transition-colors">Home</Link>
              <Link to="/clothing" className="text-sm font-medium hover:text-accent transition-colors">Clothing</Link>
              <Link to="/watches" className="text-sm font-medium hover:text-accent transition-colors">Watches</Link>
              <a href="#about" className="text-sm font-medium hover:text-accent transition-colors">About</a>
            </div>

            {/* Right: Icons */}
            <div className="flex-1 flex justify-end items-center space-x-4 sm:space-x-6">
              <button className="hidden sm:block text-foreground hover:text-accent transition-colors">
                <Search className="w-5 h-5" />
              </button>
              
              {user ? (
                <div className="relative hidden sm:block">
                  <button 
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="w-8 h-8 rounded-full bg-accent text-[#0A0A0A] flex items-center justify-center font-bold text-xs"
                  >
                    {getInitials(user.name)}
                  </button>
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-surface-2 rounded shadow-xl py-2 z-50 flex flex-col"
                      >
                         <Link to="/account" onClick={() => setUserDropdownOpen(false)} className="px-4 py-2 hover:bg-white/5 hover:text-accent text-sm text-center">My Account</Link>
                         <Link to="/account" onClick={() => setUserDropdownOpen(false)} className="px-4 py-2 hover:bg-white/5 hover:text-accent text-sm text-center">My Orders</Link>
                         <div className="h-px bg-surface-2 my-1"></div>
                         <button onClick={handleLogout} className="px-4 py-2 hover:bg-red-400/10 text-red-400 text-sm w-full text-center">Logout</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="hidden sm:block text-sm font-bold uppercase tracking-widest text-accent hover:text-accent/80 transition-colors">Login</Link>
              )}
              
              <Link to="/account" className="hidden sm:block text-foreground hover:text-accent transition-colors" title="Wishlist">
                <Heart className="w-5 h-5" />
              </Link>
              <button onClick={openDrawer} className="text-foreground hover:text-accent transition-colors relative ml-2">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-background text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer />

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col pt-20 px-6"
          >
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-6 right-6 text-foreground hover:text-accent">
              <X className="w-8 h-8" />
            </button>
            <div className="flex flex-col space-y-6 text-2xl font-serif text-center mt-12 pb-8 overflow-y-auto custom-scrollbar">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent transition-colors">Home</Link>
              <Link to="/clothing" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent transition-colors">Clothing</Link>
              <Link to="/watches" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent transition-colors">Watches</Link>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-accent transition-colors">About</a>
              
              <div className="h-px bg-surface-2 mx-10 my-4"></div>
              
              {user ? (
                <>
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="text-xl hover:text-accent transition-colors text-accent">My Account</Link>
                  <button onClick={handleLogout} className="text-xl text-red-400 hover:opacity-80 transition-opacity">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-xl text-accent font-bold tracking-widest uppercase">Login / Register</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = () => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const animationProps = shouldReduceMotion ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1 }
  };

  return (
    <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
          alt="Luxury background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 via-[#0A0A0A]/80 to-[#0A0A0A] z-0"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <motion.h1 
          className="font-serif text-5xl sm:text-6xl md:text-[72px] leading-tight mb-6"
          {...animationProps}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Wear What Lasts.
        </motion.h1>
        
        <motion.p 
          className="text-foreground/70 text-lg md:text-xl max-w-2xl px-4 mb-10 font-light"
          {...animationProps}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          Premium everyday wear and luxury watches, crafted for those who refuse to settle.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto px-4"
          {...animationProps}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        >
          <button 
            onClick={() => navigate('/clothing')}
            className="bg-accent text-background font-bold py-4 px-10 hover:bg-accent/90 transition-all transform hover:scale-105 uppercase tracking-widest text-xs"
          >
            Shop Clothing
          </button>
          <button 
            onClick={() => navigate('/watches')}
            className="border border-accent text-accent font-bold py-4 px-10 hover:bg-accent hover:text-background transition-all transform hover:scale-105 uppercase tracking-widest text-xs"
          >
            Shop Watches
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturedCategories = () => {
  const shouldReduceMotion = useReducedMotion();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cardAnimation = shouldReduceMotion ? {} : {
    initial: { y: 50, opacity: 0 },
    whileInView: { y: 0, opacity: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="font-serif text-3xl md:text-4xl text-center mb-16">Shop by Category</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-[400px] sm:h-[500px] bg-surface-2 animate-pulse rounded-sm"></div>
          ))
        ) : (
          categories.map((category, index) => (
            <Link 
              key={category.id}
              to={category.slug === 'luxury-watches' ? '/watches' : '/clothing'}
              className="group relative bg-[#111] h-[400px] sm:h-[500px] flex flex-col items-center justify-center overflow-hidden cursor-pointer border border-transparent transition-colors duration-500 hover:border-accent rounded-sm"
            >
              <motion.div 
                className="absolute inset-0 z-0 w-full h-full"
                {...cardAnimation}
                transition={{ duration: 0.6, ease: "easeOut", delay: shouldReduceMotion ? 0 : index * 0.2 }}
              >
                {category.image ? (
                   <img src={category.image} alt={category.name} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                   <div className="w-full h-full bg-surface-2/30" />
                )}
              </motion.div>
              <div className="relative z-10 text-center p-8 bg-background/60 backdrop-blur-md w-full md:w-auto min-w-[320px] border border-surface-2 group-hover:border-accent/50 transition-all">
                 <h3 className="font-serif text-3xl mb-3 text-accent">{category.name}</h3>
                 <p className="text-foreground/70 mb-8 text-sm">{category.description || 'Discover the collection'}</p>
                 <span className="text-accent font-bold text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                   Explore <span className="text-xl leading-none">→</span>
                 </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
};

const NewArrivals = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products/featured')
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : (data.products || []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-surface-2">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl leading-none mb-4">New Arrivals</h2>
          <p className="text-foreground/40 text-sm tracking-widest uppercase">The latest from our atelier</p>
        </div>
        {!loading && products.length > 0 && (
          <Link to="/clothing" className="hidden sm:flex text-accent text-xs font-bold tracking-[0.3em] uppercase items-center gap-3 hover:gap-5 transition-all">
            View All <span>→</span>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-[3/4] bg-surface-2 animate-pulse"></div>
              <div className="h-4 bg-surface-2 w-3/4 animate-pulse"></div>
              <div className="h-4 bg-surface-2 w-1/4 animate-pulse"></div>
            </div>
          ))
        ) : (
          products.map((product) => (
            <div 
              key={product.id} 
              className="group cursor-pointer"
              onClick={() => navigate(`/product/${product.slug}`)}
            >
              <div className="relative aspect-[3/4] bg-[#111] mb-6 overflow-hidden border border-transparent transition-all duration-500 group-hover:border-accent/40 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                ) : (
                  <span className="text-surface-2/60 font-serif text-sm">KISWA</span>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <h3 className="text-sm text-foreground/80 font-medium mb-2 group-hover:text-accent transition-colors">{product.name}</h3>
              <p className="text-accent text-sm font-bold tracking-wider">
                Rs. {product.basePrice.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-[#0A0A0A] overflow-hidden border-t border-surface-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-sm border border-accent/20">
              <img 
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop" 
                alt="Craftsmanship" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-64 h-64 border border-accent/10 -z-10" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="font-serif text-4xl md:text-5xl text-accent">Our Heritage</h2>
            <p className="text-foreground/70 leading-relaxed text-lg font-light">
              Founded in Pakistan, Kiswa represents the fusion of timeless elegance and contemporary craftsmanship. We believe that true luxury is found in the details—the choice of fabric, the precision of a stitch, and the durability of a movement.
            </p>
            <p className="text-foreground/70 leading-relaxed text-lg font-light">
              Our mission is to provide premium everyday essentials that transcend seasonal trends. Each piece in our collection is a testament to our commitment to quality, designed for those who value longevity and style in equal measure.
            </p>
            <div className="pt-6">
              <div className="flex items-center gap-6">
                <div>
                  <h4 className="text-2xl font-serif text-accent mb-1">2023</h4>
                  <p className="text-[10px] uppercase tracking-widest text-foreground/40">Established</p>
                </div>
                <div className="w-px h-12 bg-surface-2" />
                <div>
                  <h4 className="text-2xl font-serif text-accent mb-1">50+</h4>
                  <p className="text-[10px] uppercase tracking-widest text-foreground/40">Craftsmen</p>
                </div>
                <div className="w-px h-12 bg-surface-2" />
                <div>
                  <h4 className="text-2xl font-serif text-accent mb-1">10k+</h4>
                  <p className="text-[10px] uppercase tracking-widest text-foreground/40">Customers</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  return (
    <section className="py-24 bg-[#0D0D0D] border-y border-surface-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div className="flex flex-col items-center group">
          <div className="w-16 h-16 rounded-full border border-accent/20 flex items-center justify-center mb-8 text-accent group-hover:bg-accent/5 transition-all">
            <ShieldCheck strokeWidth={1} className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl mb-4">Premium Quality</h3>
          <p className="text-foreground/60 text-sm max-w-xs leading-relaxed font-light">
            Uncompromising materials sourced globally, crafted for longevity and elegance.
          </p>
        </div>

        <div className="flex flex-col items-center border-y md:border-x md:border-y-0 border-surface-2 py-16 md:py-0 group">
          <div className="w-16 h-16 rounded-full border border-accent/20 flex items-center justify-center mb-8 text-accent group-hover:bg-accent/5 transition-all">
            <Truck strokeWidth={1} className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl mb-4">Fast Delivery</h3>
          <p className="text-foreground/60 text-sm max-w-xs leading-relaxed font-light">
            Expedited shipping nationwide, ensuring your luxury items arrive promptly and securely.
          </p>
        </div>

        <div className="flex flex-col items-center group">
          <div className="w-16 h-16 rounded-full border border-accent/20 flex items-center justify-center mb-8 text-accent group-hover:bg-accent/5 transition-all">
            <Banknote strokeWidth={1} className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl mb-4">Cash on Delivery</h3>
          <p className="text-foreground/60 text-sm max-w-xs leading-relaxed font-light">
            Secure and convenient payment upon receipt of your items at your doorstep.
          </p>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="pt-20 border-t border-accent/30 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <h4 className="font-serif text-3xl text-accent mb-6 tracking-wider">Kiswa</h4>
          <p className="text-foreground/60 text-sm leading-relaxed mb-8 font-light">
            Architectural refinement. A new standard for everyday elegance and luxury horology.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-foreground/40 hover:text-accent transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="#" className="text-foreground/40 hover:text-accent transition-colors"><MessageCircle className="w-5 h-5" /></a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold mb-8 uppercase text-[10px] tracking-[0.3em] text-foreground/80">Collections</h4>
          <ul className="space-y-4">
            <li><Link to="/clothing" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">Everyday Wear</Link></li>
            <li><Link to="/watches" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">Luxury Watches</Link></li>
            <li><a href="#" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">New Arrivals</a></li>
            <li><a href="#" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">Heritage</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-8 uppercase text-[10px] tracking-[0.3em] text-foreground/80">Support</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">Track Order</a></li>
            <li><a href="#" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">Shipping Policy</a></li>
            <li><a href="#" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">Return Policy</a></li>
            <li><a href="#" className="text-foreground/50 hover:text-accent transition-colors text-xs uppercase tracking-widest">FAQs</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-8 uppercase text-[10px] tracking-[0.3em] text-foreground/80">Karachi Studio</h4>
          <p className="text-foreground/50 text-xs uppercase tracking-[0.2em] leading-loose">
            Block 4, Clifton<br/>
            Karachi, Pakistan<br/>
            <span className="mt-4 block">hello@kiswa.pk</span>
            <span>+92 300 1234567</span>
          </p>
        </div>
      </div>
      
      <div className="border-t border-surface-2 py-10 text-center text-[10px] tracking-[0.4em] text-foreground/30 uppercase">
        © 2025 Kiswa Studio. Built for Excellence.
      </div>
    </footer>
  );
};

function Storefront() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <NewArrivals />
      <AboutSection />
      <Features />
    </>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Importing Dashboard
import ProductListing from './ProductListing';
import ProductDetail from './ProductDetail';
import NotFound from './NotFound';

const AdminDashboard = lazy(() => import('./AdminDashboard'));
const MyAccount = lazy(() => import('./MyAccount'));

const PageLoader = () => (
  <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-[100]">
    <div className="w-16 h-16 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
    <h1 className="text-2xl font-serif text-accent tracking-widest animate-pulse">Kiswa</h1>
  </div>
);

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Storefront />} />
              <Route path="/clothing" element={<ProductListing categorySlug="everyday-wear" />} />
              <Route path="/watches" element={<ProductListing categorySlug="luxury-watches" />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
              <Route path="/track-order" element={<OrderTracking />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/account" element={<MyAccount />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </CartProvider>
  );
}
