// ============================================================
// Sprite Sheet Loader & Animator
// ============================================================
// Each frame is extracted into its own canvas at load time.
// Auto-crops each frame by scanning pixel alpha to find the
// actual bounding box of non-transparent content, eliminating
// bleed from adjacent frames and empty padding.
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

interface CroppedFrame {
  canvas: HTMLCanvasElement;
  // Offsets from the original frame cell, so we draw it at the right position
  offsetX: number;
  offsetY: number;
  cropW: number;
  cropH: number;
}

export class SpriteSheet {
  image: HTMLImageElement;
  loaded: boolean = false;
  config: SpriteConfig;

  // Pre-cropped frame canvases: frameCache[animKey][frameIndex]
  private frameCache: Map<string, CroppedFrame[]> = new Map();

  constructor(src: string, config: SpriteConfig) {
    this.config = config;
    this.image = new Image();
    this.image.crossOrigin = 'anonymous';
    this.image.src = src;
    this.image.onload = () => {
      this.loaded = true;
      this.extractAllFrames();
    };
  }

  /**
   * Extract every animation frame from the sprite sheet.
   * For each cell, scan the alpha channel to find the tight
   * bounding box of actual pixel content, then crop to that.
   */
  private extractAllFrames(): void {
    // Draw full sheet onto a temp canvas to read pixel data
    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = this.image.naturalWidth;
    tmpCanvas.height = this.image.naturalHeight;
    const tmpCtx = tmpCanvas.getContext('2d')!;
    tmpCtx.drawImage(this.image, 0, 0);
    const fullData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);

    const animKeys = ['idle', 'run', 'attack', 'jump', 'crouch', 'death'] as const;

    for (const key of animKeys) {
      const anim = this.config[key] as SpriteAnimation | undefined;
      if (!anim) continue;

      const frames: CroppedFrame[] = [];

      for (let i = 0; i < anim.frames; i++) {
        const cellX = i * this.config.frameWidth;
        const cellY = anim.row * this.config.frameHeight;

        // Find tight bounding box within this cell by scanning alpha
        let minX = this.config.frameWidth;
        let minY = this.config.frameHeight;
        let maxX = 0;
        let maxY = 0;
        let hasContent = false;

        for (let py = 0; py < this.config.frameHeight; py++) {
          for (let px = 0; px < this.config.frameWidth; px++) {
            const imgX = cellX + px;
            const imgY = cellY + py;
            // Bounds check against actual image size
            if (imgX >= fullData.width || imgY >= fullData.height) continue;

            const idx = (imgY * fullData.width + imgX) * 4;
            const alpha = fullData.data[idx + 3];

            if (alpha > 10) { // Non-transparent pixel
              hasContent = true;
              if (px < minX) minX = px;
              if (py < minY) minY = py;
              if (px > maxX) maxX = px;
              if (py > maxY) maxY = py;
            }
          }
        }

        if (!hasContent) {
          // Empty frame: create 1x1 transparent canvas
          const empty = document.createElement('canvas');
          empty.width = 1;
          empty.height = 1;
          frames.push({ canvas: empty, offsetX: 0, offsetY: 0, cropW: 1, cropH: 1 });
          continue;
        }

        // Add 1px padding to avoid sub-pixel clipping
        minX = Math.max(0, minX - 1);
        minY = Math.max(0, minY - 1);
        maxX = Math.min(this.config.frameWidth - 1, maxX + 1);
        maxY = Math.min(this.config.frameHeight - 1, maxY + 1);

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = cropW;
        frameCanvas.height = cropH;
        const fCtx = frameCanvas.getContext('2d')!;
        fCtx.imageSmoothingEnabled = false;

        // Copy just the cropped region from the sheet
        const srcX = cellX + minX;
        const srcY = cellY + minY;

        // Clamp to image bounds
        const safeW = Math.min(cropW, fullData.width - srcX);
        const safeH = Math.min(cropH, fullData.height - srcY);

        if (safeW > 0 && safeH > 0) {
          fCtx.drawImage(
            this.image,
            srcX, srcY, safeW, safeH,
            0, 0, safeW, safeH,
          );
        }

        frames.push({
          canvas: frameCanvas,
          offsetX: minX,
          offsetY: minY,
          cropW,
          cropH,
        });
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

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;

    if (cachedFrames && cachedFrames[frameIndex]) {
      const cf = cachedFrames[frameIndex];
      const drawW = cf.cropW * scale;
      const drawH = cf.cropH * scale;
      const fullW = this.config.frameWidth * scale;

      if (flipX) {
        // When flipping, mirror the offset
        const drawX = x + fullW - (cf.offsetX * scale + drawW);
        ctx.translate(drawX + drawW / 2, y + cf.offsetY * scale);
        ctx.scale(-1, 1);
        ctx.drawImage(cf.canvas, -drawW / 2, 0, drawW, drawH);
      } else {
        const drawX = x + cf.offsetX * scale;
        const drawY = y + cf.offsetY * scale;
        ctx.drawImage(cf.canvas, drawX, drawY, drawW, drawH);
      }
    } else {
      // Fallback: direct sheet draw (before cache is ready)
      const sx = frameIndex * this.config.frameWidth;
      const sy = anim.row * this.config.frameHeight;
      const drawW = this.config.frameWidth * scale;
      const drawH = this.config.frameHeight * scale;

      if (flipX) {
        ctx.translate(x + drawW / 2, y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          this.image,
          sx, sy, this.config.frameWidth, this.config.frameHeight,
          -drawW / 2, 0, drawW, drawH,
        );
      } else {
        ctx.drawImage(
          this.image,
          sx, sy, this.config.frameWidth, this.config.frameHeight,
          x, y, drawW, drawH,
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
