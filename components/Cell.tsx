import React from 'react';
import { CellData } from '../types';
import { cn } from '../lib/utils';
import { Circle, X } from 'lucide-react';
import { GAME_ASSETS } from '../constants';

interface CellProps {
  cell: CellData;
  onClick?: () => void;
  showShip?: boolean;
  disabled?: boolean;
  isPreview?: boolean;
  previewValid?: boolean;
  className?: string;
  isPlayer?: boolean; // Added to determine fog visibility
}

const Cell: React.FC<CellProps> = ({ 
  cell, 
  onClick, 
  showShip, 
  disabled, 
  isPreview, 
  previewValid,
  className,
  isPlayer = false
}) => {
  const isShip = cell.status === 'ship' || cell.status === 'sunk';
  const isHit = cell.status === 'hit' || cell.status === 'sunk';
  const isMiss = cell.status === 'miss';
  const isSunk = cell.status === 'sunk';
  
  const isFoggy = !isPlayer && (cell.status === 'empty' || cell.status === 'ship');
  
  const hasVisibleShip = (isPlayer && isShip) || isSunk || (isHit && !isPlayer && cell.shipId);
  const showWater = !isFoggy && !hasVisibleShip;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "relative w-full h-full aspect-square border border-white/5 flex items-center justify-center transition-all duration-200 overflow-hidden",
        "bg-ocean-950",
        !disabled && !isHit && !isMiss && "cursor-crosshair",
        // Subtle Preview Borders/Tint behind the SVG
        isPreview && previewValid && "after:absolute after:inset-0 after:bg-green-500/10 after:border after:border-green-400/50 after:z-20",
        isPreview && !previewValid && "after:absolute after:inset-0 after:bg-red-500/10 after:border after:border-red-400/50 after:z-20",
        className
      )}
    >
      {/* 1. Base Layer: Fog or Water */}
      {isFoggy && (
        <img 
          src={GAME_ASSETS.fog} 
          alt="Fog" 
          className="absolute inset-0 w-full h-full object-cover z-10 opacity-90 animate-in fade-in duration-700"
        />
      )}

      {showWater && (
        <img 
          src={GAME_ASSETS.water} 
          alt="Water" 
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
        />
      )}

      {/* 2. Ship Visibility handled by ShipGraphic in Board.tsx */}

      {/* 3. Status Overlays (Fire, Miss) */}
      
      {isHit && !isSunk && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
           <img 
             src={GAME_ASSETS.fire} 
             alt="Fire" 
             className="w-full h-full object-contain animate-pulse-fast drop-shadow-lg scale-125"
           />
        </div>
      )}

      {/* MISS Marker */}
      {isMiss && (
        <div className="absolute inset-0 z-20 flex items-center justify-center animate-in fade-in zoom-in duration-300 pointer-events-none">
           <div className="w-3 h-3 bg-white/40 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
        </div>
      )}
      
      {/* Grid line effect (subtle) */}
      <div className="absolute inset-0 pointer-events-none border border-white/5 z-30"></div>
    </div>
  );
};

export default React.memo(Cell);