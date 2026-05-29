"use client";

import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useToast } from "./ToastProvider";
import CharacterCard from "./CharacterCard";
import CharacterTraits from "./CharacterTraits";
import RelationshipPanel from "./RelationshipPanel";
import EmotionPanel from "./EmotionPanel";
import { User, Plus, X, ArrowLeft, Loader2, Sparkles, Brain, Network, Compass, Layers } from "lucide-react";
import API from "../lib/api";

export default function CharacterStudio() {
  const { activeProject, characters, createCharacter, updateCharacter, deleteCharacter, scenes, canvasEdges, fetchProjectData } = useStore();
  const { toast, confirmAction } = useToast();

  const [selectedChar, setSelectedChar] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, psychology, relationships, evolution

  // Form Drawer state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChar, setEditingChar] = useState(null);

  // Form input states
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [hair, setHair] = useState("");
  const [eyes, setEyes] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [clothing, setClothing] = useState("");
  const [coreTraits, setCoreTraits] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [flaws, setFlaws] = useState([]);
  const [fears, setFears] = useState([]);
  const [goals, setGoals] = useState([]);
  const [values, setValues] = useState([]);
  const [attachmentStyle, setAttachmentStyle] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // AI Summary states
  const [aiSummary, setAiSummary] = useState("");
  const [aiEvolution, setAiEvolution] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (selectedChar) {
      // Clear AI data when changing character
      setAiSummary("");
      setAiEvolution([]);
    }
  }, [selectedChar]);

  const loadAiSummary = async (charId) => {
    setLoadingSummary(true);
    try {
      const res = await API.post("/character-summary", { characterId: charId });
      setAiSummary(res.data.summary);
      setAiEvolution(res.data.evolution || []);
      toast({
        type: "success",
        title: "Summary generated",
        message: "Character profile refreshed with AI insights."
      });
    } catch (err) {
      console.error(err);
      toast({
        type: "error",
        title: "Generation failed",
        message: "Could not generate character summary."
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const charData = {
      name: name.trim(),
      age,
      gender,
      appearance: { height, hair, eyes, skinTone, clothing },
      core_traits: coreTraits,
      strengths,
      flaws,
      fears,
      goals,
      values,
      attachment_style: attachmentStyle,
      communication_style: communicationStyle,
      voice_style: voiceStyle,
      relationship_type: relationshipType,
      avatarUrl: finalAvatar
    };

    if (editingChar) {
      await updateCharacter(activeProject.id, editingChar.id, charData);
      toast({
        type: "success",
        title: "Character updated",
        message: `${charData.name} profile successfully updated.`
      });
    } else {
      await createCharacter(charData);
      toast({
        type: "success",
        title: "Character created",
        message: `${charData.name} added to story universe.`
      });
    }
    setShowAddForm(false);
    setEditingChar(null);
    if (selectedChar && editingChar?.id === selectedChar.id) {
      // Refresh selected character view
      const updated = characters.find(c => c.id === selectedChar.id);
      if (updated) setSelectedChar(updated);
    }
  };

  const openAddMode = () => {
    setEditingChar(null);
    setName("");
    setAge("");
    setGender("");
    setHeight("");
    setHair("");
    setEyes("");
    setSkinTone("");
    setClothing("");
    setCoreTraits([]);
    setStrengths([]);
    setFlaws([]);
    setFears([]);
    setGoals([]);
    setValues([]);
    setAttachmentStyle("");
    setCommunicationStyle("");
    setVoiceStyle("");
    setRelationshipType("");
    setAvatarUrl("");
    setShowAddForm(true);
  };

  const openEditMode = (char) => {
    setEditingChar(char);
    setName(char.name || "");
    setAge(char.age || "");
    setGender(char.gender || "");
    const app = char.appearance || {};
    setHeight(app.height || "");
    setHair(app.hair || "");
    setEyes(app.eyes || "");
    setSkinTone(app.skinTone || "");
    setClothing(app.clothing || "");
    setCoreTraits(char.core_traits || []);
    setStrengths(char.strengths || []);
    setFlaws(char.flaws || []);
    setFears(char.fears || []);
    setGoals(char.goals || []);
    setValues(char.values || []);
    setAttachmentStyle(char.attachment_style || "");
    setCommunicationStyle(char.communication_style || "");
    setVoiceStyle(char.voice_style || "");
    setRelationshipType(char.relationship_type || "");
    setAvatarUrl(char.avatarUrl || "");
    setShowAddForm(true);
  };

  // Tag Input Component
  function FormTagInput({ label, tags, setTags, placeholder }) {
    const [inputVal, setInputVal] = useState("");
    const addTag = () => {
      const trimmed = inputVal.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setInputVal("");
    };
    return (
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-semibold">{label}</label>
        <div className="flex flex-wrap gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl min-h-[42px]">
          {tags.map((tag, idx) => (
            <span key={idx} className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/25">
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="text-purple-400 hover:text-purple-250 cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            onBlur={addTag}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 bg-transparent text-white text-xs outline-none border-none py-0.5 min-w-[60px]"
          />
        </div>
      </div>
    );
  }

  // Render List View of all characters
  if (!selectedChar) {
    return (
      <div className="flex-1 overflow-y-auto p-8 space-y-8 flex flex-col h-full bg-zinc-950/20 select-none">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Library</span>
            <h2 className="text-2xl font-extrabold text-white mt-1">Character Studio</h2>
          </div>
          <button
            onClick={openAddMode}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Character
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-1 pb-6">
          {characters.map((char) => {
            const scenesCount = scenes.filter(s => s.characterIds?.includes(char.id)).length;
            const relationshipsCount = canvasEdges.filter(e => e.source === char.id || e.target === char.id).length;
            return (
              <CharacterCard
                key={char.id}
                character={char}
                scenesCount={scenesCount}
                relationshipsCount={relationshipsCount}
                onClick={() => setSelectedChar(char)}
              />
            );
          })}
        </div>

        {/* Add/Edit Drawer */}
        {showAddForm && renderFormDrawer()}
      </div>
    );
  }

  // Dynamic values for selected character
  const selectedScenesCount = scenes.filter(s => s.characterIds?.includes(selectedChar.id)).length;
  const selectedRelationshipsCount = canvasEdges.filter(e => e.source === selectedChar.id || e.target === selectedChar.id).length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col h-full bg-zinc-950/10">
      {/* Detail Header */}
      <div className="px-8 py-5 border-b border-zinc-900 bg-zinc-950/40 flex items-center justify-between shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedChar(null)}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
              {selectedChar.avatarUrl ? (
                <img src={selectedChar.avatarUrl} alt={selectedChar.name} className="w-full h-full object-contain" />
              ) : (
                <User className="w-5 h-5 text-zinc-650" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">{selectedChar.name}</h2>
              <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                {selectedScenesCount} scenes · {selectedRelationshipsCount} relationships
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openEditMode(selectedChar)}
            className="px-3.5 py-2 bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="px-8 bg-zinc-950/40 border-b border-zinc-900 flex gap-6 shrink-0 relative z-10 select-none">
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "psychology", label: "Psychology", icon: Brain },
          { id: "relationships", label: "Relationships", icon: Network },
          { id: "evolution", label: "Evolution", icon: Compass }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 px-1 border-b-2 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-zinc-450 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto select-text scrollbar-thin">
        {activeTab === "profile" && (
          <div className="space-y-8 animate-fade-in text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-950/30 border border-zinc-900 p-5 rounded-2xl space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block border-b border-zinc-900 pb-2">
                  Identity Metrics
                </span>
                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Name</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Age</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.age || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Gender</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.gender || "Unknown"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950/30 border border-zinc-900 p-5 rounded-2xl space-y-4 md:col-span-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block border-b border-zinc-900 pb-2">
                  Physical Appearance
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Height</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.appearance?.height || "Not defined"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Hairstyle</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.appearance?.hair || "Not defined"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Eye Color</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.appearance?.eyes || "Not defined"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Skin Tone</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.appearance?.skinTone || "Not defined"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">Clothing Style</span>
                    <span className="text-sm font-semibold text-white">{selectedChar.appearance?.clothing || "Not defined"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-950/30 border border-zinc-900 p-5 rounded-2xl space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block border-b border-zinc-900 pb-2">
                  Vocal Signature
                </span>
                <span className="text-sm font-medium text-white">{selectedChar.voice_style || "No vocal signature defined."}</span>
              </div>
              <div className="bg-zinc-950/30 border border-zinc-900 p-5 rounded-2xl space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block border-b border-zinc-900 pb-2">
                  Communication Style
                </span>
                <span className="text-sm font-medium text-white">{selectedChar.communication_style || "No specific style defined."}</span>
              </div>
            </div>

            <EmotionPanel character={selectedChar} scenes={scenes} />
          </div>
        )}

        {activeTab === "psychology" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-zinc-950/30 border border-zinc-900 p-6 rounded-2xl space-y-6">
              <CharacterTraits title="Core Traits" items={selectedChar.core_traits} variant="purple" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CharacterTraits title="Strengths" items={selectedChar.strengths} variant="emerald" />
                <CharacterTraits title="Flaws" items={selectedChar.flaws} variant="red" />
                <CharacterTraits title="Fears" items={selectedChar.fears} variant="pink" />
                <CharacterTraits title="Goals" items={selectedChar.goals} variant="blue" />
              </div>
              <CharacterTraits title="Values" items={selectedChar.values} variant="amber" />
            </div>

            <div className="bg-zinc-950/30 border border-zinc-900 p-6 rounded-2xl text-left space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">
                Attachment Style
              </span>
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold font-mono">
                  {selectedChar.attachment_style || "Not Specified"}
                </span>
                <p className="text-xs text-zinc-450 font-medium leading-relaxed">
                  Influences emotional security, boundaries, and relationship dynamics under stress.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "relationships" && (
          <div className="animate-fade-in text-left">
            <RelationshipPanel
              character={selectedChar}
              characters={characters}
              canvasEdges={canvasEdges}
            />
          </div>
        )}

        {activeTab === "evolution" && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-zinc-950/30 border border-zinc-900 p-6 rounded-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Sparkles className="w-24 h-24 text-white" />
              </div>
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-sm font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  AI Character Summary
                </h3>
                <button
                  onClick={() => loadAiSummary(selectedChar.id)}
                  disabled={loadingSummary}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-purple-500/15"
                >
                  {loadingSummary ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {aiSummary ? "Re-generate" : "Generate Summary"}
                </button>
              </div>

              {aiSummary ? (
                <p className="text-sm text-zinc-300 leading-relaxed font-semibold italic">
                  {aiSummary}
                </p>
              ) : (
                <p className="text-xs text-zinc-500 font-mono italic">
                  Click 'Generate Summary' to retrieve AI-powered insights about {selectedChar.name}'s current status, goals, and role in this universe.
                </p>
              )}
            </div>

            {/* Evolution Timeline */}
            <div className="bg-zinc-950/30 border border-zinc-900 p-6 rounded-2xl space-y-6">
              <h3 className="text-sm font-mono uppercase tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Evolution Timeline
              </h3>

              {aiEvolution.length > 0 ? (
                <div className="relative pl-6 border-l border-zinc-800 space-y-6 ml-2">
                  {aiEvolution.map((point, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-300 shadow-md shadow-purple-500/30" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-purple-450 uppercase">
                            Scene {point.sceneNumber}
                          </span>
                          <span className="text-zinc-500 text-xs font-semibold">·</span>
                          <span className="text-xs font-semibold text-white">{point.title || "Untitled Scene"}</span>
                        </div>
                        <p className="text-sm text-zinc-300 font-bold mt-1 font-sans">
                          {point.state}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-zinc-500 font-mono italic">
                    {loadingSummary ? "Analyzing story beats..." : "No timeline data loaded. Generate summary to run the narrative engine."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Drawer */}
      {showAddForm && renderFormDrawer()}
    </div>
  );

  // Drawer Form helper
  function renderFormDrawer() {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex justify-end z-50 animate-fade-in select-text">
        <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-850 h-full flex flex-col p-8 overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-5 shrink-0">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Configuration</span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {editingChar ? `Edit ${editingChar.name}` : "New Character Profile"}
              </h3>
            </div>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingChar(null);
              }}
              className="p-1.5 hover:bg-zinc-900 text-zinc-550 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateOrUpdate} className="flex-1 overflow-y-auto pr-1 py-6 space-y-8 scrollbar-thin">
            {/* Identity */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5 text-left">
                Identity
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aisha Mitchell"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Age</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Gender</label>
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="e.g. Female"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5">Appearance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Height</label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 5ft 6in"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Skin Tone</label>
                  <input
                    type="text"
                    value={skinTone}
                    onChange={(e) => setSkinTone(e.target.value)}
                    placeholder="e.g. Olive / Fair"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Hair</label>
                  <input
                    type="text"
                    value={hair}
                    onChange={(e) => setHair(e.target.value)}
                    placeholder="e.g. Curly dark brown"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Eyes</label>
                  <input
                    type="text"
                    value={eyes}
                    onChange={(e) => setEyes(e.target.value)}
                    placeholder="e.g. Amber"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Clothing</label>
                  <input
                    type="text"
                    value={clothing}
                    onChange={(e) => setClothing(e.target.value)}
                    placeholder="e.g. Casual oversized hoodie, denim"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Psychology */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5 text-left">Psychology</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormTagInput label="Core Traits" tags={coreTraits} setTags={setCoreTraits} placeholder="Add trait (press Enter)..." />
                </div>
                <div>
                  <FormTagInput label="Strengths" tags={strengths} setTags={setStrengths} placeholder="Add strength..." />
                </div>
                <div>
                  <FormTagInput label="Flaws" tags={flaws} setTags={setFlaws} placeholder="Add flaw..." />
                </div>
                <div>
                  <FormTagInput label="Fears" tags={fears} setTags={setFears} placeholder="Add fear..." />
                </div>
                <div>
                  <FormTagInput label="Goals" tags={goals} setTags={setGoals} placeholder="Add goal..." />
                </div>
                <div className="col-span-2">
                  <FormTagInput label="Values" tags={values} setTags={setValues} placeholder="Add value..." />
                </div>
                <div className="text-left">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Attachment Style</label>
                  <select
                    value={attachmentStyle}
                    onChange={(e) => setAttachmentStyle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  >
                    <option value="">Select style...</option>
                    <option value="Secure">Secure</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Avoidant">Avoidant</option>
                    <option value="Fearful Avoidant">Fearful Avoidant</option>
                  </select>
                </div>
                <div className="text-left">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Communication Style</label>
                  <input
                    type="text"
                    value={communicationStyle}
                    onChange={(e) => setCommunicationStyle(e.target.value)}
                    placeholder="e.g. indirect and cautious"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Voice & Vocal styles */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5">Voice & Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Voice Style</label>
                  <input
                    type="text"
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value)}
                    placeholder="e.g. calm and soft-spoken"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block mb-1">Avatar Seed / URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="e.g. https://api.dicebear.com/7.x/bottts/svg?seed=Aisha"
                    className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 shrink-0 pt-4">
              <button type="submit" disabled={!name.trim()} className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-650 rounded-xl font-bold transition-all text-sm cursor-pointer flex items-center justify-center">
                Save Profile
              </button>
              {editingChar && (
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await confirmAction({
                      title: `Delete ${editingChar.name}?`,
                      message: "This removes the character from the project database.",
                      confirmText: "Delete",
                      variant: "danger"
                    });
                    if (confirmed) {
                      await deleteCharacter(activeProject.id, editingChar.id);
                      toast({ type: "success", title: "Deleted", message: `${editingChar.name} removed.` });
                      setShowAddForm(false);
                      setEditingChar(null);
                      if (selectedChar?.id === editingChar.id) setSelectedChar(null);
                    }
                  }}
                  className="px-4 py-3 bg-red-950/20 hover:bg-red-900/10 border border-red-900/20 text-red-400 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setEditingChar(null); }}
                className="px-6 py-3 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
