"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSessionLock } from "@/lib/session-lock-context";

export default function SessionLockGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSessionLocked, isUnlocking } = useSessionLock();
  const lastLockedState = useRef(isSessionLocked);

  useEffect(() => {
    // Don't redirect if we're in the process of unlocking
    if (isUnlocking) {
      return;
    }

    // Only redirect if session is locked and user is not on session lock page
    if (isSessionLocked && pathname !== "/session-lock") {
      router.push("/session-lock");
    }

    // Update the ref to track state changes
    lastLockedState.current = isSessionLocked;
  }, [pathname, isSessionLocked, isUnlocking, router]);

  // Don't render anything, this is just a guard
  return null;
}
