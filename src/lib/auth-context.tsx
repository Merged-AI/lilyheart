"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiGet, apiPost } from "./api";
import { setAuthToken, removeAuthToken, isAuthenticated as checkTokenExists } from "./auth-storage";

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
  hasPinSetup: boolean;
  selectedChildId: string;
  setSelectedChildId: (childId: string) => void;
  checkAuthentication: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [hasPinSetup, setHasPinSetup] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  const checkAuthentication = async () => {
    try {
      // First check if we have a token in localStorage
      if (!checkTokenExists()) {
        throw new Error("No auth token found");
      }

      const data = await apiGet<{
        family: Family;
        children: Array<{
          id: string;
          name: string;
          age: number;
          current_concerns?: string;
        }>;
        hasPinSetup: boolean;
      }>("auth/me");

      // Merge children into family object
      const familyWithChildren = {
        ...data.family,
        children: data.children || [],
      };
      setFamily(familyWithChildren);
      setHasPinSetup(data.hasPinSetup);
      setIsAuthenticated(true);

      // Check if PIN setup is required and redirect if needed
      if (!data.hasPinSetup && pathname !== "/pin-setup") {
        router.push("/pin-setup");
        return;
      }

      // Auto-select first child if available and no child is selected
      if (data.children && data.children.length > 0 && !selectedChildId) {
        setSelectedChildId(data.children[0].id);
      }
    } catch (error) {
      // Clear invalid token
      removeAuthToken();
      setIsAuthenticated(false);
      setFamily(null);
      setHasPinSetup(false);
      // Only redirect to register if user is on a protected route
      if (
        !pathname.startsWith("/auth/") &&
        pathname !== "/" &&
        pathname !== "/pricing" &&
        pathname !== "/terms-of-use"
      ) {
        router.push("/auth/register");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiPost<{
        success: boolean;
        family: Family;
        token: string;
        error?: string;
      }>("auth/login", { email, password });

      if (response.success && response.token) {
        // Store token in localStorage
        setAuthToken(response.token);
        
        // Update auth state
        setFamily(response.family);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: response.error || "Login failed" };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Login failed" 
      };
    }
  };

  const logout = async () => {
    try {
      await apiPost("auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear local state and token, even if API call fails
      removeAuthToken();
      setIsAuthenticated(false);
      setFamily(null);
      setHasPinSetup(false);
      setSelectedChildId("");
      router.push("/");
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    family,
    hasPinSetup,
    selectedChildId,
    setSelectedChildId,
    checkAuthentication,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
