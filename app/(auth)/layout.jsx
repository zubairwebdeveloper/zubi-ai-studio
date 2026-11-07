import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-xl font-bold"
        >
          <ShieldCheck className="h-7 w-7 text-primary" />
          Your App
        </Link>

        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Secure authentication powered by Firebase
        </p>
      </div>
    </main>
  );
}
