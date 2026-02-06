"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const PRINTFUL_API = "https://api.printful.com";

async function printfulFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PRINTFUL_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
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
      order.items.map(async (item: { productId: string; quantity: number }) => {
        const product = await ctx.runQuery(
          internal.products.getByIdInternal,
          { productId: item.productId }
        );
        return {
          sync_variant_id: product?.printfulSyncProductId,
          quantity: item.quantity,
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

    // Look up the order by printful order ID
    // For now, log the event - full implementation would search orders table
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
