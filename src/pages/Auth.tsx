import React, { useState } from "react";
import { motion } from "motion/react";
import { Chrome, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";

interface AuthProps {
  onNavigate: (page: string) => void;
  onSignIn: (email: string, password: string) => Promise<string | null>;
}

export function Auth({ onNavigate, onSignIn }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    // Brief delay for UX
    await new Promise(r => setTimeout(r, 500));

    const result = await onSignIn(email.trim(), password);
    if (result) {
      setError(result);
      setLoading(false);
    }
    // If null, parent navigates to dashboard
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Visual Side */}
      <div className="hidden md:flex flex-1 relative items-center justify-center bg-primary-container overflow-hidden">
        <div className="absolute inset-0 bg-[#ffc400]" />
        <div className="relative z-10 p-12 max-w-xl">
          <div className="font-wordmark text-2xl tracking-wider mb-24 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full border-[3px] border-surface flex items-center justify-center"></span>
            Prawly
          </div>
          <div className="space-y-8">
            <h1 className="font-display text-7xl font-black text-surface tracking-tighter leading-[0.9]">
              Welcome to the <br/>Safe Zone.
            </h1>
            <p className="text-surface/80 text-xl font-medium max-w-sm">
              Skip the small talk. Get the real feedback that helps you grow. Your honest circle starts here.
            </p>
          </div>
        </div>
        
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col bg-[#0a0a0a] p-8 md:p-24 justify-center relative overflow-hidden">
        {/* Back to Home button (Desktop) */}
        <button
          onClick={() => onNavigate('home')}
          className="absolute top-8 left-8 hidden md:flex items-center gap-2 text-on-surface-variant/50 hover:text-primary-container transition-colors font-display text-xs font-bold tracking-widest uppercase z-10"
        >
          <ArrowLeft size={16} />
          Home
        </button>

        {/* Mobile Header */}
        <div className="md:hidden mb-12 flex justify-between items-center relative z-10">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-on-surface-variant/50 hover:text-primary-container transition-colors font-display text-xs font-bold tracking-widest uppercase"
          >
            <ArrowLeft size={16} />
            Home
          </button>
          <div className="font-wordmark text-2xl tracking-wider text-primary-container">Prawly</div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full mx-auto space-y-12"
        >
          <div className="space-y-2">
            <h2 className="font-display text-5xl font-bold text-on-surface">Welcome Back</h2>
            <p className="text-on-surface-variant text-lg">Sign in to check your latest feedback.</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
            >
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Email</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary-container">@</span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="user@prawly.net"
                    className="w-full bg-surface-container-low border-[3px] border-outline-variant hover:border-outline focus:border-primary-container p-4 pl-10 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Password</label>
                </div>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-primary-container text-xs opacity-50">KEY</span>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-low border-[3px] border-outline-variant hover:border-outline focus:border-primary-container p-4 pl-12 pr-12 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-surface font-display text-xs font-black tracking-[0.2em] p-5 rounded-xl border-[3px] border-primary-container hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,191,0,0.2)] uppercase disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-surface/40 border-t-surface rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Let's Go →"
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant" /></div>
            <div className="relative flex justify-center text-xs uppercase font-display font-bold tracking-widest"><span className="bg-[#0a0a0a] px-4 text-on-surface-variant/40">Or</span></div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-transparent text-on-surface font-display text-xs font-black tracking-[0.2em] p-5 rounded-xl border-[3px] border-outline-variant hover:border-on-surface hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Chrome size={18} />
            Continue with Google
          </button>

          <div className="text-center pt-8">
            <button 
              onClick={() => onNavigate('signup')}
              className="text-on-surface-variant hover:text-primary-container transition-colors font-display text-[10px] font-bold tracking-widest uppercase"
            >
              New here? Create an account
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
