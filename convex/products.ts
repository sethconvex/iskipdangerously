import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    return Promise.all(
      products.map(async (p) => ({
        ...p,
        imageUrl: p.imageStorageId
          ? await ctx.storage.getUrl(p.imageStorageId)
          : p.imageUrl ?? null,
      }))
    );
  },
});

export const getById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return {
      ...product,
      imageUrl: product.imageStorageId
        ? await ctx.storage.getUrl(product.imageStorageId)
        : product.imageUrl ?? null,
    };
  },
});

export const getByIdInternal = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return {
      ...product,
      imageUrl: product.imageStorageId
        ? await ctx.storage.getUrl(product.imageStorageId)
        : product.imageUrl ?? null,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    price: v.number(),
    sizes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user || user.role !== "admin")
      throw new Error("Not authorized — admin only");

    return await ctx.db.insert("products", { ...args, active: true });
  },
});

export const createFromDesign = mutation({
  args: {
    designId: v.id("designs"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    sizes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const design = await ctx.db.get(args.designId);
    if (!design || design.status !== "complete" || !design.imageUrl) {
      throw new Error("Design not found or not complete");
    }

    return await ctx.db.insert("products", {
      title: args.title,
      description: args.description,
      imageUrl: design.imageUrl,
      designId: args.designId,
      price: args.price,
      sizes: args.sizes,
      active: true,
    });
  },
});

export const createFromPost = mutation({
  args: {
    postId: v.id("posts"),
    size: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const imageUrl = post.imageStorageId
      ? await ctx.storage.getUrl(post.imageStorageId)
      : post.imageUrl;
    if (!imageUrl) throw new Error("Post has no image yet");

    // Check if product already exists for this post
    let product = await ctx.db
      .query("products")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .unique();

    if (!product) {
      const productId = await ctx.db.insert("products", {
        title: post.title,
        description: `"${post.title}" — AI Win or Sin, printed on a Bella+Canvas 3001 Unisex Jersey. 100% cotton.`,
        imageUrl,
        postId: args.postId,
        price: 2999,
        sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
        active: true,
      });
      product = (await ctx.db.get(productId))!;
    }

    // Add to cart directly
    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_userId_productId_size", (q) =>
        q.eq("userId", user._id).eq("productId", product!._id).eq("size", args.size)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: existing.quantity + 1 });
    } else {
      await ctx.db.insert("cartItems", {
        userId: user._id,
        productId: product._id,
        size: args.size,
        quantity: 1,
      });
    }

    return product._id;
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
