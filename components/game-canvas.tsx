'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameState } from '@/lib/game/game';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<import('@/lib/game/game').Game | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let mounted = true;

    import('@/lib/game/game').then(({ Game }) => {
      if (!mounted) return;
      const game = new Game(canvas);
      game.onStateChange = (state) => setGameState(state);
      game.start();
      gameRef.current = game;
    });

    return () => {
      mounted = false;
      gameRef.current?.stop();
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ backgroundColor: '#0a0a1a' }}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          imageRendering: 'pixelated',
          maxWidth: '100%',
          maxHeight: isFullscreen ? '100vh' : undefined,
        }}
        tabIndex={0}
        aria-label="Dual Realms - Cooperative Platformer Game"
      />

      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 px-2 py-1 text-xs font-mono rounded"
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#FFD700',
          border: '1px solid rgba(255,215,0,0.3)',
        }}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
      </button>

      {gameState === 'playing' && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-mono rounded"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#888',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {'ESC to pause'}
        </div>
      )}
    </div>
  );
}
