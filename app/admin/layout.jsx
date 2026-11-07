import { requireRole } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = { robots: { index: false, follow: false } };

// ADMIN or SUPER_ADMIN only. Everyone else sees a 404. Each page and action also checks its own permission.
export default async function AdminLayout({ children }) {
  const user = await requireRole("ADMIN");
  return <AdminShell user={{ email: user.email, role: user.role }}>{children}</AdminShell>;
}
