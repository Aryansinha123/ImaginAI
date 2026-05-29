"use client";

import { User, Film, Link2 } from "lucide-react";

export default function CharacterCard({ character, scenesCount = 0, relationshipsCount = 0, onClick }) {
  const gradientId = character.name.length % 3;
  const gradientClass =
    gradientId === 0
      ? "from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/30 group-hover:to-pink-500/30"
      : gradientId === 1
      ? "from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30"
      : "from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30";

  const traits = character.core_traits || [];

  return (
    <div
      onClick={onClick}
      className="w-full bg-zinc-950/40 border border-zinc-900 hover:border-zinc-700/60 p-5 rounded-2xl relative overflow-hidden group transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between h-96 hover:shadow-2xl hover:-translate-y-0.5 select-none"
    >
      {/* Background glow effect */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

      {/* Avatar & Basic Info */}
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} transition-all duration-300`} />
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)] rounded-lg z-10"
            />
          ) : (
            <User className="w-8 h-8 text-zinc-650 z-10" />
          )}
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-bold text-white text-base truncate group-hover:text-purple-400 transition-colors">
            {character.name}
          </h3>
          <div className="flex items-center justify-center gap-1">
            {character.age && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-450 border border-zinc-850 font-semibold">
                {character.age} yrs
              </span>
            )}
            {character.gender && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-450 border border-zinc-850 font-semibold">
                {character.gender}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Core Traits List */}
      <div className="flex-1 my-4 flex flex-col justify-center gap-1.5 overflow-hidden">
        {traits.length > 0 ? (
          traits.slice(0, 4).map((trait, idx) => (
            <div key={idx} className="flex items-center justify-center gap-1.5 text-xs text-zinc-300">
              <span className="text-purple-400 text-[10px]">✓</span>
              <span className="font-medium truncate max-w-[150px]">{trait}</span>
            </div>
          ))
        ) : (
          <div className="text-center text-[10px] text-zinc-600 font-mono italic">No traits defined</div>
        )}
      </div>

      {/* Statistics Footer */}
      <div className="border-t border-zinc-900/60 pt-3 flex items-center justify-around gap-2 text-[10px] font-mono text-zinc-555">
        <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
          <Film className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-bold text-zinc-400">{scenesCount}</span> Scenes
        </div>
        <div className="w-px h-3.5 bg-zinc-900" />
        <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
          <Link2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-zinc-400">{relationshipsCount}</span> Relations
        </div>
      </div>
    </div>
  );
}
