"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification, sendNotificationEmail } from "./notifications"

// Affiliate requests contract deletion
export async function requestContractDeletion(contractId: string, reason: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  // Verify affiliate role
  const { data: userData } = await supabase.from("users").select("role, full_name").eq("id", user.id).single()

  if (userData?.role !== "affiliate") {
    return { success: false, error: "غير مصرح - للشركاء فقط" }
  }

  try {
    // Get contract details
    const { data: contract } = await supabase
      .from("contracts")
      .select("contract_number, service_type, total_amount, client_id")
      .eq("id", contractId)
      .eq("affiliate_id", user.id)
      .maybeSingle()

    if (!contract) {
      return { success: false, error: "العقد غير موجود أو ليس لك" }
    }

    // Get client name separately
    let clientName = "غير معروف"
    if (contract.client_id) {
      const { data: clientData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", contract.client_id)
        .maybeSingle()
      
      if (clientData) {
        clientName = clientData.full_name
      }
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from("contract_deletion_requests")
      .select("id, status")
      .eq("contract_id", contractId)
      .eq("status", "pending")
      .maybeSingle()

    if (existingRequest) {
      return { success: false, error: "يوجد طلب حذف معلق بالفعل لهذا العقد" }
    }

    // Create deletion request
    const { error: requestError } = await supabase.from("contract_deletion_requests").insert({
      contract_id: contractId,
      requested_by: user.id,
      reason: reason,
      status: "pending",
    })

    if (requestError) {
      console.error("Error creating deletion request:", requestError)
      return { success: false, error: "فشل في إنشاء طلب الحذف" }
    }

    // Send notifications to all admins
    const { data: admins } = await supabase.from("users").select("id, email, full_name").eq("role", "admin")

    if (admins && admins.length > 0) {
      const notificationPromises = admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: "طلب حذف عقد",
          message: `طلب الشريك ${userData.full_name} حذف العقد رقم ${contract.contract_number}\n\nالسبب: ${reason}\n\nالعميل: ${clientName}\nالخدمة: ${contract.service_type}`,
          type: "contract",
          relatedId: contractId,
          link: `/admin/deletion-requests`,
        })
      )

      const emailPromises = admins.map((admin) =>
        sendNotificationEmail({
          to: admin.email,
          subject: "⚠️ طلب حذف عقد",
          message: `طلب الشريك ${userData.full_name} حذف العقد رقم ${contract.contract_number}\n\nالسبب: ${reason}\n\nالعميل: ${clientName}\nالخدمة: ${contract.service_type}\n\nيرجى مراجعة الطلب والموافقة أو الرفض.`,
          link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/deletion-requests`,
        })
      )

      await Promise.all([...notificationPromises, ...emailPromises])
    }

    revalidatePath(`/affiliate/contracts/${contractId}`)
    revalidatePath("/affiliate/contracts")

    return { success: true, message: "تم إرسال طلب الحذف للمسؤول" }
  } catch (err) {
    console.error("Exception requesting deletion:", err)
    return { success: false, error: "حدث خطأ أثناء إرسال الطلب" }
  }
}

// Admin approves or rejects deletion request
export async function reviewDeletionRequest(requestId: string, action: "approve" | "reject", notes?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  // Verify admin role
  const { data: userData } = await supabase.from("users").select("role, full_name").eq("id", user.id).single()

  if (userData?.role !== "admin") {
    return { success: false, error: "غير مصرح - للمسؤولين فقط" }
  }

  try {
    // Get deletion request details
    const { data: request } = await supabase
      .from("contract_deletion_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle()

    if (!request) {
      return { success: false, error: "الطلب غير موجود" }
    }

    if (request.status !== "pending") {
      return { success: false, error: "تم مراجعة هذا الطلب بالفعل" }
    }

    // Get contract details
    const { data: contractData } = await supabase
      .from("contracts")
      .select("contract_number, client_id")
      .eq("id", request.contract_id)
      .maybeSingle()

    // Get requester details
    const { data: requesterData } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", request.requested_by)
      .maybeSingle()

    if (!contractData || !requesterData) {
      return { success: false, error: "فشل في جلب تفاصيل الطلب" }
    }

    const newStatus = action === "approve" ? "approved" : "rejected"

    // Update request status
    const { error: updateError } = await supabase
      .from("contract_deletion_requests")
      .update({
        status: newStatus,
        reviewed_by: user.id,
        review_notes: notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (updateError) {
      console.error("Error updating deletion request:", updateError)
      return { success: false, error: "فشل في تحديث الطلب" }
    }

    // If approved, delete the contract
    if (action === "approve") {
      const { error: deleteError } = await supabase.from("contracts").delete().eq("id", request.contract_id)

      if (deleteError) {
        console.error("Error deleting contract:", deleteError)
        return { success: false, error: "فشل في حذف العقد" }
      }
    }

    // Notify the requester
    await createNotification({
      userId: request.requested_by,
      title: action === "approve" ? "تمت الموافقة على حذف العقد" : "تم رفض طلب حذف العقد",
      message:
        action === "approve"
          ? `تمت الموافقة على طلب حذف العقد رقم ${contractData.contract_number}\n\n${notes ? `ملاحظات: ${notes}` : ""}`
          : `تم رفض طلب حذف العقد رقم ${contractData.contract_number}\n\nالسبب: ${notes || "لم يتم تحديد سبب"}`,
      type: "contract",
      link: "/affiliate/contracts",
    })

    await sendNotificationEmail({
      to: requesterData.email,
      subject: action === "approve" ? "✅ تمت الموافقة على حذف العقد" : "❌ تم رفض طلب حذف العقد",
      message:
        action === "approve"
          ? `تمت الموافقة على طلب حذف العقد رقم ${contractData.contract_number}\n\n${notes ? `ملاحظات: ${notes}` : ""}`
          : `تم رفض طلب حذف العقد رقم ${contractData.contract_number}\n\nالسبب: ${notes || "لم يتم تحديد سبب"}`,
    })

    revalidatePath("/admin/deletion-requests")
    revalidatePath("/admin/contracts")

    return {
      success: true,
      message: action === "approve" ? "تم حذف العقد بنجاح" : "تم رفض الطلب",
    }
  } catch (err) {
    console.error("Exception reviewing deletion request:", err)
    return { success: false, error: "حدث خطأ أثناء المراجعة" }
  }
}

// Admin deletes contract directly (without request)
export async function deleteContractDirectly(contractId: string, reason: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  // Verify admin role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "admin") {
    return { success: false, error: "غير مصرح - للمسؤولين فقط" }
  }

  try {
    // Get contract details for logging
    const { data: contract } = await supabase
      .from("contracts")
      .select("contract_number, affiliate_id, client:users!contracts_client_id_fkey(full_name)")
      .eq("id", contractId)
      .single()

    if (!contract) {
      return { success: false, error: "العقد غير موجود" }
    }

    // Log the deletion in activities
    await supabase.from("contract_activities").insert({
      contract_id: contractId,
      user_id: user.id,
      activity_type: "deleted_by_admin",
      activity_data: {
        reason,
        deleted_at: new Date().toISOString(),
      },
    })

    // Delete the contract
    const { error: deleteError } = await supabase.from("contracts").delete().eq("id", contractId)

    if (deleteError) {
      console.error("Error deleting contract:", deleteError)
      return { success: false, error: "فشل في حذف العقد" }
    }

    // Notify affiliate if exists
    if (contract.affiliate_id) {
      await createNotification({
        userId: contract.affiliate_id,
        title: "تم حذف عقد",
        message: `تم حذف العقد رقم ${contract.contract_number} من قبل المسؤول\n\nالسبب: ${reason}`,
        type: "contract",
        link: "/affiliate/contracts",
      })
    }

    revalidatePath("/admin/contracts")
    return { success: true, message: "تم حذف العقد بنجاح" }
  } catch (err) {
    console.error("Exception deleting contract:", err)
    return { success: false, error: "حدث خطأ أثناء الحذف" }
  }
}

// Get all deletion requests (for admin)
export async function getDeletionRequests() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("contract_deletion_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching deletion requests:", error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  // Fetch related data separately for each request
  const enrichedData = await Promise.all(
    data.map(async (request) => {
      const enrichedRequest = { ...request }

      // Get contract info
      if (request.contract_id) {
        const { data: contractData } = await supabase
          .from("contracts")
          .select("contract_number, service_type, total_amount, client_id")
          .eq("id", request.contract_id)
          .maybeSingle()

        if (contractData) {
          // Get client info
          if (contractData.client_id) {
            const { data: clientData } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", contractData.client_id)
              .maybeSingle()

            enrichedRequest.contract = {
              ...contractData,
              client: clientData,
            }
          } else {
            enrichedRequest.contract = contractData
          }
        }
      }

      // Get requester info
      if (request.requested_by) {
        const { data: requesterData } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", request.requested_by)
          .maybeSingle()

        if (requesterData) {
          enrichedRequest.requester = requesterData
        }
      }

      // Get reviewer info
      if (request.reviewed_by) {
        const { data: reviewerData } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", request.reviewed_by)
          .maybeSingle()

        if (reviewerData) {
          enrichedRequest.reviewer = reviewerData
        }
      }

      return enrichedRequest
    })
  )

  return enrichedData
}

// Get deletion request status for a contract
export async function getContractDeletionStatus(contractId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from("contract_deletion_requests")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}
