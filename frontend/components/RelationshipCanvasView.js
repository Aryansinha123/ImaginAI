"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "../store/useStore";
import { Save, UserCircle, X, ShieldAlert, Heart, Calendar, BookOpen, AlertCircle } from "lucide-react";
import { getAccumulatedEmotionsFromScenes } from "../lib/emotionUtils";

const CharacterNode = ({ data }) => {
  return (
    <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-3 w-42 shadow-xl flex flex-col items-center justify-center relative select-none">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-1.5 overflow-hidden border border-zinc-700">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <UserCircle className="w-8 h-8 text-zinc-555" />
        )}
      </div>
      <div className="text-xs font-bold text-white text-center truncate w-full">{data.name}</div>
      <div className="text-[9px] font-mono font-bold text-purple-400 mt-1 bg-purple-950/40 border border-purple-900/20 px-2 py-0.5 rounded-full">
        {data.sceneCount ?? 0} Scenes
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  );
};

const RELATIONSHIP_NODE_TYPES = { characterNode: CharacterNode };

export default function RelationshipCanvasView() {
  const { activeProject, characters, canvasNodes, canvasEdges, saveCanvasState, activeScene, scenes } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState("");
  const [activeDirectionTab, setActiveDirectionTab] = useState("source_to_target"); // "source_to_target" or "target_to_source"
  const [storyBible, setStoryBible] = useState(null);
  const [edgeEmotions, setEdgeEmotions] = useState({
    source_to_target: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 },
    target_to_source: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 }
  });

  // Fetch story bible summaries
  useEffect(() => {
    if (activeProject) {
      fetch(`/api/story-bible?projectId=${activeProject.id}`)
        .then((res) => res.json())
        .then((data) => setStoryBible(data))
        .catch((err) => console.error("Error fetching story bible:", err));
    }
  }, [activeProject]);

  useEffect(() => {
    // Sync store characters to canvas nodes with scene counts
    const existingNodeIds = new Set(canvasNodes.map((n) => n.id));
    const newNodes = [];

    let xOffset = 50;
    characters.forEach((char) => {
      const sceneCount = scenes.filter((s) => s.characterIds?.includes(char.id)).length;
      if (!existingNodeIds.has(char.id)) {
        newNodes.push({
          id: char.id,
          type: "characterNode",
          position: { x: xOffset, y: 50 },
          data: { name: char.name, avatarUrl: char.avatarUrl, sceneCount },
        });
        xOffset += 180;
      }
    });

    const updatedNodes = canvasNodes.map((n) => {
      const char = characters.find((c) => c.id === n.id);
      const sceneCount = char ? scenes.filter((s) => s.characterIds?.includes(char.id)).length : 0;
      return char
        ? { ...n, data: { ...n.data, name: char.name, avatarUrl: char.avatarUrl, sceneCount } }
        : n;
    });

    setNodes([...updatedNodes, ...newNodes]);

    let updatedEdges = (canvasEdges || []).map((edge) => {
      let currentEmotions = edge.emotions ? { ...edge.emotions } : {
        source_to_target: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 },
        target_to_source: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 }
      };

      if (activeScene) {
        const sourceChar = characters.find((c) => c.id === edge.source);
        const targetChar = characters.find((c) => c.id === edge.target);
        if (sourceChar && targetChar) {
          const accumulated = getAccumulatedEmotionsFromScenes(activeScene.id, scenes);
          const keyST = `${sourceChar.name}->${targetChar.name}`;
          const keyTS = `${targetChar.name}->${sourceChar.name}`;

          const findAccumulated = (pairKey) => {
            const exact = accumulated[pairKey];
            if (exact) return exact;
            const norm = pairKey.replace(/\s+/g, "").toLowerCase();
            const matchKey = Object.keys(accumulated).find(
              (k) => k.replace(/\s+/g, "").toLowerCase() === norm
            );
            return matchKey ? accumulated[matchKey] : null;
          };

          const st = findAccumulated(keyST);
          const ts = findAccumulated(keyTS);
          if (st) {
            currentEmotions.source_to_target = { ...currentEmotions.source_to_target, ...st };
          }
          if (ts) {
            currentEmotions.target_to_source = { ...currentEmotions.target_to_source, ...ts };
          }
        }
      }

      // Edge Color & Labeling Logic (Phase 6 & 7)
      const primaryEmotions = currentEmotions.source_to_target || currentEmotions;
      const trust = primaryEmotions.trust ?? 50;

      let stroke = "#eab308"; // Default Yellow (31-70)
      if (trust <= 30) {
        stroke = "#ef4444"; // Red (0-30)
      } else if (trust > 70) {
        stroke = "#22c55e"; // Green (71-100)
      }

      return {
        ...edge,
        label: `${edge.label || "Connected"} (Trust: ${trust}%)`,
        style: { stroke, strokeWidth: 2.5 },
        emotions: currentEmotions
      };
    });

    setEdges(updatedEdges);
  }, [characters, canvasNodes, canvasEdges, activeScene, scenes, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, label: "Connected", animated: true, style: { stroke: '#eab308', strokeWidth: 2.5 } }, eds)),
    [setEdges]
  );

  const onEdgeDoubleClick = (event, edge) => {
    event.preventDefault();
    setEditingEdgeId(edge.id);
    setEdgeLabelInput(edge.label ? edge.label.split(" (Trust:")[0] : "");
    
    let source_to_target = { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 };
    let target_to_source = { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 };

    if (edge.emotions) {
      if (edge.emotions.source_to_target) {
        source_to_target = { ...source_to_target, ...edge.emotions.source_to_target };
      }
      if (edge.emotions.target_to_source) {
        target_to_source = { ...target_to_source, ...edge.emotions.target_to_source };
      }
      if (typeof edge.emotions.trust === "number") {
        source_to_target = { ...source_to_target, ...edge.emotions };
        target_to_source = { ...target_to_source, ...edge.emotions };
      }
    }

    setEdgeEmotions({ source_to_target, target_to_source });
    setActiveDirectionTab("source_to_target");
  };

  const onEdgeClick = (event, edge) => {
    event.preventDefault();
    setSelectedEdgeId(edge.id);
  };

  const handleLabelSave = (e) => {
    e.preventDefault();
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === editingEdgeId) {
          const trust = edgeEmotions.source_to_target.trust ?? 50;
          let stroke = "#eab308";
          if (trust <= 30) stroke = "#ef4444";
          else if (trust > 70) stroke = "#22c55e";

          return {
            ...edge,
            label: `${edgeLabelInput} (Trust: ${trust}%)`,
            style: { stroke, strokeWidth: 2.5 },
            emotions: edgeEmotions
          };
        }
        return edge;
      })
    );
    setEditingEdgeId(null);
  };

  const handleSave = async () => {
    if (!activeProject) return;
    setIsSaving(true);
    await saveCanvasState(activeProject.id, nodes, edges);
    setIsSaving(false);
  };

  // Helper to resolve characters names for forms & panels
  const activeEditingEdge = edges.find((e) => e.id === editingEdgeId);
  const activeSelectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const getCharNames = (edge) => {
    if (!edge) return { source: "Character A", target: "Character B" };
    return {
      source: characters.find((c) => c.id === edge.source)?.name || "Character A",
      target: characters.find((c) => c.id === edge.target)?.name || "Character B"
    };
  };

  const editingNames = getCharNames(activeEditingEdge);
  const selectedNames = getCharNames(activeSelectedEdge);

  // Side Panel calculations (Memories, Summaries, Scores)
  const [sidebarDirection, setSidebarDirection] = useState("source_to_target");

  useEffect(() => {
    setSidebarDirection("source_to_target");
  }, [selectedEdgeId]);

  let healthScore = 50;
  let selectedEmotions = { trust: 50, attachment: 50, comfort: 50, awkwardness: 0, resentment: 0 };
  let recentMemories = [];
  let storySummary = "No narrative summary established for this dynamic yet.";

  if (activeSelectedEdge) {
    const ems = sidebarDirection === "source_to_target"
      ? (activeSelectedEdge.emotions?.source_to_target || activeSelectedEdge.emotions || {})
      : (activeSelectedEdge.emotions?.target_to_source || activeSelectedEdge.emotions || {});
      
    selectedEmotions = {
      trust: ems.trust ?? 50,
      attachment: ems.attachment ?? 50,
      comfort: ems.comfort ?? 50,
      awkwardness: ems.awkwardness ?? 0,
      resentment: ems.resentment ?? 0
    };

    // Phase 10: Relationship Health Score calculation
    healthScore =
      selectedEmotions.trust +
      selectedEmotions.attachment +
      selectedEmotions.comfort -
      selectedEmotions.awkwardness -
      selectedEmotions.resentment;

    // Get recent memories (scenes featuring both characters)
    recentMemories = scenes
      .filter((s) => s.characterIds?.includes(activeSelectedEdge.source) && s.characterIds?.includes(activeSelectedEdge.target))
      .slice(-3)
      .reverse();

    // Pull from Story Bible relationship_summaries (Phase 9)
    if (storyBible?.relationship_summaries) {
      const keysToTest = [
        `${selectedNames.source}->${selectedNames.target}`,
        `${selectedNames.target}->${selectedNames.source}`,
        `${selectedNames.source}-${selectedNames.target}`,
        `${selectedNames.target}-${selectedNames.source}`,
        `${selectedNames.source}_${selectedNames.target}`,
        `${selectedNames.target}_${selectedNames.source}`
      ];
      const matchingKey = keysToTest.find((k) => storyBible.relationship_summaries[k]);
      if (matchingKey) {
        storySummary = storyBible.relationship_summaries[matchingKey];
      }
    }
  }

  return (
    <div className="flex-1 w-full h-full relative bg-zinc-950 flex overflow-hidden">
      {/* ReactFlow Canvas */}
      <div className="flex-1 h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={RELATIONSHIP_NODE_TYPES}
          fitView
          className="bg-zinc-950"
        >
          <Background color="#27272a" gap={16} />
          <Controls className="bg-zinc-900 border-zinc-800 fill-white text-white" />
          <MiniMap
            nodeColor={() => "#a855f7"}
            maskColor="rgba(0, 0, 0, 0.7)"
            className="bg-zinc-900 border-zinc-850"
          />
          <Panel position="top-right" className="m-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Canvas"}
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Relationship Side Panel (Phase 8, 9, 10) */}
      {activeSelectedEdge && (
        <div className="w-96 bg-zinc-950 border-l border-zinc-900 h-full flex flex-col p-6 overflow-y-auto shrink-0 select-text animate-slide-in relative z-20">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-5">
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                Relationship Dynamics
              </span>
              <div className="mt-1.5">
                <select
                  value={sidebarDirection}
                  onChange={(e) => setSidebarDirection(e.target.value)}
                  className="bg-zinc-900 text-xs font-bold font-mono text-purple-400 rounded-lg px-2.5 py-1 border border-zinc-800 outline-none cursor-pointer focus:border-purple-500/50 transition-all max-w-full"
                >
                  <option value="source_to_target">{selectedNames.source} ➔ {selectedNames.target}</option>
                  <option value="target_to_source">{selectedNames.target} ➔ {selectedNames.source}</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setSelectedEdgeId(null)}
              className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-6 text-left">
            {/* Relationship Health Score Visual */}
            <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                  Connection Health
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {healthScore} pts
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850 relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    healthScore >= 120 
                      ? "bg-emerald-500" 
                      : healthScore >= 60 
                      ? "bg-purple-500" 
                      : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(Math.max((healthScore / 250) * 100, 0), 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-550 block font-semibold leading-relaxed">
                Health = Trust + Attachment + Comfort - Awkwardness - Resentment
              </span>
            </div>

            {/* Gauges */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold">
                Directional Metrics
              </span>
              {[
                { label: "Trust", value: selectedEmotions.trust, color: "bg-purple-500" },
                { label: "Attachment", value: selectedEmotions.attachment, color: "bg-blue-500" },
                { label: "Comfort", value: selectedEmotions.comfort, color: "bg-emerald-500" },
                { label: "Awkwardness", value: selectedEmotions.awkwardness, color: "bg-pink-500" },
                { label: "Resentment", value: selectedEmotions.resentment, color: "bg-red-500" }
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono font-semibold">
                    <span className="text-zinc-400">{m.label}</span>
                    <span className="text-white">{m.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color}`} style={{ width: `${m.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Narrative summary (Phase 9) */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                Story Thread Dynamics
              </span>
              <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl">
                <p className="text-xs text-zinc-300 leading-relaxed font-semibold italic">
                  "{storySummary}"
                </p>
              </div>
            </div>

            {/* Recent Memories (Phase 8) */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Recent Memories
              </span>
              {recentMemories.length > 0 ? (
                <div className="space-y-2">
                  {recentMemories.map((sm, idx) => (
                    <div key={idx} className="bg-zinc-900/30 border border-zinc-900 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold text-purple-400">
                        {sm.title || "Untitled Scene"}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed truncate">
                        {sm.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-center">
                  <span className="text-[10px] text-zinc-600 font-mono italic">
                    No scenes generated with both characters yet.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editing Dialog Modal */}
      {editingEdgeId && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 select-text">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-[450px]">
            <h3 className="text-white font-bold mb-4 text-lg">Edit Relationship</h3>
            <form onSubmit={handleLabelSave}>
              <div className="mb-6">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5 font-bold">
                  Relationship Connection
                </label>
                <input
                  type="text"
                  autoFocus
                  value={edgeLabelInput}
                  onChange={(e) => setEdgeLabelInput(e.target.value)}
                  placeholder="e.g. Rivals, Siblings, Best Friends..."
                  className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 text-sm font-semibold"
                />
              </div>

              <div className="mb-6">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2 font-bold">
                  Directional Dynamics
                </label>
                <div className="flex gap-2 mb-4 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setActiveDirectionTab("source_to_target")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeDirectionTab === "source_to_target"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {editingNames.source} ➔ {editingNames.target}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDirectionTab("target_to_source")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeDirectionTab === "target_to_source"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/10"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {editingNames.target} ➔ {editingNames.source}
                  </button>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {Object.keys(edgeEmotions[activeDirectionTab] || {}).map((emotion) => (
                    <div key={emotion} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs capitalize text-zinc-300 font-bold">{emotion}</label>
                        <span className="text-xs font-mono text-purple-400 font-bold">
                          {(edgeEmotions[activeDirectionTab] || {})[emotion]}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(edgeEmotions[activeDirectionTab] || {})[emotion] ?? 50}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setEdgeEmotions((prev) => ({
                            ...prev,
                            [activeDirectionTab]: {
                              ...prev[activeDirectionTab],
                              [emotion]: val
                            }
                          }));
                        }}
                        className="w-full accent-purple-500 h-1.5 bg-zinc-850 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setEditingEdgeId(null)}
                  className="px-4 py-2 hover:bg-zinc-800/50 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl transition-all cursor-pointer text-sm font-bold active:scale-95 shadow-lg shadow-white/5"
                >
                  Save Dynamics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
