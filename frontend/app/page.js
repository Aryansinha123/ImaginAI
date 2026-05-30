"use client";

import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import Sidebar from "../components/Sidebar";
import ProjectDashboard from "../components/ProjectDashboard";
import AuthCard from "../components/AuthCard";
import { Sparkles, Film, LogIn, ArrowRight, X, Loader2 } from "lucide-react";

export default function Home() {
  const { user, initAuth, activeProject, authInitialized } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  // Prevent flash of landing page during session restoration
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Landing Page (Not Logged In)
  if (!user) {
    return (
      <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

        {/* Navbar */}
        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Manomaya Logo" className="w-9 h-9 object-contain rounded-xl" />
            <span className="text-xl font-bold tracking-tight">Manomaya</span>
          </div>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 hover:bg-white/5 border border-white/10 rounded-xl text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-zinc-400" />
            Sign In
          </button>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Next-Gen Storytelling Engine
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Bring your <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">imagination</span> to life.
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10">
            Create vivid, multi-dimensional characters and let the AI generate cinematic, emotionally rich scene scripts tailored to their personalities.
          </p>

          <button
            onClick={() => setShowAuthModal(true)}
            className="group px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold transition-all duration-300 flex items-center gap-2.5 shadow-xl hover:shadow-white/5 active:scale-95 cursor-pointer text-base"
          >
            Start Writing Free
            <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
          </button>
        </main>

        {/* Modal Backdrop */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2 z-10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
              <AuthCard onClose={() => setShowAuthModal(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard (Logged In)
  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans overflow-hidden">
      <Sidebar />

      {activeProject ? (
        <ProjectDashboard />
      ) : (
        <div className="flex-1 h-screen bg-zinc-900 flex flex-col justify-center items-center text-center p-8 relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-blue-900/5 blur-[120px] pointer-events-none" />

          <div className="max-w-md relative z-10 space-y-6">
            <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Film className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Create or open a project</h2>
              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                Choose an existing project from the sidebar, or create a brand new one to start crafting your story.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}