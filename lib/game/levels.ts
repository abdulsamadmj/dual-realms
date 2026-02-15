// ============================================================
// Level Data - Tutorial Level
// ============================================================

import { TileType } from './constants';

const _ = TileType.EMPTY;
const S = TileType.SOLID;
const L = TileType.LEVER;
const G = TileType.GAP;
const T = TileType.LOW_TUNNEL;
const W = TileType.WALL_GHOST;
const H = TileType.LEDGE;
const K = TileType.SPIKE;
const BK = TileType.BUTTON_KNIGHT;  // Knight pressure plate -> affects bottom
const BT = TileType.BUTTON_THIEF;   // Thief pressure plate -> affects top
const RW = TileType.RETRACT_WALL;   // Retracts when button pressed

export interface LevelData {
  topGrid: number[][];
  bottomGrid: number[][];
  knightSpawn: { x: number; y: number };
  thiefSpawn: { x: number; y: number };
  topDoor: { x: number; y: number };
  bottomDoor: { x: number; y: number };
  cratePositions: { x: number; y: number; platform: 'top' | 'bottom' }[];
  leverPosition: { x: number; y: number };
  bridgePositions: { x: number; y: number }[];
  // Cross-platform interactions:
  // When Knight stands on BK in top grid -> retract RW tiles in bottom grid
  // When Thief stands on BT in bottom grid -> retract RW tiles in top grid
}

// Tutorial Level - 25 cols x 9 rows per platform
export const TUTORIAL_LEVEL: LevelData = {
  // Top platform (Knight)
  // Col 12 has a BUTTON_KNIGHT: standing on it retracts walls in bottom grid
  // Col 20 has a RETRACT_WALL that blocks the door - Thief's button opens it
  topGrid: [
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _,RW, _, _, _, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, W, W, _, _, _, _, RW, _, _, _, S],
    [S, S, S, S, S, S, S, S, G, G, S, S,BK, S, W, W, S, S, S, _, S, S, S, S, S],
    [S, S, S, S, S, S, S, S, K, K, S, S, S, S, S, S, S, S, S, K, S, S, S, S, S],
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
  ],

  // Bottom platform (Thief)
  // Col 4-6 has low ceiling (tunnel)
  // Col 10 has a BUTTON_THIEF: standing on it retracts the RW wall in top grid
  // Col 14 has a RETRACT_WALL blocking a ledge - Knight's button opens it
  bottomGrid: [
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],
    [S, _, _, _, K, K, K, _, _, _, _, _, _, _,RW, S, S, _, _, _, _, _, _, _, S],
    [S, _, _, _, S, S, S, _, _, _, _, _, _, _, H, S, S, _, _, _, _, _, _, _, S],
    [S, S, S, S, S, S, S, S, S, S,BT, S, S, S, S, S, S, _, _, _, S, S, S, S, S],
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, K, K, K, S, S, S, S, S],
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],
  ],

  // Spawn positions (ground at row 6)
  knightSpawn: { x: 2 * 32, y: 6 * 32 - 48 },
  thiefSpawn: { x: 2 * 32, y: 6 * 32 - 48 },

  // Doors
  topDoor: { x: 22 * 32, y: 5 * 32 },
  bottomDoor: { x: 22 * 32, y: 5 * 32 },

  cratePositions: [
    { x: 17 * 32, y: 5 * 32 - 32, platform: 'top' },
  ],

  leverPosition: { x: 8 * 32, y: 5 * 32 },

  bridgePositions: [
    { x: 8, y: 6 },
    { x: 9, y: 6 },
  ],
};
