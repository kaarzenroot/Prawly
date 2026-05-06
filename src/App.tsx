import { useState, useEffect, useCallback } from "react";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth";
import { SignUp } from "./pages/SignUp";
import { Dashboard } from "./pages/Dashboard";
import { PublicScreamBox } from "./pages/PublicScreamBox";
import { AnimatePresence, motion } from "motion/react";
import { firebaseSignUp, firebaseSignIn, firebaseSignOut, onAuthStateChanged, auth, db } from "./lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, writeBatch } from "firebase/firestore";

type Page = "home" | "auth" | "signup" | "dashboard" | "public-scream-box";

export interface PrawlyLink {
  id: string;
  name: string;
  question: string;
  createdAt: number;
  messages: PrawlyMessage[];
  creatorUsername?: string;
  creatorPhoto?: string | null;
}

export interface PrawlyMessage {
  id: string;
  text: string;
  timestamp: number;
  aiSummary?: string;      // AI-interpreted version (placeholder)
  sentiment?: string;       // e.g. "positive", "constructive", "neutral"
  starred?: boolean;
}

export interface PrawlyUser {
  username: string;
  email: string;
  photoURL?: string | null;
}

// Simple ID generator
function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Custom URL generator based on username and title
function generateCustomLinkId(username: string, title: string): string {
  const cleanUser = username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 15) || "link";
  const hash = Math.random().toString(36).substring(2, 6);
  return `${cleanUser}-${cleanTitle}-${hash}`;
}

// ── AI Interpretation — calls our server-side /api/prawlly endpoint ──
// The Gemini API key is NEVER present in the frontend bundle.
async function aiInterpret(rawText: string): Promise<{ aiSummary: string; sentiment: string }> {
  try {
    const response = await fetch("/api/prawlly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: rawText }),
    });

    if (!response.ok) {
      console.error("API route error:", response.status);
      return { aiSummary: "AI could not process this message.", sentiment: "neutral" };
    }

    const data = await response.json();
    return {
      aiSummary: data.aiSummary ?? "AI could not process this message.",
      sentiment: data.sentiment ?? "neutral",
    };
  } catch (error) {
    console.error("Failed to reach /api/prawlly:", error);
    return { aiSummary: "AI could not process this message.", sentiment: "neutral" };
  }
}

export default function App() {
  const [user, setUser] = useState<PrawlyUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (window.location.hash.startsWith("#/scream/")) return "public-scream-box";
    return "home";
  });

  // ── Firebase Auth State Listener ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData: any = null;
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          userData = userDoc.exists() ? userDoc.data() : null;
        } catch (e) {
          console.error("Error fetching firestore user", e);
        }
        
        const localPhoto = localStorage.getItem(`prawly_photo_${firebaseUser.uid}`);

        setUser({
          username: userData?.username || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          photoURL: userData?.photoURL || firebaseUser.photoURL || localPhoto || null,
        });
        setCurrentPage(prev => {
          if (prev === "home" || prev === "auth" || prev === "signup") {
            return "dashboard";
          }
          return prev;
        });
      } else {
        setUser(null);
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);
  const [links, setLinks] = useState<PrawlyLink[]>(() => {
    const saved = localStorage.getItem("prawly_links");
    if (saved) {
      try {
        const parsed: PrawlyLink[] = JSON.parse(saved);
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        return parsed.map(link => ({
          ...link,
          messages: link.messages.filter(m => m.starred || (now - m.timestamp < THIRTY_DAYS))
        }));
      } catch { return []; }
    }
    return [];
  });
  const [publicLinkId, setPublicLinkId] = useState<string | null>(null);

  // ── Browser History & Routing ──
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const hash = window.location.hash;
      if (hash.startsWith("#/scream/")) {
        const linkId = hash.replace("#/scream/", "");
        setPublicLinkId(linkId);
        setCurrentPage("public-scream-box");
      } else if (e.state && e.state.page) {
        setCurrentPage(e.state.page);
        setPublicLinkId(null);
      } else {
        // Fallback
        setCurrentPage(authInitialized && user ? "dashboard" : "home");
        setPublicLinkId(null);
      }
    };
    window.addEventListener("popstate", handlePopState);

    // Initial check for hash
    const hash = window.location.hash;
    if (hash.startsWith("#/scream/")) {
      const linkId = hash.replace("#/scream/", "");
      setPublicLinkId(linkId);
      setCurrentPage("public-scream-box");
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, [authInitialized, user]);

  // Auto-login removed per request to always start on a fresh welcome page



  // ── Persist links whenever they change ──
  useEffect(() => {
    localStorage.setItem("prawly_links", JSON.stringify(links));
  }, [links]);

  // Reset scroll on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // ── Auth handlers (Firebase-based) ──
  const handleSignUp = useCallback(async (username: string, email: string, password: string): Promise<string | null> => {
    try {
      await firebaseSignUp(username, email, password);
      return null;
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') return "An account with this email already exists. Try logging in.";
      if (e.code === 'auth/weak-password') return "Password should be at least 6 characters.";
      return e.message || "Failed to create account.";
    }
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      await firebaseSignIn(email, password);
      return null;
    } catch (e: any) {
      return "Invalid email or password. Please try again.";
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut();
    setCurrentPage("home");
  }, []);

  const handleUpdateProfile = useCallback(async (newUsername: string, newPhotoURL: string | null) => {
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, { displayName: newUsername });
      } catch (e) {
        console.error("Error updating firebase auth profile", e);
      }
      
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          username: newUsername,
          photoURL: newPhotoURL,
          email: auth.currentUser.email
        }, { merge: true });
      } catch (e) {
        console.error("Error updating firestore user", e);
        // Fallback to local storage if Firestore permission denied
        if (newPhotoURL) {
          localStorage.setItem(`prawly_photo_${auth.currentUser.uid}`, newPhotoURL);
        } else {
          localStorage.removeItem(`prawly_photo_${auth.currentUser.uid}`);
        }
      }

      setUser(prev => prev ? { ...prev, username: newUsername, photoURL: newPhotoURL } : null);

      // Update creator details on existing links
      setLinks(prev => prev.map(l => ({ ...l, creatorUsername: newUsername, creatorPhoto: newPhotoURL })));
    }
  }, []);

  // ── Link handlers ──
  const handleCreateLink = useCallback((name: string, question: string): PrawlyLink => {
    const newLink: PrawlyLink = {
      id: generateCustomLinkId(user?.username || "user", name),
      name,
      question,
      createdAt: Date.now(),
      messages: [],
      creatorUsername: user?.username || "User",
      creatorPhoto: user?.photoURL || null,
    };
    setLinks(prev => [newLink, ...prev]);
    return newLink;
  }, [user]);

  const handleSubmitMessage = useCallback(async (linkId: string, text: string) => {
    const { aiSummary, sentiment } = await aiInterpret(text);
    const newMessage: PrawlyMessage = {
      id: generateId(),
      text,
      timestamp: Date.now(),
      aiSummary,
      sentiment,
    };
    setLinks(prev => prev.map(link =>
      link.id === linkId
        ? { ...link, messages: [...link.messages, newMessage] }
        : link
    ));
  }, []);

  const handleEditLink = useCallback((linkId: string, name: string, question: string) => {
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, name, question } : l));
  }, []);

  const handleDeleteLink = useCallback((linkId: string) => {
    setLinks(prev => prev.filter(l => l.id !== linkId));
    // Also redirect to dashboard if deleting currently active link
    if (window.location.hash.includes(linkId)) {
      history.replaceState(null, "", window.location.pathname);
      setPublicLinkId(null);
      setCurrentPage("dashboard");
    }
  }, []);

  const handleDeleteMessage = useCallback((linkId: string, messageId: string) => {
    setLinks(prev => prev.map(l =>
      l.id === linkId
        ? { ...l, messages: l.messages.filter(m => m.id !== messageId) }
        : l
    ));
  }, []);

  const handleToggleStarMessage = useCallback((linkId: string, messageId: string) => {
    setLinks(prev => prev.map(l =>
      l.id === linkId
        ? { ...l, messages: l.messages.map(m => m.id === messageId ? { ...m, starred: !m.starred } : m) }
        : l
    ));
  }, []);

  const navigate = useCallback((page: string) => {
    if (page !== "public-scream-box") {
      if (window.location.hash.startsWith("#/scream/")) {
        window.history.pushState(null, "", window.location.pathname);
      }
      setPublicLinkId(null);
    }
    setCurrentPage(page as Page);
    window.history.pushState({ page }, "", window.location.href);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <Home onNavigate={navigate} user={user} />;
      case "auth":
        return <Auth onNavigate={navigate} onSignIn={handleSignIn} />;
      case "signup":
        return <SignUp onNavigate={navigate} onSignUp={handleSignUp} />;
      case "dashboard":
        if (!user) {
          // Guard: redirect to auth if not signed in
          return <Auth onNavigate={navigate} onSignIn={handleSignIn} />;
        }
        return (
          <Dashboard
            onNavigate={navigate}
            user={user}
            links={links}
            onCreateLink={handleCreateLink}
            onEditLink={handleEditLink}
            onDeleteLink={handleDeleteLink}
            onDeleteMessage={handleDeleteMessage}
            onToggleStarMessage={handleToggleStarMessage}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
          />
        );
      case "public-scream-box":
        return (
          <PublicScreamBox
            onNavigate={navigate}
            linkId={publicLinkId}
            links={links}
            onSubmitMessage={handleSubmitMessage}
          />
        );
      default:
        return <Home onNavigate={navigate} user={user} />;
    }
  };

  if (!authInitialized && currentPage !== "public-scream-box") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-[3px] border-surface-container-high border-t-primary-container rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage + (publicLinkId || "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
