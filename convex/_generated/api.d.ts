/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as chatMessages from "../chatMessages.js";
import type * as contacts from "../contacts.js";
import type * as cronJobs from "../cronJobs.js";
import type * as http from "../http.js";
import type * as lessonPlans from "../lessonPlans.js";
import type * as projects from "../projects.js";
import type * as signals from "../signals.js";
import type * as tasks from "../tasks.js";
import type * as team from "../team.js";
import type * as topics from "../topics.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  chatMessages: typeof chatMessages;
  contacts: typeof contacts;
  cronJobs: typeof cronJobs;
  http: typeof http;
  lessonPlans: typeof lessonPlans;
  projects: typeof projects;
  signals: typeof signals;
  tasks: typeof tasks;
  team: typeof team;
  topics: typeof topics;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
