import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMessages = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();
    return messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },
});

export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("chatMessages")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(5);
    return pending;
  },
});

export const sendMessage = mutation({
  args: {
    agentId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      agentId: args.agentId,
      role: "user",
      content: args.content,
      status: "pending",
      timestamp: new Date().toISOString(),
    });
  },
});

export const addAgentResponse = mutation({
  args: {
    userMessageId: v.id("chatMessages"),
    agentId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Insert agent response
    await ctx.db.insert("chatMessages", {
      agentId: args.agentId,
      role: "agent",
      content: args.content,
      status: "done",
      timestamp: new Date().toISOString(),
    });
    // Mark original user message as done
    await ctx.db.patch(args.userMessageId, { status: "done" });
  },
});
