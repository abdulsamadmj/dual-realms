// ============================================================
// Input Manager - Keyboard + Gamepad support
// ============================================================

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  ability: boolean; // Ghost for Knight, Portal for Thief
  crouch: boolean;  // Only for Thief
}

export class InputManager {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();
  private prevKeys: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        // Prevent default for game keys to avoid scrolling
        const gameKeys = [
          'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
          'Space', 'ShiftLeft', 'ShiftRight', 'Enter',
          'KeyW', 'KeyA', 'KeyS', 'KeyD',
        ];
        if (gameKeys.includes(e.code)) {
          e.preventDefault();
        }
        if (!this.prevKeys.has(e.code)) {
          this.justPressed.add(e.code);
        }
        this.keys.add(e.code);
      });

      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
      });
    }
  }

  update(): void {
    this.prevKeys = new Set(this.keys);
    this.justPressed.clear();
  }

  private isJustPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  getPlayer1Input(): PlayerInput {
    // Knight: WASD + Space + Shift
    // Also check for gamepad 0
    const gp = this.getGamepad(0);

    return {
      left: this.keys.has('KeyA') || (gp?.axes[0] ?? 0) < -0.3,
      right: this.keys.has('KeyD') || (gp?.axes[0] ?? 0) > 0.3,
      jump: this.isJustPressed('KeyW') || this.isJustPressed('Space') || (gp?.buttons[0]?.pressed ?? false),
      ability: this.isJustPressed('ShiftLeft') || this.isJustPressed('ShiftRight') || (gp?.buttons[2]?.pressed ?? false),
      crouch: false, // Knight cannot crouch
    };
  }

  getPlayer2Input(): PlayerInput {
    // Thief: Arrow Keys + Enter
    // Also check for gamepad 1
    const gp = this.getGamepad(1);

    return {
      left: this.keys.has('ArrowLeft') || (gp?.axes[0] ?? 0) < -0.3,
      right: this.keys.has('ArrowRight') || (gp?.axes[0] ?? 0) > 0.3,
      jump: this.isJustPressed('ArrowUp') || (gp?.buttons[0]?.pressed ?? false),
      ability: this.isJustPressed('Enter') || (gp?.buttons[2]?.pressed ?? false),
      crouch: this.isJustPressed('ArrowDown') || (gp?.buttons[1]?.pressed ?? false),
    };
  }

  // Check for any key press (used for menu navigation)
  anyKeyPressed(): boolean {
    return this.justPressed.size > 0;
  }

  isKeyPressed(code: string): boolean {
    return this.isJustPressed(code);
  }

  private getGamepad(index: number): Gamepad | null {
    if (typeof navigator === 'undefined') return null;
    const gamepads = navigator.getGamepads();
    return gamepads[index] ?? null;
  }

  destroy(): void {
    // Listeners are on window, removed when component unmounts
  }
}
