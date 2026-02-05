"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { isUnauthorizedError } from "@/lib/api-client";

export function useAuthRedirect() {
  const router = useRouter();

  const handleAuthError = useCallback((error: unknown) => {
    if (isUnauthorizedError(error)) {
      // Redirect to login with current path
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = currentPath !== "/login" 
        ? `/login?from=${encodeURIComponent(currentPath)}`
        : "/login";
      router.push(loginUrl);
      return true;
    }
    return false;
  }, [router]);

  return { handleAuthError };
}
