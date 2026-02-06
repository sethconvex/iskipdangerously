"use node";

import { action, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

type CartItem = {
  _id: string;
  productId: string;
  size: string;
  quantity: number;
  product: {
    title: string;
    price: number;
    imageUrl: string | null;
  } | null;
};

export const createCheckoutSession = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.currentUser);
    if (!user) throw new Error("User not found");

    const cartItems: CartItem[] = await ctx.runQuery(api.cartItems.getMyCart);
    if (!cartItems.length) throw new Error("Cart is empty");

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cartItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.product!.title} (${item.size})`,
            images: item.product!.imageUrl ? [item.product!.imageUrl] : [],
          },
          unit_amount: item.product!.price,
        },
        quantity: item.quantity,
      }));

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.product!.price * item.quantity,
      0
    );

    const orderId = await ctx.runMutation(internal.orders.createPending, {
      userId: user._id,
      items: cartItems.map((item) => ({
        productId: item.productId,
        title: item.product!.title,
        size: item.size,
        quantity: item.quantity,
        price: item.product!.price,
      })),
      totalAmount,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${appUrl}/checkout/success?orderId=${orderId}`,
      cancel_url: `${appUrl}/cart`,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },
      metadata: {
        convexOrderId: orderId,
      },
    });

    await ctx.runMutation(internal.orders.attachStripeSession, {
      orderId,
      stripeSessionId: session.id,
    });

    return session.url;
  },
});

export const fulfillOrder = internalAction({
  args: { signature: v.string(), payload: v.string() },
  handler: async (ctx, { signature, payload }) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const convexOrderId = session.metadata?.convexOrderId;

      if (convexOrderId) {
        const shipping =
          session.collected_information?.shipping_details;
        await ctx.runMutation(internal.orders.markPaid, {
          orderId: convexOrderId as any,
          shippingAddress: {
            name: shipping?.name ?? "",
            address1: shipping?.address?.line1 ?? "",
            address2: shipping?.address?.line2 ?? undefined,
            city: shipping?.address?.city ?? "",
            stateCode: shipping?.address?.state ?? "",
            countryCode: shipping?.address?.country ?? "",
            zip: shipping?.address?.postal_code ?? "",
          },
        });

        // Trigger Printful order creation
        await ctx.runAction(internal.printful.createOrder, {
          orderId: convexOrderId as any,
        });
      }
    }

    return { success: true };
  },
});
