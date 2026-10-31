import { useState, useEffect, useCallback } from "react";
import { useFetcher, useNavigate } from "react-router";
import { Bell, Check, MessageCircle, Star, Users, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read: boolean;
  createdAt: string;
  fromUsername: string | null;
}

interface Props {
  initialUnreadCount?: number;
}

export function NotificationCenter({ initialUnreadCount = 0 }: Props) {
  const [isOpen,      setIsOpen]      = useState(false);
  const [filter,      setFilter]      = useState<"all" | "unread" | "read">("all");
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const navigate = useNavigate();

  // Real-time: increment badge on new notification
  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "new_notification") {
        setUnreadCount(prev => prev + 1);
      }
    };

    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={22} className="text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute -right-13 md:right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              <div className="flex gap-1">
                {(["all", "unread", "read"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      filter === f ? "bg-purple-100 text-purple-700 font-medium" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="max-h-105 overflow-y-auto">
              <NotificationList
                filter={filter}
                onRead={() => setUnreadCount(prev => Math.max(0, prev - 1))}
                onMarkAllRead={() => setUnreadCount(0)}
                onNavigate={() => setIsOpen(false)}
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => { navigate("/settings?tab=notifications"); setIsOpen(false); }}
                className="w-full text-center text-sm text-purple-600 font-medium hover:underline"
              >
                Notification Settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationList({
  filter,
  onRead,
  onMarkAllRead,
  onNavigate,
}: {
  filter: string;
  onRead: () => void;
  onMarkAllRead: () => void;
  onNavigate: () => void;
}) {
  const fetcher      = useFetcher<{ notifications: Notification[]; hasNextPage: boolean; unreadCount: number }>();
  const actionFetcher = useFetcher();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load when filter changes
  useEffect(() => {
    fetcher.load(`/api/notifications/index?filter=${filter}`);
  }, [filter]);

  // Sync fetcher data into state
  useEffect(() => {
    if (fetcher.data?.notifications) {
      setNotifications(fetcher.data.notifications);
    }
  }, [fetcher.data]);

  // Optimistic mark-read in local state
  const handleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    onRead();
    actionFetcher.submit(
      { intent: "mark_read", notificationId: id },
      { method: "POST", action: "/api/notifications/index" }
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onMarkAllRead();
    actionFetcher.submit(
      { intent: "mark_all_read" },
      { method: "POST", action: "/api/notifications/index" }
    );
  };

  if (fetcher.state === "loading" && notifications.length === 0) {
    return <div className="p-6 text-center text-sm text-slate-500">Loading...</div>;
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bell size={32} className="text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">No notifications</p>
      </div>
    );
  }

  const hasUnread = notifications.some(n => !n.read);

  return (
    <>
      {hasUnread && (
        <div className="px-3 py-2 border-b border-slate-100 flex justify-end">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-purple-600 font-medium hover:underline flex items-center gap-1"
          >
            <Check size={12} /> Mark all read
          </button>
        </div>
      )}
      {notifications.map(n => (
        <NotificationItem
          key={n.id}
          notification={n}
          onRead={() => handleRead(n.id)}
          onClick={onNavigate}
        />
      ))}
      {fetcher.data?.hasNextPage && (
        <button className="w-full py-3 text-sm text-purple-600 font-medium hover:bg-slate-50 border-t border-slate-100">
          Load more
        </button>
      )}
    </>
  );
}

const ICON_MAP: Record<string, React.ElementType> = {
  connection_request:  Users,
  connection_accepted: Check,
  activity_like:       Star,
  activity_comment:    MessageCircle,
  badge_earned:        Star,
  report_resolved:     Check,
  system_alert:        AlertCircle,
};

function NotificationItem({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: () => void;
  onClick: () => void;
}) {
  const Icon = ICON_MAP[notification.type] ?? Bell;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (!notification.read) onRead(); onClick(); }}
      onKeyDown={e => { if (e.key === "Enter") { if (!notification.read) onRead(); onClick(); } }}
      className={`flex gap-3 p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
        !notification.read ? "bg-purple-50/50" : ""
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        !notification.read ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500"
      }`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 leading-snug">
          {notification.fromUsername && (
            <span className="font-semibold">@{notification.fromUsername} </span>
          )}
          {notification.body}
        </p>
        <time className="text-xs text-slate-400 mt-0.5 block">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </time>
      </div>
      {!notification.read && (
        <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0" aria-hidden />
      )}
    </div>
  );
}