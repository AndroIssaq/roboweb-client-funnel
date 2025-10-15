"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createNotification, sendNotificationEmail } from "./notifications"

// Track affiliate referral when user clicks on affiliate link
export async function trackAffiliateReferral(affiliateCode: string) {
  try {
    const supabase = await createClient()

    // Get affiliate user by code
    const { data: affiliate } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("affiliate_code", affiliateCode)
      .eq("role", "affiliate")
      .single()

    if (!affiliate) {
      return { success: false, error: "Affiliate code not found" }
    }

    // Store affiliate code in cookie for 30 days
    const cookieStore = await cookies()
    cookieStore.set("affiliate_ref", affiliateCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    // Create notification for affiliate
    await createNotification({
      userId: affiliate.id,
      title: "🎯 زائر جديد من رابطك",
      message: `قام شخص بالدخول إلى الموقع من خلال رابط الإحالة الخاص بك`,
      type: "referral",
      link: "/affiliate/dashboard",
    })

    return { success: true, affiliateId: affiliate.id }
  } catch (error) {
    console.error("Error tracking affiliate referral:", error)
    return { success: false, error: "Failed to track referral" }
  }
}

// Get affiliate from cookie
export async function getAffiliateFromCookie() {
  try {
    const cookieStore = await cookies()
    const affiliateCode = cookieStore.get("affiliate_ref")?.value

    if (!affiliateCode) {
      return null
    }

    const supabase = await createClient()
    const { data: affiliate } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("affiliate_code", affiliateCode)
      .eq("role", "affiliate")
      .single()

    return affiliate
  } catch (error) {
    console.error("Error getting affiliate from cookie:", error)
    return null
  }
}

// Notify affiliate when their referral creates a contract
export async function notifyAffiliateOnContractCreation(
  affiliateId: string,
  contractNumber: string,
  clientName: string
) {
  try {
    const supabase = await createClient()

    // Get affiliate info
    const { data: affiliate } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", affiliateId)
      .single()

    if (!affiliate) return

    // Create notification
    await createNotification({
      userId: affiliateId,
      title: "🎉 عقد جديد من إحالتك!",
      message: `تم إنشاء عقد جديد رقم ${contractNumber} من خلال إحالتك\n\nالعميل: ${clientName}`,
      type: "contract",
      link: "/affiliate/contracts",
    })

    // Send email
    await sendNotificationEmail(
      affiliate.email,
      "عقد جديد من إحالتك",
      `
        <div dir="rtl" style="font-family: Arial, sans-serif;">
          <h2>🎉 مبروك!</h2>
          <p>تم إنشاء عقد جديد من خلال إحالتك</p>
          <p><strong>رقم العقد:</strong> ${contractNumber}</p>
          <p><strong>العميل:</strong> ${clientName}</p>
          <p>يمكنك متابعة العقد من لوحة التحكم الخاصة بك.</p>
        </div>
      `
    )

    return { success: true }
  } catch (error) {
    console.error("Error notifying affiliate:", error)
    return { success: false }
  }
}
