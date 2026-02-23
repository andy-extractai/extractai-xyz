import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ── Agent ─────────────────────────────────────────────────────────────────────
http.route({
  path: "/agent",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.agent.get);
    return json(data);
  }),
});

http.route({
  path: "/agent",
  method: "PATCH",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    await ctx.runMutation(api.agent.upsert, body);
    return json({ ok: true });
  }),
});

// ── Tasks ─────────────────────────────────────────────────────────────────────
http.route({
  path: "/tasks",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return json(await ctx.runQuery(api.tasks.list));
  }),
});

http.route({
  path: "/tasks",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const id = await ctx.runMutation(api.tasks.create, await req.json());
    return json({ id });
  }),
});

// ── Contacts ─────────────────────────────────────────────────────────────────
http.route({
  path: "/contacts",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return json(await ctx.runQuery(api.contacts.list));
  }),
});

http.route({
  path: "/contacts",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const id = await ctx.runMutation(api.contacts.create, await req.json());
    return json({ id });
  }),
});

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
http.route({
  path: "/cron-jobs",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return json(await ctx.runQuery(api.cronJobs.list));
  }),
});

http.route({
  path: "/cron-jobs",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const id = await ctx.runMutation(api.cronJobs.create, await req.json());
    return json({ id });
  }),
});

// ── Team delete by name ───────────────────────────────────────────────────────
http.route({
  path: "/team/delete",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { name } = await req.json() as { name: string };
    const members = await ctx.runQuery(api.team.list);
    const match = members.find((m) => m.name === name);
    if (!match) return json({ ok: false, error: "not found" }, 404);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.runMutation(api.team.remove, { id: match._id as any });
    return json({ ok: true, deleted: name });
  }),
});

// ── Bulk Seed ─────────────────────────────────────────────────────────────────
http.route({
  path: "/seed",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json() as {
      agent?: Record<string, string>;
      tasks?: Record<string, unknown>[];
      contacts?: Record<string, unknown>[];
      cronJobs?: Record<string, unknown>[];
      team?: Record<string, unknown>[];
      projects?: Record<string, unknown>[];
    };

    const results: Record<string, number> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const run = (fn: any, args: any) => ctx.runMutation(fn, args);

    if (body.agent) { await run(api.agent.upsert, body.agent); results.agent = 1; }
    if (body.tasks)    { for (const t of body.tasks)    await run(api.tasks.create, t);           results.tasks    = body.tasks.length; }
    if (body.contacts) { for (const c of body.contacts) await run(api.contacts.create, c);        results.contacts = body.contacts.length; }
    if (body.cronJobs) { for (const j of body.cronJobs) await run(api.cronJobs.create, j);        results.cronJobs = body.cronJobs.length; }
    if (body.team)     { for (const m of body.team)     await run(api.team.upsertByName, m);      results.team     = body.team.length; }
    if (body.projects) { for (const p of body.projects) await run(api.projects.upsertByName, p);  results.projects = body.projects.length; }

    return json({ ok: true, seeded: results });
  }),
});

// ── Lesson Plans ─────────────────────────────────────────────────────────────
http.route({
  path: "/lesson-plans",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return json(await ctx.runQuery(api.lessonPlans.list));
  }),
});

http.route({
  path: "/lesson-plans",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const id = await ctx.runMutation(api.lessonPlans.create, await req.json());
    return json({ id });
  }),
});

http.route({
  pathPrefix: "/lesson-plans/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const id = url.pathname.split("/lesson-plans/")[1];
    if (!id) return json({ error: "missing id" }, 400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plan = await ctx.runQuery(api.lessonPlans.get, { id: id as any });
    return json(plan);
  }),
});

http.route({
  pathPrefix: "/lesson-plans/",
  method: "PATCH",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const id = url.pathname.split("/lesson-plans/")[1];
    if (!id) return json({ error: "missing id" }, 400);
    const { generatedPlan, status } = await req.json() as {
      generatedPlan: string;
      status: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.runMutation(api.lessonPlans.updatePlan, { id: id as any, generatedPlan, status });
    return json({ ok: true });
  }),
});

// ── Consensus: Topics ─────────────────────────────────────────────────────────
http.route({
  path: "/consensus/topics",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return json(await ctx.runQuery(api.topics.list));
  }),
});

http.route({
  path: "/consensus/topics",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json() as { name: string; description?: string };
    const id = await ctx.runMutation(api.topics.upsertByName, body);
    return json({ id });
  }),
});

// ── Consensus: Signals ────────────────────────────────────────────────────────
http.route({
  path: "/consensus/signals",
  method: "GET",
  handler: httpAction(async (ctx) => {
    return json(await ctx.runQuery(api.signals.latestAll));
  }),
});

http.route({
  path: "/consensus/signals",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json() as Parameters<typeof ctx.runMutation>[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = await ctx.runMutation(api.signals.store, body as any);
    return json({ id });
  }),
});

// ── Chat ─────────────────────────────────────────────────────────────────────
http.route({
  path: "/chat/pending",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const pending = await ctx.runQuery(api.chatMessages.getPending);
    return json(pending);
  }),
});

http.route({
  path: "/chat/respond",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { userMessageId, agentId, content } = await req.json() as {
      userMessageId: string;
      agentId: string;
      content: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await ctx.runMutation(api.chatMessages.addAgentResponse, {
      userMessageId: userMessageId as any,
      agentId,
      content,
    });
    return json({ ok: true });
  }),
});

export default http;
