"use client";

import { useState } from "react";

export default function PigeonLogo({
  size = "md",
  showTagline = false,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const dims = { sm: 28, md: 36, lg: 48 }[size];
  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  }[size];

  return (
    <div
      className="flex items-center gap-2 select-none cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pigeon SVG */}
      <div
        style={{
          width: dims,
          height: dims,
          animation: hovered ? "none" : "pigeon-bob 3s ease-in-out infinite",
        }}
      >
        <svg
          width={dims}
          height={dims}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body */}
          <ellipse cx="32" cy="38" rx="18" ry="14" fill="#B8C4D8" />
          {/* Wing highlight */}
          <ellipse cx="28" cy="40" rx="12" ry="8" fill="#6B7FA3" opacity="0.6" />
          {/* Belly */}
          <ellipse cx="36" cy="42" rx="10" ry="8" fill="#FDFBF8" opacity="0.9" />
          {/* Head */}
          <circle
            cx={hovered ? "42" : "40"}
            cy="22"
            r="11"
            fill="#B8C4D8"
            style={{
              transition: "cx 0.3s ease",
              transformOrigin: "40px 26px",
              transform: hovered ? "rotate(-10deg)" : "rotate(0deg)",
            }}
          />
          {/* Iridescent neck patch */}
          <ellipse cx="36" cy="30" rx="5" ry="4" fill="#7C6E9E" opacity="0.5" />
          {/* Eye */}
          <circle cx={hovered ? "44" : "43"} cy="20" r="2.5" fill="#2C3040" />
          <circle cx={hovered ? "44.8" : "43.8"} cy="19.2" r="0.8" fill="white" />
          {/* Beak */}
          <path
            d={hovered ? "M51 22 L57 21 L51 24 Z" : "M50 22 L56 21 L50 24 Z"}
            fill="#E8734A"
          />
          {/* Tail */}
          <path d="M14 42 L8 50 L16 46 L12 54 L20 48 Z" fill="#6B7FA3" opacity="0.8" />
          {/* Feet */}
          <line x1="28" y1="50" x2="24" y2="56" stroke="#E8734A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="56" x2="20" y2="58" stroke="#E8734A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="24" y1="56" x2="22" y2="59" stroke="#E8734A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="36" y1="51" x2="32" y2="57" stroke="#E8734A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="57" x2="28" y2="59" stroke="#E8734A" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="57" x2="30" y2="60" stroke="#E8734A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <div className={`font-display font-bold ${textSizes} leading-none`}>
          <span style={{ color: "#6B7FA3" }}>PG</span>
          <span style={{ color: "#E8734A" }}>Owns</span>
        </div>
        {showTagline && (
          <span className="text-xs mt-0.5" style={{ color: "#7A7A8A", fontFamily: "var(--font-body)" }}>
            Find your flock
          </span>
        )}
      </div>
    </div>
  );
}
