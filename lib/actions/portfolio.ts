"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ==================== NEW PORTFOLIO PROJECTS ====================

export async function getAllPortfolioProjects() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching portfolio projects:", error)
    return []
  }

  return data || []
}

export async function getPublishedPortfolioProjects() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching published projects:", error)
    return []
  }

  return data || []
}

export async function getPortfolioProjectBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error) {
    console.error("Error fetching project:", error)
    return null
  }

  // Increment views
  if (data) {
    await supabase
      .from("portfolio_projects")
      .update({ views: (data.views || 0) + 1 })
      .eq("id", data.id)
  }

  return data
}

export async function getPortfolioProjectById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching project:", error)
    return null
  }

  return data
}

export async function createPortfolioProject(formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const titleEn = formData.get("title_en") as string
  const slug = formData.get("slug") as string
  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const clientName = formData.get("client_name") as string
  const year = parseInt(formData.get("year") as string)
  const thumbnailUrl = formData.get("thumbnail_url") as string
  const technologies = (formData.get("technologies") as string)?.split(",").map(t => t.trim()) || []
  const features = (formData.get("features") as string)?.split("\n").filter(f => f.trim()) || []
  const color = formData.get("color") as string
  const liveUrl = formData.get("live_url") as string
  const githubUrl = formData.get("github_url") as string
  const featured = formData.get("featured") === "on"
  const status = formData.get("status") as string

  const { data, error } = await supabase
    .from("portfolio_projects")
    .insert({
      title,
      title_en: titleEn,
      slug,
      category,
      description,
      client_name: clientName,
      year,
      thumbnail_url: thumbnailUrl,
      technologies,
      features,
      color,
      live_url: liveUrl || null,
      github_url: githubUrl || null,
      featured,
      status,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating project:", error)
    throw new Error("فشل إنشاء المشروع")
  }

  revalidatePath("/admin/portfolio")
  revalidatePath("/portfolio")
  redirect("/admin/portfolio")
}

export async function updatePortfolioProject(id: string, formData: FormData) {
  const supabase = await createClient()

  const title = formData.get("title") as string
  const titleEn = formData.get("title_en") as string
  const slug = formData.get("slug") as string
  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const clientName = formData.get("client_name") as string
  const year = parseInt(formData.get("year") as string)
  const thumbnailUrl = formData.get("thumbnail_url") as string
  const technologies = (formData.get("technologies") as string)?.split(",").map(t => t.trim()) || []
  const features = (formData.get("features") as string)?.split("\n").filter(f => f.trim()) || []
  const color = formData.get("color") as string
  const liveUrl = formData.get("live_url") as string
  const githubUrl = formData.get("github_url") as string
  const featured = formData.get("featured") === "on"
  const status = formData.get("status") as string

  const { data, error } = await supabase
    .from("portfolio_projects")
    .update({
      title,
      title_en: titleEn,
      slug,
      category,
      description,
      client_name: clientName,
      year,
      thumbnail_url: thumbnailUrl,
      technologies,
      features,
      color,
      live_url: liveUrl || null,
      github_url: githubUrl || null,
      featured,
      status,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating project:", error)
    throw new Error("فشل تحديث المشروع")
  }

  revalidatePath("/admin/portfolio")
  revalidatePath("/portfolio")
  revalidatePath(`/portfolio/${slug}`)
  redirect("/admin/portfolio")
}

export async function deletePortfolioProject(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("portfolio_projects")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting project:", error)
    throw new Error("فشل حذف المشروع")
  }

  revalidatePath("/admin/portfolio")
  revalidatePath("/portfolio")
}

export async function toggleProjectStatus(id: string, currentStatus: string) {
  const supabase = await createClient()

  const newStatus = currentStatus === "published" ? "draft" : "published"

  const { error } = await supabase
    .from("portfolio_projects")
    .update({ status: newStatus })
    .eq("id", id)

  if (error) {
    console.error("Error toggling status:", error)
    throw new Error("فشل تغيير الحالة")
  }

  revalidatePath("/admin/portfolio")
  revalidatePath("/portfolio")
}

// ==================== OLD PORTFOLIO (Legacy) ====================

export async function getPublishedPortfolioItems() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio")
    .select(`
      *,
      projects (
        id,
        name,
        description,
        status,
        start_date,
        end_date,
        clients (
          company_name
        )
      )
    `)
    .eq("is_published", true)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching portfolio:", error)
    return []
  }

  return data || []
}

export async function getPortfolioItemBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolio")
    .select(`
      *,
      projects (
        id,
        name,
        description,
        status,
        start_date,
        end_date,
        clients (
          company_name,
          industry,
          website
        )
      )
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error) {
    console.error("Error fetching portfolio item:", error)
    return null
  }

  return data
}

export async function getPortfolioCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("portfolio").select("category").eq("is_published", true)

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  // Get unique categories
  const categories = [...new Set(data.map((item) => item.category).filter(Boolean))]
  return categories
}
