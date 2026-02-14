// ============================================================
// Sprite Sheet Loader & Animator
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

  constructor(src: string, config: SpriteConfig) {
    this.config = config;
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
    this.image.src = src;
    this.image.onload = () => {
      this.loaded = true;
    };
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
    const sx = frameIndex * this.config.frameWidth;
    const sy = anim.row * this.config.frameHeight;

    const drawWidth = this.config.frameWidth * scale;
    const drawHeight = this.config.frameHeight * scale;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (flipX) {
      ctx.translate(x + drawWidth / 2, y);
      ctx.scale(-1, 1);
      ctx.drawImage(
        this.image,
        sx, sy,
        this.config.frameWidth, this.config.frameHeight,
        -drawWidth / 2, 0,
        drawWidth, drawHeight
      );
    } else {
      ctx.drawImage(
        this.image,
        sx, sy,
        this.config.frameWidth, this.config.frameHeight,
        x, y,
        drawWidth, drawHeight
      );
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
