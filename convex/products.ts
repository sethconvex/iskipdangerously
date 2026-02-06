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

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
