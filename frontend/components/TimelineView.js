"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import { Film, Trash2, Copy, Edit3, ArrowUp, ArrowDown, Users } from "lucide-react";

export default function TimelineView({ onViewChange, onSelectScene }) {
  const { activeProject, scenes, characters, deleteScene, duplicateScene, reorderScenes } = useStore();
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Reorder using buttons
  const moveScene = async (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const newScenes = [...scenes];
    // Swap
    const temp = newScenes[currentIndex];
    newScenes[currentIndex] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    const orderedIds = newScenes.map((s) => s.id);
    await reorderScenes(activeProject.id, orderedIds);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newScenes = [...scenes];
    const [draggedItem] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(targetIndex, 0, draggedItem);

    setDraggedIndex(null);
    const orderedIds = newScenes.map((s) => s.id);
    await reorderScenes(activeProject.id, orderedIds);
  };

  const getToneColor = (tone) => {
    const tones = {
      romantic: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      awkward: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      tense: "bg-red-500/10 text-red-400 border-red-500/20",
      nostalgic: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      emotional: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      melancholic: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      suspenseful: "bg-orange-500/10 text-orange-400 border-orange-500/20"
    };
    return tones[tone] || "bg-zinc-800 text-zinc-400 border-zinc-700/50";
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 relative">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Sequence</span>
          <h2 className="text-2xl font-bold text-white mt-1">Scene Timeline</h2>
        </div>
        <button
          onClick={() => {
            onSelectScene(null);
            onViewChange("Scene Studio");
          }}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer"
        >
          Add New Scene
        </button>
      </div>

      {scenes.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-zinc-850 rounded-3xl max-w-xl mx-auto">
          <Film className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-base font-semibold text-zinc-400">No scenes in the timeline yet</p>
          <p className="text-xs text-zinc-650 mt-1 max-w-[280px] mx-auto">
            Head to the Scene Studio to create your first scene, select characters, and write story beats.
          </p>
        </div>
      ) : (
        <div className="space-y-5 max-w-4xl">
          <p className="text-xs text-zinc-550 mb-2 italic">
            💡 Tip: Drag and drop cards to reorder scenes, or use the ↑ and ↓ buttons.
          </p>
          {scenes.map((scene, index) => {
            // Find character names assigned to this scene
            const assignedChars = characters.filter((c) =>
              (scene.characterIds || []).includes(c.id)
            );

            return (
              <div
                key={scene.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className="group flex flex-col md:flex-row items-stretch bg-zinc-950/40 border border-zinc-850 hover:border-zinc-750 transition-all duration-300 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing shadow-lg"
              >
                {/* Widescreen Frame Visualizer / Number */}
                <div className="w-full md:w-48 bg-zinc-900 border-r border-zinc-850 flex flex-col items-center justify-center p-6 relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                  <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-semibold">
                    Sequence #{index + 1}
                  </span>
                  <span className="text-3xl font-extrabold text-white mt-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Main Body */}
                <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base truncate">
                        {scene.title || "Untitled Scene"}
                      </h3>
                      {scene.tone && (
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getToneColor(scene.tone)}`}>
                          {scene.tone}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 italic line-clamp-2 leading-relaxed">
                      "{scene.prompt}"
                    </p>
                  </div>

                  {/* Characters Assigned Bubble */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      {assignedChars.length === 0 ? (
                        <span className="text-[10px] text-zinc-550 italic">No characters assigned</span>
                      ) : (
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {assignedChars.map((char) => (
                            <div
                              key={char.id}
                              title={char.name}
                              className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-300"
                            >
                              {char.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timeline Action Buttons */}
                    <div className="flex items-center gap-2 opacity-85 group-hover:opacity-100 transition-opacity">
                      {/* Reorder Buttons */}
                      <button
                        onClick={() => moveScene(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-850 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveScene(index, 1)}
                        disabled={index === scenes.length - 1}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-850 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-px h-4 bg-zinc-800 mx-1" />

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          onSelectScene(scene);
                          onViewChange("Scene Studio");
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-purple-400 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                        title="Edit in Studio"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate Button */}
                      <button
                        onClick={() => duplicateScene(activeProject.id, scene)}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-emerald-400 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                        title="Duplicate Scene"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this scene?")) {
                            deleteScene(activeProject.id, scene.id);
                          }
                        }}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-red-400 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                        title="Delete Scene"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
