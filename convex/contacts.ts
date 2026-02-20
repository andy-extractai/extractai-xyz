import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contacts").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    status: v.string(),
    last_contact: v.string(),
    email: v.optional(v.string()),
    relation: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contacts", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    status: v.optional(v.string()),
    last_contact: v.optional(v.string()),
    notes: v.optional(v.string()),
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
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
