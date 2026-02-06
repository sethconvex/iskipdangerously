"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as Id<"products">;
  const product = useQuery(api.products.getById, { productId });
  const addToCart = useMutation(api.cartItems.addItem);
  const [selectedSize, setSelectedSize] = useState<string>("");

  async function handleAddToCart() {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    try {
      await addToCart({ productId, size: selectedSize, quantity: 1 });
      toast.success("Added to cart!");
    } catch {
      toast.error("Sign in to add to cart");
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        {product === undefined ? (
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div>
              <Skeleton className="h-8 w-3/4 mb-3" />
              <Skeleton className="h-6 w-1/4 mb-6" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : product === null ? (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full rounded-lg"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <p className="text-2xl font-semibold mt-2">
                ${(product.price / 100).toFixed(2)}
              </p>
              <p className="text-muted-foreground mt-4">
                {product.description}
              </p>

              <div className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select onValueChange={setSelectedSize} value={selectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full gap-2"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t text-sm text-muted-foreground space-y-2">
                <p>Printed on demand by Printful</p>
                <p>Ships to US, Canada, UK, and Australia</p>
                <p>100% cotton, comfortable fit</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
