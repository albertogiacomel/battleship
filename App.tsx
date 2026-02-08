import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Anchor, Radar, Maximize, Sun, Moon, Volume2, VolumeX, Radio, Activity, Target, RotateCcw } from 'lucide-react';
import { cn } from './lib/utils';
import { DICTIONARY } from './lib/translations';
import { playGameSound } from './lib/sound';

const STORAGE_KEY = 'battleship_save_v1';

const App: React.FC = () => {
  // --- Settings State ---
  const [lang, setLang] = useState<Language>('en');
  
  // Theme State with Persistence
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [aiEndpoint, setAiEndpoint] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    turn: 'human',
    winner: null,
    humanShips: [],
    aiShips: [],
    humanGrid: createEmptyGrid(),
    aiGrid: createEmptyGrid(),
    logs: [], // Init empty to show welcome message dynamically if needed
  });

  const t = DICTIONARY[lang];

  // Setup State
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [setupShips, setSetupShips] = useState<PlacedShip[]>([]);
  const [setupGrid, setSetupGrid] = useState(createEmptyGrid());

  // --- Persistence & Initialization ---
  
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loadedState = parsed.gameState;

        if (
          loadedState &&
          loadedState.phase !== 'setup' &&
          Array.isArray(loadedState.humanGrid) &&
          Array.isArray(loadedState.aiGrid)
        ) {
           if (!loadedState.logs || !Array.isArray(loadedState.logs)) {
              const oldLog = (loadedState as any).lastLog;
              loadedState.logs = oldLog ? [oldLog] : [];
           }
           if (!Array.isArray(loadedState.humanShips)) loadedState.humanShips = [];
           if (!Array.isArray(loadedState.aiShips)) loadedState.aiShips = [];

           setGameState(loadedState);
        }
      } catch (e) {
        console.error("Failed to load save", e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (gameState.phase === 'playing' || gameState.phase === 'gameover') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameState }));
    }
  }, [gameState]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [gameState.logs]);

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

  const getLogStyle = (log: string) => {
    const l = log.toLowerCase();
    if (l.includes('hit') || l.includes('sunk') || l.includes('colpo') || l.includes('affondata')) 
      return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50';
    if (l.includes('miss') || l.includes('mancato')) 
      return 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50';
    if (l.includes('victory') || l.includes('vittoria')) 
      return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 font-black';
    return 'text-slate-600 dark:text-emerald-400 bg-slate-50 dark:bg-emerald-950/20 border-slate-200 dark:border-emerald-900/30';
  };

  const getCoordinateString = (x: number, y: number) => {
    return `${String.fromCharCode(65 + x)}${y + 1}`;
  };

  // --- Handlers ---
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

  const handleHumanFire = (x: number, y: number) => {
    if (gameState.phase !== 'playing' || gameState.turn !== 'human') return;

    const targetCell = gameState.aiGrid[y][x];
    if (['hit', 'miss', 'sunk'].includes(targetCell.status)) return;

    const isHit = targetCell.status === 'ship';
    let newStatus: 'hit' | 'miss' = isHit ? 'hit' : 'miss';
    
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

    const logMessage = `COM: ${coord} >> ${resultStr}`;

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
    
    const targetCell = humanGrid[target.y][target.x];
    const isHit = targetCell.status === 'ship';
    let newStatus: 'hit' | 'miss' = isHit ? 'hit' : 'miss';
    
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

    const logMessage = `CPU: ${coord} >> ${resultStr}`;

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
      const timer = setTimeout(handleAITurn, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.turn, gameState.winner, handleAITurn]);

  return (
    <div className="h-[100dvh] w-full font-sans selection:bg-blue-500/30 transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col overflow-hidden">
      <div className="fixed inset-0 -z-10 transition-colors duration-500 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-slate-100 to-slate-200 dark:from-ocean-900/40 dark:via-slate-950 dark:to-slate-950"></div>
      
      <div className="w-full h-full flex flex-col max-w-[1400px] mx-auto p-3 sm:p-4">
        {/* Header */}
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
                  onClick={handleReset}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                  title={t.playAgain}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <button 
                  onClick={() => setLang(l => l === 'en' ? 'it' : 'en')}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  {lang.toUpperCase()}
                </button>
                <button 
                  onClick={() => setTheme(th => th === 'dark' ? 'light' : 'dark')}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setSoundEnabled(s => !s)}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={toggleFullScreen}
                  className="p-1.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-600 dark:text-slate-300 hidden sm:block"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
           </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-ocean-700 flex flex-col">
           {/* Added my-auto for vertical centering in fullscreen/tall viewports */}
           <div className="flex flex-col xl:flex-row gap-4 xl:items-stretch justify-center py-2 my-auto">
            
            {/* Sidebar (Controls + Feed) */}
            <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-4 order-2 xl:order-1">
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

               {/* --- IMPROVED LIVE FEED (Redesigned) --- */}
               {gameState.phase !== 'setup' && (
                 <div className="hidden xl:flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-md h-[780px] shadow-lg">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate-50/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between shrink-0">
                       <div className="flex items-center gap-2">
                         <Activity className="w-4 h-4 text-blue-500" />
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Live Feed</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                       </div>
                    </div>
                    
                    {/* Feed Content */}
                    <div ref={logContainerRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin space-y-1.5">
                       {Array.isArray(gameState.logs) && gameState.logs.length > 0 ? (
                         gameState.logs.map((log, i) => (
                           <div key={i} className={cn(
                             "py-2 px-3 rounded text-[11px] font-mono leading-tight border transition-all",
                             getLogStyle(log),
                             i === 0 ? "opacity-100 shadow-sm translate-x-0" : "opacity-70 grayscale-[0.3]"
                           )}>
                             <div className="flex justify-between items-center mb-0.5 opacity-60">
                               <span className="font-bold">{i === 0 ? 'LATEST EVENT' : `SEQ-${gameState.logs.length - i}`}</span>
                             </div>
                             <div className="font-semibold">{log}</div>
                           </div>
                         ))
                       ) : (
                         <div className="text-slate-400 text-center py-8 text-xs italic">Awaiting combat data...</div>
                       )}
                    </div>
                 </div>
               )}
            </div>

            {/* Game Area */}
            <div className="flex-1 w-full flex flex-col items-center justify-start gap-6 order-1 xl:order-2">
              {gameState.phase === 'setup' ? (
                <div className="max-w-md lg:max-w-lg mx-auto w-full animate-in zoom-in duration-500">
                  <div className="bg-white/50 dark:bg-ocean-900/20 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl">
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
                </div>
              ) : (
                <>
                  {/* CHANGED: items-end to items-start for top alignment of Intel cards */}
                  <div className="flex flex-row flex-wrap xl:flex-nowrap gap-6 justify-center items-start w-full">
                    
                    {/* ENEMY BOARD */}
                    {/* CHANGED: Removed scale/opacity classes. Added static transition */}
                    <div className="relative w-full flex-1 max-w-[500px] min-w-[300px] flex flex-col gap-3 transition-colors duration-300">
                       <FleetStatus ships={gameState.aiShips} isEnemy={true} lang={lang} />
                       
                       <div className={cn(
                         "relative rounded-xl p-1 transition-all duration-300 bg-white/30 dark:bg-black/20 border",
                         /* CHANGED: Simplified logic to only use border/ring color, no opacity changes */
                         gameState.turn === 'human' 
                           ? "border-blue-500/50 ring-2 ring-blue-500 dark:ring-ocean-400 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
                           : "border-slate-200 dark:border-white/5"
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
                               <span className="text-blue-900 dark:text-white font-black animate-pulse tracking-widest bg-white/90 dark:bg-black/70 px-4 py-2 rounded-full border border-blue-200 dark:border-white/10 shadow-lg text-sm flex items-center gap-2">
                                 <Target className="w-4 h-4 animate-spin-slow" />
                                 {t.enemyTargeting}
                               </span>
                            </div>
                          )}
                       </div>
                    </div>

                    {/* PLAYER BOARD */}
                    {/* CHANGED: Removed scale/opacity classes. */}
                    <div className="relative w-full flex-1 max-w-[500px] min-w-[300px] flex flex-col gap-3 transition-colors duration-300">
                       <FleetStatus ships={gameState.humanShips} isEnemy={false} lang={lang} />
                       
                       <div className={cn(
                         "relative rounded-xl p-1 transition-all duration-300 bg-white/30 dark:bg-black/20 border",
                         /* CHANGED: Simplified logic to only use border/ring color */
                         gameState.turn === 'ai' 
                           ? "border-red-500/50 ring-2 ring-red-500 dark:ring-red-500 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]"
                           : "border-slate-200 dark:border-white/5"
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

                  {/* MOBILE LIVE FEED (Visible only on small screens below boards) */}
                  <div className="xl:hidden w-full max-w-[500px] mt-4">
                     <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-md h-[200px] shadow-lg flex flex-col">
                         <div className="px-3 py-2 bg-slate-50/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Live Feed</span>
                         </div>
                         <div ref={logContainerRef} className="flex-1 overflow-y-auto p-2 scrollbar-thin space-y-1">
                             {Array.isArray(gameState.logs) && gameState.logs.slice(0, 5).map((log, i) => (
                                <div key={i} className={cn("text-[10px] p-1.5 rounded border", getLogStyle(log))}>
                                   {log}
                                </div>
                             ))}
                         </div>
                     </div>
                  </div>
                </>
              )}
            </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;