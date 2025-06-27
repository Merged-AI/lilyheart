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

    if (isSessionLocked) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
