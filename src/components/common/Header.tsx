"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  MessageCircle,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  User,
  ChevronDown,
  Settings,
  CreditCard,
} from "lucide-react";
import { ChildSelector } from "@/components/dashboard/child-selector";
import Modal from "@/components/common/Modal";
import ChatModeModal from "@/components/common/ChatModeModal";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  variant?: "default" | "dashboard" | "auth";
  selectedChildId?: string;
  onChildSelect?: (childId: string) => void;
  onEditChild?: (childId: string) => void;
  onSidebarToggle?: () => void;
}

export default function Header({
  variant = "default",
  selectedChildId,
  onChildSelect,
  onEditChild,
  onSidebarToggle,
}: HeaderProps) {
  const router = useRouter();
  const { family, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showChatModeModal, setShowChatModeModal] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".profile-dropdown")) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
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
      router.push(`/children/add?childId=${childId}`);
    }
  };

  const handleAddChild = () => {
    router.push("/children/add");
  };

  const handleProfileClick = () => {
    // TODO: Navigate to profile page when implemented
    router.push("/profile");
    setIsProfileDropdownOpen(false);
  };

  // Auth pages header (login/register)
  if (variant === "auth") {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 py-2 sm:py-4">
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
                  Lily Heart AI
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
  if (!family) {
    return (
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 sticky top-0 z-50 backdrop-blur-lg">
        <div className="px-4 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-3 text-white text-xl font-semibold"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <span style={{ fontFamily: "var(--font-poppins)" }}>
                Lily Heart AI
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
    <>
      <header
        className={`bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-10 relative`}
      >
        <div className="px-4 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Logo (mobile) or Welcome message (desktop) */}
            <div className="flex items-center space-x-3">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1
                    className="text-base font-bold text-gray-900 truncate"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Lily Heart AI
                  </h1>
                </div>
              </div>

              {/* Desktop Welcome Message */}
              <div className="lg:flex hidden items-center space-x-4">
                <div className="min-w-0">
                  <h1
                    className="text-lg font-semibold text-gray-900 truncate"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Welcome back, {family.parent_name}
                  </h1>
                  <p
                    className="text-sm text-gray-600 truncate"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    Let's check on your family's well-being
                  </p>
                </div>
              </div>
            </div>

            {/* Action items - right side */}
            <div className="flex items-center sm:space-x-2 md:space-x-3 lg:space-x-4">
              {/* Child Selector - hidden on mobile */}
              <div className="hidden sm:block">
                <ChildSelector
                  selectedChildId={selectedChildId}
                  onChildSelect={handleChildSelect}
                  onEditChild={handleEditChild}
                  onAddChild={handleAddChild}
                />
              </div>
              {/* Chat button - hidden on mobile */}
              <button
                onClick={() => setShowChatModeModal(true)}
                className="hidden sm:flex bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 items-center space-x-2 text-sm whitespace-nowrap shadow-lg hover:shadow-xl transform"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden xl:inline">Start Session</span>
                <span className="xl:hidden">Chat</span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden md:inline xl:inline">
                    {family.parent_name}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {family.parent_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {family.family_name}
                      </p>
                    </div>

                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        router.push("/account");
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Account & Billing</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowLogoutModal(true);
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile sidebar toggle button */}
              <div className="lg:hidden relative z-[60]">
                <button
                  onClick={onSidebarToggle}
                  className="p-2 rounded-lg bg-white"
                >
                  <Menu className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3 pt-4">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {family.parent_name}
                  </p>
                  <p className="text-gray-600">{family.family_name}</p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => router.push("/account")}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Account & Billing</span>
                </button>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

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

      <ChatModeModal
        isOpen={showChatModeModal}
        onClose={() => setShowChatModeModal(false)}
        childId={selectedChildId}
      />

      {/* Mobile child selector and chat button - outside header */}
      <div className="sm:hidden bg-gray-50/50 border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* Chat button */}
          <button
            onClick={() => setShowChatModeModal(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 text-sm whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat</span>
          </button>

          {/* Child selector */}
          <div>
            <ChildSelector
              selectedChildId={selectedChildId}
              onChildSelect={handleChildSelect}
              onEditChild={handleEditChild}
              onAddChild={handleAddChild}
            />
          </div>
        </div>
      </div>
    </>
  );
}
