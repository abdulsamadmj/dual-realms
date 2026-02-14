import GameLoader from '@/components/game-loader';

export default function Page() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center"
      style={{ backgroundColor: '#0a0a1a' }}
    >
      <GameLoader />
    </main>
  );
}
