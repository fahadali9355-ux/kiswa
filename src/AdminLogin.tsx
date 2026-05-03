import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from './hooks/useAdminAuth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        login(data.data.token, data.data.user);
        navigate('/admin');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] bg-[#111111] border border-accent/20 p-12 rounded-xl shadow-2xl relative overflow-hidden"
      >
        {/* Subtle top glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />
        
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-accent tracking-wider mb-1">Kiswa</h1>
          <p className="text-[#F5F0E8]/60 font-sans text-sm tracking-wider uppercase">Admin Panel</p>
        </div>
        
        <div className="w-full h-px bg-accent/20 mb-8" />
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="Email Address"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className="w-full bg-[#1A1A1A] border border-surface-2 text-[#F5F0E8] px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors text-sm" 
              />
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password"
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="w-full bg-[#1A1A1A] border border-surface-2 text-[#F5F0E8] px-4 py-3 rounded-md focus:outline-none focus:border-accent transition-colors text-sm pr-12" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-accent transition-colors"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-surface-2 bg-[#1A1A1A] accent-accent"
            />
            <label htmlFor="remember" className="text-sm text-foreground/70 cursor-pointer select-none">Remember me</label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent text-background font-bold font-sans py-3 rounded-md hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login to Dashboard'
            )}
          </button>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center mt-4"
            >
              {error}
            </motion.p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
