
export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export interface Coordinate {
  x: number;
  y: number;
}

export interface ShipConfig {
  id: string;
  name: string;
  size: number;
}

export interface PlacedShip extends ShipConfig {
  x: number;
  y: number;
  orientation: 'horizontal' | 'vertical';
  hits: number;
}

export interface CellData {
  x: number;
  y: number;
  status: CellStatus;
  shipId?: string;
}

export type Grid = CellData[][];

export type GamePhase = 'setup' | 'playing' | 'gameover';

export type PlayerType = 'human' | 'ai';

export type Language = 'en' | 'it';
export type Theme = 'dark' | 'light';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  phase: GamePhase;
  turn: PlayerType;
  winner: PlayerType | null;
  humanShips: PlacedShip[];
  aiShips: PlacedShip[];
  humanGrid: Grid;
  aiGrid: Grid;
  lastLog: string;
}
