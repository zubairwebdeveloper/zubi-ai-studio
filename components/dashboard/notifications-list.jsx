"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/page-header";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { formatDate } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";

export function NotificationsList({ items }) {
  const [list, setList] = useState(items);
  const [, start] = useTransition();
  const unread = list.filter((n) => !n.read).length;

  const readOne = (id) => {
    setList((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n)));
    start(async () => { await markNotificationRead(id); });
  };
  const readAll = () => {
    setList((l) => l.map((n) => ({ ...n, read: true })));
    start(async () => { await markAllNotificationsRead(); });
  };

  if (!list.length) return <EmptyState title="No notifications">Updates about your jobs, credits and account will show up here.</EmptyState>;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">{unread} unread</p>
        <Button size="sm" variant="outline" onClick={readAll} disabled={!unread}>Mark all as read</Button>
      </div>
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.id} className={cn("flex items-start justify-between gap-3 rounded-lg border p-4", n.read ? "bg-card" : "border-primary/40 bg-primary/5")}>
            <div>
              <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
            </div>
            {!n.read && <Button size="sm" variant="ghost" onClick={() => readOne(n.id)}>Mark as read</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
