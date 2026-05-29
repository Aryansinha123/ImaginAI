"use client";

import { useStore } from "../store/useStore";
import { Sparkles, Users, History, Settings, Film, Plus, BookOpen } from "lucide-react";

export default function DashboardView({ onViewChange }) {
  const { activeProject, characters, scenes } = useStore();

  const cards = [
    {
      title: "Scene Studio",
      desc: "Draft scenes, choose emotional tones, and generate immersive cinematic text.",
      icon: Sparkles,
      color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400",
      view: "Scene Studio"
    },
    {
      title: "Character Library",
      desc: "Manage characters, define relationship types, and visual styles.",
      icon: Users,
      color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
      view: "Characters"
    },
    {
      title: "Visual Timeline",
      desc: "Sequence scenes, reorder sequences, and track narrative continuity.",
      icon: Film,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
      view: "Timeline"
    },
    {
      title: "Memory System",
      desc: "Explore emotional continuity records and character memory links.",
      icon: History,
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
      view: "Memories"
    },
    {
      title: "Story Bible",
      desc: "Narrative direction — major events, active threads, and character evolution.",
      icon: BookOpen,
      color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400",
      view: "Story Bible"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-10 relative">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[120px] pointer-events-none" />

      {/* Hero Welcome */}
      <div className="relative z-10 p-8 rounded-3xl bg-zinc-950/40 border border-zinc-800/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
        
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-semibold uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            Universe Active
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome to <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{activeProject.name}</span>
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            This project is your private sandbox universe. Construct detailed characters and script emotional cinematic sequences that build upon past memories.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-6 shrink-0">
          <div className="px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center min-w-[100px]">
            <span className="text-2xl font-extrabold text-white block">{characters.length}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block mt-1">Characters</span>
          </div>
          <div className="px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center min-w-[100px]">
            <span className="text-2xl font-extrabold text-white block">{scenes.length}</span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block mt-1">Scenes</span>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              onClick={() => onViewChange(c.view)}
              className={`group p-6 rounded-3xl border bg-zinc-950/20 hover:bg-zinc-950/45 hover:border-zinc-700 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-purple-500/[0.02] flex items-start gap-4 relative overflow-hidden`}
            >
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${c.color} border shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  {c.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed pr-4">
                  {c.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
