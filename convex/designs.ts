import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const startGeneration = mutation({
  args: { prompt: v.string(), model: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("designs", {
      userId: user._id,
      prompt: args.prompt,
      model: args.model,
      status: "generating",
    });
  },
});

export const completeGeneration = mutation({
  args: {
    designId: v.id("designs"),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.designId, {
      imageUrl: args.imageUrl,
      status: "complete",
    });
  },
});

export const failGeneration = mutation({
  args: { designId: v.id("designs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.designId, { status: "failed" });
  },
});

export const getUserDesigns = query({
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
      .query("designs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const recentPublicDesigns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("designs")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .order("desc")
      .take(20);
  },
});
