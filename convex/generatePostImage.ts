"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const generate = internalAction({
  args: {
    postId: v.id("posts"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal("win"), v.literal("sin")),
  },
  handler: async (ctx, args) => {
    const categoryLabel = args.category === "win" ? "amazing success" : "hilarious failure";
    const desc = args.description ? ` Context: ${args.description}` : "";

    const prompt = `Editorial illustration for a story about an AI ${categoryLabel}: "${args.title}".${desc} Bold graphic style, vibrant colors, include a red lobster character reacting to the scene. White background.`;

    try {
      const res = await fetch("https://queue.fal.run/fal-ai/flux/dev", {
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

      if (!res.ok) {
        // queue.fal.run returns a request ID for async processing
        const data = await res.json();
        const requestId = data.request_id;

        if (requestId) {
          // Poll for result
          let imageUrl: string | null = null;
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 3000));

            const statusRes = await fetch(
              `https://queue.fal.run/fal-ai/flux/dev/requests/${requestId}/status`,
              {
                headers: { Authorization: `Key ${process.env.FAL_KEY}` },
              }
            );
            const statusData = await statusRes.json();

            if (statusData.status === "COMPLETED") {
              const resultRes = await fetch(
                `https://queue.fal.run/fal-ai/flux/dev/requests/${requestId}`,
                {
                  headers: { Authorization: `Key ${process.env.FAL_KEY}` },
                }
              );
              const resultData = await resultRes.json();
              imageUrl = resultData.images?.[0]?.url;
              break;
            } else if (statusData.status === "FAILED") {
              throw new Error("fal.ai generation failed");
            }
          }

          if (imageUrl) {
            await ctx.runMutation(internal.posts.attachImage, {
              postId: args.postId,
              imageUrl,
            });
            console.log(`Generated image for post ${args.postId}`);
          }
        } else {
          throw new Error(`fal.ai error: ${res.status}`);
        }
      } else {
        // Synchronous response
        const data = await res.json();
        const imageUrl = data.images?.[0]?.url;
        if (imageUrl) {
          await ctx.runMutation(internal.posts.attachImage, {
            postId: args.postId,
            imageUrl,
          });
          console.log(`Generated image for post ${args.postId}`);
        }
      }
    } catch (error) {
      console.error(`Image generation failed for post ${args.postId}:`, error);
    }
  },
});
