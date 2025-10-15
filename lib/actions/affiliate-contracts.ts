"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification, sendNotificationEmail } from "./notifications"

export async function createAffiliateContract(contractData: any) {
  const supabase = await createClient()

  try {
    // 1. Create or get user for client
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", contractData.client_email)
      .maybeSingle()

    let clientUserId = existingUser?.id

    if (!clientUserId) {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          email: contractData.client_email,
          full_name: contractData.client_name,
          phone: contractData.client_phone,
          role: "client",
        })
        .select()
        .single()

      if (userError) {
        console.error("Error creating user:", userError)
        return { success: false, error: "فشل في إنشاء حساب العميل" }
      }

      clientUserId = newUser.id
    }

    // 2. Generate contract number
    const contractNumber = `AFF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    // 3. Calculate remaining amount
    const remainingAmount = contractData.total_amount - contractData.deposit_amount

    // 4. Generate unique link token
    const linkToken = crypto.randomUUID()

    // 5. Create contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        contract_number: contractNumber,
        client_id: clientUserId,
        affiliate_id: contractData.affiliate_id,
        service_type: contractData.service_type,
        package_name: contractData.package_name,
        total_amount: contractData.total_amount,
        deposit_amount: contractData.deposit_amount,
        remaining_amount: remainingAmount,
        payment_method: contractData.payment_method,
        contract_terms: {
          terms: [
            "يلتزم الطرف الأول (روبوويب) بتنفيذ الخدمة المتفق عليها حسب المواصفات المحددة",
            "يلتزم الطرف الثاني (العميل) بدفع المبلغ المتفق عليه حسب الجدول الزمني",
            "مدة التنفيذ تبدأ من تاريخ استلام العربون",
            "أي تعديلات إضافية خارج نطاق العقد تخضع لتسعير منفصل",
            contractData.notes || "",
          ].filter(Boolean),
        },
        status: "draft",
        workflow_status: "pending_admin_signature",
        contract_link_token: linkToken,
      })
      .select()
      .single()

    if (contractError) {
      console.error("Error creating contract:", contractError)
      return { success: false, error: "فشل في إنشاء العقد" }
    }

    // 5. Create or update client profile
    // Check if client profile exists
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", clientUserId)
      .maybeSingle()

    if (existingClient) {
      // Update existing client
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          company_name: contractData.company_name,
        })
        .eq("user_id", clientUserId)

      if (updateError) {
        console.error("Error updating client profile:", updateError)
      }
    } else {
      // Create new client
      const { error: insertError } = await supabase
        .from("clients")
        .insert({
          user_id: clientUserId,
          company_name: contractData.company_name,
          onboarding_completed: false,
        })

      if (insertError) {
        console.error("Error creating client profile:", insertError)
      }
    }

    // 6. Send notification to client
    await createNotification({
      userId: clientUserId,
      title: "📄 عقد جديد بانتظار توقيعك",
      message: `تم إنشاء عقد جديد رقم ${contractNumber}\n\nالخدمة: ${contractData.service_type}\nالمبلغ: ${contractData.total_amount.toLocaleString("ar-SA")} ر.س\n\nيرجى مراجعة العقد والتوقيع عليه`,
      type: "contract",
      relatedId: contract.id,
      link: `/contract/${linkToken}`,
    })

    // Send email to client
    await sendNotificationEmail({
      to: contractData.client_email,
      subject: "عقد جديد بانتظار توقيعك",
      message: `مرحباً ${contractData.client_name}

تم إنشاء عقد جديد معك من شركة روبوويب

رقم العقد: ${contractNumber}
الخدمة: ${contractData.service_type}
المبلغ الإجمالي: ${contractData.total_amount.toLocaleString("ar-SA")} ر.س

يرجى مراجعة العقد والتوقيع عليه`,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contract/${linkToken}`,
    })

    // 7. Send notifications to all admins
    const { data: admins } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("role", "admin")

    if (admins && admins.length > 0) {
      const notificationPromises = admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: "📄 عقد جديد من شريك",
          message: `تم إنشاء عقد جديد رقم ${contractNumber} من قبل الشريك.\n\nالعميل: ${contractData.client_name}\nالخدمة: ${contractData.service_type}\nالمبلغ: ${contractData.total_amount.toLocaleString("ar-SA")} ر.س`,
          type: "contract",
          relatedId: contract.id,
          link: `/admin/contracts/${contract.id}`,
        })
      )

      const emailPromises = admins.map((admin) =>
        sendNotificationEmail({
          to: admin.email,
          subject: "📄 عقد جديد من شريك",
          message: `تم إنشاء عقد جديد رقم ${contractNumber} من قبل الشريك.\n\nالعميل: ${contractData.client_name}\nالخدمة: ${contractData.service_type}\nالمبلغ: ${contractData.total_amount.toLocaleString("ar-SA")} ر.س`,
          link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/contracts/${contract.id}`,
        })
      )

      await Promise.all([...notificationPromises, ...emailPromises])
    }

    // 8. Notify affiliate about successful contract creation
    await createNotification({
      userId: contractData.affiliate_id,
      title: "✅ تم إنشاء العقد بنجاح",
      message: `تم إنشاء العقد رقم ${contractNumber} بنجاح!\n\nالعميل: ${contractData.client_name}\nالخدمة: ${contractData.service_type}\n\nسيتم إشعارك عند توقيع العقد`,
      type: "contract",
      relatedId: contract.id,
      link: `/affiliate/contracts/${contract.id}`,
    })

    revalidatePath("/affiliate/contracts")
    revalidatePath("/admin/contracts")
    return { success: true, contractId: contract.id }
  } catch (error) {
    console.error("Error in createAffiliateContract:", error)
    return { success: false, error: "حدث خطأ غير متوقع" }
  }
}

export async function sendContractToClient(contractId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("contracts")
    .update({ status: "pending_signature" })
    .eq("id", contractId)

  if (error) {
    console.error("Error sending contract:", error)
    return { success: false, error: "فشل في إرسال العقد" }
  }

  // TODO: Send email to client with contract link

  revalidatePath("/affiliate/contracts")
  revalidatePath(`/affiliate/contracts/${contractId}`)
  return { success: true }
}

export async function getAffiliateContract(contractId: string, affiliateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contracts")
    .select(`
      *,
      client:users!contracts_client_id_fkey(full_name, email, phone),
      client_info:clients!contracts_client_id_fkey(company_name, industry)
    `)
    .eq("id", contractId)
    .eq("affiliate_id", affiliateId)
    .single()

  if (error) {
    console.error("Error fetching contract:", error)
    return null
  }

  return data
}
