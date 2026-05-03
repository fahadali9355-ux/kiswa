import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { Search, Heart, ShoppingBag, Menu, ShieldCheck, Truck, Banknote, Instagram, MessageCircle, X } from 'lucide-react';

import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';

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

  // Listen for storage changes to update navbar when logging in/out on other tabs/pages
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
    // Custom event for same-page updates
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
              <Link to="/admin" className="hidden lg:block text-sm font-bold tracking-widest text-[#F5F0E8] hover:text-accent transition-colors">
                ADMIN
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
              
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-xl hover:text-accent transition-colors mt-4">Admin Dashboard</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = () => {
  const shouldReduceMotion = useReducedMotion();
  const animationProps = shouldReduceMotion ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1 }
  };

  return (
    <section className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#111111]/80 via-[#0A0A0A] to-[#0A0A0A] z-0 pointer-events-none"></div>
      
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
          <button className="bg-accent text-background font-medium py-3 px-8 hover:bg-accent/90 transition-colors">
            Shop Clothing
          </button>
          <button className="border border-accent text-accent font-medium py-3 px-8 hover:bg-accent hover:text-background transition-colors">
            Shop Watches
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const Marquee = () => {
  const text = "FREE DELIVERY OVER RS. 5,000  •  NEW ARRIVALS EVERY WEEK  •  CASH ON DELIVERY AVAILABLE  •  PREMIUM QUALITY GUARANTEED  •  ";
  return (
    <div className="w-full bg-surface-1 overflow-hidden border-y border-surface-2 py-3">
      <div className="flex w-max animate-marquee space-x-8">
        <span className="text-accent text-xs font-semibold tracking-widest whitespace-nowrap">{text}</span>
        <span className="text-accent text-xs font-semibold tracking-widest whitespace-nowrap">{text}</span>
      </div>
    </div>
  );
};

const FeaturedCategories = () => {
  const shouldReduceMotion = useReducedMotion();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  const cardAnimation = shouldReduceMotion ? {} : {
    initial: { y: 50, opacity: 0 },
    whileInView: { y: 0, opacity: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  if (error) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 className="font-serif text-3xl md:text-4xl text-center mb-16">Shop by Category</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <>
            <div className="h-[400px] sm:h-[500px] bg-surface-2 animate-pulse flex items-center justify-center">
            </div>
            <div className="h-[400px] sm:h-[500px] bg-surface-2 animate-pulse flex items-center justify-center">
            </div>
          </>
        ) : (
          categories.map((category, index) => (
            <motion.div 
              key={category.id}
              className="group relative bg-[#111] h-[400px] sm:h-[500px] flex flex-col items-center justify-center overflow-hidden cursor-pointer border border-transparent transition-colors duration-500 hover:border-accent"
              {...cardAnimation}
              transition={{ duration: 0.6, ease: "easeOut", delay: shouldReduceMotion ? 0 : index * 0.2 }}
            >
              <div className="absolute inset-0 bg-surface-2/30 group-hover:scale-105 transition-transform duration-700 ease-out z-0">
                 {/* Actual image goes here */}
              </div>
              <div className="relative z-10 text-center p-6 bg-background/50 backdrop-blur-sm w-full md:w-auto min-w-[300px] border border-surface-2 group-hover:border-accent/50 transition-colors">
                 <h3 className="font-serif text-3xl mb-2">{category.name}</h3>
                 <p className="text-foreground/70 mb-6">{category.description || 'Discover the collection'}</p>
                 <span className="text-accent font-medium text-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all">
                   Explore <span aria-hidden="true">&rarr;</span>
                 </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
};

const NewArrivals = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/products/featured')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, []);

  if (error) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-surface-2">
      <div className="flex justify-between items-end mb-12">
        <h2 className="font-serif text-3xl md:text-4xl leading-none">New Arrivals</h2>
        {!loading && products.length > 0 && (
          <a href="#" className="hidden sm:flex text-accent text-sm font-medium items-center gap-2 hover:gap-3 transition-all">
            View All <span aria-hidden="true">&rarr;</span>
          </a>
        )}
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="group">
              <div className="relative aspect-square bg-surface-2 mb-4 animate-pulse"></div>
              <div className="h-4 bg-surface-2 w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-surface-2 w-1/4 animate-pulse"></div>
            </div>
          ))
        ) : (
          products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="relative aspect-square bg-surface-2 mb-4 overflow-hidden border border-transparent transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent/50 flex items-center justify-center">
                <span className="text-surface-2/60 font-mono text-sm text-foreground/20">[ img ]</span>
                <button className="absolute top-3 right-3 text-foreground/50 hover:text-accent transition-colors z-10">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-sm text-foreground mb-1 truncate">{product.name}</h3>
              <p className="text-accent text-sm font-bold">
                Rs. {product.basePrice.toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      {!loading && products.length > 0 && (
        <div className="mt-8 text-center sm:hidden">
          <a href="#" className="inline-flex text-accent text-sm font-medium items-center gap-2 hover:gap-3 transition-all">
            View All <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      )}
    </section>
  );
};

const Features = () => {
  const shouldReduceMotion = useReducedMotion();
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 bg-[#0D0D0D] border-y border-surface-2">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center"
        variants={shouldReduceMotion ? {} : container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.div variants={shouldReduceMotion ? {} : item} className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center mb-6 text-accent">
            <ShieldCheck strokeWidth={1.5} className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl mb-3">Premium Quality</h3>
          <p className="text-foreground/60 text-sm max-w-xs leading-relaxed">
            Uncompromising materials sourced globally, crafted for longevity and elegance.
          </p>
        </motion.div>

        <motion.div variants={shouldReduceMotion ? {} : item} className="flex flex-col items-center border-y md:border-x md:border-y-0 border-surface-2 py-12 md:py-0">
          <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center mb-6 text-accent">
            <Truck strokeWidth={1.5} className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl mb-3">Fast Delivery</h3>
          <p className="text-foreground/60 text-sm max-w-xs leading-relaxed">
            Expedited shipping nationwide, ensuring your luxury items arrive promptly and securely.
          </p>
        </motion.div>

        <motion.div variants={shouldReduceMotion ? {} : item} className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border border-accent/20 flex items-center justify-center mb-6 text-accent">
            <Banknote strokeWidth={1.5} className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl mb-3">Cash on Delivery</h3>
          <p className="text-foreground/60 text-sm max-w-xs leading-relaxed">
            Secure and convenient payment upon receipt of your items at your doorstep.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="pt-20 border-t border-accent/30 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        <div>
          <h4 className="font-serif text-2xl text-accent mb-4 tracking-wider">Kiswa</h4>
          <p className="text-foreground/60 text-sm leading-relaxed mb-6">
            Architectural refinement. A new standard for everyday elegance and horology.
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-6 uppercase text-xs tracking-widest text-foreground/80">Quick Links</h4>
          <ul className="space-y-4">
            <li><a href="#" className="text-foreground/60 hover:text-accent transition-colors text-sm">Collections</a></li>
            <li><a href="#" className="text-foreground/60 hover:text-accent transition-colors text-sm">Heritage</a></li>
            <li><a href="#" className="text-foreground/60 hover:text-accent transition-colors text-sm">Bespoke</a></li>
            <li><a href="#" className="text-foreground/60 hover:text-accent transition-colors text-sm">FAQs</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-6 uppercase text-xs tracking-widest text-foreground/80">Contact</h4>
          <ul className="space-y-4">
            <li className="text-foreground/60 text-sm">hello@kiswa.pk</li>
            <li className="text-foreground/60 text-sm">+92 300 1234567</li>
            <li className="text-foreground/60 text-sm mt-4">
              Block 4, Clifton<br/>Karachi, Pakistan
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium mb-6 uppercase text-xs tracking-widest text-foreground/80">Follow Us</h4>
          <div className="flex space-x-4">
            <a href="#" className="w-10 h-10 rounded-full border border-surface-2 flex items-center justify-center text-foreground/60 hover:text-background hover:bg-accent hover:border-accent transition-all">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full border border-surface-2 flex items-center justify-center text-foreground/60 hover:text-background hover:bg-accent hover:border-accent transition-all">
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      
      <div className="border-t border-surface-2 py-8 text-center text-xs tracking-widest text-foreground/40 uppercase">
        © 2025 Kiswa. All rights reserved.
      </div>
    </footer>
  );
};

function Storefront() {
  return (
    <>
      <Hero />
      <Marquee />
      <FeaturedCategories />
      <NewArrivals />
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
