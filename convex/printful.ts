"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const PRINTFUL_API = "https://api.printful.com";

// Bella+Canvas 3001 Unisex Jersey in Black — size → Printful variant ID
const VARIANT_IDS: Record<string, number> = {
  XS: 9527,
  S: 4016,
  M: 4017,
  L: 4018,
  XL: 4019,
  "2XL": 4020,
  "3XL": 5295,
};

const PRINTFUL_STORE_ID = "17674040";

async function printfulFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PRINTFUL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
      "X-PF-Store-Id": PRINTFUL_STORE_ID,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Printful API error: ${res.status} ${error}`);
  }
  return res.json();
}

export const createOrder = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(internal.orders.getByIdInternal, {
      orderId: args.orderId,
    });
    if (!order || !order.shippingAddress) {
      throw new Error("Order or shipping address not found");
    }

    const items = await Promise.all(
      order.items.map(async (item: { productId: Id<"products">; size: string; quantity: number }) => {
        const product = await ctx.runQuery(
          internal.products.getByIdInternal,
          { productId: item.productId }
        );
        if (!product) throw new Error(`Product ${item.productId} not found`);

        const variantId = VARIANT_IDS[item.size];
        if (!variantId) throw new Error(`Unknown size: ${item.size}`);

        return {
          variant_id: variantId,
          quantity: item.quantity,
          files: [
            {
              type: "front",
              url: product.imageUrl,
            },
          ],
        };
      })
    );

    try {
      const result = await printfulFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          recipient: {
            name: order.shippingAddress.name,
            address1: order.shippingAddress.address1,
            address2: order.shippingAddress.address2,
            city: order.shippingAddress.city,
            state_code: order.shippingAddress.stateCode,
            country_code: order.shippingAddress.countryCode,
            zip: order.shippingAddress.zip,
          },
          items,
          confirm: true,
        }),
      });

      await ctx.runMutation(internal.orders.updateStatus, {
        orderId: args.orderId,
        status: "fulfilling",
        printfulOrderId: String(result.result.id),
      });
    } catch (error) {
      console.error("Printful order creation failed:", error);
      await ctx.runMutation(internal.orders.updateStatus, {
        orderId: args.orderId,
        status: "failed",
      });
    }
  },
});

export const handleWebhook = internalAction({
  args: { event: v.any() },
  handler: async (ctx, { event }) => {
    const printfulOrderId = String(event.data?.order?.id);
    if (!printfulOrderId) return;

    console.log(`Printful webhook: ${event.type} for order ${printfulOrderId}`);

    switch (event.type) {
      case "package_shipped":
        console.log("Order shipped:", printfulOrderId);
        break;
      case "order_failed":
        console.log("Order failed:", printfulOrderId);
        break;
    }
  },
});
