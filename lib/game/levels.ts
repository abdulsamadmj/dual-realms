// ============================================================
// Level Data - Single shared platform
// ============================================================

import { TileType } from './constants';

const _ = TileType.EMPTY;
const S = TileType.SOLID;
const L = TileType.LEVER;
const W = TileType.WALL_GHOST;
const D = TileType.DOOR;

export interface LevelData {
  grid: number[][];
  knightSpawn: { x: number; y: number };
  thiefSpawn: { x: number; y: number };
  doorPos: { x: number; y: number };
  cratePositions: { x: number; y: number }[];
  leverPosition: { x: number; y: number };
  bridgePositions: { x: number; y: number }[];
}

// Simple co-op puzzle:
// Both players start on the left on a continuous platform.
// A ghost wall (W) blocks the path in the middle.
// The Knight uses ghost mode to phase through the wall and reach the lever.
// Knight stands on the lever tile and presses E to activate it.
// Pulling the lever disables (removes) the ghost wall so the Thief can pass.
// Both then walk right to the door to win.
//
// Grid: 25 cols x 12 rows
export const TUTORIAL_LEVEL: LevelData = {
  grid: [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S], // 0 ceiling
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 1
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 2
    [S, S, S, S, S, S, S, S, S, S, S, W, W, W, S, S, S, S, S, S, S, S, S, S, S], // 3 platform with ghost wall in middle
    [S, S, S, S, S, S, S, S, S, S, S, W, W, W, S, S, L, S, S, S, S, S, S, S, S], // 4 lever on platform
    [S, S, S, S, S, S, S, S, S, S, S, W, W, W, S, S, S, S, S, S, S, S, D, S, S], // 5 platform continues, door
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 6
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 7
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 8
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 9
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S], // 10 floor
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S], // 11
  ],

  // Ground is top of row 10 (y = 10*32 = 320). Player height = 48.
  // Platform is rows 3-5, spawn at row 3
  knightSpawn: { x: 1 * 32, y: 3 * 32 - 48 },
  thiefSpawn:  { x: 2 * 32, y: 3 * 32 - 48 },

  // Door at col 23, row 5 (on the platform)
  doorPos: { x: 23, y: 5 },

  cratePositions: [],

  // Lever at col 16, row 4 (on the platform, right of the wall)
  leverPosition: { x: 16, y: 4 },

  // No bridge tiles needed for this level
  bridgePositions: [],
};
