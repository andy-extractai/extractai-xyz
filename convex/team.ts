import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("team").collect();
  },
});

export const remove = mutation({
  args: { id: v.id("team") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const upsertByName = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    emoji: v.string(),
    description: v.string(),
    status: v.string(),
    skills: v.optional(v.array(v.string())),
    is_lead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("team")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("team", args);
    }
  },
});
