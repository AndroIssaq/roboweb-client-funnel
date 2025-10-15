"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getClientProjects(clientId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("Unauthorized access attempt")
    return []
  }

  // Check if user is admin or the client themselves (using metadata to avoid RLS)
  const userRole = user.user_metadata?.role || "client"

  if (userRole !== "admin") {
    // If not admin, verify this is their client record
    const { data: clientData } = await supabase.from("clients").select("user_id").eq("id", clientId).single()

    if (!clientData || clientData.user_id !== user.id) {
      console.error("Unauthorized access to client projects")
      return []
    }
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      contract:contracts!projects_contract_id_fkey(contract_number, total_amount)
    `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching projects:", error)
    return []
  }

  return data
}

export async function getProjectById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      client:clients!projects_client_id_fkey(company_name, user:users(full_name, email)),
      contract:contracts!projects_contract_id_fkey(contract_number, total_amount)
    `,
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Error fetching project:", error)
    return null
  }

  return data
}

export async function updateProjectProgress(id: string, progress: number) {
  const supabase = await createClient()

  const { error } = await supabase.from("projects").update({ progress_percentage: progress }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating project progress:", error)
    return { error: "فشل في تحديث التقدم" }
  }

  revalidatePath("/client/dashboard")
  revalidatePath(`/client/project/${id}`)
  revalidatePath("/admin/projects")

  return { success: true }
}

export async function updateProjectStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("projects").update({ status }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating project status:", error)
    return { error: "فشل في تحديث الحالة" }
  }

  revalidatePath("/client/dashboard")
  revalidatePath(`/client/project/${id}`)
  revalidatePath("/admin/projects")

  return { success: true }
}
