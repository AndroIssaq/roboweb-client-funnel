"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NotificationItem } from "./notification-item"
import { Button } from "@/components/ui/button"
import { CheckCheck, Trash2, Bell } from "lucide-react"
import { markAllAsRead, deleteAllRead } from "@/lib/actions/notifications"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  link?: string
}

interface NotificationsListProps {
  initialNotifications: Notification[]
  userId: string
}

export function NotificationsList({ initialNotifications, userId }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [isDeletingAllRead, setIsDeletingAllRead] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel("notifications-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
            )
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    await markAllAsRead()
    // Realtime will handle the UI update
    setIsMarkingAllRead(false)
  }

  const handleDeleteAllRead = async () => {
    setIsDeletingAllRead(true)
    await deleteAllRead()
    // Realtime will handle the UI update
    setIsDeletingAllRead(false)
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const readCount = notifications.filter((n) => n.read).length

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between gap-2 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{unreadCount}</span> غير مقروء
            {readCount > 0 && (
              <>
                {" • "}
                <span className="font-semibold text-foreground">{readCount}</span> مقروء
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
              >
                <CheckCheck className="h-4 w-4 ml-2" />
                تعليم الكل كمقروء
              </Button>
            )}
            {readCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteAllRead}
                disabled={isDeletingAllRead}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                حذف المقروءة ({readCount})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </div>
  )
}
