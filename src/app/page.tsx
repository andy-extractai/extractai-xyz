import Link from "next/link";

const apps = [
  {
    name: "Agent Status",
    description: "Live dashboard of all AI agents",
    href: "/agents",
    emoji: "🤖",
  },
  {
    name: "World Clock",
    description: "Live time across EST, PST, UTC & ART",
    href: "/clock",
    emoji: "🕐",
  },
  {
    name: "Pokémon RPG",
    description: "Browser-based Pokémon adventure game",
    href: "/pokemon",
    emoji: "⚡",
  },
];

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
        </div>

        {/* App Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
          {apps.map((app) => (
            <Link
              key={app.href}
              href={app.href}
              className="group border border-zinc-800 rounded-xl p-6 hover:border-emerald-400/50 hover:bg-zinc-900/50 transition-all"
            >
              <div className="text-3xl mb-3">{app.emoji}</div>
              <h2 className="text-lg font-semibold group-hover:text-emerald-400 transition-colors">
                {app.name}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">{app.description}</p>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-zinc-600">
        <p>extractai.xyz — HQ</p>
      </footer>
    </div>
  );
}
