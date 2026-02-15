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
// Both players start on the left.
// A ghost wall (W) blocks the path at columns 12-13.
// The Knight uses ghost mode to phase through the wall.
// Behind the wall at col 16 there is a lever.
// Pulling the lever disables (removes) the ghost wall so the Thief can pass.
// Both then walk right to the door at col 22 to win.
//
// Grid: 25 cols x 12 rows
export const TUTORIAL_LEVEL: LevelData = {
  grid: [
  // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S], // 0 ceiling
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 1
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 2
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 3
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 4
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 5
    [S, _, _, _, _, _, _, _, _, _, S, S, W, W, S, _, _, _, _, _, _, _, _, _, S], // 6
    [S, _, _, _, _, _, _, _, _, _, S, S, W, W, S, _, _, _, _, _, _, _, _, _, S], // 7
    [S, _, _, _, _, _, _, _, _, _, S, S, W, W, S, _, _, _, _, _, _, _, _, _, S], // 8
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S], // 9
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S], // 10 floor
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S], // 11
  ],

  // Ground is top of row 10 (y = 10*32 = 320). Player height = 48.
  // Spawn y = 320 - 48 = 272
  knightSpawn: { x: 2 * 32, y: 10 * 32 - 48 },
  thiefSpawn:  { x: 4 * 32, y: 10 * 32 - 48 },

  // Door tile at col 22, row 9 (on the ground)
  doorPos: { x: 22 * 32, y: 9 * 32 },

  cratePositions: [],

  // Lever behind the ghost wall at col 16, row 9 (on ground)
  leverPosition: { x: 16 * 32, y: 9 * 32 },

  // No bridge tiles needed for this level
  bridgePositions: [],
};
