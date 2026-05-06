import { motion } from "motion/react";
import { LayoutGrid } from "lucide-react";
import type { PrawlyUser } from "../App";

interface HomeProps {
  onNavigate: (page: string) => void;
  user?: PrawlyUser | null;
}

export function Home({ onNavigate, user }: HomeProps) {
  return (
    <div className="relative min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl h-16 rounded-xl border-[3px] border-white/10 flex justify-between items-center px-4 md:px-8 z-50 bg-zinc-950/20 backdrop-blur-3xl shadow-[0_0_20px_rgba(255,191,0,0.15)]">
        <div className="text-xl font-black italic text-white tracking-widest font-display uppercase shrink-0">
          Prawly
        </div>
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          {user ? (
            <button 
              onClick={() => onNavigate('dashboard')}
              className="font-display uppercase tracking-tighter font-bold text-surface bg-primary-container px-4 md:px-6 h-10 rounded-lg border-[3px] border-primary-container hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,191,0,0.4)] flex items-center gap-2 whitespace-nowrap text-sm md:text-base"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">App</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => onNavigate('auth')}
                className="font-display uppercase tracking-tighter font-bold text-on-surface-variant hover:text-primary-container transition-all text-sm md:text-base whitespace-nowrap"
              >
                Log In
              </button>
              <button 
                onClick={() => onNavigate('signup')}
                className="font-display uppercase tracking-tighter font-bold text-surface bg-primary-container px-4 md:px-6 h-10 rounded-lg border-[3px] border-primary-container hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,191,0,0.4)] whitespace-nowrap text-sm md:text-base flex items-center justify-center"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-4 md:px-8 overflow-hidden bg-surface-container-lowest">
        <div className="absolute inset-0 z-0 fluid-bg overflow-hidden">
          {/* Animated Particles */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="glass-particle rounded-full"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 10 + 10}s`,
                animationDelay: `-${Math.random() * 15}s`
              }}
            />
          ))}
          {/* Blobs */}
          <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-primary-container/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
          <div className="absolute top-[60%] left-[70%] w-96 h-96 bg-tertiary-container/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob delay-[-5s]" />
          <div className="absolute top-[40%] left-[50%] w-[30rem] h-[30rem] bg-secondary-container/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob delay-[-10s]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl md:text-7xl text-on-surface leading-tight max-w-4xl mx-auto font-bold"
          >
            <span className="text-primary-container drop-shadow-[0_0_15px_rgba(255,191,0,0.3)]">Stop</span> collecting <span className="text-secondary drop-shadow-[0_0_15px_rgba(245,218,244,0.3)]">Compliments</span>, <br className="hidden md:block"/>
            <span className="text-primary-container drop-shadow-[0_0_15px_rgba(255,191,0,0.3)]">Start</span> collecting <span className="text-tertiary drop-shadow-[0_0_15px_rgba(2,255,255,0.3)]">Clarity</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto"
          >
            Honest feedback from the people who matter most — served up fresh, no sugar-coating. Finally, a place where real talk leads to real growth.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <button 
              onClick={() => onNavigate('signup')}
              className="font-display text-lg md:text-2xl text-surface bg-primary-container px-6 md:px-10 py-3 md:py-5 rounded-xl border-[3px] border-primary-container shadow-[0_0_30px_rgba(255,191,0,0.3)] hover:scale-105 transition-transform"
            >
              Get Started Free
            </button>
          </motion.div>
        </div>
      </header>

      {/* Anatomy Section */}
      <section className="py-20 px-4 md:px-8 bg-surface-container border-y-[3px] border-outline-variant relative overflow-hidden">
        <div className="absolute -right-32 top-10 opacity-5 font-display text-[200px] text-on-surface select-none rotate-12 font-black">
          REAL
        </div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-left">
            <h2 className="font-display text-4xl md:text-5xl text-on-surface font-bold leading-tight">
              How <span className="text-primary-container">Honest Vibes</span> Work
            </h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              We built Prawly because sometimes you need more than just "great job!" from your friends. Real feedback helps you grow, and we make sure it's always constructive, never just mean. Think of us as your personal honesty coach.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="px-4 py-2 border-[2px] border-outline-variant rounded-lg bg-surface-container-low font-display text-xs font-bold tracking-widest text-secondary uppercase">
                1. Collect
              </div>
              <div className="px-4 py-2 border-[2px] border-outline-variant rounded-lg bg-surface-container-low font-display text-xs font-bold tracking-widest text-secondary uppercase">
                2. Transform
              </div>
            </div>
          </div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative h-[400px] rounded-xl border-[3px] border-outline-variant overflow-hidden group"
          >
            <img 
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700 group-hover:scale-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsLQizeAGyQLSj5-hzd0Bt4FiMaBlMumCT1JKpenQyqGsQkbyD4HqwL8ttvcsBLwRbIwK6nCfqgfqC9vPBVXYqMspoTNbCYXrD8ZlN6bc5k3sKbk_b8B6yoIhhlnaCjDUWQWwirLUEFRyFxhIVtFTyAZQL0CA52FeynH6JiiJi-muNCAEGGEQAu8bc3qGnA_UN0lWEePEl28eE6QKXABN_aWBV_6G03Pa3xwGNZIOp8II3sB51lim4PhiH7qoc9X_Ay15ArzPrSVz_" 
              alt="Raw Data Visual" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 p-6 bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant rounded-lg">
              <div className="font-display text-[12px] font-bold tracking-widest text-primary-container mb-2 uppercase">Fun Fact</div>
              <div className="font-display text-2xl font-bold text-on-surface">10M+ Honest Moments Shared</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recycle Logic Section */}
      <section className="py-20 px-4 md:px-8 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-display text-4xl md:text-5xl text-on-surface font-bold">How the <span className="text-secondary">Magic</span> Happens</h2>
            <p className="text-lg text-on-surface-variant italic">Three simple steps from raw honesty to real clarity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card title="1. Scream Box" color="secondary" step="Step 1: Share">
              Your safe space to say what you really think — anonymously. No judgement, no names, just pure honesty from the people around you.
            </Card>
            <Card title="2. AI Cleanser" color="tertiary" step="Step 2: Clean Up">
              Our smart filter takes the raw feedback, removes the noise, and pulls out the stuff that actually matters. Helpful? Kept. Hurtful? Gone.
            </Card>
            <Card title="3. Silver Platter" color="primary" step="Step 3: Enjoy">
              You get a clean, easy-to-read summary of what people really think. Clear takeaways you can actually use — no guessing required.
            </Card>
          </div>
        </div>
      </section>

      <footer className="w-full border-t-[3px] border-zinc-900 bg-zinc-950 flex flex-col md:flex-row justify-between items-center px-12 py-12 gap-8">
        <div className="text-xl font-black text-white font-display italic tracking-widest uppercase">
          Prawly
        </div>
        <div className="font-display text-xs font-medium uppercase tracking-widest text-zinc-500">
          A <span className="inline-block px-2 py-0.5 border border-zinc-700 bg-zinc-900 text-white font-black rounded-sm mx-1">KOZMINE</span> PRODUCT
        </div>
        <div className="flex gap-8">
          {['About', 'How it Works', 'Privacy'].map(item => (
            <a key={item} href="#" className="font-display text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{item}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}

function Card({ title, step, children, color }: { title: string, step: string, children: string, color: "primary" | "secondary" | "tertiary" }) {
  const borderColors = {
    primary: "hover:border-primary-container hover:shadow-[0_0_30px_rgba(255,191,0,0.1)]",
    secondary: "hover:border-secondary hover:shadow-[0_0_30px_rgba(245,218,244,0.1)]",
    tertiary: "hover:border-tertiary hover:shadow-[0_0_30px_rgba(2,255,255,0.1)]"
  };

  const lineColors = {
    primary: "bg-primary-container",
    secondary: "bg-secondary",
    tertiary: "bg-tertiary"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative p-8 rounded-2xl border-[3px] border-outline-variant bg-surface-container-low transition-all duration-300 overflow-hidden text-left ${borderColors[color]}`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${lineColors[color]}`} />
      <h3 className="font-display text-2xl font-bold text-on-surface mb-4">{title}</h3>
      <p className="text-on-surface-variant leading-relaxed mb-6">{children}</p>
      <div className={`font-display text-[10px] font-bold tracking-widest px-3 py-1 bg-white/5 inline-block rounded-md border border-white/10 uppercase`}>
        {step}
      </div>
    </motion.div>
  );
}
