import { internalAction, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const SEED_POSTS = [
  { title: "GPT-4 diagnosed a rare disease that 17 doctors missed", description: "Patient had been misdiagnosed for 3 years. Fed symptoms into ChatGPT as a last resort and it nailed it on the first try." },
  { title: "Copilot wrote an entire working auth system in 30 seconds", description: "Asked for OAuth2 with refresh tokens and PKCE. It generated production-ready code with zero bugs." },
  { title: "AI translated a dead language that linguists couldn't crack", description: "An ancient Sumerian tablet that stumped researchers for decades was decoded by an LLM in minutes." },
  { title: "Claude refactored 10,000 lines of spaghetti code into clean modules", description: "Legacy codebase from 2008. The AI understood the business logic better than the original developers." },
  { title: "Midjourney generated concept art that won a state fair competition", description: "The judges didn't know it was AI. Sparked a massive debate about the future of art." },
  { title: "AI lawyer cited 6 fake court cases that never existed", description: "Attorney used ChatGPT to write a legal brief. Judge was not amused when opposing counsel couldn't find the citations anywhere." },
  { title: "Self-driving car tried to turn left into a lake", description: "Navigation AI confused a boat ramp for a road. Passengers had to grab the wheel at the last second." },
  { title: "AI generated a recipe that called for 47 cloves of garlic per serving", description: "The recipe also suggested baking cookies at 900°F for 45 minutes. Health and safety has questions." },
  { title: "Chatbot told a customer to eat glue to make cheese stick to pizza", description: "Google's AI overview pulled from a satirical Reddit post and presented it as real cooking advice." },
  { title: "Resume screener AI rejected every candidate named 'John'", description: "Training data had a weird bias. Company didn't notice for 3 months and missed hundreds of qualified applicants." },
];

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    // Find first user to attribute posts to
    const users = await ctx.runQuery(internal.seed.listUsers);
    if (users.length === 0) throw new Error("No users found");
    const userId = users[0]._id;

    for (const post of SEED_POSTS) {
      const postId = await ctx.runMutation(internal.seed.createPost, {
        userId,
        title: post.title,
        description: post.description,
      });

      // Schedule image generation
      await ctx.scheduler.runAfter(0, internal.generatePostImage.generate, {
        postId,
        title: post.title,
        description: post.description,
      });

      console.log(`Created: ${post.title}`);
    }

    return { created: SEED_POSTS.length };
  },
});

export const listUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").take(1);
  },
});

export const createPost = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      userId: args.userId,
      title: args.title,
      description: args.description,
      winCount: 0,
      sinCount: 0,
    });
  },
});
