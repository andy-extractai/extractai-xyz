"use client";

import { useState, useEffect } from "react";

const PASSWORD = "Kyle1017";
const STORAGE_KEY = "extractai_auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setAuthed(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
    }
  };

  if (checking) return null;
  if (authed) return <>{children}</>;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <h1 className="text-white text-2xl font-bold tracking-tight">extractai.xyz</h1>
        <p className="text-zinc-500 text-sm">Enter password to continue</p>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
          className="bg-zinc-900 border border-zinc-700 text-white px-4 py-2 rounded-lg w-64 text-center focus:outline-none focus:border-zinc-500"
        />
        {error && <p className="text-red-500 text-sm">Wrong password</p>}
        <button
          type="submit"
          className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-200 transition"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
