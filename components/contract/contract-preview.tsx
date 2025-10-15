"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, Calendar, DollarSign, User, Phone, Mail } from "lucide-react"

interface ContractData {
  contractNumber: string
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceType: string
  packageName: string
  totalAmount: string
  depositAmount: string
  remainingAmount: string
  paymentMethod: string
  createdAt: string
  terms: string[]
}

interface ContractPreviewProps {
  contract: ContractData
  showSignature?: boolean
  signatureData?: string
}

export function ContractPreview({ contract, showSignature, signatureData }: ContractPreviewProps) {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-3xl">عقد تقديم خدمات</CardTitle>
        <p className="text-muted-foreground">شركة روبوويب للحلول التقنية</p>
        <div className="inline-block px-4 py-2 bg-primary/10 rounded-lg">
          <p className="text-sm font-mono">رقم العقد: {contract.contractNumber}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Separator />

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              معلومات العميل
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">الاسم:</span> {contract.clientName}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {contract.clientEmail}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {contract.clientPhone}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              تفاصيل العقد
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">نوع الخدمة:</span> {contract.serviceType}
              </p>
              <p>
                <span className="text-muted-foreground">الباقة:</span> {contract.packageName}
              </p>
              <p>
                <span className="text-muted-foreground">تاريخ الإنشاء:</span>{" "}
                {new Date(contract.createdAt).toLocaleDateString("ar-SA")}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            التفاصيل المالية
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">المبلغ الإجمالي</p>
              <p className="text-2xl font-bold">{Number(contract.totalAmount).toLocaleString("ar-EG")} ج.م</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">الدفعة المقدمة (50% مقفول)</p>
              <p className="text-2xl font-bold text-primary">
                {Number(contract.depositAmount).toLocaleString("ar-EG")} ج.م
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">المبلغ المتبقي</p>
              <p className="text-2xl font-bold">{Number(contract.remainingAmount).toLocaleString("ar-EG")} ج.م</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">طريقة الدفع:</span> {contract.paymentMethod}
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">شروط وأحكام العقد</h3>
          <ul className="space-y-2 text-sm list-disc list-inside text-muted-foreground">
            {contract.terms.map((term, index) => (
              <li key={index}>{term}</li>
            ))}
          </ul>
        </div>

        {showSignature && signatureData && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">توقيع العميل</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/30">
                <img src={signatureData || "/placeholder.svg"} alt="توقيع العميل" className="max-w-xs mx-auto" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                تم التوقيع بتاريخ: {new Date().toLocaleDateString("ar-SA")}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
