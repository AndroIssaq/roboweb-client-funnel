"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import { deleteNotification, markAsRead } from "@/lib/actions/notifications"
import Link from "next/link"

interface NotificationItemProps {
  notification: {
    id: string
    title: string
    message: string
    type: string
    read: boolean
    created_at: string
    link?: string
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    await deleteNotification(notification.id)
    // Realtime will handle the UI update
    setIsDeleting(false)
  }

  const handleMarkAsRead = async () => {
    if (!notification.read) {
      await markAsRead(notification.id)
      // Realtime will handle the UI update
    }
  }

  const typeColors: Record<string, string> = {
    contract: "bg-blue-100 text-blue-800",
    payment: "bg-green-100 text-green-800",
    project: "bg-purple-100 text-purple-800",
    message: "bg-yellow-100 text-yellow-800",
    system: "bg-gray-100 text-gray-800",
    referral: "bg-pink-100 text-pink-800",
    deletion: "bg-red-100 text-red-800",
  }

  return (
    <Card className={notification.read ? "opacity-60" : "border-primary/50"}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${notification.read ? "bg-muted" : "bg-primary/10"}`}>
            <Bell className={`h-5 w-5 ${notification.read ? "text-muted-foreground" : "text-primary"}`} />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={typeColors[notification.type] || "bg-gray-100 text-gray-800"} variant="secondary">
                  {notification.type}
                </Badge>
                {!notification.read && (
                  <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full"></Badge>
                )}
              </div>
            </div>

            <p className="text-sm whitespace-pre-wrap">{notification.message}</p>

            <div className="flex items-center gap-2 pt-2">
              {notification.link && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  onClick={handleMarkAsRead}
                >
                  <Link href={notification.link}>
                    <ExternalLink className="h-4 w-4 ml-2" />
                    عرض التفاصيل
                  </Link>
                </Button>
              )}

              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                >
                  تعليم كمقروء
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 mr-auto"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                {isDeleting ? "جاري الحذف..." : "حذف"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
