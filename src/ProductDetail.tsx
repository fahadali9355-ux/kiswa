import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { Star, ChevronDown, ChevronRight, Minus, Plus, Heart, Truck, Banknote, Undo2 } from 'lucide-react';
import { useCart } from './CartContext';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  
  const [expandedSection, setExpandedSection] = useState<'details' | 'sizeGuide' | 'shipping' | null>('details');
  
  const { addToCart, openDrawer } = useCart();
  
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [toast, setToast] = useState('');

  const isLoggedIn = !!localStorage.getItem('kiswa_token');

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setNotFound(false);
    
    // Load wishlist
    const stored = localStorage.getItem('kiswa_wishlist');
    if (stored) setWishlist(JSON.parse(stored));

    fetch(`/api/products/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setReviews(data.reviews || []);
        
        // Auto-select first available variants
        if (data.variants && data.variants.length > 0) {
          const sizes = Array.from(new Set(data.variants.map((v:any) => v.size).filter(Boolean))) as string[];
          if (sizes.length > 0) {
            const firstAvailableSize = sizes.find(s => data.variants.some((v:any) => v.size === s && v.stockQty > 0)) || sizes[0];
            setSelectedSize(firstAvailableSize);
          }
          
          const colors = Array.from(new Set(data.variants.map((v:any) => v.color).filter(Boolean))) as string[];
          if (colors.length > 0) {
            setSelectedColor(colors[0]);
          }
        }
        
        // Fetch related products
        if (data.categoryId) {
          fetch(`/api/products?category=${data.category.slug}&limit=5`)
            .then(r => r.json())
            .then(relatedData => {
              setRelatedProducts((relatedData.products || []).filter((p: any) => p.id !== data.id).slice(0, 4));
            });
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  const images = product?.images && product.images.length > 0 ? product.images : [];
  
  const uniqueSizes = product?.variants ? Array.from(new Set(product.variants.map((v:any) => v.size).filter(Boolean))) as string[] : [];
  const uniqueColors = product?.variants ? Array.from(new Set(product.variants.map((v:any) => v.color).filter(Boolean))) as string[] : [];

  const selectedVariant = product?.variants?.find((v:any) => 
    (!selectedSize || v.size === selectedSize) && 
    (!selectedColor || v.color === selectedColor)
  );

  const finalPrice = product ? (product.basePrice + (selectedVariant?.priceAdjustment || 0)) : 0;
  const stockQty = selectedVariant?.stockQty ?? (product?.variants?.length > 0 ? 0 : 99); // If no variants, assume in stock for now
  
  const handleAddToCart = () => {
    if (!product) return;
    if (uniqueSizes.length > 0 && !selectedSize) return;
    if (uniqueColors.length > 0 && !selectedColor) return;
    if (stockQty <= 0) return;

    setAddingToCart(true);
    
    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      name: product.name,
      price: finalPrice,
      image: images[0] || '',
      size: selectedSize,
      color: selectedColor,
      quantity
    });

    setTimeout(() => {
      setAddingToCart(false);
      openDrawer();
    }, 1000); // UI feedback
  };

  const toggleWishlist = async () => {
    if (!product) return;
    
    let newWishlist = [...wishlist];
    const isAdding = !wishlist.includes(product.id);
    
    if (isAdding) {
      newWishlist.push(product.id);
    } else {
      newWishlist = newWishlist.filter(id => id !== product.id);
    }
    setWishlist(newWishlist);
    
    // Always keep local in sync for guest users
    localStorage.setItem('kiswa_wishlist', JSON.stringify(newWishlist));
    
    if (isLoggedIn) {
       const token = localStorage.getItem('kiswa_token');
       try {
         if (isAdding) {
             await fetch('/api/wishlist', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 body: JSON.stringify({ productId: product.id })
             });
             showToast("Added to wishlist");
         } else {
             await fetch(`/api/wishlist/${product.id}`, {
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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);
    setReviewError('');
    try {
      const token = localStorage.getItem('kiswa_token') || localStorage.getItem('kiswa_admin_token');
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (data.success) {
        setReviews([data.data, ...reviews]);
        setReviewComment('');
        setReviewRating(5);
      } else {
        setReviewError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError('An error occurred');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-accent font-sans">Loading product...</div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen pt-32 pb-12 flex flex-col items-center justify-center text-center px-4">
        <h1 className="font-serif text-5xl text-accent mb-4">404</h1>
        <h2 className="text-xl text-foreground font-medium mb-6">Product not found</h2>
        <p className="text-foreground/50 mb-8 max-w-md">The product you are looking for does not exist or has been removed.</p>
        <Link to="/" className="border border-accent text-accent hover:bg-accent/10 px-8 py-3 transition-colors uppercase tracking-widest text-sm font-bold">
          Back to Shop
        </Link>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="bg-[#0A0A0A] text-[#F5F0E8] min-h-screen pt-24 pb-12 font-sans overflow-x-hidden relative">
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
        
        {/* SECTION 1 - BREADCRUMB */}
        <div className="flex items-center text-xs text-foreground/50 mb-8 tracking-wider uppercase font-medium">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3 mx-2" />
          <Link to={`/${product.category?.slug === 'luxury-watches' ? 'watches' : 'clothing'}`} className="hover:text-accent transition-colors">
            {product.category?.name || 'Category'}
          </Link>
          <ChevronRight className="w-3 h-3 mx-2" />
          <span className="text-accent truncate">{product.name}</span>
        </div>

        {/* SECTION 2 - MAIN CONTENT */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* LEFT: IMAGES */}
          <div className="w-full lg:w-[55%] flex flex-col gap-4">
             <div className="w-full aspect-[4/5] bg-[#1A1A1A] rounded-md overflow-hidden relative">
               <AnimatePresence mode="wait">
                 {images.length > 0 ? (
                   <motion.img 
                     key={activeImage}
                     src={images[activeImage]} 
                     alt={`${product.name} view ${activeImage + 1}`}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.3 }}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-accent/30 font-serif text-3xl tracking-widest">
                     KISWA
                   </div>
                 )}
               </AnimatePresence>
             </div>
             
             {images.length > 1 && (
               <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                 {images.map((img: string, idx: number) => (
                   <button 
                     key={idx}
                     onClick={() => setActiveImage(idx)}
                     className={`w-20 lg:w-24 aspect-[4/5] rounded overflow-hidden flex-shrink-0 transition-all ${activeImage === idx ? 'ring-2 ring-accent opacity-100' : 'opacity-50 hover:opacity-100'}`}
                   >
                     <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
             )}
          </div>

          {/* RIGHT: DETAILS */}
          <div className="w-full lg:w-[45%]">
            <div className="sticky top-24">
              <div className="text-accent text-[11px] uppercase tracking-[0.2em] font-medium mb-3">
                {product.category?.name}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#F5F0E8] font-bold mb-4">{product.name}</h1>
              
              <div className="flex items-center gap-3 mb-6">
                 <div className="flex text-accent">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-4 h-4 ${i < Number(averageRating) ? 'fill-accent' : 'text-surface-2'}`} />
                   ))}
                 </div>
                 <a href="#reviews" className="text-sm text-foreground/50 hover:text-accent underline underline-offset-4 transition-colors">
                   ({reviews.length} reviews)
                 </a>
              </div>

              <div className="mb-6">
                <div className="text-2xl font-bold text-accent">
                  Rs. {finalPrice.toLocaleString()}
                </div>
                {selectedVariant && selectedVariant.priceAdjustment > 0 && (
                  <div className="text-xs text-foreground/50 mt-1">
                    Rs. {product.basePrice.toLocaleString()} + Rs. {selectedVariant.priceAdjustment.toLocaleString()} ({selectedVariant.size})
                  </div>
                )}
              </div>

              <div className="w-full h-px bg-accent/30 mb-6" />

              <p className="text-foreground/70 text-[15px] leading-relaxed mb-8">
                {product.description}
              </p>

              {/* VARIANTS */}
              <div className="space-y-6 mb-8">
                {uniqueSizes.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium tracking-wide">Size</span>
                      <button className="text-xs text-foreground/50 hover:text-accent transition-colors underline underline-offset-2">Size Guide</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {uniqueSizes.map(size => {
                        const variantWithThisSize = product.variants.find((v:any) => 
                          v.size === size && (!selectedColor || v.color === selectedColor)
                        );
                        const isAvailable = variantWithThisSize ? variantWithThisSize.stockQty > 0 : false;

                        return (
                          <button
                            key={size}
                            disabled={!isAvailable}
                            onClick={() => setSelectedSize(size)}
                            className={`min-w-[3rem] h-10 px-4 rounded border text-sm transition-colors ${
                              selectedSize === size 
                                ? 'bg-accent border-accent text-black font-medium' 
                                : !isAvailable 
                                  ? 'border-surface-2 text-foreground/30 line-through cursor-not-allowed'
                                  : 'border-surface-2 text-foreground/80 hover:border-accent'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {uniqueColors.length > 0 && (
                  <div>
                    <span className="block text-sm font-medium tracking-wide mb-3">Color: <span className="text-foreground/60 font-normal">{selectedColor}</span></span>
                    <div className="flex flex-wrap gap-4">
                      {uniqueColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                          className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 ${
                            selectedColor === color ? 'border-accent' : 'border-transparent hover:border-surface-2'
                          }`}
                        >
                          <div 
                            className="w-full h-full rounded-full border border-surface-2" 
                            style={{ backgroundColor: color.toLowerCase().replace(' ', '') || '#333' }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                   {stockQty > 5 ? (
                     <div className="text-green-500/90 text-sm font-medium">In Stock</div>
                   ) : stockQty > 0 ? (
                     <div className="text-amber-500/90 text-sm font-medium">Only {stockQty} left!</div>
                   ) : (
                     <div className="text-red-500/90 text-sm font-medium">Out of Stock</div>
                   )}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="space-y-4 mb-10">
                <div className="flex gap-4 h-12">
                  {/* Quantity */}
                  <div className="flex items-center bg-[#1A1A1A] border border-surface-2 rounded px-2 w-32 focus-within:border-accent transition-colors">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-2 text-foreground/50 hover:text-accent transition-colors"
                      disabled={stockQty === 0}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="text" 
                      readOnly
                      value={stockQty === 0 ? 0 : quantity} 
                      className="w-full bg-transparent text-center font-medium focus:outline-none"
                    />
                    <button 
                      onClick={() => setQuantity(q => Math.min(stockQty, q + 1))}
                      className="p-2 text-foreground/50 hover:text-accent transition-colors"
                      disabled={stockQty === 0}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={handleAddToCart}
                    disabled={stockQty === 0}
                    className="flex-1 bg-accent text-background font-bold text-sm tracking-wide uppercase transition-all duration-300 rounded hover:bg-accent/90 disabled:bg-surface-2 disabled:text-foreground/30 relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${addingToCart ? 'translate-y-0' : '-translate-y-full'}`}>
                      Added to Cart ✓
                    </div>
                    <div className={`transition-transform duration-300 ${addingToCart ? 'translate-y-full' : 'translate-y-0'}`}>
                      {stockQty === 0 ? 'Sold Out' : 'Add to Cart'}
                    </div>
                  </button>
                </div>

                <button 
                  onClick={toggleWishlist}
                  className="w-full h-12 border border-accent/50 text-accent font-medium text-sm tracking-wide uppercase hover:bg-accent/10 transition-colors rounded flex items-center justify-center gap-2"
                >
                  <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-accent' : ''}`} />
                  {wishlist.includes(product.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              {/* Delivery Info */}
              <div className="space-y-3 p-4 bg-[#111111] border border-surface-2 rounded-md mb-8 text-[13px] text-foreground/80">
                 <div className="flex items-center gap-3"><Truck className="w-4 h-4 text-accent" /> Free delivery on orders over Rs. 5,000</div>
                 <div className="flex items-center gap-3"><Banknote className="w-4 h-4 text-accent" /> Cash on Delivery available</div>
                 <div className="flex items-center gap-3"><Undo2 className="w-4 h-4 text-accent" /> Easy 7-day returns</div>
              </div>

              {/* ACCORDION */}
              <div className="border-t border-surface-2">
                {[
                  { id: 'details', label: 'Product Details', content: <p className="text-foreground/70 text-sm leading-relaxed pb-4">{product.description} <br/><br/>Material: Premium Quality.<br/>Care: Dry clean only.</p> },
                  { id: 'sizeGuide', label: 'Size & Fit Guide', content: <div className="pb-4 text-sm text-foreground/70"><table className="w-full text-left"><thead><tr className="border-b border-surface-2"><th className="pb-2">Size</th><th className="pb-2">Chest (Inches)</th><th className="pb-2">Length (Inches)</th></tr></thead><tbody><tr><td className="py-2">S</td><td>38</td><td>28</td></tr><tr><td className="py-2">M</td><td>40</td><td>29</td></tr><tr><td className="py-2">L</td><td>42</td><td>30</td></tr><tr><td className="py-2">XL</td><td>44</td><td>31</td></tr></tbody></table></div> },
                  { id: 'shipping', label: 'Shipping & Returns', content: <p className="text-foreground/70 text-sm leading-relaxed pb-4">Standard delivery within 3-5 business days. Returns are accepted within 7 days of receiving the item in unworn and original condition.</p> }
                ].map((item) => (
                  <div key={item.id} className="border-b border-surface-2">
                    <button 
                      onClick={() => setExpandedSection(expandedSection === item.id as any ? null : item.id as any)}
                      className="w-full py-4 flex justify-between items-center text-sm font-medium tracking-wide hover:text-accent transition-colors"
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 text-accent transition-transform duration-300 ${expandedSection === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expandedSection === item.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden"
                         >
                           {item.content}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* SECTION 3 - REVIEWS */}
        <div id="reviews" className="mt-24 pt-16 border-t border-surface-2">
          <h2 className="text-2xl font-serif text-accent mb-12 text-center relative max-w-max mx-auto">
            Customer Reviews
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-px bg-accent"></div>
          </h2>
          
          <div className="flex flex-col md:flex-row gap-12">
            <div className="w-full md:w-1/3">
              <div className="bg-[#111111] border border-surface-2 p-8 rounded-md text-center">
                <div className="text-5xl font-serif text-accent mb-2">{averageRating || '0.0'}</div>
                <div className="flex justify-center text-accent mb-2">
                   {[...Array(5)].map((_, i) => (
                     <Star key={i} className={`w-5 h-5 ${i < Math.round(Number(averageRating)) ? 'fill-accent' : 'text-surface-2'}`} />
                   ))}
                </div>
                <div className="text-sm text-foreground/50">{reviews.length} total reviews</div>
                
                {/* Simplified breakdown */}
                <div className="mt-6 space-y-2">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs text-foreground/50">
                        <span className="w-3">{star}★</span>
                        <div className="flex-1 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="w-8 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {isLoggedIn && (
                <div className="mt-8 bg-[#111111] border border-surface-2 p-6 rounded-md">
                   <h3 className="text-lg font-serif text-accent mb-4">Write a Review</h3>
                   <form onSubmit={handleReviewSubmit} className="space-y-4">
                     <div>
                       <label className="block text-xs uppercase tracking-wide text-foreground/50 mb-2">Rating</label>
                       <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map(star => (
                           <button 
                             type="button" 
                             key={star} 
                             onClick={() => setReviewRating(star)}
                             className="text-2xl focus:outline-none"
                           >
                             <Star className={`${star <= reviewRating ? 'fill-accent text-accent' : 'text-surface-2'} w-6 h-6 transition-colors`} />
                           </button>
                         ))}
                       </div>
                     </div>
                     <div>
                       <label className="block text-xs uppercase tracking-wide text-foreground/50 mb-2">Review</label>
                       <textarea 
                         value={reviewComment}
                         onChange={e => setReviewComment(e.target.value)}
                         required
                         rows={4}
                         className="w-full bg-[#1A1A1A] border border-surface-2 text-foreground p-3 rounded focus:outline-none focus:border-accent transition-colors text-sm"
                         placeholder="Share your thoughts..."
                       ></textarea>
                     </div>
                     {reviewError && <div className="text-red-400 text-sm">{reviewError}</div>}
                     <button 
                       type="submit" 
                       disabled={submittingReview}
                       className="w-full bg-accent text-background font-medium py-3 rounded hover:bg-accent/90 transition-colors text-sm uppercase tracking-wide disabled:opacity-50"
                     >
                       {submittingReview ? 'Submitting...' : 'Submit Review'}
                     </button>
                   </form>
                </div>
              )}
            </div>

            <div className="w-full md:w-2/3 space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-[#111111] border border-surface-2 rounded-md">
                  <p className="text-foreground/50 text-lg mb-2">No reviews yet.</p>
                  <p className="text-foreground/30 text-sm">Be the first to review this product!</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="bg-[#111111] border border-surface-2 p-6 rounded-md">
                     <div className="flex justify-between items-start mb-3">
                       <div>
                         <div className="font-medium text-foreground mb-1">{review.user?.name || 'Anonymous'}</div>
                         <div className="flex gap-1 text-accent">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-accent' : 'text-surface-2'}`} />
                           ))}
                         </div>
                       </div>
                       <div className="text-xs text-foreground/30">
                         {new Date(review.createdAt).toLocaleDateString()}
                       </div>
                     </div>
                     <p className="text-foreground/70 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4 - YOU MAY ALSO LIKE */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-surface-2">
            <h2 className="text-2xl font-serif text-accent mb-10 text-center relative max-w-max mx-auto">
              You May Also Like
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-px bg-accent"></div>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {relatedProducts.map(rp => (
                 <Link to={`/product/${rp.slug}`} key={rp.id} className="group block">
                   <div className="aspect-[3/4] bg-[#1A1A1A] rounded-md overflow-hidden relative mb-4">
                     {rp.images && rp.images.length > 0 && (
                       <img src={rp.images[0]} alt={rp.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                     )}
                     <div className="absolute inset-0 border border-transparent group-hover:border-accent/40 transition-colors pointer-events-none rounded-md"></div>
                   </div>
                   <div className="text-center">
                     <h3 className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-1">{rp.name}</h3>
                     <p className="text-accent text-sm font-bold mt-1">Rs. {rp.basePrice.toLocaleString()}</p>
                   </div>
                 </Link>
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
