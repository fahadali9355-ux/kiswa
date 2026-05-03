import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Navigation, CheckCircle2, ChevronRight, HelpCircle, MessageCircle, Mail } from 'lucide-react';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState(false);

  // Focus input on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const initialId = searchParams.get('id') || searchParams.get('orderId') || '';
    if (initialId) {
       setOrderId(initialId);
       // Auto trigger search
       handleTrackImpl(initialId);
    }
  }, []);

  const handleTrackImpl = async (idToTrack: string) => {
    if (!idToTrack.trim()) return;

    // Clean up input
    const cleanId = idToTrack.trim().replace(/^KSW-/i, ''); // Remove KSW- prefix if user typed it

    setIsSearching(true);
    setError(false);
    setOrder(null);

    // Simulated network delay for smooth UX
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/orders/track/${cleanId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          setOrder(data.data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setIsSearching(false);
      }
    }, 600);
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    handleTrackImpl(orderId);
  };

  const resetSearch = () => {
    setOrder(null);
    setError(false);
    setOrderId('');
  };

  // Status mapping to timeline steps
  const getStepStatus = (status: string, stepIndex: number) => {
    const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    
    // Handle cancelled early
    if (status === 'CANCELLED') {
      return stepIndex === 0 ? 'completed' : 'pending';
    }

    const currentIndex = statuses.indexOf(status);
    if (currentIndex === -1) return 'pending'; // Unknown status fallback
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F0E8] min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">

        {/* SECTION 1 - SEARCH HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`text-center transition-all duration-500 ${order ? 'mb-8' : 'mb-12 mt-12 sm:mt-24'}`}
        >
          <h1 className="font-serif text-3xl sm:text-[36px] text-accent mb-3">Track Your Order</h1>
          <p className="text-foreground/50 text-base mb-8">Enter your Order ID to see real-time status</p>
          
          <form onSubmit={handleTrack} className="max-w-md mx-auto relative group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${orderId ? 'text-accent' : 'text-foreground/40 group-focus-within:text-accent'}`} />
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. KSW-XXXXXX"
              disabled={isSearching}
              className="w-full bg-[#111111] border border-surface-2 text-[#F5F0E8] pl-12 pr-32 py-4 rounded-full focus:outline-none focus:border-accent transition-colors font-mono tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
            />
            <button 
              type="submit"
              disabled={isSearching || !orderId.trim()}
              className="absolute right-2 top-2 bottom-2 bg-accent text-[#0A0A0A] px-6 rounded-full font-bold text-sm tracking-widest uppercase transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? <span className="animate-pulse">...</span> : 'Track'}
            </button>
          </form>
        </motion.div>

        {/* ERROR STATE */}
        <AnimatePresence mode="wait">
          {error && !isSearching && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-red-500/30 rounded-xl p-8 text-center max-w-md mx-auto"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl text-red-400 mb-2">Order Not Found</h3>
              <p className="text-sm text-foreground/60 mb-6">We couldn't find an order with that ID. Please check and try again.</p>
              <button 
                onClick={resetSearch}
                className="border border-surface-2 text-foreground/80 px-6 py-2 rounded-full hover:bg-white/5 transition-colors text-sm"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* SECTION 2 - TRACKING RESULT */}
          {order && !isSearching && !error && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              
              {/* ORDER INFO BAR */}
              <div className="bg-[#111111] border border-surface-2 rounded-xl py-4 px-6 flex flex-wrap gap-y-4 justify-between items-center text-sm">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Order ID</div>
                  <div className="font-mono text-accent font-medium">#KSW-{order.id.slice(-8).toUpperCase()}</div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-surface-2"></div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Date</div>
                  <div className="text-foreground/80 font-medium">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-surface-2"></div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Payment</div>
                  <div className="text-foreground/80 font-medium">{order.paymentMethod === 'COD' ? 'COD' : order.paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Card'}</div>
                </div>
                <div className="hidden sm:block w-px h-8 bg-surface-2"></div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Amount</div>
                  <div className="text-[#F5F0E8] font-bold">Rs. {order.totalAmount.toLocaleString()}</div>
                </div>
              </div>

              {/* STATUS TIMELINE */}
              <div className="bg-[#1A1A1A] border border-surface-2 rounded-xl p-6 sm:p-10 relative overflow-hidden">
                {/* Large subtle background icon */}
                <Package className="absolute right-[-20%] bottom-[-20%] w-64 h-64 text-surface-2/20 pointer-events-none" />
                
                {order.status === 'CANCELLED' ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center relative z-10">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                      <HelpCircle className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-2xl text-red-400 mb-2">Order Cancelled</h3>
                    <p className="text-foreground/60 text-sm max-w-sm">This order has been cancelled. {order.cancelledAt && `Cancelled on ${new Date(order.cancelledAt).toLocaleDateString()}`}</p>
                  </div>
                ) : (
                  <div className="relative z-10 sm:px-4">
                    {/* TIMELINE STEPS */}
                    {[
                      { 
                        title: 'Order Placed', 
                        desc: 'We have received your order', 
                        date: order.createdAt,
                        status: getStepStatus(order.status, 0)
                      },
                      { 
                        title: 'Processing', 
                        desc: 'Your order is being prepared', 
                        date: order.processedAt,
                        status: getStepStatus(order.status, 1)
                      },
                      { 
                        title: 'Shipped', 
                        desc: 'Your order is on its way. Courier: Leopard', 
                        date: order.shippedAt,
                        status: getStepStatus(order.status, 2)
                      },
                      { 
                        title: 'Delivered', 
                        desc: 'Package has arrived', 
                        date: order.deliveredAt,
                        status: getStepStatus(order.status, 3)
                      }
                    ].map((step, idx, arr) => (
                      <div key={idx} className="relative flex gap-6 pb-12 last:pb-0">
                        {/* Connecting Line */}
                        {idx < arr.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-[-10px] w-0.5 bg-[#222]">
                            {step.status === 'completed' && (
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: '100%' }}
                                transition={{ duration: 0.8, delay: 0.2 + (idx * 0.3) }}
                                className="absolute top-0 left-0 w-full bg-accent"
                              />
                            )}
                          </div>
                        )}

                        {/* Step Circle */}
                        <div className="relative mt-1">
                          {step.status === 'completed' ? (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: idx * 0.3 }}
                              className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0 z-10 relative"
                            >
                              <CheckCircle2 className="w-6 h-6 text-[#0A0A0A]" strokeWidth={2.5} />
                            </motion.div>
                          ) : step.status === 'active' ? (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: idx * 0.3 }}
                              className="w-10 h-10 rounded-full border-2 border-accent flex items-center justify-center shrink-0 z-10 relative bg-[#1A1A1A]"
                            >
                              <motion.div 
                                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-3 h-3 rounded-full bg-accent"
                              />
                            </motion.div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center shrink-0 z-10 relative border border-surface-2/50">
                               <div className="w-2 h-2 rounded-full bg-surface-2/50" />
                            </div>
                          )}
                        </div>

                        {/* Step Content */}
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 + (idx * 0.3) }}
                          className="pt-2 flex-1"
                        >
                          <h4 className={`text-base font-semibold mb-1 ${step.status === 'pending' ? 'text-foreground/40' : 'text-[#F5F0E8]'}`}>
                            {step.title}
                          </h4>
                          {(step.status === 'completed' || step.status === 'active') && (
                            <p className="text-sm text-foreground/60 mb-1">{step.desc}</p>
                          )}
                          {step.date && step.status === 'completed' && (
                            <p className="text-xs text-foreground/40 mt-1 font-mono">
                              {new Date(step.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                            </p>
                          )}
                        </motion.div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ITEMS SUMMARY (Compact horizontal scroll) */}
              <div className="bg-[#111111] border border-surface-2 rounded-xl p-4 sm:p-6 pb-2 sm:pb-4 overflow-hidden relative">
                <h4 className="text-sm font-medium text-foreground/70 mb-4 px-2">Items in this order</h4>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-2 snap-x">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 bg-[#1A1A1A] border border-surface-2 rounded-lg p-2.5 min-w-[240px] max-w-[280px] snap-start shrink-0">
                      <div className="w-12 h-16 bg-[#111] rounded overflow-hidden shrink-0">
                         {item.productImage ? (
                           <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-xs opacity-20">IMG</div>
                         )}
                      </div>
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-foreground truncate block">{item.productName || 'Item'}</h5>
                        <div className="text-xs text-foreground/50 mt-1 flex gap-1 truncate">
                          {item.size && <span>{item.size}</span>}
                          {item.color && <span>• {item.color}</span>}
                        </div>
                        <div className="text-xs font-bold text-accent mt-auto">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SUPPORT LOGO */}
              <div className="pt-6 border-t border-surface-2 text-center pb-8">
                 <p className="text-sm text-foreground/60 mb-4">Need help with this order?</p>
                 <div className="flex justify-center gap-6 text-sm">
                   <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#25D366] hover:underline hover:opacity-80 transition-all">
                     <MessageCircle className="w-4 h-4" /> WhatsApp Support
                   </a>
                   <a href="mailto:support@kiswa.pk" className="flex items-center gap-2 text-foreground/80 hover:text-accent hover:underline transition-all">
                     <Mail className="w-4 h-4" /> Email Us
                   </a>
                 </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
