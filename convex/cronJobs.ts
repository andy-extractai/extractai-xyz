import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cronJobs").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    schedule: v.string(),
    description: v.string(),
    status: v.string(),
    last_run: v.optional(v.string()),
    last_status: v.optional(v.string()),
    next_run: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cronJobs", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("cronJobs"),
    status: v.optional(v.string()),
    last_run: v.optional(v.string()),
    last_status: v.optional(v.string()),
    next_run: v.optional(v.string()),
    description: v.optional(v.string()),
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
  args: { id: v.id("cronJobs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
