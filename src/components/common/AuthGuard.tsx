"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Don't do anything while auth state is loading
    if (isLoading) return;

    // If user is authenticated and trying to access auth pages or main page
    if (
      isAuthenticated &&
      (pathname === "/" || pathname.startsWith("/auth/"))
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Don't render anything, this is just a guard
  return null;
}
