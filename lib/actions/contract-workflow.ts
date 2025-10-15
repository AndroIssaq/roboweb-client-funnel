"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification, sendNotificationEmail } from "./notifications"

// Get contract by ID with full details
export async function getContractById(contractId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .maybeSingle()

    if (error) {
      console.error("Error fetching contract:", error)
      return null
    }

    if (!data) {
      // Contract not found or deleted
      return null
    }

    // Get client info separately
    if (data.client_id) {
      const { data: clientData } = await supabase
        .from("users")
        .select("id, full_name, email, phone")
        .eq("id", data.client_id)
        .single()
      
      if (clientData) {
        data.client = clientData
      }
    }

    // Get affiliate info separately
    if (data.affiliate_id) {
      const { data: affiliateData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", data.affiliate_id)
        .single()
      
      if (affiliateData) {
        data.affiliate_user = affiliateData
      }
    }

    // Get admin signer info separately if exists
    if (data.admin_signed_by) {
      const { data: adminData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", data.admin_signed_by)
        .single()
      
      if (adminData) {
        data.admin_signer = adminData
      }
    }

    return data
  } catch (err) {
    console.error("Exception fetching contract:", err)
    return null
  }
}

// Get contract by link token (for client access)
export async function getContractByToken(token: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("contract_link_token", token)
      .maybeSingle()

    if (error) {
      console.error("Error fetching contract by token:", error)
      return null
    }

    if (!data) {
      // Contract not found or deleted
      return null
    }

    // Get client info separately
    if (data.client_id) {
      const { data: clientData } = await supabase
        .from("users")
        .select("id, full_name, email, phone")
        .eq("id", data.client_id)
        .single()
      
      if (clientData) {
        data.client = clientData
      }
    }

    // Get affiliate info separately
    if (data.affiliate_id) {
      const { data: affiliateData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", data.affiliate_id)
        .single()
      
      if (affiliateData) {
        data.affiliate_user = affiliateData
      }
    }

    // Get admin signer info separately if exists
    if (data.admin_signed_by) {
      const { data: adminData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", data.admin_signed_by)
        .single()
      
      if (adminData) {
        data.admin_signer = adminData
      }
    }

    return data
  } catch (err) {
    console.error("Exception fetching contract by token:", err)
    return null
  }
}

// Admin signs the contract
export async function signContractAsAdmin(contractId: string, signatureData: string) {
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
    // Get contract details
    const contract = await getContractById(contractId)
    if (!contract) {
      return { success: false, error: "العقد غير موجود" }
    }

    // Update contract with admin signature
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        admin_signature_data: signatureData,
        admin_signature_date: new Date().toISOString(),
        admin_signed_by: user.id,
        workflow_status: "pending_client_signature",
      })
      .eq("id", contractId)

    if (updateError) {
      console.error("Error updating contract:", updateError)
      return { success: false, error: "فشل في حفظ التوقيع" }
    }

    // Log activity
    await supabase.from("contract_activities").insert({
      contract_id: contractId,
      user_id: user.id,
      activity_type: "admin_signed",
      activity_data: {
        signed_by: userData.full_name,
        signed_at: new Date().toISOString(),
      },
    })

    // Send notification to client
    await createNotification({
      userId: contract.client_id,
      title: "عقدك جاهز للتوقيع",
      message: `تم توقيع العقد رقم ${contract.contract_number} من قبل Roboweb. يرجى مراجعة العقد والتوقيع عليه.`,
      type: "contract",
      relatedId: contractId,
      link: `/client/contracts/${contractId}`,
    })

    // Send email to client
    await sendNotificationEmail({
      to: contract.client.email,
      subject: "🎉 عقدك جاهز للتوقيع",
      message: `مرحباً ${contract.client.full_name},\n\nتم توقيع العقد رقم ${contract.contract_number} من قبل Roboweb.\n\nيرجى مراجعة العقد والتوقيع عليه لإتمام العملية.`,
      link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/client/contracts/${contractId}`,
    })

    revalidatePath(`/admin/contracts/${contractId}`)
    revalidatePath(`/client/contracts/${contractId}`)

    return { success: true, message: "تم التوقيع بنجاح! ✅" }
  } catch (err) {
    console.error("Exception signing contract:", err)
    return { success: false, error: "حدث خطأ أثناء التوقيع" }
  }
}

// Client signs the contract
export async function signContractAsClient(contractId: string, signatureData: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح" }
  }

  try {
    // Get contract details
    const contract = await getContractById(contractId)
    if (!contract) {
      return { success: false, error: "العقد غير موجود" }
    }

    // Verify user is the client
    if (contract.client_id !== user.id) {
      return { success: false, error: "غير مصرح - هذا العقد ليس لك" }
    }

    // Verify admin has signed first
    if (!contract.admin_signature_data) {
      return { success: false, error: "يجب أن يوقع المسؤول أولاً" }
    }

    // Update contract with client signature
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        client_signature_data: signatureData,
        client_signature_date: new Date().toISOString(),
        workflow_status: "completed",
        status: "signed",
      })
      .eq("id", contractId)

    if (updateError) {
      console.error("Error updating contract:", updateError)
      return { success: false, error: "فشل في حفظ التوقيع" }
    }

    // Generate PDF after both signatures are complete
    try {
      const { downloadContractPDF } = await import("@/lib/pdf/contract-template")
      const updatedContract = await getContractById(contractId)
      if (updatedContract) {
        // This will generate and store the PDF
        await downloadContractPDF(updatedContract)
      }
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError)
      // Don't fail the signing process if PDF generation fails
    }

    // Log activity
    await supabase.from("contract_activities").insert({
      contract_id: contractId,
      user_id: user.id,
      activity_type: "client_signed",
      activity_data: {
        signed_by: contract.client.full_name,
        signed_at: new Date().toISOString(),
      },
    })

    // Get all admins
    const { data: admins } = await supabase.from("users").select("id, email, full_name").eq("role", "admin")

    // Send notifications to all admins
    if (admins && admins.length > 0) {
      const notificationPromises = admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: "عقد تم توقيعه بالكامل",
          message: `تم توقيع العقد رقم ${contract.contract_number} من قبل العميل ${contract.client.full_name}. العقد مكتمل الآن! 🎉`,
          type: "contract",
          relatedId: contractId,
          link: `/admin/contracts/${contractId}`,
        })
      )

      const emailPromises = admins.map((admin) =>
        sendNotificationEmail({
          to: admin.email,
          subject: "🎉 عقد تم توقيعه بالكامل",
          message: `تم توقيع العقد رقم ${contract.contract_number} من قبل العميل ${contract.client.full_name}.\n\nالعقد مكتمل الآن ويمكنك تحميله من لوحة التحكم.`,
          link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/contracts/${contractId}`,
        })
      )

      await Promise.all([...notificationPromises, ...emailPromises])
    }

    // Notify affiliate if exists
    if (contract.affiliate_id) {
      await createNotification({
        userId: contract.affiliate_id,
        title: "🎉 عقد مكتمل من إحالتك!",
        message: `تم توقيع العقد رقم ${contract.contract_number} بالكامل!\n\nالعميل: ${contract.client.full_name}\nالخدمة: ${contract.service_type}\n\nمبروك! 🎊`,
        type: "contract",
        relatedId: contractId,
        link: `/affiliate/contracts/${contractId}`,
      })

      if (contract.affiliate_user?.email) {
        await sendNotificationEmail({
          to: contract.affiliate_user.email,
          subject: "🎉 عقد مكتمل من إحالتك!",
          message: `مبروك!\n\nتم توقيع العقد رقم ${contract.contract_number} بالكامل من قبل العميل.\n\nالعميل: ${contract.client.full_name}\nالخدمة: ${contract.service_type}`,
          link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/affiliate/contracts/${contractId}`,
        })
      }
    }

    revalidatePath(`/admin/contracts/${contractId}`)
    revalidatePath(`/client/contracts/${contractId}`)
    revalidatePath(`/affiliate/contracts/${contractId}`)

    return { success: true, message: "تم التوقيع بنجاح! 🎉 العقد مكتمل الآن." }
  } catch (err) {
    console.error("Exception signing contract:", err)
    return { success: false, error: "حدث خطأ أثناء التوقيع" }
  }
}

// Log contract view activity
export async function logContractView(contractId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  await supabase.from("contract_activities").insert({
    contract_id: contractId,
    user_id: user.id,
    activity_type: "viewed",
    activity_data: {
      viewed_at: new Date().toISOString(),
    },
  })
}

// Get contract activities
export async function getContractActivities(contractId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contract_activities")
    .select(
      `
      *,
      user:users(full_name, email, role)
    `
    )
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching activities:", error)
    return []
  }

  return data || []
}

// Cancel contract
export async function cancelContract(contractId: string, reason: string) {
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
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        workflow_status: "cancelled",
        status: "cancelled",
      })
      .eq("id", contractId)

    if (updateError) {
      return { success: false, error: "فشل في إلغاء العقد" }
    }

    // Log activity
    await supabase.from("contract_activities").insert({
      contract_id: contractId,
      user_id: user.id,
      activity_type: "cancelled",
      activity_data: {
        reason,
        cancelled_at: new Date().toISOString(),
      },
    })

    revalidatePath(`/admin/contracts/${contractId}`)
    return { success: true, message: "تم إلغاء العقد" }
  } catch (err) {
    console.error("Exception cancelling contract:", err)
    return { success: false, error: "حدث خطأ أثناء الإلغاء" }
  }
}

// Upload final PDF to Supabase Storage
export async function uploadContractPDF(contractId: string, pdfBlob: Blob) {
  const supabase = await createClient()

  try {
    const fileName = `contracts/${contractId}/final-contract.pdf`

    const { data, error } = await supabase.storage.from("documents").upload(fileName, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    })

    if (error) {
      console.error("Error uploading PDF:", error)
      return { success: false, error: "فشل في رفع الملف" }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(fileName)

    // Update contract with PDF URL
    await supabase
      .from("contracts")
      .update({
        final_pdf_url: publicUrl,
      })
      .eq("id", contractId)

    return { success: true, url: publicUrl }
  } catch (err) {
    console.error("Exception uploading PDF:", err)
    return { success: false, error: "حدث خطأ أثناء رفع الملف" }
  }
}
