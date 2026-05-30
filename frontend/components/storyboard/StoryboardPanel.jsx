"use client";

import { useState, useEffect } from "react";
import { useStore } from "../../store/useStore";
import ShotCard from "./ShotCard";
import StoryboardTimeline from "./StoryboardTimeline";
import { 
  Film, 
  Clapperboard, 
  Sparkles, 
  Loader2, 
  FileText, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StoryboardPanel() {
  const {
    activeProject,
    scenes,
    activeScene,
    characters,
    updateScene,
    generateStoryboard,
    createSceneFromSandbox
  } = useStore();

  const [expandedSceneId, setExpandedSceneId] = useState(null);
  const [generatingSceneId, setGeneratingSceneId] = useState(null);
  const [activeStoryboardIds, setActiveStoryboardIds] = useState({});
  const [customSceneText, setCustomSceneText] = useState("");
  const [customSceneTitle, setCustomSceneTitle] = useState("Custom Playground Scene");

  // State for user custom prompts and version names inside each scene card
  const [customPrompts, setCustomPrompts] = useState({});
  const [versionNames, setVersionNames] = useState({});
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState({});
  const [hasInitialized, setHasInitialized] = useState(false);

  // Sync expanded scene with activeScene from store only once on initial load
  useEffect(() => {
    if (hasInitialized) return;
    
    if (activeScene) {
      setExpandedSceneId(activeScene.id);
      setHasInitialized(true);
    } else if (scenes.length > 0) {
      setExpandedSceneId(scenes[0].id);
      setHasInitialized(true);
    }
  }, [activeScene, scenes, hasInitialized]);

  const handleGenerateStoryboard = async (scene, storyboardId = null) => {
    const customPromptText = customPrompts[scene.id] || "";
    if (!customPromptText.trim() && !storyboardId) return; // Prompt required for new versions

    setGeneratingSceneId(scene.id);
    try {
      // Find character descriptions for scene context
      const sceneCharacters = characters.filter(c => scene.characterIds?.includes(c.id || c._id));
      const characterContext = sceneCharacters
        .map(c => `${c.name} (${c.gender}, age ${c.age || 'unknown'}, traits: ${c.core_traits || 'none'})`)
        .join(", ");
      
      // Combine scene context, characters, and user custom prompt to give LLM full detail
      const activePromptText = storyboardId 
        ? (scene.storyboards?.find(sb => sb.id === storyboardId)?.prompt || "Regenerate storyboard")
        : customPromptText;

      const combinedPrompt = `Scene Screenplay Context:\n${scene.generated_text}\n\nCharacters in Scene:\n${characterContext}\n\nStoryboard Focus Prompt:\n${activePromptText}`;

      const shots = await generateStoryboard(combinedPrompt);
      if (shots) {
        let patchData = {};
        if (storyboardId) {
          // Overwrite shots of specific storyboard
          const updatedStoryboards = (scene.storyboards || []).map(sb => {
            if (sb.id === storyboardId) {
              return { ...sb, shots };
            }
            return sb;
          });
          patchData = {
            storyboards: updatedStoryboards
          };
          if (scene.storyboards && scene.storyboards[0]?.id === storyboardId) {
            patchData.storyboard = shots; // legacy mirror
          }
        } else {
          // Create new storyboard version
          const verNum = (scene.storyboards?.length || 0) + 1;
          const name = versionNames[scene.id]?.trim() || `Version ${verNum}`;
          
          const newStoryboard = {
            id: "sb_" + Date.now(),
            name,
            prompt: activePromptText,
            shots,
            created_at: new Date().toISOString()
          };
          const updatedStoryboards = [...(scene.storyboards || []), newStoryboard];
          patchData = {
            storyboards: updatedStoryboards
          };
          if (!scene.storyboard || scene.storyboard.length === 0) {
            patchData.storyboard = shots; // legacy mirror
          }
          
          // Clear inputs
          setCustomPrompts(prev => ({ ...prev, [scene.id]: "" }));
          setVersionNames(prev => ({ ...prev, [scene.id]: "" }));
          setIsCreatingNewVersion(prev => ({ ...prev, [scene.id]: false }));
          
          // Set newly created storyboard active
          setActiveStoryboardIds(prev => ({ ...prev, [scene.id]: newStoryboard.id }));
        }
        await updateScene(activeProject.id, scene.id, patchData);
      }
    } catch (err) {
      console.error("Error generating storyboard:", err);
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleSaveSandboxScene = async () => {
    if (!customSceneText.trim()) return;
    try {
      const newScene = await createSceneFromSandbox(customSceneTitle, customSceneText, []);
      if (newScene) {
        setCustomSceneText("");
        setCustomSceneTitle("Custom Playground Scene");
        setExpandedSceneId(newScene.id);
      }
    } catch (err) {
      console.error("Error saving sandbox scene:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950 scrollbar-thin relative">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[120px] pointer-events-none" />

      {/* Header Block */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-semibold block mb-1">
            Visual Assets
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Cinematic Storyboard Engine
          </h2>
          <p className="text-xs text-zinc-550 mt-1">
            Decompose screenplay scene scripts into structured shot-by-shot storyboards and generate AI reference stills.
          </p>
        </div>
      </div>

      {/* Main Accordion List */}
      <div className="relative z-10 space-y-4 max-w-7xl">
        {scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-8 border border-dashed border-zinc-900 rounded-3xl bg-zinc-950/10">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-650 mb-4 shadow-inner">
              <Clapperboard className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-zinc-400">No Scenes Available</h3>
            <p className="text-xs text-zinc-650 mt-1 max-w-xs leading-relaxed">
              Create and generate scenes in the **Scene Studio** to automatically populate your storyboard workspace.
            </p>
          </div>
        ) : (
          scenes.map((scene, idx) => {
            const isExpanded = expandedSceneId === scene.id;
            const hasStoryboards = scene.storyboards && scene.storyboards.length > 0;
            const isGeneratingThis = generatingSceneId === scene.id;

            // Find character details
            const sceneCharacters = characters.filter(c => scene.characterIds?.includes(c.id || c._id));

            // Get active storyboard
            const activeStoryboardId = activeStoryboardIds[scene.id] || scene.storyboards?.[0]?.id || null;
            const activeStoryboard = scene.storyboards?.find(sb => sb.id === activeStoryboardId) || scene.storyboards?.[0] || null;
            const hasActiveStoryboardShots = activeStoryboard && activeStoryboard.shots && activeStoryboard.shots.length > 0;

            const isCreatingNew = isCreatingNewVersion[scene.id] || !hasStoryboards;

            return (
              <div
                key={scene.id}
                className={`bg-zinc-950/40 border rounded-3xl p-6 transition-all duration-300 flex flex-col ${
                  isExpanded 
                    ? "border-purple-500/30 bg-zinc-950/60 shadow-xl shadow-purple-500/2" 
                    : "border-zinc-900/70 hover:border-zinc-800 hover:bg-zinc-950/20"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedSceneId(isExpanded ? null : scene.id)}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                      isExpanded 
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                        : "bg-zinc-900/50 border-zinc-850 text-zinc-450 group-hover:border-zinc-700 group-hover:text-zinc-300"
                    }`}>
                      <Film className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-wider font-bold">
                          Scene #{idx + 1}
                        </span>
                        {scene.tone && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-[8px] text-zinc-500 font-mono uppercase tracking-wider">
                            {scene.tone}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm font-extrabold truncate mt-0.5 ${
                        isExpanded ? "text-white" : "text-zinc-300 group-hover:text-white"
                      }`}>
                        {scene.title || "Untitled Scene"}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {hasStoryboards ? (
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/5 border border-purple-500/20 text-[10px] text-purple-400 font-mono font-bold">
                        🎬 {scene.storyboards.length} Storyboards
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-500 font-mono font-semibold">
                        No Storyboard
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-450 group-hover:text-zinc-300 transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-450 group-hover:text-zinc-300 transition-colors" />
                    )}
                  </div>
                </div>

                {/* Dropdown Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 border-t border-zinc-900/60 space-y-6 mt-5">
                        
                        {/* 1. Screenplay Script */}
                        <div className="flex flex-col gap-2.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-zinc-555" />
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                              Scene Screenplay
                            </span>
                          </div>
                          {scene.generated_text ? (
                            <div className="bg-zinc-900/20 border border-zinc-900/50 p-5 rounded-2xl max-h-48 overflow-y-auto scrollbar-thin text-xs text-zinc-300 font-medium leading-relaxed whitespace-pre-wrap">
                              {scene.generated_text}
                            </div>
                          ) : (
                            <div className="p-6 border border-dashed border-zinc-855 rounded-2xl text-center space-y-2">
                              <AlertCircle className="w-6 h-6 text-zinc-650 mx-auto" />
                              <p className="text-xs font-semibold text-zinc-500">
                                This scene has no screenplay script generated yet.
                              </p>
                              <p className="text-[10px] text-zinc-600 max-w-sm mx-auto">
                                Navigate to the **Scene Studio** to write and generate the full screenplay text first.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 2. Character Details */}
                        <div className="flex flex-col gap-2.5 text-left">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
                            Characters in Scene
                          </span>
                          {sceneCharacters.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {sceneCharacters.map(char => (
                                <div key={char.id || char._id} className="p-3 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col text-left space-y-1">
                                  <span className="text-xs font-bold text-purple-300">{char.name}</span>
                                  <span className="text-[10px] text-zinc-450 font-mono capitalize">
                                    {char.gender || "unknown"} &bull; {char.age ? `${char.age} years` : "age unknown"}
                                  </span>
                                  {char.core_traits && (
                                    <span className="text-[9px] text-zinc-500 line-clamp-1">
                                      Traits: {char.core_traits}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-mono italic">
                              No characters assigned to this scene.
                            </span>
                          )}
                        </div>

                        {/* 3. Storyboards Container */}
                        {isGeneratingThis ? (
                          <div className="py-16 flex flex-col items-center gap-3">
                            <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-400 font-bold">Processing Storyboard Option...</p>
                              <p className="text-[9px] font-mono tracking-widest text-zinc-655 uppercase">Creating camera compositions and angles</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6 pt-2">
                            {/* Version Selector Header */}
                            {hasStoryboards && !isCreatingNew && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
                                <div className="flex items-center gap-3 text-left">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
                                    Select Storyboard:
                                  </span>
                                  <select
                                    value={activeStoryboardId || ""}
                                    onChange={(e) => setActiveStoryboardIds(prev => ({ ...prev, [scene.id]: e.target.value }))}
                                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-1.5 text-xs outline-none font-semibold focus:border-purple-500/40 cursor-pointer"
                                  >
                                    {scene.storyboards.map(sb => (
                                      <option key={sb.id} value={sb.id} className="bg-zinc-950 text-zinc-300">
                                        {sb.name} ({sb.shots?.length || 0} shots)
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleGenerateStoryboard(scene, activeStoryboardId)}
                                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-purple-500/30 text-zinc-400 hover:text-white rounded-lg text-[9px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer active:scale-95"
                                    title="Regenerate active storyboard shots using the same prompt"
                                  >
                                    Regenerate Active
                                  </button>
                                  <button
                                    onClick={() => setIsCreatingNewVersion(prev => ({ ...prev, [scene.id]: true }))}
                                    className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-600 active:scale-95 text-white font-bold rounded-lg text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-500/10"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    <span>New Storyboard</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* View Storyboard Layout */}
                            {hasStoryboards && !isCreatingNew && activeStoryboard && (
                              <div className="space-y-6">
                                {/* Prompt Box Display */}
                                <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl text-left space-y-1">
                                  <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                                    Storyboard Prompt / Focus Area
                                  </span>
                                  <p className="text-xs text-zinc-350 italic">
                                    "{activeStoryboard.prompt || "Generated based on screenplay."}"
                                  </p>
                                </div>

                                {hasActiveStoryboardShots ? (
                                  <div className="space-y-6">
                                    <StoryboardTimeline shots={activeStoryboard.shots} />

                                    <div className="space-y-3 pt-2">
                                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block text-left pl-1">
                                        Storyboard Composition
                                      </span>
                                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {activeStoryboard.shots.map((shot) => (
                                          <ShotCard
                                            key={shot.shot_number}
                                            shot={shot}
                                            sceneId={scene.id}
                                            storyboardId={activeStoryboard.id}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-12 border border-dashed border-zinc-900 bg-zinc-950/20 rounded-3xl text-center space-y-4 max-w-md mx-auto">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center mx-auto">
                                      <Clapperboard className="w-5 h-5 text-zinc-650" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-xs font-bold text-zinc-400">Empty Storyboard Version</h4>
                                      <p className="text-[10px] text-zinc-555 max-w-[280px] mx-auto leading-relaxed">
                                        Generate shots for this custom storyboard option.
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleGenerateStoryboard(scene, activeStoryboardId)}
                                      className="px-5 py-2.5 bg-purple-650 hover:bg-purple-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 mx-auto transition-all cursor-pointer"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Generate Shots</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Create/Generate Storyboard Form (User writes the prompt himself) */}
                            {isCreatingNew && (
                              <div className="max-w-xl bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 text-left space-y-4 mx-auto">
                                <div className="space-y-1">
                                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                                    {hasStoryboards ? "Create New Storyboard Version" : "Generate First Storyboard"}
                                  </h3>
                                  <p className="text-[10px] text-zinc-550">
                                    Enter a custom prompt to specify which part of the screenplay or composition focus area you want to storyboard.
                                  </p>
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
                                    Storyboard Name (optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={versionNames[scene.id] || ""}
                                    onChange={(e) => setVersionNames(prev => ({ ...prev, [scene.id]: e.target.value }))}
                                    placeholder={`e.g. Version ${(scene.storyboards?.length || 0) + 1} - Establishing shots`}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2 text-xs outline-none focus:border-purple-500/40 font-semibold"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
                                    Storyboard Prompt / Segment Focus
                                  </label>
                                  <textarea
                                    value={customPrompts[scene.id] || ""}
                                    onChange={(e) => setCustomPrompts(prev => ({ ...prev, [scene.id]: e.target.value }))}
                                    placeholder="e.g. 'Storyboard the first half of the scene. Ryan argues intensely with Sarah near the counter, slams his keys, and storm out.' or 'Composition shots focusing on Sarah crying closeups'"
                                    rows={3}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-purple-500/40 leading-relaxed font-semibold resize-none"
                                  />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-900/60">
                                  {hasStoryboards && (
                                    <button
                                      type="button"
                                      onClick={() => setIsCreatingNewVersion(prev => ({ ...prev, [scene.id]: false }))}
                                      className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleGenerateStoryboard(scene)}
                                    disabled={!customPrompts[scene.id]?.trim()}
                                    className="px-4 py-2 bg-purple-650 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-500/10"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Decompose into Shots</span>
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        {/* Sandbox Playground Accordion Item */}
        <div
          className={`bg-zinc-950/40 border rounded-3xl p-6 transition-all duration-300 flex flex-col ${
            expandedSceneId === "custom_sandbox"
              ? "border-emerald-500/20 bg-zinc-950/60 shadow-xl shadow-emerald-500/2" 
              : "border-zinc-900/70 hover:border-zinc-800 hover:bg-zinc-950/20"
          }`}
        >
          {/* Header Row */}
          <div
            onClick={() => setExpandedSceneId(expandedSceneId === "custom_sandbox" ? null : "custom_sandbox")}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                expandedSceneId === "custom_sandbox"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-zinc-900/50 border-zinc-850 text-zinc-450 group-hover:border-zinc-700 group-hover:text-zinc-300"
              }`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-wider font-bold">
                  Playground Sandbox
                </span>
                <h3 className={`text-sm font-extrabold truncate mt-0.5 ${
                  expandedSceneId === "custom_sandbox" ? "text-white" : "text-zinc-300 group-hover:text-white"
                }`}>
                  Create Custom Screenplay Scene
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-400/90 font-mono font-bold uppercase">
                TEMPORARY
              </span>
              {expandedSceneId === "custom_sandbox" ? (
                <ChevronUp className="w-4 h-4 text-zinc-450 group-hover:text-zinc-300 transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-450 group-hover:text-zinc-300 transition-colors" />
              )}
            </div>
          </div>

          {/* Expanded Sandbox Body */}
          <AnimatePresence initial={false}>
            {expandedSceneId === "custom_sandbox" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-6 border-t border-zinc-900/60 space-y-6 mt-5">
                  <div className="space-y-4 max-w-4xl">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                        Playground Scene Title
                      </label>
                      <input
                        type="text"
                        value={customSceneTitle}
                        onChange={(e) => setCustomSceneTitle(e.target.value)}
                        placeholder="e.g. Elena's Betrayal"
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2.5 outline-none focus:border-purple-500/40 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                          Screenplay Scene Description
                        </label>
                        <span className="text-[9px] font-mono text-zinc-555 font-semibold">
                          Write the screenplay details (settings, characters, narrative text)
                        </span>
                      </div>
                      <textarea
                        value={customSceneText}
                        onChange={(e) => setCustomSceneText(e.target.value)}
                        placeholder="Describe the screenplay, action, dialogue, and environments... Once saved, you can write custom prompts to generate its storyboard!"
                        rows={4}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-4 py-3 outline-none focus:border-purple-500/40 text-xs leading-relaxed font-medium resize-y"
                      />
                    </div>

                    <button
                      onClick={handleSaveSandboxScene}
                      disabled={!customSceneText.trim()}
                      className="px-5 py-2.5 bg-emerald-650 hover:bg-emerald-600 active:scale-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Save Sandbox as Scene</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
