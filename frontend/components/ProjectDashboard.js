"use client";

import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import DashboardView from "./DashboardView";
import CharacterStudio from "./CharacterStudio";
import TimelineView from "./TimelineView";
import MemoriesView from "./MemoriesView";
import SceneStudioView from "./SceneStudioView";
import SettingsView from "./SettingsView";
import RelationshipCanvasView from "./RelationshipCanvasView";
import GalleryView from "./GalleryView";
import StoryBibleView from "./StoryBibleView";
import { Sparkles, Film, Loader2 } from "lucide-react";

export default function ProjectDashboard() {
  const {
    activeProject,
    activeView,
    activeScene,
    setActiveView,
    setActiveScene,
    isLoading
  } = useStore();

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    // Set initial time on mount to prevent hydration mismatch
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <span className="text-xs font-mono tracking-widest text-zinc-555 uppercase">
            Synchronizing Universe...
          </span>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "Characters":
        return <CharacterStudio />;
      case "Relationship Canvas":
        return <RelationshipCanvasView />;
      case "Timeline":
        return (
          <TimelineView
            onViewChange={setActiveView}
            onSelectScene={setActiveScene}
          />
        );
      case "Memories":
        return <MemoriesView />;
      case "Story Bible":
        return <StoryBibleView />;
      case "Scene Studio":
        return (
          <SceneStudioView
            activeScene={activeScene}
            onSelectScene={setActiveScene}
          />
        );
      case "Gallery":
        return <GalleryView />;
      case "Settings":
        return <SettingsView />;
      case "Dashboard":
      default:
        return <DashboardView onViewChange={setActiveView} />;
    }
  };

  return (
    <div className="flex-1 h-screen bg-zinc-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-8 py-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/20 shrink-0 select-none relative z-10">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold">Universe Space</span>
          <h1 className="text-xl font-extrabold text-white mt-0.5">{activeProject.name}</h1>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveScene(null);
              setActiveView("Scene Studio");
            }}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Scene
          </button>
          <button
            onClick={() => setActiveView("Timeline")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              activeView === "Timeline"
                ? "bg-zinc-800 border-zinc-700 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-450 hover:text-white"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Timeline View
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="flex-1 flex overflow-hidden">
        {renderActiveView()}
      </div>

      {/* Footer */}
      <footer className="px-6 py-2 border-t border-zinc-900 bg-zinc-950/20 text-[10px] text-zinc-500 font-mono flex items-center justify-between z-10 shrink-0">
        <span>EchoVerse Studio &copy; {new Date().getFullYear()}</span>
        <span>Local Time: {currentTime}</span>
        <span>Project Initiated: {activeProject.created_at ? new Date(activeProject.created_at).toLocaleString() : 'Recently'}</span>
      </footer>
    </div>
  );
}
