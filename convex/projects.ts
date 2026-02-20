import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").collect();
  },
});

export const upsertByName = mutation({
  args: {
    name: v.string(),
    url: v.optional(v.string()),
    repo: v.optional(v.string()),
    status: v.string(),
    description: v.optional(v.string()),
    pages: v.optional(
      v.array(
        v.object({
          path: v.string(),
          name: v.string(),
          status: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("projects", args);
    }
  },
});
