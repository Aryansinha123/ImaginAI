"use client";

import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useToast } from "./ToastProvider";
import { Settings, Trash2, Edit3 } from "lucide-react";

export default function SettingsView() {
  const { activeProject, renameProject, deleteProject } = useStore();
  const { toast, confirmAction } = useToast();
  const [name, setName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (activeProject) {
      setName(activeProject.name);
    }
  }, [activeProject]);

  const handleRename = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await renameProject(activeProject.id, name.trim());
    toast({
      type: "success",
      title: "Project renamed",
      message: "Your universe has its new title.",
    });
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirm.trim() !== activeProject.name) {
      toast({
        type: "error",
        title: "Name does not match",
        message: "Type the project name exactly to unlock deletion.",
      });
      return;
    }
    const confirmed = await confirmAction({
      title: `Delete "${activeProject.name}"?`,
      message: "This permanently removes the project, characters, timelines, scene cards, and memory continuity.",
      confirmText: "Delete Project",
      variant: "danger",
    });

    if (confirmed) {
      await deleteProject(activeProject.id);
      toast({
        type: "success",
        title: "Project deleted",
        message: "The project universe and all its contents have been deleted.",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-10 relative max-w-2xl">
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-purple-400">Administration</span>
        <h2 className="text-2xl font-bold text-white mt-1">Project Settings</h2>
      </div>

      {/* Rename Box */}
      <div className="p-6 rounded-3xl bg-zinc-950/20 border border-zinc-850 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-purple-400" />
          Rename Project Universe
        </h3>
        <form onSubmit={handleRename} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">
              New Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Neo-Tokyo 2099"
              className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || name.trim() === activeProject.name}
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-855 disabled:text-zinc-600 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-95"
          >
            Save Project Name
          </button>
        </form>
      </div>

      {/* Delete Box */}
      <div className="p-6 rounded-3xl bg-red-950/[0.03] border border-red-900/10 space-y-4">
        <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400 animate-pulse" />
          Danger Zone
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Deleting this project universe will permanently erase all associated characters, timelines, scene cards, and memory continuity vectors. This action cannot be undone.
        </p>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-550 block mb-1.5 font-semibold">
              Type <span className="text-red-400 font-bold select-all">"{activeProject.name}"</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Confirm project name..."
              className="w-full px-4 py-2.5 bg-zinc-900 text-white border border-zinc-800 focus:border-red-500/50 outline-none rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={deleteConfirm.trim() !== activeProject.name}
            className="px-4 py-2 bg-red-950 text-red-400 hover:bg-red-900/10 disabled:bg-zinc-855 disabled:text-zinc-600 border border-red-900/20 rounded-xl font-bold transition-all text-xs cursor-pointer active:scale-95"
          >
            Delete Project Universe
          </button>
        </form>
      </div>
    </div>
  );
}
