"use client";

import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { Sparkles, Loader2, Users, Heart, MessageCircle, AlertCircle, Plus, Eye, BookOpen, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, X } from "lucide-react";

export default function SceneStudioView({ activeScene, onSelectScene }) {
  const { activeProject, characters, scenes, generateScene, regenerateScene, updateScene, isGenerating } = useStore();

  // Local Editor State
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("emotional");
  const [selectedCharIds, setSelectedCharIds] = useState([]);
  const [generatedText, setGeneratedText] = useState("");
  const [activeFrameIndex, setActiveFrameIndex] = useState(null);

  // Branching & Decision State
  const [parentId, setParentId] = useState("");
  const [branchId, setBranchId] = useState("main");
  const [hasDecision, setHasDecision] = useState(false);
  const [decisionQuestion, setDecisionQuestion] = useState("");
  const [decisionChoices, setDecisionChoices] = useState([]);
  const [choiceInput, setChoiceInput] = useState("");

  // Handle keyboard navigation for zoomed storyboard carousel
  useEffect(() => {
    if (activeFrameIndex === null) return;
    
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveFrameIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : 2));
      } else if (e.key === "ArrowRight") {
        setActiveFrameIndex((prev) => (prev < 2 ? prev + 1 : 0));
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFrameIndex]);

  // Sync state if activeScene is selected
  useEffect(() => {
    if (activeScene) {
      setTitle(activeScene.title || "");
      setPrompt(activeScene.prompt || "");
      setTone(activeScene.tone || "emotional");
      setSelectedCharIds(activeScene.characterIds || []);
      setGeneratedText(activeScene.generated_text || "");
      setParentId(activeScene.parent_id || "");
      setBranchId(activeScene.branch_id || "main");
      setHasDecision(!!activeScene.decision);
      setDecisionQuestion(activeScene.decision?.question || "");
      setDecisionChoices(activeScene.decision?.choices || []);
      setChoiceInput("");
    } else {
      const draftParent = typeof window !== 'undefined' ? localStorage.getItem("imaginai_draft_parent") : null;
      const draftBranch = typeof window !== 'undefined' ? (localStorage.getItem("imaginai_draft_branch") || "branch_new") : "branch_new";

      setParentId(draftParent || "");
      setBranchId(draftBranch);
      setTitle(draftParent ? "Branched Reality" : "");
      setPrompt(draftParent ? "Based on previous events... " : "");
      setTone("emotional");
      setSelectedCharIds([]);
      setGeneratedText("");
      setHasDecision(false);
      setDecisionQuestion("");
      setDecisionChoices([]);
      setChoiceInput("");

      if (typeof window !== 'undefined') {
        localStorage.removeItem("imaginai_draft_parent");
        localStorage.removeItem("imaginai_draft_branch");
      }
    }
  }, [activeScene]);

  const toggleCharacter = (charId) => {
    setSelectedCharIds((prev) =>
      prev.includes(charId) ? prev.filter((id) => id !== charId) : [...prev, charId]
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim() || isGenerating) return;

    const decisionObj = hasDecision && decisionQuestion.trim() && decisionChoices.length > 0
      ? { question: decisionQuestion.trim(), choices: decisionChoices }
      : null;

    if (activeScene) {
      // Regenerating/Updating active scene
      setGeneratedText("");
      try {
        const updated = await regenerateScene(activeScene.id, prompt.trim(), selectedCharIds, title.trim(), tone);
        if (updated) {
          setGeneratedText(updated.generated_text);
          onSelectScene(updated);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Create new scene
      const created = await generateScene(
        prompt.trim(),
        selectedCharIds,
        title.trim(),
        tone,
        parentId || null,
        branchId || "main",
        decisionObj
      );
      if (created) {
        onSelectScene(created);
      }
    }
  };

  const saveMetadataOnly = async () => {
    if (!activeScene || !title.trim()) return;
    const decisionObj = hasDecision && decisionQuestion.trim() && decisionChoices.length > 0
      ? { question: decisionQuestion.trim(), choices: decisionChoices }
      : null;

    await updateScene(activeProject.id, activeScene.id, {
      title: title.trim(),
      prompt: prompt.trim(),
      tone,
      characterIds: selectedCharIds,
      parent_id: parentId || null,
      branch_id: branchId || "main",
      decision: decisionObj
    });
    alert("Scene details saved successfully!");
  };

  const tones = ["romantic", "awkward", "tense", "nostalgic", "emotional", "melancholic", "suspenseful"];

  const getToneBorder = (t) => {
    if (tone !== t) return "border-zinc-800 text-zinc-400 hover:border-zinc-700";
    switch (t) {
      case "romantic":
        return "border-pink-500/50 bg-pink-500/10 text-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
      case "tense":
        return "border-red-500/50 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
      case "awkward":
        return "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
      case "nostalgic":
        return "border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]";
      case "melancholic":
        return "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]";
      case "suspenseful":
        return "border-orange-500/50 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]";
      default:
        return "border-purple-500/50 bg-purple-500/10 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]";
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden select-text">
      {/* Editor Panel */}
      <div className="w-[55%] border-r border-zinc-850 flex flex-col overflow-hidden bg-zinc-950/10">
        {/* Workspace Scene Selector Header */}
        <div className="p-6 border-b border-zinc-850 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 block font-semibold">
              Studio
            </span>
            <select
              value={activeScene ? activeScene.id : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onSelectScene(null);
                } else {
                  const sc = scenes.find((s) => s.id === val);
                  onSelectScene(sc);
                }
              }}
              className="mt-0.5 bg-transparent border-none text-white font-bold text-lg outline-none focus:ring-0 max-w-[200px] cursor-pointer"
            >
              <option value="" className="bg-zinc-950 text-white">Create New Scene...</option>
              {scenes.map((s, idx) => (
                <option key={s.id} value={s.id} className="bg-zinc-950 text-white">
                  Scene {idx + 1}: {s.title || "Untitled"}
                </option>
              ))}
            </select>
          </div>

          {activeScene && (
            <button
              onClick={() => onSelectScene(null)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-xs font-semibold text-zinc-300 rounded-xl transition-all cursor-pointer"
            >
              New Scene Draft
            </button>
          )}
        </div>

        {/* Inputs Scrollable */}
        <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin pr-3">
          {/* Title */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5 font-semibold">
              Scene Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. Rain-slicked Alleyway Confession"
              className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
            />
          </div>

          {/* Branching Setup */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-950/20 border border-zinc-850/50 p-4 rounded-2xl">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">
                Branch From (Parent)
              </label>
              <select
                value={parentId}
                onChange={(e) => {
                  setParentId(e.target.value);
                  if (!e.target.value) {
                    setBranchId("main");
                  }
                }}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-xs cursor-pointer"
              >
                <option value="">None (Root Scene / Main)</option>
                {scenes
                  .filter((s) => s.id !== (activeScene ? activeScene.id : null))
                  .map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Scene {idx + 1}: {s.title}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">
                Reality Label / Branch Name
              </label>
              <input
                type="text"
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                disabled={isGenerating || !parentId}
                placeholder="e.g. Confess, Stay Silent"
                className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-850 focus:border-purple-500/50 outline-none rounded-xl text-xs disabled:opacity-40 disabled:pointer-events-none"
              />
            </div>
          </div>

          {/* Emotional Tone Selector */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5 font-semibold">
              Emotional Tone
            </label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 border text-xs font-semibold rounded-xl uppercase tracking-wider transition-all duration-300 cursor-pointer ${getToneBorder(
                    t
                  )}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Selectable Characters Drawer */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2 font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Bind Characters to Scene
            </label>

            {characters.length === 0 ? (
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-center">
                <p className="text-xs text-zinc-500">No characters created yet. Add one in the Characters tab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {characters.map((char) => {
                  const isSelected = selectedCharIds.includes(char.id);
                  return (
                    <div
                      key={char.id}
                      onClick={() => !isGenerating && toggleCharacter(char.id)}
                      className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 relative ${
                        isSelected
                          ? "bg-purple-500/5 border-purple-500/40 shadow-sm"
                          : "bg-zinc-950/20 border-zinc-850 hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                        {char.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{char.name}</p>
                        <p className="text-[9px] text-zinc-500 truncate">
                          {typeof char.relationship_type === 'object' && char.relationship_type !== null
                            ? (char.relationship_type.emotion || char.relationship_type.relationship_type || "Global character")
                            : (typeof char.relationship === 'object' && char.relationship !== null
                              ? (char.relationship.emotion || "Global character")
                              : (char.relationship_type || char.relationship || "Global character"))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prompt */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5 font-semibold">
              Scene Prompts & Narrative beats
            </label>
            <textarea
              required
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              placeholder="Describe the action... Elena leans against the copper pipes under the neon glow. Aisha pulls up her collar, hiding a hesitant smile. They speak in whispers..."
              className="w-full h-32 px-4 py-3 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm leading-relaxed resize-none scrollbar-thin"
            />
          </div>

          {/* Decision Point Setup */}
          <div className="bg-zinc-950/20 border border-zinc-850/50 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                Add Narrative Decision Point
              </label>
              <input
                type="checkbox"
                checked={hasDecision}
                onChange={(e) => setHasDecision(e.target.checked)}
                disabled={isGenerating}
                className="w-4 h-4 accent-purple-650 cursor-pointer"
              />
            </div>

            {hasDecision && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-1 font-semibold">
                    Decision Prompt Question
                  </label>
                  <input
                    type="text"
                    value={decisionQuestion}
                    onChange={(e) => setDecisionQuestion(e.target.value)}
                    disabled={isGenerating}
                    placeholder="e.g. What does Ryan do next?"
                    className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block font-semibold">
                    Timeline Choices
                  </label>
                  
                  {decisionChoices.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {decisionChoices.map((choice, index) => (
                        <div key={index} className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300">
                          <span>{choice}</span>
                          <button
                            type="button"
                            onClick={() => setDecisionChoices(prev => prev.filter((_, i) => i !== index))}
                            className="text-zinc-500 hover:text-red-400 font-bold ml-1.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={choiceInput}
                      onChange={(e) => setChoiceInput(e.target.value)}
                      disabled={isGenerating}
                      placeholder="e.g. Confess"
                      className="flex-1 px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (choiceInput.trim() && !decisionChoices.includes(choiceInput.trim())) {
                            setDecisionChoices(prev => [...prev, choiceInput.trim()]);
                            setChoiceInput("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (choiceInput.trim() && !decisionChoices.includes(choiceInput.trim())) {
                          setDecisionChoices(prev => [...prev, choiceInput.trim()]);
                          setChoiceInput("");
                        }
                      }}
                      className="px-3.5 py-2 bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={isGenerating || !title.trim() || !prompt.trim()}
              className="flex-1 py-3.5 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-850 disabled:text-zinc-650 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-lg shadow-white/5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                  <span>Drafting Cinematic Script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Generate Cinematic Script</span>
                </>
              )}
            </button>
            {activeScene && (
              <button
                type="button"
                onClick={saveMetadataOnly}
                disabled={isGenerating}
                className="px-6 py-3.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-xl font-semibold transition-all text-sm cursor-pointer"
              >
                Save Details Only
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Cinematic Screenplay Output Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
        <div className="p-6 border-b border-zinc-850 flex items-center gap-2 shrink-0">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm uppercase font-mono tracking-widest text-zinc-300 font-bold">
            Cinematic Screenplay Output
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin space-y-6">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-zinc-400">Rendering alternate universe sequence...</p>
              <p className="text-xs text-zinc-550 mt-1 max-w-[240px]">
                The EchoVerse engine is compiling character profiles, relationship dynamics, and memories.
              </p>
            </div>
          ) : generatedText ? (
            <div className="space-y-8">
              <div className="text-zinc-200 text-base leading-8 whitespace-pre-wrap font-serif bg-zinc-950/45 p-6 rounded-2xl shadow-inner border border-zinc-850 select-text selection:bg-purple-500/20">
                {generatedText}
              </div>

              {/* Decision Point Navigation */}
              {activeScene && activeScene.decision && activeScene.decision.question && (
                <div className="bg-gradient-to-r from-zinc-950/60 to-zinc-900/35 border border-zinc-850 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold border-b border-zinc-850 pb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Interactive Decision Point
                  </h4>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-white tracking-wide">
                      {activeScene.decision.question}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {activeScene.decision.choices.map((choice, idx) => {
                        const childScene = scenes.find(
                          (s) => s.parent_id === activeScene.id && s.branch_id === choice
                        );
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (childScene) {
                                onSelectScene(childScene);
                              } else {
                                if (
                                  confirm(
                                    `No scene exists for the choice "${choice}". Would you like to branch a new reality from here?`
                                  )
                                ) {
                                  onSelectScene(null);
                                  setParentId(activeScene.id);
                                  setBranchId(choice);
                                  setTitle(`${choice} Reality`);
                                  setPrompt(`Based on choice: ${choice}... `);
                                }
                              }
                            }}
                            className={`px-4.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-350 cursor-pointer border flex items-center gap-2 active:scale-[0.98] ${
                              childScene
                                ? "bg-purple-500/10 border-purple-500/35 text-purple-400 hover:bg-purple-650 hover:text-white hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/15"
                                : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                            }`}
                          >
                            <span>{choice}</span>
                            <span className="opacity-60 text-[10px]">
                              {childScene ? "➔" : "+"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Characters' Hidden Thoughts (Internal Subtext) */}
              {activeScene && activeScene.hidden_thoughts && Object.keys(activeScene.hidden_thoughts).length > 0 && (
                <div className="bg-gradient-to-br from-purple-950/20 via-zinc-900/30 to-zinc-950/40 border border-purple-500/10 p-6 rounded-3xl space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-1 flex items-center gap-1.5 border-b border-zinc-850/80 pb-2.5">
                    <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                    Hidden Thoughts Engine & Character Subtext
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(activeScene.hidden_thoughts).map(([charName, thoughts]) => (
                      <div key={charName} className="p-4 rounded-2xl bg-zinc-950/30 border border-zinc-850/50 space-y-3 hover:border-purple-500/20 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-[10px] text-purple-400">
                              {charName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-zinc-200 font-mono uppercase tracking-wider">{charName}</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Internal Mind</span>
                        </div>
                        
                        <div className="space-y-2.5 text-xs">
                          <div className="bg-zinc-950/45 p-3 rounded-xl border border-zinc-900 shadow-inner">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400/70 block mb-1">Hidden Thoughts (Subtext)</span>
                            <span className="italic text-zinc-300 font-serif leading-relaxed">
                              "{thoughts.hidden_thoughts}"
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-zinc-900/10 border border-zinc-850/40 p-2 rounded-lg">
                              <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Motivation</span>
                              <span className="text-zinc-400 font-medium leading-tight block">{thoughts.motivation}</span>
                            </div>
                            {thoughts.secret_feeling && (
                              <div className="bg-zinc-900/10 border border-zinc-850/40 p-2 rounded-lg">
                                <span className="text-[8px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Secret Feeling</span>
                                <span className="text-zinc-400 font-medium leading-tight block">{thoughts.secret_feeling}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cinematic Director Notes */}
              {activeScene && activeScene.direction && (
                <div className="bg-zinc-950/45 border border-zinc-850 p-5 rounded-2xl space-y-3.5 shadow-md">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5 border-b border-zinc-850 pb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Cinematic Director Notes
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Camera Framing</span>
                      <span className="font-semibold text-zinc-300 capitalize">{activeScene.direction.camera || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Lighting Setup</span>
                      <span className="font-semibold text-zinc-300 capitalize">{activeScene.direction.lighting || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Weather & Atmosphere</span>
                      <span className="font-semibold text-zinc-300 capitalize">{activeScene.direction.weather || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Emotional Mood</span>
                      <span className="font-semibold text-zinc-300 capitalize">{activeScene.direction.mood || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Color Palette</span>
                      <span className="font-semibold text-zinc-300 capitalize">{activeScene.direction.color_palette || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block mb-0.5">Scene Intensity</span>
                      <span className="font-bold text-purple-400 font-mono">{activeScene.direction.scene_intensity ?? 50}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Emotional Shifts */}
              {activeScene && activeScene.emotion_deltas && Object.keys(activeScene.emotion_deltas).length > 0 && (
                <div className="bg-zinc-950/45 border border-zinc-850 p-5 rounded-2xl space-y-4">
                  <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold mb-1 flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                    <Heart className="w-3.5 h-3.5 text-purple-400" />
                    Updated Relationship Dynamics
                  </h4>
                  
                  <div className="space-y-4">
                    {Object.entries(activeScene.emotion_deltas).map(([pairKey, pairDeltas]) => {
                      const isDirectional = pairKey.includes("->");
                      
                      if (isDirectional) {
                        const [fromName, toName] = pairKey.split("->");
                        return (
                          <div key={pairKey} className="space-y-2 bg-zinc-900/30 border border-zinc-850/50 p-4 rounded-xl">
                            <h5 className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 border-b border-zinc-850/50 pb-1.5 uppercase font-mono tracking-wider">
                              <span className="text-purple-400">{fromName}</span>
                              <span className="text-zinc-550">➔</span>
                              <span className="text-purple-300">{toName}</span>
                            </h5>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(pairDeltas).map(([emotion, data]) => {
                                const isOldVal = typeof data === 'number';
                                const delta = isOldVal ? data : data.delta;
                                const previous = isOldVal ? null : data.previous;
                                const newVal = isOldVal ? null : data.new;
                                
                                const isPositive = delta > 0;
                                const isNegative = delta < 0;
                                const noChange = delta === 0;

                                return (
                                  <div key={emotion} className="flex items-center justify-between px-3 py-1.5 bg-zinc-950/40 border border-zinc-850/30 rounded-lg">
                                    <span className="text-xs font-semibold text-zinc-400 capitalize">
                                      {emotion}
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                      {!isOldVal && (
                                        <span className="text-[11px] text-zinc-500 font-mono">
                                          {previous}% &rarr; <span className="text-zinc-300 font-bold">{newVal}%</span>
                                        </span>
                                      )}
                                      {!noChange && (
                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                          {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                                          {isPositive ? '+' : ''}{delta}%
                                        </div>
                                      )}
                                      {noChange && (
                                        <div className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-850 text-zinc-500">
                                          0%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      } else {
                        // Fallback/Legacy flat list rendering
                        const isOldFormat = typeof pairDeltas === 'number';
                        const delta = isOldFormat ? pairDeltas : pairDeltas.delta;
                        const previous = isOldFormat ? null : pairDeltas.previous;
                        const newVal = isOldFormat ? null : pairDeltas.new;
                        
                        const isPositive = delta > 0;
                        const isNegative = delta < 0;
                        const noChange = delta === 0;

                        return (
                          <div key={pairKey} className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                            <span className="text-sm font-semibold text-zinc-300 capitalize flex items-center gap-2">
                               {pairKey}
                            </span>
                            <div className="flex items-center gap-3">
                               {!isOldFormat && (
                                 <span className="text-xs text-zinc-500 font-mono">{previous}% &rarr; <span className="text-zinc-300 font-bold">{newVal}%</span></span>
                               )}
                               {!noChange && (
                                 <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                   {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                   {isPositive ? '+' : ''}{delta}%
                                 </div>
                               )}
                               {noChange && (
                                 <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-500">
                                   No Change
                                 </div>
                               )}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}              {/* Generated Widescreen Scene Frames / Storyboard */}
              <div className="space-y-3.5 pt-4">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-550 font-bold">
                  Generated Scene Frames (Storyboards)
                </h4>
                {activeScene && (activeScene.images && activeScene.images.length > 0) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeScene.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveFrameIndex(idx)}
                        className="aspect-video bg-zinc-950/60 border border-zinc-850 rounded-2xl relative overflow-hidden group shadow-lg cursor-pointer hover:border-purple-500/30 transition-all"
                      >
                        <img 
                          src={`http://127.0.0.1:8000/generated_images/${img}`}
                          alt={`Generated cinematic scene frame ${idx + 1}`}
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-75 pointer-events-none" />
                        <span className="absolute bottom-3 left-4 text-[9px] font-mono uppercase tracking-wider text-zinc-350 font-bold">
                          Frame 0{idx + 1}: Storyboard Frame
                        </span>
                      </div>
                    ))}
                  </div>
                ) : activeScene && activeScene.image ? (
                  <div 
                    onClick={() => setActiveFrameIndex(0)}
                    className="aspect-video bg-zinc-950/60 border border-zinc-850 rounded-2xl relative overflow-hidden group shadow-lg cursor-pointer hover:border-purple-500/30 transition-all"
                  >
                    <img 
                      src={`http://127.0.0.1:8000/generated_images/${activeScene.image}`}
                      alt="Generated cinematic scene frame"
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-75 pointer-events-none" />
                    <span className="absolute bottom-3 left-4 text-[9px] font-mono uppercase tracking-wider text-zinc-350 font-bold">
                      Frame 01: Generated Cinematic Still
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="aspect-video bg-zinc-950/60 border border-zinc-850 rounded-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      <span className="absolute bottom-3 left-4 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                        Frame 01: Establishing Shot
                      </span>
                    </div>
                    <div className="aspect-video bg-zinc-950/60 border border-zinc-850 rounded-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      <span className="absolute bottom-3 left-4 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                        Frame 02: Character Focus
                      </span>
                    </div>
                    <div className="aspect-video bg-zinc-950/60 border border-zinc-850 rounded-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      <span className="absolute bottom-3 left-4 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                        Frame 03: Detail Frame
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-850 rounded-3xl">
              <AlertCircle className="w-8 h-8 text-zinc-700 mb-3" />
              <p className="text-sm font-semibold text-zinc-500">Scene script empty</p>
              <p className="text-xs text-zinc-650 mt-1 max-w-[240px]">
                Fill out the left form and click generate to trigger uvicorn completions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Zoomed Storyboard Carousel Modal Overlay */}
      {activeFrameIndex !== null && activeScene && (activeScene.images || activeScene.image) && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-fade-in">
          {/* Close Button */}
          <button
            onClick={() => setActiveFrameIndex(null)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Previous Button (Carousel) */}
          <button
            onClick={() => {
              const maxIdx = activeScene.images ? activeScene.images.length - 1 : 0;
              setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : maxIdx));
            }}
            className="absolute left-6 p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-450 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Zoomed Image Container */}
          <div className="max-w-5xl w-full aspect-video rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-950 flex items-center justify-center animate-scale-in">
            <img
              src={`http://127.0.0.1:8000/generated_images/${
                activeScene.images && activeScene.images.length > 0 
                  ? activeScene.images[activeFrameIndex] 
                  : activeScene.image
              }`}
              alt={`Zoomed storyboard frame ${activeFrameIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Slide Details Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-8 flex flex-col justify-end pt-24">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-1">
                Scene Storyboard Viewer
              </span>
              <h4 className="text-lg font-bold text-white">
                Frame 0{activeFrameIndex + 1}: {
                  activeFrameIndex === 0 ? "Wide Establishing Shot" : 
                  activeFrameIndex === 1 ? "Medium Interaction Shot" : 
                  "Close-Up Reaction & Detail Shot"
                }
              </h4>
              <p className="text-xs text-zinc-450 mt-1 max-w-3xl leading-relaxed">
                {activeScene.prompt}
              </p>
            </div>
          </div>

          {/* Next Button (Carousel) */}
          <button
            onClick={() => {
              const maxIdx = activeScene.images ? activeScene.images.length - 1 : 0;
              setActiveFrameIndex((prev) => (prev < maxIdx ? prev + 1 : 0));
            }}
            className="absolute right-6 p-3 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-450 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bullet Indicators */}
          {activeScene.images && activeScene.images.length > 1 && (
            <div className="absolute bottom-8 flex gap-2">
              {activeScene.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFrameIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    activeFrameIndex === idx ? "bg-purple-500 w-6" : "bg-zinc-700 hover:bg-zinc-550"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
