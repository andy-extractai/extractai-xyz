export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
            extract<span className="text-emerald-400">ai</span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-lg mx-auto">
            AI-powered tools that extract signal from noise.
            Built by Kyle &amp; Andy 🐾
          </p>
          <div className="pt-4">
            <span className="inline-block px-4 py-2 rounded-full border border-zinc-700 text-sm text-zinc-500">
              Coming soon — apps will appear here
            </span>
          </div>
        </div>

        {/* App Grid (placeholder for future apps) */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
          {/* Future app cards go here */}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-zinc-600">
        <p>extractai.xyz — HQ</p>
      </footer>
    </div>
  );
}
