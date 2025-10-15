import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // التحقق من المصادقة
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // التحقق من أن المستخدم admin
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || userData.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح - مسؤولين فقط" }, { status: 403 })
    }

    const body = await request.json()
    const { contractId, action, notes } = body

    if (!contractId || !action) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 })
    }

    // جلب بيانات العقد
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        clients:client_id (
          user_id,
          company_name
        ),
        affiliates:affiliate_id (
          user_id,
          referral_code
        )
      `)
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "العقد غير موجود" }, { status: 404 })
    }

    if (action === "approve") {
      // الموافقة على إثبات الدفع
      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          payment_proof_verified: true,
          payment_proof_verified_by: user.id,
          payment_proof_verified_at: new Date().toISOString(),
          payment_proof_notes: notes || null,
          status: "active", // تفعيل العقد
        })
        .eq("id", contractId)

      if (updateError) {
        console.error("Update error:", updateError)
        return NextResponse.json({ error: "فشل تحديث العقد" }, { status: 500 })
      }

      // تحديث حالة المعاملة
      await supabase
        .from("payment_transactions")
        .update({
          status: "verified",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq("contract_id", contractId)
        .eq("status", "pending")

      // إنشاء نشاط
      await supabase.from("contract_activities").insert({
        contract_id: contractId,
        user_id: user.id,
        activity_type: "payment_verified",
        activity_data: {
          notes: notes || null,
          verified_by: user.email,
        },
      })

      // إشعار للعميل
      await supabase.from("notifications").insert({
        user_id: contract.client_id,
        title: "تم تفعيل العقد ✅",
        message: `تم التحقق من دفعتك وتفعيل العقد رقم ${contract.contract_number}. يمكنك الآن البدء في المشروع!`,
        type: "contract_activated",
        link: `/client/contracts/${contractId}`,
      })

      // إشعار للشريك إذا وجد
      if (contract.affiliate_id && contract.affiliate_commission_amount > 0) {
        await supabase.from("notifications").insert({
          user_id: contract.affiliate_id,
          title: "عمولة جديدة مؤكدة 💰",
          message: `تم تأكيد عمولتك (${contract.affiliate_commission_amount.toLocaleString()} جنيه) للعقد رقم ${contract.contract_number}`,
          type: "commission_confirmed",
          link: `/affiliate/contracts/${contractId}`,
        })
      }

      return NextResponse.json({
        success: true,
        message: "تم التحقق من الدفع وتفعيل العقد بنجاح",
      })
    } else if (action === "reject") {
      // رفض إثبات الدفع
      if (!notes || !notes.trim()) {
        return NextResponse.json({ error: "يجب كتابة سبب الرفض" }, { status: 400 })
      }

      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          payment_proof_verified: false,
          payment_proof_verified_by: user.id,
          payment_proof_verified_at: new Date().toISOString(),
          payment_proof_notes: notes,
          payment_proof_url: null, // إزالة الصورة المرفوضة
          status: "pending_payment_proof", // إعادة للحالة السابقة
        })
        .eq("id", contractId)

      if (updateError) {
        console.error("Update error:", updateError)
        return NextResponse.json({ error: "فشل تحديث العقد" }, { status: 500 })
      }

      // تحديث حالة المعاملة
      await supabase
        .from("payment_transactions")
        .update({
          status: "rejected",
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          notes: notes,
        })
        .eq("contract_id", contractId)
        .eq("status", "pending")

      // إنشاء نشاط
      await supabase.from("contract_activities").insert({
        contract_id: contractId,
        user_id: user.id,
        activity_type: "payment_rejected",
        activity_data: {
          reason: notes,
          rejected_by: user.email,
        },
      })

      // إشعار للعميل
      await supabase.from("notifications").insert({
        user_id: contract.client_id,
        title: "تم رفض إثبات الدفع ❌",
        message: `تم رفض إثبات الدفع للعقد رقم ${contract.contract_number}. السبب: ${notes}. يرجى رفع إثبات دفع صحيح.`,
        type: "payment_rejected",
        link: `/client/contracts/${contractId}`,
      })

      return NextResponse.json({
        success: true,
        message: "تم رفض إثبات الدفع",
      })
    } else {
      return NextResponse.json({ error: "إجراء غير صحيح" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error verifying payment proof:", error)
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 })
  }
}
