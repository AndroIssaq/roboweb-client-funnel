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

    // الحصول على البيانات
    const formData = await request.formData()
    const file = formData.get("file") as File
    const contractId = formData.get("contractId") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const notes = formData.get("notes") as string

    if (!file || !contractId || !paymentMethod) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 })
    }

    // التحقق من أن المستخدم هو صاحب العقد
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, client_id, contract_number")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "العقد غير موجود" }, { status: 404 })
    }

    if (contract.client_id !== user.id) {
      return NextResponse.json({ error: "غير مصرح لك برفع إثبات الدفع لهذا العقد" }, { status: 403 })
    }

    // رفع الصورة إلى Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${contractId}/payment-proof-${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "فشل رفع الصورة" }, { status: 500 })
    }

    // الحصول على الرابط العام
    const {
      data: { publicUrl },
    } = supabase.storage.from("payment-proofs").getPublicUrl(fileName)

    // تحديث العقد
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        payment_proof_url: publicUrl,
        payment_proof_uploaded_at: new Date().toISOString(),
        payment_proof_method: paymentMethod,
        payment_proof_notes: notes || null,
        status: "pending_verification", // تغيير الحالة لانتظار التحقق
      })
      .eq("id", contractId)

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "فشل تحديث العقد" }, { status: 500 })
    }

    // إنشاء سجل في جدول المعاملات
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      contract_id: contractId,
      transaction_type: "deposit",
      amount: contract.deposit_amount || 0,
      payment_method: paymentMethod,
      payment_proof_url: publicUrl,
      payer_name: user.user_metadata?.full_name || user.email,
      notes: notes || null,
      status: "pending",
    })

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      // لا نوقف العملية إذا فشل إنشاء السجل
    }

    // إنشاء نشاط في سجل العقد
    await supabase.from("contract_activities").insert({
      contract_id: contractId,
      user_id: user.id,
      activity_type: "payment_proof_uploaded",
      activity_data: {
        payment_method: paymentMethod,
        file_url: publicUrl,
        notes: notes || null,
      },
    })

    // إنشاء إشعار للمسؤولين
    const { data: admins } = await supabase.from("users").select("id").eq("role", "admin")

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        title: "إثبات دفع جديد",
        message: `تم رفع إثبات دفع جديد للعقد رقم ${contract.contract_number}`,
        type: "payment_proof",
        link: `/admin/contracts/${contractId}`,
      }))

      await supabase.from("notifications").insert(notifications)
    }

    return NextResponse.json({
      success: true,
      message: "تم رفع إثبات الدفع بنجاح",
      data: {
        url: publicUrl,
        contract_id: contractId,
      },
    })
  } catch (error) {
    console.error("Error uploading payment proof:", error)
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 })
  }
}
