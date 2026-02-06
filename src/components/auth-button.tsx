"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { LogIn, User, ShoppingBag, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const currentUser = useQuery(api.users.currentUser);

  useEffect(() => {
    if (user && !currentUser) {
      getOrCreateUser();
    }
  }, [user, currentUser, getOrCreateUser]);

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild size="sm" className="gap-2">
        <Link href="/signin">
          <LogIn className="h-4 w-4" />
          Sign In
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.profilePictureUrl ?? undefined} />
            <AvatarFallback>
              {user.firstName?.[0] ?? user.email?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user.firstName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/generate" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Studio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile?tab=orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
