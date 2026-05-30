"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { Sparkles, Sliders, Palette } from "lucide-react";
import { Suspense } from "react";
import * as THREE from "three";

// Procedural Hairstyle meshes
function ProceduralHair({ style = "short", color = "#4a2c11" }) {
  const normalized = style.toLowerCase();

  if (normalized.includes("bald")) {
    return null;
  }

  // Curly / Afro / Textured Hair style
  if (normalized.includes("curly") || normalized.includes("wavy") || normalized.includes("afro")) {
    return (
      <group>
        {/* Render a cloud of small curls spheres around the upper skull */}
        <mesh position={[0, 0.88, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        {[-0.1, 0, 0.1].map((x, i) =>
          [-0.05, 0.05, 0.12].map((z, j) => (
            <mesh key={`${i}-${j}`} position={[x, 0.94, z]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color={color} roughness={0.95} />
            </mesh>
          ))
        )}
      </group>
    );
  }

  // Long hair cascading down the shoulders
  if (normalized.includes("long") || normalized.includes("braids") || normalized.includes("straight")) {
    return (
      <group>
        {/* Hair Cap */}
        <mesh position={[0, 0.88, -0.01]}>
          <sphereGeometry args={[0.19, 32, 32]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Cascading sides */}
        <mesh position={[-0.16, 0.65, -0.05]} rotation={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.045, 0.035, 0.35, 16]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0.16, 0.65, -0.05]} rotation={[0, 0, -0.05]}>
          <cylinderGeometry args={[0.045, 0.035, 0.35, 16]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Back cascading strand */}
        <mesh position={[0, 0.62, -0.15]}>
          <boxGeometry args={[0.26, 0.38, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  // Default short style
  return (
    <group>
      <mesh position={[0, 0.88, -0.01]}>
        <sphereGeometry args={[0.19, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Front fringe / sweep */}
      <mesh position={[0, 0.91, 0.09]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.1]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

// Procedural Face Proportions generator based on face shapes
function getFaceScales(shape = "round") {
  const normalized = shape.toLowerCase();
  if (normalized.includes("oval")) {
    return [0.92, 1.15, 0.92]; // Taller, narrower head
  }
  if (normalized.includes("square")) {
    return [1.06, 0.95, 1.0]; // Shorter, wider jaw proportions
  }
  if (normalized.includes("heart")) {
    return [1.05, 1.05, 0.85]; // Wider temples, tapers towards chin
  }
  if (normalized.includes("chiseled")) {
    return [0.96, 1.08, 1.02]; // Pronounced, sharper jawline scale
  }
  // Default round shape proportions
  return [1.0, 1.0, 1.0];
}

export default function Character3DViewer({
  hairColor = "#4a2c11",
  skinColor = "#ffd1b3",
  eyeColor = "#4b9cd3",
  clothingColor = "#7c3aed",
  heightScale = 1.0,
  faceShape = "round",
  hairStyle = "short",
  compact = false,
  onChangeConfig
}) {
  const headScale = getFaceScales(faceShape);

  const canvasContent = (
    <Canvas camera={{ position: [0, 0.4, 2.2], fov: 45 }} className="w-full h-full cursor-grab active:cursor-grabbing">
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 4, 3]} intensity={2.2} castShadow />
      <directionalLight position={[-2, 1, -1]} intensity={0.5} />
      
      <Suspense fallback={null}>
        <group position={[0, -0.4, 0]} scale={[1, heightScale, 1]}>
          {/* Hair geometry */}
          <ProceduralHair style={hairStyle} color={hairColor} />

          {/* Head (shaped procedurally) */}
          <group scale={headScale}>
            <mesh position={[0, 0.75, 0]}>
              <sphereGeometry args={[0.18, 32, 32]} />
              <meshStandardMaterial color={skinColor} roughness={0.55} />
            </mesh>
            {/* Optional chin definition for chiseled/square shapes */}
            {faceShape.toLowerCase().includes("chiseled") && (
              <mesh position={[0, 0.62, 0.05]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.07, 0.06, 0.07]} />
                <meshStandardMaterial color={skinColor} roughness={0.55} />
              </mesh>
            )}
          </group>

          {/* Left Eye */}
          <mesh position={[-0.06, 0.77, 0.14]}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color={eyeColor} roughness={0.1} />
          </mesh>

          {/* Right Eye */}
          <mesh position={[0.06, 0.77, 0.14]}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color={eyeColor} roughness={0.1} />
          </mesh>

          {/* Nose shape */}
          <mesh position={[0, 0.73, 0.17]} rotation={[0.1, 0, 0]}>
            <coneGeometry args={[0.016, 0.06, 4]} />
            <meshStandardMaterial color={skinColor} roughness={0.55} />
          </mesh>

          {/* Torso / Shirt */}
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.18, 0.12, 0.55, 32]} />
            <meshStandardMaterial color={clothingColor} roughness={0.4} />
          </mesh>

          {/* Arms */}
          <mesh position={[-0.23, 0.35, 0]} rotation={[0, 0, 0.12]}>
            <cylinderGeometry args={[0.045, 0.038, 0.42, 16]} />
            <meshStandardMaterial color={clothingColor} roughness={0.4} />
          </mesh>
          <mesh position={[0.23, 0.35, 0]} rotation={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.045, 0.038, 0.42, 16]} />
            <meshStandardMaterial color={clothingColor} roughness={0.4} />
          </mesh>

          {/* Legs */}
          <mesh position={[-0.08, -0.22, 0]}>
            <cylinderGeometry args={[0.055, 0.048, 0.6, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.7} />
          </mesh>
          <mesh position={[0.08, -0.22, 0]}>
            <cylinderGeometry args={[0.055, 0.048, 0.6, 16]} />
            <meshStandardMaterial color="#18181b" roughness={0.7} />
          </mesh>
        </group>
      </Suspense>

      <Grid
        position={[0, -0.85, 0]}
        args={[10.5, 10.5]}
        cellSize={0.25}
        cellThickness={1.0}
        cellColor="#27272a"
        sectionSize={1.0}
        sectionThickness={1.5}
        sectionColor="#3f3f46"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />
      <OrbitControls
        enableZoom={true}
        minDistance={1.0}
        maxDistance={4.0}
        maxPolarAngle={Math.PI / 2 + 0.1}
        target={[0, 0.2, 0]}
      />
    </Canvas>
  );

  if (compact) {
    return (
      <div className="relative bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden w-full h-full min-h-[160px]">
        <div className="absolute top-2.5 left-2.5 z-10 bg-zinc-900/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-zinc-800 flex items-center gap-1 pointer-events-none">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span className="text-[9px] font-mono font-bold text-zinc-300 uppercase tracking-wider">3D Model</span>
        </div>
        {canvasContent}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 h-[460px] md:h-[380px] w-full text-left">
      {/* 3D Canvas Viewport */}
      <div className="flex-1 relative bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden h-[240px] md:h-full">
        <div className="absolute top-3 left-3 z-10 bg-zinc-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800 flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wider">3D Clone Preview</span>
        </div>
        {canvasContent}
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-56 shrink-0 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Sliders className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Dimensions</span>
          </div>

          {/* Height Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              <span>Height</span>
              <span className="text-white font-bold">{Math.round(heightScale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.01"
              value={heightScale}
              onChange={(e) => onChangeConfig({ heightScale: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer h-1.5"
            />
          </div>

          {/* Face Proportions Selector */}
          <div className="text-left">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">Face Shape</label>
            <select
              value={faceShape}
              onChange={(e) => onChangeConfig({ faceShape: e.target.value })}
              className="w-full px-3 py-1.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-lg text-xs"
            >
              <option value="round">Round</option>
              <option value="oval">Oval</option>
              <option value="square">Square</option>
              <option value="heart">Heart</option>
              <option value="chiseled">Chiseled</option>
            </select>
          </div>

          {/* Hairstyle Selector */}
          <div className="text-left">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">Hair Style</label>
            <select
              value={hairStyle}
              onChange={(e) => onChangeConfig({ hairStyle: e.target.value })}
              className="w-full px-3 py-1.5 bg-zinc-900 text-white border border-zinc-800 focus:border-purple-500/50 outline-none rounded-lg text-xs"
            >
              <option value="short">Short</option>
              <option value="long">Long</option>
              <option value="curly">Curly</option>
              <option value="bald">Bald</option>
            </select>
          </div>

          <div className="border-t border-zinc-900 pt-3 flex items-center gap-1.5 text-purple-400">
            <Palette className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Color Swatch</span>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono uppercase text-zinc-500 block">Skin</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={skinColor}
                  onChange={(e) => onChangeConfig({ skinColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent block"
                />
                <span className="text-[9px] font-mono text-zinc-400 uppercase select-none">{skinColor}</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono uppercase text-zinc-500 block">Hair</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={hairColor}
                  onChange={(e) => onChangeConfig({ hairColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent block"
                />
                <span className="text-[9px] font-mono text-zinc-400 uppercase select-none">{hairColor}</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono uppercase text-zinc-500 block">Eyes</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={eyeColor}
                  onChange={(e) => onChangeConfig({ eyeColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent block"
                />
                <span className="text-[9px] font-mono text-zinc-400 uppercase select-none">{eyeColor}</span>
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono uppercase text-zinc-500 block">Clothing</label>
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={clothingColor}
                  onChange={(e) => onChangeConfig({ clothingColor: e.target.value })}
                  className="w-7 h-7 rounded border border-zinc-800 cursor-pointer overflow-hidden p-0 bg-transparent block"
                />
                <span className="text-[9px] font-mono text-zinc-400 uppercase select-none">{clothingColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
