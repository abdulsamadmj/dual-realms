import dynamic from 'next/dynamic';

const GameCanvas = dynamic(() => import('@/components/game-canvas'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center"
      style={{
        width: 800,
        height: 600,
        maxWidth: '100%',
        backgroundColor: '#0a0a1a',
        color: '#FFD700',
        fontFamily: 'monospace',
      }}
    >
      Loading game...
    </div>
  ),
});

export default function Page() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ backgroundColor: '#0a0a1a' }}
    >
      <GameCanvas />
    </main>
  );
}
