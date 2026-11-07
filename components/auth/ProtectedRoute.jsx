"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  const { user, loading, profile, profileError } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!user.emailVerified) {
      router.replace("/verify-email");
      return;
    }
  }, [user, loading, router]);

  // Authentication loading
  if (loading) {
    return <LoadingScreen />;
  }

  // User not authenticated
  if (!user) {
    return <LoadingScreen />;
  }

  // Email not verified
  if (!user.emailVerified) {
    return <LoadingScreen />;
  }

  // Profile loading or unavailable
  if (!profile && !profileError) {
    return <LoadingScreen />;
  }

  // Profile error
  if (profileError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="text-lg font-semibold">Unable to load your profile</h2>

        <p className="text-sm text-muted-foreground">
          Please refresh the page or try again.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  return children;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
