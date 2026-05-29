"use client";

import { useState } from "react";
import { User } from "lucide-react";

function MeterBar({ label, value, colorClass }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-zinc-400 font-semibold">{label}</span>
        <span className="text-white font-bold">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function RelationshipPanel({ character, characters = [], canvasEdges = [] }) {
  const [directions, setDirections] = useState({}); // edge.id -> 'outgoing' | 'incoming'

  // Find all edges connected to this character
  const connectedEdges = canvasEdges.filter(
    (e) => e.source === character.id || e.target === character.id
  );

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-mono uppercase tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-2">
        Relationship Web
      </h3>
      {connectedEdges.length === 0 ? (
        <div className="text-center py-10 bg-zinc-950/20 border border-zinc-900 rounded-2xl">
          <p className="text-xs text-zinc-500 font-mono">No active relationship connections in the canvas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectedEdges.map((edge) => {
            // Find the other character
            const isSource = edge.source === character.id;
            const otherCharId = isSource ? edge.target : edge.source;
            const otherChar = characters.find((c) => c.id === otherCharId);

            if (!otherChar) return null;

            // Set state keys dynamically
            const direction = directions[edge.id] || "outgoing";
            const setDirectionForEdge = (dir) => {
              setDirections((prev) => ({ ...prev, [edge.id]: dir }));
            };

            // outgoing = character -> otherChar (source_to_target if isSource, target_to_source if not)
            // incoming = otherChar -> character (target_to_source if isSource, source_to_target if not)
            const useSourceToTarget = (isSource && direction === "outgoing") || (!isSource && direction === "incoming");

            // Extract directional emotions or mutual emotions
            let trust = 50;
            let attachment = 50;
            let comfort = 50;
            let awkwardness = 0;
            let resentment = 0;

            if (edge.emotions) {
              const ems = useSourceToTarget 
                ? (edge.emotions.source_to_target || edge.emotions) 
                : (edge.emotions.target_to_source || edge.emotions);
              
              trust = ems.trust ?? 50;
              attachment = ems.attachment ?? 50;
              comfort = ems.comfort ?? 50;
              awkwardness = ems.awkwardness ?? 0;
              resentment = ems.resentment ?? 0;
            }

            return (
              <div
                key={edge.id}
                className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 space-y-4 hover:border-zinc-850 transition-colors"
              >
                {/* Header with direction dropdown selector */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-900/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {otherChar.avatarUrl ? (
                        <img src={otherChar.avatarUrl} alt={otherChar.name} className="w-full h-full object-contain" />
                      ) : (
                        <User className="w-5 h-5 text-zinc-650" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{otherChar.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900/60 text-zinc-450 border border-zinc-850 font-semibold inline-block mt-0.5">
                        {edge.label || "Connected"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Premium Selector Dropdown */}
                  <div className="flex flex-col items-end gap-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Perspective</label>
                    <select
                      value={direction}
                      onChange={(e) => setDirectionForEdge(e.target.value)}
                      className="bg-zinc-900 text-[10px] font-bold font-mono text-purple-400 rounded-lg px-2.5 py-1 border border-zinc-800 outline-none cursor-pointer focus:border-purple-500/50 transition-all"
                    >
                      <option value="outgoing">{character.name} ➔ {otherChar.name}</option>
                      <option value="incoming">{otherChar.name} ➔ {character.name}</option>
                    </select>
                  </div>
                </div>

                {/* Emotional Gauges */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <MeterBar label="Trust" value={trust} colorClass="bg-purple-500" />
                  <MeterBar label="Attachment" value={attachment} colorClass="bg-blue-500" />
                  <MeterBar label="Comfort" value={comfort} colorClass="bg-emerald-500" />
                  <MeterBar label="Awkwardness" value={awkwardness} colorClass="bg-pink-500" />
                  {resentment > 0 && (
                    <div className="col-span-2 mt-1">
                      <MeterBar label="Resentment" value={resentment} colorClass="bg-red-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

