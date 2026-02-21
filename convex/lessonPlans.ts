import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("lessonPlans").collect();
    return plans.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
});

export const get = query({
  args: { id: v.id("lessonPlans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    subject: v.string(),
    gradeLevel: v.string(),
    assignmentTypes: v.array(v.string()),
    duration: v.string(),
    learningObjectives: v.string(),
    additionalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("lessonPlans", {
      ...args,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

export const updatePlan = mutation({
  args: {
    id: v.id("lessonPlans"),
    generatedPlan: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});
