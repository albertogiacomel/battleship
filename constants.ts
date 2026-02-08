import { ShipConfig } from './types';

export const GRID_SIZE = 10;

export const SHIPS: ShipConfig[] = [
  { id: 'carrier', name: 'Carrier', size: 5 },
  { id: 'battleship', name: 'Battleship', size: 4 },
  { id: 'cruiser', name: 'Cruiser', size: 3 },
  { id: 'submarine', name: 'Submarine', size: 3 },
  { id: 'destroyer', name: 'Destroyer', size: 2 },
];

export const GAME_ASSETS = {
  // Embedded SVG Data URIs to remove external dependencies
  
  // Fog: A fractal noise texture simulating dense mist
  fog: "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.6'/%3E%3Crect width='100%25' height='100%25' fill='%2394a3b8' opacity='0.4'/%3E%3C/svg%3E",
  
  // Fire: High-fidelity animated fire with core glow and rising flames
  fire: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3CradialGradient id='core' cx='50%25' cy='80%25' r='60%25'%3E%3Cstop offset='0%25' stop-color='%23fff7ed'/%3E%3Cstop offset='25%25' stop-color='%23fcd34d'/%3E%3Cstop offset='50%25' stop-color='%23f97316'/%3E%3Cstop offset='100%25' stop-color='%23ef4444' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cfilter id='glow'%3E%3CfeGaussianBlur stdDeviation='2' result='blur'/%3E%3CfeComposite in='SourceGraphic' in2='blur' operator='over'/%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='50' cy='60' r='25' fill='url(%23core)' filter='url(%23glow)' opacity='0.8'%3E%3Canimate attributeName='r' values='22;25;22' dur='1.5s' repeatCount='indefinite'/%3E%3Canimate attributeName='opacity' values='0.8;0.6;0.8' dur='0.5s' repeatCount='indefinite'/%3E%3C/circle%3E%3Cpath fill='%23ea580c' d='M50 10 Q30 50 20 60 Q10 80 50 90 Q90 80 80 60 Q70 50 50 10' opacity='0.8'%3E%3Canimate attributeName='d' values='M50 10 Q30 50 20 60 Q10 80 50 90 Q90 80 80 60 Q70 50 50 10; M50 5 Q25 45 25 60 Q15 85 50 90 Q85 85 75 60 Q75 45 50 5; M50 10 Q30 50 20 60 Q10 80 50 90 Q90 80 80 60 Q70 50 50 10' dur='0.8s' repeatCount='indefinite'/%3E%3C/path%3E%3Cpath fill='%23fbbf24' d='M50 30 Q40 55 35 65 Q30 80 50 85 Q70 80 65 65 Q60 55 50 30'%3E%3Canimate attributeName='d' values='M50 30 Q40 55 35 65 Q30 80 50 85 Q70 80 65 65 Q60 55 50 30; M52 25 Q38 52 38 65 Q35 80 50 85 Q65 80 62 65 Q62 52 52 25; M50 30 Q40 55 35 65 Q30 80 50 85 Q70 80 65 65 Q60 55 50 30' dur='0.6s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E",
  
  // Water: A seamless blue wave pattern
  water: "data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%230ea5e9' stop-opacity='0.2'/%3E%3Cstop offset='100%25' stop-color='%230284c7' stop-opacity='0.4'/%3E%3C/linearGradient%3E%3Cpattern id='p' width='20' height='20' patternUnits='userSpaceOnUse' viewBox='0 0 40 40'%3E%3Cpath d='M0 20 Q10 10 20 20 T40 20' fill='none' stroke='%2338bdf8' stroke-width='1' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3Crect width='100%25' height='100%25' fill='url(%23p)'/%3E%3C/svg%3E",
};
