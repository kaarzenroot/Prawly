import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import { toBlob } from "html-to-image";
import {
  BarChart3, Inbox, Palette, Plus, Link as LinkIcon,
  X, ArrowRight, Quote, Menu,
  Copy, Check, MessageCircle, Clock, ChevronLeft, Zap,
  Share2, MoreVertical, Edit2, Trash2, Send,
  Settings, Camera, QrCode
} from "lucide-react";
import type { PrawlyLink, PrawlyUser, PrawlyMessage } from "../App";

interface DashboardProps {
  onNavigate: (page: string) => void;
  user: PrawlyUser | null;
  links: PrawlyLink[];
  onCreateLink: (name: string, question: string) => PrawlyLink;
  onEditLink: (linkId: string, name: string, question: string) => void;
  onDeleteLink: (linkId: string) => void;
  onDeleteMessage: (linkId: string, messageId: string) => void;
  onUpdateProfile: (username: string, photoURL: string | null) => void;
  onSignOut: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function getLinkUrl(linkId: string): string {
  return `${window.location.origin}${window.location.pathname}#/scream/${linkId}`;
}

export function Dashboard({ onNavigate, user, links, onCreateLink, onEditLink, onDeleteLink, onDeleteMessage, onUpdateProfile, onSignOut }: DashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCreationSuccess, setShowCreationSuccess] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState(user.username);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user.photoURL || null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [linkName, setLinkName] = useState("");
  const [linkQuestion, setLinkQuestion] = useState("");
  const [editingLink, setEditingLink] = useState<PrawlyLink | null>(null);
  const [selectedLink, setSelectedLink] = useState<PrawlyLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [shareMenuOpenId, setShareMenuOpenId] = useState<string | null>(null);
  const [qrLinkId, setQrLinkId] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Response modal state
  const [responseMessage, setResponseMessage] = useState<PrawlyMessage | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Close 3-dot menus when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShareMenuOpenId(null);
      }
    };
    if (shareMenuOpenId) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [shareMenuOpenId]);

  // Generate QR on canvas with golden "P" overlay
  useEffect(() => {
    if (!qrLinkId || !qrCanvasRef.current) return;
    const url = getLinkUrl(qrLinkId);
    const canvas = qrCanvasRef.current;
    QRCode.toCanvas(canvas, url, {
      width: 280,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }, () => {
      // Draw golden "P" watermark in center
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = 28;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.font = `bold ${r * 1.4}px 'Georgia', serif`;
      ctx.fillStyle = "#FFBF00";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("P", cx, cy + 1);
    });
  }, [qrLinkId]);

  // Push browser history when entering message detail view
  useEffect(() => {
    if (!selectedLink) return;
    window.history.pushState({ dashboardView: 'messages' }, '');
    const handlePop = () => setSelectedLink(null);
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [selectedLink?.id]);

  const navItems = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "inbox", label: "Inbox", icon: Inbox },
    { id: "themes", label: "Themes", icon: Palette },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        setProfilePhoto(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (link: PrawlyLink) => {
    const url = getLinkUrl(link.id);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleShare = async (link: PrawlyLink) => {
    const url = getLinkUrl(link.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prawly',
          text: link.question,
          url: url,
        });
      } catch (err) {
        console.log("User cancelled share or error occurred");
      }
    } else {
      handleCopy(link);
    }
  };

  const openCreateModal = () => {
    setEditingLink(null);
    setLinkName("");
    setLinkQuestion("");
    setCreateError(null);
    setIsModalOpen(true);
  };

  const handleSaveLink = () => {
    setCreateError(null);
    if (!linkName.trim()) {
      setCreateError("Give your link a name so you can find it later.");
      return;
    }
    if (!linkQuestion.trim()) {
      setCreateError("Add a question so people know what to respond to.");
      return;
    }

    if (editingLink) {
      onEditLink(editingLink.id, linkName.trim(), linkQuestion.trim());
    } else {
      onCreateLink(linkName.trim(), linkQuestion.trim());
      setShowCreationSuccess(true);
      setTimeout(() => setShowCreationSuccess(false), 3000);
      // No auto-share — user clicks Share when ready
    }

    setLinkName("");
    setLinkQuestion("");
    setEditingLink(null);
    setIsModalOpen(false);
    setActiveTab("analytics");
  };

  const totalMessages = links.reduce((acc, l) => acc + l.messages.length, 0);

  const renderResponseModal = () => (
    <AnimatePresence>
      {responseMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isExporting && setResponseMessage(null)} />
          
          <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
            
            {/* THE EXPORTABLE CARD */}
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              ref={cardRef}
              className="w-full relative overflow-hidden flex flex-col bg-surface-container-lowest border border-outline-variant shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              style={{ aspectRatio: "2 / 3", maxWidth: "360px" }}
            >
              {/* Top Half: The Catalyst (Feedback) */}
              <div className="flex-1 p-8 flex flex-col justify-center relative bg-surface-container-low/50">
                <div className="absolute top-6 left-6 font-display text-[10px] font-black tracking-[0.2em] text-on-surface-variant/50 uppercase">
                  [ The Callout ]
                </div>
                <Quote size={24} className="text-primary-container/20 absolute top-6 right-6" />
                <p className="text-on-surface text-xl leading-relaxed font-sans mt-4">
                  {responseMessage.aiSummary || responseMessage.text}
                </p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-outline-variant/30 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center">
                  <Zap size={14} className="text-primary-container" />
                </div>
              </div>

              {/* Bottom Half: The Play (Response) */}
              <div className="flex-1 p-8 flex flex-col relative bg-surface-container-highest/20">
                <div className="absolute top-6 left-6 font-display text-[10px] font-black tracking-[0.2em] text-primary-container uppercase">
                  [ The Play ]
                </div>
                <div className="mt-8 flex-1 flex flex-col justify-center">
                  {responseText ? (
                    <p className="text-primary-container/90 text-lg leading-relaxed font-sans break-words whitespace-pre-wrap">
                      {responseText}
                    </p>
                  ) : (
                    <p className="text-on-surface-variant/30 text-lg leading-relaxed font-sans italic">
                      No response provided.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Watermark */}
              <div className="absolute bottom-4 w-full text-center">
                <span className="font-display text-[8px] font-bold tracking-[0.3em] text-on-surface-variant/30 uppercase">
                  Kozmine Integrity Engine // Prawly V1
                </span>
              </div>
            </motion.div>

            {/* OUTSIDE THE CARD: Controls */}
            <div className="w-full max-w-sm space-y-4">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                className="w-full bg-surface-container-low border-2 border-outline-variant hover:border-outline focus:border-primary-container p-4 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/30 font-sans resize-none shadow-xl"
                rows={3}
                disabled={isExporting}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setResponseMessage(null)}
                  disabled={isExporting}
                  className="p-4 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={async () => {
                    if (!cardRef.current || isExporting) return;
                    setIsExporting(true);
                    try {
                      const blob = await toBlob(cardRef.current, {
                        pixelRatio: 3,
                        backgroundColor: '#181309', // Ensure dark background is solid
                        style: { transform: 'scale(1)', margin: '0' } // Prevent scaling issues
                      });
                      
                      if (!blob) throw new Error("Failed to generate image");
                      
                      const file = new File([blob], `prawly-response-${Date.now()}.png`, { type: 'image/png' });
                      
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          files: [file],
                          title: 'Prawly Response',
                          text: 'Check out my response on Prawly.'
                        });
                      } else {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = file.name;
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    } catch (err) {
                      console.error("Export failed:", err);
                      alert("Failed to export image. Please try again.");
                    } finally {
                      setIsExporting(false);
                    }
                  }}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-primary-container text-surface font-display text-sm font-black tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,191,0,0.3)] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isExporting ? (
                    <div className="w-5 h-5 border-2 border-surface/40 border-t-surface rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} /> Export & Share
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Selected link detail view
  if (selectedLink) {
    const fullLink = links.find(l => l.id === selectedLink.id);
    if (!fullLink) {
      setSelectedLink(null);
      return null;
    }
    
    return (
      <div className="min-h-screen flex bg-surface">
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Top Bar (Only back button in detail view) */}
          <header className="bg-surface/50 backdrop-blur-xl border-b-2 border-zinc-900 flex justify-between items-center px-8 py-4 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-on-surface-variant hover:text-tertiary transition-colors font-display font-bold text-sm"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              <div className="w-px h-6 bg-zinc-800" />
              <div className="text-2xl text-primary-container tracking-wider font-wordmark">Prawly</div>
            </div>
            <div className="flex gap-2">
               <button
                onClick={() => handleShare(fullLink)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant hover:border-tertiary text-on-surface-variant hover:text-tertiary transition-all font-display text-xs font-bold tracking-widest"
              >
                <Share2 size={16} />
                Share Link
              </button>
            </div>
          </header>

          <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
            {/* Link header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase mb-2">
                    {fullLink.name}
                  </p>
                  <h1 className="font-display text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
                    {fullLink.question}
                  </h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant">
                  <MessageCircle size={14} className="text-primary-container" />
                  <span className="font-display text-xs font-bold text-on-surface-variant">
                    {fullLink.messages.length}
                  </span>
                </div>
              </div>
              <p className="text-on-surface-variant/50 text-sm font-display">
                Created {timeAgo(fullLink.createdAt)}
              </p>
            </motion.div>

            {/* Messages */}
            {fullLink.messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center mb-6">
                  <Inbox size={32} className="text-on-surface-variant/30" />
                </div>
                <h3 className="font-display text-xl font-bold text-on-surface mb-2">No messages yet</h3>
                <p className="text-on-surface-variant max-w-sm mb-6">
                  Share your link with friends and wait for the honest feedback to roll in!
                </p>
                <div className="flex gap-4">
                  <button onClick={() => handleShare(fullLink)} className="p-3 bg-primary-container/10 text-primary-container rounded-full hover:bg-primary-container/20 transition-colors">
                    <Share2 size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {fullLink.messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative p-6 rounded-2xl bg-surface-container-low border border-outline-variant/50 group hover:border-primary-container/30 transition-all overflow-hidden"
                  >
                    <Quote size={16} className="text-primary-container/30 absolute top-4 right-4 pointer-events-none" />

                    <div className="relative z-10 pr-6">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-on-surface text-lg leading-relaxed">{msg.aiSummary || msg.text}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setResponseMessage(msg); setResponseText(""); }} 
                            className="p-2 text-primary-container hover:bg-primary-container/10 rounded-lg transition-colors flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest"
                          >
                            <Share2 size={16} /> <span className="hidden sm:inline">Respond</span>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteMessage(fullLink.id, msg.id); }} 
                            className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant/40">
                        <Clock size={12} />
                        <span className="font-display text-[10px] font-bold tracking-widest uppercase">
                          {timeAgo(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* 30-day notice and disclaimer */}
                <div className="text-center pt-8 pb-4 space-y-6">
                  <p className="text-xs text-on-surface-variant/50 font-display">
                    Messages are automatically deleted after 30 days.
                  </p>
                  <div className="max-w-md mx-auto p-4 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 text-[10px] text-on-surface-variant/60 font-sans leading-relaxed text-left">
                    <strong className="text-on-surface-variant/80 block mb-1">Disclaimer</strong>
                    This tool uses AI to filter and refine messages into a professional tone for basic understanding. The AI could make mistakes or misinterpret intent. Please do not take the results too seriously or personally.
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        {renderResponseModal()}
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 bg-surface-container-lowest border-r-2 border-zinc-900 flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="text-2xl text-primary-container tracking-wider font-wordmark">Prawly</div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm font-bold tracking-wider transition-all ${activeTab === item.id
                  ? "bg-primary-container/10 text-primary-container border border-primary-container/20"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent"
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-xl group relative">
            <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center overflow-hidden shrink-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-black text-primary-container text-lg uppercase">{user?.username?.[0] || "U"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold text-on-surface truncate">{user?.username || "User"}</p>
              <p className="text-[11px] text-on-surface-variant/50 truncate">{user?.email || ""}</p>
            </div>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg transition-colors shrink-0 z-10">
              <Settings size={16} />
            </button>
          </div>
          <button onClick={onSignOut} className="mt-2 w-full text-xs text-on-surface-variant/50 hover:text-red-400 font-display font-bold uppercase tracking-widest transition-colors py-2">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-b-2 border-zinc-900 flex justify-between items-center px-6 py-4">
        <div className="text-2xl text-primary-container tracking-wider font-wordmark">Prawly</div>
        <button onClick={() => setIsMenuOpen(v => !v)} className="text-on-surface-variant">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu outside-click overlay */}
      {isMenuOpen && <div className="fixed inset-0 z-20 md:hidden" onClick={() => setIsMenuOpen(false)} />}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-0 top-[65px] z-30 bg-surface-container-lowest border-b-2 border-zinc-900 p-4 space-y-2"
          >
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm font-bold tracking-wider transition-all ${activeTab === item.id
                    ? "bg-primary-container/10 text-primary-container"
                    : "text-on-surface-variant hover:text-on-surface"
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
            
            {/* Mobile User Section */}
            <div className="mt-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center overflow-hidden shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-black text-primary-container text-lg uppercase">{user?.username?.[0] || "U"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-sm font-bold text-on-surface truncate">{user?.username || "User"}</p>
                  <p className="text-[11px] text-on-surface-variant/50 truncate">{user?.email || ""}</p>
                </div>
                <button onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg transition-colors shrink-0">
                  <Settings size={16} />
                </button>
              </div>
              <button onClick={onSignOut} className="mt-2 w-full text-xs text-on-surface-variant/50 hover:text-red-400 font-display font-bold uppercase tracking-widest transition-colors py-2">
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile FAB */}
        <button
          onClick={openCreateModal}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary-container text-surface flex items-center justify-center shadow-[0_0_30px_rgba(255,191,0,0.4)] hover:scale-110 transition-transform"
        >
          <Plus size={24} />
        </button>

        <div className="flex-1 p-6 md:p-12 mt-[65px] md:mt-0">
           <div className="flex items-center justify-between mb-8 hidden md:flex">
              <h2 className="font-display text-3xl font-bold text-on-surface capitalize">{activeTab}</h2>
           </div>

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 blur-3xl rounded-full pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center mb-6">
                    <LinkIcon size={20} className="text-primary-container" />
                  </div>
                  <p className="font-display text-4xl font-black text-on-surface mb-1">{links.length}</p>
                  <p className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Active Links</p>
                </div>
                <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 blur-3xl rounded-full pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center mb-6">
                    <MessageCircle size={20} className="text-tertiary" />
                  </div>
                  <p className="font-display text-4xl font-black text-on-surface mb-1">{totalMessages}</p>
                  <p className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Total Responses</p>
                </div>
                <div className="p-8 rounded-3xl bg-surface-container-low border border-outline-variant/50 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                    <Zap size={20} className="text-secondary" />
                  </div>
                  <p className="font-display text-4xl font-black text-on-surface mb-1">
                    {links.length > 0 ? (totalMessages / links.length).toFixed(1) : "0"}
                  </p>
                  <p className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Avg / Link</p>
                </div>
              </div>

              {/* Links List */}
              <div>
                <h3 className="font-display text-sm font-bold text-on-surface-variant mb-6 uppercase tracking-widest">Your Links</h3>
                {links.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-outline-variant/30 rounded-3xl">
                    <div className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center mb-6">
                      <LinkIcon size={32} className="text-on-surface-variant/30" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-on-surface mb-2">No links yet</h3>
                    <p className="text-on-surface-variant max-w-sm mb-6">
                      Create your first feedback link and share it with your circle.
                    </p>
                    <button
                      onClick={openCreateModal}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-container text-surface font-display text-xs font-bold tracking-widest hover:scale-105 transition-transform md:hidden"
                    >
                      <Plus size={16} />
                      Create Link
                    </button>
                    
                    <div className="mt-12 max-w-md mx-auto p-4 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 text-[10px] text-on-surface-variant/60 font-sans leading-relaxed text-left">
                      <strong className="text-on-surface-variant/80 block mb-1">Disclaimer</strong>
                      This tool uses AI to filter and refine messages into a professional tone for basic understanding. The AI could make mistakes or misinterpret intent. Please do not take the results too seriously or personally.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {links.map((link, i) => (
                      <motion.div
                        key={link.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex flex-col p-6 rounded-3xl bg-surface-container-low border border-outline-variant/50 hover:border-primary-container/30 transition-all group relative cursor-pointer"
                        onClick={() => { setSelectedLink(link); }}
                      >
                         <div className="flex items-start justify-between gap-4 mb-4">
                           <div className="w-10 h-10 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-container/20 transition-colors">
                              <LinkIcon size={18} className="text-primary-container" />
                           </div>
                           
                           <div className="flex items-center gap-1 relative" ref={shareMenuOpenId === link.id ? menuRef : null}>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleCopy(link);
                               }}
                               title="Copy link"
                               className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                             >
                               {copiedId === link.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                             </button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setQrLinkId(link.id);
                               }}
                               title="Show QR code"
                               className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-primary-container transition-colors"
                             >
                               <QrCode size={18} />
                             </button>
                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setShareMenuOpenId(shareMenuOpenId === link.id ? null : link.id);
                               }}
                               className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                             >
                               <MoreVertical size={18} />
                             </button>

                             {/* 3-dot dropdown */}
                             {shareMenuOpenId === link.id && (
                               <div className="absolute top-10 right-0 bg-surface-container-highest border border-outline-variant rounded-xl shadow-xl z-20 overflow-hidden flex flex-col w-48" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => { 
                                    setEditingLink(link);
                                    setLinkName(link.name);
                                    setLinkQuestion(link.question);
                                    setIsModalOpen(true);
                                    setShareMenuOpenId(null);
                                  }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-on-surface transition-colors text-left">
                                    <Edit2 size={16} className="text-blue-400" /> Edit
                                  </button>
                                  <button onClick={() => { 
                                    if (confirm("Are you sure you want to delete this link? All messages will be lost.")) {
                                      onDeleteLink(link.id);
                                    }
                                    setShareMenuOpenId(null);
                                  }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-on-surface transition-colors text-left border-t border-white/5">
                                    <Trash2 size={16} className="text-red-400" /> Delete
                                  </button>
                                  <button onClick={() => { handleShare(link); setShareMenuOpenId(null); }} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-on-surface transition-colors text-left border-t border-white/5">
                                    <Share2 size={16} className="text-primary-container" /> Share
                                  </button>
                               </div>
                             )}
                           </div>
                         </div>

                        <div className="flex-1">
                          <h4 className="font-display text-lg font-bold text-on-surface mb-1 group-hover:text-primary-container transition-colors line-clamp-1">{link.name}</h4>
                          <p className="text-on-surface-variant/60 text-sm line-clamp-2">{link.question}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                           <span className="flex items-center gap-1.5 text-on-surface-variant/60 font-display text-xs">
                             <MessageCircle size={14} className="text-tertiary" />
                             <span className="font-bold">{link.messages.length}</span> responses
                           </span>
                           <span className="text-xs text-on-surface-variant/40 font-display flex items-center gap-1.5">
                              <Clock size={12} /> {timeAgo(link.createdAt)}
                           </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Inbox Tab */}
          {activeTab === "inbox" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl">
              {totalMessages === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center mb-6">
                    <Inbox size={32} className="text-on-surface-variant/30" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-on-surface mb-2">Inbox is empty</h3>
                  <p className="text-on-surface-variant max-w-sm mb-8">
                    When people respond to your links, their messages will appear here.
                  </p>

                  <div className="max-w-md mx-auto p-4 rounded-xl bg-surface-container-high/50 border border-outline-variant/30 text-[10px] text-on-surface-variant/60 font-sans leading-relaxed text-left">
                    <strong className="text-on-surface-variant/80 block mb-1">Disclaimer</strong>
                    This tool uses AI to filter and refine messages into a professional tone for basic understanding. The AI could make mistakes or misinterpret intent. Please do not take the results too seriously or personally.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {links
                    .flatMap(link => link.messages.map(msg => ({ ...msg, linkId: link.id, linkName: link.name })))
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-6 rounded-2xl bg-surface-container border border-outline-variant/50 hover:border-primary-container/20 transition-all relative overflow-hidden"
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-[10px] font-bold tracking-[0.15em] text-primary-container uppercase">{msg.linkName}</span>
                              <span className="text-on-surface-variant/20">·</span>
                              <span className="font-display text-[10px] font-bold tracking-widest text-on-surface-variant/40 uppercase">{timeAgo(msg.timestamp)}</span>
                            </div>
                            <button onClick={() => onDeleteMessage(msg.linkId, msg.id)} className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-on-surface text-base leading-relaxed">{msg.aiSummary || msg.text}</p>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Themes Tab */}
          {activeTab === "themes" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/10 border-2 border-secondary/20 flex items-center justify-center mb-6">
                  <Palette size={32} className="text-secondary" />
                </div>
                <h3 className="font-display text-xl font-bold text-on-surface mb-2">Themes Coming Soon</h3>
                <p className="text-on-surface-variant max-w-sm">
                  Customize how your feedback page looks with beautiful themes and branding options.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* QR Code Popup */}
      <AnimatePresence>
        {qrLinkId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setQrLinkId(null)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 flex flex-col items-center gap-6 bg-surface-container-lowest border-2 border-outline-variant rounded-3xl p-8 shadow-[0_0_60px_rgba(255,191,0,0.15)]"
            >
              <div className="flex flex-col items-center gap-1">
                <p className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Scan to Open</p>
                <h3 className="font-display text-lg font-black text-on-surface">
                  {links.find(l => l.id === qrLinkId)?.name || "Prawly Link"}
                </h3>
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,191,0,0.2)]">
                <canvas ref={qrCanvasRef} />
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    const link = links.find(l => l.id === qrLinkId);
                    if (link) handleCopy(link);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-container-high border border-outline-variant hover:border-primary-container/50 text-on-surface-variant hover:text-primary-container transition-all font-display text-xs font-bold tracking-widest"
                >
                  <Copy size={14} />
                  {copiedId === qrLinkId ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={() => {
                    const link = links.find(l => l.id === qrLinkId);
                    if (link) handleShare(link);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-container text-surface font-display text-xs font-bold tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,191,0,0.2)]"
                >
                  <Share2 size={14} />
                  Share
                </button>
              </div>
              <button onClick={() => setQrLinkId(null)} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant/50 hover:text-on-surface transition-all">
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create / Edit Link Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-surface-container-lowest border-2 border-outline-variant rounded-3xl p-8 space-y-6 z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-display text-2xl font-bold text-on-surface">
                  {editingLink ? "Edit Link" : "Create New Link"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant/50 hover:text-on-surface transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {createError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                >
                  <span>{createError}</span>
                </motion.div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Link Name</label>
                  <input
                    type="text"
                    value={linkName}
                    onChange={(e) => { setLinkName(e.target.value); setCreateError(null); }}
                    placeholder='e.g. "Work Feedback"'
                    className="w-full bg-surface-container-low border-2 border-outline-variant hover:border-outline focus:border-primary-container p-4 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/20 font-display"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Your Question</label>
                  <textarea
                    value={linkQuestion}
                    onChange={(e) => { setLinkQuestion(e.target.value); setCreateError(null); }}
                    placeholder='e.g. "What do you honestly think about me?"'
                    rows={3}
                    className="w-full bg-surface-container-low border-2 border-outline-variant hover:border-outline focus:border-primary-container p-4 rounded-xl outline-none transition-all text-on-surface placeholder:text-on-surface-variant/20 font-display resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveLink}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary-container text-surface font-display text-xs font-black tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,191,0,0.2)]"
              >
                {editingLink ? "Save Changes" : "Create & Copy Link"}
                <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-surface-container-lowest border-2 border-outline-variant rounded-3xl p-8 space-y-6 z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-display text-2xl font-bold text-on-surface">Settings</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant/50 hover:text-on-surface transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full border-4 border-surface-container-high overflow-hidden group">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <span className="font-display font-black text-primary-container text-4xl uppercase">{profileUsername?.[0] || "U"}</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Camera size={24} className="text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  {profilePhoto && (
                    <button onClick={() => setProfilePhoto(null)} className="text-xs text-red-400 font-bold uppercase tracking-widest hover:underline">Remove Photo</button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="font-display text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">Username</label>
                  <input
                    type="text"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    className="w-full bg-surface-container-low border-2 border-outline-variant hover:border-outline focus:border-primary-container p-4 rounded-xl outline-none transition-all text-on-surface font-display"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  onUpdateProfile(profileUsername.trim() || "User", profilePhoto);
                  setIsSettingsOpen(false);
                }}
                className="w-full py-4 rounded-xl bg-primary-container text-surface font-display text-xs font-black tracking-[0.2em] uppercase hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,191,0,0.2)]"
              >
                Save Profile
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response/Accountability Card Modal */}
      {renderResponseModal()}

      {/* Success Toast */}
      <AnimatePresence>
        {showCreationSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-full bg-primary-container text-surface font-display text-sm font-bold shadow-[0_10px_40px_rgba(255,191,0,0.4)]"
          >
            <Check size={20} />
            The link is created successfully! 🎉
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}