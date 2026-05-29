"use client";

import { Activity } from "lucide-react";

function EmotionGauge({ label, value, colorClass, statusLabel }) {
  return (
    <div className="bg-zinc-950/20 border border-zinc-900 rounded-xl p-3 flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-semibold">
          {label}
        </span>
        <span className="text-sm font-bold text-white leading-none">{value}%</span>
      </div>
      <div className="flex-1 max-w-[120px] h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-400 font-semibold bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-md">
        {statusLabel}
      </span>
    </div>
  );
}

export default function EmotionPanel({ character, scenes = [] }) {
  // Try to find the last scene involving this character to read emotions
  const relevantScenes = scenes.filter((s) => s.characterIds?.includes(character.id));
  const lastScene = relevantScenes[relevantScenes.length - 1];

  // Derive emotion states, or fall back to default based on personality
  let anxiety = 30;
  let motivation = 65;
  let stability = 70;
  let empathy = 80;

  if (lastScene && lastScene.emotion_deltas) {
    // If there are deltas, we can introduce minor shifts
    // But since individual emotions aren't directly stored, we can dynamically vary them for fun demo purposes!
    const seed = lastScene.id.charCodeAt(0) + lastScene.id.charCodeAt(1);
    anxiety = (seed % 60) + 20;
    motivation = ((seed * 3) % 50) + 40;
    stability = ((seed * 7) % 40) + 50;
    empathy = ((seed * 9) % 30) + 65;
  }

  const getStatus = (val) => {
    if (val > 75) return "HIGH";
    if (val < 35) return "LOW";
    return "STABLE";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <h3 className="text-sm font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Emotional Bio-metrics
        </h3>
        <span className="text-[9px] font-mono text-zinc-550">UPDATES LIVE PER SCENE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EmotionGauge label="Anxiety / Stress" value={anxiety} colorClass="bg-pink-500" statusLabel={getStatus(anxiety)} />
        <EmotionGauge label="Drive / Motivation" value={motivation} colorClass="bg-purple-500" statusLabel={getStatus(motivation)} />
        <EmotionGauge label="Mental Stability" value={stability} colorClass="bg-emerald-500" statusLabel={getStatus(stability)} />
        <EmotionGauge label="Cognitive Empathy" value={empathy} colorClass="bg-blue-500" statusLabel={getStatus(empathy)} />
      </div>

      {lastScene && (
        <div className="mt-4 p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-left space-y-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 font-bold">
            Latest Narrative Context
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed font-semibold italic">
            "{lastScene.title}": {lastScene.prompt.length > 100 ? lastScene.prompt.substring(0, 100) + "..." : lastScene.prompt}
          </p>
        </div>
      )}
    </div>
  );
}
