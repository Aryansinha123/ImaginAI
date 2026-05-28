"use client";

import { useStore } from "../store/useStore";
import { History, Heart, Sparkles, MessageSquare } from "lucide-react";

export default function MemoriesView() {
  const { activeProject, scenes, characters } = useStore();

  const getToneIcon = (tone) => {
    switch (tone) {
      case "romantic":
        return <Heart className="w-4 h-4 text-pink-400" />;
      case "tense":
      case "suspenseful":
        return <Sparkles className="w-4 h-4 text-red-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 relative">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Cognitive Core</span>
        <h2 className="text-2xl font-bold text-white mt-1">Emotional Memory System</h2>
      </div>

      {scenes.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-zinc-850 rounded-3xl max-w-xl mx-auto">
          <History className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-base font-semibold text-zinc-400">No emotional records yet</p>
          <p className="text-xs text-zinc-650 mt-1 max-w-[280px] mx-auto">
            Memories are auto-generated as you write and complete scenes. Characters will remember key decisions and emotional shifts here.
          </p>
        </div>
      ) : (
        <div className="relative border-l border-zinc-800 ml-4 pl-8 space-y-12 max-w-4xl py-4 select-text">
          {scenes.map((scene, index) => {
            const assignedChars = characters.filter((c) =>
              (scene.characterIds || []).includes(c.id)
            );
            const charNames = assignedChars.map(c => c.name).join(" & ") || "No character selected";

            return (
              <div key={scene.id} className="relative group space-y-3">
                {/* Visual Timeline Dot */}
                <div className="absolute left-[-41px] top-1.5 w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:border-purple-500/50 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500/70" />
                </div>

                {/* Card */}
                <div className="bg-zinc-950/25 border border-zinc-850 p-6 rounded-3xl space-y-4 shadow-lg hover:border-zinc-800 transition-all">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-850">
                        {getToneIcon(scene.tone)}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-550 block uppercase font-semibold">
                          Scene #{index + 1} • {charNames}
                        </span>
                        <h3 className="font-bold text-white text-base mt-0.5">
                          {scene.title || "Untitled Scene"}
                        </h3>
                      </div>
                    </div>
                    {scene.tone && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        [{scene.tone}]
                      </span>
                    )}
                  </div>

                  {/* Continuity Impact / Summarized Event */}
                  <div className="space-y-3">
                    <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl space-y-1">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-purple-400 block font-semibold">
                        Narrative Event
                      </span>
                      <p className="text-xs text-zinc-300 italic leading-relaxed">
                        "{scene.prompt}"
                      </p>
                    </div>

                    {/* Story Memory Traces */}
                    <div className="bg-purple-950/[0.04] border border-purple-900/10 p-4 rounded-2xl space-y-2">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-pink-400 block font-semibold">
                        Emotional Continuity Vector
                      </span>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {assignedChars.length > 0
                          ? `This scene registers in the minds of ${assignedChars.map(c => c.name).join(", ")}. Future scene prompts within this universe will maintain emotional context relating to this narrative junction.`
                          : "No subject profiles bound to this scene. Prompt details remain globally logged for narrative continuity."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
