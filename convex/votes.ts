import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const castVote = mutation({
  args: {
    postId: v.id("posts"),
    voteType: v.union(v.literal("win"), v.literal("sin")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_userId_postId", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique();

    const post = await ctx.db.get(args.postId) ;
    if (!post) throw new Error("Post not found");

    if (existingVote) {
      if (existingVote.voteType === args.voteType) {
        // Toggle off: same vote removes it
        await ctx.db.delete(existingVote._id);
        const field = args.voteType === "win" ? "winCount" : "sinCount";
        await ctx.db.patch(args.postId, {
          [field]: Math.max(0, post[field] - 1),
        });
        return { action: "removed" as const };
      } else {
        // Switch vote
        await ctx.db.patch(existingVote._id, { voteType: args.voteType });
        const incField = args.voteType === "win" ? "winCount" : "sinCount";
        const decField = args.voteType === "win" ? "sinCount" : "winCount";
        await ctx.db.patch(args.postId, {
          [incField]: post[incField] + 1,
          [decField]: Math.max(0, post[decField] - 1),
        });
        return { action: "switched" as const };
      }
    } else {
      // New vote
      await ctx.db.insert("votes", {
        userId: user._id,
        postId: args.postId,
        voteType: args.voteType,
      });
      const field = args.voteType === "win" ? "winCount" : "sinCount";
      await ctx.db.patch(args.postId, {
        [field]: post[field] + 1,
      });
      return { action: "created" as const };
    }
  },
});

export const getUserVoteForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) return null;

    return await ctx.db
      .query("votes")
      .withIndex("by_userId_postId", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .unique();
  },
});

export const getUserVotesMap = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return {};

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) return {};

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const map: Record<string, "win" | "sin"> = {};
    for (const vote of votes) {
      map[vote.postId] = vote.voteType;
    }
    return map;
  },
});

export const getUserVotes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) return [];

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      votes.map(async (vote) => {
        const post = await ctx.db.get(vote.postId) ;
        return {
          ...vote,
          post: post
            ? {
                ...post,
                imageUrl: post.imageStorageId
                  ? await ctx.storage.getUrl(post.imageStorageId)
                  : post.imageUrl ?? null,
              }
            : null,
        };
      })
    );
  },
});
