import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // التحقق من المصادقة
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    // التحقق من صلاحيات المستخدم (admin أو affiliate)
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userData || (userData.role !== "admin" && userData.role !== "affiliate")) {
      return NextResponse.json(
        { error: "غير مصرح - مسؤولين وشركاء فقط" },
        { status: 403 }
      )
    }

    const contractId = params.id

    // التحقق من وجود العقد
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, status, affiliate_id")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "العقد غير موجود" }, { status: 404 })
    }

    // إذا كان شريك، تأكد أنه شريك هذا العقد
    if (userData.role === "affiliate" && contract.affiliate_id !== user.id) {
      return NextResponse.json(
        { error: "غير مصرح - هذا العقد ليس من إحالتك" },
        { status: 403 }
      )
    }

    // لا يمكن تعديل العقد بعد التوقيع
    if (
      contract.status !== "draft" &&
      contract.status !== "pending_signature"
    ) {
      return NextResponse.json(
        { error: "لا يمكن تعديل العقد بعد التوقيع" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      service_type,
      package_name,
      service_description,
      total_amount,
      deposit_amount,
      remaining_amount,
      timeline,
      payment_method,
      deliverables,
      payment_schedule,
      custom_terms,
    } = body

    // التحقق من البيانات المطلوبة
    if (
      !service_type ||
      !package_name ||
      !total_amount ||
      !deposit_amount
    ) {
      return NextResponse.json(
        { error: "بيانات ناقصة" },
        { status: 400 }
      )
    }

    // إنشاء كائن contract_terms
    const contractTerms = {
      service: {
        type: service_type,
        package_name,
        description: service_description || "",
        timeline: timeline || "",
        deliverables: deliverables || [],
      },
      payment: {
        total_amount: parseFloat(total_amount),
        deposit_amount: parseFloat(deposit_amount),
        remaining_amount: parseFloat(remaining_amount),
        payment_method: payment_method || "",
        payment_schedule: payment_schedule || [],
      },
      custom_terms: custom_terms || [],
      last_modified_by: user.id,
      last_modified_at: new Date().toISOString(),
      modified_by_role: userData.role,
    }

    // تحديث العقد
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        service_type,
        package_name,
        total_amount: parseFloat(total_amount),
        deposit_amount: parseFloat(deposit_amount),
        remaining_amount: parseFloat(remaining_amount),
        payment_method: payment_method || null,
        contract_terms: contractTerms,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json(
        { error: "فشل تحديث العقد" },
        { status: 500 }
      )
    }

    // إنشاء سجل في contract_activities
    await supabase.from("contract_activities").insert({
      contract_id: contractId,
      user_id: user.id,
      activity_type: "terms_modified",
      activity_data: {
        modified_by: user.email,
        role: userData.role,
        changes: {
          service_type,
          package_name,
          total_amount,
          deposit_amount,
        },
      },
    })

    // إشعار للمسؤولين إذا كان التعديل من شريك
    if (userData.role === "affiliate") {
      const { data: admins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "admin")

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          title: "تعديل على عقد من شريك",
          message: `قام الشريك بتعديل بنود العقد رقم ${contractId}`,
          type: "contract_modified",
          link: `/admin/contracts/${contractId}`,
        }))

        await supabase.from("notifications").insert(notifications)
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم حفظ التعديلات بنجاح",
      data: contractTerms,
    })
  } catch (error) {
    console.error("Error updating contract terms:", error)
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع" },
      { status: 500 }
    )
  }
}
