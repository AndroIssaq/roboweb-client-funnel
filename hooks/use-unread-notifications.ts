"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function useUnreadNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Fetch initial count
    const fetchUnreadCount = async () => {
      console.log("📊 Fetching unread count for user:", userId)
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) {
        console.error("❌ Error fetching unread count:", error)
      } else {
        console.log("✅ Unread count:", count)
        setUnreadCount(count || 0)
      }
    }

    fetchUnreadCount()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🔔 Notification change received:", payload)
          // Refetch count when any change happens
          fetchUnreadCount()
        }
      )
      .subscribe((status) => {
        console.log("📡 Notifications subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return unreadCount
}
