import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    category: v.optional(v.union(v.literal("win"), v.literal("sin"))),
  },
  handler: async (ctx, args) => {
    let posts;
    if (args.category) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .take(50);
    } else {
      posts = await ctx.db.query("posts").order("desc").take(50);
    }

    return Promise.all(
      posts.map(async (post) => {
        const imageUrl = await ctx.storage.getUrl(post.imageStorageId);
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
          imageUrl,
          authorName: user?.name ?? "Unknown",
          authorAvatar: user?.avatarUrl,
        };
      })
    );
  },
});

export const trending = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(100);
    const sorted = posts.sort(
      (a, b) => b.winCount + b.sinCount - (a.winCount + a.sinCount)
    );
    const top = sorted.slice(0, 20);

    return Promise.all(
      top.map(async (post) => ({
        ...post,
        imageUrl: await ctx.storage.getUrl(post.imageStorageId),
        authorName: (await ctx.db.get(post.userId))?.name ?? "Unknown",
        authorAvatar: (await ctx.db.get(post.userId))?.avatarUrl,
      }))
    );
  },
});

export const featured = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(50);
    const sorted = posts.sort(
      (a, b) => b.winCount + b.sinCount - (a.winCount + a.sinCount)
    );
    const top = sorted.slice(0, 6);

    return Promise.all(
      top.map(async (post) => ({
        ...post,
        imageUrl: await ctx.storage.getUrl(post.imageStorageId),
        authorName: (await ctx.db.get(post.userId))?.name ?? "Unknown",
        authorAvatar: (await ctx.db.get(post.userId))?.avatarUrl,
      }))
    );
  },
});

export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    const imageUrl = await ctx.storage.getUrl(post.imageStorageId);
    const user = await ctx.db.get(post.userId);
    return {
      ...post,
      imageUrl,
      authorName: user?.name ?? "Unknown",
      authorAvatar: user?.avatarUrl,
    };
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        imageUrl: await ctx.storage.getUrl(post.imageStorageId),
      }))
    );
  },
});

export const create = mutation({
  args: {
    imageStorageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal("win"), v.literal("sin")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("posts", {
      userId: user._id,
      imageStorageId: args.imageStorageId,
      title: args.title,
      description: args.description,
      category: args.category,
      winCount: 0,
      sinCount: 0,
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
