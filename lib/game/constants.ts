// ============================================================
// Game Constants
// ============================================================

export const TILE_SIZE = 32;
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;
export const PLAYER_SPEED = 3;
export const JUMP_FORCE = -10;
export const GHOST_DURATION = 3000;   // ms - how long ghost mode lasts
export const GHOST_COOLDOWN = 5000;   // ms - cooldown before you can use it again
export const PORTAL_COOLDOWN = 4000;  // ms

// Canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const HALF_HEIGHT = CANVAS_HEIGHT / 2;

// Sprite sheet configurations
export const KNIGHT_SPRITE = {
  frameWidth: 55,
  frameHeight: 34,
  cols: 6,
  idle: { row: 0, frames: 6, speed: 8 },
  run: { row: 1, frames: 6, speed: 6 },
  attack: { row: 2, frames: 6, speed: 4 },
  jump: { row: 3, frames: 2, speed: 8 },
  death: { row: 4, frames: 5, speed: 8 },
};

export const THIEF_SPRITE = {
  frameWidth: 54,
  frameHeight: 34,
  cols: 7,
  idle: { row: 0, frames: 7, speed: 8 },
  run: { row: 1, frames: 7, speed: 6 },
  attack: { row: 2, frames: 7, speed: 4 },
  crouch: { row: 3, frames: 5, speed: 8 },
  death: { row: 4, frames: 5, speed: 8 },
};

// Tile types for level data
export enum TileType {
  EMPTY = 0,
  SOLID = 1,
  BRIDGE = 2,         // Appears when lever is pulled
  LEVER = 3,          // Interactive lever
  DOOR = 4,           // Level exit
  CRATE = 5,          // Movable crate
  LOW_TUNNEL = 6,     // Requires crouching
  WALL_GHOST = 7,     // Knight can ghost through
  GAP = 8,            // Gap where crate can fall
  PORTAL_ZONE = 9,    // Area for portal placement
  LEDGE = 10,         // Higher platform
  SPIKE = 11,         // Deadly spikes - resets player
  BUTTON_KNIGHT = 12, // Pressure plate the Knight stands on -> affects bottom
  BUTTON_THIEF = 13,  // Pressure plate the Thief stands on -> affects top
  RETRACT_WALL = 14,  // Wall that retracts when button is active
  MOVING_PLAT = 15,   // Moving platform toggled by other player's button
}

// Colors for tile rendering
export const TILE_COLORS: Record<number, string> = {
  [TileType.SOLID]: '#4a3728',
  [TileType.BRIDGE]: '#8B7355',
  [TileType.LEVER]: '#FFD700',
  [TileType.DOOR]: '#C0392B',
  [TileType.CRATE]: '#A0522D',
  [TileType.LOW_TUNNEL]: '#4a3728',
  [TileType.WALL_GHOST]: '#6B5B73',
  [TileType.LEDGE]: '#4a3728',
  [TileType.SPIKE]: '#4a3728',
  [TileType.BUTTON_KNIGHT]: '#CC4444',
  [TileType.BUTTON_THIEF]: '#44AA88',
  [TileType.RETRACT_WALL]: '#887744',
  [TileType.MOVING_PLAT]: '#4488CC',
};
