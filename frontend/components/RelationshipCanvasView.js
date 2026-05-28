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
  const [edgeEmotions, setEdgeEmotions] = useState({
    trust: 50,
    attachment: 50,
    awkwardness: 0,
    resentment: 0,
    comfort: 50
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
    setEdgeEmotions(edge.emotions || {
      trust: 50,
      attachment: 50,
      awkwardness: 0,
      resentment: 0,
      comfort: 50
    });
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
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-96">
            <h3 className="text-white font-bold mb-4">Edit Relationship</h3>
            <form onSubmit={handleLabelSave}>
              <div className="mb-4">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">Relationship Label</label>
                <input
                  type="text"
                  autoFocus
                  value={edgeLabelInput}
                  onChange={(e) => setEdgeLabelInput(e.target.value)}
                  placeholder="e.g. Rivals, Siblings..."
                  className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-4 mb-6">
                <h4 className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold border-b border-zinc-900 pb-1.5">Emotional Dynamics</h4>
                {Object.keys(edgeEmotions).map((emotion) => (
                  <div key={emotion}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs capitalize text-zinc-300 font-semibold">{emotion}</label>
                      <span className="text-xs font-mono text-zinc-500">{edgeEmotions[emotion]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={edgeEmotions[emotion]}
                      onChange={(e) => setEdgeEmotions({ ...edgeEmotions, [emotion]: parseInt(e.target.value) })}
                      className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEdgeId(null)}
                  className="px-4 py-2 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer text-sm font-semibold"
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
