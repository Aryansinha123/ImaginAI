"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useStore } from "../store/useStore";
import { useToast } from "./ToastProvider";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  Panel,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Film, Trash2, Copy, Edit3, ArrowUp, ArrowDown, Users, Network, List, GripVertical } from "lucide-react";

// Custom Scene Node Component for ReactFlow Canvas
const SceneNode = ({ data }) => {
  return (
    <div className="bg-zinc-900 border-2 border-zinc-800 hover:border-purple-500/50 rounded-2xl p-4 w-60 shadow-2xl flex flex-col justify-between relative group transition-all duration-300">
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-purple-500 border border-zinc-950" />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider truncate max-w-[130px]">
            {data.branch_id === "main" ? "Main Timeline" : `Branch: ${data.branch_id}`}
          </span>
          {data.tone && (
            <span className="text-[8px] font-mono bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-850 uppercase font-bold shrink-0">
              {data.tone}
            </span>
          )}
        </div>
        
        <div>
          <h4 className="font-bold text-xs text-white truncate">{data.title}</h4>
          <p className="text-[10px] text-zinc-450 line-clamp-2 italic mt-1 leading-normal">
            "{data.prompt}"
          </p>
        </div>

        {/* Assigned characters bubbles */}
        {data.characters && data.characters.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden pt-1">
            {data.characters.map((char) => (
              <div
                key={char.id}
                title={char.name}
                className="w-5 h-5 rounded-full bg-zinc-850 border border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-300 shadow-sm"
              >
                {char.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onEdit(data.id);
          }}
          className="px-2.5 py-1.5 bg-purple-650/10 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-purple-500/10"
        >
          Open Studio
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onBranch(data.id);
          }}
          className="px-2.5 py-1.5 bg-white/5 hover:bg-white text-zinc-300 hover:text-black rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-zinc-800"
        >
          Branch +
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-purple-500 border border-zinc-950" />
    </div>
  );
};

const TIMELINE_NODE_TYPES = { sceneNode: SceneNode };

// Top-Down Dynamic Tree Layout Algorithm
function layoutTree(scenes) {
  const adj = {};
  scenes.forEach(s => {
    adj[s.id] = [];
  });
  
  scenes.forEach(s => {
    if (s.parent_id && adj[s.parent_id]) {
      adj[s.parent_id].push(s.id);
    }
  });
  
  const roots = scenes.filter(s => !s.parent_id || !scenes.some(p => p.id === s.parent_id));
  const positions = {};
  
  const assignPositions = (nodeId, x, y, level) => {
    positions[nodeId] = { x, y };
    const children = adj[nodeId] || [];
    const childY = y + 230; 
    const spread = 280; 
    const startX = x - ((children.length - 1) * spread) / 2;
    
    children.forEach((childId, index) => {
      assignPositions(childId, startX + index * spread, childY, level + 1);
    });
  };
  
  const rootSpread = 600;
  const startRootX = 250 - ((roots.length - 1) * rootSpread) / 2;
  roots.forEach((root, index) => {
    assignPositions(root.id, startRootX + index * rootSpread, 50, 0);
  });
  
  return positions;
}

function rebuildSceneOrderFromNodes(scenes, nodes) {
  const nodePos = new Map(nodes.map((n) => [n.id, n.position?.x ?? 0]));

  const getChildren = (parentId) =>
    scenes
      .filter((s) => (s.parent_id || null) === parentId)
      .sort((a, b) => (nodePos.get(a.id) ?? 0) - (nodePos.get(b.id) ?? 0));

  const walk = (parentId) => {
    const ids = [];
    for (const child of getChildren(parentId)) {
      ids.push(child.id);
      ids.push(...walk(child.id));
    }
    return ids;
  };

  const ordered = walk(null);
  scenes.forEach((s) => {
    if (!ordered.includes(s.id)) ordered.push(s.id);
  });
  return ordered;
}

export default function TimelineView({ onViewChange, onSelectScene }) {
  const { activeProject, scenes, characters, deleteScene, duplicateScene, reorderScenes } = useStore();
  const { toast, confirmAction } = useToast();
  const [viewMode, setViewMode] = useState("canvas"); // "canvas" or "list"
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onSelectSceneRef = useRef(onSelectScene);
  const onViewChangeRef = useRef(onViewChange);
  const sortedScenesRef = useRef([]);

  onSelectSceneRef.current = onSelectScene;
  onViewChangeRef.current = onViewChange;

  const sortedScenes = useMemo(
    () =>
      [...scenes].sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      }),
    [scenes]
  );

  sortedScenesRef.current = sortedScenes;

  const layoutSignature = useMemo(
    () =>
      sortedScenes
        .map((s) => `${s.id}:${s.parent_id || ""}:${s.order ?? 0}`)
        .join("|"),
    [sortedScenes]
  );

  const charactersSignature = useMemo(
    () => characters.map((c) => `${c.id}:${c.name}`).join("|"),
    [characters]
  );

  // Sync ReactFlow Canvas nodes and edges
  useEffect(() => {
    const scenesToLayout = sortedScenesRef.current;

    if (scenesToLayout.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const positions = layoutTree(scenesToLayout);

    const newNodes = scenesToLayout.map((s) => {
      const pos = positions[s.id] || { x: 50, y: 50 };
      const assignedChars = characters.filter((c) => (s.characterIds || []).includes(c.id));
      
      return {
        id: s.id,
        type: "sceneNode",
        position: pos,
        data: {
          id: s.id,
          title: s.title,
          prompt: s.prompt,
          tone: s.tone,
          branch_id: s.branch_id,
          characters: assignedChars,
          onEdit: (id) => {
            const sc = sortedScenesRef.current.find((scene) => scene.id === id);
            onSelectSceneRef.current(sc);
            onViewChangeRef.current("Scene Studio");
          },
          onBranch: (id) => {
            if (typeof window !== "undefined") {
              localStorage.setItem("imaginai_draft_parent", id);
              localStorage.setItem("imaginai_draft_branch", "branch_a");
            }
            onSelectSceneRef.current(null);
            onViewChangeRef.current("Scene Studio");
          }
        }
      };
    });

    const newEdges = scenesToLayout
      .filter((s) => s.parent_id)
      .map((s) => ({
        id: `edge-${s.parent_id}-${s.id}`,
        source: s.parent_id,
        target: s.id,
        animated: true,
        style: { stroke: "#a855f7", strokeWidth: 2 }
      }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [layoutSignature, charactersSignature]);

  const handleNodeDragStop = useCallback(
    async (_event, draggedNode) => {
      if (!activeProject) return;
      const currentNodes = nodes.map((n) =>
        n.id === draggedNode.id ? { ...n, position: draggedNode.position } : n
      );
      const orderedIds = rebuildSceneOrderFromNodes(sortedScenes, currentNodes);
      await reorderScenes(activeProject.id, orderedIds);
    },
    [activeProject, nodes, sortedScenes, reorderScenes]
  );

  const handleNodeDoubleClick = useCallback(
    (_event, node) => {
      const sc = sortedScenes.find((scene) => scene.id === node.id);
      if (sc) {
        onSelectScene(sc);
        onViewChange("Scene Studio");
      }
    },
    [sortedScenes, onSelectScene, onViewChange]
  );

  // Linear view reordering handlers
  const moveScene = async (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= sortedScenes.length) return;

    const newScenes = [...sortedScenes];
    const temp = newScenes[currentIndex];
    newScenes[currentIndex] = newScenes[targetIndex];
    newScenes[targetIndex] = temp;

    const orderedIds = newScenes.map((s) => s.id);
    await reorderScenes(activeProject.id, orderedIds);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newScenes = [...sortedScenes];
    const [draggedItem] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(targetIndex, 0, draggedItem);

    handleDragEnd();
    const orderedIds = newScenes.map((s) => s.id);
    await reorderScenes(activeProject.id, orderedIds);
  };

  const getToneColor = (tone) => {
    const tones = {
      romantic: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      awkward: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      tense: "bg-red-500/10 text-red-400 border-red-500/20",
      nostalgic: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      emotional: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      melancholic: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      suspenseful: "bg-orange-500/10 text-orange-400 border-orange-500/20"
    };
    return tones[tone] || "bg-zinc-800 text-zinc-400 border-zinc-700/50";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
      {/* Header Toolbar */}
      <div className="p-8 border-b border-zinc-900 flex items-center justify-between shrink-0 bg-zinc-950/20">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-semibold">Universe Chronology</span>
          <h2 className="text-2xl font-bold text-white mt-1">Timeline Canvas</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle buttons */}
          <div className="flex bg-zinc-900 border border-zinc-850 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("canvas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "canvas"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/15"
                  : "text-zinc-450 hover:text-white"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Graph View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/15"
                  : "text-zinc-450 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
          </div>

          <button
            onClick={() => {
              onSelectScene(null);
              onViewChange("Scene Studio");
            }}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-white/5"
          >
            Add Root Scene
          </button>
        </div>
      </div>

      {sortedScenes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="py-20 text-center border-2 border-dashed border-zinc-850 rounded-3xl max-w-xl mx-auto px-10">
            <Film className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-base font-semibold text-zinc-400">No scenes in the timeline yet</p>
            <p className="text-xs text-zinc-650 mt-1 max-w-[280px] mx-auto leading-relaxed">
              Head to the Scene Studio to create your first root scene, select characters, and write story beats.
            </p>
          </div>
        </div>
      ) : viewMode === "canvas" ? (
        // REACTFLOW GRAPH VIEW
        <div className="flex-1 w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            onNodeDoubleClick={handleNodeDoubleClick}
            nodeTypes={TIMELINE_NODE_TYPES}
            nodesDraggable
            nodesConnectable={false}
            fitView
            className="bg-zinc-950"
          >
            <Background color="#27272a" gap={20} size={1} />
            <Controls className="bg-zinc-900 border-zinc-800 fill-white text-white" />
            <MiniMap
              nodeColor={() => "#a855f7"}
              maskColor="rgba(0, 0, 0, 0.7)"
              className="bg-zinc-900 border-zinc-800"
            />
            <Panel position="top-center" className="!m-4">
              <p className="text-[10px] font-mono text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                Drag scene cards horizontally to reorder branches · Double click node to edit in Studio
              </p>
            </Panel>
          </ReactFlow>
        </div>
      ) : (
        // CLASSIC LINEAR LIST VIEW
        <div className="flex-1 overflow-y-auto p-8 space-y-5 scrollbar-thin">
          <p className="text-xs text-zinc-555 mb-2 italic">
            💡 Tip: Drag and drop cards to reorder scenes, or double click a card to open it in Studio.
          </p>
          <div className="space-y-5 max-w-4xl">
            {sortedScenes.map((scene, index) => {
              const assignedChars = characters.filter((c) =>
                (scene.characterIds || []).includes(c.id)
              );

              return (
                <div
                  key={scene.id}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDoubleClick={() => {
                    onSelectScene(scene);
                    onViewChange("Scene Studio");
                  }}
                  className={`group flex flex-col md:flex-row items-stretch bg-zinc-950/45 border transition-all duration-300 rounded-3xl overflow-hidden shadow-lg cursor-pointer select-none ${
                    dragOverIndex === index
                      ? "border-purple-500 ring-1 ring-purple-500/30"
                      : "border-zinc-850 hover:border-zinc-750"
                  } ${draggedIndex === index ? "opacity-40 scale-[0.99]" : ""}`}
                >
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    className="w-full md:w-12 bg-zinc-900 border-r border-zinc-850 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 text-zinc-500 hover:text-purple-400 hover:bg-zinc-850/50 transition-colors"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-full md:w-36 bg-zinc-900 border-r border-zinc-850 flex flex-col items-center justify-center p-6 relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                    <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-semibold">
                      {scene.branch_id === "main" ? "Main Branch" : `Reality: ${scene.branch_id}`}
                    </span>
                    <span className="text-2xl font-extrabold text-white mt-1">
                      Scene {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base truncate">
                          {scene.title || "Untitled Scene"}
                        </h3>
                        {scene.tone && (
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getToneColor(scene.tone)}`}>
                            {scene.tone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 italic line-clamp-2 leading-relaxed">
                        "{scene.prompt}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {assignedChars.length === 0 ? (
                          <span className="text-[10px] text-zinc-550 italic">No characters assigned</span>
                        ) : (
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {assignedChars.map((char) => (
                              <div
                                key={char.id}
                                title={char.name}
                                className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] font-bold text-zinc-300"
                              >
                                {char.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 opacity-85 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveScene(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-850 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveScene(index, 1)}
                          disabled={index === sortedScenes.length - 1}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-850 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-zinc-800 mx-1" />

                        <button
                          onClick={() => {
                            onSelectScene(scene);
                            onViewChange("Scene Studio");
                          }}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-purple-400 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                          title="Edit in Studio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => duplicateScene(activeProject.id, scene)}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-emerald-400 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                          title="Duplicate Scene"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={async () => {
                            const confirmed = await confirmAction({
                              title: "Delete this scene?",
                              message: `"${scene.title}" will be removed from the timeline.`,
                              confirmText: "Delete Scene",
                              variant: "danger",
                            });

                            if (confirmed) {
                              await deleteScene(activeProject.id, scene.id);
                              toast({
                                type: "success",
                                title: "Scene deleted",
                                message: "The timeline has been updated.",
                              });
                            }
                          }}
                          className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-red-400 border border-zinc-850 rounded-xl transition-all cursor-pointer"
                          title="Delete Scene"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
