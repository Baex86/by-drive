// components/ByDriveIcon.tsx
import React from 'react';

interface ByDriveIconProps {
  className?: string;
}

export default function ByDriveIcon({ className = "w-10 h-10" }: ByDriveIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BY Drive Logo"
    >
      {/* Garis Infinity Cloud */}
      <path
        d="M 25 45 C 10 45 10 20 25 20 C 35 20 40 30 50 30 C 60 30 65 20 75 20 C 90 20 90 45 75 45 C 65 45 60 35 50 35 C 40 35 35 45 25 45 Z"
        stroke="#2A0510"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300 hover:stroke-[#4a0920]"
      />
      
      {/* Central Node (Aggregator Core) */}
      <circle 
        cx="50" 
        cy="32.5" 
        r="4" 
        fill="#2A0510" 
        className="animate-pulse"
      />
    </svg>
  );
}