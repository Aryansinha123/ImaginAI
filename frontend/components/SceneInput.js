"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function SceneInput({ onGenerate, isGenerating }) {
  const [title, setTitle] = useState("");
  const [scene, setScene] = useState("");

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!title.trim() || !scene.trim() || isGenerating) return;
    onGenerate(scene.trim(), title.trim());
    setScene("");
    setTitle("");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
          Scene Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isGenerating}
          placeholder="e.g. confession, café reunion"
          className="w-full px-4 py-3 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors placeholder:text-zinc-650"
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
          Scene Description
        </label>
        <textarea
          value={scene}
          onChange={(e) => setScene(e.target.value)}
          disabled={isGenerating}
          placeholder="e.g. Elena stands on the edge of the rooftop as the rain pours down, debating whether to send the transmission..."
          className="w-full h-32 p-4 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm leading-relaxed transition-all placeholder:text-zinc-650 resize-none disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !title.trim() || !scene.trim()}
        className="w-full py-4 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-white/5 active:scale-[0.99]"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
            <span>Drafting Cinematic Script...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-black" />
            <span>Generate Story Scene</span>
          </>
        )}
      </button>
    </div>
  );
}