// ============================================================
// Main Game Controller
// ============================================================
// Manages game state, game loop, and coordinates all systems.
// States: 'menu' | 'playing' | 'win'
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT, HALF_HEIGHT, TILE_SIZE, TileType } from './constants';
import { InputManager } from './input';
import { Knight, Thief, Crate, type GameWorldState } from './entities';
import { TUTORIAL_LEVEL } from './levels';
import { renderPlatform, renderSplitLine, renderMenu, renderWinScreen, renderTutorialHints } from './renderer';
import { aabbOverlap } from './physics';

export type GameState = 'menu' | 'playing' | 'win';

// Solid tile types for collision
const SOLID_TYPES_NORMAL = new Set([
  TileType.SOLID,
  TileType.WALL_GHOST,
  TileType.LOW_TUNNEL,
  TileType.LEDGE,
  TileType.SPIKE,
]);

const SOLID_TYPES_WITH_BRIDGE = new Set([
  TileType.SOLID,
  TileType.BRIDGE,
  TileType.WALL_GHOST,
  TileType.LOW_TUNNEL,
  TileType.LEDGE,
  TileType.SPIKE,
]);

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: InputManager;
  state: GameState = 'menu';

  knight!: Knight;
  thief!: Thief;
  crates: Crate[] = [];
  worldState!: GameWorldState;

  topGrid!: number[][];
  bottomGrid!: number[][];

  animationFrameId: number = 0;
  lastTime: number = 0;
  onStateChange?: (state: GameState) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false; // Pixel art crisp rendering
    this.input = new InputManager();
  }

  start(): void {
    this.state = 'menu';
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.input.destroy();
  }

  private initLevel(): void {
    const level = TUTORIAL_LEVEL;

    // Deep copy grids so we can modify them
    this.topGrid = level.topGrid.map(row => [...row]);
    this.bottomGrid = level.bottomGrid.map(row => [...row]);

    // Create players
    this.knight = new Knight(level.knightSpawn.x, level.knightSpawn.y);
    this.thief = new Thief(level.thiefSpawn.x, level.thiefSpawn.y);

    // Create crates
    this.crates = level.cratePositions.map(
      cp => new Crate(cp.x, cp.y, cp.platform)
    );

    // Initialize world state
    this.worldState = {
      leverPulled: false,
      bridgeActive: false,
      crates: this.crates,
      topGrid: this.topGrid,
      bottomGrid: this.bottomGrid,
    };
  }

  private loop = (time: number): void => {
    const _dt = time - this.lastTime;
    this.lastTime = time;

    this.update();
    this.render();

    this.input.update();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    switch (this.state) {
      case 'menu':
        if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter')) {
          this.state = 'playing';
          this.initLevel();
          this.onStateChange?.('playing');
        }
        break;

      case 'playing':
        this.updatePlaying();
        break;

      case 'win':
        if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter')) {
          this.state = 'menu';
          this.onStateChange?.('menu');
        }
        break;
    }
  }

  private updatePlaying(): void {
    const p1Input = this.input.getPlayer1Input();
    const p2Input = this.input.getPlayer2Input();

    // Determine solid types based on bridge state
    const topSolids = this.worldState.bridgeActive ? SOLID_TYPES_WITH_BRIDGE : SOLID_TYPES_NORMAL;
    const bottomSolids = SOLID_TYPES_NORMAL;

    // Update players
    this.knight.update(p1Input, this.topGrid, topSolids, this.worldState);
    this.thief.update(p2Input, this.bottomGrid, bottomSolids, this.worldState);

    // Update crates
    for (const crate of this.crates) {
      if (crate.platform === 'top') {
        crate.update(this.topGrid, topSolids);
      } else {
        crate.update(this.bottomGrid, bottomSolids);
      }
    }

    // --- Interactions ---

    // Knight pushing crates
    for (const crate of this.crates) {
      if (crate.platform !== 'top') continue;
      const knightBox = this.knight.getAABB();
      const crateBox = crate.getAABB();

      // Expanded collision check for pushing
      const pushBox = {
        x: knightBox.x + (this.knight.facingRight ? knightBox.width - 4 : -crateBox.width + 4),
        y: knightBox.y,
        width: crateBox.width,
        height: knightBox.height,
      };

      if (aabbOverlap(pushBox, crateBox) && this.knight.grounded) {
        if (this.knight.vx > 0 && this.knight.facingRight) {
          crate.x += 2;
        } else if (this.knight.vx < 0 && !this.knight.facingRight) {
          crate.x -= 2;
        }
      }

      // Check if crate falls into a gap
      const crateCol = Math.floor((crate.x + crate.width / 2) / TILE_SIZE);
      const crateRow = Math.floor((crate.y + crate.height) / TILE_SIZE);
      if (crateRow < this.topGrid.length && crateCol < this.topGrid[0].length) {
        const belowTile = this.topGrid[crateRow]?.[crateCol];
        if (belowTile === TileType.GAP || belowTile === TileType.EMPTY) {
          // Check if crate is over a gap - let it fall to bottom platform
          if (crate.y + crate.height >= (this.topGrid.length - 3) * TILE_SIZE && !crate.falling) {
            crate.falling = true;
            // Transfer crate to bottom platform
            crate.platform = 'bottom';
            crate.y = TILE_SIZE; // Start at top of bottom platform
            // Place it at a useful horizontal position
            crate.x = Math.max(TILE_SIZE, Math.min(crate.x, (this.bottomGrid[0].length - 2) * TILE_SIZE));
          }
        }
      }
    }

    // Thief interacting with lever
    if (!this.worldState.leverPulled) {
      const leverPos = TUTORIAL_LEVEL.leverPosition;
      const leverBox = { x: leverPos.x, y: leverPos.y, width: TILE_SIZE, height: TILE_SIZE };
      const thiefBox = this.thief.getAABB();

      if (aabbOverlap(thiefBox, leverBox)) {
        // Auto-pull when close enough
        this.worldState.leverPulled = true;
        this.worldState.bridgeActive = true;
        // Update the top grid to include bridge tiles
        for (const bp of TUTORIAL_LEVEL.bridgePositions) {
          if (this.topGrid[bp.y]) {
            this.topGrid[bp.y][bp.x] = TileType.BRIDGE;
          }
        }
      }
    }

    // Check win condition
    const topDoor = TUTORIAL_LEVEL.topDoor;
    const bottomDoor = TUTORIAL_LEVEL.bottomDoor;

    this.knight.reachedDoor = this.knight.checkDoor(topDoor);
    this.thief.reachedDoor = this.thief.checkDoor(bottomDoor);

    if (this.knight.reachedDoor && this.thief.reachedDoor) {
      this.state = 'win';
      this.onStateChange?.('win');
    }
  }

  private render(): void {
    // Clear
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    switch (this.state) {
      case 'menu':
        renderMenu(this.ctx);
        break;

      case 'playing':
        // Top platform (Knight)
        const topCrates = this.crates.filter(c => c.platform === 'top');
        renderPlatform(
          this.ctx, this.topGrid, this.knight, topCrates,
          this.worldState, 0, true, TUTORIAL_LEVEL.topDoor,
        );

        // Split line
        renderSplitLine(this.ctx);

        // Bottom platform (Thief)
        const bottomCrates = this.crates.filter(c => c.platform === 'bottom');
        renderPlatform(
          this.ctx, this.bottomGrid, this.thief, bottomCrates,
          this.worldState, HALF_HEIGHT, false, TUTORIAL_LEVEL.bottomDoor,
        );

        // Door indicators
        this.renderDoorStatus();

        // Tutorial hints
        renderTutorialHints(
          this.ctx,
          this.worldState.leverPulled,
          this.worldState.bridgeActive,
          this.knight.x,
          this.thief.x,
        );
        break;

      case 'win':
        renderWinScreen(this.ctx);
        break;
    }
  }

  private renderDoorStatus(): void {
    const ctx = this.ctx;
    
    // Knight door status
    ctx.fillStyle = this.knight.reachedDoor ? '#44FF44' : '#FF4444';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.knight.reachedDoor ? 'AT DOOR' : 'Find the door ->',
      CANVAS_WIDTH - 10, 20,
    );

    // Thief door status
    ctx.fillText(
      this.thief.reachedDoor ? 'AT DOOR' : 'Find the door ->',
      CANVAS_WIDTH - 10, HALF_HEIGHT + 20,
    );
    ctx.textAlign = 'left';
  }
}
