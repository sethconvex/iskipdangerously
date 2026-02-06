import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

async function getPostImageUrl(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  post: { imageStorageId?: string; imageUrl?: string }
) {
  if (post.imageStorageId) return await ctx.storage.getUrl(post.imageStorageId);
  return post.imageUrl ?? null;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(50);

    return Promise.all(
      posts.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
          imageUrl: await getPostImageUrl(ctx, post),
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
      top.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
          imageUrl: await getPostImageUrl(ctx, post),
          authorName: user?.name ?? "Unknown",
          authorAvatar: user?.avatarUrl,
        };
      })
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
      top.map(async (post) => {
        const user = await ctx.db.get(post.userId);
        return {
          ...post,
          imageUrl: await getPostImageUrl(ctx, post),
          authorName: user?.name ?? "Unknown",
          authorAvatar: user?.avatarUrl,
        };
      })
    );
  },
});

export const getById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;
    const user = await ctx.db.get(post.userId);
    return {
      ...post,
      imageUrl: await getPostImageUrl(ctx, post),
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
        imageUrl: await getPostImageUrl(ctx, post),
      }))
    );
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const postId = await ctx.db.insert("posts", {
      userId: user._id,
      title: args.title,
      description: args.description,
      winCount: 0,
      sinCount: 0,
    });

    // Auto-generate an image for this post
    await ctx.scheduler.runAfter(0, internal.generatePostImage.generate, {
      postId,
      title: args.title,
      description: args.description,
    });

    return postId;
  },
});

export const attachImage = internalMutation({
  args: { postId: v.id("posts"), imageUrl: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, { imageUrl: args.imageUrl });
  },
});
