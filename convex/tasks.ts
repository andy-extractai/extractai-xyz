import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const byStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    status: v.string(),
    assigned: v.string(),
    priority: v.string(),
    created: v.string(),
    completed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tasks", { ...args, sort_order: Date.now() });
  },
});

export const updateStatus = mutation({
  args: { id: v.id("tasks"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    assigned: v.optional(v.string()),
    priority: v.optional(v.string()),
    completed: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleaned);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
