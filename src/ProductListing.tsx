import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, Filter, Grid as GridIcon, List, Heart, X, ChevronLeft, ChevronRight as ChevronRightIcon, Search } from 'lucide-react';

interface ProductListingProps {
  categorySlug: string;
}

export default function ProductListing({ categorySlug }: ProductListingProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState('');
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<any | null>(null);
  
  const isLoggedIn = !!localStorage.getItem('kiswa_token');
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentSize = searchParams.get('size') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = searchParams.get('page') || '1';

  // Fetch categories only once
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Error fetching categories:", err));
      
    // Load wishlist
    const stored = localStorage.getItem('kiswa_wishlist');
    if (stored) setWishlist(JSON.parse(stored));
  }, []);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    let url = `/api/products?category=${categorySlug}&page=${currentPage}&limit=12`;
    if (currentSize) url += `&size=${currentSize}`;
    if (currentSort) url += `&sort=${currentSort}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        if (data.pagination) setPagination(data.pagination);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, [categorySlug, currentSize, currentSort, currentPage]);

  const updateFilters = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 on filter change
    if (key !== 'page') newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const toggleWishlist = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let newWishlist = [...wishlist];
    const isAdding = !wishlist.includes(id);
    
    if (isAdding) {
      newWishlist.push(id);
    } else {
      newWishlist = newWishlist.filter(item => item !== id);
    }
    setWishlist(newWishlist);
    localStorage.setItem('kiswa_wishlist', JSON.stringify(newWishlist));
    
    if (isLoggedIn) {
       const token = localStorage.getItem('kiswa_token');
       try {
         if (isAdding) {
             await fetch('/api/wishlist', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ productId: id })
             });
             showToast("Added to wishlist");
         } else {
             await fetch(`/api/wishlist/${id}`, {
                 method: 'DELETE',
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             showToast("Removed from wishlist");
         }
       } catch(e) {
           console.error("Wishlist error", e);
       }
    } else {
        if (isAdding) {
            showToast("Login to back up your wishlist");
        }
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const currentCategoryObj = categories.find(c => c.slug === categorySlug);
  const title = currentCategoryObj?.name || (categorySlug === 'everyday-wear' ? 'Clothing' : 'Watches');
  const description = currentCategoryObj?.description || 'Discover our elegant collection.';

  return (
    <div className="bg-[#0A0A0A] text-[#F5F0E8] min-h-screen pt-24 pb-12 font-sans relative">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50 bg-[#111111] border border-accent text-accent px-6 py-3 rounded shadow-xl flex items-center justify-center text-sm font-medium whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION 1 - PAGE HEADER */}
        <div className="mb-8">
          <div className="flex items-center text-xs text-foreground/60 mb-4 tracking-wider uppercase font-medium">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-foreground/40">{title}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-accent mb-2">{title}</h1>
              <p className="text-foreground/60 text-sm max-w-xl">{description}</p>
            </div>
            {!loading && (
              <div className="text-accent text-sm font-medium tracking-wide uppercase">
                {pagination.total} Products
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2 - FILTER BAR */}
        <div className="sticky top-20 z-40 bg-[#0D0D0D]/95 backdrop-blur-md border-y border-surface-2 py-4 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Mobile Filter Button */}
            <button 
              className="lg:hidden flex items-center gap-2 border border-surface-2 px-4 py-2 rounded-full text-sm font-medium hover:border-accent transition-colors"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            {/* Desktop Filters (Left) */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Category Links (simulated as filters here for easy navigation) */}
              <div className="flex gap-2">
                <Link to="/clothing" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categorySlug === 'everyday-wear' ? 'bg-accent text-background' : 'bg-surface-2 hover:bg-surface-2/80'}`}>Clothing</Link>
                <Link to="/watches" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categorySlug === 'luxury-watches' ? 'bg-accent text-background' : 'bg-surface-2 hover:bg-surface-2/80'}`}>Watches</Link>
              </div>
              <div className="w-px h-6 bg-surface-2"></div>
              {/* Size Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-foreground/50 mr-2">Size:</span>
                {['S', 'M', 'L', 'XL'].map(size => (
                  <button 
                    key={size}
                    onClick={() => updateFilters('size', currentSize === size ? '' : size)}
                    className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${currentSize === size ? 'bg-accent text-background' : 'bg-surface-2 text-foreground/80 hover:border-accent border border-transparent'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4 ml-auto lg:ml-0">
              <select 
                value={currentSort}
                onChange={(e) => updateFilters('sort', e.target.value)}
                className="bg-transparent border border-surface-2 text-sm px-3 py-2 rounded-full focus:outline-none focus:border-accent appearance-none pr-8 cursor-pointer relative"
              >
                <option value="newest" className="bg-[#111111] text-[#F5F0E8]">Newest</option>
                <option value="price_asc" className="bg-[#111111] text-[#F5F0E8]">Price: Low to High</option>
                <option value="price_desc" className="bg-[#111111] text-[#F5F0E8]">Price: High to Low</option>
                <option value="popular" className="bg-[#111111] text-[#F5F0E8]">Most Popular</option>
              </select>
              
              <div className="hidden sm:flex border border-surface-2 rounded-full overflow-hidden p-0.5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-surface-2 text-accent' : 'text-foreground/50 hover:text-foreground'}`}
                >
                  <GridIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-surface-2 text-accent' : 'text-foreground/50 hover:text-foreground'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3, 4, 5 - CONTENTS */}
        
        {loading ? (
          // LOADING STATE
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`flex ${viewMode === 'list' ? 'flex-row gap-6' : 'flex-col'}`}>
                <div className={`bg-[#1A1A1A] animate-pulse rounded-md ${viewMode === 'list' ? 'w-48 h-64' : 'aspect-[3/4] w-full'}`}></div>
                <div className={`mt-4 space-y-3 ${viewMode === 'list' ? 'flex-1 py-4' : ''}`}>
                  <div className="h-4 bg-[#1A1A1A] animate-pulse rounded w-3/4"></div>
                  <div className="h-3 bg-[#1A1A1A] animate-pulse rounded w-1/3"></div>
                  <div className="h-4 bg-[#1A1A1A] animate-pulse rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          // EMPTY STATE
          <div className="py-24 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border border-surface-2 flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-foreground/40" />
            </div>
            <h3 className="text-2xl font-serif text-foreground/80 mb-2">No products found</h3>
            <p className="text-foreground/50 mb-6">Try adjusting your filters or browsing a different category.</p>
            <button 
              onClick={clearFilters}
              className="border border-accent text-accent px-6 py-2 rounded-full text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          // PRODUCTS GRID
          <div className={`grid gap-x-6 gap-y-10 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {products.map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`group flex ${viewMode === 'list' ? 'flex-row gap-6 border-b border-surface-2 pb-6' : 'flex-col'} relative`}
              >
                {/* Image Area */}
                <div className={`bg-[#1A1A1A] rounded-md overflow-hidden relative ${viewMode === 'list' ? 'w-48 h-64 flex-shrink-0' : 'aspect-[3/4] w-full'}`}>
                  {product.images && product.images.length > 0 ? (
                     <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-foreground/20">No Image</div>
                  )}
                  
                  {/* Overlay Border */}
                  <div className="absolute inset-0 border border-transparent group-hover:border-accent/50 transition-colors pointer-events-none"></div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {/* Assume out of stock if variants exist but sum qty is 0. Using a placeholder logic here */}
                    {product.isFeatured && (
                      <span className="bg-accent text-background text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm">New</span>
                    )}
                  </div>

                  {/* Wishlist */}
                  <button 
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-background/20 backdrop-blur-md hover:bg-background/80 transition-colors z-10"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-accent text-accent' : 'text-white'}`} />
                  </button>

                  {/* Quick View */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedQuickViewProduct(product); }}
                      className="w-full py-3 bg-black/80 backdrop-blur-sm text-white text-sm font-medium uppercase tracking-wider hover:bg-accent hover:text-black transition-colors rounded-sm"
                    >
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className={`mt-4 flex flex-col ${viewMode === 'list' ? 'justify-center flex-1' : ''}`}>
                  <div className="text-xs text-foreground/50 tracking-wider uppercase mb-1">{currentCategoryObj?.name}</div>
                  <h3 className="text-base font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">{product.name}</h3>
                  <div className="mt-2 text-accent font-bold">Rs. {product.basePrice.toLocaleString()}</div>
                  
                  {/* Swatches (dummy based on variants color if exists) */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mt-3 flex gap-1.5">
                      {Array.from(new Set(product.variants.filter((v:any) => v.color).map((v:any) => v.color))).map((color: any, idx) => (
                        <div 
                          key={idx} 
                          className="w-4 h-4 rounded-full border border-surface-2"
                          style={{ backgroundColor: (color as string).toLowerCase().replace(' ', '') || '#333' }}
                          title={color as string}
                        />
                      ))}
                    </div>
                  )}
                  {viewMode === 'list' && (
                    <p className="mt-4 text-sm text-foreground/70 line-clamp-2 max-w-xl">{product.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* SECTION 6 - PAGINATION */}
        {!loading && pagination.pages > 1 && (
          <div className="mt-16 flex justify-center items-center gap-2">
            <button 
              disabled={pagination.page <= 1}
              onClick={() => updateFilters('page', String(pagination.page - 1))}
              className="p-2 border border-surface-2 rounded-full disabled:opacity-50 hover:border-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mx-4">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateFilters('page', String(i + 1))}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${pagination.page === i + 1 ? 'bg-accent text-background' : 'hover:bg-surface-2 text-foreground/70'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={pagination.page >= pagination.pages}
              onClick={() => updateFilters('page', String(pagination.page + 1))}
              className="p-2 border border-surface-2 rounded-full disabled:opacity-50 hover:border-accent transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* MOBILE FILTER DRAWER */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] rounded-t-2xl p-6 lg:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-header">Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 -mr-2 text-foreground/60 hover:text-accent">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Size */}
                <div>
                  <h4 className="text-xs tracking-widest uppercase text-foreground/50 mb-3 font-medium">Size</h4>
                  <div className="flex flex-wrap gap-2">
                    {['S', 'M', 'L', 'XL'].map(size => (
                      <button 
                        key={size}
                        onClick={() => updateFilters('size', currentSize === size ? '' : size)}
                        className={`px-4 py-2 rounded border text-sm transition-colors ${currentSize === size ? 'bg-accent border-accent text-background font-medium' : 'border-surface-2 text-foreground/80'}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-2">
                   <button 
                     onClick={() => { clearFilters(); setIsMobileFilterOpen(false); }}
                     className="w-full py-3 border border-surface-2 rounded-md text-sm font-medium hover:bg-surface-2 transition-colors"
                   >
                     Clear All Filters
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedQuickViewProduct && (
          <QuickViewModal product={selectedQuickViewProduct} onClose={() => setSelectedQuickViewProduct(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickViewModal({ product, onClose }) {
    const [selectedSize, setSelectedSize] = useState(product.variants?.[0]?.size || '');
    const [selectedColor, setSelectedColor] = useState(product.variants?.[0]?.color || '');
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(product.images?.[0] || '');

    const currentVariant = product.variants?.find((v: any) => 
        (selectedSize ? v.size === selectedSize : true) && 
        (selectedColor ? v.color === selectedColor : true)
    );

    const price = product.basePrice + (currentVariant?.priceAdjustment || 0);

    const addToCart = () => {
        const cartItem = {
            id: `${product.id}-${selectedSize}-${selectedColor}`,
            productId: product.id,
            name: product.name,
            price: price,
            image: product.images?.[0],
            quantity: quantity,
            variantId: currentVariant?.id,
            size: selectedSize,
            color: selectedColor
        };

        const existingCart = JSON.parse(localStorage.getItem('kiswa_cart') || '[]');
        const existingItemIndex = existingCart.findIndex((item: any) => item.id === cartItem.id);

        if (existingItemIndex > -1) {
            existingCart[existingItemIndex].quantity += quantity;
        } else {
            existingCart.push(cartItem);
        }

        localStorage.setItem('kiswa_cart', JSON.stringify(existingCart));
        window.dispatchEvent(new Event('cartUpdated'));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-4xl bg-[#0D0D0D] border border-surface-2 rounded-sm overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white hover:text-accent rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Left: Images */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col gap-4">
                    <div className="aspect-[3/4] rounded overflow-hidden bg-[#1A1A1A]">
                        <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    {product.images?.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {product.images.map((img: string, idx: number) => (
                                <button 
                                    key={idx} 
                                    onClick={() => setMainImage(img)}
                                    className={`w-16 h-20 rounded overflow-hidden border-2 flex-shrink-0 transition-colors ${mainImage === img ? 'border-accent' : 'border-transparent'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                    <div className="mb-6">
                        <div className="text-xs text-accent uppercase tracking-widest font-bold mb-2">Quick View</div>
                        <h2 className="text-3xl font-serif text-foreground mb-2">{product.name}</h2>
                        <div className="text-2xl font-bold text-accent">Rs. {price.toLocaleString()}</div>
                    </div>

                    <div className="space-y-6 mb-8">
                        {/* Size Selection */}
                        {product.variants?.some(v => v.size) && (
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-foreground/50 mb-3">Size</label>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(new Set(product.variants.filter(v => v.size).map(v => v.size))).map((size: any) => (
                                        <button 
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-10 h-10 border flex items-center justify-center text-sm font-medium transition-colors ${selectedSize === size ? 'bg-accent border-accent text-background' : 'border-surface-2 text-foreground hover:border-accent'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Color Selection */}
                        {product.variants?.some(v => v.color) && (
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-foreground/50 mb-3">Color</label>
                                <div className="flex flex-wrap gap-3">
                                    {Array.from(new Set(product.variants.filter(v => v.color).map(v => v.color))).map((color: any) => (
                                        <button 
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-8 h-8 rounded-full border-2 p-0.5 transition-transform ${selectedColor === color ? 'border-accent scale-110' : 'border-transparent'}`}
                                        >
                                            <div 
                                                className="w-full h-full rounded-full border border-surface-2" 
                                                style={{ backgroundColor: color.toLowerCase().replace(' ', '') }} 
                                                title={color}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-foreground/50 mb-3">Quantity</label>
                            <div className="flex items-center gap-4">
                                <div className="flex border border-surface-2 rounded overflow-hidden">
                                    <button 
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-4 py-2 hover:bg-surface-2 transition-colors border-r border-surface-2"
                                    >-</button>
                                    <div className="px-6 py-2 text-sm font-medium">{quantity}</div>
                                    <button 
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-4 py-2 hover:bg-surface-2 transition-colors border-l border-surface-2"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={addToCart}
                            className="w-full py-4 bg-accent text-background text-sm font-bold uppercase tracking-widest hover:bg-accent/90 transition-colors"
                        >
                            Add to Cart
                        </button>
                        <Link 
                            to={`/product/${product.slug}`}
                            onClick={onClose}
                            className="w-full py-4 border border-surface-2 text-center text-sm font-medium uppercase tracking-widest hover:bg-surface-2 transition-colors"
                        >
                            View Full Details
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
