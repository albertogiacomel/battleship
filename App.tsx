import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { SHIPS } from './constants';
import { 
  createEmptyGrid, 
  randomPlacement, 
  isValidPlacement, 
  placeShip, 
  calculateAIMove,
  getShipCoordinates
} from './lib/gameLogic';
import { 
  GameState, 
  PlayerType, 
  PlacedShip, 
  Coordinate,
  Language,
  Theme,
  Difficulty
} from './types';
import Board from './components/Board';
import GameControls from './components/GameControls';
import { FleetStatus } from './components/FleetStatus';
import { Anchor, Radar, Maximize, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { cn } from './lib/utils';
import { DICTIONARY } from './lib/translations';
import { playGameSound } from './lib/sound';

const STORAGE_KEY = 'battleship_save_v1';

const App: React.FC = () => {
  // --- Settings State ---
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aiEndpoint, setAiEndpoint] = useState<string>('');

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    turn: 'human',
    winner: null,
    humanShips: [],
    aiShips: [],
    humanGrid: createEmptyGrid(),
    aiGrid: createEmptyGrid(),
    logs: [DICTIONARY.en.deployMsg],
  });

  const t = DICTIONARY[lang];

  // Setup State
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [setupShips, setSetupShips] = useState<PlacedShip[]>([]);
  const [setupGrid, setSetupGrid] = useState(createEmptyGrid());

  // --- Persistence & Initialization ---
  
  // Load State
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only restore if valid phase
        if (parsed.gameState && parsed.gameState.phase !== 'setup') {
          setGameState(parsed.gameState);
        }
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
  }, []);

  // Save State
  useEffect(() => {
    if (gameState.phase === 'playing' || gameState.phase === 'gameover') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameState }));
    }
  }, [gameState]);

  // Apply Theme Class
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  // Keyboard Shortcut for Rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        gameState.phase === 'setup' && 
        (e.key === 'r' || e.key === 'R') && 
        (e.target as HTMLElement).tagName !== 'INPUT'
      ) {
        setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.phase]);

  // --- Helpers ---
  const playSfx = (type: 'hit' | 'miss' | 'sunk' | 'start' | 'click') => {
    if (soundEnabled) playGameSound(type);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const getLogColor = (log: string) => {
    const l = log.toLowerCase();
    if (l.includes('hit') || l.includes('sunk') || l.includes('colpo') || l.includes('affondata')) return 'text-red-600 dark:text-red-400';
    if (l.includes('miss') || l.includes('mancato')) return 'text-blue-600 dark:text-blue-300';
    if (l.includes('victory') || l.includes('vittoria')) return 'text-amber-600 dark:text-yellow-400';
    return 'text-slate-600 dark:text-ocean-200';
  };

  const getCoordinateString = (x: number, y: number) => {
    return `${String.fromCharCode(65 + x)}${y + 1}`;
  };

  // --- Setup Handlers ---

  const handleRandomize = useCallback(() => {
    const { grid, ships } = randomPlacement();
    setSetupGrid(grid);
    setSetupShips(ships);
    setCurrentShipIndex(SHIPS.length);
    playSfx('click');
  }, [soundEnabled]);

  const handlePlaceShip = (x: number, y: number) => {
    if (currentShipIndex >= SHIPS.length) return;
    const shipConfig = SHIPS[currentShipIndex];
    
    if (isValidPlacement(shipConfig, x, y, orientation, setupShips)) {
      const newShip: PlacedShip = { ...shipConfig, x, y, orientation, hits: 0 };
      setSetupShips([...setupShips, newShip]);
      setSetupGrid(placeShip(setupGrid, newShip));
      setCurrentShipIndex(prev => prev + 1);
      playSfx('click');
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState({
      phase: 'setup',
      turn: 'human',
      winner: null,
      humanShips: [],
      aiShips: [],
      humanGrid: createEmptyGrid(),
      aiGrid: createEmptyGrid(),
      logs: [t.deployMsg],
    });
    setSetupShips([]);
    setSetupGrid(createEmptyGrid());
    setCurrentShipIndex(0);
    playSfx('click');
  };

  const handleStartGame = () => {
    const { grid: aiGrid, ships: aiShips } = randomPlacement();
    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      humanShips: setupShips,
      humanGrid: setupGrid,
      aiShips: aiShips,
      aiGrid: aiGrid,
      logs: [t.battleStart, ...prev.logs],
    }));
    playSfx('start');
  };

  // --- Game Loop Handlers ---

  const handleHumanFire = (x: number, y: number) => {
    if (gameState.phase !== 'playing' || gameState.turn !== 'human') return;

    const targetCell = gameState.aiGrid[y][x];
    if (['hit', 'miss', 'sunk'].includes(targetCell.status)) return;

    const isHit = targetCell.status === 'ship';
    let newStatus: 'hit' | 'miss' = isHit ? 'hit' : 'miss';
    
    // Calculate Log Message
    const coord = getCoordinateString(x, y);
    let resultStr = isHit ? t.hit : t.miss;
    
    let winner: PlayerType | null = null;
    let nextTurn: PlayerType = isHit ? 'human' : 'ai'; 

    const newAiGrid = gameState.aiGrid.map(row => row.map(c => ({...c})));
    let newAiShips = gameState.aiShips.map(s => ({...s}));

    newAiGrid[y][x].status = newStatus;

    if (isHit) {
      playSfx('hit');
      const shipIndex = newAiShips.findIndex(s => s.id === targetCell.shipId);
      if (shipIndex !== -1) {
        newAiShips[shipIndex].hits += 1;
        
        if (newAiShips[shipIndex].hits === newAiShips[shipIndex].size) {
          const shipId = newAiShips[shipIndex].id;
          const shipName = t.ships[shipId as keyof typeof t.ships] || newAiShips[shipIndex].name;
          resultStr = t.sunk(shipName); 
          playSfx('sunk');
          
          const coords = getShipCoordinates(newAiShips[shipIndex], newAiShips[shipIndex].x, newAiShips[shipIndex].y, newAiShips[shipIndex].orientation);
          coords.forEach(c => newAiGrid[c.y][c.x].status = 'sunk');

          if (newAiShips.every(s => s.hits === s.size)) {
            winner = 'human';
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
          }
        }
      }
    } else {
      playSfx('miss');
    }

    const logMessage = `Player: ${coord} - ${resultStr}`;

    setGameState(prev => ({
      ...prev,
      aiGrid: newAiGrid,
      aiShips: newAiShips,
      turn: winner ? 'human' : nextTurn,
      logs: winner ? [t.victory, logMessage, ...prev.logs] : [logMessage, ...prev.logs],
      winner: winner,
      phase: winner ? 'gameover' : 'playing'
    }));
  };

  const handleAITurn = useCallback(async () => {
    const { humanGrid, humanShips } = gameState;
    
    // AI Calculation
    let target: Coordinate;
    if (aiEndpoint && aiEndpoint.trim() !== '') {
        try {
          const response = await fetch(aiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              grid: humanGrid,
              ships: humanShips.map(s => ({ id: s.id, size: s.size, sunk: s.hits === s.size })),
              difficulty: difficulty
            })
          });
          if (response.ok) {
            const data = await response.json();
            target = { x: data.x, y: data.y };
          } else {
            target = calculateAIMove(humanGrid, difficulty);
          }
        } catch (e) {
          target = calculateAIMove(humanGrid, difficulty);
        }
    } else {
        target = calculateAIMove(humanGrid, difficulty);
    }
    
    // Process Shot
    const targetCell = humanGrid[target.y][target.x];
    const isHit = targetCell.status === 'ship';
    let newStatus: 'hit' | 'miss' = isHit ? 'hit' : 'miss';
    
    // Calculate Log
    const coord = getCoordinateString(target.x, target.y);
    let resultStr = isHit ? t.enemyHit : t.enemyMiss;

    let winner: PlayerType | null = null;
    let nextTurn: PlayerType = isHit ? 'ai' : 'human';

    const newHumanGrid = humanGrid.map(row => row.map(c => ({...c})));
    let newHumanShips = humanShips.map(s => ({...s}));

    newHumanGrid[target.y][target.x].status = newStatus;

    if (isHit) {
      playSfx('hit');
      
      const shipIndex = newHumanShips.findIndex(s => s.id === targetCell.shipId);
      if (shipIndex !== -1) {
        newHumanShips[shipIndex].hits += 1;
        
        if (newHumanShips[shipIndex].hits === newHumanShips[shipIndex].size) {
          const shipId = newHumanShips[shipIndex].id;
          const shipName = t.ships[shipId as keyof typeof t.ships] || newHumanShips[shipIndex].name;
          resultStr = t.enemySunk(shipName); 
          playSfx('sunk');
          
           const coords = getShipCoordinates(newHumanShips[shipIndex], newHumanShips[shipIndex].x, newHumanShips[shipIndex].y, newHumanShips[shipIndex].orientation);
           coords.forEach(c => newHumanGrid[c.y][c.x].status = 'sunk');

           if (newHumanShips.every(s => s.hits === s.size)) {
             winner = 'ai';
           }
        }
      }
    } else {
      playSfx('miss');
    }

    const logMessage = `AI: ${coord} - ${resultStr}`;

    setGameState(prev => ({
      ...prev,
      humanGrid: newHumanGrid,
      humanShips: newHumanShips,
      turn: winner ? 'ai' : nextTurn,
      logs: winner ? [t.defeat, logMessage, ...prev.logs] : [logMessage, ...prev.logs],
      winner: winner,
      phase: winner ? 'gameover' : 'playing'
    }));

  }, [gameState, t, soundEnabled, difficulty, aiEndpoint]);

  useEffect(() => {
    if (gameState.phase === 'playing' && gameState.turn === 'ai' && !gameState.winner) {
      // Delay for dramatic effect
      const timer = setTimeout(handleAITurn, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.turn, gameState.winner, handleAITurn]);

  // --- Render ---

  return (
    <div className="h-[100dvh] w-full font-sans selection:bg-blue-500/30 transition-colors duration-500 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 transition-colors duration-500 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-100 to-slate-200 dark:from-ocean-900/40 dark:via-slate-950 dark:to-slate-950"></div>
      
      <div className="w-full h-full flex flex-col max-w-[1400px] mx-auto p-3 sm:p-4">
        {/* Header - Fixed Top */}
        <header className="flex-none mb-4 flex flex-row items-center justify-between border-b border-slate-300 dark:border-ocean-800/50 pb-3 gap-2 transition-colors z-20">
           <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-lg shadow-lg bg-blue-600 dark:bg-ocean-600 text-white shadow-blue-500/30 dark:shadow-ocean-500/20">
                <Anchor className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800 dark:text-white leading-none">{t.title}</h1>
                <p className="hidden sm:block text-xs tracking-widest uppercase font-bold text-blue-600 dark:text-ocean-300">
                  {t.subtitle}
                </p>
              </div>
           </div>

           {/* Menu Controls */}
           <div className="flex items-center gap-2">
              <div className={cn(
                "hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm transition-colors mr-2",
                "bg-white text-blue-700 border-blue-200",
                "dark:bg-ocean-900/30 dark:text-ocean-200 dark:border-white/5"
              )}>
                  <Radar className={cn("w-4 h-4", gameState.phase === 'playing' && "animate-spin-slow text-green-500 dark:text-green-400")} />
                  <span>{gameState.phase === 'setup' ? t.systemsCheck : t.combatMode}</span>
              </div>

              <div className="flex items-center bg-white dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-white/10 shadow-sm">
                <button 
                  onClick={() => setLang(l => l === 'en' ? 'it' : 'en')}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300 font-bold text-xs"
                  title="Change Language"
                >
                  {lang.toUpperCase()}
                </button>
                <button 
                  onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                  title="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setSoundEnabled(s => !s)}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                  title="Toggle Sound"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={toggleFullScreen}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300 hidden sm:block"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
           </div>
        </header>

        {/* Main Game Area - Scrollable Container */}
        <main className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-ocean-700">
           {/* Inner wrapper ensures centering if content is small, but allows scroll if content is large */}
           <div className="min-h-full flex flex-col md:flex-row gap-4 items-center justify-center py-2">
            
            {/* Controls / Status Panel - Side or Bottom */}
            <div className="w-full md:w-64 lg:w-72 xl:w-80 flex-shrink-0 order-2 md:order-1 flex flex-col gap-4">
               <GameControls 
                 phase={gameState.phase}
                 orientation={orientation}
                 setOrientation={setOrientation}
                 unplacedShips={SHIPS.slice(currentShipIndex)}
                 onRandomize={handleRandomize}
                 onReset={handleReset}
                 onStart={handleStartGame}
                 winner={gameState.winner}
                 currentShip={gameState.phase === 'setup' ? SHIPS[currentShipIndex] : null}
                 humanGrid={gameState.humanGrid}
                 aiGrid={gameState.aiGrid}
                 humanShips={gameState.humanShips}
                 aiShips={gameState.aiShips}
                 aiEndpoint={aiEndpoint}
                 setAiEndpoint={setAiEndpoint}
                 difficulty={difficulty}
                 setDifficulty={setDifficulty}
                 lang={lang}
               />

               {/* Game Log - Scrollable List */}
               {gameState.phase !== 'setup' && (
                 <div className={cn(
                   "flex flex-col rounded-xl border h-48 md:h-auto md:flex-1 min-h-[150px] overflow-hidden shadow-inner transition-colors relative",
                   "bg-white/80 border-slate-200 shadow-slate-200/50", 
                   "dark:bg-black/40 dark:border-white/10 dark:shadow-none"
                 )}>
                    <div className="p-3 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex items-center gap-2 text-slate-500 dark:text-gray-400 text-[10px] uppercase tracking-wider font-bold shrink-0">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                       Live Feed
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-ocean-700 space-y-1 relative">
                       {gameState.logs.map((log, i) => (
                         <div key={i} className={cn(
                           "text-xs sm:text-sm font-mono py-1 px-1.5 rounded border-l-2 transition-all animate-in fade-in slide-in-from-left-1",
                           i === 0 
                              ? "bg-slate-100 dark:bg-white/10 border-blue-500 dark:border-ocean-400 font-bold" 
                              : "border-transparent opacity-70",
                           getLogColor(log)
                         )}>
                           <span className="opacity-50 mr-1.5 text-[10px]">{i === 0 ? '>' : '#'}</span>
                           {log}
                         </div>
                       ))}
                       
                       {/* Gradient fade at bottom to indicate scroll */}
                       <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/80 dark:from-black/80 to-transparent pointer-events-none"></div>
                    </div>
                 </div>
               )}
            </div>

            {/* Boards Container - Stable Layout */}
            <div className="flex-1 w-full order-1 md:order-2 flex flex-col items-center justify-center">
              
              {gameState.phase === 'setup' ? (
                <div className="max-w-md lg:max-w-lg mx-auto w-full animate-in zoom-in duration-500">
                  <Board 
                    title={t.setupTitle}
                    grid={setupGrid} 
                    ships={setupShips} 
                    isPlayer={true} 
                    isPlacementPhase={true}
                    currentShipToPlace={SHIPS[currentShipIndex]}
                    orientation={orientation}
                    onPlaceShip={handlePlaceShip}
                    className="mx-auto"
                    lang={lang}
                  />
                </div>
              ) : (
                <div className="flex flex-row flex-wrap xl:flex-nowrap gap-4 sm:gap-6 justify-center items-start content-start w-full">
                  
                  {/* Enemy Board + Intel */}
                  <div className={cn(
                    "relative transition-all duration-500 w-full flex-1 max-w-[450px] min-w-[300px] flex flex-col gap-2",
                    gameState.turn === 'human' 
                      ? "scale-100 opacity-100"
                      : "scale-[0.98] opacity-80"
                  )}>
                     {/* Enemy Fleet Intel */}
                     <FleetStatus ships={gameState.aiShips} isEnemy={true} lang={lang} />

                     <div className={cn(
                       "relative rounded-xl overflow-hidden transition-all duration-300 aspect-square",
                       gameState.turn === 'human' && "ring-4 ring-blue-500/30 dark:ring-ocean-500/30 shadow-2xl"
                     )}>
                        <Board 
                          title={t.enemyWaters}
                          grid={gameState.aiGrid} 
                          ships={gameState.aiShips} 
                          isPlayer={false}
                          onCellClick={handleHumanFire}
                          lang={lang}
                        />
                        {gameState.turn === 'ai' && (
                          <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[1px] rounded-lg z-20 flex items-center justify-center pointer-events-none">
                             <span className="text-blue-900 dark:text-white font-black animate-pulse tracking-widest bg-white/80 dark:bg-black/50 px-4 py-2 rounded border border-blue-200 dark:border-white/10 shadow-lg text-sm sm:text-base">
                               {t.enemyTargeting}
                             </span>
                          </div>
                        )}
                     </div>
                  </div>

                  {/* Player Board + Status */}
                  <div className={cn(
                     "relative transition-all duration-500 w-full flex-1 max-w-[450px] min-w-[300px] flex flex-col gap-2",
                     gameState.turn === 'ai' 
                       ? "scale-100"
                       : "scale-[0.98] opacity-80"
                  )}>
                     {/* Allied Fleet Status */}
                     <FleetStatus ships={gameState.humanShips} isEnemy={false} lang={lang} />

                     <div className={cn(
                       "relative rounded-xl overflow-hidden transition-all duration-300 aspect-square",
                       gameState.turn === 'ai' && "ring-4 ring-red-400/50 dark:ring-red-500/30 shadow-2xl"
                     )}>
                       <Board 
                         title={t.homeFleet}
                         grid={gameState.humanGrid} 
                         ships={gameState.humanShips}
                         isPlayer={true}
                         lang={lang}
                       />
                     </div>
                  </div>
                </div>
              )}
            </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;