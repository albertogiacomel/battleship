import React from 'react';
import { ShipConfig, GamePhase, PlayerType, Grid, PlacedShip, Difficulty } from '../types';
import { RotateCcw, Shuffle, Play, Trophy, Anchor, Settings2, Link, BrainCircuit } from 'lucide-react';
import { cn } from '../lib/utils';
import ShipSVG from './ShipSVG';

interface GameControlsProps {
  phase: GamePhase;
  orientation: 'horizontal' | 'vertical';
  setOrientation: (o: 'horizontal' | 'vertical') => void;
  unplacedShips: ShipConfig[];
  onRandomize: () => void;
  onReset: () => void;
  onStart: () => void;
  winner: PlayerType | null;
  currentShip: ShipConfig | null;
  humanGrid?: Grid;
  aiGrid?: Grid;
  humanShips?: PlacedShip[];
  aiShips?: PlacedShip[];
  aiEndpoint: string;
  setAiEndpoint: (s: string) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  phase,
  orientation,
  setOrientation,
  unplacedShips,
  onRandomize,
  onReset,
  onStart,
  winner,
  currentShip,
  humanGrid,
  aiGrid,
  humanShips = [],
  aiShips = [],
  aiEndpoint,
  setAiEndpoint,
  difficulty,
  setDifficulty
}) => {
  // Stats Calculation
  const calculateStats = () => {
    if (!humanGrid || !aiGrid) return { playerShots: 0, enemyShots: 0, playerFleet: 0, enemyFleet: 0 };
    const playerShots = aiGrid.flat().filter(c => c.status === 'hit' || c.status === 'miss' || c.status === 'sunk').length;
    const enemyShots = humanGrid.flat().filter(c => c.status === 'hit' || c.status === 'miss' || c.status === 'sunk').length;
    const playerFleet = humanShips.filter(s => s.hits < s.size).length;
    const enemyFleet = aiShips.filter(s => s.hits < s.size).length;
    return { playerShots, enemyShots, playerFleet, enemyFleet };
  };

  const stats = calculateStats();
  const [showSettings, setShowSettings] = React.useState(false);

  if (phase === 'gameover') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-xl border backdrop-blur-lg animate-in zoom-in shadow-2xl transition-colors",
        "bg-white/80 border-slate-200 shadow-blue-100",
        "dark:bg-ocean-900/50 dark:border-ocean-500/30 dark:shadow-none"
      )}>
        <Trophy className={cn("w-16 h-16 mb-4", winner === 'human' ? "text-amber-500 dark:text-yellow-400" : "text-red-500")} />
        <h2 className="text-3xl font-black mb-2 text-slate-800 dark:text-white">
          {winner === 'human' ? "VICTORY!" : "DEFEAT"}
        </h2>
        <p className="text-slate-600 dark:text-ocean-200 mb-6 text-center font-medium">
          {winner === 'human' 
            ? "Admiral, you've neutralized the enemy fleet." 
            : "Your fleet has been decimated. Better luck next time."}
        </p>
        
        <div className="grid grid-cols-2 gap-4 w-full mb-6 text-sm">
           <div className="bg-slate-100 dark:bg-ocean-950/50 p-3 rounded text-center border border-slate-200 dark:border-transparent">
              <div className="text-slate-500 dark:text-ocean-400 text-xs uppercase mb-1 font-bold">Total Shots</div>
              <div className="text-xl font-mono font-bold text-slate-800 dark:text-white">{stats.playerShots}</div>
           </div>
           <div className="bg-slate-100 dark:bg-ocean-950/50 p-3 rounded text-center border border-slate-200 dark:border-transparent">
              <div className="text-slate-500 dark:text-ocean-400 text-xs uppercase mb-1 font-bold">Enemy Surviving</div>
              <div className="text-xl font-mono font-bold text-slate-800 dark:text-white">{stats.enemyFleet} / {aiShips.length}</div>
           </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-ocean-600 dark:hover:bg-ocean-500 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </div>
    );
  }

  if (phase === 'playing') {
    return null; // Tactical Summary rendered in App.tsx
  }

  return (
    <div className={cn(
      "flex flex-col gap-6 p-6 rounded-xl border transition-colors",
      "bg-white/80 border-slate-200 shadow-xl shadow-blue-100",
      "dark:bg-ocean-900/40 dark:border-ocean-500/20 dark:shadow-none"
    )}>
      {/* ... Setup Controls ... */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Deploy Your Fleet</h3>
          <p className="text-slate-500 dark:text-ocean-200 text-sm font-medium">
            Place ships. Press <span className="font-mono bg-slate-200 dark:bg-ocean-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-white">R</span> to rotate.
          </p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "p-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-bold uppercase",
            showSettings ? "bg-blue-100 text-blue-600 dark:bg-ocean-800 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-ocean-300 dark:hover:text-white"
          )}
        >
          <Settings2 className="w-4 h-4" />
          Settings
        </button>
      </div>

      {showSettings && (
        <div className="p-4 bg-slate-100 dark:bg-black/20 rounded-lg space-y-4 animate-in slide-in-from-top-2 border border-slate-200 dark:border-white/5">
           <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-ocean-300 flex items-center gap-2">
                <Link className="w-3 h-3" /> External AI Endpoint
              </label>
              <input 
                type="text" 
                value={aiEndpoint}
                onChange={(e) => setAiEndpoint(e.target.value)}
                placeholder="https://api.example.com/battleship/move"
                className="w-full text-xs p-2 rounded border bg-white dark:bg-ocean-950/50 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 dark:text-ocean-400">
                Optional. Leave empty to use local AI.
              </p>
           </div>
        </div>
      )}

      {/* AI Difficulty Selector */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-400 dark:text-ocean-300 uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-4 h-4" />
          AI Intelligence
        </span>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className={cn(
                "py-2 px-1 rounded-md text-[10px] sm:text-xs font-bold uppercase transition-all text-center",
                difficulty === level
                  ? "bg-white dark:bg-ocean-600 text-blue-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-slate-500 dark:text-ocean-400 hover:bg-white/50 dark:hover:bg-white/10"
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between mb-2">
           <span className="text-sm font-bold text-slate-400 dark:text-ocean-300 uppercase tracking-wider">Remaining Ships:</span>
        </div>
        <div className="space-y-2">
          {unplacedShips.length === 0 ? (
            <div className="text-green-600 dark:text-green-400 font-bold py-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              All ships ready!
            </div>
          ) : (
             unplacedShips.map(ship => (
               <div 
                 key={ship.id}
                 className={cn(
                   "flex items-center justify-between p-3 rounded-lg border transition-all font-medium overflow-hidden",
                   currentShip?.id === ship.id 
                     ? "border-blue-500 bg-blue-50 text-blue-900 dark:border-ocean-400 dark:bg-ocean-700/50 dark:text-white scale-[1.02] shadow-sm"
                     : "border-transparent bg-slate-100 text-slate-600 dark:bg-ocean-800/50 dark:text-gray-300"
                 )}
               >
                 <span className="z-10 relative">{ship.name}</span>
                 {/* Preview of Ship SVG */}
                 <div className="w-24 h-6 relative opacity-80" style={{ transformOrigin: 'center right' }}>
                    <ShipSVG shipId={ship.id} className="w-full h-full" />
                 </div>
               </div>
             ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-lg transition-all font-semibold border",
            "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200",
            "dark:bg-ocean-800 dark:hover:bg-ocean-700 dark:text-white dark:border-ocean-600"
          )}
        >
          <RotateCcw className={cn("w-4 h-4 transition-transform", orientation === 'vertical' ? 'rotate-90' : '')} />
          {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
        </button>

        <button
          onClick={onRandomize}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-lg transition-all font-semibold border",
            "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200",
            "dark:bg-ocean-800 dark:hover:bg-ocean-700 dark:text-white dark:border-ocean-600"
          )}
        >
          <Shuffle className="w-4 h-4" />
          Randomize
        </button>
      </div>

      <button
        onClick={onStart}
        disabled={unplacedShips.length > 0}
        className={cn(
          "w-full py-4 text-lg font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all",
          unplacedShips.length > 0
            ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
            : "bg-green-600 hover:bg-green-500 text-white hover:scale-[1.02] shadow-green-500/30"
        )}
      >
        <Play className="fill-current" />
        START BATTLE
      </button>
    </div>
  );
};

export default GameControls;