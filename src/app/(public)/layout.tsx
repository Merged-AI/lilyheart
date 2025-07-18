"use client";

import { AuthProvider } from "@/lib/auth-context";
import AuthGuard from "@/components/common/AuthGuard";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AuthProvider>
      <AuthGuard />
      {children}
    </AuthProvider>
  );
}
