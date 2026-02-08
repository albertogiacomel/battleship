import React, { useState } from 'react';
import { Grid, PlacedShip, ShipConfig, Coordinate, Language } from '../types';
import Cell from './Cell';
import ShipGraphic from './ShipGraphic';
import { getShipCoordinates } from '../lib/gameLogic';
import { cn } from '../lib/utils';
import { DICTIONARY } from '../lib/translations';

interface BoardProps {
  grid: Grid;
  ships?: PlacedShip[]; 
  isPlayer?: boolean;
  onCellClick?: (x: number, y: number) => void;
  isPlacementPhase?: boolean;
  currentShipToPlace?: ShipConfig | null;
  orientation?: 'horizontal' | 'vertical';
  onPlaceShip?: (x: number, y: number) => void;
  className?: string;
  title: string;
  lang?: Language;
}

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const Board: React.FC<BoardProps> = ({
  grid,
  ships,
  isPlayer,
  onCellClick,
  isPlacementPhase,
  currentShipToPlace,
  orientation = 'horizontal',
  onPlaceShip,
  className,
  title,
  lang = 'en'
}) => {
  const [hoverCoord, setHoverCoord] = useState<Coordinate | null>(null);
  const t = DICTIONARY[lang];

  let previewCoords: Coordinate[] = [];
  let isPreviewValid = false;
  let previewShip: PlacedShip | null = null;

  if (isPlacementPhase && currentShipToPlace && hoverCoord) {
    const isValidBoundary = orientation === 'horizontal' 
      ? hoverCoord.x + currentShipToPlace.size <= 10
      : hoverCoord.y + currentShipToPlace.size <= 10;
      
    if (isValidBoundary) {
       previewCoords = getShipCoordinates(currentShipToPlace, hoverCoord.x, hoverCoord.y, orientation as 'horizontal' | 'vertical');
       const hasCollision = previewCoords.some(c => grid[c.y][c.x].status !== 'empty');
       isPreviewValid = !hasCollision;

       previewShip = {
         ...currentShipToPlace,
         x: hoverCoord.x,
         y: hoverCoord.y,
         orientation: orientation as 'horizontal' | 'vertical',
         hits: 0
       };
    }
  }

  // --- STYLE FIX FOR ROW 10 ---
  // To ensure rows align perfectly with the grid, the numbers container must simulate 
  // the EXACT same borders and padding as the grid container, even if transparent.
  const commonContainerStyles = "border-[2px] sm:border-[3px] p-[2px] sm:p-1 rounded-lg";

  return (
    <div className={cn("flex flex-col gap-1 sm:gap-2", className)}>
      <div className="h-6 sm:h-8 flex items-center">
        <h3 className="text-base sm:text-xl font-black tracking-wider flex items-center gap-2 drop-shadow-sm text-slate-800 dark:text-ocean-100 whitespace-nowrap overflow-hidden">
          <span className="truncate">{title}</span>
          {isPlayer && <span className="text-[9px] sm:text-[10px] bg-blue-600 dark:bg-ocean-600 text-white px-2 py-0.5 rounded-full shadow-sm align-middle shrink-0">{t.you}</span>}
          {!isPlayer && <span className="text-[9px] sm:text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm align-middle shrink-0">{t.enemy}</span>}
        </h3>
      </div>
      
      <div className="flex">
        {/* Row Numbers (Left Side) */}
        {/* FIX: Using grid-rows-10 and applying transparent borders/padding to match the Game Grid exactly */}
        <div className={cn(
          "grid grid-rows-10 gap-px pr-1 sm:pr-2 text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-ocean-300 select-none",
          commonContainerStyles,
          "border-transparent" // Invisible border just for spacing
        )}>
          {ROWS.map(r => (
            <div key={r} className="flex items-center justify-end w-3 sm:w-4">
              {r}
            </div>
          ))}
        </div>

        <div className="flex-1">
          {/* Column Letters (Top Side) */}
          <div className="grid grid-cols-10 mb-0.5 text-[8px] sm:text-[10px] font-bold text-slate-400 dark:text-ocean-300 text-center select-none px-[2px] sm:px-1">
             {COLS.map(c => <div key={c}>{c}</div>)}
          </div>

          {/* The Game Grid */}
          <div 
            className={cn(
                "grid grid-cols-10 gap-px relative select-none transition-colors overflow-hidden shadow-2xl",
                commonContainerStyles, // Shared sizing logic
                // Light Mode
                "bg-slate-200 border-white shadow-blue-200", 
                // Dark Mode
                "dark:bg-ocean-900 dark:border-ocean-700 dark:shadow-black/50" 
            )}
            onMouseLeave={() => setHoverCoord(null)}
          >
            {/* Render Placed Ships (Player or Sunk Enemy) */}
            {ships && ships.map(ship => (
              (isPlayer || ship.hits === ship.size) && (
                <ShipGraphic key={ship.id} ship={ship} className={ship.hits === ship.size ? "opacity-50 grayscale" : ""} />
              )
            ))}

            {/* Render Preview Ship (Real look, Instant Snap) */}
            {previewShip && (
              <ShipGraphic 
                ship={previewShip}
                isPreview={true} 
                className={cn(
                  "pointer-events-none",
                  isPreviewValid 
                    ? "opacity-90" // Real look, slightly transparent
                    : "opacity-60 grayscale sepia hue-rotate-[320deg] saturate-[5] contrast-125" // Red tint for error
                )} 
              />
            )}

            {/* Grid Cells */}
            {grid.map((row, y) => (
              row.map((cell, x) => {
                const isPreview = previewCoords.some(c => c.x === x && c.y === y);
                
                return (
                  <Cell
                    key={`${x}-${y}`}
                    cell={cell}
                    isPlayer={isPlayer} 
                    showShip={false} 
                    isPreview={isPreview}
                    previewValid={isPreviewValid}
                    onClick={() => {
                      if (isPlacementPhase && onPlaceShip) {
                        onPlaceShip(x, y);
                      } else if (onCellClick) {
                        onCellClick(x, y);
                      }
                    }}
                    disabled={(!isPlacementPhase && isPlayer) || (!isPlacementPhase && !onCellClick)}
                  />
                );
              })
            ))}
            
            {/* Interactive Layer for Hover Detection */}
            {grid.map((row, y) => 
               row.map((cell, x) => (
                 <div 
                   key={`hover-${x}-${y}`}
                   className="absolute w-[10%] h-[10%] z-40 opacity-0 cursor-crosshair"
                   style={{ left: `${x * 10}%`, top: `${y * 10}%` }}
                   onMouseEnter={() => setHoverCoord({ x, y })}
                   onClick={() => {
                     if (isPlacementPhase && onPlaceShip) {
                        onPlaceShip(x, y);
                      } else if (onCellClick) {
                        onCellClick(x, y);
                      }
                   }}
                 />
               ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;