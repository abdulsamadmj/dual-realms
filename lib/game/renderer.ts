// ============================================================
// Renderer - Single shared world, HUD, menus, pause screen
// ============================================================

import { TILE_SIZE, TileType, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import type { Crate, Player, GameWorldState } from './entities';
import type { Knight, Thief } from './entities';
import type { KeyBindings } from './input';
import { keyDisplayName } from './input';

// ---- Tile renderers ----

function drawTile(ctx: CanvasRenderingContext2D, type: number, x: number, y: number, gameState: GameWorldState): void {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;

  switch (type) {
    case TileType.SOLID: drawStoneTile(ctx, px, py); break;
    case TileType.BRIDGE:
      if (gameState.bridgeActive) drawBridgeTile(ctx, px, py);
      break;
    case TileType.WALL_GHOST: drawGhostWall(ctx, px, py); break;
    case TileType.LEVER: drawLever(ctx, px, py, gameState.leverPulled); break;
    case TileType.DOOR: drawDoor(ctx, px, py); break;
    case TileType.LOW_TUNNEL: drawLowTunnel(ctx, px, py); break;
    case TileType.LEDGE: drawStoneTile(ctx, px, py); break;
    case TileType.SPIKE: drawSpikeTile(ctx, px, py); break;
    case TileType.BUTTON_KNIGHT: drawButtonTile(ctx, px, py, '#CC4444', gameState.knightOnButton); break;
    case TileType.BUTTON_THIEF: drawButtonTile(ctx, px, py, '#44AA88', gameState.thiefOnButton); break;
    case TileType.RETRACT_WALL_A: drawRetractWall(ctx, px, py, '#887744', gameState.knightOnButton); break;
    case TileType.RETRACT_WALL_B: drawRetractWall(ctx, px, py, '#448877', gameState.thiefOnButton); break;
    default: break;
  }
}

function drawStoneTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#5C4033';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = '#6B4F3A';
  ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 2);
  ctx.fillRect(x + 1, y + 1, 2, TILE_SIZE - 2);
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(x + TILE_SIZE - 2, y + 1, 2, TILE_SIZE - 1);
  ctx.fillRect(x + 1, y + TILE_SIZE - 2, TILE_SIZE - 1, 2);
  ctx.fillStyle = '#4E3A2A';
  ctx.fillRect(x + 8, y + 8, 4, 4);
  ctx.fillRect(x + 20, y + 16, 4, 4);
  ctx.fillRect(x + 4, y + 20, 3, 3);
}

function drawLowTunnel(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#5C4033';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // Darker stripe to show it's a low ceiling
  ctx.fillStyle = '#3E2723';
  ctx.fillRect(x, y, TILE_SIZE, 6);
  ctx.fillStyle = '#4E3A2A';
  ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2);
  // Warning marks
  ctx.fillStyle = '#FFAA0044';
  ctx.fillRect(x + 4, y + TILE_SIZE - 6, 8, 2);
  ctx.fillRect(x + 20, y + TILE_SIZE - 6, 8, 2);
}

function drawBridgeTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = '#6B5335';
  ctx.lineWidth = 1;
  for (let i = 0; i < TILE_SIZE; i += 8) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + TILE_SIZE, y + i);
    ctx.stroke();
  }
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
  ctx.fillStyle = '#BBAADD';
  ctx.globalAlpha = alpha * 0.5;
  const shimmerY = (Math.sin(time * 3 + x * 0.1) + 1) * TILE_SIZE / 2;
  ctx.fillRect(x + 4, y + shimmerY, TILE_SIZE - 8, 4);
  ctx.restore();
}

function drawLever(ctx: CanvasRenderingContext2D, x: number, y: number, pulled: boolean): void {
  ctx.fillStyle = '#666';
  ctx.fillRect(x + 10, y + 16, 12, 16);
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
  ctx.beginPath();
  ctx.arc(pulled ? x + 24 : x + 8, y + 4, 3, 0, Math.PI * 2);
  ctx.fillStyle = pulled ? '#66CC66' : '#FFD700';
  ctx.fill();
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const time = Date.now() / 500;
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x + 2, y, TILE_SIZE - 4, TILE_SIZE);
  ctx.fillStyle = '#A0522D';
  ctx.fillRect(x + 4, y + 2, TILE_SIZE - 8, TILE_SIZE - 2);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(x + TILE_SIZE - 12, y + 14, 3, 3);
  ctx.save();
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 8 + Math.sin(time) * 4;
  ctx.fillStyle = '#FFD70044';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.restore();
}

function drawSpikeTile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = '#1a1012';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  const spikeCount = 4;
  const spikeW = TILE_SIZE / spikeCount;
  for (let i = 0; i < spikeCount; i++) {
    const sx = x + i * spikeW;
    ctx.fillStyle = '#AAA';
    ctx.beginPath();
    ctx.moveTo(sx, y + TILE_SIZE);
    ctx.lineTo(sx + spikeW / 2, y + 4);
    ctx.lineTo(sx + spikeW, y + TILE_SIZE);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#EEE';
    ctx.beginPath();
    ctx.moveTo(sx + spikeW / 2 - 1, y + 6);
    ctx.lineTo(sx + spikeW / 2, y + 4);
    ctx.lineTo(sx + spikeW / 2 + 1, y + 6);
    ctx.lineTo(sx + spikeW / 2, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#CC3333';
    ctx.fillRect(sx + spikeW / 2 - 1, y + 4, 2, 3);
  }
}

function drawButtonTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, pressed: boolean): void {
  drawStoneTile(ctx, x, y);
  const plateH = pressed ? 3 : 8;
  const plateY = y + TILE_SIZE - plateH;
  ctx.fillStyle = color;
  ctx.fillRect(x + 4, plateY, TILE_SIZE - 8, plateH);
  ctx.fillStyle = '#FFFFFF44';
  ctx.fillRect(x + 5, plateY, TILE_SIZE - 10, 2);

  if (pressed) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color + '88';
    ctx.fillRect(x + 2, plateY - 2, TILE_SIZE - 4, plateH + 4);
    ctx.restore();
  }
}

function drawRetractWall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, retracted: boolean): void {
  if (retracted) {
    // Draw ghost outline showing it's retracted
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  const time = Date.now() / 300;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = '#00000033';
  ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

  // Gear pattern
  ctx.fillStyle = '#FFFFFF22';
  const gearAngle = time * 2;
  for (let g = 0; g < 4; g++) {
    const gx = x + TILE_SIZE / 2 + Math.cos(gearAngle + g * 1.57) * 8;
    const gy = y + TILE_SIZE / 2 + Math.sin(gearAngle + g * 1.57) * 8;
    ctx.fillRect(gx - 2, gy - 2, 4, 4);
  }

  // Warning stripes
  ctx.strokeStyle = '#FFAA0044';
  ctx.lineWidth = 2;
  for (let i = 0; i < TILE_SIZE; i += 8) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + 8, y + TILE_SIZE);
    ctx.stroke();
  }
}

// ---- Background ----

function drawBackground(ctx: CanvasRenderingContext2D, worldW: number, worldH: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, worldH);
  gradient.addColorStop(0, '#0d0d20');
  gradient.addColorStop(0.4, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, worldW, worldH);

  // Torches
  ctx.fillStyle = '#FF660044';
  const torchSpacing = 160;
  for (let tx = 80; tx < worldW; tx += torchSpacing) {
    const flicker = Math.sin(Date.now() / 200 + tx) * 2;
    ctx.beginPath();
    ctx.arc(tx, 60 + flicker, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Main render: single world view ----

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  grid: number[][],
  knight: Knight,
  thief: Thief,
  crates: Crate[],
  gameState: GameWorldState,
  doorPos: { x: number; y: number },
): void {
  const worldW = (grid[0]?.length ?? 0) * TILE_SIZE;
  const worldH = grid.length * TILE_SIZE;

  // Camera follows midpoint of both players, clamped to world bounds
  const midX = (knight.x + thief.x) / 2;
  const midY = (knight.y + thief.y) / 2;
  const camX = Math.max(0, Math.min(midX - CANVAS_WIDTH / 2, worldW - CANVAS_WIDTH));
  const camY = Math.max(0, Math.min(midY - CANVAS_HEIGHT / 2, worldH - CANVAS_HEIGHT));

  ctx.save();
  ctx.translate(-camX, -camY);

  drawBackground(ctx, worldW, worldH);

  // Draw tiles
  // Only draw tiles in visible range for performance
  const startCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
  const endCol = Math.min((grid[0]?.length ?? 0) - 1, Math.ceil((camX + CANVAS_WIDTH) / TILE_SIZE) + 1);
  const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
  const endRow = Math.min(grid.length - 1, Math.ceil((camY + CANVAS_HEIGHT) / TILE_SIZE) + 1);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const type = grid[row][col];
      if (type !== TileType.EMPTY) {
        drawTile(ctx, type, col, row, gameState);
      }
    }
  }

  // Draw door
  drawDoor(ctx, doorPos.x, doorPos.y);

  // Draw crates
  for (const crate of crates) crate.draw(ctx);

  // Draw players
  knight.draw(ctx);
  thief.draw(ctx);

  ctx.restore();

  // HUD (fixed screen position)
  knight.drawHUD(ctx, 10);
  thief.drawHUD(ctx, CANVAS_WIDTH - 200);

  // Door status
  renderDoorStatus(ctx, knight, thief);
}

function renderDoorStatus(ctx: CanvasRenderingContext2D, knight: Knight, thief: Thief): void {
  ctx.save();
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';

  const y = CANVAS_HEIGHT - 14;
  const knightOk = knight.reachedDoor;
  const thiefOk = thief.reachedDoor;

  ctx.fillStyle = knightOk ? '#44FF44' : '#CC4444';
  ctx.fillText(knightOk ? 'KNIGHT: AT DOOR' : 'KNIGHT: Find the door', CANVAS_WIDTH / 2 - 110, y);

  ctx.fillStyle = thiefOk ? '#44FF44' : '#44AA88';
  ctx.fillText(thiefOk ? 'THIEF: AT DOOR' : 'THIEF: Find the door', CANVAS_WIDTH / 2 + 110, y);

  ctx.restore();
}

// ---- Menu ----

export function renderMenu(ctx: CanvasRenderingContext2D): void {
  const time = Date.now() / 1000;
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGrad.addColorStop(0, '#0a0a1a');
  bgGrad.addColorStop(0.5, '#12122a');
  bgGrad.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

  ctx.strokeStyle = '#FFD70033';
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - 280, centerY - 90, 560, 280);
  ctx.strokeRect(centerX - 278, centerY - 88, 556, 276);

  ctx.save();
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15 + Math.sin(time * 2) * 5;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DUAL REALMS', centerX, centerY - 40);
  ctx.restore();

  ctx.fillStyle = '#8888AA';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A Cooperative Platformer', centerX, centerY - 10);

  ctx.fillStyle = '#FFD70044';
  ctx.fillRect(centerX - 120, centerY + 5, 240, 1);

  const blink = Math.sin(time * 3) > 0;
  if (blink) {
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('Press SPACE or ENTER to Start', centerX, centerY + 35);
  }

  ctx.fillStyle = '#C8964C';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('-- CONTROLS --', centerX, centerY + 70);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#CC4444';
  ctx.fillText('KNIGHT', centerX, centerY + 95);
  ctx.fillStyle = '#999';
  ctx.fillText('WASD to Move  |  SHIFT to Activate Ghost Mode', centerX, centerY + 112);
  ctx.fillStyle = '#44AA88';
  ctx.fillText('THIEF', centerX, centerY + 140);
  ctx.fillStyle = '#999';
  ctx.fillText('Arrow Keys to Move  |  DOWN to Crouch  |  ENTER for Portal', centerX, centerY + 157);
  ctx.fillStyle = '#FFD70088';
  ctx.font = '10px monospace';
  ctx.fillText('Work together! Stand on pressure plates to open paths.', centerX, centerY + 182);
  ctx.fillText('Both players must reach the golden door to win.', centerX, centerY + 196);
}

// ---- Win screen ----

export function renderWinScreen(ctx: CanvasRenderingContext2D): void {
  const time = Date.now() / 1000;
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

// ---- Pause Menu ----

export type PauseTab = 'main' | 'controls';

export function renderPauseMenu(
  ctx: CanvasRenderingContext2D,
  tab: PauseTab,
  selectedIndex: number,
  bindings: KeyBindings,
  rebindingKey: string | null,
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const centerX = CANVAS_WIDTH / 2;
  const panelW = 420;
  const panelH = tab === 'controls' ? 380 : 240;
  const panelX = centerX - panelW / 2;
  const panelY = (CANVAS_HEIGHT - panelH) / 2;

  ctx.fillStyle = '#15152a';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', centerX, panelY + 35);

  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('ESC to resume', centerX, panelY + 50);

  if (tab === 'main') {
    renderPauseMain(ctx, centerX, panelY + 75, selectedIndex);
  } else {
    renderPauseControls(ctx, centerX, panelX, panelY + 70, panelW, selectedIndex, bindings, rebindingKey);
  }

  ctx.restore();
}

function renderPauseMain(ctx: CanvasRenderingContext2D, cx: number, startY: number, selected: number): void {
  const items = ['Resume', 'Controls', 'Restart Level', 'Quit to Menu'];

  for (let i = 0; i < items.length; i++) {
    const y = startY + i * 36;
    const isSelected = i === selected;

    if (isSelected) {
      ctx.fillStyle = '#FFD70022';
      ctx.fillRect(cx - 140, y - 14, 280, 28);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 140, y - 14, 280, 28);
    }

    ctx.fillStyle = isSelected ? '#FFD700' : '#999';
    ctx.font = isSelected ? 'bold 16px monospace' : '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(items[i], cx, y + 5);
  }

  ctx.fillStyle = '#555';
  ctx.font = '10px monospace';
  ctx.fillText('W/S or Up/Down to navigate  |  SPACE/ENTER to select', cx, startY + items.length * 36 + 20);
}

function renderPauseControls(
  ctx: CanvasRenderingContext2D,
  cx: number,
  panelX: number,
  startY: number,
  panelW: number,
  selected: number,
  bindings: KeyBindings,
  rebindingKey: string | null,
): void {
  ctx.fillStyle = '#CC4444';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('-- KNIGHT --', cx, startY);

  const knightBinds: [string, keyof KeyBindings][] = [
    ['Move Left', 'p1Left'],
    ['Move Right', 'p1Right'],
    ['Jump', 'p1Jump'],
    ['Ghost Mode', 'p1Ability'],
  ];

  let row = 0;
  for (const [label, key] of knightBinds) {
    const y = startY + 20 + row * 26;
    const isSelected = selected === row;
    const isRebinding = rebindingKey === key;

    if (isSelected) {
      ctx.fillStyle = '#FFD70022';
      ctx.fillRect(panelX + 10, y - 10, panelW - 20, 22);
    }

    ctx.fillStyle = isSelected ? '#FFF' : '#AAA';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, panelX + 30, y + 4);

    ctx.textAlign = 'right';
    if (isRebinding) {
      ctx.fillStyle = '#FF6600';
      ctx.fillText('Press any key...', panelX + panelW - 30, y + 4);
    } else {
      ctx.fillStyle = isSelected ? '#FFD700' : '#888';
      ctx.fillText(`[ ${keyDisplayName(bindings[key])} ]`, panelX + panelW - 30, y + 4);
    }
    row++;
  }

  ctx.fillStyle = '#44AA88';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('-- THIEF --', cx, startY + 20 + row * 26 + 10);
  row++;

  const thiefBinds: [string, keyof KeyBindings][] = [
    ['Move Left', 'p2Left'],
    ['Move Right', 'p2Right'],
    ['Jump', 'p2Jump'],
    ['Portal', 'p2Ability'],
    ['Crouch', 'p2Crouch'],
  ];

  for (const [label, key] of thiefBinds) {
    const y = startY + 20 + row * 26;
    const isSelected = selected === (row - 1);
    const isRebinding = rebindingKey === key;

    if (isSelected) {
      ctx.fillStyle = '#FFD70022';
      ctx.fillRect(panelX + 10, y - 10, panelW - 20, 22);
    }

    ctx.fillStyle = isSelected ? '#FFF' : '#AAA';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, panelX + 30, y + 4);

    ctx.textAlign = 'right';
    if (isRebinding) {
      ctx.fillStyle = '#FF6600';
      ctx.fillText('Press any key...', panelX + panelW - 30, y + 4);
    } else {
      ctx.fillStyle = isSelected ? '#FFD700' : '#888';
      ctx.fillText(`[ ${keyDisplayName(bindings[key])} ]`, panelX + panelW - 30, y + 4);
    }
    row++;
  }

  // Back button
  const backY = startY + 20 + row * 26 + 10;
  const isBackSelected = selected === knightBinds.length + thiefBinds.length;
  if (isBackSelected) {
    ctx.fillStyle = '#FFD70022';
    ctx.fillRect(cx - 60, backY - 10, 120, 22);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 60, backY - 10, 120, 22);
  }
  ctx.fillStyle = isBackSelected ? '#FFD700' : '#999';
  ctx.font = isBackSelected ? 'bold 12px monospace' : '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('< BACK', cx, backY + 4);

  ctx.fillStyle = '#555';
  ctx.font = '10px monospace';
  ctx.fillText('ENTER to rebind  |  ESC to go back', cx, backY + 30);
}

// ---- Tutorial hints (shown at bottom of screen) ----

export function renderTutorialHints(
  ctx: CanvasRenderingContext2D,
  gameState: GameWorldState,
): void {
  ctx.save();
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  const alpha = 0.6 + Math.sin(Date.now() / 500) * 0.2;
  ctx.globalAlpha = alpha;

  let hint = '';
  let color = '#FFAA44';

  if (!gameState.leverPulled) {
    hint = 'Explore together! The Thief can crouch under low ceilings. Find the lever to open the bridge.';
    color = '#FFAA44';
  } else if (!gameState.knightOnButton && !gameState.thiefOnButton) {
    hint = 'Stand on pressure plates to open paths for each other! Ghost walls block only the Knight normally.';
    color = '#88CCFF';
  } else if (gameState.knightOnButton) {
    hint = 'Knight plate active! Thief path ahead is open - go now!';
    color = '#CC4444';
  } else if (gameState.thiefOnButton) {
    hint = 'Thief plate active! Knight path ahead is open - go now!';
    color = '#44AA88';
  }

  if (hint) {
    // Background bar
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#00000088';
    ctx.fillRect(0, CANVAS_HEIGHT - 22, CANVAS_WIDTH, 22);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillText(hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 7);
  }

  ctx.restore();
}
