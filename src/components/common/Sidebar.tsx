"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Lock } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Overview & Analytics",
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
    if (href.includes("/chat-sessions") && pathname.includes("/chat-sessions"))
      return true;
    if (
      href.includes("/chat") &&
      pathname.includes("/chat") &&
      !pathname.includes("/chat-sessions")
    )
      return true;
    if (href.includes("/children") && pathname.includes("/children"))
      return true;
    if (
      href === "/session-lock-management" &&
      pathname === "/session-lock-management"
    )
      return true;
    return false;
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={onClose}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 z-50 bg-white border-r border-gray-200 h-full
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:block`}
      >
        <div className="flex flex-col flex-grow pt-4 pb-4">
          {/* Logo and brand */}
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center justify-center">
              <Image
                src="/images/LilyHeart-Logo-FullColor-01.svg"
                alt="Lily Heart AI Logo"
                width={150}
                height={50}
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-2 flex-1 px-4 space-y-2 overflow-y-auto">
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
                  onClick={onClose}
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
