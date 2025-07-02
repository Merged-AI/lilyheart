"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface SessionLockContextType {
  isSessionLocked: boolean;
  isUnlocking: boolean;
  lockSession: () => void;
  unlockSession: () => void;
  checkSessionLock: () => boolean;
}

const SessionLockContext = createContext<SessionLockContextType | undefined>(
  undefined
);

export function SessionLockProvider({ children }: { children: ReactNode }) {
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Check if session is locked on mount
  useEffect(() => {
    const locked = sessionStorage.getItem("sessionLocked") === "true";
    setIsSessionLocked(locked);
  }, []);

  const lockSession = () => {
    setIsSessionLocked(true);
    setIsUnlocking(false);
    sessionStorage.setItem("sessionLocked", "true");
  };

  const unlockSession = () => {
    setIsUnlocking(true);
    setIsSessionLocked(false);
    sessionStorage.removeItem("sessionLocked");

    // Reset unlocking flag after a short delay
    setTimeout(() => {
      setIsUnlocking(false);
    }, 1000);
  };

  const checkSessionLock = () => {
    return sessionStorage.getItem("sessionLocked") === "true";
  };

  // Prevent navigation when session is locked
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSessionLocked) {
        e.preventDefault();
        e.returnValue =
          "Session is locked. Please enter the parent PIN to continue.";
        return e.returnValue;
      }
    };

    // Prevent browser back/forward navigation when session is locked
    const handlePopState = (event: PopStateEvent) => {
      if (isSessionLocked) {
        event.preventDefault();
        // Push the current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Prevent keyboard shortcuts for navigation when session is locked
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionLocked) {
        // Prevent F5, Ctrl+R, Ctrl+Shift+R, Alt+Left, Alt+Right
        if (
          e.key === "F5" ||
          (e.ctrlKey && e.key === "r") ||
          (e.ctrlKey && e.shiftKey && e.key === "R") ||
          (e.altKey && e.key === "ArrowLeft") ||
          (e.altKey && e.key === "ArrowRight")
        ) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Prevent right-click context menu when session is locked
    const handleContextMenu = (e: MouseEvent) => {
      if (isSessionLocked) {
        e.preventDefault();
      }
    };

    if (isSessionLocked) {
      // Push current state to prevent back navigation
      window.history.pushState(null, "", window.location.href);
      
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("contextmenu", handleContextMenu);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isSessionLocked]);

  const value = {
    isSessionLocked,
    isUnlocking,
    lockSession,
    unlockSession,
    checkSessionLock,
  };

  return (
    <SessionLockContext.Provider value={value}>
      {children}
    </SessionLockContext.Provider>
  );
}

export function useSessionLock() {
  const context = useContext(SessionLockContext);
  if (context === undefined) {
    throw new Error("useSessionLock must be used within a SessionLockProvider");
  }
  return context;
}
