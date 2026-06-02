"use client";

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
import StoryboardPanel from "./storyboard/StoryboardPanel";
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
      case "Storyboard":
        return <StoryboardPanel />;
      case "Gallery":
        return <GalleryView />;
      case "Settings":
        return <SettingsView />;
      case "Dashboard":
      default:
        return <DashboardView onViewChange={setActiveView} />;
    }
  };

  const themeClass = `theme-${activeProject.theme || "default"}`;

  return (
    <div className={`flex-1 h-screen flex flex-col overflow-hidden themed-workspace themed-bg themed-transition relative ${themeClass}`}>
      {/* Background ambient glows (reacting to theme variables) */}
      <div className="absolute top-[-20%] left-[-20%] w-[70%] h-[70%] rounded-full themed-glow-1 blur-[130px] pointer-events-none z-0 themed-transition animate-[pulseGlow_6s_infinite_ease-in-out]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[70%] h-[70%] rounded-full themed-glow-2 blur-[130px] pointer-events-none z-0 themed-transition animate-[pulseGlow_6s_infinite_ease-in-out_1s]" />

      {/* Header */}
      <header className="px-8 py-5 border-b themed-border flex items-center justify-between bg-zinc-950/15 shrink-0 select-none relative z-10 themed-transition">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider themed-accent-text font-bold themed-transition">Universe Space</span>
          <h1 className="text-xl font-extrabold text-white mt-0.5 themed-title themed-transition">{activeProject.name}</h1>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveScene(null);
              setActiveView("Scene Studio");
            }}
            className="px-3.5 py-2 themed-accent-bg glowing-theme-button hover:opacity-90 active:scale-95 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            style={{ color: 'var(--theme-bg-text-color, #000)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Scene
          </button>
          <button
            onClick={() => setActiveView("Timeline")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border themed-transition ${
              activeView === "Timeline"
                ? "bg-zinc-800/40 border-zinc-700 text-white"
                : "bg-zinc-900/40 themed-border text-zinc-400 hover:text-white"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Timeline View
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {renderActiveView()}
      </div>

      {/* Footer */}
      <footer className="px-6 py-2.5 border-t themed-border bg-zinc-950/20 text-[10px] text-zinc-500 font-mono flex items-center justify-between z-10 shrink-0 themed-transition">
        <div className="flex items-center gap-4">
          <span>Manomaya Studio &copy; {new Date().getFullYear()}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-600">v1.0.0</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-450">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Universe Synchronized</span>
        </div>
      </footer>
    </div>
  );
}
