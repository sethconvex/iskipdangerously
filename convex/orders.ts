import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const createPending = internalMutation({
  args: {
    userId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        title: v.string(),
        size: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    totalAmount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", {
      ...args,
      stripeSessionId: "",
      status: "pending",
    });
  },
});

export const attachStripeSession = internalMutation({
  args: { orderId: v.id("orders"), stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      stripeSessionId: args.stripeSessionId,
    });
  },
});

export const markPaid = internalMutation({
  args: {
    orderId: v.id("orders"),
    shippingAddress: v.object({
      name: v.string(),
      address1: v.string(),
      address2: v.optional(v.string()),
      city: v.string(),
      stateCode: v.string(),
      countryCode: v.string(),
      zip: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      status: "paid",
      shippingAddress: args.shippingAddress,
    });
  },
});

export const updateStatus = internalMutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("fulfilling"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    printfulOrderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.printfulOrderId) patch.printfulOrderId = args.printfulOrderId;
    await ctx.db.patch(args.orderId, patch);
  },
});

export const getByIdInternal = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const getById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("orders")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const findByStripeSession = internalQuery({
  args: { stripeSessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_stripeSessionId", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();
  },
});
