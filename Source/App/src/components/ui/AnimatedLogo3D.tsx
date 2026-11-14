"use client";

import React, { useState, useRef } from "react";

interface AnimatedLogo3DProps {
  size?: "sm" | "md" | "lg" | "hero";
  className?: string;
  showSubtitle?: boolean;
}

export function AnimatedLogo3D({
  size = "hero",
  className = "",
  showSubtitle = true,
}: AnimatedLogo3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (-18 to 18 deg)
    const rotX = -((y - centerY) / centerY) * 18;
    const rotY = ((x - centerX) / centerX) * 18;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const sizeDimensions = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    hero: "w-36 h-36 sm:w-44 sm:h-44",
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Perspective Stage */}
      <div
        className="relative perspective-[1200px] cursor-pointer group flex items-center justify-center p-4"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Ambient Pulsing Glow Aura */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/35 via-indigo-500/25 to-sky-400/35 rounded-full blur-3xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-glow-3d pointer-events-none" />

        {/* Orbiting Radial Particle Ring */}
        <div className="absolute inset-2 rounded-full border border-blue-400/20 animate-orbit-3d pointer-events-none" />

        {/* 3D Elevated Card with Continuous Animation */}
        <div
          ref={cardRef}
          style={
            isHovered
              ? {
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.08, 1.08, 1.08)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.08s ease-out",
                }
              : {
                  transformStyle: "preserve-3d",
                  transition: "transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }
          }
          className={`${sizeDimensions[size]} ${
            !isHovered ? "animate-float-3d" : ""
          } relative rounded-3xl bg-gradient-to-br from-white via-[#F5F8FF] to-white/95 p-4 shadow-[0_25px_60px_-15px_rgba(72,128,255,0.4),0_15px_30px_rgba(0,0,0,0.08)] border-2 border-white/90 backdrop-blur-xl flex items-center justify-center`}
        >
          {/* Internal Specular Glass Highlight */}
          <div
            style={{ transform: "translateZ(15px)" }}
            className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/50 to-transparent pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity duration-300"
          />

          {/* Elevated 3D Logo Layer */}
          <div
            style={{
              transform: "translateZ(38px)",
              filter: "drop-shadow(0 14px 20px rgba(15, 23, 42, 0.25))",
            }}
            className="w-full h-full relative flex items-center justify-center"
          >
            <img
              src="/logo.png"
              alt="Epic Craft Official Logo"
              className="w-full h-full object-contain pointer-events-none transform group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Inner Glowing Bevel */}
          <div
            style={{ transform: "translateZ(8px)" }}
            className="absolute inset-1 rounded-[22px] border border-blue-400/25 pointer-events-none"
          />
        </div>
      </div>

      {showSubtitle && (
        <div className="mt-2 text-center">
          <h1 className="text-2xl font-black text-dash-textPrimary tracking-tight">
            Epic Craft
          </h1>
          <p className="text-xs font-semibold text-dash-textSecondary mt-1">
            Enterprise Project Progress & Workspace Tracker
          </p>
        </div>
      )}
    </div>
  );
}
