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

// 24 hours in milliseconds
const CONFIRM_DELAY_MS = 24 * 60 * 60 * 1000;

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

// Step 1: Create a draft order on Printful (no confirm), schedule confirmation in 24h
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
      // Create as DRAFT (no confirm) — gives 24h chargeback window
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
        }),
      });

      const printfulOrderId = String(result.result.id);

      await ctx.runMutation(internal.orders.updateStatus, {
        orderId: args.orderId,
        status: "fulfilling",
        printfulOrderId,
      });

      // Schedule confirmation in 24 hours
      await ctx.scheduler.runAfter(
        CONFIRM_DELAY_MS,
        internal.printful.confirmOrder,
        { orderId: args.orderId, printfulOrderId }
      );

      console.log(
        `Printful draft order ${printfulOrderId} created. Confirmation scheduled in 24h.`
      );
    } catch (error) {
      console.error("Printful order creation failed:", error);
      await ctx.runMutation(internal.orders.updateStatus, {
        orderId: args.orderId,
        status: "failed",
      });
    }
  },
});

// Step 2: Confirm the Printful order after 24h delay
export const confirmOrder = internalAction({
  args: { orderId: v.id("orders"), printfulOrderId: v.string() },
  handler: async (ctx, args) => {
    // Check if order was cancelled/refunded during the delay
    const order = await ctx.runQuery(internal.orders.getByIdInternal, {
      orderId: args.orderId,
    });
    if (!order) return;

    if (order.status === "refunded" || order.status === "failed") {
      console.log(
        `Order ${args.orderId} is ${order.status}, cancelling Printful order ${args.printfulOrderId}`
      );
      try {
        await printfulFetch(`/orders/${args.printfulOrderId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to cancel Printful order:", error);
      }
      return;
    }

    try {
      await printfulFetch(`/orders/${args.printfulOrderId}/confirm`, {
        method: "POST",
      });
      console.log(`Printful order ${args.printfulOrderId} confirmed after 24h hold.`);
    } catch (error) {
      console.error("Printful order confirmation failed:", error);
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
