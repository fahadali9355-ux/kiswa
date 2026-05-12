import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Password strength logic
  const getPasswordStrength = () => {
    const pw = formData.password;
    if (!pw) return 0; // none
    if (pw.length < 8) return 1; // weak
    let score = 1;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score >= 3) return 3; // strong
    return 2; // fair
  };

  const strength = getPasswordStrength();
  const strengthColors = ['bg-surface-2', 'bg-red-500', 'bg-amber-500', 'bg-green-500'];
  const strengthText = ['', 'Weak', 'Fair', 'Strong'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (activeTab === 'register') {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!formData.agreeTerms) {
        setError('You must agree to the Terms & Conditions');
        return;
      }
    }

    setIsLoading(true);

    try {
      const endpoint = activeTab === 'login' ? '/api/auth/customer/login' : '/api/auth/customer/register';
      const body = activeTab === 'login' 
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('kiswa_token', data.data.token);
        localStorage.setItem('kiswa_user', JSON.stringify(data.data.user));
        
        window.dispatchEvent(new Event('kiswa_auth_change'));

        if (activeTab === 'register') {
          showToast(`Welcome to Kiswa, ${formData.name}!`);
        } else {
          showToast('Logged in successfully');
        }

        setTimeout(() => {
           const from = (location.state as any)?.from || '/account';
           navigate(from);
        }, 1500);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    // Initialize Google Identity Services
    const initGoogle = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "86337851214-72o713r3f7p4uph5fjk7001cl7p8d70r.apps.googleusercontent.com", // Fallback or provided by user
          callback: handleGoogleResponse
        });
      }
    };

    // Retry initialization in case script loads after component mounts
    const timer = setInterval(() => {
      if (window.google) {
        initGoogle();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('kiswa_token', data.data.token);
        localStorage.setItem('kiswa_user', JSON.stringify(data.data.user));
        window.dispatchEvent(new Event('kiswa_auth_change'));
        showToast('Logged in successfully with Google');
        
        setTimeout(() => {
          const from = (location.state as any)?.from || '/account';
          navigate(from);
        }, 1500);
      } else {
        setError(data.message || 'Google login failed');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
      // Also render the standard button invisibly to trigger it if prompt is blocked
      const parent = document.getElementById('google-button-hidden');
      if (parent) {
        window.google.accounts.id.renderButton(parent, { theme: 'outline', size: 'large' });
      }
    } else {
      showToast('Google login is still loading...');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F0E8] font-sans flex mt-16 sm:mt-0">
      
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

      {/* LEFT PANEL - BRAND */}
      <div className="hidden lg:flex w-1/2 bg-[#0D0D0D] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full">
          <h1 className="font-serif text-5xl text-accent mb-4">Kiswa</h1>
          <p className="text-xl text-foreground mb-12 tracking-wide">Wear What Lasts.</p>
          
          <ul className="space-y-6 text-foreground/80 text-lg">
            <li className="flex items-center gap-4">
               <span className="w-2 h-2 rounded-full bg-accent" />
               Exclusive premium collections
            </li>
            <li className="flex items-center gap-4">
               <span className="w-2 h-2 rounded-full bg-accent" />
               Track your orders in real-time
            </li>
            <li className="flex items-center gap-4">
               <span className="w-2 h-2 rounded-full bg-accent" />
               Wishlist your favorites
            </li>
          </ul>

          <div className="w-16 h-0.5 bg-accent/50 mt-16" />
        </div>
      </div>

      {/* RIGHT PANEL - FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">

          {/* TAB SWITCHER */}
          <div className="flex gap-8 mb-8 border-b border-surface-2">
            <button 
              className={`pb-4 text-lg font-medium transition-colors relative ${activeTab === 'login' ? 'text-accent' : 'text-foreground/50 hover:text-accent'}`}
              onClick={() => { setActiveTab('login'); setError(''); }}
            >
              Login
              {activeTab === 'login' && (
                <motion.div layoutId="auth-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
            <button 
              className={`pb-4 text-lg font-medium transition-colors relative ${activeTab === 'register' ? 'text-accent' : 'text-foreground/50 hover:text-accent'}`}
              onClick={() => { setActiveTab('register'); setError(''); }}
            >
              Create Account
              {activeTab === 'register' && (
                <motion.div layoutId="auth-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          </div>

          {/* ERROR DISPLAY */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="text-red-400 text-sm mb-6 bg-red-400/10 p-3 rounded border border-red-400/20">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {activeTab === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1"
                >
                  <label className="text-sm text-foreground/70">Full Name</label>
                  <input 
                    type="text" 
                    required={activeTab === 'register'}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                    placeholder="Enter your name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-sm text-foreground/70">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                 <label className="text-sm text-foreground/70">Password</label>
                 {activeTab === 'login' && (
                   <a href="#" className="text-xs text-accent hover:underline">Forgot Password?</a>
                 )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#111] border border-surface-2 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/80 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {activeTab === 'register' && formData.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex bg-surface-2 h-1 rounded overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strengthColors[strength]}`} style={{ width: `${(strength / 3) * 100}%` }} />
                  </div>
                  <div className={`text-xs mt-1 text-right ${strengthText[strength] === 'Weak' ? 'text-red-400' : strengthText[strength] === 'Fair' ? 'text-amber-400' : 'text-green-400'}`}>
                    {strengthText[strength]}
                  </div>
                </div>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {activeTab === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <div className="space-y-1">
                    <label className="text-sm text-foreground/70">Confirm Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required={activeTab === 'register'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full bg-[#111] border border-surface-2 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <div className="flex items-center h-5 mt-0.5">
                       <input 
                         id="terms" 
                         type="checkbox" 
                         checked={formData.agreeTerms}
                         onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                         className="w-4 h-4 bg-[#111] border-surface-2 rounded focus:ring-accent accent-accent"
                       />
                    </div>
                    <label htmlFor="terms" className="text-sm text-foreground/60 select-none">
                      I agree to the <a href="#" className="text-accent hover:underline">Terms & Conditions</a> and Privacy Policy.
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-[#0A0A0A] font-bold py-3.5 rounded-lg flex items-center justify-center hover:bg-accent/90 transition-colors uppercase tracking-widest text-sm mt-4 disabled:opacity-70"
            >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
              ) : activeTab === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-surface-2" />
            <span className="text-xs text-foreground/40 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-surface-2" />
          </div>

          {/* SOCIAL LOGIN */}
          <div id="google-button-hidden" className="hidden"></div>
          <button 
            type="button"
            onClick={handleGoogleAuth}
            className="w-full flex items-center justify-center gap-3 bg-[#111] border border-surface-2 text-foreground/90 py-3.5 rounded-lg hover:bg-white/5 transition-colors font-medium text-sm"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* SWAP LINK */}
          <div className="text-center mt-8 text-sm text-foreground/60">
            {activeTab === 'login' ? (
              <>Don't have an account? <button onClick={() => { setActiveTab('register'); setError(''); }} className="text-accent hover:underline font-medium ml-1">Create Account</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setActiveTab('login'); setError(''); }} className="text-accent hover:underline font-medium ml-1">Login</button></>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
