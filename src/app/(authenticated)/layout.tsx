"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/common/Header";
import Sidebar from "@/components/common/Sidebar";
import SessionLockGuard from "@/components/common/SessionLockGuard";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SessionLockProvider } from "@/lib/session-lock-context";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

function AuthenticatedLayoutContent({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, selectedChildId, setSelectedChildId } = useAuth();

  // Check if current path is chat page, chat sessions page, or session lock page
  const isChatPage = pathname === "/chat";
  const isChatSessionsPage = pathname === "/chat-sessions";
  const isSessionLockPage = pathname === "/session-lock";
  const isPinSetupPage = pathname === "/pin-setup";

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
  };

  const handleEditChild = (childId: string) => {
    // This will be handled by the router in the components
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <p className="text-purple-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!isAuthenticated) {
    return null;
  }

  // For chat page, session lock page, or pin setup page, return children directly without header and sidebar
  if (isChatPage || isSessionLockPage || isPinSetupPage) {
    return (
      <>
        <SessionLockGuard />
        {children}
      </>
    );
  }

  // For chat sessions page, include header and sidebar but no session lock guard (parents can access)
  if (isChatSessionsPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Sidebar selectedChildId={selectedChildId} />

        {/* Main content with sidebar offset */}
        <div className="lg:pl-64">
          <Header
            variant="dashboard"
            selectedChildId={selectedChildId}
            onChildSelect={handleChildSelect}
            onEditChild={handleEditChild}
          />

          {/* Page content */}
          <main>
            {children}
          </main>
        </div>
      </div>
    );
  }

  // For other pages, include header and sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <SessionLockGuard />
      <Sidebar selectedChildId={selectedChildId} />

      {/* Main content with sidebar offset */}
      <div className="lg:pl-64">
        <Header
          variant="dashboard"
          selectedChildId={selectedChildId}
          onChildSelect={handleChildSelect}
          onEditChild={handleEditChild}
        />

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <AuthProvider>
      <SessionLockProvider>
        <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
      </SessionLockProvider>
    </AuthProvider>
  );
} 