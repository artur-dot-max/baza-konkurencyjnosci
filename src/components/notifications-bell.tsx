"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeDate, truncateText } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications?: Notification[];
};

type NotificationsBellProps = {
  className?: string;
};

const POLL_INTERVAL_MS = 60_000;

export function NotificationsBell({ className }: NotificationsBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as NotificationsResponse;
      setNotifications(data.notifications ?? []);
    } catch {
      // ignore fetch errors (offline, unauthorized, etc.)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await fetch(`/api/notifications/${notification.id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n
        )
      );
    } catch {
      // continue navigation even if mark-read fails
    }

    if (notification.href) {
      router.push(notification.href);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (!res.ok) return;
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const ariaLabel =
    unreadCount > 0
      ? `Powiadomienia, ${unreadCount} nieprzeczytanych`
      : "Powiadomienia";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative text-white hover:bg-white/10 hover:text-white focus-visible:ring-white",
            className
          )}
          aria-label={ariaLabel}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B8DB8F] px-1 text-[10px] font-bold leading-none text-[#123F36]"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 py-3 text-[#145447]">
          Powiadomienia
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <ScrollArea className="max-h-80">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Ładowanie…
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Brak powiadomień
            </p>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "cursor-pointer flex-col items-start gap-0.5 px-4 py-3 focus:bg-[#F0F7F4]",
                    !notification.readAt && "bg-[#F0F7F4]/60"
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleNotificationClick(notification);
                  }}
                >
                  <span className="w-full text-sm font-medium text-[#145447] leading-snug">
                    {notification.title}
                  </span>
                  <span className="w-full text-xs text-muted-foreground leading-snug">
                    {truncateText(notification.body, 100)}
                  </span>
                  <span className="w-full text-xs text-muted-foreground/80">
                    {formatRelativeDate(notification.createdAt)}
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.some((n) => !n.readAt) && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-[#145447] hover:bg-[#F0F7F4] hover:text-[#0D4036]"
                disabled={markingAll}
                onClick={() => void handleMarkAllRead()}
              >
                Oznacz wszystkie jako przeczytane
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
