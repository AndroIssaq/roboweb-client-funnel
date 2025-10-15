import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Supabase Keep-Alive Endpoint
 * يتم استدعاء هذا الـ endpoint يومياً لمنع إيقاف Supabase بعد 14 يوم من عدم النشاط
 * 
 * استخدام:
 * - Vercel Cron Jobs (موصى به)
 * - GitHub Actions
 * - cron-job.org
 * - أي خدمة cron خارجية
 */

export async function GET(request: Request) {
  try {
    // التحقق من Authorization header (اختياري لكن موصى به للأمان)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    // إذا كان هناك CRON_SECRET في الـ env، نتحقق منه
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // إجراء استعلام بسيط للحفاظ على النشاط
    const { data, error } = await supabase
      .from("contracts")
      .select("id")
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned (وهذا طبيعي إذا لم يكن هناك عقود)
      console.error("Supabase keep-alive error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }

    // استعلام إضافي على جداول أخرى للتأكد من النشاط
    await Promise.all([
      supabase.from("clients").select("id").limit(1),
      supabase.from("affiliates").select("id").limit(1),
      supabase.from("admins").select("id").limit(1),
    ])

    console.log("✅ Supabase keep-alive successful:", new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: "Supabase keep-alive ping successful",
      timestamp: new Date().toISOString(),
      next_run: "في خلال 24 ساعة",
    })
  } catch (error: any) {
    console.error("❌ Supabase keep-alive failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// يمكن استخدام POST أيضاً
export async function POST(request: Request) {
  return GET(request)
}
