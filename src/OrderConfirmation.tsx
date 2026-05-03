import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, MessageCircle, MapPin, CreditCard, Mail } from 'lucide-react';

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(location.state?.order);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (!id) {
       navigate('/');
       return;
    }

    if (!order) {
      fetch(`/api/orders/${id}`)
        .then(res => res.json())
        .then(data => {
          if(data.success) {
             setOrder(data.data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id, order, navigate]);

  if (loading) {
     return <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center"><div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center p-4">
         <h1 className="text-2xl font-serif text-accent mb-4">Order Not Found</h1>
         <p className="text-foreground/50 mb-8">We couldn't find the order you're looking for.</p>
         <Link to="/" className="border border-accent text-accent px-8 py-3 tracking-widest uppercase text-sm font-bold hover:bg-accent/10 transition-colors">Return to Shop</Link>
      </div>
    );
  }

  const shippingCost = order.totalAmount > 5000 ? 0 : 250;
  const subtotal = order.totalAmount - shippingCost;

  return (
    <div className="bg-[#0A0A0A] text-[#F5F0E8] min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-[680px] mx-auto px-4 sm:px-6">
        
        {/* SECTION 1 - SUCCESS HEADER */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-10"
        >
           <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
             <motion.svg 
               width="100" 
               height="100" 
               viewBox="0 0 100 100" 
               initial="hidden" 
               animate="visible"
               className="absolute inset-0"
             >
               <motion.circle
                 cx="50"
                 cy="50"
                 r="46"
                 stroke="#C9A84C"
                 strokeWidth="4"
                 strokeLinecap="round"
                 fill="transparent"
                 variants={{
                   hidden: { pathLength: 0, rotate: -90 },
                   visible: { 
                     pathLength: 1, 
                     rotate: -90, 
                     transition: { duration: 1, ease: "easeOut" } 
                   }
                 }}
               />
             </motion.svg>
             <motion.div
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.8, duration: 0.4, type: "spring" }}
             >
               <Check className="w-10 h-10 text-accent" strokeWidth={3} />
             </motion.div>
           </div>
           
           <h1 className="font-serif text-3xl sm:text-[32px] text-accent mb-3">Order Placed Successfully!</h1>
           <p className="text-foreground/60 text-base mb-6 max-w-sm mx-auto">
             Thank you for shopping with Kiswa. Your order has been confirmed.
           </p>
           
           <div className="inline-block bg-accent/10 border border-accent/20 text-accent font-mono text-sm px-4 py-1.5 rounded-full font-medium">
             Order #KSW-{order.id.slice(-8).toUpperCase()}
           </div>
        </motion.div>

        {/* SECTION 2 - WHATSAPP NOTICE */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-[#111111] border-l-4 border-accent rounded-r-md p-5 mb-8"
        >
          <div className="flex items-start gap-4">
            <div className="bg-green-500/20 text-green-500 rounded-full p-2 mt-1 shrink-0">
               <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-foreground/90 leading-relaxed mb-2">
                A confirmation has been sent to your WhatsApp number. Our team will contact you within 2 hours to confirm your order.
              </p>
              <p className="text-xs text-foreground/50">
                Didn't receive? <a href="https://wa.me/923001234567" target="_blank" rel="noreferrer" className="text-accent hover:underline">Contact us on WhatsApp</a>
              </p>
            </div>
          </div>
        </motion.div>

        {/* SECTION 3 - ORDER DETAILS CARD */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-[#1A1A1A] border border-surface-2 rounded-xl p-6 sm:p-8 mb-8"
        >
           <h3 className="font-serif text-lg text-accent mb-6">Order Details</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
             <div>
               <div className="text-xs text-foreground/40 mb-1 uppercase tracking-wider">Order ID</div>
               <div className="font-mono text-sm text-[#F5F0E8] font-medium">#KSW-{order.id.slice(-8).toUpperCase()}</div>
             </div>
             <div>
               <div className="text-xs text-foreground/40 mb-1 uppercase tracking-wider">Order Date</div>
               <div className="text-sm text-[#F5F0E8] font-medium">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
             </div>
             <div>
               <div className="text-xs text-foreground/40 mb-1 uppercase tracking-wider">Payment Method</div>
               <div className="text-sm text-[#F5F0E8] font-medium flex items-center gap-2">
                 {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod === 'JAZZCASH' ? 'JazzCash' : 'Credit Card'}
               </div>
             </div>
             <div>
               <div className="text-xs text-foreground/40 mb-1 uppercase tracking-wider">Estimated Delivery</div>
               <div className="text-sm text-[#F5F0E8] font-medium">3-5 business days</div>
             </div>
             <div className="sm:col-span-2">
               <div className="text-xs text-foreground/40 mb-1 uppercase tracking-wider">Delivery To</div>
               <div className="text-sm text-[#F5F0E8] font-medium">
                 {order.shippingAddress?.city}, {order.shippingAddress?.province}
               </div>
             </div>
           </div>
        </motion.div>

        {/* SECTION 4 - ITEMS SUMMARY */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-10"
        >
          <h3 className="text-lg font-serif text-accent mb-4 px-2">Items Ordered</h3>
          <div className="space-y-4 mb-6">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 items-center p-3 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-12 h-16 bg-[#1A1A1A] rounded overflow-hidden shrink-0 border border-surface-2 object-cover">
                  {item.product?.images ? (
                    <img src={item.product.images.split(',')[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-accent/20 text-xs">IMG</div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-[#F5F0E8] line-clamp-1">{item.product?.name || 'Item'}</h4>
                  <div className="text-xs text-foreground/50 mt-0.5">
                    {item.variant?.size && <span>{item.variant.size}</span>}
                    {item.variant?.size && item.variant?.color && <span> • </span>}
                    {item.variant?.color && <span>{item.variant.color}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground/40 mb-0.5">{item.quantity} × Rs. {item.price.toLocaleString()}</div>
                  <div className="text-sm font-bold text-accent">Rs. {(item.quantity * item.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-surface-2 pt-4 px-2">
            <div className="flex justify-between text-sm text-foreground/60 mb-2">
               <span>Subtotal</span>
               <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-foreground/60 mb-4">
               <span>Shipping</span>
               <span>{shippingCost === 0 ? 'Free' : `Rs. ${shippingCost.toLocaleString()}`}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
               <span className="font-serif text-[#F5F0E8]">Total</span>
               <span className="font-serif flex items-baseline gap-1">
                 <span className="text-xs uppercase tracking-widest text-foreground/50 font-sans">PKR</span>
                 <span className="text-2xl font-bold text-accent">Rs. {order.totalAmount.toLocaleString()}</span>
               </span>
            </div>
          </div>
        </motion.div>

        {/* SECTION 5 - ACTION BUTTONS */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
           <button 
             onClick={() => navigate('/track-order')}
             className="bg-accent text-[#0A0A0A] font-bold py-3.5 px-8 rounded hover:bg-accent/90 transition-colors uppercase tracking-widest text-sm text-center"
           >
             Track My Order
           </button>
           <button 
             onClick={() => navigate('/clothing')}
             className="border border-accent text-accent font-medium py-3.5 px-8 rounded hover:bg-accent/10 transition-colors uppercase tracking-widest text-sm text-center"
           >
             Continue Shopping
           </button>
        </motion.div>

        {/* SECTION 6 - NEED HELP */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-center pt-8 border-t border-surface-2"
        >
          <p className="text-sm text-foreground/60 mb-4">Need help with your order?</p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://wa.me/923001234567" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              Chat on WhatsApp
            </a>
            <a 
              href="mailto:hello@kiswa.pk"
              className="flex items-center gap-2 bg-[#1A1A1A] border border-surface-2 text-foreground/80 px-4 py-2 rounded-full text-sm font-medium hover:bg-white/5 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Us
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
