"use client";

import { useState } from "react";
import { User, X, Check } from "lucide-react";

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
      <div className="flex flex-wrap gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl focus-within:border-purple-500/50 min-h-[42px] transition-colors">
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
        <span className="text-[9px] text-zinc-600 block">
          Suggestions: {examples.join(", ")}
        </span>
      )}
    </div>
  );
}

export default function CharacterForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Appearance
  const [height, setHeight] = useState("");
  const [hair, setHair] = useState("");
  const [eyes, setEyes] = useState("");
  const [skinTone, setSkinTone] = useState("");
  const [clothing, setClothing] = useState("");

  // Lists
  const [coreTraits, setCoreTraits] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [flaws, setFlaws] = useState([]);
  const [fears, setFears] = useState([]);
  const [goals, setGoals] = useState([]);
  const [values, setValues] = useState([]);

  // Singles
  const [attachmentStyle, setAttachmentStyle] = useState("");
  const [communicationStyle, setCommunicationStyle] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("");
  const [relationshipType, setRelationshipType] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Character Name is required.");
      return;
    }

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
      relationship_type: relationshipType
    };

    onCreate(charData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">New Character Details</h3>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
            Name <span className="text-purple-400">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aisha"
            className="w-full px-3 py-2 bg-zinc-950 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Basic Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Age</label>
            <input
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full px-3 py-2 bg-zinc-950 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Gender</label>
            <input
              type="text"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="e.g. Female"
              className="w-full px-3 py-2 bg-zinc-950 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* Appearance Row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Height</label>
            <input
              type="text"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g. 5ft 7in"
              className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Hair Style</label>
            <input
              type="text"
              value={hair}
              onChange={(e) => setHair(e.target.value)}
              placeholder="e.g. Dark, wavy"
              className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* Appearance Row 2 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Eye Color</label>
            <input
              type="text"
              value={eyes}
              onChange={(e) => setEyes(e.target.value)}
              placeholder="e.g. Emerald green"
              className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Skin Tone</label>
            <input
              type="text"
              value={skinTone}
              onChange={(e) => setSkinTone(e.target.value)}
              placeholder="e.g. Pale"
              className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* Clothing */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Clothing Style</label>
          <input
            type="text"
            value={clothing}
            onChange={(e) => setClothing(e.target.value)}
            placeholder="e.g. Leather jacket, combat boots"
            className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Psychology Inputs */}
        <div className="border-t border-zinc-800/60 pt-4 space-y-4">
          <TagInput
            label="Core Traits"
            tags={coreTraits}
            setTags={setCoreTraits}
            placeholder="e.g. introverted, empathetic"
            examples={["introverted", "extroverted", "empathetic", "observant", "confident", "reserved"]}
          />

          <TagInput
            label="Strengths"
            tags={strengths}
            setTags={setStrengths}
            placeholder="e.g. loyal, patient"
            examples={["loyal", "patient", "hardworking", "supportive"]}
          />

          <TagInput
            label="Flaws"
            tags={flaws}
            setTags={setFlaws}
            placeholder="e.g. overthinks, stubborn"
            examples={["stubborn", "overthinks", "jealous", "avoids conflict"]}
          />

          <TagInput
            label="Fears"
            tags={fears}
            setTags={setFears}
            placeholder="e.g. abandonment"
            examples={["abandonment", "failure", "rejection", "loneliness"]}
          />

          <TagInput
            label="Goals"
            tags={goals}
            setTags={setGoals}
            placeholder="e.g. find love"
            examples={["find love", "be successful", "help others", "gain independence"]}
          />

          <TagInput
            label="Values"
            tags={values}
            setTags={setValues}
            placeholder="e.g. honesty"
            examples={["honesty", "family", "freedom", "ambition", "loyalty"]}
          />

          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                Attachment Style
              </label>
              <select
                value={attachmentStyle}
                onChange={(e) => setAttachmentStyle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
              >
                <option value="">Select style...</option>
                <option value="Secure">Secure</option>
                <option value="Anxious">Anxious</option>
                <option value="Avoidant">Avoidant</option>
                <option value="Fearful Avoidant">Fearful Avoidant</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                Communication Style
              </label>
              <input
                type="text"
                value={communicationStyle}
                onChange={(e) => setCommunicationStyle(e.target.value)}
                placeholder="e.g. soft-spoken"
                className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* Voice and Relationships */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
              Voice Style
            </label>
            <input
              type="text"
              value={voiceStyle}
              onChange={(e) => setVoiceStyle(e.target.value)}
              placeholder="e.g. Soft, raspy"
              className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
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
              placeholder="e.g. Partner, Friend"
              className="w-full px-3 py-2 bg-zinc-955 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-zinc-800/60 shrink-0">
        <button
          type="submit"
          className="flex-1 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-zinc-855 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}