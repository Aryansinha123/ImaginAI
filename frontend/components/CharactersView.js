"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import { User, Plus, X, Heart, MessageCircle, Eye, Star } from "lucide-react";

function TagInput({ label, tags, setTags, placeholder, examples }) {
  const [input, setInput] = useState("");

  const addTag = (text) => {
    const trimmed = text.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-2 p-2 bg-zinc-900 border border-zinc-850 rounded-xl focus-within:border-purple-500/50 min-h-[42px] transition-colors">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/25"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="text-purple-400 hover:text-purple-250 focus:outline-none transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent text-white text-xs outline-none border-none py-0.5"
        />
      </div>
      {examples && (
        <span className="text-[9px] text-zinc-650 block">
          Suggestions: {examples.join(", ")}
        </span>
      )}
    </div>
  );
}

export default function CharactersView() {
  const { activeProject, characters, createCharacter, updateCharacter, deleteCharacter } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChar, setEditingChar] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Appearance
  const [height, setHeight] = useState("");
  const [hair, setHair] = useState("");
  const [eyes, setEyes] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [clothing, setClothing] = useState("");

  // Upgraded fields (lists)
  const [coreTraits, setCoreTraits] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [flaws, setFlaws] = useState([]);
  const [fears, setFears] = useState([]);
  const [goals, setGoals] = useState([]);
  const [values, setValues] = useState([]);

  // Single fields
  const [attachmentStyle, setAttachmentStyle] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("");
  const [relationshipType, setRelationshipType] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");

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
    setHeight(app.height || char.height || "");
    setHair(app.hair || char.hair || "");
    setEyes(app.eyes || char.eyes || "");
    setSkinTone(app.skinTone || char.skinTone || "");
    setClothing(app.clothing || char.clothing || "");

    setCoreTraits(char.core_traits || (char.personality ? char.personality.split(",").map(t => t.trim()).filter(Boolean) : []));
    setStrengths(char.strengths || []);
    setFlaws(char.flaws || []);
    setFears(char.fears || []);
    setGoals(char.goals || []);
    setValues(char.values || []);

    setAttachmentStyle(char.attachment_style || "");
    setCommunicationStyle(char.communication_style || char.speakingStyle || "");
    setVoiceStyle(char.voice_style || char.voice || "");
    setRelationshipType(char.relationship_type || char.relationship || "");
    setAvatarUrl(char.avatarUrl || "");
    setShowAddForm(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result); // Base64 data URL
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;

    const charData = {
      name: name.trim(),
      age,
      gender,
      appearance: {
        height,
        hair,
        eyes,
        skinTone,
        clothing
      },
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
    } else {
      await createCharacter(charData);
    }

    setShowAddForm(false);
    setEditingChar(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 relative flex flex-col h-full select-none">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Library</span>
          <h2 className="text-2xl font-bold text-white mt-1">Characters</h2>
        </div>
        <button
          onClick={openAddMode}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Character
        </button>
      </div>

      {/* Horizontal Cinematic List */}
      <div className="flex-1 overflow-x-auto pb-4 flex items-start gap-6 scrollbar-thin">
        {characters.length === 0 ? (
          <div className="w-full h-80 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-3xl shrink-0">
            <User className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-base font-semibold text-zinc-400">No characters in this universe yet</p>
            <p className="text-xs text-zinc-650 mt-1 max-w-[280px]">
              Add characters defining their appearance, emotional traits, and relationships to bring them to life.
            </p>
          </div>
        ) : (
          characters.map((char) => {
            const gradientId = char.name.length % 3;
            const gradientClass =
              gradientId === 0
                ? "from-purple-500 to-pink-500 shadow-purple-500/10"
                : gradientId === 1
                ? "from-blue-500 to-cyan-500 shadow-blue-500/10"
                : "from-emerald-500 to-teal-500 shadow-emerald-500/10";

            return (
              <div
                key={char.id}
                onClick={() => openEditMode(char)}
                className="w-80 shrink-0 bg-zinc-950/40 border border-zinc-850 p-6 rounded-3xl relative overflow-hidden group hover:border-zinc-700/80 transition-all duration-300 shadow-xl cursor-pointer"
              >
                {/* Glossy Backdrop Ring */}
                <div className="absolute top-[-30px] right-[-30px] w-28 h-28 bg-white/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />

                {/* Portrait Placeholder with Cinematic Glow */}
                <div className="w-24 h-24 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-2 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-10`} />
                  {char.avatarUrl ? (
                    <img
                      src={char.avatarUrl}
                      alt={char.name}
                      className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)] rounded-lg"
                    />
                  ) : (
                    <User className="w-10 h-10 text-zinc-600" />
                  )}
                </div>

                {/* Identity info */}
                <div className="text-center mt-5 space-y-1">
                  <h3 className="font-bold text-white text-lg truncate group-hover:text-purple-400 transition-colors">
                    {char.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {(char.relationship_type || char.relationship) && (
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                        {char.relationship_type || char.relationship}
                      </span>
                    )}
                    {char.age && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-850 font-semibold">
                        {char.age} yrs
                      </span>
                    )}
                    {char.gender && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-850 font-semibold">
                        {char.gender}
                      </span>
                    )}
                  </div>
                </div>

                {/* Character Brain Preview UI */}
                <div className="mt-5 border-t border-zinc-900/80 pt-4 space-y-3 text-left">
                  {char.core_traits && char.core_traits.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block font-bold">Traits:</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {char.core_traits.map((t, idx) => (
                          <span key={idx} className="text-xs text-zinc-300 flex items-center gap-1">
                            <span className="text-purple-400 text-[10px]">✓</span> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {char.strengths && char.strengths.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block font-bold">Strengths:</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {char.strengths.map((t, idx) => (
                          <span key={idx} className="text-xs text-zinc-300 flex items-center gap-1">
                            <span className="text-emerald-400 text-[10px]">✓</span> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {char.flaws && char.flaws.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block font-bold">Flaws:</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {char.flaws.map((t, idx) => (
                          <span key={idx} className="text-xs text-zinc-300 flex items-center gap-1">
                            <span className="text-red-400 text-[10px]">✓</span> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {char.fears && char.fears.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block font-bold">Fear:</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {char.fears.map((t, idx) => (
                          <span key={idx} className="text-xs text-zinc-300 flex items-center gap-1">
                            <span className="text-pink-400 text-[10px]">✓</span> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {char.goals && char.goals.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block font-bold">Goal:</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {char.goals.map((t, idx) => (
                          <span key={idx} className="text-xs text-zinc-300 flex items-center gap-1">
                            <span className="text-blue-400 text-[10px]">✓</span> {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {char.attachment_style && (
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-550 block font-bold">Attachment:</span>
                      <span className="text-xs text-zinc-300 flex items-center gap-1">
                        <span className="text-yellow-500 text-[10px]">✓</span> {char.attachment_style}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-over Character Creation Drawer */}
      {showAddForm && (
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
                className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 py-6 space-y-8 scrollbar-thin">
              {/* Photo Upload Section */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5">
                  Visual Avatar
                </h4>
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <User className="w-8 h-8 text-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload-input"
                    />
                    <label
                      htmlFor="photo-upload-input"
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-semibold cursor-pointer transition-all inline-block"
                    >
                      Choose Image
                    </label>
                    <span className="text-[10px] text-zinc-550 block">
                      Recommended: square PNG/JPG. Image will be saved to your dashboard.
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Identity */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5">
                  Core Identity
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Mitchell"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Age
                    </label>
                    <input
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 27"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Gender
                    </label>
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

              {/* Physical Appearance */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5 text-left">
                  Physical Appearance
                </h4>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Height
                    </label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 5ft 7in"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Skin Tone
                    </label>
                    <input
                      type="text"
                      value={skinTone}
                      onChange={(e) => setSkinTone(e.target.value)}
                      placeholder="e.g. Pale / Olive"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Hairstyle
                    </label>
                    <input
                      type="text"
                      value={hair}
                      onChange={(e) => setHair(e.target.value)}
                      placeholder="e.g. Long messy black hair"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Eye Color
                    </label>
                    <input
                      type="text"
                      value={eyes}
                      onChange={(e) => setEyes(e.target.value)}
                      placeholder="e.g. Deep amber"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Clothing Style
                    </label>
                    <input
                      type="text"
                      value={clothing}
                      onChange={(e) => setClothing(e.target.value)}
                      placeholder="e.g. Cyberpunk trench jacket, dark cargos"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Psychology & Brain */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5 text-left">
                  Psychology & Brain
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <TagInput
                      label="Core Traits"
                      tags={coreTraits}
                      setTags={setCoreTraits}
                      placeholder="Add core traits (press Enter)..."
                      examples={["introverted", "extroverted", "empathetic", "observant", "confident", "reserved"]}
                    />
                  </div>
                  <div>
                    <TagInput
                      label="Strengths"
                      tags={strengths}
                      setTags={setStrengths}
                      placeholder="Add strengths..."
                      examples={["loyal", "patient", "hardworking", "supportive"]}
                    />
                  </div>
                  <div>
                    <TagInput
                      label="Flaws"
                      tags={flaws}
                      setTags={setFlaws}
                      placeholder="Add flaws..."
                      examples={["stubborn", "overthinks", "jealous", "avoids conflict"]}
                    />
                  </div>
                  <div>
                    <TagInput
                      label="Fears"
                      tags={fears}
                      setTags={setFears}
                      placeholder="Add fears..."
                      examples={["abandonment", "failure", "rejection", "loneliness"]}
                    />
                  </div>
                  <div>
                    <TagInput
                      label="Goals"
                      tags={goals}
                      setTags={setGoals}
                      placeholder="Add goals..."
                      examples={["find love", "be successful", "help others", "gain independence"]}
                    />
                  </div>
                  <div className="col-span-2">
                    <TagInput
                      label="Values"
                      tags={values}
                      setTags={setValues}
                      placeholder="Add values..."
                      examples={["honesty", "family", "freedom", "ambition", "loyalty"]}
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Attachment Style
                    </label>
                    <select
                      value={attachmentStyle}
                      onChange={(e) => setAttachmentStyle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    >
                      <option value="">Select attachment style...</option>
                      <option value="Secure">Secure</option>
                      <option value="Anxious">Anxious</option>
                      <option value="Avoidant">Avoidant</option>
                      <option value="Fearful Avoidant">Fearful Avoidant</option>
                    </select>
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Communication Style
                    </label>
                    <input
                      type="text"
                      value={communicationStyle}
                      onChange={(e) => setCommunicationStyle(e.target.value)}
                      placeholder="e.g. soft and indirect"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Voice & Relationships */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5 text-left">
                  Voice & Relationships
                </h4>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Voice / Vocal Style
                    </label>
                    <input
                      type="text"
                      value={voiceStyle}
                      onChange={(e) => setVoiceStyle(e.target.value)}
                      placeholder="e.g. Soft-spoken, quiet whisper"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                      Relationship Type
                    </label>
                    <input
                      type="text"
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value)}
                      placeholder="e.g. Partner, Rival, Mentor"
                      className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 shrink-0 pt-4">
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-650 rounded-xl font-bold transition-all text-sm flex items-center justify-center cursor-pointer active:scale-[0.99]"
                >
                  {editingChar ? "Save Changes" : "Generate Character Card"}
                </button>
                {editingChar && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete ${editingChar.name}?`)) {
                        await deleteCharacter(activeProject.id, editingChar.id);
                        setShowAddForm(false);
                        setEditingChar(null);
                      }
                    }}
                    className="px-4 py-3 bg-red-950/20 hover:bg-red-900/10 border border-red-900/20 text-red-400 rounded-xl font-semibold transition-all text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingChar(null);
                  }}
                  className="px-6 py-3 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-xl font-semibold transition-all text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
