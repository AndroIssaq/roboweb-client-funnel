"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Edit3,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
  Calendar,
  Package,
  Users,
} from "lucide-react"
import { toast } from "sonner"

interface ContractTerm {
  id: string
  title: string
  content: string
  editable: boolean
}

interface ContractTermsEditorProps {
  contractId: string
  initialTerms?: any
  userRole: "admin" | "affiliate"
  onSave?: (terms: any) => void
}

export function ContractTermsEditor({
  contractId,
  initialTerms,
  userRole,
  onSave,
}: ContractTermsEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // بيانات العقد الأساسية
  const [serviceType, setServiceType] = useState(initialTerms?.service_type || "")
  const [packageName, setPackageName] = useState(initialTerms?.package_name || "")
  const [serviceDescription, setServiceDescription] = useState(initialTerms?.service_description || "")
  const [totalAmount, setTotalAmount] = useState(initialTerms?.total_amount || "")
  const [depositAmount, setDepositAmount] = useState(initialTerms?.deposit_amount || "")
  const [timeline, setTimeline] = useState(initialTerms?.timeline || "")
  const [paymentMethod, setPaymentMethod] = useState(initialTerms?.payment_method || "")

  // المخرجات/التسليمات
  const [deliverables, setDeliverables] = useState<string[]>(
    initialTerms?.deliverables || [""]
  )

  // جدول الدفعات
  const [paymentSchedule, setPaymentSchedule] = useState<string[]>(
    initialTerms?.payment_schedule || [""]
  )

  // البنود القابلة للتعديل
  const [customTerms, setCustomTerms] = useState<ContractTerm[]>(
    initialTerms?.custom_terms || []
  )

  // إضافة مخرج جديد
  const addDeliverable = () => {
    setDeliverables([...deliverables, ""])
    setHasChanges(true)
  }

  // حذف مخرج
  const removeDeliverable = (index: number) => {
    const newDeliverables = deliverables.filter((_, i) => i !== index)
    setDeliverables(newDeliverables)
    setHasChanges(true)
  }

  // تحديث مخرج
  const updateDeliverable = (index: number, value: string) => {
    const newDeliverables = [...deliverables]
    newDeliverables[index] = value
    setDeliverables(newDeliverables)
    setHasChanges(true)
  }

  // إضافة دفعة جديدة
  const addPayment = () => {
    setPaymentSchedule([...paymentSchedule, ""])
    setHasChanges(true)
  }

  // حذف دفعة
  const removePayment = (index: number) => {
    const newSchedule = paymentSchedule.filter((_, i) => i !== index)
    setPaymentSchedule(newSchedule)
    setHasChanges(true)
  }

  // تحديث دفعة
  const updatePayment = (index: number, value: string) => {
    const newSchedule = [...paymentSchedule]
    newSchedule[index] = value
    setPaymentSchedule(newSchedule)
    setHasChanges(true)
  }

  // إضافة بند مخصص
  const addCustomTerm = () => {
    const newTerm: ContractTerm = {
      id: Date.now().toString(),
      title: "بند جديد",
      content: "",
      editable: true,
    }
    setCustomTerms([...customTerms, newTerm])
    setHasChanges(true)
  }

  // حذف بند مخصص
  const removeCustomTerm = (id: string) => {
    setCustomTerms(customTerms.filter((term) => term.id !== id))
    setHasChanges(true)
  }

  // تحديث بند مخصص
  const updateCustomTerm = (id: string, field: "title" | "content", value: string) => {
    setCustomTerms(
      customTerms.map((term) =>
        term.id === id ? { ...term, [field]: value } : term
      )
    )
    setHasChanges(true)
  }

  // حساب المبلغ المتبقي
  const remainingAmount = totalAmount && depositAmount
    ? parseFloat(totalAmount) - parseFloat(depositAmount)
    : 0

  // حفظ التعديلات
  const handleSave = async () => {
    // التحقق من البيانات المطلوبة
    if (!serviceType || !packageName || !totalAmount || !depositAmount) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    setIsSaving(true)

    try {
      const contractData = {
        service_type: serviceType,
        package_name: packageName,
        service_description: serviceDescription,
        total_amount: parseFloat(totalAmount),
        deposit_amount: parseFloat(depositAmount),
        remaining_amount: remainingAmount,
        timeline,
        payment_method: paymentMethod,
        deliverables: deliverables.filter((d) => d.trim() !== ""),
        payment_schedule: paymentSchedule.filter((p) => p.trim() !== ""),
        custom_terms: customTerms,
      }

      const response = await fetch(`/api/contracts/${contractId}/update-terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData),
      })

      if (!response.ok) throw new Error("فشل حفظ التعديلات")

      toast.success("تم حفظ التعديلات بنجاح! ✅")
      setHasChanges(false)

      if (onSave) onSave(contractData)
    } catch (error) {
      toast.error("حدث خطأ أثناء الحفظ")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* تنبيه */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-1">
            {userRole === "admin" ? "🔧 وضع التحرير - مسؤول" : "🤝 وضع التحرير - شريك"}
          </p>
          <p className="text-sm">
            يمكنك تعديل جميع بنود العقد قبل إرساله للعميل. التعديلات لن تؤثر على العقود الموقعة.
          </p>
        </AlertDescription>
      </Alert>

      {/* معلومات الخدمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            معلومات الخدمة
          </CardTitle>
          <CardDescription>حدد نوع الخدمة والباقة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceType">نوع الخدمة *</Label>
              <Input
                id="serviceType"
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value)
                  setHasChanges(true)
                }}
                placeholder="مثال: تطوير موقع إلكتروني"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packageName">اسم الباقة *</Label>
              <Input
                id="packageName"
                value={packageName}
                onChange={(e) => {
                  setPackageName(e.target.value)
                  setHasChanges(true)
                }}
                placeholder="مثال: الباقة الذهبية"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceDescription">وصف الخدمة</Label>
            <Textarea
              id="serviceDescription"
              value={serviceDescription}
              onChange={(e) => {
                setServiceDescription(e.target.value)
                setHasChanges(true)
              }}
              placeholder="وصف تفصيلي للخدمة المقدمة..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">المدة الزمنية</Label>
            <Input
              id="timeline"
              value={timeline}
              onChange={(e) => {
                setTimeline(e.target.value)
                setHasChanges(true)
              }}
              placeholder="مثال: 4-6 أسابيع"
            />
          </div>
        </CardContent>
      </Card>

      {/* المخرجات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                المخرجات والتسليمات
              </CardTitle>
              <CardDescription>ما الذي سيتم تسليمه للعميل؟</CardDescription>
            </div>
            <Button onClick={addDeliverable} size="sm" variant="outline">
              <Plus className="ml-2 h-4 w-4" />
              إضافة مخرج
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {deliverables.map((deliverable, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={deliverable}
                  onChange={(e) => updateDeliverable(index, e.target.value)}
                  placeholder={`المخرج ${index + 1}`}
                />
              </div>
              {deliverables.length > 1 && (
                <Button
                  onClick={() => removeDeliverable(index)}
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* معلومات الدفع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            معلومات الدفع
          </CardTitle>
          <CardDescription>حدد المبالغ وطريقة الدفع</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">إجمالي المبلغ (ج.م) *</Label>
              <Input
                id="totalAmount"
                type="number"
                value={totalAmount}
                onChange={(e) => {
                  setTotalAmount(e.target.value)
                  setHasChanges(true)
                }}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAmount">الدفعة المقدمة (ج.م) *</Label>
              <Input
                id="depositAmount"
                type="number"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value)
                  setHasChanges(true)
                }}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>المبلغ المتبقي (ج.م)</Label>
              <div className="h-10 flex items-center px-3 border rounded-md bg-muted">
                <span className="font-bold text-emerald-600">
                  {remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">طريقة الدفع</Label>
            <Input
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value)
                setHasChanges(true)
              }}
              placeholder="مثال: تحويل بنكي، InstaPay، Vodafone Cash"
            />
          </div>
        </CardContent>
      </Card>

      {/* جدول الدفعات */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                جدول الدفعات
              </CardTitle>
              <CardDescription>حدد مواعيد وشروط الدفع</CardDescription>
            </div>
            <Button onClick={addPayment} size="sm" variant="outline">
              <Plus className="ml-2 h-4 w-4" />
              إضافة دفعة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentSchedule.map((payment, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={payment}
                  onChange={(e) => updatePayment(index, e.target.value)}
                  placeholder={`الدفعة ${index + 1} - مثال: 50% عند التسليم النهائي`}
                />
              </div>
              {paymentSchedule.length > 1 && (
                <Button
                  onClick={() => removePayment(index)}
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* بنود مخصصة */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                بنود إضافية مخصصة
              </CardTitle>
              <CardDescription>أضف أي بنود خاصة بهذا العقد</CardDescription>
            </div>
            <Button onClick={addCustomTerm} size="sm" variant="outline">
              <Plus className="ml-2 h-4 w-4" />
              إضافة بند
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {customTerms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد بنود مخصصة بعد</p>
            </div>
          ) : (
            customTerms.map((term) => (
              <Card key={term.id} className="border-2">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={term.title}
                      onChange={(e) => updateCustomTerm(term.id, "title", e.target.value)}
                      placeholder="عنوان البند"
                      className="font-semibold"
                    />
                    <Button
                      onClick={() => removeCustomTerm(term.id)}
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={term.content}
                    onChange={(e) => updateCustomTerm(term.id, "content", e.target.value)}
                    placeholder="محتوى البند..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* أزرار الحفظ */}
      <Card className={hasChanges ? "border-amber-500 border-2" : ""}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <AlertCircle className="ml-1 h-3 w-3" />
                  تعديلات غير محفوظة
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                size="lg"
              >
                {isSaving ? (
                  "جاري الحفظ..."
                ) : (
                  <>
                    <Save className="ml-2 h-5 w-5" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تنبيه نهائي */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <p className="font-semibold mb-1">⚠️ تنبيه مهم:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>التعديلات ستطبق على هذا العقد فقط</li>
            <li>لا يمكن تعديل العقد بعد توقيع العميل</li>
            <li>تأكد من مراجعة جميع البنود قبل إرسال العقد</li>
            <li>جميع التعديلات مسجلة ومؤرشفة</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
