"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const generate = internalAction({
  args: {
    postId: v.id("posts"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check rate limit
    const { ok, retryAfter } = await ctx.runMutation(
      internal.generatePostImageHelpers.checkRateLimit
    );
    if (!ok) {
      console.log(
        `Rate limited for post ${args.postId}, retrying in ${retryAfter}ms`
      );
      await ctx.scheduler.runAfter(
        retryAfter,
        internal.generatePostImage.generate,
        args
      );
      return;
    }

    const desc = args.description ? ` ${args.description}` : "";

    const prompt = `Bold graphic t-shirt design, screen-print style with clean lines and limited vibrant colors. Subject: "${args.title}".${desc} Feature a cool cartoon red lobster character as the central figure. Style: streetwear aesthetic, meme-worthy, would go viral on social media. Text on design: "I SKIP DANGEROUSLY". White background, isolated design ready for printing.`;

    try {
      // Use synchronous fal.ai endpoint (rate limiter handles throttling)
      const res = await fetch("https://fal.run/fal-ai/flux/dev", {
        method: "POST",
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_size: "landscape_16_9",
          num_images: 1,
        }),
      });

      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `fal.ai returned non-JSON (HTTP ${res.status}): ${responseText.slice(0, 500)}`
        );
      }

      if (!res.ok) {
        throw new Error(`fal.ai error ${res.status}: ${JSON.stringify(data)}`);
      }

      const imageUrl = data.images?.[0]?.url;
      if (imageUrl) {
        await ctx.runMutation(internal.posts.attachImage, {
          postId: args.postId,
          imageUrl,
        });
        console.log(`Generated image for post ${args.postId}`);
      } else {
        console.error(
          `No image in fal.ai response for post ${args.postId}: ${JSON.stringify(data).slice(0, 500)}`
        );
      }
    } catch (error) {
      console.error(
        `Image generation failed for post ${args.postId}:`,
        error
      );
    }
  },
});
