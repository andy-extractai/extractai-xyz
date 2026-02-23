import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Agent status (single row, id="andy")
  agent: defineTable({
    name: v.string(),
    emoji: v.string(),
    status: v.string(), // "online" | "offline" | "busy"
    current_task: v.string(),
    model: v.string(),
    uptime_since: v.string(),
    last_updated: v.string(),
  }),

  // Kanban tasks
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.string(), // "backlog" | "in_progress" | "review" | "done"
    assigned: v.string(),
    priority: v.string(), // "high" | "medium" | "low"
    created: v.string(),
    completed: v.optional(v.string()),
    sort_order: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // Cron job tracking
  cronJobs: defineTable({
    name: v.string(),
    schedule: v.string(),
    description: v.string(),
    status: v.string(), // "active" | "paused" | "error"
    last_run: v.optional(v.string()),
    last_status: v.optional(v.string()), // "success" | "timeout" | "error"
    next_run: v.optional(v.string()),
  }),

  // People / contacts
  contacts: defineTable({
    name: v.string(),
    status: v.string(),
    last_contact: v.string(),
    email: v.optional(v.string()),
    relation: v.optional(v.string()),
    notes: v.optional(v.string()),
  }),

  // Team / agents
  team: defineTable({
    name: v.string(),
    role: v.string(),
    emoji: v.string(),
    description: v.string(),
    status: v.string(), // "active" | "standby" | "inactive"
    skills: v.optional(v.array(v.string())),
    is_lead: v.optional(v.boolean()),
  }),

  // Lesson Plans
  lessonPlans: defineTable({
    title: v.string(),
    subject: v.string(),
    gradeLevel: v.string(),
    assignmentTypes: v.array(v.string()),
    duration: v.string(),
    learningObjectives: v.string(),
    additionalNotes: v.optional(v.string()),
    generatedPlan: v.optional(v.string()),
    status: v.string(), // "pending" | "generating" | "done" | "error"
    createdAt: v.string(),
  }).index("by_status", ["status"]),

  // Chat Messages
  chatMessages: defineTable({
    agentId: v.string(),
    role: v.string(),           // 'user' | 'agent'
    content: v.string(),
    status: v.string(),         // 'pending' | 'done' | 'error'
    timestamp: v.string(),
  }).index("by_agent", ["agentId"]).index("by_status", ["status"]),

  // Projects
  projects: defineTable({
    name: v.string(),
    url: v.optional(v.string()),
    repo: v.optional(v.string()),
    status: v.string(), // "live" | "in_progress" | "planned" | "archived"
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
  }),
});
