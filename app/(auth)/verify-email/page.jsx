"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  logoutUser,
  refreshCurrentUser,
  resendVerificationEmail,
} from "@/lib/firebase/auth";

import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleResend() {
    setLoading(true);
    setMessage("");

    try {
      await resendVerificationEmail();
      setMessage("Verification email sent. Check your inbox.");
    } catch (error) {
      setMessage(
        error.code === "auth/too-many-requests"
          ? "Please wait before requesting another email."
          : error.message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck() {
    setLoading(true);

    try {
      const refreshedUser = await refreshCurrentUser();

      if (refreshedUser?.emailVerified) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setMessage("Your email is not verified yet.");
      }
    } catch {
      setMessage("Unable to check verification status.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  return (
    <div className="space-y-5 text-center">
      <MailCheck className="mx-auto h-14 w-14 text-primary" />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to:
        </p>
        <p className="font-medium break-all">{user?.email}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        Open the email, click the verification link, then come back here.
      </p>

      {message && <p className="text-sm text-primary">{message}</p>}

      <div className="space-y-3">
        <Button className="w-full" onClick={handleCheck} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          I&apos;ve verified my email
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={loading}
        >
          Resend verification email
        </Button>

        <Button variant="ghost" className="w-full" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
