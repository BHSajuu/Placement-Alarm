/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as calendar from "../calendar.js";
import type * as companies from "../companies.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as statusEvents from "../statusEvents.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  calendar: typeof calendar;
  companies: typeof companies;
  documents: typeof documents;
  http: typeof http;
  notifications: typeof notifications;
  profiles: typeof profiles;
  statusEvents: typeof statusEvents;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
