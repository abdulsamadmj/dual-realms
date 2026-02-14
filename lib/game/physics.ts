// ============================================================
// Physics & Collision Detection
// ============================================================

import { GRAVITY, MAX_FALL_SPEED, TILE_SIZE, TileType } from './constants';

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check if a bounding box overlaps any solid tile in the level grid.
 * Returns the list of tile positions that overlap.
 */
export function checkTileCollisions(
  box: AABB,
  grid: number[][],
  solidTypes: Set<number>,
): { col: number; row: number; type: number }[] {
  const results: { col: number; row: number; type: number }[] = [];

  const startCol = Math.floor(box.x / TILE_SIZE);
  const endCol = Math.floor((box.x + box.width - 1) / TILE_SIZE);
  const startRow = Math.floor(box.y / TILE_SIZE);
  const endRow = Math.floor((box.y + box.height - 1) / TILE_SIZE);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (row >= 0 && row < grid.length && col >= 0 && col < (grid[0]?.length ?? 0)) {
        const type = grid[row][col];
        if (solidTypes.has(type)) {
          results.push({ col, row, type });
        }
      }
    }
  }

  return results;
}

/**
 * Apply gravity to a velocity Y component.
 */
export function applyGravity(vy: number): number {
  return Math.min(vy + GRAVITY, MAX_FALL_SPEED);
}

/**
 * Resolve horizontal movement against solid tiles.
 * Returns the corrected x position.
 */
export function resolveHorizontal(
  entity: AABB,
  vx: number,
  grid: number[][],
  solidTypes: Set<number>,
): { x: number; vx: number } {
  const newBox = { ...entity, x: entity.x + vx };
  const hits = checkTileCollisions(newBox, grid, solidTypes);

  if (hits.length === 0) {
    return { x: newBox.x, vx };
  }

  // Snap to tile edge
  if (vx > 0) {
    const minCol = Math.min(...hits.map((h) => h.col));
    return { x: minCol * TILE_SIZE - entity.width, vx: 0 };
  } else {
    const maxCol = Math.max(...hits.map((h) => h.col));
    return { x: (maxCol + 1) * TILE_SIZE, vx: 0 };
  }
}

/**
 * Resolve vertical movement against solid tiles.
 * Returns the corrected y position and grounded status.
 */
export function resolveVertical(
  entity: AABB,
  vy: number,
  grid: number[][],
  solidTypes: Set<number>,
): { y: number; vy: number; grounded: boolean } {
  const newBox = { ...entity, y: entity.y + vy };
  const hits = checkTileCollisions(newBox, grid, solidTypes);

  if (hits.length === 0) {
    return { y: newBox.y, vy, grounded: false };
  }

  if (vy > 0) {
    // Falling — land on top
    const minRow = Math.min(...hits.map((h) => h.row));
    return { y: minRow * TILE_SIZE - entity.height, vy: 0, grounded: true };
  } else {
    // Jumping — hit ceiling
    const maxRow = Math.max(...hits.map((h) => h.row));
    return { y: (maxRow + 1) * TILE_SIZE, vy: 0, grounded: false };
  }
}
