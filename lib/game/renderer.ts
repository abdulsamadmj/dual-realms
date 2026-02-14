// ============================================================
// Renderer - Draws the game world (tiles, entities, effects)
// ============================================================

import { TILE_SIZE, TileType, CANVAS_WIDTH, CANVAS_HEIGHT, HALF_HEIGHT } from './constants';
import type { Crate, Player, GameWorldState } from './entities';

// Tile render with pixel art style
function drawTile(ctx: CanvasRenderingContext2D, type: number, x: number, y: number, gameState: GameWorldState): void {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;

  switch (type) {
    case TileType.SOLID:
      drawStoneTile(ctx, px, py);
      break;
    case TileType.BRIDGE:
      if (gameState.bridgeActive) {
        drawBridgeTile(ctx, px, py);
      }
      break;
    case TileType.WALL_GHOST:
      drawGhostWall(ctx, px, py);
      break;
    case TileType.LEVER:
      drawLever(ctx, px, py, gameState.leverPulled);
      break;
    case TileType.DOOR:
      drawDoor(ctx, px, py);
      break;
    case TileType.GAP:
      // Draw nothing - it's a gap
      break;
    case TileType.LOW_TUNNEL:
      drawStoneTile(ctx, px, py);
      break;
    case TileType.LEDGE:
      drawStoneTile(ctx, px, py);
      break;
    case TileType.SPIKE:
      drawSpikeTile(ctx, px, py);
      break;
    default:
      break;
  }
}

function drawStoneTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Base
  ctx.fillStyle = '#5C4033';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // Highlight
  ctx.fillStyle = '#6B4F3A';
  ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 2);
  ctx.fillRect(x + 1, y + 1, 2, TILE_SIZE - 2);
  // Shadow
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(x + TILE_SIZE - 2, y + 1, 2, TILE_SIZE - 1);
  ctx.fillRect(x + 1, y + TILE_SIZE - 2, TILE_SIZE - 1, 2);
  // Detail pixels
  ctx.fillStyle = '#4E3A2A';
  ctx.fillRect(x + 8, y + 8, 4, 4);
  ctx.fillRect(x + 20, y + 16, 4, 4);
  ctx.fillRect(x + 4, y + 20, 3, 3);
}

function drawBridgeTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // Wood plank lines
  ctx.strokeStyle = '#6B5335';
  ctx.lineWidth = 1;
  for (let i = 0; i < TILE_SIZE; i += 8) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + TILE_SIZE, y + i);
    ctx.stroke();
  }
  // Nails
  ctx.fillStyle = '#999';
  ctx.fillRect(x + 4, y + 4, 2, 2);
  ctx.fillRect(x + TILE_SIZE - 6, y + 4, 2, 2);
}

function drawGhostWall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const time = Date.now() / 1000;
  const alpha = 0.5 + Math.sin(time * 2) * 0.15;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#7B6B8B';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = '#9B8BAB';
  ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  // Shimmer effect
  ctx.fillStyle = '#BBAADD';
  ctx.globalAlpha = alpha * 0.5;
  const shimmerY = (Math.sin(time * 3 + x * 0.1) + 1) * TILE_SIZE / 2;
  ctx.fillRect(x + 4, y + shimmerY, TILE_SIZE - 8, 4);
  ctx.restore();
}

function drawLever(ctx: CanvasRenderingContext2D, x: number, y: number, pulled: boolean): void {
  // Base
  ctx.fillStyle = '#666';
  ctx.fillRect(x + 10, y + 16, 12, 16);
  // Handle
  ctx.fillStyle = pulled ? '#44AA44' : '#FFD700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (pulled) {
    ctx.moveTo(x + 16, y + 16);
    ctx.lineTo(x + 24, y + 4);
  } else {
    ctx.moveTo(x + 16, y + 16);
    ctx.lineTo(x + 8, y + 4);
  }
  ctx.strokeStyle = pulled ? '#44AA44' : '#FFD700';
  ctx.stroke();
  // Knob
  ctx.beginPath();
  ctx.arc(pulled ? x + 24 : x + 8, y + 4, 3, 0, Math.PI * 2);
  ctx.fillStyle = pulled ? '#66CC66' : '#FFD700';
  ctx.fill();
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const time = Date.now() / 500;
  
  // Door frame
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x + 2, y, TILE_SIZE - 4, TILE_SIZE);
  // Door body
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(x + 4, y + 2, TILE_SIZE - 8, TILE_SIZE - 2);
  // Handle
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(x + TILE_SIZE - 12, y + 14, 3, 3);
  // Glow effect
  ctx.save();
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 8 + Math.sin(time) * 4;
  ctx.fillStyle = '#FFD70044';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.restore();
}

function drawSpikeTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#5C4033';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // Spike teeth at bottom
  ctx.fillStyle = '#3E2723';
  for (let i = 0; i < TILE_SIZE; i += 8) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + TILE_SIZE);
    ctx.lineTo(x + i + 4, y + TILE_SIZE - 8);
    ctx.lineTo(x + i + 8, y + TILE_SIZE);
    ctx.fill();
  }
}

// Background drawing with parallax-style depth
function drawBackground(ctx: CanvasRenderingContext2D, y: number, height: number, isTop: boolean): void {
  // Sky gradient
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  if (isTop) {
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
  } else {
    gradient.addColorStop(0, '#0f3460');
    gradient.addColorStop(1, '#1a1a2e');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, CANVAS_WIDTH, height);

  // Background decorations - torches on walls
  ctx.fillStyle = '#FF660044';
  const torchSpacing = 160;
  for (let tx = 80; tx < CANVAS_WIDTH; tx += torchSpacing) {
    const flicker = Math.sin(Date.now() / 200 + tx) * 2;
    ctx.beginPath();
    ctx.arc(tx, y + 40 + flicker, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Main Render Functions ----

export function renderPlatform(
  ctx: CanvasRenderingContext2D,
  grid: number[][],
  player: Player,
  crates: Crate[],
  gameState: GameWorldState,
  offsetY: number,
  isTop: boolean,
  doorPos: { x: number; y: number },
): void {
  ctx.save();
  
  // Clip to this half of the screen
  ctx.beginPath();
  ctx.rect(0, offsetY, CANVAS_WIDTH, HALF_HEIGHT);
  ctx.clip();
  
  // Camera follows player horizontally
  const cameraX = Math.max(0, player.x - CANVAS_WIDTH / 3);
  
  ctx.translate(-cameraX, offsetY);
  
  // Draw background
  drawBackground(ctx, 0, HALF_HEIGHT, isTop);
  
  // Draw tiles
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const type = grid[row][col];
      if (type !== TileType.EMPTY) {
        drawTile(ctx, type, col, row, gameState);
      }
    }
  }

  // Draw door
  drawDoor(ctx, doorPos.x, doorPos.y);

  // Draw crates
  for (const crate of crates) {
    crate.draw(ctx);
  }

  // Draw player
  player.draw(ctx);

  ctx.restore();

  // Draw HUD (not affected by camera)
  player.drawHUD(ctx, offsetY);
}

export function renderSplitLine(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, HALF_HEIGHT - 1, CANVAS_WIDTH, 2);
}

export function renderMenu(ctx: CanvasRenderingContext2D): void {
  const time = Date.now() / 1000;

  // Dark background with subtle gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, '#0a0a1a');
  bgGrad.addColorStop(0.5, '#12122a');
  bgGrad.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Animated particles (floating dust)
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const px = ((time * 20 + i * 137) % CANVAS_WIDTH);
    const py = ((Math.sin(time + i * 0.7) * 50) + 100 + i * 25) % CANVAS_HEIGHT;
    ctx.globalAlpha = 0.2 + Math.sin(time * 2 + i) * 0.15;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(px, py, 2, 2);
  }
  ctx.restore();

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2 - 50;

  // Decorative border line
  ctx.strokeStyle = '#FFD70033';
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - 280, centerY - 90, 560, 280);
  ctx.strokeRect(centerX - 278, centerY - 88, 556, 276);

  // Title with animated glow
  ctx.save();
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15 + Math.sin(time * 2) * 5;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DUAL REALMS', centerX, centerY - 40);
  ctx.restore();

  // Subtitle
  ctx.fillStyle = '#8888AA';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A Cooperative Platformer', centerX, centerY - 10);

  // Divider
  ctx.fillStyle = '#FFD70044';
  ctx.fillRect(centerX - 120, centerY + 5, 240, 1);

  // Blinking start prompt
  const blink = Math.sin(time * 3) > 0;
  if (blink) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Press SPACE or ENTER to Start', centerX, centerY + 35);
  }

  // Controls section
  ctx.fillStyle = '#C8964C';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('-- CONTROLS --', centerX, centerY + 70);

  ctx.font = '11px monospace';

  // Knight controls
  ctx.fillStyle = '#CC4444';
  ctx.fillText('KNIGHT (Top Platform)', centerX, centerY + 95);
  ctx.fillStyle = '#999';
  ctx.fillText('WASD to Move  |  SHIFT to Toggle Ghost Mode', centerX, centerY + 112);

  // Thief controls
  ctx.fillStyle = '#44AA88';
  ctx.fillText('THIEF (Bottom Platform)', centerX, centerY + 140);
  ctx.fillStyle = '#999';
  ctx.fillText('Arrow Keys to Move  |  DOWN to Crouch  |  ENTER for Portal', centerX, centerY + 157);

  // Goal
  ctx.fillStyle = '#FFD70088';
  ctx.font = '10px monospace';
  ctx.fillText('Both players must reach the golden door to complete the level', centerX, centerY + 185);
}

export function renderWinScreen(ctx: CanvasRenderingContext2D): void {
  const time = Date.now() / 1000;

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Celebration particles
  ctx.save();
  for (let i = 0; i < 30; i++) {
    const angle = (time * 0.5 + i * 0.21) * Math.PI * 2;
    const radius = 80 + i * 6 + Math.sin(time * 2 + i) * 20;
    const px = CANVAS_WIDTH / 2 + Math.cos(angle) * radius;
    const py = CANVAS_HEIGHT / 2 + Math.sin(angle) * radius * 0.4;
    ctx.globalAlpha = 0.4 + Math.sin(time * 3 + i) * 0.3;
    ctx.fillStyle = i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#44FF44' : '#FF6644';
    ctx.fillRect(px, py, 3, 3);
  }
  ctx.restore();

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2 - 30;

  ctx.save();
  ctx.shadowColor = '#44FF44';
  ctx.shadowBlur = 20 + Math.sin(time * 2) * 8;
  ctx.fillStyle = '#44FF44';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('LEVEL COMPLETE!', centerX, centerY - 20);
  ctx.restore();

  ctx.fillStyle = '#FFD700';
  ctx.font = '16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Both heroes reached the exit!', centerX, centerY + 25);

  const blink = Math.sin(time * 3) > 0;
  if (blink) {
    ctx.fillStyle = '#AAA';
    ctx.font = '14px monospace';
    ctx.fillText('Press SPACE to return to menu', centerX, centerY + 60);
  }
}

// Tutorial hints shown during gameplay
export function renderTutorialHints(
  ctx: CanvasRenderingContext2D,
  leverPulled: boolean,
  bridgeActive: boolean,
  knightX: number,
  thiefX: number,
): void {
  ctx.save();
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  const alpha = 0.6 + Math.sin(Date.now() / 500) * 0.2;
  ctx.globalAlpha = alpha;

  // Knight hints (top half)
  if (!bridgeActive) {
    ctx.fillStyle = '#FFAA44';
    ctx.fillText('Wait for the bridge! The Thief must pull the lever below.', CANVAS_WIDTH / 2, HALF_HEIGHT - 16);
  } else if (knightX < 400) {
    ctx.fillStyle = '#88CCFF';
    ctx.fillText('Press SHIFT to toggle Ghost Mode and pass through purple walls!', CANVAS_WIDTH / 2, HALF_HEIGHT - 16);
  } else if (knightX < 550) {
    ctx.fillStyle = '#FFAA44';
    ctx.fillText('Push the crate into the gap! Walk into it to push.', CANVAS_WIDTH / 2, HALF_HEIGHT - 16);
  }

  // Thief hints (bottom half)
  if (!leverPulled && thiefX < 200) {
    ctx.fillStyle = '#FFAA44';
    ctx.fillText('Press DOWN to crouch and fit through the low tunnel ahead!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);
  } else if (!leverPulled) {
    ctx.fillStyle = '#FFD700';
    ctx.fillText('Walk to the lever to pull it and help the Knight!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);
  } else if (thiefX < 500) {
    ctx.fillStyle = '#44AA88';
    ctx.fillText('Use the crate from above to reach the high ledge!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);
  } else {
    ctx.fillStyle = '#FF6600';
    ctx.fillText('Press ENTER to place portals and cross the gap!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 8);
  }

  ctx.restore();
}
