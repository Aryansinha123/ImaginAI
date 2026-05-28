"use client";

import { useState } from "react";
import { User, X, Check } from "lucide-react";

export default function CharacterForm({ onCreate, onCancel }) {
  const [character, setCharacter] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    hair: "",
    eyes: "",
    skinTone: "",
    clothing: "",
    personality: "",
    voice: "",
    relationship: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setCharacter({
      ...character,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!character.name.trim()) {
      setError("Character Name is required.");
      return;
    }

    onCreate(character);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-zinc-900/30 p-5 rounded-2xl border border-zinc-800">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-white">New Character Details</h3>
      </div>

      <div className="space-y-3.5">
        {/* Name */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
            Name <span className="text-purple-400">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            value={character.name}
            onChange={handleChange}
            placeholder="e.g. Elena Vance"
            className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Basic Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Age</label>
            <input
              name="age"
              type="text"
              value={character.age}
              onChange={handleChange}
              placeholder="e.g. 28"
              className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Gender</label>
            <input
              name="gender"
              type="text"
              value={character.gender}
              onChange={handleChange}
              placeholder="e.g. Female"
              className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* Appearance Row 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Height</label>
            <input
              name="height"
              type="text"
              value={character.height}
              onChange={handleChange}
              placeholder="e.g. 5ft 7in"
              className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Hair Style</label>
            <input
              name="hair"
              type="text"
              value={character.hair}
              onChange={handleChange}
              placeholder="e.g. Dark, wavy"
              className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* Appearance Row 2 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Eye Color</label>
            <input
              name="eyes"
              type="text"
              value={character.eyes}
              onChange={handleChange}
              placeholder="e.g. Emerald green"
              className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Skin Tone</label>
            <input
              name="skinTone"
              type="text"
              value={character.skinTone}
              onChange={handleChange}
              placeholder="e.g. Pale"
              className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        {/* Clothing */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Clothing Style</label>
          <input
            name="clothing"
            type="text"
            value={character.clothing}
            onChange={handleChange}
            placeholder="e.g. Leather jacket, combat boots"
            className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Relationship / Role</label>
          <input
            name="relationship"
            type="text"
            value={character.relationship}
            onChange={handleChange}
            placeholder="e.g. Protagonist / Rebellion Leader"
            className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Voice */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Voice Style</label>
          <input
            name="voice"
            type="text"
            value={character.voice}
            onChange={handleChange}
            placeholder="e.g. Soft, raspy, determined"
            className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors"
          />
        </div>

        {/* Personality */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">Personality Traits</label>
          <textarea
            name="personality"
            value={character.personality}
            onChange={handleChange}
            placeholder="e.g. Intelligent, fiercely loyal, haunted by her past..."
            rows={3}
            className="w-full px-3 py-2 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm transition-colors resize-none"
          />
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
            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}