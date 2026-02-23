import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const latestAll = query({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db.query("topics").filter((q) => q.eq(q.field("status"), "active")).collect();
    const result = [];
    for (const topic of topics) {
      const snaps = await ctx.db
        .query("signals")
        .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
        .order("desc")
        .take(1);
      result.push({ topic, latest: snaps[0] ?? null });
    }
    return result;
  },
});

export const forTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, { topicId }) => {
    return await ctx.db
      .query("signals")
      .withIndex("by_topic", (q) => q.eq("topicId", topicId))
      .order("desc")
      .take(20);
  },
});

export const store = mutation({
  args: {
    topicId: v.id("topics"),
    topicName: v.string(),
    socialScore: v.number(),
    socialSummary: v.string(),
    newsScore: v.number(),
    newsSummary: v.string(),
    momentumScore: v.number(),
    momentumSummary: v.string(),
    consensusScore: v.number(),
    direction: v.string(),
    strength: v.string(),
    explanation: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("signals", {
      ...args,
      timestamp: new Date().toISOString(),
    });
  },
});
