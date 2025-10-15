"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: "contract" | "payment" | "project" | "message" | "system"
  relatedId?: string
  link?: string
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        related_id: params.relatedId,
        link: params.link,
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/notifications")
    revalidatePath("/affiliate/notifications")
    revalidatePath("/client/notifications")
    return { success: true, data }
  } catch (err) {
    console.error("Exception creating notification:", err)
    return { success: false, error: "فشل في إنشاء الإشعار" }
  }
}

export async function sendNotificationEmail(params: {
  to: string
  subject: string
  message: string
  link?: string
}) {
  try {
    const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    const { data, error } = await resend.emails.send({
      from: `Roboweb <${senderEmail}>`,
      to: [params.to],
      subject: params.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔔 Roboweb</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">إشعار جديد</p>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #1f2937; margin-top: 0;">${params.subject}</h2>
              <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap; margin: 20px 0;">
                ${params.message}
              </div>
              ${
                params.link
                  ? `
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${params.link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    عرض التفاصيل
                  </a>
                </div>
              `
                  : ""
              }
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 20px;">
              © ${new Date().getFullYear()} Roboweb. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      `,
      text: params.message,
    })

    if (error) {
      console.error("Error sending notification email:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    console.error("Exception sending notification email:", err)
    return { success: false, error: "فشل في إرسال البريد" }
  }
}

export async function notifyNewContract(contractData: {
  contractNumber: string
  clientName: string
  serviceType: string
  totalAmount: number
  adminEmails: string[]
}) {
  const supabase = await createClient()

  try {
    // Get all admin users
    const { data: admins } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("role", "admin")

    if (!admins || admins.length === 0) {
      return { success: false, error: "لا يوجد مسؤولين" }
    }

    const notificationTitle = "عقد جديد تم إنشاؤه"
    const notificationMessage = `تم إنشاء عقد جديد رقم ${contractData.contractNumber}\n\nالعميل: ${contractData.clientName}\nالخدمة: ${contractData.serviceType}\nالمبلغ: ${contractData.totalAmount.toLocaleString("ar-SA")} ر.س`

    // Create notifications for all admins
    const notificationPromises = admins.map((admin) =>
      createNotification({
        userId: admin.id,
        title: notificationTitle,
        message: notificationMessage,
        type: "contract",
        link: "/admin/contracts",
      })
    )

    await Promise.all(notificationPromises)

    // Send emails to all admins
    const emailPromises = admins.map((admin) =>
      sendNotificationEmail({
        to: admin.email,
        subject: `🎉 ${notificationTitle}`,
        message: notificationMessage,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/contracts`,
      })
    )

    await Promise.all(emailPromises)

    return { success: true, message: `تم إرسال ${admins.length} إشعار` }
  } catch (err) {
    console.error("Exception notifying new contract:", err)
    return { success: false, error: "فشل في إرسال الإشعارات" }
  }
}

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

export async function getUnreadCount() {
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
    .eq("read", false)

  if (error) {
    console.error("Error fetching unread count:", error)
    return 0
  }

  return count || 0
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/notifications")
  revalidatePath("/affiliate/notifications")
  revalidatePath("/client/notifications")
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) {
    console.error("Error marking all as read:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/notifications")
  revalidatePath("/affiliate/notifications")
  revalidatePath("/client/notifications")
  return { success: true }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting notification:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/notifications")
  revalidatePath("/affiliate/notifications")
  revalidatePath("/client/notifications")
  return { success: true }
}

// Delete all read notifications
export async function deleteAllRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id)
    .eq("read", true)

  if (error) {
    console.error("Error deleting read notifications:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/notifications")
  revalidatePath("/affiliate/notifications")
  revalidatePath("/client/notifications")
  return { success: true }
}
