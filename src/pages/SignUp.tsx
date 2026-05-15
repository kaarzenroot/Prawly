import React, { useState } from "react";
import { motion } from "motion/react";
import { Chrome, ArrowRight, User, Mail, ShieldAlert, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";

interface SignUpProps {
  onNavigate: (page: string) => void;
  onSignUp: (username: string, email: string, password: string) => Promise<string | null>;
}

export function SignUp({ onNavigate, onSignUp }: SignUpProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Pick a username to get started.");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!email.trim()) {
      setError("We need your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That doesn't look like a valid email.");
      return;
    }
    if (!password.trim()) {
      setError("Please create a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters for safety.");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const result = await onSignUp(username.trim(), email.trim(), password);
    if (result) {
      setError(result);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface">
      {/* Visual Side - Cyan Branding */}
      <div className="hidden md:flex flex-1 relative items-center justify-center bg-tertiary-container overflow-hidden">
        <div className="absolute inset-0 bg-[#00b2b2]" />
        
        {/* Large Decorative Badge */}
        <div className="absolute top-12 left-12">
            <div className="px-4 py-1.5 rounded-full border-[2px] border-surface/20 font-display text-[10px] font-bold tracking-[0.2em] text-surface/60 uppercase">
                Join the Fun ✨
            </div>
        </div>

        <div className="relative z-10 p-12 max-w-xl">
           <div className="relative mb-24">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
               className="w-full aspect-square"
             >
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsLQizeAGyQLSj5-hzd0Bt4FiMaBlMumCT1JKpenQyqGsQkbyD4HqwL8ttvcsBLwRbIwK6nCfqgfqC9vPBVXYqMspoTNbCYXrD8ZlN6bc5k3sKbk_b8B6yoIhhlnaCjDUWQWwirLUEFRyFxhIVtFTyAZQL0CA52FeynH6JiiJi-muNCAEGGEQAu8bc3qGnA_UN0lWEePEl28eE6QKXABN_aWBV_6G03Pa3xwGNZIOp8II3sB51lim4PhiH7qoc9X_Ay15ArzPrSVz_"
                  className="w-full h-full object-contain mix-blend-screen opacity-80 invert saturate-200"
                  alt="Crystal Geometry"
                />
             </motion.div>
           </div>

          <div className="space-y-12">
            <h1 className="font-display text-8xl font-black text-surface tracking-tighter leading-[0.8] uppercase">
              Find <br/> Your Truth.
            </h1>
            <div className="flex gap-6 items-start">
                <div className="w-1 h-24 bg-surface/40 flex-shrink-0" />
                <p className="text-surface/80 text-xl font-medium max-w-xs leading-relaxed">
                    Create your own feedback space, share it with friends, and get the honest answers you've been looking for.
                </p>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px' }} 
        />
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col bg-[#050505] p-8 md:p-24 justify-center relative overflow-hidden">
        {/* Back to Home button */}
        <button
          onClick={() => onNavigate('home')}
          className="absolute top-8 left-8 hidden md:flex items-center gap-2 text-on-surface-variant/50 hover:text-tertiary-container transition-colors font-display text-xs font-bold tracking-widest uppercase z-10"
        >
          <ArrowLeft size={16} />
          Home
        </button>

        {/* Mobile Header */}
        <div className="md:hidden mb-12 flex justify-between items-center relative z-10">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-on-surface-variant/50 hover:text-tertiary-container transition-colors font-display text-xs font-bold tracking-widest uppercase"
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
          <div className="space-y-4">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-on-surface uppercase tracking-tight">Join Prawly</h2>
            <p className="text-on-surface-variant text-lg">Set up your account in seconds — it's free!</p>
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

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-tertiary-container transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    placeholder="choose_handle"
                    className="w-full bg-white/5 border-[1px] border-zinc-800 hover:border-zinc-700 focus:border-tertiary-container p-5 pl-14 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/20 font-display"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-tertiary-container transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="name@domain.com"
                    className="w-full bg-white/5 border-[1px] border-zinc-800 hover:border-zinc-700 focus:border-tertiary-container p-5 pl-14 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/20 font-display"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Password</label>
                <div className="relative group">
                  <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 group-focus-within:text-tertiary-container transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••••••"
                    className="w-full bg-white/5 border-[1px] border-zinc-800 hover:border-zinc-700 focus:border-tertiary-container p-5 pl-14 pr-14 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/20"
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
              className="w-full bg-tertiary-container text-surface font-display text-xs font-black tracking-[0.2em] p-6 rounded-xl border-[3px] border-tertiary-container hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(2,255,255,0.2)] uppercase flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-surface/40 border-t-surface rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>
                  Create My Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-display font-bold tracking-widest"><span className="bg-[#050505] px-4 text-on-surface-variant/30">Or</span></div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-transparent text-on-surface font-display text-[10px] font-black tracking-[0.2em] p-5 rounded-xl border-[2px] border-zinc-800 hover:border-on-surface transition-all flex items-center justify-center gap-3 uppercase disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Chrome size={16} className="text-primary-container" />
            Sign up with Google
          </button>

          <p className="text-center pt-8 text-on-surface-variant font-display text-[13px]">
             Already have an account?{" "}
            <button 
              onClick={() => onNavigate('auth')}
              className="text-tertiary-container hover:underline font-bold"
            >
              Log in here
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
