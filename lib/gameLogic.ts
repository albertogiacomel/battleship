
import { GRID_SIZE, SHIPS } from '../constants';
import { Grid, PlacedShip, Coordinate, CellData, ShipConfig, Difficulty } from '../types';

export const createEmptyGrid = (): Grid => {
  return Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({
      x,
      y,
      status: 'empty',
    }))
  );
};

export const isValidPlacement = (
  ship: ShipConfig,
  x: number,
  y: number,
  orientation: 'horizontal' | 'vertical',
  existingShips: PlacedShip[]
): boolean => {
  // Check boundaries
  if (orientation === 'horizontal') {
    if (x + ship.size > GRID_SIZE) return false;
  } else {
    if (y + ship.size > GRID_SIZE) return false;
  }

  // Check collision with existing ships
  const coords = getShipCoordinates(ship, x, y, orientation);
  
  for (const coord of coords) {
    for (const placedShip of existingShips) {
      const placedCoords = getShipCoordinates(placedShip, placedShip.x, placedShip.y, placedShip.orientation);
      if (placedCoords.some(c => c.x === coord.x && c.y === coord.y)) {
        return false;
      }
    }
  }

  return true;
};

export const getShipCoordinates = (
  ship: ShipConfig,
  x: number,
  y: number,
  orientation: 'horizontal' | 'vertical'
): Coordinate[] => {
  const coords: Coordinate[] = [];
  for (let i = 0; i < ship.size; i++) {
    coords.push({
      x: orientation === 'horizontal' ? x + i : x,
      y: orientation === 'vertical' ? y + i : y,
    });
  }
  return coords;
};

export const placeShip = (
  grid: Grid,
  ship: PlacedShip
): Grid => {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
  const coords = getShipCoordinates(ship, ship.x, ship.y, ship.orientation);
  
  coords.forEach(coord => {
    newGrid[coord.y][coord.x].status = 'ship';
    newGrid[coord.y][coord.x].shipId = ship.id;
  });

  return newGrid;
};

export const randomPlacement = (): { grid: Grid; ships: PlacedShip[] } => {
  let ships: PlacedShip[] = [];
  let grid = createEmptyGrid();
  let attempts = 0;
  const maxAttempts = 2000;

  for (const shipTemplate of SHIPS) {
    let placed = false;
    let shipAttempts = 0;
    
    while (!placed && attempts < maxAttempts && shipAttempts < 200) {
      attempts++;
      shipAttempts++;
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);

      if (isValidPlacement(shipTemplate, x, y, orientation, ships)) {
        const newShip: PlacedShip = {
          ...shipTemplate,
          x,
          y,
          orientation,
          hits: 0
        };
        ships.push(newShip);
        grid = placeShip(grid, newShip);
        placed = true;
      }
    }
    
    if (!placed) {
      return randomPlacement();
    }
  }
  
  return { grid, ships };
};

// -- AI LOGIC --

const getValidNeighbors = (grid: Grid, x: number, y: number): Coordinate[] => {
  return [
    { x: x, y: y - 1 }, // Up
    { x: x, y: y + 1 }, // Down
    { x: x - 1, y: y }, // Left
    { x: x + 1, y: y }, // Right
  ].filter(c => 
    c.x >= 0 && c.x < GRID_SIZE && 
    c.y >= 0 && c.y < GRID_SIZE &&
    (grid[c.y][c.x].status === 'empty' || grid[c.y][c.x].status === 'ship')
  );
};

export const calculateAIMove = (grid: Grid, difficulty: Difficulty): Coordinate => {
  
  // 1. Easy Mode: Pure Random
  if (difficulty === 'easy') {
    const available = getAvailableCells(grid, false);
    return available[Math.floor(Math.random() * available.length)] || { x: 0, y: 0 };
  }

  // 2. Medium & Hard Mode: Smart Targeting
  // Scan the grid for "damaged" ships (hits that are not sunk)
  // Note: We don't have direct access to "ships" array here to know if sunk, 
  // so we rely on the cell status 'hit' vs 'sunk'.
  
  const damagedCells: Coordinate[] = [];
  grid.forEach(row => row.forEach(cell => {
    if (cell.status === 'hit') {
      damagedCells.push({ x: cell.x, y: cell.y });
    }
  }));

  // TARGET MODE: If there are damaged cells, we must finish them off.
  if (damagedCells.length > 0) {
    // Strategy: 
    // If we have 2+ damaged cells in a line, shoot at the ends of that line.
    // If we have 1 damaged cell, shoot randomly around it.
    
    // Sort logic to find potential lines
    for (const cell of damagedCells) {
       // Check for adjacent hits to determine orientation
       const neighbors = [
          { x: cell.x, y: cell.y - 1, dir: 'vertical' },
          { x: cell.x, y: cell.y + 1, dir: 'vertical' },
          { x: cell.x - 1, y: cell.y, dir: 'horizontal' },
          { x: cell.x + 1, y: cell.y, dir: 'horizontal' }
       ];

       const hitNeighbor = neighbors.find(n => 
          n.x >= 0 && n.x < GRID_SIZE && n.y >= 0 && n.y < GRID_SIZE && 
          grid[n.y][n.x].status === 'hit'
       );

       if (hitNeighbor) {
          // We found a line! Try to shoot at the ends of this line.
          const targets: Coordinate[] = [];
          
          if (hitNeighbor.dir === 'vertical') {
             // Try Up
             let currY = Math.min(cell.y, hitNeighbor.y) - 1;
             while (currY >= 0 && grid[currY][cell.x].status === 'hit') currY--; // Skip existing hits
             if (currY >= 0 && isValidTarget(grid, cell.x, currY)) targets.push({ x: cell.x, y: currY });

             // Try Down
             currY = Math.max(cell.y, hitNeighbor.y) + 1;
             while (currY < GRID_SIZE && grid[currY][cell.x].status === 'hit') currY++;
             if (currY < GRID_SIZE && isValidTarget(grid, cell.x, currY)) targets.push({ x: cell.x, y: currY });

          } else {
             // Try Left
             let currX = Math.min(cell.x, hitNeighbor.x) - 1;
             while (currX >= 0 && grid[cell.y][currX].status === 'hit') currX--;
             if (currX >= 0 && isValidTarget(grid, currX, cell.y)) targets.push({ x: currX, y: cell.y });

             // Try Right
             currX = Math.max(cell.x, hitNeighbor.x) + 1;
             while (currX < GRID_SIZE && grid[cell.y][currX].status === 'hit') currX++;
             if (currX < GRID_SIZE && isValidTarget(grid, currX, cell.y)) targets.push({ x: currX, y: cell.y });
          }

          if (targets.length > 0) return targets[Math.floor(Math.random() * targets.length)];
       }
    }

    // If no lines found (or ends blocked), just pick a valid neighbor of ANY damaged cell
    // Use a stack-like approach: prioritize most recent hits if we could track them, but random neighbor is fine here
    for (const cell of damagedCells) {
       const neighbors = getValidNeighbors(grid, cell.x, cell.y);
       if (neighbors.length > 0) return neighbors[Math.floor(Math.random() * neighbors.length)];
    }
  }

  // 3. HUNT MODE: No damaged ships found. Search for new ones.
  const useParity = difficulty === 'hard';
  const available = getAvailableCells(grid, useParity);
  
  // Fallback if parity returns empty (rare end-game edge case)
  if (available.length === 0) {
     const allAvailable = getAvailableCells(grid, false);
     return allAvailable[Math.floor(Math.random() * allAvailable.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
};

const isValidTarget = (grid: Grid, x: number, y: number): boolean => {
   const cell = grid[y][x];
   return cell.status === 'empty' || cell.status === 'ship';
};

const getAvailableCells = (grid: Grid, parity: boolean): Coordinate[] => {
   const available: Coordinate[] = [];
   grid.forEach(row => row.forEach(cell => {
     if (cell.status === 'empty' || cell.status === 'ship') {
       if (parity) {
         // Checkerboard pattern (x + y is even)
         if ((cell.x + cell.y) % 2 === 0) available.push({ x: cell.x, y: cell.y });
       } else {
         available.push({ x: cell.x, y: cell.y });
       }
     }
   }));
   return available;
};
