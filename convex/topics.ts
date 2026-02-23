import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("topics").order("asc").collect();
  },
});

export const get = query({
  args: { id: v.id("topics") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Dedupe by name
    const existing = await ctx.db.query("topics").collect();
    if (existing.find((t) => t.name.toLowerCase() === args.name.toLowerCase())) {
      throw new Error(`Topic "${args.name}" already exists`);
    }
    return await ctx.db.insert("topics", {
      name: args.name,
      description: args.description,
      status: "active",
      addedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("topics") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const upsertByName = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("topics").collect();
    const match = existing.find((t) => t.name.toLowerCase() === args.name.toLowerCase());
    if (match) {
      await ctx.db.patch(match._id, {
        ...(args.description !== undefined && { description: args.description }),
        ...(args.status !== undefined && { status: args.status }),
      });
      return match._id;
    }
    return await ctx.db.insert("topics", {
      name: args.name,
      description: args.description,
      status: args.status ?? "active",
      addedAt: new Date().toISOString(),
    });
  },
});
