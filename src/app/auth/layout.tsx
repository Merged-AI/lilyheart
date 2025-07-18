"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Brain } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayoutContent({ children }: AuthLayoutProps) {
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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <p className="text-purple-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated, don't render the auth page content (redirect is happening)
  if (isAuthenticated && (pathname === "/" || pathname.startsWith("/auth/"))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <p className="text-purple-700">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Only render auth page content for unauthenticated users
  return <>{children}</>;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </AuthProvider>
  );
}
