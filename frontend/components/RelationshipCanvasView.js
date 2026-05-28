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
  };

  const handleLabelSave = (e) => {
    e.preventDefault();
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === editingEdgeId) {
          return { ...edge, label: edgeLabelInput };
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

      {/* Edge Label Editor Modal */}
      {editingEdgeId && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-80">
            <h3 className="text-white font-bold mb-4">Edit Relationship Label</h3>
            <form onSubmit={handleLabelSave}>
              <input
                type="text"
                autoFocus
                value={edgeLabelInput}
                onChange={(e) => setEdgeLabelInput(e.target.value)}
                placeholder="e.g. Rivals, Siblings..."
                className="w-full bg-zinc-950 text-white border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 mb-4"
              />
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
                  Save Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
