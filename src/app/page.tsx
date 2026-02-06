"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import {
  ArrowRight,
  Upload,
  Vote,
  Shirt,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { SHIRT_SIZES } from "@/lib/constants";

export default function HomePage() {
  const featured = useQuery(api.posts.featured);
  const userVotes = useQuery(api.votes.getUserVotesMap);
  const castVote = useMutation(api.votes.castVote);
  const buyFromPost = useMutation(api.products.createFromPost);

  async function handleVote(
    e: React.MouseEvent,
    postId: Id<"posts">,
    voteType: "win" | "sin"
  ) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await castVote({ postId, voteType });
    } catch {
      toast.error("Sign in to vote");
    }
  }

  async function handleBuy(postId: Id<"posts">, size: string) {
    try {
      await buyFromPost({ postId, size });
      toast.success("Added to cart!");
    } catch {
      toast.error("Sign in to buy");
    }
  }

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20 dark:to-background">
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="text-7xl md:text-9xl mb-6">🦞</div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Dangerously{" "}
            <span className="text-orange-500">Ship</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Post something wild AI did. The community votes:{" "}
            <strong>Win</strong> or <strong>Sin</strong>? The best moments
            become t-shirts you can actually wear.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/feed">
                Browse the Gallery
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/shop">
                <Shirt className="h-4 w-4" />
                Shop T-Shirts
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
              <Upload className="h-7 w-7 text-orange-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">1. Post It</h3>
            <p className="text-sm text-muted-foreground">
              Share something wild AI did — the community decides if it was
              genius or catastrophe.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
              <Vote className="h-7 w-7 text-orange-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">2. Vote Win or Sin</h3>
            <p className="text-sm text-muted-foreground">
              Was it a Win or a Sin? Cast your vote and watch the verdict
              shift in real time.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
              <Shirt className="h-7 w-7 text-orange-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">3. Wear It</h3>
            <p className="text-sm text-muted-foreground">
              The best posts become t-shirts. Rock the lobster. Skip
              dangerously. Dangerously ship.
            </p>
          </div>
        </div>
      </section>

      {/* Featured posts */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Featured Posts</h2>
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/feed">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {featured === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-4">No posts yet. Be the first!</p>
            <Button asChild>
              <Link href="/submit">Submit a Post</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((post) => {
              const myVote = userVotes?.[post._id];
              return (
                <Card
                  key={post._id}
                  className="overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {post.imageUrl && (
                    <Link href={`/post/${post._id}`}>
                      <div className="relative overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        {(post.winCount > 0 || post.sinCount > 0) && (
                          <Badge
                            className="absolute top-2 right-2"
                            variant={
                              post.winCount >= post.sinCount
                                ? "default"
                                : "destructive"
                            }
                          >
                            {post.winCount >= post.sinCount ? "Win" : "Sin"}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  )}
                  <CardContent className="pt-4">
                    <Link href={`/post/${post._id}`}>
                      <h3 className="font-semibold line-clamp-1 hover:underline">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {post.authorName}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between pt-0 pb-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleVote(e, post._id, "win")}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
                          myVote === "win"
                            ? "bg-primary/10 font-bold"
                            : "hover:bg-muted"
                        }`}
                      >
                        🏆 {post.winCount}
                      </button>
                      <button
                        onClick={(e) => handleVote(e, post._id, "sin")}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors ${
                          myVote === "sin"
                            ? "bg-destructive/10 font-bold"
                            : "hover:bg-muted"
                        }`}
                      >
                        😈 {post.sinCount}
                      </button>
                    </div>
                    {post.imageUrl && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                          >
                            <Shirt className="h-3.5 w-3.5" />
                            Buy Tee
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <p className="text-xs font-medium mb-2">
                            Pick a size — $29.99
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {SHIRT_SIZES.map((size) => (
                              <Button
                                key={size}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2"
                                onClick={() => handleBuy(post._id, size)}
                              >
                                {size}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Studio CTA */}
      <section className="bg-gradient-to-r from-purple-50 to-orange-50 dark:from-purple-950/20 dark:to-orange-950/20">
        <div className="container mx-auto px-4 py-16 text-center">
          <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            AI Design Studio
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            Use AI to generate wild new t-shirt designs featuring our lobster
            mascot. Your imagination is the only limit.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/generate">
              <Sparkles className="h-4 w-4" />
              Start Creating
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </>
  );
}
