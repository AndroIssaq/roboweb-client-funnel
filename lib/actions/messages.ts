"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function sendMessage(data: {
  receiverId: string
  subject?: string
  message: string
  relatedContractId?: string
  relatedProjectId?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  // Verify receiver exists in public.users
  const { data: receiver, error: receiverError } = await supabase
    .from("users")
    .select("id")
    .eq("id", data.receiverId)
    .single()

  if (receiverError || !receiver) {
    console.error("Receiver not found:", data.receiverId, receiverError)
    return { success: false, error: "المستلم غير موجود في النظام" }
  }

  // Verify sender exists in public.users
  const { data: sender, error: senderError } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single()

  if (senderError || !sender) {
    console.error("Sender not found:", user.id, senderError)
    return { success: false, error: "حسابك غير مكتمل في النظام" }
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: data.receiverId,
    subject: data.subject,
    message: data.message,
    related_contract_id: data.relatedContractId,
    related_project_id: data.relatedProjectId,
  })

  if (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "فشل في إرسال الرسالة: " + error.message }
  }

  revalidatePath("/messages")
  return { success: true }
}

export async function getMessages() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching messages:", error)
      return []
    }

    // Get sender and receiver info separately
    if (data && data.length > 0) {
      const userIds = [...new Set(data.flatMap(m => [m.sender_id, m.receiver_id]))]
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", userIds)

      const userMap = new Map(users?.map(u => [u.id, u]) || [])

      return data.map(msg => ({
        ...msg,
        sender: userMap.get(msg.sender_id),
        receiver: userMap.get(msg.receiver_id),
      }))
    }

    return data || []
  } catch (err) {
    console.error("Exception fetching messages:", err)
    return []
  }
}

export async function getConversation(otherUserId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching conversation:", error)
      return []
    }

    // Get sender and receiver info
    if (data && data.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", [user.id, otherUserId])

      const userMap = new Map(users?.map(u => [u.id, u]) || [])

      return data.map(msg => ({
        ...msg,
        sender: userMap.get(msg.sender_id),
        receiver: userMap.get(msg.receiver_id),
      }))
    }

    return data || []
  } catch (err) {
    console.error("Exception fetching conversation:", err)
    return []
  }
}

export async function markMessageAsRead(messageId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("receiver_id", user.id)

  if (error) {
    console.error("Error marking message as read:", error)
    return { success: false, error: "فشل في تحديث الرسالة" }
  }

  revalidatePath("/messages")
  return { success: true }
}

export async function getUnreadMessagesCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("Error fetching unread count:", error)
    return 0
  }

  return count || 0
}

// Notifications
export async function getNotifications() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Error fetching notifications:", error)
    return []
  }

  return data || []
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: "فشل في تحديث الإشعار" }
  }

  revalidatePath("/notifications")
  return { success: true }
}

export async function getUnreadNotificationsCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("Error fetching unread notifications count:", error)
    return 0
  }

  return count || 0
}
