"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
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
import { Save, UserCircle } from "lucide-react";

const CharacterNode = ({ data }) => {
  return (
    <div className="bg-zinc-900 border-2 border-zinc-700 rounded-xl p-3 w-40 shadow-xl flex flex-col items-center justify-center relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-2 overflow-hidden border border-zinc-700">
        {data.avatarUrl ? (
          <img src={data.avatarUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <UserCircle className="w-8 h-8 text-zinc-500" />
        )}
      </div>
      <div className="text-sm font-bold text-white text-center truncate w-full">{data.name}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  );
};

export default function RelationshipCanvasView() {
  const { activeProject, characters, canvasNodes, canvasEdges, saveCanvasState } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [edgeLabelInput, setEdgeLabelInput] = useState("");
  const [activeDirectionTab, setActiveDirectionTab] = useState("source_to_target"); // "source_to_target" or "target_to_source"
  const [edgeEmotions, setEdgeEmotions] = useState({
    source_to_target: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 },
    target_to_source: { trust: 50, attachment: 50, awkwardness: 0, resentment: 0, comfort: 50 }
  });

  const nodeTypes = useMemo(() => ({ characterNode: CharacterNode }), []);

  useEffect(() => {
    // Sync store characters to canvas nodes
    const existingNodeIds = new Set(canvasNodes.map((n) => n.id));
    const newNodes = [];

    let xOffset = 50;
    characters.forEach((char) => {
      if (!existingNodeIds.has(char.id)) {
        newNodes.push({
          id: char.id,
          type: "characterNode",
          position: { x: xOffset, y: 50 },
          data: { name: char.name, avatarUrl: char.avatarUrl },
        });
        xOffset += 180;
      }
    });

    const updatedNodes = canvasNodes.map((n) => {
      const char = characters.find((c) => c.id === n.id);
      return char
        ? { ...n, data: { ...n.data, name: char.name, avatarUrl: char.avatarUrl } }
        : n;
    });

    setNodes([...updatedNodes, ...newNodes]);
    setEdges(canvasEdges || []);
  }, [characters, canvasNodes, canvasEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, label: "Connected", animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onEdgeDoubleClick = (event, edge) => {
    event.preventDefault();
    setEditingEdgeId(edge.id);
    setEdgeLabelInput(edge.label || "");
    
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

  const handleLabelSave = (e) => {
    e.preventDefault();
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === editingEdgeId) {
          return { ...edge, label: edgeLabelInput, emotions: edgeEmotions };
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

  // Helper to resolve characters names for tabs
  const activeEditingEdge = edges.find(e => e.id === editingEdgeId);
  const sourceName = activeEditingEdge ? (characters.find(c => c.id === activeEditingEdge.source)?.name || "Character A") : "Character A";
  const targetName = activeEditingEdge ? (characters.find(c => c.id === activeEditingEdge.target)?.name || "Character B") : "Character B";

  return (
    <div className="flex-1 w-full h-full relative bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-zinc-950"
      >
        <Background color="#3f3f46" gap={16} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-white text-white" />
        <MiniMap
          nodeColor={(n) => {
            return "#a855f7";
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="bg-zinc-900 border-zinc-800"
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

      {editingEdgeId && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-[450px]">
            <h3 className="text-white font-bold mb-4 text-lg">Edit Relationship</h3>
            <form onSubmit={handleLabelSave}>
              <div className="mb-6">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5 font-bold">Relationship Connection</label>
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
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-2 font-bold">Directional Dynamics</label>
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
                    {sourceName} ➔ {targetName}
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
                    {targetName} ➔ {sourceName}
                  </button>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {Object.keys(edgeEmotions[activeDirectionTab] || {}).map((emotion) => (
                    <div key={emotion} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs capitalize text-zinc-300 font-bold">{emotion}</label>
                        <span className="text-xs font-mono text-purple-400 font-bold">{(edgeEmotions[activeDirectionTab] || {})[emotion]}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(edgeEmotions[activeDirectionTab] || {})[emotion] ?? 50}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setEdgeEmotions(prev => ({
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
