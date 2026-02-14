// ============================================================
// Level Data - Tutorial Level
// ============================================================
// Each level has a top grid (Knight) and bottom grid (Thief).
// Grid is row-major: grid[row][col]
// 
// To add new levels, copy the structure and modify the grids.
// TileType enum values:
//   0=EMPTY, 1=SOLID, 2=BRIDGE, 3=LEVER, 4=DOOR,
//   5=CRATE, 6=LOW_TUNNEL, 7=WALL_GHOST, 8=GAP, 9=PORTAL_ZONE,
//   10=LEDGE, 11=SPIKE
// ============================================================

import { TileType } from './constants';

const _ = TileType.EMPTY;
const S = TileType.SOLID;
const B = TileType.BRIDGE;
const L = TileType.LEVER;
const D = TileType.DOOR;
const C = TileType.CRATE;
const T = TileType.LOW_TUNNEL;  // Low tunnel
const W = TileType.WALL_GHOST;  // Ghost wall
const G = TileType.GAP;
const P = TileType.PORTAL_ZONE;
const H = TileType.LEDGE;       // High ledge
const K = TileType.SPIKE;       // Spike/top

export interface LevelData {
  topGrid: number[][];
  bottomGrid: number[][];
  knightSpawn: { x: number; y: number };
  thiefSpawn: { x: number; y: number };
  topDoor: { x: number; y: number };
  bottomDoor: { x: number; y: number };
  cratePositions: { x: number; y: number; platform: 'top' | 'bottom' }[];
  leverPosition: { x: number; y: number }; // In bottom grid
  bridgePositions: { x: number; y: number }[]; // In top grid
}

// Tutorial Level - 25 cols x 9 rows per platform
export const TUTORIAL_LEVEL: LevelData = {
  // Top platform (Knight) - 9 rows x 25 cols
  topGrid: [
    // Row 0: ceiling
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
    // Row 1
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    // Row 2
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    // Row 3
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    // Row 4
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    // Row 5: Knight walks here. Bridge gap at col 8-9, Ghost wall at col 14-15, crate at 18, gap at 19
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, W, W, _, _, _, _, _, _, _, _, S],
    // Row 6: main ground with bridge gap and ghost wall base
    [S, S, S, S, S, S, S, S, G, G, S, S, S, S, W, W, S, S, S, G, S, S, S, S, S],
    // Row 7
    [S, S, S, S, S, S, S, S, _, _, S, S, S, S, S, S, S, S, S, _, S, S, S, S, S],
    // Row 8: floor
    [S, S, S, S, S, S, S, S, _, _, S, S, S, S, S, S, S, S, S, _, S, S, S, S, S],
  ],
  
  // Bottom platform (Thief) - 9 rows x 25 cols
  bottomGrid: [
    // Row 0: ceiling
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
    // Row 1
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    // Row 2
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    // Row 3: ledge for crate puzzle at col 13-14 high
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    // Row 4: low tunnel ceiling at col 4-6
    [S, _, _, _, K, K, K, _, _, _, _, _, _, _, _, S, S, _, _, _, _, _, _, _, S],
    // Row 5: tunnel walls, lever, high ledge
    [S, _, _, _, S, S, S, _, _, _, _, _, _, _, H, S, S, _, _, _, _, _, _, _, S],
    // Row 6: main ground with portal gap at col 17-19
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, _, _, _, S, S, S, S, S],
    // Row 7
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, _, _, _, S, S, S, S, S],
    // Row 8
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, _, _, _, S, S, S, S, S],
  ],

  // Ground is at row 6 (y=192). Player height is 48px.
  // Spawn y = 6*32 - 48 = 144
  knightSpawn: { x: 2 * 32, y: 6 * 32 - 48 },
  thiefSpawn: { x: 2 * 32, y: 6 * 32 - 48 },
  
  // Door at ground level (one tile above ground)
  topDoor: { x: 22 * 32, y: 5 * 32 },
  bottomDoor: { x: 22 * 32, y: 5 * 32 },

  cratePositions: [
    { x: 17 * 32, y: 5 * 32 - 32, platform: 'top' },
  ],

  leverPosition: { x: 8 * 32, y: 5 * 32 },
  
  // Bridge tiles that appear in top grid when lever is pulled
  bridgePositions: [
    { x: 8, y: 6 },  // col, row in top grid
    { x: 9, y: 6 },
  ],
};
