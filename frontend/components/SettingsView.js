"use client";

import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useToast } from "./ToastProvider";
import { Settings, Trash2, Edit3, Sparkles } from "lucide-react";

export default function SettingsView() {
  const { activeProject, renameProject, deleteProject, updateProjectTheme } = useStore();
  const { toast, confirmAction } = useToast();
  const [name, setName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
    }
  }, [activeProject]);

  const handleRename = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await renameProject(activeProject.id, name.trim());
    toast({
      type: "success",
      title: "Project renamed",
      message: "Your universe has its new title.",
    });
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirm.trim() !== activeProject.name) {
      toast({
        type: "error",
        title: "Name does not match",
        message: "Type the project name exactly to unlock deletion.",
      });
      return;
    }
    const confirmed = await confirmAction({
      title: `Delete "${activeProject.name}"?`,
      message: "This permanently removes the project, characters, timelines, scene cards, and memory continuity.",
      confirmText: "Delete Project",
      variant: "danger",
    });

    if (confirmed) {
      await deleteProject(activeProject.id);
      toast({
        type: "success",
        title: "Project deleted",
        message: "The project universe and all its contents have been deleted.",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-10 relative w-full">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Administration</span>
        <h2 className="text-2xl font-bold text-white mt-1">Project Settings</h2>
      </div>

      {/* Rename Box */}
      <div className="p-6 rounded-3xl bg-zinc-950/20 border border-zinc-850 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-purple-400" />
          Rename Project Universe
        </h3>
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">
              New Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neo-Tokyo 2099"
              className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || name.trim() === activeProject.name}
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-855 disabled:text-zinc-600 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-95"
          >
            Save Project Name
          </button>
        </form>
      </div>

      {/* Theme/Aesthetic Box */}
      <div className="p-6 rounded-3xl bg-zinc-950/20 border border-zinc-850 space-y-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 block mb-1">Aesthetics</span>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Project Theme & Vibe
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Choose a dedicated visual identity, font system, and ambient glow tailored to this project's universe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              id: "default",
              name: "Midnight Void",
              desc: "Deep cosmic dark mode with glowing indigo and violet accents.",
              gradient: "from-zinc-950 via-zinc-900 to-purple-950",
              accent: "bg-purple-500",
              font: "Sans-Serif (Modern)",
            },
            {
              id: "cyberpunk",
              name: "Cyberpunk Syndicate",
              desc: "Dystopian digital grid. Hot pink, cyan, and neon yellow console vibes.",
              gradient: "from-[#0a0612] via-[#120824] to-[#061c28]",
              accent: "bg-yellow-400",
              font: "Monospace (Terminal)",
            },
            {
              id: "gothic",
              name: "Gothic Noir",
              desc: "Velvet crimson-gold shadows. Elegant serif styling.",
              gradient: "from-[#0a0202] via-[#1c0808] to-[#040101]",
              accent: "bg-[#e2b13c]",
              font: "Serif (Playfair Display)",
            },
            {
              id: "retro",
              name: "Retro-Futurism",
              desc: "80s computer terminal. Amber display vibes and CRT scanlines.",
              gradient: "from-[#0c0a08] via-[#1f160e] to-[#080605]",
              accent: "bg-amber-500",
              font: "Monospace (CRT Courier)",
            },
            {
              id: "solar",
              name: "Solaris Sunset",
              desc: "Dreamy peach-to-violet skies. Soft warm sunset glow.",
              gradient: "from-[#1a0f26] via-[#2f173d] to-[#120a1c]",
              accent: "bg-orange-500",
              font: "Geometric (Outfit)",
            },
            {
              id: "nebula",
              name: "Celestial Nebula",
              desc: "Swirling stardust and space blue. Sapphire and cyan nebulae.",
              gradient: "from-[#060e22] via-[#0d1c3f] to-[#020612]",
              accent: "bg-cyan-500",
              font: "Cosmic (Outfit)",
            },
          ].map((t) => {
            const isSelected = (activeProject.theme || "default") === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={async () => {
                  if (isSelected) return;
                  await updateProjectTheme(activeProject.id, t.id);
                  toast({
                    type: "success",
                    title: "Universe Vibe Updated",
                    message: `Applied the "${t.name}" aesthetic to this workspace.`,
                  });
                }}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-36 relative overflow-hidden transition-all duration-350 group cursor-pointer ${
                  isSelected
                    ? "border-purple-500/80 bg-zinc-900/35 shadow-lg shadow-purple-500/5 scale-[1.02]"
                    : "border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/20 hover:scale-[1.01] hover:bg-zinc-900/10"
                }`}
              >
                {/* Visual preview gradient strip */}
                <div className={`absolute top-0 right-0 w-24 h-full bg-gradient-to-l ${t.gradient} opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300 pointer-events-none`} />

                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${t.accent} shadow-sm`} />
                    <span className="text-sm font-bold text-white transition-colors duration-200 group-hover:text-purple-300">{t.name}</span>
                    {isSelected && (
                      <span className="text-[8px] font-mono font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal max-w-[85%]">
                    {t.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between w-full border-t border-zinc-900/60 pt-2.5 text-[9px] text-zinc-500 font-mono relative z-10">
                  <span>Font: {t.font}</span>
                  <span className={`transition-all duration-200 ${isSelected ? "text-zinc-550" : "opacity-0 group-hover:opacity-100 text-purple-400 font-bold"}`}>
                    {isSelected ? "Current" : "Apply Vibe →"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Delete Box */}
      <div className="p-6 rounded-3xl bg-red-950/[0.03] border border-red-900/10 space-y-4">
        <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400 animate-pulse" />
          Danger Zone
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Deleting this project universe will permanently erase all associated characters, timelines, scene cards, and memory continuity vectors. This action cannot be undone.
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">
              Type <span className="text-red-400 font-bold select-all">"{activeProject.name}"</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Confirm project name..."
              className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-red-500/50 outline-none rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={deleteConfirm.trim() !== activeProject.name}
            className="px-4 py-2 bg-red-950 text-red-400 hover:bg-red-900/10 disabled:bg-zinc-855 disabled:text-zinc-600 border border-red-900/20 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-95"
          >
            Delete Project Universe
          </button>
        </form>
      </div>
    </div>
  );
}
