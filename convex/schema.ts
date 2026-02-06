import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    workosId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
  })
    .index("by_workosId", ["workosId"])
    .index("by_email", ["email"]),

  posts: defineTable({
    userId: v.id("users"),
    imageStorageId: v.id("_storage"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(v.literal("win"), v.literal("sin")),
    winCount: v.number(),
    sinCount: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_category", ["category"]),

  votes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    voteType: v.union(v.literal("win"), v.literal("sin")),
  })
    .index("by_userId_postId", ["userId", "postId"])
    .index("by_postId", ["postId"])
    .index("by_userId", ["userId"]),

  products: defineTable({
    title: v.string(),
    description: v.string(),
    imageStorageId: v.id("_storage"),
    printfulSyncProductId: v.optional(v.string()),
    price: v.number(), // cents
    sizes: v.array(v.string()),
    active: v.boolean(),
  }).index("by_active", ["active"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    size: v.string(),
    quantity: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_productId_size", ["userId", "productId", "size"]),

  orders: defineTable({
    userId: v.id("users"),
    stripeSessionId: v.string(),
    printfulOrderId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("fulfilling"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    items: v.array(
      v.object({
        productId: v.id("products"),
        title: v.string(),
        size: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    totalAmount: v.number(), // cents
    shippingAddress: v.optional(
      v.object({
        name: v.string(),
        address1: v.string(),
        address2: v.optional(v.string()),
        city: v.string(),
        stateCode: v.string(),
        countryCode: v.string(),
        zip: v.string(),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSessionId", ["stripeSessionId"])
    .index("by_status", ["status"]),

  designs: defineTable({
    userId: v.id("users"),
    prompt: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("generating"),
      v.literal("complete"),
      v.literal("failed")
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),
});
