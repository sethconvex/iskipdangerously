"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SHIRT_SIZES } from "@/lib/constants";

type FilterType = "all" | "trending";

export default function FeedPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const regularPosts = useQuery(
    api.posts.list,
    filter === "trending" ? "skip" : {}
  );
  const trendingPosts = useQuery(
    api.posts.trending,
    filter === "trending" ? {} : "skip"
  );

  const posts = filter === "trending" ? trendingPosts : regularPosts;
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold">Gallery</h1>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as FilterType)}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {posts === undefined ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="break-inside-avoid overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-3">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">No posts found.</p>
            <p>Be the first to submit something!</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {posts.map((post) => {
              const myVote = userVotes?.[post._id];
              return (
                <Card
                  key={post._id}
                  className="break-inside-avoid overflow-hidden hover:shadow-lg transition-shadow group mb-4"
                >
                  {post.imageUrl && (
                    <Link href={`/post/${post._id}`}>
                      <div className="relative overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-auto group-hover:scale-105 transition-transform"
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
                  <CardContent className="pt-3">
                    <Link href={`/post/${post._id}`}>
                      <h3 className="font-semibold text-sm line-clamp-2 hover:underline">
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
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Shirt className="h-3.5 w-3.5" />
                            Buy Tee
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-48 p-2"
                          onClick={(e) => e.stopPropagation()}
                        >
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
      </div>
      <Footer />
    </>
  );
}
