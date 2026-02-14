// ============================================================
// Game Entities - Players, Crates, Portals, etc.
// ============================================================

import {
  TILE_SIZE, PLAYER_SPEED, JUMP_FORCE, GHOST_COOLDOWN, PORTAL_COOLDOWN,
  KNIGHT_SPRITE, THIEF_SPRITE, TileType,
} from './constants';
import { SpriteSheet, Animator } from './sprites';
import { applyGravity, resolveHorizontal, resolveVertical, AABB, aabbOverlap } from './physics';
import type { PlayerInput } from './input';

// ---- Portal Entity ----

export interface Portal {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  animFrame: number;
}

// ---- Crate Entity ----

export class Crate {
  x: number;
  y: number;
  width: number = 30;
  height: number = 30;
  vy: number = 0;
  grounded: boolean = false;
  platform: 'top' | 'bottom';
  falling: boolean = false;

  constructor(x: number, y: number, platform: 'top' | 'bottom') {
    this.x = x;
    this.y = y;
    this.platform = platform;
  }

  getAABB(): AABB {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  update(grid: number[][], solidTypes: Set<number>): void {
    this.vy = applyGravity(this.vy);
    const vResult = resolveVertical(this.getAABB(), this.vy, grid, solidTypes);
    this.y = vResult.y;
    this.vy = vResult.vy;
    this.grounded = vResult.grounded;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Wooden crate with pixel art style
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
    // Cross pattern
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x + 4, this.y + 4);
    ctx.lineTo(this.x + this.width - 4, this.y + this.height - 4);
    ctx.moveTo(this.x + this.width - 4, this.y + 4);
    ctx.lineTo(this.x + 4, this.y + this.height - 4);
    ctx.stroke();
  }
}

// ---- Base Player ----

export abstract class Player {
  x: number;
  y: number;
  width: number = 28;
  height: number = 48;
  vx: number = 0;
  vy: number = 0;
  grounded: boolean = false;
  facingRight: boolean = true;
  animator: Animator = new Animator();
  spriteSheet!: SpriteSheet;
  reachedDoor: boolean = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  getAABB(): AABB {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  abstract update(input: PlayerInput, grid: number[][], solidTypes: Set<number>, gameState: GameWorldState): void;
  abstract draw(ctx: CanvasRenderingContext2D): void;
  abstract drawHUD(ctx: CanvasRenderingContext2D, offsetY: number): void;

  protected baseMovement(input: PlayerInput, grid: number[][], solidTypes: Set<number>): void {
    // Horizontal
    this.vx = 0;
    if (input.left) {
      this.vx = -PLAYER_SPEED;
      this.facingRight = false;
    }
    if (input.right) {
      this.vx = PLAYER_SPEED;
      this.facingRight = true;
    }

    // Jump
    if (input.jump && this.grounded) {
      this.vy = JUMP_FORCE;
      this.grounded = false;
    }

    // Apply gravity
    this.vy = applyGravity(this.vy);

    // Resolve collisions
    const hResult = resolveHorizontal(this.getAABB(), this.vx, grid, solidTypes);
    this.x = hResult.x;
    this.vx = hResult.vx;

    const vResult = resolveVertical(this.getAABB(), this.vy, grid, solidTypes);
    this.y = vResult.y;
    this.vy = vResult.vy;
    this.grounded = vResult.grounded;
  }

  protected updateAnimation(animName: string, speed: number): void {
    this.animator.update(animName, speed);
  }

  protected drawSprite(ctx: CanvasRenderingContext2D, alpha: number = 1.0): void {
    if (!this.spriteSheet) return;
    const drawX = this.x - 20;
    const drawY = this.y - 16;
    this.spriteSheet.draw(
      ctx,
      drawX,
      drawY,
      this.animator.currentAnimation,
      this.animator.getFrame(),
      !this.facingRight,
      alpha,
      2.0,
    );
  }

  checkDoor(doorPos: { x: number; y: number }): boolean {
    const doorBox: AABB = { x: doorPos.x, y: doorPos.y, width: TILE_SIZE, height: TILE_SIZE };
    return aabbOverlap(this.getAABB(), doorBox);
  }
}

// ---- Knight ----

export class Knight extends Player {
  ghostMode: boolean = false;
  ghostCooldown: number = 0;
  normalSprite!: SpriteSheet;
  ghostSprite!: SpriteSheet;

  constructor(x: number, y: number) {
    super(x, y);
    this.normalSprite = new SpriteSheet('/sprites/Knight_Normal.png', KNIGHT_SPRITE);
    this.ghostSprite = new SpriteSheet('/sprites/Knight_Ghost.png', KNIGHT_SPRITE);
    this.spriteSheet = this.normalSprite;
  }

  update(input: PlayerInput, grid: number[][], solidTypes: Set<number>, _gameState: GameWorldState): void {
    // Toggle ghost mode
    if (input.ability && this.ghostCooldown <= 0) {
      this.ghostMode = !this.ghostMode;
      this.ghostCooldown = GHOST_COOLDOWN;
      this.spriteSheet = this.ghostMode ? this.ghostSprite : this.normalSprite;
    }
    if (this.ghostCooldown > 0) {
      this.ghostCooldown -= 16.67; // ~60fps
    }

    // Adjust solid types based on ghost mode
    const activeSolids = new Set(solidTypes);
    if (this.ghostMode) {
      activeSolids.delete(TileType.WALL_GHOST);
    }

    this.baseMovement(input, grid, activeSolids);

    // Animation
    const config = KNIGHT_SPRITE;
    if (!this.grounded) {
      this.updateAnimation('jump', config.jump.speed);
    } else if (this.vx !== 0) {
      this.updateAnimation('run', config.run.speed);
    } else {
      this.updateAnimation('idle', config.idle.speed);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.ghostMode ? 0.5 : 1.0;

    // Ghost glow effect
    if (this.ghostMode) {
      ctx.save();
      ctx.shadowColor = '#88CCFF';
      ctx.shadowBlur = 15;
      this.drawSprite(ctx, alpha);
      ctx.restore();
    } else {
      this.drawSprite(ctx, alpha);
    }
  }

  drawHUD(ctx: CanvasRenderingContext2D, offsetY: number): void {
    // Ghost mode cooldown bar
    const barX = 10;
    const barY = offsetY + 10;
    const barW = 100;
    const barH = 8;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    const cooldownPercent = Math.max(0, 1 - this.ghostCooldown / GHOST_COOLDOWN);
    ctx.fillStyle = this.ghostMode ? '#88CCFF' : '#44AA44';
    ctx.fillRect(barX, barY, barW * cooldownPercent, barH);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.fillText(this.ghostMode ? 'GHOST' : 'SOLID', barX + barW + 5, barY + 8);

    // Player label
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('KNIGHT (WASD + Shift)', barX, barY + 24);
  }
}

// ---- Thief ----

export class Thief extends Player {
  crouching: boolean = false;
  portalCooldown: number = 0;
  portals: Portal[] = [];
  portalPairReady: boolean = true;
  normalHeight: number = 48;
  crouchHeight: number = 28;

  constructor(x: number, y: number) {
    super(x, y);
    this.spriteSheet = new SpriteSheet('/sprites/Thief.png', THIEF_SPRITE);
  }

  update(input: PlayerInput, grid: number[][], solidTypes: Set<number>, _gameState: GameWorldState): void {
    // Toggle crouch
    if (input.crouch && this.grounded) {
      this.crouching = !this.crouching;
      if (this.crouching) {
        this.height = this.crouchHeight;
        // Move y down so feet stay on ground
        this.y += this.normalHeight - this.crouchHeight;
      } else {
        // Check if there's room to stand
        const standBox: AABB = {
          x: this.x,
          y: this.y - (this.normalHeight - this.crouchHeight),
          width: this.width,
          height: this.normalHeight,
        };
        const blocked = checkStandCollision(standBox, grid, solidTypes);
        if (!blocked) {
          this.y -= this.normalHeight - this.crouchHeight;
          this.height = this.normalHeight;
        } else {
          this.crouching = true; // Can't stand up
        }
      }
    }

    // Portal ability
    if (input.ability && this.portalCooldown <= 0) {
      this.placePortal();
    }
    if (this.portalCooldown > 0) {
      this.portalCooldown -= 16.67;
    }

    this.baseMovement(input, grid, solidTypes);

    // Check portal teleportation
    this.checkPortalTeleport();

    // Animation
    const config = THIEF_SPRITE;
    if (this.crouching) {
      this.updateAnimation('crouch', config.crouch!.speed);
    } else if (!this.grounded) {
      // Use run for jump since thief has no jump animation row
      this.updateAnimation('run', config.run.speed);
    } else if (this.vx !== 0) {
      this.updateAnimation('run', config.run.speed);
    } else {
      this.updateAnimation('idle', config.idle.speed);
    }
  }

  private placePortal(): void {
    const portalX = this.facingRight ? this.x + this.width + 8 : this.x - 24;
    const portalY = this.y;

    if (this.portals.length < 2) {
      this.portals.push({
        x: portalX,
        y: portalY,
        width: 16,
        height: 48,
        color: this.portals.length === 0 ? '#FF6600' : '#0066FF',
        animFrame: 0,
      });
    } else {
      // Replace - remove both and start fresh
      this.portals = [{
        x: portalX,
        y: portalY,
        width: 16,
        height: 48,
        color: '#FF6600',
        animFrame: 0,
      }];
    }
    this.portalCooldown = PORTAL_COOLDOWN;
  }

  private checkPortalTeleport(): void {
    if (this.portals.length < 2) return;
    
    const playerBox = this.getAABB();
    
    for (let i = 0; i < 2; i++) {
      const portal = this.portals[i];
      const otherPortal = this.portals[1 - i];
      const portalBox: AABB = { x: portal.x, y: portal.y, width: portal.width, height: portal.height };
      
      if (aabbOverlap(playerBox, portalBox)) {
        this.x = otherPortal.x + otherPortal.width / 2 - this.width / 2;
        this.y = otherPortal.y;
        // Remove portals after use
        this.portals = [];
        this.portalCooldown = PORTAL_COOLDOWN;
        break;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw portals
    for (const portal of this.portals) {
      this.drawPortal(ctx, portal);
    }

    this.drawSprite(ctx);
  }

  private drawPortal(ctx: CanvasRenderingContext2D, portal: Portal): void {
    const time = Date.now() / 200;
    
    ctx.save();
    
    // Outer glow
    ctx.shadowColor = portal.color;
    ctx.shadowBlur = 12 + Math.sin(time) * 4;
    
    // Portal oval
    ctx.fillStyle = portal.color;
    ctx.beginPath();
    ctx.ellipse(
      portal.x + portal.width / 2,
      portal.y + portal.height / 2,
      portal.width / 2,
      portal.height / 2,
      0, 0, Math.PI * 2,
    );
    ctx.fill();
    
    // Inner swirl
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.5 + Math.sin(time * 2) * 0.3;
    ctx.beginPath();
    ctx.ellipse(
      portal.x + portal.width / 2,
      portal.y + portal.height / 2,
      portal.width / 4,
      portal.height / 4,
      time, 0, Math.PI * 2,
    );
    ctx.fill();
    
    ctx.restore();
  }

  drawHUD(ctx: CanvasRenderingContext2D, offsetY: number): void {
    const barX = 10;
    const barY = offsetY + 10;
    const barW = 100;
    const barH = 8;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    const cooldownPercent = Math.max(0, 1 - this.portalCooldown / PORTAL_COOLDOWN);
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(barX, barY, barW * cooldownPercent, barH);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.fillText(`PORTAL (${this.portals.length}/2)`, barX + barW + 5, barY + 8);

    // Crouch status
    if (this.crouching) {
      ctx.fillStyle = '#FFAA00';
      ctx.fillText('CROUCHING', barX + barW + 80, barY + 8);
    }

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('THIEF (Arrows + Enter)', barX, barY + 24);
  }
}

// Helper to check if standing up is blocked
function checkStandCollision(box: AABB, grid: number[][], solidTypes: Set<number>): boolean {
  const startCol = Math.floor(box.x / TILE_SIZE);
  const endCol = Math.floor((box.x + box.width - 1) / TILE_SIZE);
  const startRow = Math.floor(box.y / TILE_SIZE);
  const endRow = Math.floor((box.y + box.height - 1) / TILE_SIZE);

  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      if (row >= 0 && row < grid.length && col >= 0 && col < (grid[0]?.length ?? 0)) {
        if (solidTypes.has(grid[row][col])) return true;
      }
    }
  }
  return false;
}

// ---- Game World State (shared between platforms) ----

export interface GameWorldState {
  leverPulled: boolean;
  bridgeActive: boolean;
  crates: Crate[];
  topGrid: number[][];
  bottomGrid: number[][];
}
