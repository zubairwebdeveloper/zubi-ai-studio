"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  FolderKanban,
  Heart,
  History,
  Bell,
  Settings,
  Coins,
  KeyRound,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { dashboardNav, upcomingNav } from "@/config/dashboard-nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const icons = {
  LayoutDashboard,
  Compass,
  FolderKanban,
  Heart,
  History,
  Bell,
  Settings,
  Coins,
  KeyRound,
};

function Nav({ unread, onNavigate }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1">
      {dashboardNav.map((item) => {
        const Icon = icons[item.icon];
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
              active
                ? "bg-secondary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.label === "Notifications" && unread > 0 && (
              <span
                className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground"
                aria-label={`${unread} unread`}
              >
                {unread}
              </span>
            )}
          </Link>
        );
      })}
      <p className="mt-6 px-3 text-xs font-medium text-muted-foreground">
        Coming later
      </p>
      {upcomingNav.map((label) => (
        <span
          key={label}
          aria-disabled="true"
          className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/60"
        >
          {label}
          <span className="text-xs">Soon</span>
        </span>
      ))}
    </nav>
  );
}

export function DashboardShell({ user, unread, credits, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <a
        href="#dash-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <aside className="hidden border-r bg-card p-4 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 px-3 font-display text-lg font-bold"
        >
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          {siteConfig.name}
        </Link>
        <Nav unread={unread} />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-card p-4">
            <Button
              variant="ghost"
              size="icon"
              className="mb-2 self-end"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
            <Nav unread={unread} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="hidden truncate text-sm text-muted-foreground md:block">
            {user.name || user.email}
          </p>
          <div className="flex items-center gap-1">
            {credits !== null && credits !== undefined && (
              <Link
                href="/dashboard/credits"
                className="mr-1 rounded-full bg-credit/20 px-3 py-1 text-sm font-medium"
                aria-label={`${credits} credits available`}
              >
                {credits.toLocaleString()} credits
              </Link>
            )}
            <Button variant="ghost" size="icon" className="relative">
              <Link
                href="/dashboard/notifications"
                aria-label={
                  unread ? `Notifications, ${unread} unread` : "Notifications"
                }
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                )}
              </Link>
            </Button>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main id="dash-main" className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
