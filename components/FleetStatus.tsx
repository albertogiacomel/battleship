import React from 'react';
import { PlacedShip, Language } from '../types';
import { cn } from '../lib/utils';
import { Shield, ShieldAlert, Skull } from 'lucide-react';
import { DICTIONARY } from '../lib/translations';

interface FleetStatusProps {
  ships: PlacedShip[];
  isEnemy: boolean;
  className?: string;
  lang: Language;
}

export const FleetStatus: React.FC<FleetStatusProps> = ({ ships, isEnemy, className, lang }) => {
  const t = DICTIONARY[lang];

  const getHealthColor = (hits: number, size: number) => {
    const health = (size - hits) / size;
    if (health === 0) return 'bg-red-900';
    if (health < 0.4) return 'bg-red-500';
    if (health < 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn("bg-white/80 dark:bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/20 shadow-sm transition-all duration-300 w-full", className)}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-ocean-300 mb-2 border-b border-slate-200 dark:border-white/10 pb-1">
         {isEnemy ? <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> : <Shield className="w-3.5 h-3.5 text-green-500" />}
         {isEnemy ? t.enemyIntel : t.alliedStatus}
      </div>
      
      {/* Changed to flex-col (single column) to prevent text truncation on long names like 'Cacciatorpediniere' */}
      <div className="flex flex-col gap-1.5">
        {ships.map(ship => {
          const isSunk = ship.hits === ship.size;
          const shipName = t.ships[ship.id as keyof typeof t.ships] || ship.name;
          
          return (
            <div key={ship.id} className="bg-white/50 dark:bg-white/5 px-2 py-1.5 rounded border border-slate-100 dark:border-white/5 flex items-center justify-between min-w-0 transition-colors hover:bg-white/80 dark:hover:bg-white/10">
               {/* Left: Name */}
               <span className={cn(
                 "text-xs font-bold truncate mr-2 flex-1",
                 isSunk ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"
               )} title={shipName}>
                 {shipName}
               </span>
               
               {/* Right: Status Indicators */}
               <div className="flex items-center gap-2 shrink-0 w-24 justify-end">
                 {isEnemy ? (
                    // Enemy View: Discrete pips or 'Sunk' icon
                    isSunk ? (
                      <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase">
                        <span>{t.lost}</span>
                        <Skull className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="flex gap-0.5">
                        {Array.from({length: ship.size}).map((_, i) => (
                          <div key={i} className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            i < ship.hits ? "bg-red-500" : "bg-slate-300 dark:bg-white/20"
                          )}></div>
                        ))}
                      </div>
                    )
                 ) : (
                    // Allied View: Progress Bar + Percentage
                    <div className="flex flex-col w-full items-end gap-0.5">
                       <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                             className={cn("h-full transition-all duration-500", getHealthColor(ship.hits, ship.size))}
                             style={{ width: `${((ship.size - ship.hits) / ship.size) * 100}%` }}
                          />
                       </div>
                       <span className={cn(
                          "text-[9px] font-mono font-bold leading-none",
                          isSunk ? "text-red-500" : "text-green-500"
                        )}>
                          {isSunk ? t.lost : `${Math.round(((ship.size - ship.hits)/ship.size)*100)}%`}
                       </span>
                    </div>
                 )}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};