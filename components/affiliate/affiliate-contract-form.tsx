"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createAffiliateContract } from "@/lib/actions/affiliate-contracts"
import { getAllPackages } from "@/lib/data/packages"
import { Loader2, AlertCircle } from "lucide-react"

interface AffiliateContractFormProps {
  affiliateId: string
}

const serviceTypes = [
  { value: "website", label: "تصميم وتطوير مواقع إلكترونية" },
]

// Use packages from centralized config
const availablePackages = getAllPackages()

export function AffiliateContractForm({ affiliateId }: AffiliateContractFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [selectedPackageId, setSelectedPackageId] = useState("")

  const selectedPackageData = availablePackages.find(p => p.id === selectedPackageId)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    
    // Use selected package data
    if (!selectedPackageData) {
      setError("الرجاء اختيار باقة")
      setLoading(false)
      return
    }
    
    const contractData = {
      affiliate_id: affiliateId,
      client_name: formData.get("client_name") as string,
      client_email: formData.get("client_email") as string,
      client_phone: formData.get("client_phone") as string,
      company_name: formData.get("company_name") as string,
      service_type: formData.get("service_type") as string,
      package_name: selectedPackageData.name,
      total_amount: selectedPackageData.price,
      deposit_amount: selectedPackageData.deposit,
      payment_method: formData.get("payment_method") as string,
      notes: formData.get("notes") as string,
    }

    const result = await createAffiliateContract(contractData)

    if (result.success) {
      router.push(`/affiliate/contracts/${result.contractId}`)
    } else {
      setError(result.error || "حدث خطأ أثناء إنشاء العقد")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>معلومات العميل</CardTitle>
            <CardDescription>أدخل بيانات العميل الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">اسم العميل *</Label>
                <Input id="client_name" name="client_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">اسم الشركة</Label>
                <Input id="company_name" name="company_name" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_email">البريد الإلكتروني *</Label>
                <Input id="client_email" name="client_email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">رقم الجوال *</Label>
                <Input id="client_phone" name="client_phone" type="tel" required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الخدمة</CardTitle>
            <CardDescription>اختر نوع الخدمة والباقة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">نوع الخدمة *</Label>
                <Select name="service_type" value={serviceType} onValueChange={setServiceType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="package_name">الباقة *</Label>
                <Select name="package_name" value={selectedPackageId} onValueChange={setSelectedPackageId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الباقة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePackages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.price.toLocaleString("ar-EG")} ج.م
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPackageData && (
                  <p className="text-xs text-muted-foreground">
                    دفعة مقدمة: {selectedPackageData.deposit.toLocaleString("ar-EG")} ج.م (50% مقفول)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>التفاصيل المالية</CardTitle>
            <CardDescription>حدد قيمة العقد وطريقة الدفع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_amount">المبلغ الإجمالي (ج.م) *</Label>
                <Input 
                  id="total_amount" 
                  name="total_amount" 
                  type="number" 
                  value={selectedPackageData?.price || 0}
                  readOnly
                  className="bg-muted"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">
                  الدفعة المقدمة (ج.م) - 50% مقفول *
                  <Badge variant="destructive" className="mr-2">غير قابل للتعديل</Badge>
                </Label>
                <Input 
                  id="deposit_amount" 
                  name="deposit_amount" 
                  type="number" 
                  value={selectedPackageData?.deposit || 0}
                  readOnly
                  className="bg-muted font-bold"
                  required 
                />
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    الدفعة المقدمة 50% مقفولة ولا يمكن تعديلها أو استرجاعها بعد بدء العمل
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">طريقة الدفع *</Label>
              <Select name="payment_method" required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="vodafone_cash">فودافون كاش</SelectItem>
                  <SelectItem value="fawry">فوري</SelectItem>
                  <SelectItem value="instapay">instapay</SelectItem>
                  <SelectItem value="cash">نقداً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              id="notes" 
              name="notes" 
              placeholder="أي ملاحظات أو متطلبات خاصة..."
              rows={4}
            />
          </CardContent>
        </Card>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            إنشاء العقد
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            إلغاء
          </Button>
        </div>
      </div>
    </form>
  )
}
