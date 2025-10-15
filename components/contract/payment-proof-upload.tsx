"use client"

import { useState } from "react"
import { Upload, Check, AlertCircle, FileImage, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface PaymentProofUploadProps {
  contractId: string
  contractNumber: string
  depositAmount: number
  onUploadComplete?: () => void
}

export function PaymentProofUpload({
  contractId,
  contractNumber,
  depositAmount,
  onUploadComplete
}: PaymentProofUploadProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // التحقق من نوع الملف
      if (!selectedFile.type.startsWith("image/")) {
        setError("يرجى اختيار صورة فقط")
        return
      }

      // التحقق من حجم الملف (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("حجم الصورة يجب أن يكون أقل من 5 ميجابايت")
        return
      }

      setFile(selectedFile)
      setError("")

      // إنشاء معاينة
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file || !paymentMethod) {
      setError("يرجى اختيار طريقة الدفع ورفع صورة الإثبات")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      // رفع الصورة إلى Supabase Storage
      const formData = new FormData()
      formData.append("file", file)
      formData.append("contractId", contractId)
      formData.append("paymentMethod", paymentMethod)
      formData.append("notes", notes)

      const response = await fetch("/api/upload-payment-proof", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("فشل رفع إثبات الدفع")
      }

      setUploadSuccess(true)
      if (onUploadComplete) {
        onUploadComplete()
      }
    } catch (err) {
      setError("حدث خطأ أثناء رفع إثبات الدفع. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsUploading(false)
    }
  }

  if (uploadSuccess) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4">
              <Check className="h-12 w-12 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                تم رفع إثبات الدفع بنجاح! ✅
              </h3>
              <p className="text-emerald-700 dark:text-emerald-300">
                سيتم مراجعة إثبات الدفع والتحقق منه خلال 24 ساعة
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                سيتم تفعيل العقد فوراً بعد التحقق من الدفع
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-900 dark:text-amber-100">
            خطوة مهمة: إثبات الدفع 💰
          </CardTitle>
        </div>
        <CardDescription className="text-base">
          لضمان حقوقك وحقوق جميع الأطراف، يرجى رفع صورة واضحة لإثبات تحويل المبلغ
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* معلومات الدفع */}
        <Alert>
          <AlertDescription className="space-y-2">
            <p className="font-bold text-lg">المبلغ المطلوب: {depositAmount.toLocaleString()} جنيه</p>
            <p className="text-sm text-muted-foreground">رقم العقد: {contractNumber}</p>
          </AlertDescription>
        </Alert>

        {/* طرق الدفع */}
        <div className="space-y-3">
          <Label className="text-base font-bold">اختر طريقة الدفع المستخدمة *</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="instapay" id="instapay" />
              <Label htmlFor="instapay" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">InstaPay</p>
                    <p className="text-xs text-muted-foreground">تحويل فوري عبر InstaPay</p>
                  </div>
                  <Badge variant="secondary">موصى به</Badge>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="vodafone_cash" id="vodafone_cash" />
              <Label htmlFor="vodafone_cash" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-semibold">Vodafone Cash</p>
                  <p className="text-xs text-muted-foreground">محفظة فودافون كاش</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-semibold">تحويل بنكي</p>
                  <p className="text-xs text-muted-foreground">تحويل من البنك مباشرة</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-semibold">طريقة أخرى</p>
                  <p className="text-xs text-muted-foreground">أي طريقة دفع أخرى</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* رفع الصورة */}
        <div className="space-y-3">
          <Label className="text-base font-bold">صورة إثبات الدفع *</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
            {preview ? (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={preview}
                    alt="معاينة إثبات الدفع"
                    fill
                    className="object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFile(null)
                    setPreview("")
                  }}
                >
                  تغيير الصورة
                </Button>
              </div>
            ) : (
              <label htmlFor="payment-proof" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-3">
                  <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4">
                    <Upload className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold">اضغط لرفع صورة إثبات الدفع</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      PNG, JPG أو JPEG (حد أقصى 5MB)
                    </p>
                  </div>
                </div>
                <input
                  id="payment-proof"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            💡 تأكد من وضوح الصورة وظهور: المبلغ، التاريخ، رقم العملية
          </p>
        </div>

        {/* ملاحظات */}
        <div className="space-y-3">
          <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
          <Textarea
            id="notes"
            placeholder="أي معلومات إضافية عن عملية الدفع..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* رسالة خطأ */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* تنبيه قانوني */}
        <Alert>
          <AlertDescription className="text-sm space-y-2">
            <p className="font-semibold">⚖️ تنبيه قانوني:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>رفع إثبات دفع مزور يعد جريمة يعاقب عليها القانون</li>
              <li>سيتم التحقق من صحة إثبات الدفع قبل تفعيل العقد</li>
              <li>في حالة عدم صحة الإثبات، سيتم إلغاء العقد فوراً</li>
              <li>جميع البيانات محفوظة ومؤرشفة لأغراض قانونية</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* زر الرفع */}
        <Button
          onClick={handleUpload}
          disabled={!file || !paymentMethod || isUploading}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          size="lg"
        >
          {isUploading ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="ml-2 h-5 w-5" />
              رفع إثبات الدفع وإكمال العقد
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          بعد رفع إثبات الدفع، سيتم مراجعته خلال 24 ساعة
        </p>
      </CardContent>
    </Card>
  )
}
