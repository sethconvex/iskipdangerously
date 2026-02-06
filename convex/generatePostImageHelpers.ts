import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { rateLimiter } from "./rateLimits";

// Mutation to check/consume rate limit (rate limiter needs mutation context)
export const checkRateLimit = internalMutation({
  args: {},
  handler: async (ctx) => {
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "falAi", {
      key: "global",
    });
    return { ok, retryAfter: retryAfter ?? 0 };
  },
});

// Query to find posts without images
export const listPostsWithoutImages = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allPosts = await ctx.db.query("posts").collect();
    return allPosts.filter((p) => !p.imageUrl && !p.imageStorageId);
  },
});

// Re-generate images for all posts that don't have one
export const regenerateMissing = internalAction({
  args: {},
  handler: async (ctx): Promise<{ scheduled: number }> => {
    const posts = await ctx.runQuery(
      internal.generatePostImageHelpers.listPostsWithoutImages
    );
    console.log(`Found ${posts.length} posts without images`);

    for (const post of posts) {
      await ctx.scheduler.runAfter(
        0,
        internal.generatePostImage.generate,
        {
          postId: post._id,
          title: post.title,
          description: post.description,
        }
      );
    }

    return { scheduled: posts.length };
  },
});
