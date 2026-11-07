"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { adminNav } from "@/config/admin-nav";
import { cn } from "@/lib/utils";

function Nav({ onNavigate }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {adminNav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
            className={cn("rounded-md px-3 py-2 text-sm", active ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            {item.label}
          </Link>
        );
      })}
      <Link href="/dashboard" className="mt-6 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">Back to dashboard</Link>
    </nav>
  );
}

export function AdminShell({ user, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:p-3">Skip to content</a>
      <aside className="hidden border-r bg-card p-4 md:sticky md:top-0 md:block md:h-screen">
        <p className="mb-6 flex items-center gap-2 px-3 font-display text-lg font-bold"><ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />Admin</p>
        <Nav />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 bg-card p-4">
            <Button variant="ghost" size="icon" className="mb-2 ml-auto flex" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></Button>
            <Nav onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
          <p className="hidden truncate text-sm text-muted-foreground md:block">{user.email} · {user.role}</p>
          <div className="flex items-center gap-1"><ThemeToggle /><LogoutButton /></div>
        </header>
        <main id="admin-main" className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
