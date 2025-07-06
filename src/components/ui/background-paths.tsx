// components/background-paths.tsx
import * as React from "react";

export function BackgroundPaths({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 1024 1024"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: -1 }}
    >
      <defs>
        <linearGradient id="gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <path
        d="M0,512 Q512,0 1024,512 T1024,1024 Q512,512 0,1024 Z"
        fill="url(#gradient)"
        fillOpacity="0.1"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 512 512"
          to="360 512 512"
          dur="30s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
