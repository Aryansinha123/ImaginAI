"use client";

import { useEffect } from "react";
import { useStore } from "../../store/useStore";
import Sidebar from "../../components/Sidebar";
import StoryboardPanel from "../../components/storyboard/StoryboardPanel";
import { Film, Loader2 } from "lucide-react";

export default function StoryboardPage() {
  const { user, initAuth, activeProject, authInitialized } = useStore();

  useEffect(() => {
    initAuth();
  }, []);

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Redirect or show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <img src="/logo.png" alt="Manomaya Logo" className="w-16 h-16 object-contain rounded-2xl mb-6" />
        <h2 className="text-2xl font-bold text-white tracking-tight">Please Sign In</h2>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
          You must be logged in to view the Storyboard and manage your universes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 h-screen bg-zinc-900 flex flex-col overflow-hidden">
        {activeProject ? (
          <StoryboardPanel />
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-8 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full bg-blue-900/5 blur-[120px] pointer-events-none" />

            <div className="max-w-md relative z-10 space-y-6">
              <img src="/logo.png" alt="Manomaya Logo" className="w-16 h-16 object-contain rounded-2xl mx-auto shadow-inner" />
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Open a Universe first</h2>
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  Select a project from the sidebar to open the Storyboard Engine for that universe.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
