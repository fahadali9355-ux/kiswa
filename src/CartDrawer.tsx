import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCart } from './CartContext';
import { Link, useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, cartCount, cartTotal, updateQuantity, removeFromCart, isDrawerOpen, closeDrawer } = useCart();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end font-sans">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={closeDrawer}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-[420px] bg-[#0D0D0D] h-full shadow-2xl relative z-10 flex flex-col border-l border-surface-2"
          >
             <div className="flex items-center justify-between p-6 border-b border-surface-2 bg-[#0D0D0D]">
                <div className="flex items-baseline gap-3">
                  <h2 className="font-serif text-2xl text-[#F5F0E8]">Your Cart</h2>
                  <span className="text-foreground/50 text-sm">({cartCount} items)</span>
                </div>
                <button onClick={closeDrawer} className="text-foreground/50 hover:text-accent transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-[#0D0D0D]">
               {cart.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-foreground/50 h-full">
                   <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                   <p className="mb-6">Your cart is empty.</p>
                   <button 
                     onClick={() => { closeDrawer(); navigate('/clothing'); }} 
                     className="border border-accent text-accent px-8 py-3 hover:bg-accent/10 transition-colors uppercase tracking-widest text-sm font-medium"
                   >
                     Start Shopping
                   </button>
                 </div>
               ) : (
                 <AnimatePresence initial={false}>
                   {cart.map((item) => (
                     <motion.div 
                       key={`${item.productId}-${item.variantId}-${item.size}-${item.color}`}
                       layout
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, height: 0, overflow: 'hidden', padding: 0, marginTop: 0 }}
                       transition={{ duration: 0.2 }}
                       className="flex gap-4 bg-[#111111] p-3 rounded-md border border-surface-2"
                     >
                       <div className="w-20 h-24 bg-[#1A1A1A] rounded overflow-hidden flex-shrink-0">
                         {item.image ? (
                           <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-accent/20 font-serif text-xs">KISWA</div>
                         )}
                       </div>
                       
                       <div className="flex flex-col flex-1 py-1">
                         <div className="flex justify-between items-start gap-2">
                           <h4 className="text-sm font-medium text-[#F5F0E8] line-clamp-1">{item.name}</h4>
                           <div className="font-bold text-accent text-sm whitespace-nowrap">
                             Rs. {item.price.toLocaleString()}
                           </div>
                         </div>
                         
                         <div className="text-xs text-foreground/50 mt-1 flex flex-wrap gap-x-2">
                           {item.size && <span>{item.size}</span>}
                           {item.size && item.color && <span>•</span>}
                           {item.color && <span>{item.color}</span>}
                         </div>
                         
                         <div className="mt-auto flex items-end justify-between">
                           <div className="flex items-center border border-surface-2 bg-[#1A1A1A] rounded p-1 w-24">
                             <button 
                               onClick={() => updateQuantity(item.variantId, item.productId, item.quantity - 1)} 
                               className="text-foreground/50 hover:text-accent p-1 transition-colors"
                             >
                               <Minus className="w-3 h-3" />
                             </button>
                             <span className="text-xs flex-1 text-center font-medium text-[#F5F0E8]">{item.quantity}</span>
                             <button 
                               onClick={() => updateQuantity(item.variantId, item.productId, item.quantity + 1)} 
                               className="text-foreground/50 hover:text-accent p-1 transition-colors"
                             >
                               <Plus className="w-3 h-3" />
                             </button>
                           </div>
                           
                           <button 
                             onClick={() => removeFromCart(item.variantId, item.productId)}
                             className="text-xs text-red-500/70 hover:text-red-500 hover:underline underline-offset-2 transition-colors"
                           >
                             Remove
                           </button>
                         </div>
                       </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               )}
             </div>

             {cart.length > 0 && (
               <div className="p-6 border-t border-surface-2 bg-[#111111]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-foreground/70">Subtotal</span>
                    <span className="font-bold text-accent">Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-foreground/70">Shipping</span>
                    <span className="text-xs text-foreground/50">Calculated at checkout</span>
                  </div>
                  
                  <div className="w-full h-px bg-surface-2 mb-4" />
                  
                  <div className="flex justify-between items-center mb-6 text-xl">
                    <span className="font-serif">Total</span>
                    <span className="font-serif text-accent">Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => { closeDrawer(); /* optional navigate to cart page */ }} 
                      className="w-full border border-accent text-accent font-medium py-3 hover:bg-accent/10 transition-colors tracking-widest text-sm uppercase text-center"
                    >
                      View Cart
                    </button>
                    <button 
                      onClick={handleCheckoutClick}
                      className="w-full bg-accent text-[#0A0A0A] font-bold py-3 hover:bg-accent/90 transition-colors tracking-widest text-sm uppercase text-center focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[#111]"
                    >
                      Checkout
                    </button>
                  </div>
               </div>
             )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
