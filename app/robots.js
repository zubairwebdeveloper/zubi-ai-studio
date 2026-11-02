import { siteConfig } from "@/config/site";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api", "/login", "/register", "/verify-email", "/forgot-password"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
