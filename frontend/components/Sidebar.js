"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import {
  Folder,
  Plus,
  Check,
  X,
  LogOut,
  Film,
  Loader2,
  LayoutDashboard,
  Users,
  History,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp,
  Network,
  Image,
  BookOpen
} from "lucide-react";

export default function Sidebar() {
  const {
    user,
    projects,
    activeProject,
    activeView,
    createProject,
    setActiveProject,
    setActiveView,
    logout
  } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProjectSelect, setShowProjectSelect] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setLoading(true);
    await createProject(newProjectName.trim());
    setNewProjectName("");
    setIsCreating(false);
    setLoading(false);
    setShowProjectSelect(false);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Characters", icon: Users },
    { name: "Relationship Canvas", icon: Network },
    { name: "Timeline", icon: Film },
    { name: "Memories", icon: History },
    { name: "Story Bible", icon: BookOpen },
    { name: "Scene Studio", icon: Sparkles },
    { name: "Gallery", icon: Image },
    { name: "Settings", icon: Settings }
  ];

  return (
    <aside className="w-80 h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between p-6 shrink-0 relative z-20">
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 px-2 shrink-0">
          <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
            <Film className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">EchoVerse</span>
        </div>

        {/* Active Project Selector */}
        {activeProject ? (
          <div className="mb-6 px-2 shrink-0 relative">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">
              Active Universe
            </span>
            <button
              onClick={() => setShowProjectSelect(!showProjectSelect)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-zinc-900 border border-zinc-850 rounded-2xl text-left hover:border-zinc-700 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Folder className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-sm font-bold text-white truncate">{activeProject.name}</span>
              </div>
              {showProjectSelect ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
            </button>
          </div>
        ) : (
          <div className="mb-6 px-2 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">
              Select Universe
            </span>
            <button
              onClick={() => setShowProjectSelect(true)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-left text-zinc-450 cursor-pointer"
            >
              <span className="text-sm font-semibold text-zinc-450">Choose Project...</span>
              <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
            </button>
          </div>
        )}

        {/* Project Selector Panel */}
        {showProjectSelect && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col max-h-64 overflow-hidden shrink-0 space-y-3 shadow-inner">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">Universes</span>
              {!isCreating && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isCreating && (
              <form onSubmit={handleCreate} className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Universe name..."
                  autoFocus
                  className="flex-1 bg-zinc-950 text-white border border-zinc-800 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-purple-500/50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="p-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg transition-colors disabled:bg-zinc-700 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-black" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1.5 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {projects.length === 0 ? (
                <p className="text-[11px] text-zinc-650 text-center py-4">No universes created yet.</p>
              ) : (
                projects.map((project) => {
                  const isActive = activeProject && activeProject.id === project.id;
                  return (
                    <button
                      key={project.id}
                      onClick={() => {
                        setActiveProject(project);
                        setShowProjectSelect(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left text-xs font-semibold cursor-pointer ${
                        isActive
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/15"
                          : "text-zinc-450 hover:text-white hover:bg-zinc-800/50"
                      }`}
                    >
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate flex-1">{project.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Workspace Navigation Links */}
        {activeProject && !showProjectSelect && (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 shrink-0 py-2 border-t border-zinc-900/50 scrollbar-thin">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 font-semibold block px-2 mb-2">
              Workspace
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeView === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => setActiveView(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-left font-semibold cursor-pointer ${
                    isSelected
                      ? "bg-white text-black shadow-md shadow-white/5"
                      : "text-zinc-450 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{item.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User Footer */}
      {user && (
        <div className="border-t border-zinc-900 pt-5 flex items-center justify-between px-2 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
              {(user.username || user).charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">{user.username || user}</span>
              <span className="text-[10px] text-zinc-550 font-mono truncate">Writer</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
}
