import React, { useState, useEffect } from 'react';
import { PlacedShip } from '../types';
import { cn } from '../lib/utils';
import { Skull } from 'lucide-react';
import ShipSVG from './ShipSVG';

interface ShipGraphicProps {
  ship: PlacedShip;
  className?: string;
  isPreview?: boolean;
}

const ShipGraphic: React.FC<ShipGraphicProps> = ({ ship, className, isPreview = false }) => {
  const isHorizontal = ship.orientation === 'horizontal';
  const isSunk = ship.hits === ship.size;
  
  // State for hit animation
  const [isHit, setIsHit] = useState(false);
  // State for random sunk tilt and sink depth
  const [sunkTransform] = useState(() => 
    isSunk ? {
      tilt: (Math.random() - 0.5) * 12,
      depth: 2 + Math.random() * 4,
      skew: (Math.random() - 0.5) * 5
    } : { tilt: 0, depth: 0, skew: 0 }
  );

  useEffect(() => {
    if (ship.hits > 0 && ship.hits < ship.size) {
      setIsHit(true);
      const timer = setTimeout(() => setIsHit(false), 500);
      return () => clearTimeout(timer);
    }
  }, [ship.hits, ship.size]);

  // Outer container: Positions the bounding box on the grid
  const containerStyle: React.CSSProperties = {
    left: `${ship.x * 10 + 0.5}%`,
    top: `${ship.y * 10 + 0.5}%`,
    width: isHorizontal ? `${ship.size * 10 - 1}%` : '9%',
    height: isHorizontal ? '9%' : `${ship.size * 10 - 1}%`,
    // Preview stays on top (30). Alive ships (20). Sunk ships (10).
    zIndex: isPreview ? 30 : (isSunk ? 10 : 20), 
    // Disable transition for preview to ensure "direct" movement
    transition: isPreview ? 'none' : 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  // Inner container
  const innerStyle: React.CSSProperties = {
     width: '100%',
     height: '100%',
  };

  // Animation Transforms
  const animStyle: React.CSSProperties = {
    transform: isHit 
      ? 'scale(0.95)' 
      : isSunk 
        ? `translateY(${sunkTransform.depth}px) rotate(${sunkTransform.tilt}deg) skewX(${sunkTransform.skew}deg)` 
        : 'none',
    // Apply filter only if hit or sunk. Otherwise 'none' lets parent filter (from className) pass through visually.
    filter: isHit 
      ? 'brightness(1.5) sepia(0.5) hue-rotate(-30deg)' 
      : isSunk 
        ? 'sepia(0.8) hue-rotate(-15deg) brightness(0.4) contrast(1.1)' 
        : 'none',
    transition: isPreview ? 'none' : 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const renderDamageEffects = () => {
    if (isSunk) {
      return (
        <div className="absolute inset-0 pointer-events-none z-10" style={isHorizontal ? {} : { transform: 'rotate(-90deg)' }}>
           <div className="absolute inset-[-10%] bg-black/40 blur-md rounded-full opacity-60" />
           <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />
        </div>
      );
    }
    
    if (ship.hits > 0) {
      return (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-red-500/10 animate-pulse rounded-full blur-xl" />
        </div>
      );
    }
    return null;
  };

  const renderSunkOverlay = () => {
    if (!isSunk) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <div className="relative">
          <div className="absolute inset-0 bg-red-900/50 blur-lg animate-pulse" />
          <div className="relative bg-black/80 p-1.5 rounded-full border border-red-900/50 shadow-2xl backdrop-blur-sm transform hover:scale-110 transition-transform">
            <Skull className="w-5 h-5 text-red-500/90" strokeWidth={2.5} />
          </div>
        </div>
        <svg className="absolute inset-0 w-full h-full mix-blend-multiply opacity-80" preserveAspectRatio="none">
           <filter id="noise">
             <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
           </filter>
           <rect width="100%" height="100%" filter="url(#noise)" opacity="0.5" />
           <path d="M0 0 L100 100 M100 0 L0 100" stroke="rgba(0,0,0,0.5)" strokeWidth="1" strokeDasharray="5,5" />
        </svg>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "absolute pointer-events-none ship-container flex items-center justify-center",
        isSunk ? "ship-sunk" : (isPreview ? "" : "ship-alive"), // Disable float animation for preview
        className
      )}
      style={containerStyle}
    >
      <div 
        className={cn(
          "relative flex items-center justify-center p-0.5",
        )}
        style={{...innerStyle, ...animStyle}}
      >
        <div className={cn(
          "w-full h-full",
          // Only animate transitions if not preview
          !isPreview && "transition-all duration-300",
          isHit && "animate-shake",
          isSunk && "animate-pulse"
        )}>
          <ShipSVG 
            shipId={ship.id} 
            isSunk={isSunk} 
            orientation={ship.orientation} 
            className="w-full h-full" 
          />
        </div>
        
        {renderDamageEffects()}
        {renderSunkOverlay()}
      </div>
    </div>
  );
};

export default ShipGraphic;