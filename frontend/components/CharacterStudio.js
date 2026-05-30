"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useStore } from "../store/useStore";
import { useToast } from "./ToastProvider";
import CharacterCard from "./CharacterCard";
import CharacterTraits from "./CharacterTraits";
import RelationshipPanel from "./RelationshipPanel";
import EmotionPanel from "./EmotionPanel";
import { User, Plus, X, ArrowLeft, Loader2, Sparkles, Brain, Network, Compass, Layers, TrendingUp, UploadCloud } from "lucide-react";
import API from "../lib/api";

const Character3DViewer = dynamic(() => import("./Character3DViewer"), { ssr: false });

// Helper to map visual features to 3D mesh colors
const mapDescriptionToColors = (features) => {
  const result = {};
  
  const hair = (features.hair || "").toLowerCase();
  if (hair.includes("black")) result.hairColor = "#0c0c0c";
  else if (hair.includes("brown") || hair.includes("dark")) result.hairColor = "#4a2c11";
  else if (hair.includes("blonde") || hair.includes("yellow") || hair.includes("fair")) result.hairColor = "#e8c374";
  else if (hair.includes("red") || hair.includes("auburn")) result.hairColor = "#a53d1d";
  else if (hair.includes("grey") || hair.includes("gray") || hair.includes("silver")) result.hairColor = "#9e9e9e";
  else if (hair.includes("white")) result.hairColor = "#f5f5f5";
  
  const skin = (features.skinTone || "").toLowerCase();
  if (skin.includes("fair") || skin.includes("light") || skin.includes("pale")) result.skinColor = "#ffd1b3";
  else if (skin.includes("olive") || skin.includes("tanned") || skin.includes("medium")) result.skinColor = "#d1a384";
  else if (skin.includes("dark") || skin.includes("black") || skin.includes("brown")) result.skinColor = "#5c4033";
  
  const eyes = (features.eyes || "").toLowerCase();
  if (eyes.includes("blue")) result.eyeColor = "#4b9cd3";
  else if (eyes.includes("green")) result.eyeColor = "#2e8b57";
  else if (eyes.includes("brown") || eyes.includes("dark")) result.eyeColor = "#5c4033";
  else if (eyes.includes("hazel")) result.eyeColor = "#8e7618";
  else if (eyes.includes("grey") || eyes.includes("gray")) result.eyeColor = "#708090";

  const clothing = (features.clothing || "").toLowerCase();
  if (clothing.includes("black") || clothing.includes("dark")) result.clothingColor = "#18181b";
  else if (clothing.includes("white") || clothing.includes("light")) result.clothingColor = "#f4f4f5";
  else if (clothing.includes("red")) result.clothingColor = "#ef4444";
  else if (clothing.includes("blue")) result.clothingColor = "#3b82f6";
  else if (clothing.includes("green")) result.clothingColor = "#10b981";
  else if (clothing.includes("yellow")) result.clothingColor = "#eab308";
  else if (clothing.includes("purple") || clothing.includes("violet")) result.clothingColor = "#8b5cf6";
  else if (clothing.includes("grey") || clothing.includes("gray")) result.clothingColor = "#71717a";

  return result;
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
      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-555 block font-semibold">{label}</label>
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

export default function CharacterStudio() {
  const { activeProject, characters, createCharacter, updateCharacter, deleteCharacter, scenes, canvasEdges, fetchProjectData } = useStore();
  const { toast, confirmAction } = useToast();

  const [selectedChar, setSelectedChar] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile, psychology, relationships, evolution

  // Form Drawer state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [showProgressPopup, setShowProgressPopup] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("imaginai_3d_in_progress_dismissed");
      if (!dismissed) {
        setShowProgressPopup(true);
      }
    }
  }, []);

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

  // Three.js states
  const [hairColor, setHairColor] = useState("#4a2c11");
  const [skinColor, setSkinColor] = useState("#ffd1b3");
  const [eyeColor, setEyeColor] = useState("#4b9cd3");
  const [clothingColor, setClothingColor] = useState("#7c3aed");
  const [heightScale, setHeightScale] = useState(1.0);
  const [faceShape, setFaceShape] = useState("round");
  const [hairStyle, setHairStyle] = useState("short");
  const [isUploading, setIsUploading] = useState(false);
  
  // Character Arc states
  const [characterArc, setCharacterArc] = useState(null);
  const [loadingArc, setLoadingArc] = useState(false);

  // AI Summary states
  const [aiSummary, setAiSummary] = useState("");
  const [aiEvolution, setAiEvolution] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (selectedChar) {
      // Clear AI data when changing character
      setAiSummary("");
      setAiEvolution([]);
      fetchCharacterArc(selectedChar.name);
    } else {
      setCharacterArc(null);
    }
  }, [selectedChar]);

  useEffect(() => {
    if (selectedChar && activeTab === "characterArc") {
      fetchCharacterArc(selectedChar.name);
    }
  }, [selectedChar, activeTab]);

  const fetchCharacterArc = async (charName) => {
    if (!charName) return;
    setLoadingArc(true);
    try {
      const res = await API.get(`/character-arc?characterName=${encodeURIComponent(charName)}`);
      setCharacterArc(res.data);
    } catch (err) {
      console.error("Error fetching character arc:", err);
      setCharacterArc({
        starting_state: "Emotionally guarded",
        current_state: "Emotionally guarded",
        growth_direction: "Becoming emotionally open",
        current_conflict: "Fear of abandonment",
        arc_stage: "beginning",
        arc_progress: 0,
        history: []
      });
    } finally {
      setLoadingArc(false);
    }
  };

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
      threeDConfig: { hairColor, skinColor, eyeColor, clothingColor, heightScale, faceShape, hairStyle },
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
    setHairColor("#4a2c11");
    setSkinColor("#ffd1b3");
    setEyeColor("#4b9cd3");
    setClothingColor("#7c3aed");
    setHeightScale(1.0);
    setFaceShape("round");
    setHairStyle("short");
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

    const threeD = char.threeDConfig || {};
    setHairColor(threeD.hairColor || "#4a2c11");
    setSkinColor(threeD.skinColor || "#ffd1b3");
    setEyeColor(threeD.eyeColor || "#4b9cd3");
    setClothingColor(threeD.clothingColor || "#7c3aed");
    setHeightScale(threeD.heightScale || 1.0);
    setFaceShape(threeD.faceShape || "round");
    setHairStyle(threeD.hairStyle || "short");

    setShowAddForm(true);
  };

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
        {renderProgressPopup()}
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
          { id: "characterArc", label: "Character Arc", icon: TrendingUp },
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

            {/* 3D Character Model View */}
            <div className="bg-zinc-950/30 border border-zinc-900 p-5 rounded-2xl space-y-4 text-left">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block border-b border-zinc-900 pb-2">
                3D Character Model Clone
              </span>
              <Character3DViewer
                hairColor={selectedChar.threeDConfig?.hairColor || "#4a2c11"}
                skinColor={selectedChar.threeDConfig?.skinColor || "#ffd1b3"}
                eyeColor={selectedChar.threeDConfig?.eyeColor || "#4b9cd3"}
                clothingColor={selectedChar.threeDConfig?.clothingColor || "#7c3aed"}
                heightScale={selectedChar.threeDConfig?.heightScale || 1.0}
                faceShape={selectedChar.threeDConfig?.faceShape || "round"}
                hairStyle={selectedChar.threeDConfig?.hairStyle || "short"}
                onChangeConfig={async (config) => {
                  const updatedThreeD = {
                    ...(selectedChar.threeDConfig || {}),
                    ...config
                  };
                  const updatedChar = {
                    ...selectedChar,
                    threeDConfig: updatedThreeD
                  };
                  setSelectedChar(updatedChar);
                  await updateCharacter(activeProject.id, selectedChar.id, {
                    threeDConfig: updatedThreeD
                  });
                }}
              />
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

        {activeTab === "characterArc" && (
          <div className="space-y-6 animate-fade-in text-left">
            {loadingArc && !characterArc ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="text-xs font-mono text-zinc-500">Loading character growth arc...</span>
              </div>
            ) : characterArc ? (
              <>
                {/* Arc Status Panel */}
                <div className="bg-zinc-950/30 border border-zinc-900 p-6 rounded-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <TrendingUp className="w-24 h-24 text-white" />
                  </div>
                  
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block">
                        Growth Journey
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">
                        Current Arc: {characterArc.growth_direction || "Evolving"}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-450 border border-purple-500/25 text-xs font-bold capitalize font-mono">
                      Stage: {characterArc.arc_stage || "Beginning"}
                    </span>
                  </div>

                  {/* Visualizer */}
                  {(() => {
                    const progress = characterArc.arc_progress ?? 0;
                    const totalBlocks = 18;
                    const filledBlocks = Math.round((progress / 100) * totalBlocks);
                    const emptyBlocks = totalBlocks - filledBlocks;
                    const blockStr = "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
                    return (
                      <div className="space-y-2.5 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                        <div className="flex items-center justify-between text-xs font-mono font-semibold text-zinc-400">
                          <span>Arc Progression Visualizer</span>
                          <span className="text-purple-455 font-bold">{progress}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-purple-500 tracking-tight text-sm select-none">{blockStr}</span>
                          <div className="flex-1 h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-[1px]">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500 shadow-md shadow-purple-500/20"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Info Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block">Starting State</span>
                      <span className="text-sm font-semibold text-zinc-200">{characterArc.starting_state || "Not set"}</span>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block">Growth Direction</span>
                      <span className="text-sm font-semibold text-zinc-200">{characterArc.growth_direction || "Not set"}</span>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl space-y-1.5">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 block">Current Conflict</span>
                      <span className="text-sm font-semibold text-zinc-200">{characterArc.current_conflict || "Not set"}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-zinc-950/30 border border-zinc-900 p-6 rounded-2xl space-y-6">
                  <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
                    <h3 className="text-sm font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Character Evolution Timeline
                    </h3>
                    {loadingArc && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                  </div>

                  {characterArc.history && characterArc.history.length > 0 ? (
                    <div className="relative pl-6 border-l border-zinc-850 space-y-6 ml-3 mt-4">
                      {characterArc.history.map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[30.5px] top-1.5 w-2 h-2 rounded-full bg-purple-500 border border-purple-300 ring-4 ring-purple-500/10 shadow-lg shadow-purple-500/30" />
                          <div className="space-y-1 text-left">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-[10px] font-mono font-bold text-purple-450 uppercase tracking-wider bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/15">
                                Scene {step.scene}
                              </span>
                              <span className="text-zinc-500 text-xs font-semibold">·</span>
                              <span className="text-xs font-bold text-white">{step.title}</span>
                              <span className="text-zinc-500 text-xs font-semibold">·</span>
                              <span className="text-xs font-bold text-purple-400 font-mono">{step.progress}% Progress</span>
                            </div>
                            <p className="text-sm text-zinc-300 font-semibold mt-1">
                              {step.state}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-zinc-500 font-mono italic">
                        No scene progression recorded yet. Generate scenes involving {selectedChar.name} to update the character development arc.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-zinc-500 font-mono italic">No Character Arc data available.</p>
              </div>
            )}
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
      {renderProgressPopup()}
    </div>
  );

  // Helper render for progress popup
  function renderProgressPopup() {
    if (!showProgressPopup) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in select-none">
        <div className="bg-zinc-950 border border-zinc-850 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl shadow-purple-500/10">
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">3D Rendering Progress</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              3D cloning and customizer meshes are currently still in progress. Standard features are active, and more assets will load dynamically.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                localStorage.setItem("imaginai_3d_in_progress_dismissed", "true");
                setShowProgressPopup(false);
              }}
              className="w-full py-2.5 bg-purple-650 hover:bg-purple-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
            >
              Mark as Read
            </button>
            <button
              onClick={() => setShowProgressPopup(false)}
              className="w-full py-2 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              Remind Me Later
            </button>
          </div>
        </div>
      </div>
    );
  }

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

            {/* 3-Panel Side-by-Side Character Preview Workspace */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5 flex items-center justify-between">
                <span>Character Cloning Workspace</span>
                <span className="text-[10px] text-zinc-500 font-normal normal-case">Reference image analysis & procedural generator</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-4">
                
                {/* Panel 1: Reference Photo */}
                <div className="flex flex-col bg-zinc-900/40 border border-zinc-850 rounded-xl p-4 items-center justify-center min-h-[220px]">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 mb-3 tracking-wider block font-bold border-b border-zinc-900 w-full text-center pb-1">1. Reference Image</span>
                  <div className="w-24 h-24 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-inner">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar reference" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-750" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <label className="px-3 py-1.5 bg-purple-650 hover:bg-purple-650/80 text-white rounded-lg text-[10px] font-semibold cursor-pointer transition-all inline-flex items-center gap-1">
                      <UploadCloud className="w-3.5 h-3.5" />
                      {avatarUrl ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          const formData = new FormData();
                          formData.append("file", file);
                          try {
                            const res = await API.post("/characters/upload-avatar", formData, {
                              headers: { "Content-Type": "multipart/form-data" }
                            });
                            const { url, features } = res.data;
                            setAvatarUrl(url);
                            if (features) {
                              if (features.age) setAge(features.age.toString());
                              if (features.gender) setGender(features.gender);
                              if (features.hair) setHair(features.hair);
                              if (features.eyes) setEyes(features.eyes);
                              if (features.skinTone) setSkinTone(features.skinTone);
                              if (features.clothing) setClothing(features.clothing);
                              if (features.faceShape) setFaceShape(features.faceShape.toLowerCase());

                              const hairLower = (features.hair || "").toLowerCase();
                              if (hairLower.includes("long")) setHairStyle("long");
                              else if (hairLower.includes("curly") || hairLower.includes("wavy") || hairLower.includes("afro")) setHairStyle("curly");
                              else if (hairLower.includes("bald") || hairLower.includes("shaved")) setHairStyle("bald");
                              else setHairStyle("short");
                              
                              const mapped = mapDescriptionToColors(features);
                              if (mapped.hairColor) setHairColor(mapped.hairColor);
                              if (mapped.skinColor) setSkinColor(mapped.skinColor);
                              if (mapped.eyeColor) setEyeColor(mapped.eyeColor);
                              if (mapped.clothingColor) setClothingColor(mapped.clothingColor);
                            }
                            toast({
                              type: "success",
                              title: "Photo analyzed",
                              message: "Physical traits extracted and loaded to 3D Customizer."
                            });
                          } catch (err) {
                            console.error(err);
                            toast({
                              type: "error",
                              title: "Upload failed",
                              message: "Could not upload or analyze photo."
                            });
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl("")}
                        className="px-2 py-1.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-[10px] font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel 2: Extracted Appearance Attributes */}
                <div className="flex flex-col bg-zinc-900/40 border border-zinc-850 rounded-xl p-4 min-h-[220px]">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 mb-3 tracking-wider block font-bold border-b border-zinc-900 text-center pb-1">2. Extracted Attributes</span>
                  <div className="space-y-2 text-[11px] text-left">
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span className="text-zinc-550">Gender</span>
                      <span className="font-semibold text-white capitalize">{gender || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span className="text-zinc-550">Age</span>
                      <span className="font-semibold text-white capitalize">{age || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span className="text-zinc-550">Skin Tone</span>
                      <span className="font-semibold text-white capitalize truncate max-w-[80px]">{skinTone || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span className="text-zinc-550">Face Shape</span>
                      <span className="font-semibold text-purple-400 capitalize">{faceShape || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900/60 pb-1">
                      <span className="text-zinc-550">Hair Style</span>
                      <span className="font-semibold text-white capitalize">{hairStyle || "—"}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-zinc-550">Eye Color</span>
                      <span className="font-semibold text-white capitalize truncate max-w-[80px]">{eyes || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Panel 3: Generated Procedural Avatar preview */}
                <div className="flex flex-col bg-zinc-900/40 border border-zinc-850 rounded-xl p-4 min-h-[220px]">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 mb-2 tracking-wider block font-bold border-b border-zinc-900 text-center pb-1">3. Generated Clone</span>
                  <div className="flex-1">
                    <Character3DViewer
                      hairColor={hairColor}
                      skinColor={skinColor}
                      eyeColor={eyeColor}
                      clothingColor={clothingColor}
                      heightScale={heightScale}
                      faceShape={faceShape}
                      hairStyle={hairStyle}
                      compact={true}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Avatar Appearance Fine-Tuning */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5">
                Appearance Fine-Tuning
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-850">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-zinc-500 block">Height: {Math.round(heightScale * 100)}%</label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.01"
                    value={heightScale}
                    onChange={(e) => setHeightScale(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Face Shape</label>
                  <select
                    value={faceShape}
                    onChange={(e) => setFaceShape(e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-950 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-lg text-xs"
                  >
                    <option value="round">Round</option>
                    <option value="oval">Oval</option>
                    <option value="square">Square</option>
                    <option value="heart">Heart</option>
                    <option value="chiseled">Chiseled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-1">Hair Style</label>
                  <select
                    value={hairStyle}
                    onChange={(e) => setHairStyle(e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-950 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-lg text-xs"
                  >
                    <option value="short">Short</option>
                    <option value="long">Long</option>
                    <option value="curly">Curly</option>
                    <option value="bald">Bald</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-0.5">Skin</label>
                    <input
                      type="color"
                      value={skinColor}
                      onChange={(e) => setSkinColor(e.target.value)}
                      className="w-7 h-7 rounded border border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent block"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[9px] font-mono uppercase text-zinc-500 block mb-0.5">Hair</label>
                    <input
                      type="color"
                      value={hairColor}
                      onChange={(e) => setHairColor(e.target.value)}
                      className="w-7 h-7 rounded border border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent block"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance Details */}
            <div className="space-y-4 text-left">
              <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5">Appearance Text Descriptors</h4>
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
