"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { notifyNewContract } from "./notifications"

export interface ContractFormData {
  clientName: string
  clientCompany: string
  clientEmail: string
  clientPhone: string
  serviceType: string
  packageName: string
  serviceDescription: string
  timeline: string
  deliverables: string[]
  totalAmount: string
  depositAmount: string
  paymentMethod: string
  paymentSchedule: string[]
  additionalNotes: string
  affiliateCode?: string
}

export async function createContract(formData: ContractFormData, signatureData?: string) {
  const supabase = await createClient()

  // Get current user (admin)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "غير مصرح" }
  }

  try {
    // Generate contract number
    const year = new Date().getFullYear()
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
    const contractNumber = `RW-${year}-${random}`

    // Create or get client user
    let clientUserId: string

    // First, check if user exists in public.users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", formData.clientEmail)
      .single()

    if (existingUser) {
      clientUserId = existingUser.id
    } else {
      // Create new user record in public.users table
      // Note: The actual auth user should be created when they first sign up
      // For now, we just create a placeholder in users table
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: formData.clientEmail,
          full_name: formData.clientName,
          phone: formData.clientPhone,
          role: "client",
          company_name: formData.clientCompany || null,
        })
        .select()
        .single()

      if (userError) {
        console.error("[v0] Error creating user:", userError)
        throw new Error("فشل في إنشاء حساب العميل")
      }

      clientUserId = newUser.id
    }

    let affiliateId: string | null = null
    if (formData.affiliateCode) {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("user_id")
        .eq("referral_code", formData.affiliateCode)
        .single()

      if (affiliate) {
        affiliateId = affiliate.user_id
      }
    }

    // Generate unique link token
    const linkToken = crypto.randomUUID()

    // Create contract
    const remainingAmount = Number(formData.totalAmount) - Number(formData.depositAmount)

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        contract_number: contractNumber,
        client_id: clientUserId,
        affiliate_id: affiliateId,
        service_type: formData.serviceType,
        package_name: formData.packageName,
        service_description: formData.serviceDescription || null,
        timeline: formData.timeline || null,
        deliverables: formData.deliverables.filter(d => d.trim() !== ""),
        total_amount: Number(formData.totalAmount),
        deposit_amount: Number(formData.depositAmount),
        remaining_amount: remainingAmount,
        payment_method: formData.paymentMethod,
        payment_schedule: formData.paymentSchedule.filter(p => p.trim() !== ""),
        contract_terms: {
          service: {
            type: formData.serviceType,
            package_name: formData.packageName,
            description: formData.serviceDescription || "",
            timeline: formData.timeline || "",
            deliverables: formData.deliverables.filter(d => d.trim() !== ""),
          },
          payment: {
            total_amount: Number(formData.totalAmount),
            deposit_amount: Number(formData.depositAmount),
            remaining_amount: remainingAmount,
            payment_method: formData.paymentMethod,
            payment_schedule: formData.paymentSchedule.filter(p => p.trim() !== ""),
          },
          terms: [
            "يلتزم الطرف الأول (روبوويب) بتقديم الخدمة المتفق عليها وفقاً للمواصفات المحددة",
            "يلتزم الطرف الثاني (العميل) بدفع المبالغ المستحقة في المواعيد المحددة",
            "مدة التسليم المتوقعة: 30 يوم عمل من تاريخ استلام جميع المتطلبات",
            "يحق للعميل طلب 3 مراجعات مجانية على التصميم النهائي",
            "يتم تقديم دعم فني مجاني لمدة 6 أشهر بعد التسليم",
            "في حالة إلغاء العقد، لا يسترد العربون المدفوع",
            "جميع حقوق الملكية الفكرية تنتقل للعميل بعد سداد كامل المبلغ",
          ],
          notes: formData.additionalNotes,
          custom_terms: [],
        },
        signature_data: signatureData,
        signature_date: signatureData ? new Date().toISOString() : null,
        status: signatureData ? "signed" : "pending_signature",
        workflow_status: "pending_admin_signature",
        contract_link_token: linkToken,
      })
      .select()
      .single()

    if (contractError) throw contractError

    // Create or update client profile
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", clientUserId)
      .maybeSingle()

    if (!existingClient) {
      // Create new client profile only if doesn't exist
      await supabase
        .from("clients")
        .insert({
          user_id: clientUserId,
          onboarding_completed: false,
        })
    }

    if (affiliateId) {
      await supabase.rpc("increment_affiliate_referrals", { affiliate_id: affiliateId })
    }

    // Send notifications to all admins
    await notifyNewContract({
      contractNumber,
      clientName: formData.clientName,
      serviceType: formData.serviceType,
      totalAmount: Number(formData.totalAmount),
      adminEmails: [],
    })

    // Notify client about new contract
    const { createNotification, sendNotificationEmail } = await import("./notifications")
    await createNotification({
      userId: clientUserId,
      title: "📄 عقد جديد بانتظار توقيعك",
      message: `تم إنشاء عقد جديد رقم ${contractNumber}\n\nالخدمة: ${formData.serviceType}\nالمبلغ: ${Number(formData.totalAmount).toLocaleString("ar-SA")} ر.س\n\nيرجى مراجعة العقد والتوقيع عليه`,
      type: "contract",
      link: `/contract/${linkToken}`,
    })

    // Send email to client
    await sendNotificationEmail({
      to: formData.clientEmail,
      subject: "عقد جديد بانتظار توقيعك",
      message: `مرحباً ${formData.clientName}

تم إنشاء عقد جديد معك من شركة روبوويب

رقم العقد: ${contractNumber}
الخدمة: ${formData.serviceType}
المبلغ الإجمالي: ${Number(formData.totalAmount).toLocaleString("ar-SA")} ر.س

يرجى مراجعة العقد والتوقيع عليه`,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/contract/${linkToken}`,
    })

    // Notify affiliate if exists
    if (affiliateId) {
      const { notifyAffiliateOnContractCreation } = await import("./affiliate-tracking")
      await notifyAffiliateOnContractCreation(affiliateId, contractNumber, formData.clientName)
    }

    revalidatePath("/admin/contracts")
    return { success: true, contractId: contract.id, contractNumber }
  } catch (error) {
    console.error("[v0] Error creating contract:", error)
    return { error: "فشل في إنشاء العقد" }
  }
}

export async function getContracts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contracts")
    .select(
      `
      *,
      client:users!contracts_client_id_fkey(full_name, email, phone),
      affiliate_user:users!contracts_affiliate_id_fkey(full_name, email)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching contracts:", error)
    return []
  }

  return data
}

export async function getContractById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contracts")
    .select(
      `
      *,
      client:users!contracts_client_id_fkey(full_name, email, phone),
      affiliate_user:users!contracts_affiliate_id_fkey(full_name, email)
    `,
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Error fetching contract:", error)
    return null
  }

  return data
}

export async function updateContractStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("contracts").update({ status }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating contract status:", error)
    return { error: "فشل في تحديث حالة العقد" }
  }

  revalidatePath("/admin/contracts")
  revalidatePath(`/admin/contracts/${id}`)
  return { success: true }
}
