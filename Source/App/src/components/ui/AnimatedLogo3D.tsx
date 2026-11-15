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
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-36 h-36",
    hero: "w-44 h-44 sm:w-52 sm:h-52",
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
        {/* Ambient Warm Golden Glow Aura */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/35 via-yellow-400/25 to-amber-600/35 rounded-full blur-3xl opacity-80 group-hover:opacity-100 transition-opacity duration-500 animate-pulse-glow-3d pointer-events-none" />

        {/* Orbiting Golden Ring */}
        <div className="absolute inset-2 rounded-full border border-amber-400/30 animate-orbit-3d pointer-events-none" />

        {/* 3D Circular Medallion */}
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
          } relative rounded-full bg-[#24282B] p-1.5 shadow-[0_25px_60px_-10px_rgba(217,119,6,0.45),0_15px_30px_rgba(0,0,0,0.6)] border-4 border-amber-400/80 ring-2 ring-amber-500/40 flex items-center justify-center overflow-hidden`}
        >
          {/* Specular Light Sweep Across Golden Disc */}
          <div
            style={{ transform: "translateZ(20px)" }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-amber-200/20 to-transparent pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />

          {/* Elevated Golden Compass & Eagle Logo Layer */}
          <div
            style={{
              transform: "translateZ(30px)",
              filter: "drop-shadow(0 10px 18px rgba(0, 0, 0, 0.5))",
            }}
            className="w-full h-full relative rounded-full overflow-hidden flex items-center justify-center"
          >
            <img
              src="/logo-circle.png"
              alt="Epic Craft Golden Medallion Logo"
              className="w-full h-full object-cover pointer-events-none transform group-hover:scale-105 transition-transform duration-300 select-none"
            />
          </div>

          {/* Inner Golden Rim Bevel */}
          <div
            style={{ transform: "translateZ(10px)" }}
            className="absolute inset-1 rounded-full border border-amber-300/40 pointer-events-none"
          />
        </div>
      </div>

      {showSubtitle && (
        <div className="mt-3 text-center">
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
