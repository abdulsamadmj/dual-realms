// ============================================================
// Level Data - Single shared platform
// ============================================================

import { TileType } from './constants';

const _ = TileType.EMPTY;
const S = TileType.SOLID;
const L = TileType.LEVER;
const T = TileType.LOW_TUNNEL;
const W = TileType.WALL_GHOST;
const H = TileType.LEDGE;
const K = TileType.SPIKE;
const BK = TileType.BUTTON_KNIGHT;   // Knight plate -> retracts RA walls
const BT = TileType.BUTTON_THIEF;    // Thief plate -> retracts RB walls
const RA = TileType.RETRACT_WALL_A;  // Opens when Knight steps on BK
const RB = TileType.RETRACT_WALL_B;  // Opens when Thief steps on BT

export interface LevelData {
  grid: number[][];
  knightSpawn: { x: number; y: number };
  thiefSpawn: { x: number; y: number };
  doorPos: { x: number; y: number };
  cratePositions: { x: number; y: number }[];
  leverPosition: { x: number; y: number };
  bridgePositions: { x: number; y: number }[];
}

// Single shared level - 40 cols x 18 rows
// Both players navigate the SAME world.
// Knight: ghost through purple (W) walls
// Thief: crouch through low tunnels (T), use portals to cross gaps
// Pressure plates: Knight stands on BK -> retracts RA for Thief's path
//                  Thief stands on BT -> retracts RB for Knight's path
export const TUTORIAL_LEVEL: LevelData = {
  grid: [
    //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],  // 0
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 1
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 2
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 3
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 4
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 5
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 6
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 7
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 8
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 9
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 10
    [S, _, _, _, _, _, _, _, _, _, _, _, _, S, S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 11
    [S, _, _, _, _, _, _, _, _,BT, S, S, S, S, S,RB,RB, _, _, _, _, _, _, _, _, _, _, _, S, S, _, _, _, _, _, _, _, _, _, S],  // 12
    [S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 13
    [S, _, _, _, _, _, _, T, T, T, _, _, _, _, _, _, _, S, S, S,BK, S, S, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, S],  // 14
    [S, _, _, _, _, _, _, S, S, S, S, W, W, S, S, S, S, S, S, S, S, S, S,RA,RA, S, S, S, _, _, S, S, S, _, _, _, _, _, _, S],  // 15
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, K, K, S, S, S, K, K, S, S, S, S, S],  // 16
    [S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S, S],  // 17
  ],

  // Both players spawn on the ground (row 16 is floor, row 15 is walkable surface)
  // Player height is 48px. Ground top = row 16 * 32 = 512. Spawn y = 512 - 48 = 464
  knightSpawn: { x: 2 * 32, y: 15 * 32 - 48 },
  thiefSpawn: { x: 4 * 32, y: 15 * 32 - 48 },

  // Single shared door
  doorPos: { x: 37 * 32, y: 15 * 32 },

  cratePositions: [
    { x: 5 * 32, y: 15 * 32 - 32 },
  ],

  leverPosition: { x: 28 * 32, y: 14 * 32 },

  bridgePositions: [
    // These fill in empty spots when lever is pulled (the gap near col 28-29)
    { x: 28, y: 15 },
    { x: 29, y: 15 },
  ],
};
