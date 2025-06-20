"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  MessageCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { ChildSelector } from "@/components/dashboard/child-selector";
import Modal from "@/components/common/Modal";

interface HeaderProps {
  variant?: "default" | "dashboard" | "auth";
  selectedChildId?: string;
  onChildSelect?: (childId: string) => void;
  onEditChild?: (childId: string) => void;
}

interface Family {
  parent_name: string;
  family_name: string;
  children?: Array<{ id: string; name: string }>;
}

export default function Header({
  variant = "default",
  selectedChildId,
  onChildSelect,
  onEditChild,
}: HeaderProps) {
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (variant === "auth") {
      setIsLoading(false);
      return;
    }

    checkAuthentication();
  }, [variant]);

  const checkAuthentication = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setFamily(data.family);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleChildSelect = (childId: string) => {
    if (onChildSelect) {
      onChildSelect(childId);
    }
  };

  const handleEditChild = (childId: string) => {
    if (onEditChild) {
      onEditChild(childId);
    } else {
      // Default behavior: navigate to edit page
      router.push(`/add-child?childId=${childId}`);
    }
  };

  const handleAddChild = () => {
    router.push("/add-child");
  };

  // Loading state
  if (isLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1
                  className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  Heart Harbor
                </h1>
                <p
                  className="text-xs sm:text-sm text-gray-600 truncate"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Family Communication Coach
                </p>
              </div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  // Auth pages header (login/register)
  if (variant === "auth") {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1
                  className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  Heart Harbor
                </h1>
                <p
                  className="text-xs sm:text-sm text-gray-600 truncate"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Family Communication Coach
                </p>
              </div>
            </Link>
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm sm:text-base"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Unauthenticated header (landing page)
  if (!isAuthenticated) {
    return (
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-3 text-white text-xl font-semibold"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <span style={{ fontFamily: "var(--font-poppins)" }}>
                Heart Harbor
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-white hover:text-purple-200 transition-colors font-medium"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-purple-500">
              <div className="flex flex-col space-y-3 pt-4">
                <Link
                  href="/auth/login"
                  className="text-white hover:text-purple-200 transition-colors font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  // Dashboard header (authenticated)
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Heart Harbor
              </h1>
              <p
                className="text-xs sm:text-sm text-gray-600 truncate"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Family Communication Coach
              </p>
            </div>

            {family && (
              <div className="hidden lg:block ml-4 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  Welcome back, {family.parent_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {family.family_name}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Child Selector */}
            <div className="hidden sm:block">
              <ChildSelector
                selectedChildId={selectedChildId}
                onChildSelect={handleChildSelect}
                onEditChild={handleEditChild}
                onAddChild={handleAddChild}
              />
            </div>

            <div className="hidden md:flex items-center space-x-2 bg-green-50 px-2 sm:px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm font-medium text-green-700 whitespace-nowrap">
                Emma is online
              </span>
            </div>

            <Link
              href="/add-child"
              className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Child</span>
              <span className="sm:hidden">Add</span>
            </Link>

            <Link
              href={
                selectedChildId ? `/chat?childId=${selectedChildId}` : "/chat"
              }
              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Start Session</span>
              <span className="sm:hidden">Chat</span>
            </Link>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log Out?"
        type="warning"
        icon={<AlertTriangle className="h-6 w-6" />}
        primaryButton={{
          text: "Log Out",
          onClick: handleLogout,
          className: "bg-red-600 text-white hover:bg-red-700",
        }}
        secondaryButton={{
          text: "Cancel",
          onClick: () => setShowLogoutModal(false),
        }}
      >
        Are you sure you want to log out? You will need to log in again to
        access your dashboard.
      </Modal>
    </header>
  );
}
