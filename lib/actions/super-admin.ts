"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Super Admin email - ONLY this email can create new admins
const SUPER_ADMIN_EMAIL = "androisshaq@gmail.com" // Change this to your email

export async function createAdminUser(email: string, password: string, fullName: string) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "غير مصرح لك" }
  }

  // Check if current user is super admin
  if (user.email !== SUPER_ADMIN_EMAIL) {
    console.error(`Unauthorized admin creation attempt by: ${user.email}`)
    return { success: false, error: "غير مصرح لك بإنشاء مسؤولين" }
  }

  try {
    // Create user in Supabase Auth using admin API
    // Note: This requires service_role key, so we'll use a different approach
    // We'll create the user record and let them set password via email

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return { success: false, error: "المستخدم موجود بالفعل" }
    }

    // For now, return instructions to create manually
    // In production, you'd use Supabase Admin API with service_role key
    return {
      success: false,
      error: "لإنشاء مسؤول جديد، استخدم Supabase Dashboard:\n1. اذهب إلى Authentication > Users\n2. أضف مستخدم جديد\n3. ثم شغل SQL: UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{\"role\": \"admin\"}'::jsonb WHERE email = 'EMAIL'",
    }
  } catch (error) {
    console.error("Error creating admin:", error)
    return { success: false, error: "حدث خطأ أثناء إنشاء المسؤول" }
  }
}

export async function isSuperAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  return user.email === SUPER_ADMIN_EMAIL
}

export async function getAllAdmins() {
  const supabase = await createClient()

  // Check if current user is super admin
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return []
  }

  // Get all users with admin role
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false })

  return users || []
}

export async function revokeAdminAccess(userId: string) {
  const supabase = await createClient()

  // Check if current user is super admin
  const isSuper = await isSuperAdmin()
  if (!isSuper) {
    return { success: false, error: "غير مصرح لك" }
  }

  // Get user to check if they're the super admin
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single()

  if (user?.email === SUPER_ADMIN_EMAIL) {
    return { success: false, error: "لا يمكن إلغاء صلاحيات المسؤول الرئيسي" }
  }

  // Update user role to client
  const { error } = await supabase
    .from("users")
    .update({ role: "client" })
    .eq("id", userId)

  if (error) {
    return { success: false, error: "فشل في إلغاء الصلاحيات" }
  }

  revalidatePath("/admin")
  return { success: true }
}
