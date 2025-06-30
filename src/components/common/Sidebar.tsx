"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Home, MessageCircle, User, Menu, X, Lock } from "lucide-react";

interface SidebarProps {
  selectedChildId?: string;
}

export default function Sidebar({ selectedChildId }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Overview & Analytics",
    },
    {
      name: "Chat Sessions",
      href: selectedChildId ? `/chat?childId=${selectedChildId}` : "/chat",
      icon: MessageCircle,
      description: "Start therapy session",
    },
    {
      name: "Child Management",
      href: "/children",
      icon: User,
      description: "View & manage all children",
    },
    {
      name: "Session Lock",
      href: "/session-lock-management",
      icon: Lock,
      description: "Manage PIN",
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard" && pathname === "/dashboard") return true;
    if (href.includes("/chat") && pathname.includes("/chat")) return true;
    if (href.includes("/children") && pathname.includes("/children"))
      return true;
    if (href === "/session-lock-management" && pathname === "/session-lock-management")
      return true;
    return false;
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        >
          {isMobileOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white lg:border-r lg:border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo and brand */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3 min-w-0">
              <h1
                className="text-xl font-bold text-gray-900 truncate"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Heart Harbor
              </h1>
              <p
                className="text-xs text-gray-600 truncate"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Family Communication Coach
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? "text-purple-600"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{item.name}</div>
                    <div
                      className={`text-xs truncate ${
                        isActive ? "text-purple-600" : "text-gray-500"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
