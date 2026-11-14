"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

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

    // Calculate rotation (-15 to 15 deg)
    const rotX = -((y - centerY) / centerY) * 16;
    const rotY = ((x - centerX) / centerX) * 16;

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
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    hero: "w-32 h-32 sm:w-36 sm:h-36",
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* 3D Perspective Viewport */}
      <div
        className="relative perspective-[1200px] cursor-pointer group"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Ambient Halo Glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-indigo-500/20 to-sky-400/30 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

        {/* Floating 3D Card Container */}
        <div
          ref={cardRef}
          style={{
            transform: isHovered
              ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.06, 1.06, 1.06)`
              : `rotateX(6deg) rotateY(-8deg)`,
            transformStyle: "preserve-3d",
            transition: isHovered ? "transform 0.1s ease-out" : "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
          className={`${sizeDimensions[size]} relative rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-white/90 p-3 shadow-[0_20px_50px_rgba(72,128,255,0.28),0_10px_20px_rgba(0,0,0,0.06)] border border-white/80 backdrop-blur-md flex items-center justify-center`}
        >
          {/* Subtle Specular Glare */}
          <div
            style={{
              transform: "translateZ(10px)",
            }}
            className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none opacity-60 group-hover:opacity-90 transition-opacity duration-300"
          />

          {/* Elevated 3D Logo Layer */}
          <div
            style={{
              transform: "translateZ(30px)",
              filter: "drop-shadow(0 12px 16px rgba(15, 23, 42, 0.2))",
            }}
            className="w-full h-full relative flex items-center justify-center"
          >
            <img
              src="/logo.png"
              alt="Epic Craft Logo"
              className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300 pointer-events-none"
            />
          </div>

          {/* Edge Depth Accent */}
          <div
            style={{ transform: "translateZ(5px)" }}
            className="absolute inset-0.5 rounded-[22px] border border-blue-400/20 pointer-events-none"
          />
        </div>
      </div>

      {showSubtitle && (
        <div className="mt-4 text-center">
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
