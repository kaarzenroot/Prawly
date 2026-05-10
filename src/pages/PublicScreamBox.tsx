import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, Send, Zap, ShieldCheck, AlertCircle } from "lucide-react";
import type { PrawlyLink } from "../App";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface PublicScreamBoxProps {
  onNavigate: (page: string) => void;
  linkId: string | null;
  links: PrawlyLink[];
  onSubmitMessage: (linkId: string, text: string) => Promise<void>;
}

// Simple ID generator (duplicated here so PublicScreamBox is self-contained)
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function PublicScreamBox({ onNavigate, linkId, links, onSubmitMessage }: PublicScreamBoxProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [link, setLink] = useState<PrawlyLink | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spamError, setSpamError] = useState<string | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("Interpreting...");

  // Fetch link directly from Firestore by document ID so it works on ANY device
  useEffect(() => {
    if (!linkId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // First check if we already have it in local state (same-browser fast path)
    const localLink = links.find(l => l.id === linkId);
    if (localLink) {
      setLink(localLink);
      setNotFound(false);
      setLoading(false);
      return;
    }

    // Fetch from Firestore — this is the cross-device path
    async function fetchFromFirestore() {
      try {
        const linkDoc = await getDoc(doc(db, "links", linkId!));
        if (linkDoc.exists()) {
          const data = linkDoc.data();
          setLink({
            id: linkDoc.id,
            name: data.name,
            question: data.question,
            createdAt: data.createdAt,
            messages: [],
            creatorUsername: data.creatorUsername,
            creatorPhoto: data.creatorPhoto,
          });
          setNotFound(false);
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error("Error fetching link from Firestore:", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchFromFirestore();
  }, [linkId, links]);

  const handleSubmit = async () => {
    if (!text.trim() || !link || isSubmitting) return;

    const words = text.trim().split(/\s+/).length;
    if (words > 500) {
      setWordError(`Message is too long. Limit is 500 words (currently ${words}).`);
      return;
    }
    setWordError(null);

    const history: number[] = JSON.parse(localStorage.getItem('prawly_spam_tracker') || '[]');
    const now = Date.now();
    const COOLDOWN = 30 * 60 * 1000;
    const recent = history.filter(ts => now - ts < COOLDOWN);
    if (recent.length >= 2) {
      setSpamError("You've sent too many messages recently. Please take a break.");
      return;
    }

    setIsSubmitting(true);
    setSpamError(null);

    const messages = ["Encrypting anonymity...", "Analyzing tone...", "Filtering message...", "Sending securely..."];
    let step = 0;
    setProgressText(messages[0]);
    const interval = setInterval(() => {
      step++;
      setProgressText(messages[step % messages.length]);
    }, 800);

    try {
      // Call AI endpoint
      let aiSummary = text.trim();
      let sentiment = "neutral";
      try {
        const aiRes = await fetch("/api/prawlly", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim() }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiSummary = aiData.aiSummary ?? text.trim();
          sentiment = aiData.sentiment ?? "neutral";
        }
      } catch (aiErr) {
        console.error("AI processing failed, saving raw text:", aiErr);
      }

      // Write message directly to Firestore — single source of truth
      const messageId = generateId();
      await setDoc(doc(db, "links", link.id, "messages", messageId), {
        text: text.trim(),
        timestamp: Date.now(),
        aiSummary,
        sentiment,
        starred: false,
      });
    } catch (err) {
      console.error("Error submitting message:", err);
    }
    
    clearInterval(interval);
    setIsSubmitting(false);

    recent.push(now);
    localStorage.setItem('prawly_spam_tracker', JSON.stringify(recent));
    setSubmitted(true);
  };

  // Not found state
  if (notFound) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 rounded-full bg-red-500/10 border-4 border-red-500/30 flex items-center justify-center mb-8">
          <AlertCircle size={48} className="text-red-400" />
        </div>
        <h1 className="font-display text-5xl font-black text-on-surface text-center mb-4 tracking-tighter">Link Not Found</h1>
        <p className="text-xl text-on-surface-variant text-center max-w-md mb-12">
          This link doesn't exist or may have been removed. Check the URL and try again.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="font-display text-xs font-bold text-primary-container uppercase tracking-[0.2em] border-b-2 border-primary-container pb-1 hover:text-white hover:border-white transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Submitted success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-tertiary-container/20 border-4 border-tertiary flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(2,255,255,0.2)]"
        >
          <ShieldCheck size={48} className="text-tertiary" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-5xl font-black text-on-surface text-center mb-4 tracking-tighter">Sent! 🎉</h1>
          <p className="text-xl text-on-surface-variant text-center max-w-md mb-12">
            Your honest feedback has been delivered anonymously. They'll never know it was you!
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => {
                window.location.hash = "";
                onNavigate('signup');
              }}
              className="font-display text-xs font-bold text-tertiary uppercase tracking-[0.2em] border-b-2 border-tertiary pb-1 hover:text-white hover:border-white transition-all"
            >
              Get your own link
            </button>
            <button
              onClick={() => { setText(""); setSubmitted(false); }}
              className="font-display text-xs font-bold text-on-surface-variant/50 uppercase tracking-[0.2em] hover:text-on-surface-variant transition-all"
            >
              Send another response
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state (link data not yet resolved from Firestore)
  if (loading || !link) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-outline-variant border-t-primary-container rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-container/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-tertiary-container/5 blur-[150px]" />
      </div>

      <header className="w-full p-8 z-10 flex justify-start">
        <div 
          onClick={() => onNavigate('home')}
          className="font-display text-2xl font-black italic tracking-widest text-surface-highest select-none opacity-30 cursor-pointer hover:opacity-100 transition-opacity uppercase"
        >
          Prawly
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 z-10 w-full max-w-3xl mx-auto space-y-16">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative group">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-primary-container to-tertiary opacity-30 blur-md group-hover:opacity-60 transition duration-500" />
            <div className="relative w-28 h-28 rounded-full border-[3px] border-zinc-800 overflow-hidden shadow-2xl bg-surface-container-high flex items-center justify-center">
              {link.creatorPhoto ? (
                <img src={link.creatorPhoto} alt={link.creatorUsername || link.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-5xl font-black text-primary-container">
                  {(link.creatorUsername || link.name).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-display font-medium tracking-widest text-primary-container uppercase text-xs">@{link.creatorUsername || "User"}</p>
            <p className="font-display font-medium tracking-widest text-on-surface-variant uppercase text-[10px]">{link.name}</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface leading-[1.1] tracking-tighter max-w-xl">
              {link.question}
            </h1>
            <p className="text-on-surface-variant/60 text-sm">Your response is completely anonymous.</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full space-y-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent opacity-50 blur-sm pointer-events-none" />
            <div className="glass-card rounded-[2rem] p-4 relative z-10 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-500 focus-within:border-primary-container/30 focus-within:shadow-[0_0_50px_rgba(255,191,0,0.1)]">
              <div className="absolute top-6 right-8 flex items-center gap-2 opacity-50 pointer-events-none">
                <Lock size={14} className="text-on-surface-variant" />
                <span className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">100% Anonymous</span>
              </div>
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-64 bg-transparent border-none text-on-surface font-sans text-xl resize-none p-8 pt-12 focus:ring-0 placeholder:text-on-surface-variant/20 leading-relaxed font-normal outline-none"
                placeholder="Drop your unfiltered thoughts here... Prawly will handle the rest."
              />
            </div>
          </div>

          {(wordError || spamError) && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-400 justify-center">
              <AlertCircle size={16} />
              <p className="text-sm font-bold">{wordError || spamError}</p>
            </motion.div>
          )}

          <button 
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
            className="w-full group relative flex items-center justify-center gap-3 px-10 py-6 bg-primary-container text-surface rounded-full font-display text-xl font-bold border-[3px] border-transparent hover:bg-[#ffc400] transition-all duration-500 shadow-[0_0_30px_rgba(255,191,0,0.3)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-surface/30 border-t-surface rounded-full animate-spin" />
                {progressText}
              </span>
            ) : (
              <>
                <span>Send Anonymously</span>
                <Send size={24} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </>
            )}
          </button>
        </div>

        {/* Viral CTA */}
        <section className="pt-20 pb-12 w-full flex flex-col items-center space-y-8 border-t border-white/5">
          <p className="text-on-surface-variant text-lg">Want your own truth-filter?</p>
          <button 
            onClick={() => onNavigate('signup')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full glass-card border border-white/10 hover:border-primary-container/50 text-on-surface hover:text-primary-container transition-all font-display text-[10px] font-bold tracking-[0.2em] group uppercase"
          >
            <Zap size={16} />
            <span>Create one like this</span>
          </button>
        </section>
      </main>

      <footer className="w-full py-12 flex flex-col items-center gap-8 bg-zinc-950 border-t border-zinc-900 mt-auto">
        <div className="font-display text-xl font-black tracking-widest text-primary-container opacity-60">Prawly</div>
        <div className="flex gap-8">
          {['Privacy', 'Terms', 'API'].map(item => (
            <a key={item} href="#" className="font-display text-[10px] font-bold text-zinc-600 hover:text-primary-container transition-colors uppercase tracking-widest">{item}</a>
          ))}
        </div>
        <div className="text-zinc-700 font-display text-[10px] uppercase font-bold tracking-widest">A Kozmine Product</div>
      </footer>
    </div>
  );
}
