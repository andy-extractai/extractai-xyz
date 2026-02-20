import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agent").collect();
    return agents[0] ?? null;
  },
});

export const upsert = mutation({
  args: {
    name: v.optional(v.string()),
    emoji: v.optional(v.string()),
    status: v.optional(v.string()),
    current_task: v.optional(v.string()),
    model: v.optional(v.string()),
    uptime_since: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("agent").first();
    const last_updated = new Date().toISOString();
    if (existing) {
      const cleaned = Object.fromEntries(
        Object.entries(args).filter(([, v]) => v !== undefined)
      );
      await ctx.db.patch(existing._id, { ...cleaned, last_updated });
    } else {
      await ctx.db.insert("agent", {
        name: args.name ?? "Andy",
        emoji: args.emoji ?? "🐾",
        status: args.status ?? "online",
        current_task: args.current_task ?? "",
        model: args.model ?? "claude-sonnet-4.6",
        uptime_since: args.uptime_since ?? new Date().toISOString().split("T")[0],
        last_updated,
      });
    }
  },
});
