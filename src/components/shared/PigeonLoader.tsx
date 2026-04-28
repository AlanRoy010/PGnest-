"use client";

export default function PigeonLoader({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const barHeight = { sm: "h-4", md: "h-6", lg: "h-8" }[size];
  const barWidth = { sm: "w-1.5", md: "w-2", lg: "w-2.5" }[size];
  const gap = { sm: "gap-1", md: "gap-1.5", lg: "gap-2" }[size];

  return (
    <div className={`flex items-end ${gap}`} aria-label="Loading…">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${barWidth} ${barHeight} rounded-full`}
          style={{
            background: i === 0
              ? "#E8734A"
              : i === 1
              ? "#6B7FA3"
              : "#7C6E9E",
            animation: `feather-bounce 0.8s ease-in-out ${i * 0.18}s infinite alternate`,
            transformOrigin: "bottom center",
          }}
        />
      ))}
    </div>
  );
}
