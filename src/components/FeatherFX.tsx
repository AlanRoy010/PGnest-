"use client";

import { useState, useEffect, useRef, useMemo } from "react";

// ── Tiny feather SVG ─────────────────────────────────────────────────────────

function TinyFeather({ size = 14, color = "#E8734A", opacity = 1 }: {
  size?: number; color?: string; opacity?: number;
}) {
  return (
    <svg width={size} height={size * 3} viewBox="0 0 20 60"
      style={{ display: "block", opacity }}>
      <path
        d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z"
        fill={color} opacity="0.85"
      />
      <path d="M10,8 L10,52" stroke={color} strokeWidth="0.7" opacity="0.45" fill="none" />
      {[14, 22, 32, 42, 50].map(y => (
        <g key={y} stroke={color} strokeWidth="0.4" opacity="0.4" fill="none">
          <path d={`M10 ${y} Q ${10 - y / 9} ${y + 2}, ${10 - y / 4.5} ${y + 4}`} />
          <path d={`M10 ${y} Q ${10 + y / 9} ${y + 2}, ${10 + y / 4.5} ${y + 4}`} />
        </g>
      ))}
    </svg>
  );
}

// ── Cursor feather trail ─────────────────────────────────────────────────────

export function CursorTrail() {
  const [trail, setTrail] = useState<{ id: number; x: number; y: number; rot: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (Math.random() > 0.82) {
        const t = { id: ++idRef.current, x: e.clientX, y: e.clientY, rot: Math.random() * 360 };
        setTrail(p => [...p.slice(-7), t]);
        setTimeout(() => setTrail(p => p.filter(x => x.id !== t.id)), 900);
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (trail.length === 0) return null;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9990 }}>
      <style>{`@keyframes pg-trail-fade {
        0%   { opacity: 0.5; transform: translate(0,0) scale(1); }
        100% { opacity: 0; transform: translate(0, 20px) scale(0.4); }
      }`}</style>
      {trail.map(t => (
        <div key={t.id} style={{
          position: "absolute",
          left: t.x - 6,
          top: t.y - 18,
          transform: `rotate(${t.rot}deg)`,
          animation: "pg-trail-fade 0.9s ease-out forwards",
        }}>
          <TinyFeather size={11} color="#E8734A" />
        </div>
      ))}
    </div>
  );
}

// ── 3-D tilt-on-hover card ───────────────────────────────────────────────────

export function TiltCard({ children, max = 5, className = "", style, ...rest }: {
  children: React.ReactNode;
  max?: number;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={e => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setTilt({
          rx: ((e.clientY - r.top) / r.height - 0.5) * -max,
          ry: ((e.clientX - r.left) / r.width - 0.5) * max,
        });
      }}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: "transform 0.4s cubic-bezier(.2,.9,.3,1.1)",
        transformStyle: "preserve-3d",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Magnetic button wrapper ──────────────────────────────────────────────────

export function Magnetic({ children, strength = 0.28, className = "", style }: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [delta, setDelta] = useState({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={e => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setDelta({
          x: (e.clientX - (r.left + r.width / 2)) * strength,
          y: (e.clientY - (r.top + r.height / 2)) * strength,
        });
      }}
      onMouseLeave={() => setDelta({ x: 0, y: 0 })}
      style={{
        display: "inline-block",
        transform: `translate(${delta.x}px, ${delta.y}px)`,
        transition: "transform 0.3s cubic-bezier(.2,.9,.3,1.1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Ambient drifting feathers (for hero / landing sections) ─────────────────

const AMBIENT_COLORS = ["#E8734A", "#6B7FA3", "#7C6E9E", "#F5C4B0", "#B8C4D8"];

export function AmbientFeathers({ count = 8 }: { count?: number }) {
  const feathers = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 11 + Math.random() * 14,
    rot: Math.random() * 360,
    drift: 18 + Math.random() * 28,
    duration: 22 + Math.random() * 22,
    delay: -(Math.random() * 35),
    color: AMBIENT_COLORS[Math.floor(Math.random() * AMBIENT_COLORS.length)],
  })), [count]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {feathers.map(f => (
        <div key={f.id} style={{
          position: "absolute",
          left: `${f.x}%`,
          top: `${f.y}%`,
          animation: `ambient-f${f.id} ${f.duration}s ease-in-out ${f.delay}s infinite`,
        }}>
          <style>{`@keyframes ambient-f${f.id} {
            0%   { transform: translate(0,0) rotate(${f.rot}deg); opacity: 0; }
            12%  { opacity: 0.05; }
            50%  { transform: translate(${f.drift}px,${f.drift * 1.3}px) rotate(${f.rot + 22}deg); }
            88%  { opacity: 0.04; }
            100% { transform: translate(${-f.drift * 0.4}px,${f.drift * 2.1}px) rotate(${f.rot + 45}deg); opacity: 0; }
          }`}</style>
          <TinyFeather size={f.size} color={f.color} opacity={0.07} />
        </div>
      ))}
    </div>
  );
}
