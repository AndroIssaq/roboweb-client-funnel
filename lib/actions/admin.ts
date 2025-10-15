"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function checkAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false, error: "غير مصرح" }
  }

  // Check role from user metadata to avoid RLS infinite recursion
  const userRole = user.user_metadata?.role || "client"

  if (userRole !== "admin") {
    return { authorized: false, error: "غير مصرح - مطلوب صلاحيات المسؤول" }
  }

  return { authorized: true }
}

// Clients Management
export async function getAllClients() {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    console.error("Unauthorized access attempt")
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      contracts (count),
      projects (count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
    return []
  }

  return data || []
}

export async function updateClient(id: string, updates: any) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("clients").update(updates).eq("id", id)

  if (error) {
    console.error("Error updating client:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/clients")
  return { success: true }
}

export async function deleteClient(id: string) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error("Error deleting client:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/clients")
  return { success: true }
}

// Projects Management
export async function getAllProjects() {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    console.error("Unauthorized access attempt")
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select(`
      *,
      clients (
        id,
        company_name,
        user_id,
        industry,
        website_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }

  return data || []
}

export async function createProject(projectData: any) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.from("projects").insert(projectData).select().single()

  if (error) {
    console.error("Error creating project:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/projects")
  return { success: true, data }
}

export async function updateProject(id: string, updates: any) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("projects").update(updates).eq("id", id)

  if (error) {
    console.error("Error updating project:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/projects")
  revalidatePath(`/admin/projects/${id}`)
  return { success: true }
}

export async function deleteProject(id: string) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("projects").delete().eq("id", id)

  if (error) {
    console.error("Error deleting project:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/projects")
  return { success: true }
}

// Portfolio Management
export async function getAllPortfolioItems() {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    console.error("Unauthorized access attempt")
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio")
    .select(`
      *,
      projects (
        id,
        name,
        clients (
          company_name
        )
      )
    `)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching portfolio:", error)
    return []
  }

  return data || []
}

export async function createPortfolioItem(portfolioData: any) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.from("portfolio").insert(portfolioData).select().single()

  if (error) {
    console.error("Error creating portfolio item:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/portfolio")
  revalidatePath("/portfolio")
  return { success: true, data }
}

export async function updatePortfolioItem(id: string, updates: any) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("portfolio").update(updates).eq("id", id)

  if (error) {
    console.error("Error updating portfolio item:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/portfolio")
  revalidatePath("/portfolio")
  return { success: true }
}

export async function deletePortfolioItem(id: string) {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error }
  }

  const supabase = await createClient()

  const { error } = await supabase.from("portfolio").delete().eq("id", id)

  if (error) {
    console.error("Error deleting portfolio item:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/portfolio")
  revalidatePath("/portfolio")
  return { success: true }
}

// Dashboard Stats
export async function getDashboardStats() {
  const authCheck = await checkAdminAccess()
  if (!authCheck.authorized) {
    return {
      totalClients: 0,
      totalProjects: 0,
      activeProjects: 0,
      totalContracts: 0,
      publishedPortfolio: 0,
    }
  }

  const supabase = await createClient()

  const [clientsResult, projectsResult, contractsResult, portfolioResult] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("contracts").select("id", { count: "exact", head: true }),
    supabase.from("portfolio").select("id").eq("is_published", true),
  ])

  const activeProjects = await supabase.from("projects").select("id").in("status", ["in_progress", "review"])

  return {
    totalClients: clientsResult.count || 0,
    totalProjects: projectsResult.count || 0,
    activeProjects: activeProjects.data?.length || 0,
    totalContracts: contractsResult.count || 0,
    publishedPortfolio: portfolioResult.data?.length || 0,
  }
}
