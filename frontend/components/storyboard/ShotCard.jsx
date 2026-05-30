"use client";

import { useState } from "react";
import { useStore } from "../../store/useStore";
import { Camera, Image, Loader2, Sparkles, AlertCircle } from "lucide-react";

export default function ShotCard({ shot, sceneId, storyboardId }) {
  const { generateShotImage } = useStore();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setError(null);
    try {
      const filename = await generateShotImage(
        sceneId,
        storyboardId,
        shot.shot_number,
        shot.description,
        shot.camera_angle,
        shot.emotion
      );
      if (!filename) {
        setError("Generation failed. Check backend logs.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to image generation engine.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const shotTypeColors = {
    establishing: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    wide: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    closeup: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    over_the_shoulder: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    reaction: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    tracking: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    cinematic: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const defaultBadgeColor = "bg-zinc-800 text-zinc-400 border-zinc-700/50";
  const typeColorClass = shotTypeColors[shot.shot_type?.toLowerCase()] || defaultBadgeColor;

  return (
    <div className="relative group overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-900/20 hover:border-zinc-800 transition-all duration-300 flex flex-col h-full shadow-lg">
      
      {/* Top Banner with Image Preview or Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900 flex items-center justify-center border-b border-zinc-900">
        {shot.image ? (
          <img
            src={`/api/images/${shot.image}`}
            alt={`Shot ${shot.shot_number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2.5 text-zinc-650 group-hover:text-zinc-500 transition-colors p-4 text-center">
            <Camera className="w-8 h-8 opacity-40 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">Ready to Visualize</span>
          </div>
        )}

        {/* Ambient Top Glow for active image */}
        {shot.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Shot Number Badge */}
        <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-zinc-800 rounded-xl flex items-center justify-center">
          <span className="text-[10px] font-black font-mono text-purple-400 uppercase tracking-widest">
            Shot {String(shot.shot_number).padStart(2, "0")}
          </span>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-zinc-850 rounded-xl flex items-center justify-center">
          <span className="text-[10px] font-bold font-mono text-zinc-400">
            {shot.duration || 3}s
          </span>
        </div>
      </div>

      {/* Meta Specs & Details */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3.5">
          {/* Badge Specs Row */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2.5 py-1 border rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold ${typeColorClass}`}>
              {shot.shot_type || "cinematic"}
            </span>
            <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-lg text-[9px] font-mono uppercase tracking-wider">
              🎥 {shot.camera_angle?.replace("_", " ") || "eye level"}
            </span>
            <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-850 text-zinc-300 rounded-lg text-[9px] font-mono uppercase tracking-wider">
              🎭 {shot.emotion || "neutral"}
            </span>
          </div>

          {/* visual prompt/description */}
          <div className="space-y-1 text-left">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Shot Prompt</span>
            <p className="text-xs text-zinc-350 leading-relaxed font-medium">
              {shot.description}
            </p>
          </div>
        </div>

        {/* Action Button & Error Info */}
        <div className="space-y-2 pt-2 border-t border-zinc-900/60 shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-[10px] text-red-400/90 bg-red-950/20 border border-red-900/30 p-2 rounded-xl text-left">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerateImage}
            disabled={isGeneratingImage}
            className="w-full py-2.5 bg-zinc-900 hover:bg-purple-600 border border-zinc-800 hover:border-purple-500/30 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Visualizing Shot...</span>
              </>
            ) : shot.image ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-visualize Shot</span>
              </>
            ) : (
              <>
                <Image className="w-3.5 h-3.5" />
                <span>Generate Shot Image</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
