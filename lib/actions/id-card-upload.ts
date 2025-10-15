"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadIdCard(
  contractId: string,
  userRole: "admin" | "client",
  fileData: string, // base64
  fileName: string
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "غير مصرح" }
    }

    // Convert base64 to buffer
    const base64Data = fileData.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    // Upload to storage
    const fileExt = fileName.split(".").pop()
    const storagePath = `${user.id}/${contractId}-${userRole}-${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("id-cards")
      .upload(storagePath, buffer, {
        contentType: `image/${fileExt}`,
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("id-cards").getPublicUrl(storagePath)

    // Update contract
    const updateField = userRole === "admin" ? "admin_id_card_url" : "client_id_card_url"
    const updateDateField =
      userRole === "admin" ? "admin_id_card_uploaded_at" : "client_id_card_uploaded_at"

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        [updateField]: publicUrl,
        [updateDateField]: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      console.error("Update error:", updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath(`/admin/contracts/${contractId}`)
    revalidatePath(`/contract/*`)

    return { success: true, url: publicUrl }
  } catch (error: any) {
    console.error("Error uploading ID card:", error)
    return { success: false, error: error.message }
  }
}

export async function getContractIdCards(contractId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("contracts")
      .select("admin_id_card_url, client_id_card_url, admin_id_card_uploaded_at, client_id_card_uploaded_at")
      .eq("id", contractId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
