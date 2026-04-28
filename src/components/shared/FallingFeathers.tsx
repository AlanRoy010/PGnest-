"use client";

import { useEffect, useState, useCallback } from "react";

interface Feather {
  id: number;
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
}

let _id = 0;

const TOAST_COLORS = {
  success: ["#E8734A", "#C5522E", "#F5C4B0", "#6B7FA3", "#B8C4D8"],
  error: ["#C5522E", "#E8734A", "#F0A882", "#7C6E9E"],
  default: ["#6B7FA3", "#7C6E9E", "#B8C4D8", "#E8734A"],
};

function FeatherShape({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size * 3}
      viewBox="0 0 20 60"
      fill={color}
      style={{ display: "block" }}
    >
      <path
        d="M10,1 C10,1 17,12 16,28 C15,44 10,57 10,57 C10,57 5,44 4,28 C3,12 10,1 10,1 Z"
        opacity="0.9"
      />
      <path
        d="M10,8 C12,14 13,22 12,32 C11,40 10,50 10,50"
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d="M10,8 C8,14 7,22 8,32"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.35"
      />
    </svg>
  );
}

function spawnFeathers(count: number, type: "success" | "error" | "default"): Feather[] {
  const palette = TOAST_COLORS[type];
  return Array.from({ length: count }, () => ({
    id: _id++,
    x: 5 + Math.random() * 90,
    size: 10 + Math.random() * 16,
    color: palette[Math.floor(Math.random() * palette.length)],
    delay: Math.random() * 0.4,
    duration: 1.8 + Math.random() * 1.2,
    rotate: -30 + Math.random() * 60,
  }));
}

export default function ToastFallingFeathers() {
  const [feathers, setFeathers] = useState<Feather[]>([]);

  const addFeathers = useCallback((type: "success" | "error" | "default" = "default") => {
    const newOnes = spawnFeathers(4 + Math.floor(Math.random() * 3), type);
    setFeathers((prev) => [...prev, ...newOnes]);
    // Remove after longest possible animation (delay + duration + buffer)
    setTimeout(() => {
      setFeathers((prev) => prev.filter((f) => !newOnes.find((n) => n.id === f.id)));
    }, 3500);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ type?: string }>).detail;
      const type = detail?.type === "success"
        ? "success"
        : detail?.type === "error"
        ? "error"
        : "default";
      addFeathers(type);
    };
    window.addEventListener("pg-toast", handler);
    return () => window.removeEventListener("pg-toast", handler);
  }, [addFeathers]);

  if (feathers.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {feathers.map((f) => (
        <div
          key={f.id}
          className="falling-feather"
          style={{
            left: `${f.x}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
            transform: `rotate(${f.rotate}deg)`,
          }}
        >
          <FeatherShape size={f.size} color={f.color} />
        </div>
      ))}
    </div>
  );
}

/** Call this instead of (or alongside) toast() to trigger falling feathers */
export function triggerFeathers(type: "success" | "error" | "default" = "default") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pg-toast", { detail: { type } }));
  }
}
