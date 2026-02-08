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
    <div className={cn("bg-white/80 dark:bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/20 shadow-sm transition-all duration-300", className)}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-ocean-300 mb-2">
         {isEnemy ? <ShieldAlert className="w-3 h-3 text-red-500" /> : <Shield className="w-3 h-3 text-green-500" />}
         {isEnemy ? t.enemyIntel : t.alliedStatus}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ships.map(ship => {
          const isSunk = ship.hits === ship.size;
          const shipName = t.ships[ship.id as keyof typeof t.ships] || ship.name;
          return (
            <div key={ship.id} className="bg-white/50 dark:bg-white/5 p-2 rounded border border-slate-100 dark:border-white/5 flex flex-col justify-center min-w-0 transition-colors hover:bg-white/80 dark:hover:bg-white/10">
               {/* Header Row: Name + Status/Percentage */}
               <div className="flex justify-between items-center mb-1.5 w-full">
                  <span className={cn(
                    "text-xs font-bold truncate mr-2",
                    isSunk ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"
                  )} title={shipName}>
                    {shipName}
                  </span>
                  
                  {isEnemy ? (
                    isSunk ? <Skull className="w-3 h-3 text-red-600 shrink-0" /> : <span className="text-xs text-slate-400 font-bold shrink-0">?</span>
                  ) : (
                    <span className={cn(
                      "text-[10px] font-mono font-bold tabular-nums shrink-0",
                      isSunk ? "text-red-500" : "text-green-500"
                    )}>
                      {isSunk ? t.lost : `${Math.round(((ship.size - ship.hits)/ship.size)*100)}%`}
                    </span>
                  )}
               </div>
               
               {/* Progress Bar (Allies) */}
               {!isEnemy && (
                 <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                       className={cn("h-full transition-all duration-500", getHealthColor(ship.hits, ship.size))}
                       style={{ width: `${((ship.size - ship.hits) / ship.size) * 100}%` }}
                    />
                 </div>
               )}

               {/* Hit Counters (Enemy) */}
               {isEnemy && (
                 <div className="flex gap-1 h-1.5 items-center">
                    {Array.from({length: ship.size}).map((_, i) => (
                      <div key={i} className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSunk ? "bg-red-900/40" : "bg-slate-300 dark:bg-white/20"
                      )}></div>
                    ))}
                 </div>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};