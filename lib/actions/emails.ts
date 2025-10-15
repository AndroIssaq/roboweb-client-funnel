"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string[]
  subject: string
  message: string
  html?: string
}

export async function sendEmail(params: SendEmailParams) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  // Verify admin role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    return { success: false, error: "غير مصرح - للمسؤولين فقط" }
  }

  try {
    // Get sender info
    const { data: senderData } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single()

    const senderName = senderData?.full_name || "Roboweb"
    const senderEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    // Send emails using Resend
    const emailPromises = params.to.map(async (recipient) => {
      try {
        const { data, error } = await resend.emails.send({
          from: `${senderName} <${senderEmail}>`,
          to: [recipient],
          subject: params.subject,
          html: params.html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Roboweb</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h2 style="color: #1f2937; margin-top: 0;">${params.subject}</h2>
                  <div style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">
                    ${params.message}
                  </div>
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
          console.error(`Error sending to ${recipient}:`, error)
          return { recipient, status: "failed", error: error.message }
        }

        return { recipient, status: "sent", messageId: data?.id }
      } catch (err) {
        console.error(`Exception sending to ${recipient}:`, err)
        return { recipient, status: "failed", error: "خطأ في الإرسال" }
      }
    })

    const results = await Promise.all(emailPromises)

    // Store email logs in database
    const emailRecords = results.map(result => ({
      sender_id: user.id,
      recipient_email: result.recipient,
      subject: params.subject,
      message: params.message,
      html_content: params.html,
      status: result.status,
      sent_at: new Date().toISOString(),
    }))

    const { error: logError } = await supabase.from("email_logs").insert(emailRecords)

    if (logError) {
      console.error("Error logging emails:", logError)
    }

    // Count successful sends
    const successCount = results.filter(r => r.status === "sent").length
    const failCount = results.filter(r => r.status === "failed").length

    revalidatePath("/admin/emails")

    if (failCount === 0) {
      return { 
        success: true, 
        message: `تم إرسال ${successCount} بريد إلكتروني بنجاح! ✅` 
      }
    } else if (successCount === 0) {
      return { 
        success: false, 
        error: `فشل إرسال جميع الرسائل (${failCount})` 
      }
    } else {
      return { 
        success: true, 
        message: `تم إرسال ${successCount} بنجاح، فشل ${failCount}` 
      }
    }
  } catch (err) {
    console.error("Exception sending emails:", err)
    return { success: false, error: "حدث خطأ أثناء الإرسال" }
  }
}

export async function getEmailLogs() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching email logs:", error)
    return []
  }

  return data || []
}

export async function getAllUsers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Verify admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (userData?.role !== "admin") {
    return []
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, status")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data || []
}
