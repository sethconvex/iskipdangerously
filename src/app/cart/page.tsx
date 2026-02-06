"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function CartPage() {
  const cartItems = useQuery(api.cartItems.getMyCart);
  const updateQuantity = useMutation(api.cartItems.updateQuantity);
  const removeItem = useMutation(api.cartItems.removeItem);
  const checkout = useAction(api.stripe.createCheckoutSession);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const total =
    cartItems?.reduce(
      (sum: number, item: { product?: { price: number } | null; quantity: number }) => sum + (item.product?.price ?? 0) * item.quantity,
      0
    ) ?? 0;

  async function handleCheckout() {
    setIsCheckingOut(true);
    try {
      const url = await checkout();
      if (url) window.location.href = url;
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {cartItems === undefined ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-24 w-24 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !cartItems.length ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground mb-4">
              Your cart is empty.
            </p>
            <Button asChild>
              <Link href="/shop">Browse the Shop</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  {item.product?.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="h-24 w-24 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {item.product?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Size: {item.size}
                    </p>
                    <p className="font-semibold mt-1">
                      ${((item.product?.price ?? 0) / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity({
                          itemId: item._id,
                          quantity: item.quantity - 1,
                        })
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity({
                          itemId: item._id,
                          quantity: item.quantity + 1,
                        })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeItem({ itemId: item._id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">
                Total: ${(total / 100).toFixed(2)}
              </span>
              <Button
                onClick={handleCheckout}
                size="lg"
                disabled={isCheckingOut}
                className="gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
