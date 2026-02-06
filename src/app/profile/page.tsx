"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, Package } from "lucide-react";

function MyPosts({ userId }: { userId: string }) {
  const posts = useQuery(api.posts.getByUserId, { userId: userId as any });

  if (posts === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>You haven&apos;t posted anything yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <Link key={post._id} href={`/post/${post._id}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-40 object-cover"
                loading="lazy"
              />
            )}
            <CardContent className="pt-3">
              <h3 className="font-semibold text-sm line-clamp-1">
                {post.title}
              </h3>
              <Badge
                variant={post.category === "win" ? "default" : "destructive"}
                className="mt-1"
              >
                {post.category === "win" ? "Win" : "Sin"}
              </Badge>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground pt-0 pb-3 flex gap-4">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5" /> {post.winCount}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="h-3.5 w-3.5" /> {post.sinCount}
              </span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function MyVotes() {
  const votes = useQuery(api.votes.getUserVotes);

  if (votes === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (votes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>You haven&apos;t voted on anything yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {votes.map((vote) => (
        <Link
          key={vote._id}
          href={vote.post ? `/post/${vote.postId}` : "#"}
          className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {vote.post?.imageUrl && (
            <img
              src={vote.post.imageUrl}
              alt=""
              className="h-12 w-12 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {vote.post?.title ?? "Deleted post"}
            </p>
          </div>
          <Badge variant={vote.voteType === "win" ? "default" : "destructive"}>
            {vote.voteType === "win" ? "Win" : "Sin"}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function MyOrders() {
  const orders = useQuery(api.orders.getMyOrders);

  if (orders === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No orders yet.</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    fulfilling: "bg-purple-100 text-purple-800",
    shipped: "bg-green-100 text-green-800",
    delivered: "bg-green-200 text-green-900",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order._id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              ${(order.totalAmount / 100).toFixed(2)}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] ?? ""}`}
            >
              {order.status}
            </span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {order.items.map((item, i) => (
              <p key={i}>
                {item.title} ({item.size}) x{item.quantity}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const user = useQuery(api.users.currentUser);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {user === undefined ? (
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        ) : user === null ? (
          <div className="text-center py-20">
            <p>Please sign in to view your profile.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-xl">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Tabs defaultValue="posts">
              <TabsList className="mb-6">
                <TabsTrigger value="posts">My Posts</TabsTrigger>
                <TabsTrigger value="votes">My Votes</TabsTrigger>
                <TabsTrigger value="orders">My Orders</TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                <MyPosts userId={user._id} />
              </TabsContent>
              <TabsContent value="votes">
                <MyVotes />
              </TabsContent>
              <TabsContent value="orders">
                <MyOrders />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
