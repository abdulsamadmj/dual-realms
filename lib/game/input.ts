// ============================================================
// Input Manager - Keyboard + Gamepad support with rebindable controls
// ============================================================

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;     // true on the frame the key is first pressed
  jumpHeld: boolean;  // true while key is held (for buffered/responsive jumping)
  ability: boolean;  // Ghost for Knight, Portal for Thief
  crouch: boolean;   // Only for Thief
}

export interface KeyBindings {
  p1Left: string;
  p1Right: string;
  p1Jump: string;
  p1Ability: string;
  p2Left: string;
  p2Right: string;
  p2Jump: string;
  p2Ability: string;
  p2Crouch: string;
  pause: string;
}

export const DEFAULT_BINDINGS: KeyBindings = {
  p1Left: 'KeyA',
  p1Right: 'KeyD',
  p1Jump: 'KeyW',
  p1Ability: 'ShiftLeft',
  p2Left: 'ArrowLeft',
  p2Right: 'ArrowRight',
  p2Jump: 'ArrowUp',
  p2Ability: 'Enter',
  p2Crouch: 'ArrowDown',
  pause: 'Escape',
};

// Human-readable key names
export function keyDisplayName(code: string): string {
  const map: Record<string, string> = {
    KeyA: 'A', KeyB: 'B', KeyC: 'C', KeyD: 'D', KeyE: 'E', KeyF: 'F',
    KeyG: 'G', KeyH: 'H', KeyI: 'I', KeyJ: 'J', KeyK: 'K', KeyL: 'L',
    KeyM: 'M', KeyN: 'N', KeyO: 'O', KeyP: 'P', KeyQ: 'Q', KeyR: 'R',
    KeyS: 'S', KeyT: 'T', KeyU: 'U', KeyV: 'V', KeyW: 'W', KeyX: 'X',
    KeyY: 'Y', KeyZ: 'Z',
    Digit0: '0', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4',
    Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9',
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    Space: 'Space', Enter: 'Enter', Escape: 'Esc',
    ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift',
    ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl',
    AltLeft: 'L-Alt', AltRight: 'R-Alt',
    Tab: 'Tab', Backspace: 'Backspace',
  };
  return map[code] ?? code;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();
  private prevKeys: Set<string> = new Set();
  bindings: KeyBindings;

  // For rebinding: when set, the next key press will be captured here
  rebindTarget: keyof KeyBindings | null = null;
  private rebindResolve: ((code: string) => void) | null = null;

  private keydownHandler: (e: KeyboardEvent) => void;
  private keyupHandler: (e: KeyboardEvent) => void;

  constructor() {
    this.bindings = { ...DEFAULT_BINDINGS };

    this.keydownHandler = (e: KeyboardEvent) => {
      // If we're waiting for a rebind, capture it
      if (this.rebindTarget) {
        e.preventDefault();
        const key = e.code;
        if (key !== 'Escape') { // Escape cancels rebinding
          this.bindings[this.rebindTarget] = key;
        }
        this.rebindTarget = null;
        if (this.rebindResolve) {
          this.rebindResolve(key);
          this.rebindResolve = null;
        }
        return;
      }

      // Prevent default for game keys to avoid scrolling etc
      const allBound = Object.values(this.bindings);
      if (allBound.includes(e.code) || e.code === 'Space') {
        e.preventDefault();
      }

      // Only add to justPressed if it wasn't already held
      if (!this.keys.has(e.code)) {
        this.justPressed.add(e.code);
      }
      this.keys.add(e.code);
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keydownHandler);
      window.addEventListener('keyup', this.keyupHandler);
    }
  }

  /**
   * Called at the END of each game frame to clear single-frame inputs.
   */
  update(): void {
    this.prevKeys = new Set(this.keys);
    this.justPressed.clear();
  }

  isHeld(code: string): boolean {
    return this.keys.has(code);
  }

  isJustPressed(code: string): boolean {
    return this.justPressed.has(code);
  }

  startRebind(target: keyof KeyBindings): Promise<string> {
    this.rebindTarget = target;
    return new Promise<string>((resolve) => {
      this.rebindResolve = resolve;
    });
  }

  cancelRebind(): void {
    this.rebindTarget = null;
    this.rebindResolve = null;
  }

  getPlayer1Input(): PlayerInput {
    const gp = this.getGamepad(0);
    return {
      left: this.isHeld(this.bindings.p1Left) || (gp?.axes[0] ?? 0) < -0.3,
      right: this.isHeld(this.bindings.p1Right) || (gp?.axes[0] ?? 0) > 0.3,
      jump: this.isJustPressed(this.bindings.p1Jump) || (gp?.buttons[0]?.pressed ?? false),
      jumpHeld: this.isHeld(this.bindings.p1Jump) || (gp?.buttons[0]?.pressed ?? false),
      ability: this.isJustPressed(this.bindings.p1Ability) || (gp?.buttons[2]?.pressed ?? false),
      crouch: false,
    };
  }

  getPlayer2Input(): PlayerInput {
    const gp = this.getGamepad(1);
    return {
      left: this.isHeld(this.bindings.p2Left) || (gp?.axes[0] ?? 0) < -0.3,
      right: this.isHeld(this.bindings.p2Right) || (gp?.axes[0] ?? 0) > 0.3,
      jump: this.isJustPressed(this.bindings.p2Jump) || (gp?.buttons[0]?.pressed ?? false),
      jumpHeld: this.isHeld(this.bindings.p2Jump) || (gp?.buttons[0]?.pressed ?? false),
      ability: this.isJustPressed(this.bindings.p2Ability) || (gp?.buttons[2]?.pressed ?? false),
      crouch: this.isJustPressed(this.bindings.p2Crouch) || (gp?.buttons[1]?.pressed ?? false),
    };
  }

  isPausePressed(): boolean {
    return this.isJustPressed(this.bindings.pause) || this.isJustPressed('Escape');
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler);
      window.removeEventListener('keyup', this.keyupHandler);
    }
  }
}
