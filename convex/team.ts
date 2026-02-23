import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Derives each agent's status + current task from live task data.
// "active" = has ≥1 in_progress task assigned to them.
// "standby" = no in_progress tasks.
// This is the source of truth — do not read team.status for UI display.
export const listWithTaskStatus = query({
  args: {},
  handler: async (ctx) => {
    const team = await ctx.db.query("team").collect();
    const inProgressTasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    return team.map((member) => {
      const myTasks = inProgressTasks.filter(
        (task) => task.assigned.toLowerCase() === member.name.toLowerCase()
      );
      return {
        ...member,
        // Derived status — overrides the stored team.status field
        status: myTasks.length > 0 ? "active" : "standby",
        currentTask: myTasks[0]?.title ?? null,
        activeTaskCount: myTasks.length,
      };
    });
  },
});

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
