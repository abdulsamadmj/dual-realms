// ============================================================
// Main Game Controller - Single shared platform
// ============================================================

import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, TileType } from './constants';
import { InputManager, type KeyBindings } from './input';
import { Knight, Thief, Crate, isStandingOnTile, type GameWorldState } from './entities';
import { TUTORIAL_LEVEL } from './levels';
import {
  renderWorld, renderMenu, renderWinScreen,
  renderTutorialHints, renderPauseMenu, type PauseTab,
} from './renderer';
import { aabbOverlap } from './physics';

export type GameState = 'menu' | 'playing' | 'paused' | 'win';

// Solid tile types for collision
const BASE_SOLIDS = new Set([
  TileType.SOLID,
  TileType.WALL_GHOST,
  TileType.LOW_TUNNEL,
  TileType.LEDGE,
  TileType.RETRACT_WALL_A,
  TileType.RETRACT_WALL_B,
  TileType.BUTTON_KNIGHT,
  TileType.BUTTON_THIEF,
]);

const BRIDGE_SOLIDS = new Set([
  ...BASE_SOLIDS,
  TileType.BRIDGE,
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
  grid!: number[][];

  animationFrameId: number = 0;
  lastTime: number = 0;
  onStateChange?: (state: GameState) => void;

  // Pause menu
  pauseTab: PauseTab = 'main';
  pauseSelectedIndex: number = 0;
  pauseRebindingKey: string | null = null;
  pauseMainItems = ['Resume', 'Controls', 'Restart Level', 'Quit to Menu'];
  pauseControlItems = 12; // 5 knight + 6 thief + 1 back

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
    this.grid = level.grid.map(row => [...row]);
    this.knight = new Knight(level.knightSpawn.x, level.knightSpawn.y);
    this.thief = new Thief(level.thiefSpawn.x, level.thiefSpawn.y);
    this.crates = level.cratePositions.map(cp => new Crate(cp.x, cp.y));
    this.worldState = {
      leverPulled: false,
      bridgeActive: false,
      knightOnButton: false,
      thiefOnButton: false,
      crates: this.crates,
      grid: this.grid,
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
    if (this.input.rebindTarget) return;

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
    if (this.input.isJustPressed('KeyW') || this.input.isJustPressed('ArrowUp')) {
      this.pauseSelectedIndex = (this.pauseSelectedIndex - 1 + this.pauseMainItems.length) % this.pauseMainItems.length;
    }
    if (this.input.isJustPressed('KeyS') || this.input.isJustPressed('ArrowDown')) {
      this.pauseSelectedIndex = (this.pauseSelectedIndex + 1) % this.pauseMainItems.length;
    }

    if (this.input.isJustPressed('Space') || this.input.isJustPressed('Enter')) {
      switch (this.pauseSelectedIndex) {
        case 0:
          this.state = 'playing';
          this.onStateChange?.('playing');
          break;
        case 1:
          this.pauseTab = 'controls';
          this.pauseSelectedIndex = 0;
          break;
        case 2:
          this.initLevel();
          this.state = 'playing';
          this.onStateChange?.('playing');
          break;
        case 3:
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
      if (this.pauseSelectedIndex === totalItems - 1) {
        this.pauseTab = 'main';
        this.pauseSelectedIndex = 0;
        return;
      }

      const bindKeys: (keyof KeyBindings)[] = [
        'p1Left', 'p1Right', 'p1Jump', 'p1Ability', 'p1Interact',
        'p2Left', 'p2Right', 'p2Jump', 'p2Ability', 'p2Crouch', 'p2Interact',
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
      this.knight.grounded && isStandingOnTile(knightBox, this.grid, TileType.BUTTON_KNIGHT);
    this.worldState.thiefOnButton =
      this.thief.grounded && isStandingOnTile(thiefBox, this.grid, TileType.BUTTON_THIEF);

    // Compute solid types
    let solids = new Set(this.worldState.bridgeActive ? BRIDGE_SOLIDS : BASE_SOLIDS);

    // When Knight stands on BK -> RETRACT_WALL_A becomes passable
    if (this.worldState.knightOnButton) {
      solids.delete(TileType.RETRACT_WALL_A);
    }
    // When Thief stands on BT -> RETRACT_WALL_B becomes passable
    if (this.worldState.thiefOnButton) {
      solids.delete(TileType.RETRACT_WALL_B);
    }

    // Update players
    this.knight.update(p1Input, this.grid, solids, this.worldState);
    this.thief.update(p2Input, this.grid, solids, this.worldState);

    // Update crates
    for (const crate of this.crates) {
      crate.update(this.grid, solids);
    }

    // Lever interaction - player must stand on lever and press interact
    if (!this.worldState.leverPulled) {
      const leverPos = TUTORIAL_LEVEL.leverPosition;
      const leverBox = { x: leverPos.x * TILE_SIZE, y: leverPos.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
      
      // Check if Knight is on lever and presses interact
      if (aabbOverlap(this.knight.getAABB(), leverBox) && p1Input.interact) {
        console.log("[v0] Knight activated lever");
        this.activateLever();
      }
      
      // Check if Thief is on lever and presses interact
      if (aabbOverlap(this.thief.getAABB(), leverBox) && p2Input.interact) {
        console.log("[v0] Thief activated lever");
        this.activateLever();
      }
    }

    // Win condition: both at door
    const doorPos = TUTORIAL_LEVEL.doorPos;
    this.knight.reachedDoor = this.knight.checkDoor(doorPos);
    this.thief.reachedDoor = this.thief.checkDoor(doorPos);

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
        this.renderGameplay();
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

  private activateLever(): void {
    this.worldState.leverPulled = true;
    this.worldState.bridgeActive = true;

    // Remove all ghost wall tiles from the grid so the Thief can pass
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[row].length; col++) {
        if (this.grid[row][col] === TileType.WALL_GHOST) {
          console.log(`[v0] Removing WALL_GHOST at (${col}, ${row})`);
          this.grid[row][col] = TileType.EMPTY;
        }
      }
    }
  }

  private renderGameplay(): void {
    renderWorld(
      this.ctx,
      this.grid,
      this.knight,
      this.thief,
      this.crates,
      this.worldState,
      TUTORIAL_LEVEL.doorPos,
    );

    renderTutorialHints(this.ctx, this.worldState);
  }
}
