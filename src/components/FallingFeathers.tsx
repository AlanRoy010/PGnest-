"use client";

interface Feather {
  id: number;
  x: number;
  size: number;
  r0: number; r1: number; r2: number; r3: number;
  dx1: number; dx2: number; dx3: number;
  dur: number;
  delay: number;
  colorIdx: number;
}

let featherIdCounter = 0;

const COLORS = ["#E8734A", "#6B7FA3", "#7C6E9E", "#F5C4B0", "#B8C4D8"];

export function spawnFeathers(count = 14): Feather[] {
  return Array.from({ length: count }, (_, i) => ({
    id: featherIdCounter++,
    x: 5 + Math.random() * 90,
    size: 10 + Math.random() * 18,
    r0: -30 + Math.random() * 60,
    r1: -20 + Math.random() * 40,
    r2: -40 + Math.random() * 80,
    r3: -10 + Math.random() * 20,
    dx1: -30 + Math.random() * 60,
    dx2: -50 + Math.random() * 100,
    dx3: -20 + Math.random() * 40,
    dur: 2.2 + Math.random() * 1.6,
    delay: i * 0.08 + Math.random() * 0.15,
    colorIdx: Math.floor(Math.random() * COLORS.length),
  }));
}

function FeatherSVG({ width = 20, color = "#6B7FA3", rotation = 0 }: {
  width?: number;
  color?: string;
  rotation?: number;
}) {
  return (
    <svg
      width={width}
      height={width * 3}
      viewBox="0 0 20 60"
      fill={color}
      style={{ transform: `rotate(${rotation}deg)`, display: "block" }}
    >
      <path d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z" opacity="0.9" />
      <path d="M10,8 C12,14 13,22 12,32 C11,40 10,50 10,50" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M10,8 C8,14 7,22 8,32" fill="none" stroke={color} strokeWidth="0.5" opacity="0.35" />
    </svg>
  );
}

export default function FallingFeathers({ feathers }: { feathers: Feather[] }) {
  if (feathers.length === 0) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {feathers.map((f) => (
        <div
          key={f.id}
          className="falling-feather"
          style={{
            left: `${f.x}%`,
            "--r0": `${f.r0}deg`,
            "--r1": `${f.r1}deg`,
            "--r2": `${f.r2}deg`,
            "--r3": `${f.r3}deg`,
            "--dx1": `${f.dx1}px`,
            "--dx2": `${f.dx2}px`,
            "--dx3": `${f.dx3}px`,
            "--dur": `${f.dur}s`,
            "--delay": `${f.delay}s`,
          } as React.CSSProperties}
        >
          <FeatherSVG width={f.size} color={COLORS[f.colorIdx]} />
        </div>
      ))}
    </div>
  );
}

export { FeatherSVG };
