"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center">Loading...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const order = useQuery(
    api.orders.getById,
    orderId ? { orderId: orderId as Id<"orders"> } : "skip"
  );
  const clearCart = useMutation(api.cartItems.clearCart);
  const cleared = useRef(false);

  useEffect(() => {
    if (!cleared.current) {
      cleared.current = true;
      clearCart();
    }
  }, [clearCart]);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-16 text-center max-w-xl">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-8">
          Your order is being processed. You&apos;ll receive shipping updates by
          email.
        </p>

        {orderId && order === undefined ? (
          <div className="text-left bg-muted rounded-lg p-6 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : order ? (
          <div className="text-left bg-muted rounded-lg p-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between py-1 text-sm">
                <span>
                  {item.title} ({item.size}) x{item.quantity}
                </span>
                <span>
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t mt-4 pt-2 font-semibold flex justify-between">
              <span>Total</span>
              <span>${(order.totalAmount / 100).toFixed(2)}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">View My Orders</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}
