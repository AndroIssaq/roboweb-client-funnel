"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { getAllPackages } from "@/lib/data/packages"

interface ContractFormData {
  clientName: string
  clientCompany: string
  clientEmail: string
  clientPhone: string
  serviceType: string
  packageName: string
  serviceDescription: string
  timeline: string
  deliverables: string[]
  totalAmount: string
  depositAmount: string
  paymentMethod: string
  paymentSchedule: string[]
  additionalNotes: string
}

interface ContractFormProps {
  onSubmit: (data: ContractFormData) => void
  affiliateCode?: string
}

// Use packages from the centralized packages file
const packages = getAllPackages()

const servicePackages = {
  website: packages, // Portfolio and E-commerce packages
}

export function ContractForm({ onSubmit, affiliateCode }: ContractFormProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    serviceType: "",
    packageName: "",
    serviceDescription: "",
    timeline: "",
    deliverables: [""],
    totalAmount: "",
    depositAmount: "",
    paymentMethod: "",
    paymentSchedule: [""],
    additionalNotes: "",
  })

  const [selectedService, setSelectedService] = useState<keyof typeof servicePackages | "">("")

  const handleServiceChange = (value: string) => {
    setSelectedService(value as keyof typeof servicePackages)
    setFormData({ ...formData, serviceType: value, packageName: "", totalAmount: "", depositAmount: "" })
  }

  const handlePackageChange = (value: string) => {
    const pkg = packages.find((p) => p.name === value)
    if (pkg) {
      setFormData({
        ...formData,
        packageName: value,
        totalAmount: pkg.price.toString(),
        depositAmount: pkg.deposit.toString(), // Use pre-calculated 50% deposit (locked)
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>معلومات العميل</CardTitle>
          <CardDescription>أدخل بيانات العميل الأساسية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">الاسم الكامل *</Label>
            <Input
              id="clientName"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="أحمد محمد"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientEmail">البريد الإلكتروني *</Label>
            <Input
              id="clientEmail"
              type="email"
              required
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              placeholder="ahmed@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientPhone">رقم الجوال *</Label>
            <Input
              id="clientPhone"
              type="tel"
              required
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="+966501234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientCompany">اسم الشركة (اختياري)</Label>
            <Input
              id="clientCompany"
              value={formData.clientCompany}
              onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
              placeholder="شركة المستقبل للتقنية"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الخدمة</CardTitle>
          <CardDescription>اختر نوع الخدمة والباقة المناسبة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serviceType">نوع الخدمة *</Label>
            <Select value={formData.serviceType} onValueChange={handleServiceChange} required>
              <SelectTrigger id="serviceType" className="w-full">
                <SelectValue placeholder="اختر نوع الخدمة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">تصميم وتطوير مواقع إلكترونية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageName">الباقة *</Label>
            <Select value={formData.packageName} onValueChange={handlePackageChange} required>
              <SelectTrigger id="packageName" className="w-full">
                <SelectValue placeholder="اختر الباقة" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.name}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{pkg.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {pkg.price.toLocaleString("ar-EG")} ج.م - دفعة مقدمة {pkg.deposit.toLocaleString("ar-EG")} ج.م
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceDescription">وصف الخدمة</Label>
            <Textarea
              id="serviceDescription"
              value={formData.serviceDescription}
              onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
              placeholder="وصف تفصيلي للخدمة المطلوبة..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">المدة الزمنية المتوقعة</Label>
            <Input
              id="timeline"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              placeholder="مثال: 4-6 أسابيع"
            />
          </div>

          {formData.totalAmount && (
            <>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">المبلغ الإجمالي (ج.م)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  required
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositAmount">
                  الدفعة المقدمة (ج.م) - 50% مقفول
                  <Badge variant="destructive" className="mr-2">غير قابل للتعديل</Badge>
                </Label>
                <Input
                  id="depositAmount"
                  type="number"
                  required
                  value={formData.depositAmount}
                  readOnly
                  className="bg-muted font-bold"
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ الدفعة المقدمة مقفولة على 50% ولا يمكن تعديلها
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">طريقة الدفع *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              required
            >
              <SelectTrigger id="paymentMethod" className="w-full">
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

          {/* المخرجات */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>المخرجات والتسليمات</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, deliverables: [...formData.deliverables, ""] })}
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة مخرج
              </Button>
            </div>
            {formData.deliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={deliverable}
                  onChange={(e) => {
                    const newDeliverables = [...formData.deliverables]
                    newDeliverables[index] = e.target.value
                    setFormData({ ...formData, deliverables: newDeliverables })
                  }}
                  placeholder={`المخرج ${index + 1}`}
                />
                {formData.deliverables.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newDeliverables = formData.deliverables.filter((_, i) => i !== index)
                      setFormData({ ...formData, deliverables: newDeliverables })
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* جدول الدفعات */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>جدول الدفعات</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormData({ ...formData, paymentSchedule: [...formData.paymentSchedule, ""] })}
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة دفعة
              </Button>
            </div>
            {formData.paymentSchedule.map((payment, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={payment}
                  onChange={(e) => {
                    const newSchedule = [...formData.paymentSchedule]
                    newSchedule[index] = e.target.value
                    setFormData({ ...formData, paymentSchedule: newSchedule })
                  }}
                  placeholder={`الدفعة ${index + 1} - مثال: 50% عند التسليم النهائي`}
                />
                {formData.paymentSchedule.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSchedule = formData.paymentSchedule.filter((_, i) => i !== index)
                      setFormData({ ...formData, paymentSchedule: newSchedule })
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">ملاحظات إضافية</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="أي ملاحظات أو متطلبات خاصة..."
              rows={4}
            />
          </div>

          {affiliateCode && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-foreground">
                <span className="font-semibold">كود الإحالة:</span> {affiliateCode}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          إنشاء العقد
        </Button>
      </div>
    </form>
  )
}
