"use client";

import { Clock, Film, Heart } from "lucide-react";

export default function StoryboardTimeline({ shots = [] }) {
  const totalDuration = shots.reduce((acc, shot) => acc + (shot.duration || 0), 0);

  return (
    <div className="p-6 bg-zinc-950/50 border border-zinc-900 rounded-3xl space-y-4">
      {/* Timeline Header Metadata */}
      <div className="flex items-center justify-between text-xs text-zinc-550 font-mono">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-400" />
          <span className="font-bold text-zinc-300">Shots Timeline Sequence</span>
        </div>
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-850 px-2.5 py-1 rounded-full text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Total Runtime: {totalDuration} seconds ({shots.length} shots)</span>
        </div>
      </div>

      {/* Proportional Segment Track */}
      <div className="h-6 w-full bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden flex relative select-none">
        {shots.map((shot, idx) => {
          // Calculate proportional width based on duration
          const percent = totalDuration > 0 ? ((shot.duration || 3) / totalDuration) * 100 : 100 / shots.length;
          
          // Style classes based on index
          const colors = [
            "from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border-purple-500/30 text-purple-300",
            "from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 border-indigo-500/30 text-indigo-300",
            "from-blue-500/20 to-sky-500/20 hover:from-blue-500/30 hover:to-sky-500/30 border-blue-500/30 text-blue-300",
            "from-sky-500/20 to-teal-500/20 hover:from-sky-500/30 hover:to-teal-500/30 border-sky-500/30 text-sky-300",
            "from-teal-500/20 to-emerald-500/20 hover:from-teal-500/30 hover:to-emerald-500/30 border-teal-500/30 text-teal-300",
            "from-emerald-500/20 to-amber-500/20 hover:from-emerald-500/30 hover:to-amber-500/30 border-emerald-500/30 text-emerald-300",
            "from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-500/30 text-amber-300",
            "from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 border-orange-500/30 text-orange-300"
          ];
          const colorClass = colors[idx % colors.length];

          return (
            <div
              key={shot.shot_number}
              style={{ width: `${percent}%` }}
              className={`h-full bg-gradient-to-r ${colorClass} border-r last:border-r-0 flex items-center justify-center font-mono text-[10px] font-black transition-all cursor-help relative group/segment`}
              title={`Shot ${shot.shot_number}: ${shot.shot_type} (${shot.duration}s)`}
            >
              <span>#{shot.shot_number}</span>

              {/* Segment tooltip popup */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 border border-zinc-800 p-2.5 rounded-2xl opacity-0 scale-95 pointer-events-none group-hover/segment:opacity-100 group-hover/segment:scale-100 transition-all z-30 shadow-2xl flex flex-col gap-1 text-left font-sans select-text">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black font-mono text-purple-400 uppercase">Shot {shot.shot_number}</span>
                  <span className="text-[9px] font-mono text-zinc-550 font-bold bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">{shot.duration}s</span>
                </div>
                <div className="text-[10px] font-bold text-zinc-200 capitalize mt-1">
                  🎬 {shot.shot_type} — {shot.camera_angle?.replace("_", " ")}
                </div>
                <div className="text-[9px] text-zinc-400 font-semibold italic line-clamp-2 mt-1">
                  "{shot.description}"
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Timeline Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {shots.map((shot, idx) => (
          <div
            key={shot.shot_number}
            className="p-3 bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 rounded-2xl text-left flex flex-col gap-1.5 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black font-mono text-zinc-500">#{String(shot.shot_number).padStart(2, "0")}</span>
              <span className="text-[9px] font-mono text-purple-400 font-bold">{shot.duration}s</span>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-white capitalize block truncate">
                {shot.shot_type}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 block truncate">
                {shot.camera_angle?.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[8px] font-mono text-zinc-450 uppercase border-t border-zinc-850/60 pt-1.5">
              <Heart className="w-2.5 h-2.5 text-pink-500/70" />
              <span className="truncate">{shot.emotion}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
