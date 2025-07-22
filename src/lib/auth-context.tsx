"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Family {
  id: string;
  parent_name: string;
  family_name: string;
  parent_email: string;
  created_at?: string;
  subscription_plan?: string;
  subscription_status?: string;
  trial_ends_at?: string;
  children?: Array<{ 
    id: string; 
    name: string; 
    age: number; 
    current_concerns?: string; 
  }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  family: Family | null;
  selectedChildId: string;
  setSelectedChildId: (childId: string) => void;
  checkAuthentication: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const checkAuthentication = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        // Merge children into family object
        const familyWithChildren = {
          ...data.family,
          children: data.children || []
        };
        setFamily(familyWithChildren);
        setIsAuthenticated(true);

        // Auto-select first child if available and no child is selected
        if (data.children && data.children.length > 0 && !selectedChildId) {
          setSelectedChildId(data.children[0].id);
        }
      } else {
        setIsAuthenticated(false);
        setFamily(null);
        // Only redirect to register if user is on a protected route
        if (!pathname.startsWith("/auth/") && pathname !== "/" && pathname !== "/pricing" && pathname !== "/terms-of-use") {
          router.push("/auth/register");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setFamily(null);
      // Only redirect to register if user is on a protected route
      if (!pathname.startsWith("/auth/") && pathname !== "/" && pathname !== "/pricing" && pathname !== "/terms-of-use") {
        router.push("/auth/register");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      setFamily(null);
      setSelectedChildId("");
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    family,
    selectedChildId,
    setSelectedChildId,
    checkAuthentication,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 