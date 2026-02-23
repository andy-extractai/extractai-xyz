"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useTheme } from "../components/ThemeProvider";

const AGENTS = [
  { id: "andy",   emoji: "\u{1F43E}", name: "Andy",   role: "Lead AI",     welcome: "Hey! What can I help you with today?" },
  { id: "scout",  emoji: "\u{1F50D}", name: "Scout",  role: "Research",    welcome: "Ready to research anything. What are we looking into?" },
  { id: "dev",    emoji: "\u{1F4BB}", name: "Dev",    role: "Engineering", welcome: "What are we building?" },
  { id: "canvas", emoji: "\u{1F3A8}", name: "Canvas", role: "Design",      welcome: "Show me what you want to create." },
  { id: "quill",  emoji: "\u270D\uFE0F",  name: "Quill",  role: "Writing",     welcome: "What needs writing?" },
  { id: "sage",   emoji: "\u{1F4CA}", name: "Sage",   role: "Analysis",    welcome: "What should we analyze?" },
  { id: "ops",    emoji: "\u2699\uFE0F",  name: "Ops",    role: "Automation",  welcome: "What needs automating?" },
];

function t(d: boolean, dark: string, light: string) {
  return d ? dark : light;
}

function ThinkingDots({ d }: { d: boolean }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`inline-block w-2 h-2 rounded-full animate-bounce ${t(d, "bg-zinc-500", "bg-zinc-400")}`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export default function ChatPage() {
  const { theme } = useTheme();
  const d = theme === "dark";
  const [selectedAgentId, setSelectedAgentId] = useState("andy");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedAgent = AGENTS.find((a) => a.id === selectedAgentId)!;
  const messages = useQuery(api.chatMessages.getMessages, { agentId: selectedAgentId });
  const sendMessage = useMutation(api.chatMessages.sendMessage);

  const hasPending = messages?.some((m) => m.role === "user" && m.status === "pending");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage({ agentId: selectedAgentId, content: text });
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className={`border-b px-4 md:px-6 py-4 ${t(d, "border-zinc-800", "border-zinc-200")}`}>
        <h1 className={`text-xl font-bold tracking-tight ${t(d, "text-white", "text-zinc-900")}`}>
          {"\u{1F4AC}"} Agent Chat
        </h1>
        <p className={`text-xs mt-0.5 ${t(d, "text-zinc-500", "text-zinc-500")}`}>
          Talk to any agent in real-time.
        </p>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Agent List — Left Panel */}
        <div
          className={`w-48 md:w-56 shrink-0 border-r overflow-y-auto ${t(
            d,
            "border-zinc-800 bg-zinc-950/50",
            "border-zinc-200 bg-zinc-50/50"
          )}`}
        >
          <div className={`px-3 pt-3 pb-2 text-[10px] font-medium tracking-widest uppercase ${t(d, "text-zinc-600", "text-zinc-400")}`}>
            Agents
          </div>
          {AGENTS.map((agent) => {
            const active = agent.id === selectedAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
                  active
                    ? t(d, "bg-zinc-800 text-white", "bg-emerald-50 text-emerald-700")
                    : t(d, "text-zinc-400 hover:text-white hover:bg-zinc-800/50", "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100")
                }`}
              >
                <span className="text-lg leading-none">{agent.emoji}</span>
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${active ? "" : ""}`}>{agent.name}</div>
                  <div className={`text-[10px] truncate ${active ? t(d, "text-zinc-400", "text-emerald-500") : t(d, "text-zinc-600", "text-zinc-400")}`}>
                    {agent.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Chat Area — Right Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
            {/* Welcome bubble (if no messages yet) */}
            {messages !== undefined && messages.length === 0 && (
              <div className="flex items-start gap-2.5 max-w-[80%]">
                <span className="text-lg leading-none mt-0.5 shrink-0">{selectedAgent.emoji}</span>
                <div
                  className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm ${t(
                    d,
                    "bg-zinc-800 text-zinc-200",
                    "bg-zinc-100 text-zinc-800"
                  )}`}
                >
                  {selectedAgent.welcome}
                </div>
              </div>
            )}

            {/* Real messages */}
            {messages?.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg._id} className="flex justify-end">
                    <div
                      className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] bg-emerald-500 text-white"
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              }
              // agent
              return (
                <div key={msg._id} className="flex items-start gap-2.5 max-w-[80%]">
                  <span className="text-lg leading-none mt-0.5 shrink-0">{selectedAgent.emoji}</span>
                  <div
                    className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap ${t(
                      d,
                      "bg-zinc-800 text-zinc-200",
                      "bg-zinc-100 text-zinc-800"
                    )}`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {hasPending && (
              <div className="flex items-start gap-2.5 max-w-[80%]">
                <span className="text-lg leading-none mt-0.5 shrink-0">{selectedAgent.emoji}</span>
                <div
                  className={`rounded-2xl rounded-tl-sm ${t(
                    d,
                    "bg-zinc-800",
                    "bg-zinc-100"
                  )}`}
                >
                  <ThinkingDots d={d} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className={`border-t px-4 md:px-6 py-3 flex items-center gap-3 ${t(d, "border-zinc-800", "border-zinc-200")}`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${selectedAgent.name}...`}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition ${t(
                d,
                "bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500",
                "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500"
              )}`}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                !input.trim()
                  ? t(d, "bg-zinc-800 text-zinc-600 cursor-not-allowed", "bg-zinc-200 text-zinc-400 cursor-not-allowed")
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
