"use client"

import { useState } from "react"
import { Check, X, Eye, AlertCircle, Calendar, User, CreditCard, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import Image from "next/image"
import { toast } from "sonner"

interface PaymentProofVerificationProps {
  contractId: string
  contractNumber: string
  paymentProofUrl: string
  paymentMethod: string
  depositAmount: number
  uploadedAt: string
  clientName: string
  affiliateName?: string
  affiliateCommission?: number
  onVerificationComplete?: () => void
}

export function PaymentProofVerification({
  contractId,
  contractNumber,
  paymentProofUrl,
  paymentMethod,
  depositAmount,
  uploadedAt,
  clientName,
  affiliateName,
  affiliateCommission,
  onVerificationComplete,
}: PaymentProofVerificationProps) {
  const [notes, setNotes] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const paymentMethodLabels: Record<string, string> = {
    instapay: "InstaPay",
    vodafone_cash: "Vodafone Cash",
    bank_transfer: "تحويل بنكي",
    other: "طريقة أخرى",
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const response = await fetch("/api/verify-payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          action: "approve",
          notes,
        }),
      })

      if (!response.ok) throw new Error("فشل التحقق")

      toast.success("تم التحقق من الدفع بنجاح! ✅")
      if (onVerificationComplete) onVerificationComplete()
    } catch (error) {
      toast.error("حدث خطأ أثناء التحقق")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error("يرجى كتابة سبب الرفض")
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch("/api/verify-payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          action: "reject",
          notes,
        }),
      })

      if (!response.ok) throw new Error("فشل الرفض")

      toast.success("تم رفض إثبات الدفع")
      if (onVerificationComplete) onVerificationComplete()
    } catch (error) {
      toast.error("حدث خطأ أثناء الرفض")
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle>التحقق من إثبات الدفع</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            بانتظار التحقق
          </Badge>
        </div>
        <CardDescription>
          يرجى مراجعة إثبات الدفع والتحقق من صحته قبل تفعيل العقد
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* معلومات العقد */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              رقم العقد
            </p>
            <p className="font-bold">{contractNumber}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              العميل
            </p>
            <p className="font-bold">{clientName}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              المبلغ المدفوع
            </p>
            <p className="font-bold text-emerald-600">{depositAmount.toLocaleString()} جنيه</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              طريقة الدفع
            </p>
            <p className="font-bold">{paymentMethodLabels[paymentMethod] || paymentMethod}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              تاريخ الرفع
            </p>
            <p className="font-bold">{new Date(uploadedAt).toLocaleString("ar-EG")}</p>
          </div>

          {affiliateName && affiliateCommission && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                الشريك
              </p>
              <p className="font-bold">{affiliateName}</p>
              <p className="text-xs text-emerald-600">
                عمولة: {affiliateCommission.toLocaleString()} جنيه
              </p>
            </div>
          )}
        </div>

        {/* صورة إثبات الدفع */}
        <div className="space-y-3">
          <Label className="text-base font-bold">صورة إثبات الدفع</Label>
          <div className="relative border-2 rounded-lg overflow-hidden">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative h-96 cursor-pointer group">
                  <Image
                    src={paymentProofUrl}
                    alt="إثبات الدفع"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <Eye className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-semibold">اضغط للتكبير</p>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <div className="relative w-full h-[80vh]">
                  <Image
                    src={paymentProofUrl}
                    alt="إثبات الدفع"
                    fill
                    className="object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* نقاط التحقق */}
        <Alert>
          <AlertDescription>
            <p className="font-semibold mb-2">✅ نقاط يجب التحقق منها:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>وضوح الصورة وإمكانية قراءة البيانات</li>
              <li>تطابق المبلغ المدفوع مع المبلغ المطلوب ({depositAmount.toLocaleString()} جنيه)</li>
              <li>ظهور تاريخ العملية بوضوح</li>
              <li>ظهور رقم العملية أو المرجع</li>
              <li>تطابق طريقة الدفع المذكورة</li>
              <li>عدم وجود علامات تلاعب أو تعديل على الصورة</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* ملاحظات */}
        <div className="space-y-3">
          <Label htmlFor="admin-notes">ملاحظات التحقق</Label>
          <Textarea
            id="admin-notes"
            placeholder="أضف ملاحظاتك حول عملية التحقق (مطلوب في حالة الرفض)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        {/* تنبيه قانوني */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <p className="font-semibold mb-1">⚠️ تحذير:</p>
            <p>
              التحقق من إثبات الدفع مسؤولية قانونية. تأكد من صحة جميع البيانات قبل الموافقة.
              في حالة الموافقة، سيتم تفعيل العقد فوراً وسيتم احتساب عمولة الشريك إن وجد.
            </p>
          </AlertDescription>
        </Alert>

        {/* أزرار الإجراءات */}
        <div className="flex gap-3">
          <Button
            onClick={handleVerify}
            disabled={isVerifying || isRejecting}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            size="lg"
          >
            {isVerifying ? (
              "جاري التحقق..."
            ) : (
              <>
                <Check className="ml-2 h-5 w-5" />
                الموافقة وتفعيل العقد
              </>
            )}
          </Button>

          <Button
            onClick={handleReject}
            disabled={isVerifying || isRejecting}
            variant="destructive"
            size="lg"
            className="flex-1"
          >
            {isRejecting ? (
              "جاري الرفض..."
            ) : (
              <>
                <X className="ml-2 h-5 w-5" />
                رفض إثبات الدفع
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          سيتم إرسال إشعار للعميل{affiliateName && " والشريك"} فور اتخاذ القرار
        </p>
      </CardContent>
    </Card>
  )
}
