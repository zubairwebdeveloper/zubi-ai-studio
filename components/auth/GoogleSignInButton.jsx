"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { loginWithGoogle } from "@/lib/firebase/auth";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      const user = await loginWithGoogle();

      // Get Firebase ID Token
      const idToken = await user.getIdToken(true);

      // Create server-side session
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Unable to create authentication session.");
      }

      // Redirect to Dashboard
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Google Login Error:", err);

      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Globe className="mr-2 h-4 w-4" />
        )}

        {loading ? "Signing in..." : "Continue with Google"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
