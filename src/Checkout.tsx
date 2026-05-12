import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, CreditCard, Banknote, Smartphone, ShieldCheck, Truck, Undo2, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from './CartContext';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(2); // 1 = Cart, 2 = Checkout, 3 = Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [shipping, setShipping] = useState({ line1: '', line2: '', city: '', province: 'Punjab', postalCode: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, JAZZCASH, CARD
  const [paymentDetails, setPaymentDetails] = useState({ mobileWalletNumber: '', cardNumber: '', expiry: '', cvv: '' });

  // Validation
  const [touched, setTouched] = useState({
    name: false, phone: false, line1: false, city: false, mobileWalletNumber: false, cardNumber: false, expiry: false, cvv: false
  });

  const provinces = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'Islamabad'];

  const shippingCost = cartTotal > 5000 ? 0 : 250;
  const finalTotal = cartTotal + shippingCost;

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/clothing');
    }
    
    // Auto-fill from logged in user
    const savedUser = localStorage.getItem('kiswa_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setContact({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || ''
        });
      } catch (e) {}
    }
    
    window.scrollTo(0, 0);
  }, [cart, navigate]);

  const validatePhone = (phone: string) => {
    // Basic Pakistani phone validation: 03XX-XXXXXXX or 03XXXXXXXXX
    return /^03\d{2}-?\d{7}$/.test(phone);
  };

  const isFormValid = () => {
    if (!contact.name || !contact.phone || !validatePhone(contact.phone)) return false;
    if (!shipping.line1 || !shipping.city) return false;
    if (paymentMethod === 'JAZZCASH' && (!paymentDetails.mobileWalletNumber || !validatePhone(paymentDetails.mobileWalletNumber))) return false;
    if (paymentMethod === 'CARD' && (!paymentDetails.cardNumber || !paymentDetails.expiry || !paymentDetails.cvv)) return false;
    return true;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all as touched on submit attempt
    setTouched({
      name: true, phone: true, line1: true, city: true, 
      mobileWalletNumber: paymentMethod === 'JAZZCASH', 
      cardNumber: paymentMethod === 'CARD', 
      expiry: paymentMethod === 'CARD', 
      cvv: paymentMethod === 'CARD'
    });

    if (!isFormValid()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const savedUser = localStorage.getItem('kiswa_user');
      const user = savedUser ? JSON.parse(savedUser) : null;

      const orderPayload = {
        userId: user?.id,
        guestName: contact.name,
        guestEmail: contact.email || undefined,
        guestPhone: contact.phone,
        shippingAddress: shipping,
        paymentMethod,
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: finalTotal
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        clearCart();
        navigate(`/order-confirmation/${data.data.id}`, { state: { order: data.data } });
      } else {
        setError(data.message || 'Failed to place order');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F0E8] min-h-screen pt-24 pb-12 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* PROGRESS INDICATOR */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link to="/clothing" className="flex items-center gap-2 text-foreground/50 hover:text-accent">
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">✓</span>
              Cart
            </Link>
            <div className="w-8 h-px bg-surface-2 mx-2"></div>
            <div className="flex items-center gap-2 text-accent">
              <span className="w-5 h-5 rounded-full bg-accent text-black flex items-center justify-center text-xs">2</span>
              Checkout
            </div>
            <div className="w-8 h-px bg-surface-2 mx-2"></div>
            <div className="flex items-center gap-2 text-foreground/30">
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">3</span>
              Confirmation
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm px-4 py-3 rounded mb-8 text-center max-w-2xl mx-auto">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* LEFT: FORM */}
          <div className="w-full lg:w-[55%]">
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* STEP A: CONTACT */}
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex justify-between items-baseline mb-4">
                  <h2 className="text-xl font-serif text-accent">Contact Information</h2>
                  <span className="text-xs text-foreground/50">Already have an account? <Link to="/admin/login" className="text-accent hover:underline">Login</Link></span>
                </div>
                <div className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Full Name *" 
                      value={contact.name}
                      onChange={e => setContact({...contact, name: e.target.value})}
                      onBlur={() => handleBlur('name')}
                      className={`w-full bg-[#111111] border ${touched.name && !contact.name ? 'border-red-500' : 'border-surface-2'} text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors`}
                    />
                    {touched.name && !contact.name && <span className="text-red-500 text-xs mt-1 absolute">Name is required</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input 
                        type="tel" 
                        placeholder="Phone Number (03XX-XXXXXXX) *" 
                        value={contact.phone}
                        onChange={e => setContact({...contact, phone: e.target.value})}
                        onBlur={() => handleBlur('phone')}
                        className={`w-full bg-[#111111] border ${touched.phone && (!contact.phone || !validatePhone(contact.phone)) ? 'border-red-500' : 'border-surface-2'} text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors`}
                      />
                      {touched.phone && (!contact.phone || !validatePhone(contact.phone)) && <span className="text-red-500 text-xs mt-1 absolute">Valid Pakistani phone required</span>}
                    </div>
                    <div>
                      <input 
                        type="email" 
                        placeholder="Email Address (Optional)" 
                        value={contact.email}
                        onChange={e => setContact({...contact, email: e.target.value})}
                        className="w-full bg-[#111111] border border-surface-2 text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* STEP B: SHIPPING */}
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-xl font-serif text-accent mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Address Line 1 *" 
                      value={shipping.line1}
                      onChange={e => setShipping({...shipping, line1: e.target.value})}
                      onBlur={() => handleBlur('line1')}
                      className={`w-full bg-[#111111] border ${touched.line1 && !shipping.line1 ? 'border-red-500' : 'border-surface-2'} text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors`}
                    />
                  </div>
                  <div>
                    <input 
                      type="text" 
                      placeholder="Address Line 2 (Apartment, suite, etc.) - Optional" 
                      value={shipping.line2}
                      onChange={e => setShipping({...shipping, line2: e.target.value})}
                      className="w-full bg-[#111111] border border-surface-2 text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <input 
                        type="text" 
                        placeholder="City *" 
                        value={shipping.city}
                        onChange={e => setShipping({...shipping, city: e.target.value})}
                        onBlur={() => handleBlur('city')}
                        className={`w-full bg-[#111111] border ${touched.city && !shipping.city ? 'border-red-500' : 'border-surface-2'} text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors`}
                      />
                    </div>
                    <div className="md:col-span-1 relative">
                       <select 
                         value={shipping.province} 
                         onChange={e => setShipping({...shipping, province: e.target.value})}
                         className="w-full bg-[#111111] border border-surface-2 text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors appearance-none"
                       >
                         {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                       <ChevronRight className="w-4 h-4 text-foreground/50 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                    </div>
                    <div className="md:col-span-1">
                      <input 
                        type="text" 
                        placeholder="Postal Code" 
                        value={shipping.postalCode}
                        onChange={e => setShipping({...shipping, postalCode: e.target.value})}
                        className="w-full bg-[#111111] border border-surface-2 text-[#F5F0E8] px-4 py-3.5 rounded focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* STEP C: PAYMENT */}
              <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-xl font-serif text-accent mb-4">Payment Method</h2>
                <div className="space-y-3">
                  
                  {/* COD */}
                  <label className={`block relative border rounded p-4 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-accent bg-accent/5' : 'border-surface-2 bg-[#111111] hover:border-surface-2/80'}`}>
                    <div className="flex items-center">
                      <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-4 ${paymentMethod === 'COD' ? 'border-accent' : 'border-surface-2'}`}>
                        {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-accent" />}
                      </div>
                      <Banknote className="w-6 h-6 text-foreground/70 mr-4" />
                      <div>
                        <div className="font-medium text-sm">Cash on Delivery</div>
                        <div className="text-xs text-foreground/50">Pay when your order arrives</div>
                      </div>
                    </div>
                  </label>

                  {/* JAZZCASH */}
                  <div className={`relative border rounded transition-all ${paymentMethod === 'JAZZCASH' ? 'border-accent bg-accent/5' : 'border-surface-2 bg-[#111111] hover:border-surface-2/80'}`}>
                    <label className="block p-4 cursor-pointer">
                      <div className="flex items-center">
                        <input type="radio" name="payment" value="JAZZCASH" checked={paymentMethod === 'JAZZCASH'} onChange={() => setPaymentMethod('JAZZCASH')} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-4 ${paymentMethod === 'JAZZCASH' ? 'border-accent' : 'border-surface-2'}`}>
                          {paymentMethod === 'JAZZCASH' && <div className="w-2 h-2 rounded-full bg-accent" />}
                        </div>
                        <Smartphone className="w-6 h-6 text-foreground/70 mr-4" />
                        <div>
                          <div className="font-medium text-sm">JazzCash / EasyPaisa</div>
                          <div className="text-xs text-foreground/50">Pay via mobile wallet</div>
                        </div>
                      </div>
                    </label>
                    <AnimatePresence>
                      {paymentMethod === 'JAZZCASH' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 border-t border-accent/20">
                            <input 
                              type="tel" 
                              placeholder="Mobile Wallet Number (03XX-XXXXXXX) *" 
                              value={paymentDetails.mobileWalletNumber}
                              onChange={e => setPaymentDetails({...paymentDetails, mobileWalletNumber: e.target.value})}
                              onBlur={() => handleBlur('mobileWalletNumber')}
                              className={`w-full bg-[#1A1A1A] border ${touched.mobileWalletNumber && (!paymentDetails.mobileWalletNumber || !validatePhone(paymentDetails.mobileWalletNumber)) ? 'border-red-500' : 'border-transparent'} text-[#F5F0E8] px-4 py-3 rounded focus:outline-none focus:border-accent transition-colors`}
                            />
                            <p className="text-[11px] text-foreground/40 mt-2">You will receive a payment request on this number.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CARD */}
                  <div className={`relative border rounded transition-all ${paymentMethod === 'CARD' ? 'border-accent bg-accent/5' : 'border-surface-2 bg-[#111111] hover:border-surface-2/80'}`}>
                    <label className="block p-4 cursor-pointer">
                      <div className="flex items-center">
                        <input type="radio" name="payment" value="CARD" checked={paymentMethod === 'CARD'} onChange={() => setPaymentMethod('CARD')} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-4 ${paymentMethod === 'CARD' ? 'border-accent' : 'border-surface-2'}`}>
                          {paymentMethod === 'CARD' && <div className="w-2 h-2 rounded-full bg-accent" />}
                        </div>
                        <CreditCard className="w-6 h-6 text-foreground/70 mr-4" />
                        <div>
                          <div className="font-medium text-sm">Credit / Debit Card</div>
                          <div className="text-xs text-foreground/50">Powered by Stripe</div>
                        </div>
                      </div>
                    </label>
                    <AnimatePresence>
                      {paymentMethod === 'CARD' && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-4 border-t border-accent/20 space-y-3">
                            <input 
                              type="text" 
                              placeholder="Card Number *" 
                              value={paymentDetails.cardNumber}
                              onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                              onBlur={() => handleBlur('cardNumber')}
                              className={`w-full bg-[#1A1A1A] border ${touched.cardNumber && !paymentDetails.cardNumber ? 'border-red-500' : 'border-transparent'} text-[#F5F0E8] px-4 py-3 rounded focus:outline-none focus:border-accent transition-colors font-mono text-sm`}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input 
                                type="text" 
                                placeholder="MM/YY *" 
                                value={paymentDetails.expiry}
                                onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                                onBlur={() => handleBlur('expiry')}
                                className={`w-full bg-[#1A1A1A] border ${touched.expiry && !paymentDetails.expiry ? 'border-red-500' : 'border-transparent'} text-[#F5F0E8] px-4 py-3 rounded focus:outline-none focus:border-accent transition-colors font-mono text-sm`}
                              />
                              <input 
                                type="text" 
                                placeholder="CVV *" 
                                value={paymentDetails.cvv}
                                onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                                onBlur={() => handleBlur('cvv')}
                                className={`w-full bg-[#1A1A1A] border ${touched.cvv && !paymentDetails.cvv ? 'border-red-500' : 'border-transparent'} text-[#F5F0E8] px-4 py-3 rounded focus:outline-none focus:border-accent transition-colors font-mono text-sm`}
                              />
                            </div>
                            <p className="text-[11px] text-foreground/40 mt-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-accent" /> Your payment is encrypted and secure.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>
              </motion.section>

              {/* ACTION BUTTON (Mobile usually floats or sits at bottom, keeping it inline for simplicity) */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-[#0A0A0A] font-bold py-4 rounded hover:bg-accent/90 transition-colors tracking-widest text-sm uppercase flex justify-center items-center gap-3 lg:hidden"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing order...</>
                ) : (
                  `Place Order — Rs. ${finalTotal.toLocaleString()}`
                )}
              </button>

            </form>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="w-full lg:w-[45%]">
            <div className="sticky top-24 bg-[#111111] border border-surface-2 rounded-md p-6 lg:p-8">
              <h2 className="text-xl font-serif text-accent mb-6">Order Summary</h2>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2 mb-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded bg-[#1A1A1A] border border-surface-2" />
                      <span className="absolute -top-2 -right-2 bg-accent text-background text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <h4 className="text-sm font-medium text-[#F5F0E8] line-clamp-1">{item.name}</h4>
                      <div className="text-xs text-foreground/50 mt-1">
                        {item.size && <span>{item.size}</span>}
                        {item.size && item.color && <span> • </span>}
                        {item.color && <span>{item.color}</span>}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-accent flex items-center">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-surface-2 text-sm text-foreground/80">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#F5F0E8]">Rs. {cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <span className="font-medium text-[#F5F0E8]">{shippingCost === 0 ? <span className="text-green-500/90">Free</span> : `Rs. ${shippingCost.toLocaleString()}`}</span>
                </div>
              </div>

              <div className="my-6 border-t border-surface-2" />

              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-serif">Total</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-foreground/50 uppercase tracking-widest">PKR</span>
                  <span className="text-3xl font-serif text-accent font-bold">Rs. {finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-accent text-[#0A0A0A] font-bold py-4 rounded hover:bg-accent/90 transition-colors tracking-widest text-sm uppercase hidden lg:flex justify-center items-center gap-3 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing order...</>
                ) : (
                  `Place Order`
                )}
              </button>

              <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col items-center gap-2"><ShieldCheck className="w-5 h-5 text-accent" /><span className="text-[10px] uppercase tracking-wider text-foreground/50">Secure<br/>Checkout</span></div>
                <div className="flex flex-col items-center gap-2"><Truck className="w-5 h-5 text-accent" /><span className="text-[10px] uppercase tracking-wider text-foreground/50">Fast<br/>Delivery</span></div>
                <div className="flex flex-col items-center gap-2"><Banknote className="w-5 h-5 text-accent" /><span className="text-[10px] uppercase tracking-wider text-foreground/50">COD<br/>Available</span></div>
                <div className="flex flex-col items-center gap-2"><Undo2 className="w-5 h-5 text-accent" /><span className="text-[10px] uppercase tracking-wider text-foreground/50">Easy<br/>Returns</span></div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
