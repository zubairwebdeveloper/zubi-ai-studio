"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  ArrowUp,
  Mail,
  Heart,
  Zap,
  ShieldCheck,
  Globe,
  Send,
} from "lucide-react";

import { FaGithub, FaLinkedin, FaInstagram, FaXTwitter } from "react-icons/fa6";

import { useState } from "react";
import { siteConfig } from "@/config/site";

const socialLinks = [
  {
    label: "GitHub",
    href: "https://github.com/YOUR_USERNAME",
    icon: FaGithub,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/YOUR_USERNAME",
    icon: FaLinkedin,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/YOUR_USERNAME",
    icon: FaInstagram,
  },
  {
    label: "X",
    href: "https://x.com/YOUR_USERNAME",
    icon: FaXTwitter,
  },
];

const features = [
  {
    icon: Zap,
    title: "AI Powered",
    description: "Smart creative tools",
  },
  {
    icon: ShieldCheck,
    title: "Secure Platform",
    description: "Your data stays protected",
  },
  {
    icon: Globe,
    title: "Built for Everyone",
    description: "Create from anywhere",
  },
];

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const currentYear = new Date().getFullYear();

  const handleSubscribe = (e) => {
    e.preventDefault();

    if (!email.trim()) return;

    // Connect your newsletter API here.
    console.log("Newsletter subscription:", email);

    setEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative mt-28 w-full overflow-hidden border-t bg-background">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/[0.04] blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-sm"
          >
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <Sparkles className="h-6 w-6 transition-transform duration-500 group-hover:rotate-180" />
              </span>

              <span className="font-display text-xl font-bold tracking-tight">
                {siteConfig.name}
              </span>
            </Link>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              {siteConfig.tagline}
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Building the future with AI
            </div>

            {/* Social Links */}
            <div className="mt-7 flex flex-wrap gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;

                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -5, scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-colors duration-300 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Dynamic Footer Navigation */}
          {Object.entries(siteConfig.footer).map(([group, links], index) => (
            <motion.nav
              key={group}
              aria-label={group}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-sm font-bold tracking-wide">{group}</h3>

              <ul className="mt-6 space-y-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors duration-300 hover:text-primary"
                    >
                      <span className="relative">
                        {link.label}

                        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 ease-out group-hover:scale-x-100" />
                      </span>

                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          ))}
        </div>

        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur-xl sm:p-8"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Stay Connected
                </span>
              </div>

              <h3 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                Get the latest AI updates.
              </h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Discover new tools, features and creative possibilities.
              </p>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto"
            >
              <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border bg-background px-4 sm:min-w-[280px]">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email address"
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/20 active:translate-y-0"
              >
                Subscribe
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </motion.div>

        {/* Platform Features */}
        <div className="grid gap-5 border-b py-10 sm:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex items-center gap-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-card text-primary transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col items-center justify-between gap-5 py-7 text-center sm:flex-row sm:text-left">
          <p className="text-xs leading-6 text-muted-foreground">
            © {currentYear ?? "2026"} {siteConfig.name}. All rights reserved.
          </p>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Made with
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            for creators.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="group flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Back to top
            <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-1" />
          </button>
        </div>
      </div>
    </footer>
  );
}
