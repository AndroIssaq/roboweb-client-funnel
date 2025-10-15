"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface OnboardingData {
  companyName: string
  industry: string
  websiteUrl: string
  companyDescription: string
  targetAudience: string
  brandColors: string[]
  typography: string
  brandGuidelines: string
  existingContent: string
  domains: string[]
  hostingPreference: string
  integrations: string[]
  technicalNotes: string
  projectGoals: string[]
  competitors: string[]
  inspiration: string[]
  timeline: string
  budget: string
  additionalNotes: string
}

export async function saveOnboardingData(clientId: string, data: OnboardingData) {
  const supabase = await createClient()

  try {
    // Update client record with onboarding data
    const { error: clientError } = await supabase
      .from("clients")
      .update({
        company_name: data.companyName,
        industry: data.industry,
        website_url: data.websiteUrl,
        onboarding_completed: true,
        onboarding_data: {
          companyDescription: data.companyDescription,
          targetAudience: data.targetAudience,
          brandColors: data.brandColors,
          typography: data.typography,
          brandGuidelines: data.brandGuidelines,
          existingContent: data.existingContent,
          domains: data.domains,
          hostingPreference: data.hostingPreference,
          integrations: data.integrations,
          technicalNotes: data.technicalNotes,
          projectGoals: data.projectGoals,
          competitors: data.competitors,
          inspiration: data.inspiration,
          timeline: data.timeline,
          budget: data.budget,
          additionalNotes: data.additionalNotes,
        },
      })
      .eq("id", clientId)

    if (clientError) throw clientError

    // Create activity log
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await supabase.from("activity_log").insert({
        user_id: user.id,
        entity_type: "client",
        entity_id: clientId,
        action: "onboarding_completed",
        description: "أكمل العميل نموذج التأهيل",
      })
    }

    revalidatePath("/client/dashboard")
    revalidatePath("/admin/clients")

    return { success: true }
  } catch (error) {
    console.error("[v0] Error saving onboarding data:", error)
    return { error: "فشل في حفظ البيانات" }
  }
}

export async function getClientOnboardingData(clientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).single()

  if (error) {
    console.error("[v0] Error fetching onboarding data:", error)
    return null
  }

  return data
}

export async function getCurrentClient() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Try to get existing client record
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      contract:contracts!clients_contract_id_fkey(contract_number, status, total_amount)
    `,
    )
    .eq("user_id", user.id)
    .single()

  // If client doesn't exist, create one
  if (error && error.code === "PGRST116") {
    // First, ensure user exists in public.users table
    const { error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single()

    // If user doesn't exist in public.users, create it
    if (userCheckError && userCheckError.code === "PGRST116") {
      const { error: userCreateError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "مستخدم",
          phone: user.user_metadata?.phone || null,
          role: user.user_metadata?.role || "client",
        })

      if (userCreateError) {
        console.error("[v0] Error creating user:", userCreateError)
        return null
      }
    }

    // Now create the client record
    const { data: newClient, error: createError } = await supabase
      .from("clients")
      .insert({
        user_id: user.id,
        company_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "عميل جديد",
        onboarding_completed: false,
      })
      .select(
        `
        *,
        contract:contracts!clients_contract_id_fkey(contract_number, status, total_amount)
      `,
      )
      .single()

    if (createError) {
      console.error("[v0] Error creating client:", createError)
      return null
    }

    return {
      ...newClient,
      user: {
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "عميل جديد",
        email: user.email!,
        phone: user.user_metadata?.phone || "",
      },
    }
  }

  if (error) {
    console.error("[v0] Error fetching client:", error)
    return null
  }

  // Add user data from metadata
  return {
    ...data,
    user: {
      full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "عميل جديد",
      email: user.email!,
      phone: user.user_metadata?.phone || "",
    },
  }
}
