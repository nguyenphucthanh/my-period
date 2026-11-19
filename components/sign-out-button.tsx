"use client";

import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  if (!isAuthenticated) return null;
  return (
    <Button
      variant="outline"
      onClick={() => void signOut().then(() => router.push("/signin"))}
    >
      Đăng xuất
    </Button>
  );
}
