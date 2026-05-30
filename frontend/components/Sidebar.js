"use client";

import { useState, useEffect } from "react";
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
  BookOpen,
  Clapperboard
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
    logout,
    updateProfile
  } = useStore();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setEditUsername(user.username || user || "");
      setEditAvatarUrl(user.avatarUrl || "");
      const currentLabel = user.label || "Writer";
      const standardLabels = ["Writer", "Director", "Narrator", "Producer", "World Builder", "Screenwriter", "Showrunner", "Novelist", "Creative Director"];
      if (standardLabels.includes(currentLabel)) {
        setEditLabel(currentLabel);
        setCustomLabel("");
      } else {
        setEditLabel("Custom");
        setCustomLabel(currentLabel);
      }
    }
  }, [user, showProfileModal]);

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
    { name: "Storyboard", icon: Clapperboard },
    { name: "Gallery", icon: Image },
    { name: "Settings", icon: Settings }
  ];

  return (
    <aside className="w-80 h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between p-6 shrink-0 relative z-20">
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 px-2 shrink-0">
          <img src="/logo.png" alt="Manomaya Logo" className="w-9 h-9 object-contain rounded-xl" />
          <span className="text-xl font-extrabold tracking-tight text-white">Manomaya</span>
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
          <div 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-80 transition-all"
            title="Edit Profile"
          >
            <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center overflow-hidden font-bold text-sm shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username || user} className="w-full h-full object-cover" />
              ) : (
                (user.username || user).charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">{user.username || user}</span>
              <span className="text-[10px] text-zinc-550 font-mono truncate">{user.label || "Writer"}</span>
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

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in text-left select-text">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-850 rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{maxHeight: '90vh'}}>

            {/* Modal Header with gradient accent */}
            <div className="relative px-6 pt-6 pb-4 border-b border-zinc-900 shrink-0">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">Your Identity</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Edit Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editUsername.trim()) return;
                setIsUpdatingProfile(true);
                const finalLabel = editLabel === "Custom" ? customLabel.trim() : editLabel;
                const success = await updateProfile({
                  username: editUsername.trim(),
                  avatarUrl: editAvatarUrl.trim(),
                  label: finalLabel || "Writer"
                });
                if (success) {
                  setShowProfileModal(false);
                }
                setIsUpdatingProfile(false);
              }} 
              className="flex flex-col overflow-hidden"
            >
              <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin">

                {/* Avatar Section — large preview + quick picks */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-zinc-800 group-hover:border-purple-500/40 flex items-center justify-center overflow-hidden transition-all duration-300 shadow-lg shadow-black/30">
                      {editAvatarUrl ? (
                        <img src={editAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-zinc-600">{(editUsername || "?").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {editAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditAvatarUrl("")}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Quick avatar style picks from DiceBear */}
                  <div className="w-full">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-2 font-semibold text-center">Quick Avatar Styles</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { style: "pixel-art", label: "Pixel" },
                        { style: "adventurer", label: "Explorer" },
                        { style: "bottts", label: "Bot" },
                        { style: "fun-emoji", label: "Emoji" },
                        { style: "lorelei", label: "Sketch" },
                        { style: "thumbs", label: "Thumbs" },
                      ].map((av) => {
                        const seed = encodeURIComponent(editUsername || "default");
                        const url = `https://api.dicebear.com/9.x/${av.style}/svg?seed=${seed}`;
                        const isActive = editAvatarUrl === url;
                        return (
                          <button
                            key={av.style}
                            type="button"
                            onClick={() => setEditAvatarUrl(url)}
                            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all cursor-pointer ${
                              isActive
                                ? "border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-500/30 scale-105"
                                : "border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900"
                            }`}
                          >
                            <img src={url} alt={av.label} className="w-8 h-8 rounded-lg" />
                            <span className="text-[8px] font-mono text-zinc-500">{av.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom URL input */}
                  <div className="w-full">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">Or paste a custom image URL</label>
                    <input
                      type="text"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://example.com/my-avatar.png"
                      className="w-full px-4 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-[11px] font-mono"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-900" />

                {/* Username */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">Display Name</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Label / Role Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block font-semibold">Creative Persona</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Writer", "Director", "Narrator", "Producer", "World Builder", "Screenwriter", "Showrunner", "Novelist", "Creative Director"].map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setEditLabel(lbl)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all border cursor-pointer ${
                          editLabel === lbl
                            ? "bg-purple-500/15 border-purple-500/50 text-purple-400 shadow-sm shadow-purple-500/10"
                            : "bg-zinc-900/50 border-zinc-800/60 text-zinc-450 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditLabel("Custom")}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-full transition-all border cursor-pointer ${
                        editLabel === "Custom"
                          ? "bg-purple-500/15 border-purple-500/50 text-purple-400 shadow-sm shadow-purple-500/10"
                          : "bg-zinc-900/50 border-zinc-800/60 text-zinc-450 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      ✦ Custom...
                    </button>
                  </div>
                </div>

                {/* Custom Label Input */}
                {editLabel === "Custom" && (
                  <div className="animate-fade-in">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">Define Your Persona</label>
                    <input
                      type="text"
                      required
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="e.g. Lead Story Architect"
                      className="w-full px-4 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-xs font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Actions — sticky footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-zinc-900 shrink-0 bg-zinc-950">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-[0.97] shadow-lg shadow-purple-500/15"
                >
                  {isUpdatingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-5 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
