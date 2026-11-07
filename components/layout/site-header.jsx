"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Menu,
  X,
  Sparkles,
  ArrowRight,
  Zap,
  ChevronDown,
  LayoutDashboard,
  UserRound,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ModeToggle from "@/components/shared/ModeToggle";
import { useAuth } from "@/hooks/useAuth";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMenu = () => setOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = () => {
    const name = user?.displayName || user?.email || "User";

    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex min-h-9 flex-wrap items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-medium sm:text-sm">
          <Zap className="h-3.5 w-3.5" />

          <span>Welcome to Zubi AI Studio</span>

          <span className="hidden opacity-60 sm:inline">|</span>

          <Link
            href="/tools"
            className="inline-flex items-center gap-1 underline underline-offset-4 hover:opacity-80"
          >
            Explore AI Tools
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link
            href="/"
            onClick={closeMenu}
            className="group flex shrink-0 items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </span>

            <span className="flex flex-col">
              <span className="font-display text-lg font-bold leading-tight tracking-tight">
                {siteConfig.name}
              </span>

              <span className="text-[10px] font-medium tracking-wider text-muted-foreground">
                CREATE WITHOUT LIMITS
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 lg:flex"
          >
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative py-2 text-sm font-medium transition-colors duration-300 ${
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}

                <span
                  className={`absolute bottom-0 left-0 h-0.5 w-full origin-left rounded-full bg-primary transition-transform duration-300 ease-out ${
                    isActive(item.href)
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2 sm:flex">
            <ModeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex h-11 items-center gap-2 rounded-full px-2 hover:bg-muted"
                    />
                  }
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.photoURL || ""}
                      alt={user.displayName || "User"}
                    />

                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>

                  <span className="hidden max-w-28 truncate text-sm font-medium xl:block">
                    {user.displayName || user.email?.split("@")[0] || "Account"}
                  </span>

                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold">
                          {user.displayName || "Welcome"}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem render={<Link href="/dashboard" />}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      render={<Link href="/dashboard/profile" />}
                    >
                      <UserRound className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      render={<Link href="/dashboard/billing" />}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing & Credits
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      render={<Link href="/dashboard/settings" />}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Log in
                </Button>

                <Button
                  nativeButton={false}
                  render={<Link href="/register" />}
                  className="gap-2"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 sm:hidden">
            <ModeToggle />

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setOpen((previous) => !previous)}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {open && (
          <div
            id="mobile-navigation"
            className="border-t bg-background px-4 py-4 shadow-lg sm:hidden"
          >
            <nav className="container mx-auto flex flex-col gap-1">
              {siteConfig.nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`group relative rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="my-2 border-t" />

              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || ""} />

                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.displayName || "My Account"}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm hover:bg-muted"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>

                  <Link
                    href="/dashboard/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm hover:bg-muted"
                  >
                    <UserRound className="h-4 w-4" />
                    My Profile
                  </Link>

                  <Link
                    href="/dashboard/billing"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm hover:bg-muted"
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing & Credits
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    onClick={closeMenu}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm hover:bg-muted"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-2 w-full justify-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-muted"
                  >
                    Log in
                  </Link>

                  <Button
                    nativeButton={false}
                    render={<Link href="/register" onClick={closeMenu} />}
                    className="mt-1 w-full"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Your AI workspace. Create something amazing.
              </p>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

export default SiteHeader;
