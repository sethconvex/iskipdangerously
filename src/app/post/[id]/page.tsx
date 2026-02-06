"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PostPage() {
  const params = useParams();
  const postId = params.id as Id<"posts">;
  const post = useQuery(api.posts.getById, { postId });
  const userVote = useQuery(api.votes.getUserVoteForPost, { postId });
  const castVote = useMutation(api.votes.castVote);

  async function handleVote(voteType: "win" | "sin") {
    try {
      const result = await castVote({ postId, voteType });
      if (result.action === "created") {
        toast.success(voteType === "win" ? "Voted Win!" : "Voted Sin!");
      } else if (result.action === "removed") {
        toast.info("Vote removed");
      } else {
        toast.success(`Switched to ${voteType}!`);
      }
    } catch {
      toast.error("Sign in to vote");
    }
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Link>

        {post === undefined ? (
          <div>
            <Skeleton className="w-full h-96 rounded-lg mb-6" />
            <Skeleton className="h-8 w-2/3 mb-3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : post === null ? (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-2">Post not found</h1>
            <p className="text-muted-foreground">
              This post may have been removed.
            </p>
          </div>
        ) : (
          <div>
            {post.imageUrl && (
              <div className="relative">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full rounded-lg"
                />
                {(post.winCount > 0 || post.sinCount > 0) && (
                  <Badge
                    className="absolute top-4 right-4 text-sm px-3 py-1"
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
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {post.title}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Posted by {post.authorName}
                </p>
                {post.description && (
                  <p className="mt-4 text-muted-foreground">
                    {post.description}
                  </p>
                )}
              </div>

              {/* Vote buttons */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Cast your verdict
                </p>
                <div className="flex gap-3">
                  <Button
                    variant={
                      userVote?.voteType === "win" ? "default" : "outline"
                    }
                    size="lg"
                    className="gap-2 min-w-[120px]"
                    onClick={() => handleVote("win")}
                  >
                    <span className="text-lg">🏆</span>
                    Win
                    <span className="font-bold">({post.winCount})</span>
                  </Button>
                  <Button
                    variant={
                      userVote?.voteType === "sin" ? "destructive" : "outline"
                    }
                    size="lg"
                    className="gap-2 min-w-[120px]"
                    onClick={() => handleVote("sin")}
                  >
                    <span className="text-lg">😈</span>
                    Sin
                    <span className="font-bold">({post.sinCount})</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
