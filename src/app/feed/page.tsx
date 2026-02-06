"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";

type FilterType = "all" | "win" | "sin" | "trending";

export default function FeedPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const regularPosts = useQuery(
    api.posts.list,
    filter === "trending"
      ? "skip"
      : filter === "all"
        ? {}
        : { category: filter }
  );
  const trendingPosts = useQuery(
    api.posts.trending,
    filter === "trending" ? {} : "skip"
  );

  const posts = filter === "trending" ? trendingPosts : regularPosts;

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
              <TabsTrigger value="win">Wins</TabsTrigger>
              <TabsTrigger value="sin">Sins</TabsTrigger>
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
            {posts.map((post) => (
              <Link key={post._id} href={`/post/${post._id}`}>
                <Card className="break-inside-avoid overflow-hidden hover:shadow-lg transition-shadow group mb-4">
                  {post.imageUrl && (
                    <div className="relative overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-auto group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <Badge
                        className="absolute top-2 right-2"
                        variant={
                          post.category === "win" ? "default" : "destructive"
                        }
                      >
                        {post.category === "win" ? "Win" : "Sin"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-3">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      by {post.authorName}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between text-sm text-muted-foreground pt-0 pb-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" /> {post.winCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="h-4 w-4" /> {post.sinCount}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
