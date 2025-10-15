"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { createNotification, sendNotificationEmail } from "./notifications"

interface SignContractParams {
  contractId: string
  signatureData: string
  role: "admin" | "client"
}

export async function signContract({ contractId, signatureData, role }: SignContractParams) {
  const supabase = await createClient()

  try {
    console.log("🔐 Starting signContract for role:", role, "contractId:", contractId)
    
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("❌ No user found")
      return { success: false, error: "غير مصرح" }
    }

    console.log("👤 User authenticated:", user.id)

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      console.error("❌ Contract not found:", contractError)
      return { success: false, error: "العقد غير موجود" }
    }

    console.log("📄 Contract found:", contract.contract_number)

    // Get client and affiliate separately
    let clientData = null
    let affiliateData = null

    if (contract.client_id) {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("id", contract.client_id)
        .single()
      clientData = data
    }

    if (contract.affiliate_id) {
      const { data } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("id", contract.affiliate_id)
        .single()
      affiliateData = data
    }

    const contractWithRelations = {
      ...contract,
      client: clientData,
      affiliate: affiliateData,
    }

    // Determine update fields and next workflow status
    let updateData: any = {}
    let nextWorkflowStatus = contract.workflow_status
    let notificationTitle = ""
    let notificationMessage = ""

    if (role === "admin") {
      // Admin signing
      updateData = {
        admin_signature_data: signatureData,
        admin_signature_date: new Date().toISOString(),
        admin_signed_by: user.id,
      }

      // If client already signed, contract is complete
      if (contract.client_signature_data) {
        nextWorkflowStatus = "completed"
        updateData.workflow_status = "completed"
        updateData.status = "active"
      } else {
        nextWorkflowStatus = "pending_client_signature"
        updateData.workflow_status = "pending_client_signature"
      }

      notificationTitle = "✅ تم توقيع العقد من المسؤول"
      notificationMessage = `تم توقيع العقد رقم ${contract.contract_number} من قبل المسؤول\n\n${
        nextWorkflowStatus === "completed"
          ? "✅ العقد مكتمل ونشط الآن"
          : "⏳ في انتظار توقيع العميل"
      }`
    } else {
      // Client signing
      updateData = {
        client_signature_data: signatureData,
        client_signature_date: new Date().toISOString(),
      }

      // If admin already signed, contract is complete
      if (contract.admin_signature_data) {
        nextWorkflowStatus = "completed"
        updateData.workflow_status = "completed"
        updateData.status = "active"
      } else {
        nextWorkflowStatus = "pending_admin_signature"
        updateData.workflow_status = "pending_admin_signature"
      }

      notificationTitle = "✅ تم توقيع العقد من العميل"
      notificationMessage = `تم توقيع العقد رقم ${contract.contract_number} من قبل العميل\n\n${
        nextWorkflowStatus === "completed"
          ? "✅ العقد مكتمل ونشط الآن"
          : "⏳ في انتظار توقيع المسؤول"
      }`
    }

    console.log("💾 Updating contract with data:", updateData)

    // Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", contractId)

    if (updateError) {
      console.error("❌ Error updating contract:", updateError)
      return { success: false, error: "فشل في تحديث العقد" }
    }

    console.log("✅ Contract updated successfully")

    // Send notifications to all parties
    const notificationPromises = []

    // Notify client
    if (contractWithRelations.client && role !== "client") {
      notificationPromises.push(
        createNotification({
          userId: contractWithRelations.client.id,
          title: notificationTitle,
          message:
            role === "admin"
              ? `تم توقيع العقد رقم ${contract.contract_number} من قبل المسؤول\n\n${
                  nextWorkflowStatus === "completed"
                    ? "✅ العقد مكتمل ونشط الآن"
                    : "⏳ الآن في انتظار توقيعك للعقد"
                }`
              : notificationMessage,
          type: "contract",
          relatedId: contractId,
          link: `/contract/${contract.contract_link_token}`,
        })
      )

      notificationPromises.push(
        sendNotificationEmail({
          to: contractWithRelations.client.email,
          subject: notificationTitle,
          message:
            role === "admin"
              ? `تم توقيع العقد رقم ${contract.contract_number} من قبل المسؤول\n\nالآن في انتظار توقيعك للعقد`
              : notificationMessage,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/contract/${contract.contract_link_token}`,
        })
      )
    }

    // Notify affiliate
    if (contractWithRelations.affiliate) {
      notificationPromises.push(
        createNotification({
          userId: contractWithRelations.affiliate.id,
          title: notificationTitle,
          message: notificationMessage,
          type: "contract",
          relatedId: contractId,
          link: `/affiliate/contracts/${contractId}`,
        })
      )

      notificationPromises.push(
        sendNotificationEmail({
          to: contractWithRelations.affiliate.email,
          subject: notificationTitle,
          message: notificationMessage,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/affiliate/contracts/${contractId}`,
        })
      )
    }

    // Notify all admins (except the one who signed)
    const { data: admins } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("role", "admin")
      .neq("id", role === "admin" ? user.id : "")

    if (admins && admins.length > 0) {
      admins.forEach((admin) => {
        notificationPromises.push(
          createNotification({
            userId: admin.id,
            title: notificationTitle,
            message: notificationMessage,
            type: "contract",
            relatedId: contractId,
            link: `/admin/contracts/${contractId}`,
          })
        )
      })
    }

    console.log("📧 Sending notifications...")
    await Promise.all(notificationPromises)
    console.log("✅ Notifications sent")

    // Revalidate paths
    revalidatePath(`/admin/contracts/${contractId}`)
    revalidatePath(`/affiliate/contracts/${contractId}`)
    revalidatePath(`/contract/${contract.contract_link_token}`)
    revalidatePath("/admin/contracts")
    revalidatePath("/affiliate/contracts")

    console.log("🎉 Sign contract completed successfully, workflow status:", nextWorkflowStatus)

    return {
      success: true,
      message: "تم التوقيع بنجاح",
      workflowStatus: nextWorkflowStatus,
    }
  } catch (err) {
    console.error("💥 Exception signing contract:", err)
    return { success: false, error: "فشل في التوقيع" }
  }
}

export async function getContractSignatureStatus(contractId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contracts")
    .select(
      `
      id,
      workflow_status,
      admin_signature_data,
      admin_signature_date,
      admin_signed_by,
      client_signature_data,
      client_signature_date,
      admin:users!contracts_admin_signed_by_fkey(full_name),
      client:users!contracts_client_id_fkey(full_name)
    `
    )
    .eq("id", contractId)
    .single()

  if (error) {
    console.error("Error fetching signature status:", error)
    return null
  }

  return data
}
