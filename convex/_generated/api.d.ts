/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cartItems from "../cartItems.js";
import type * as designs from "../designs.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as posts from "../posts.js";
import type * as printful from "../printful.js";
import type * as products from "../products.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";
import type * as votes from "../votes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cartItems: typeof cartItems;
  designs: typeof designs;
  http: typeof http;
  orders: typeof orders;
  posts: typeof posts;
  printful: typeof printful;
  products: typeof products;
  stripe: typeof stripe;
  users: typeof users;
  votes: typeof votes;
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
