import { PageHeader } from "@/components/dashboard/page-header";
import { NotificationsList } from "@/components/dashboard/notifications-list";
import { requireUser } from "@/lib/auth/session";
import { listNotifications } from "@/lib/data/dashboard";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.uid);
  return (
    <>
      <PageHeader title="Notifications" />
      <NotificationsList items={items} />
    </>
  );
}
