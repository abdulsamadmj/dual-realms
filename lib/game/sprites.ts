// ============================================================
// Sprite Sheet Loader & Animator
// ============================================================
// Uses an offscreen canvas per frame to guarantee clean clipping
// so adjacent frames on the sheet never bleed into the draw.
// ============================================================

export interface SpriteAnimation {
  row: number;
  frames: number;
  speed: number; // Ticks per frame
}

export interface SpriteConfig {
  frameWidth: number;
  frameHeight: number;
  cols: number;
  idle: SpriteAnimation;
  run: SpriteAnimation;
  attack: SpriteAnimation;
  jump?: SpriteAnimation;
  crouch?: SpriteAnimation;
  death?: SpriteAnimation;
}

export class SpriteSheet {
  image: HTMLImageElement;
  loaded: boolean = false;
  config: SpriteConfig;

  // Pre-sliced frame canvases: frameCache[animKey][frameIndex]
  private frameCache: Map<string, HTMLCanvasElement[]> = new Map();

  constructor(src: string, config: SpriteConfig) {
    this.config = config;
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
    this.image.src = src;
    this.image.onload = () => {
      this.loaded = true;
      this.sliceAllFrames();
    };
  }

  /**
   * Pre-slice every frame into its own tiny canvas so we never
   * sample pixels from neighbouring frames.
   */
  private sliceAllFrames(): void {
    const anims: [string, SpriteAnimation][] = [];
    for (const key of ['idle', 'run', 'attack', 'jump', 'crouch', 'death'] as const) {
      const a = this.config[key];
      if (a) anims.push([key, a as SpriteAnimation]);
    }

    const imgW = this.image.naturalWidth;
    const imgH = this.image.naturalHeight;

    for (const [key, anim] of anims) {
      const frames: HTMLCanvasElement[] = [];
      for (let i = 0; i < anim.frames; i++) {
        const offscreen = document.createElement('canvas');
        offscreen.width = this.config.frameWidth;
        offscreen.height = this.config.frameHeight;
        const offCtx = offscreen.getContext('2d')!;
        offCtx.imageSmoothingEnabled = false;

        const sx = i * this.config.frameWidth;
        const sy = anim.row * this.config.frameHeight;

        // Clamp source rect to image bounds to prevent reading garbage pixels
        const clampedW = Math.min(this.config.frameWidth, imgW - sx);
        const clampedH = Math.min(this.config.frameHeight, imgH - sy);

        if (clampedW > 0 && clampedH > 0) {
          offCtx.drawImage(
            this.image,
            sx, sy,
            clampedW, clampedH,
            0, 0,
            clampedW, clampedH,
          );
        }
        frames.push(offscreen);
      }
      this.frameCache.set(key, frames);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    animation: string,
    frame: number,
    flipX: boolean = false,
    alpha: number = 1.0,
    scale: number = 2,
  ): void {
    if (!this.loaded) return;

    const anim = this.config[animation as keyof SpriteConfig] as SpriteAnimation | undefined;
    if (!anim) return;

    const frameIndex = frame % anim.frames;
    const cachedFrames = this.frameCache.get(animation);

    const drawWidth = this.config.frameWidth * scale;
    const drawHeight = this.config.frameHeight * scale;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (cachedFrames && cachedFrames[frameIndex]) {
      // Use pre-sliced frame (no bleed from neighbours)
      const frameTex = cachedFrames[frameIndex];
      if (flipX) {
        ctx.translate(x + drawWidth / 2, y);
        ctx.scale(-1, 1);
        ctx.drawImage(frameTex, -drawWidth / 2, 0, drawWidth, drawHeight);
      } else {
        ctx.drawImage(frameTex, x, y, drawWidth, drawHeight);
      }
    } else {
      // Fallback: direct sheet draw (before cache is ready)
      const sx = frameIndex * this.config.frameWidth;
      const sy = anim.row * this.config.frameHeight;

      if (flipX) {
        ctx.translate(x + drawWidth / 2, y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.image,
          sx, sy,
          this.config.frameWidth, this.config.frameHeight,
          -drawWidth / 2, 0,
          drawWidth, drawHeight,
        );
      } else {
        ctx.drawImage(
          this.image,
          sx, sy,
          this.config.frameWidth, this.config.frameHeight,
          x, y,
          drawWidth, drawHeight,
        );
      }
    }

    ctx.restore();
  }
}

export class Animator {
  currentAnimation: string = 'idle';
  frame: number = 0;
  tickCount: number = 0;

  update(animation: string, speed: number): void {
    if (this.currentAnimation !== animation) {
      this.currentAnimation = animation;
      this.frame = 0;
      this.tickCount = 0;
    }

    this.tickCount++;
    if (this.tickCount >= speed) {
      this.tickCount = 0;
      this.frame++;
    }
  }

  getFrame(): number {
    return this.frame;
  }
}
