// ============================================================
// Main Game Controller
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT, HALF_HEIGHT, TILE_SIZE, TileType } from './constants';
import { InputManager, type KeyBindings } from './input';
import { Knight, Thief, Crate, isStandingOnTile, type GameWorldState } from './entities';
import { TUTORIAL_LEVEL } from './levels';
import {
  renderPlatform, renderSplitLine, renderMenu, renderWinScreen,
  renderTutorialHints, renderPauseMenu, type PauseTab,
} from './renderer';
import { aabbOverlap } from './physics';

export type GameState = 'menu' | 'playing' | 'paused' | 'win';

// Solid tile types for collision
const SOLID_TYPES_NORMAL = new Set([
  TileType.SOLID,
  TileType.WALL_GHOST,
  TileType.LOW_TUNNEL,
  TileType.LEDGE,
  TileType.RETRACT_WALL,
]);

const SOLID_TYPES_WITH_BRIDGE = new Set([
  TileType.SOLID,
  TileType.BRIDGE,
  TileType.WALL_GHOST,
  TileType.LOW_TUNNEL,
  TileType.LEDGE,
  TileType.RETRACT_WALL,
]);

// Same but with retractable walls removed (when button is pressed)
function withoutRetract(set: Set<number>): Set<number> {
  const copy = new Set(set);
  copy.delete(TileType.RETRACT_WALL);
  return copy;
}

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

  // Pause menu state
  pauseTab: PauseTab = 'main';
  pauseSelectedIndex: number = 0;
  pauseRebindingKey: string | null = null;
  pauseMainItems = ['Resume', 'Controls', 'Restart Level', 'Quit to Menu'];
  pauseControlItems = 9 + 1; // 4 knight + 5 thief + 1 back button

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
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
    this.topGrid = level.topGrid.map(row => [...row]);
    this.bottomGrid = level.bottomGrid.map(row => [...row]);
    this.knight = new Knight(level.knightSpawn.x, level.knightSpawn.y);
    this.thief = new Thief(level.thiefSpawn.x, level.thiefSpawn.y);
    this.crates = level.cratePositions.map(
      cp => new Crate(cp.x, cp.y, cp.platform)
    );
    this.worldState = {
      leverPulled: false,
      bridgeActive: false,
      knightOnButton: false,
      thiefOnButton: false,
      crates: this.crates,
      topGrid: this.topGrid,
      bottomGrid: this.bottomGrid,
    };
  }

  private loop = (time: number): void => {
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
        // Check for pause
        if (this.input.isPausePressed()) {
          this.state = 'paused';
          this.pauseTab = 'main';
          this.pauseSelectedIndex = 0;
          this.pauseRebindingKey = null;
          this.onStateChange?.('paused');
          break;
        }
        this.updatePlaying();
        break;

      case 'paused':
        this.updatePaused();
        break;

      case 'win':
        if (this.input.isKeyPressed('Space') || this.input.isKeyPressed('Enter')) {
          this.state = 'menu';
          this.onStateChange?.('menu');
        }
        break;
    }
  }

  private updatePaused(): void {
    // If we're mid-rebind, the InputManager captures the next key
    if (this.input.rebindTarget) return;

    // ESC to resume or go back
    if (this.input.isPausePressed()) {
      if (this.pauseTab === 'controls') {
        this.pauseTab = 'main';
        this.pauseSelectedIndex = 0;
      } else {
        this.state = 'playing';
        this.onStateChange?.('playing');
      }
      return;
    }

    if (this.pauseTab === 'main') {
      this.updatePauseMain();
    } else {
      this.updatePauseControls();
    }
  }

  private updatePauseMain(): void {
    // Navigate
    if (this.input.isJustPressed('KeyW') || this.input.isJustPressed('ArrowUp')) {
      this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + this.pauseMainItems.length) % this.pauseMainItems.length;
    }
    if (this.input.isJustPressed('KeyS') || this.input.isJustPressed('ArrowDown')) {
      this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % this.pauseMainItems.length;
    }

    // Select
    if (this.input.isJustPressed('Space') || this.input.isJustPressed('Enter')) {
      switch (this.pauseSelectedIndex) {
        case 0: // Resume
          this.state = 'playing';
          this.onStateChange?.('playing');
          break;
        case 1: // Controls
          this.pauseTab = 'controls';
          this.pauseSelectedIndex = 0;
          break;
        case 2: // Restart
          this.initLevel();
          this.state = 'playing';
          this.onStateChange?.('playing');
          break;
        case 3: // Quit
          this.state = 'menu';
          this.onStateChange?.('menu');
          break;
      }
    }
  }

  private updatePauseControls(): void {
    const totalItems = this.pauseControlItems;

    if (this.input.isJustPressed('KeyW') || this.input.isJustPressed('ArrowUp')) {
      this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + totalItems) % totalItems;
    }
    if (this.input.isJustPressed('KeyS') || this.input.isJustPressed('ArrowDown')) {
      this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % totalItems;
    }

    if (this.input.isJustPressed('Space') || this.input.isJustPressed('Enter')) {
      // Back button is at index 9
      if (this.pauseSelectedIndex === totalItems - 1) {
        this.pauseTab = 'main';
        this.pauseSelectedIndex = 0;
        return;
      }

      // Map index to binding key
      const bindKeys: (keyof KeyBindings)[] = [
        'p1Left', 'p1Right', 'p1Jump', 'p1Ability',
        'p2Left', 'p2Right', 'p2Jump', 'p2Ability', 'p2Crouch',
      ];
      const bindKey = bindKeys[this.pauseSelectedIndex];
      if (bindKey) {
        this.pauseRebindingKey = bindKey;
        this.input.startRebind(bindKey).then(() => {
          this.pauseRebindingKey = null;
        });
      }
    }
  }

  private updatePlaying(): void {
    const p1Input = this.input.getPlayer1Input();
    const p2Input = this.input.getPlayer2Input();

    // Detect pressure plate states
    const knightBox = this.knight.getAABB();
    const thiefBox = this.thief.getAABB();

    this.worldState.knightOnButton =
      this.knight.grounded && isStandingOnTile(knightBox, this.topGrid, TileType.BUTTON_KNIGHT);
    this.worldState.thiefOnButton =
      this.thief.grounded && isStandingOnTile(thiefBox, this.bottomGrid, TileType.BUTTON_THIEF);

    // Determine solid types based on bridge state and button states
    let topSolids = this.worldState.bridgeActive ? SOLID_TYPES_WITH_BRIDGE : SOLID_TYPES_NORMAL;
    let bottomSolids: Set<number> = new Set(SOLID_TYPES_NORMAL);

    // Thief button pressed -> retractable walls in TOP grid become passable
    if (this.worldState.thiefOnButton) {
      topSolids = withoutRetract(topSolids);
    }
    // Knight button pressed -> retractable walls in BOTTOM grid become passable
    if (this.worldState.knightOnButton) {
      bottomSolids = withoutRetract(bottomSolids);
    }

    // Button tiles themselves should be solid (they're ground)
    topSolids.add(TileType.BUTTON_KNIGHT);
    bottomSolids.add(TileType.BUTTON_THIEF);

    this.knight.update(p1Input, this.topGrid, topSolids, this.worldState);
    this.thief.update(p2Input, this.bottomGrid, bottomSolids, this.worldState);

    for (const crate of this.crates) {
      if (crate.platform === 'top') {
        crate.update(this.topGrid, topSolids);
      } else {
        crate.update(this.bottomGrid, bottomSolids);
      }
    }

    // Check crate fall-through
    for (const crate of this.crates) {
      if (crate.platform !== 'top') continue;
      const crateCol = Math.floor((crate.x + crate.width / 2) / TILE_SIZE);
      const crateRow = Math.floor((crate.y + crate.height) / TILE_SIZE);
      if (crateRow >= 0 && crateRow < this.topGrid.length && crateCol >= 0 && crateCol < this.topGrid[0].length) {
        const belowTile = this.topGrid[crateRow]?.[crateCol];
        if ((belowTile === TileType.GAP || belowTile === TileType.EMPTY || belowTile === TileType.SPIKE) && !crate.falling) {
          if (crate.y + crate.height >= (this.topGrid.length - 3) * TILE_SIZE) {
            crate.falling = true;
            crate.platform = 'bottom';
            crate.y = TILE_SIZE;
            crate.x = Math.max(TILE_SIZE, Math.min(crate.x, (this.bottomGrid[0].length - 2) * TILE_SIZE));
          }
        }
      }
    }

    // Lever interaction
    if (!this.worldState.leverPulled) {
      const leverPos = TUTORIAL_LEVEL.leverPosition;
      const leverBox = { x: leverPos.x, y: leverPos.y, width: TILE_SIZE, height: TILE_SIZE };
      if (aabbOverlap(this.thief.getAABB(), leverBox)) {
        this.worldState.leverPulled = true;
        this.worldState.bridgeActive = true;
        for (const bp of TUTORIAL_LEVEL.bridgePositions) {
          if (this.topGrid[bp.y]) {
            this.topGrid[bp.y][bp.x] = TileType.BRIDGE;
          }
        }
      }
    }

    // Win condition
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
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    switch (this.state) {
      case 'menu':
        renderMenu(this.ctx);
        break;

      case 'playing':
        this.renderGameplay();
        break;

      case 'paused':
        // Render gameplay underneath
        this.renderGameplay();
        // Render pause overlay
        renderPauseMenu(
          this.ctx,
          this.pauseTab,
          this.pauseSelectedIndex,
          this.input.bindings,
          this.pauseRebindingKey,
        );
        break;

      case 'win':
        renderWinScreen(this.ctx);
        break;
    }
  }

  private renderGameplay(): void {
    const topCrates = this.crates.filter(c => c.platform === 'top');
    renderPlatform(
      this.ctx, this.topGrid, this.knight, topCrates,
      this.worldState, 0, true, TUTORIAL_LEVEL.topDoor,
    );

    renderSplitLine(this.ctx);

    const bottomCrates = this.crates.filter(c => c.platform === 'bottom');
    renderPlatform(
      this.ctx, this.bottomGrid, this.thief, bottomCrates,
      this.worldState, HALF_HEIGHT, false, TUTORIAL_LEVEL.bottomDoor,
    );

    this.renderDoorStatus();
    this.renderButtonStatus();

    renderTutorialHints(
      this.ctx,
      this.worldState,
      this.knight.x,
      this.thief.x,
    );
  }

  private renderDoorStatus(): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.knight.reachedDoor ? '#44FF44' : '#FF4444';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(
      this.knight.reachedDoor ? 'AT DOOR' : 'Find the door ->',
      CANVAS_WIDTH - 10, 20,
    );
    ctx.fillText(
      this.thief.reachedDoor ? 'AT DOOR' : 'Find the door ->',
      CANVAS_WIDTH - 10, HALF_HEIGHT + 20,
    );
    ctx.textAlign = 'left';
  }

  private renderButtonStatus(): void {
    const ctx = this.ctx;
    // Show cross-platform button status
    if (this.worldState.knightOnButton) {
      ctx.fillStyle = '#CC4444';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('KNIGHT PLATE ACTIVE - Bottom walls open!', CANVAS_WIDTH / 2, HALF_HEIGHT + 38);
      ctx.textAlign = 'left';
    }
    if (this.worldState.thiefOnButton) {
      ctx.fillStyle = '#44AA88';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('THIEF PLATE ACTIVE - Top walls open!', CANVAS_WIDTH / 2, HALF_HEIGHT - 26);
      ctx.textAlign = 'left';
    }
  }
}
