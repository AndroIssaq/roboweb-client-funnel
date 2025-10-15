"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  FileText,
  User,
  Building,
  CreditCard,
  Calendar,
  Package,
  CheckCircle,
  Download,
  Printer,
  Edit,
  Shield,
} from "lucide-react"
import Image from "next/image"

interface ContractDocumentViewProps {
  contract: any
  canEdit?: boolean
  onEdit?: () => void
}

export function ContractDocumentView({
  contract,
  canEdit = false,
  onEdit,
}: ContractDocumentViewProps) {
  const getStatusBadge = () => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: "مسودة", color: "bg-gray-500" },
      pending_signature: { label: "في انتظار التوقيع", color: "bg-amber-500" },
      pending_payment_proof: { label: "في انتظار إثبات الدفع", color: "bg-orange-500" },
      pending_verification: { label: "في انتظار التحقق", color: "bg-blue-500" },
      active: { label: "نشط", color: "bg-emerald-500" },
      completed: { label: "مكتمل", color: "bg-green-600" },
      cancelled: { label: "ملغي", color: "bg-red-500" },
      suspended: { label: "معلق", color: "bg-red-600" },
    }
    return statusMap[contract.status] || { label: contract.status, color: "bg-gray-500" }
  }

  const status = getStatusBadge()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="ml-2 h-4 w-4" />
            تحميل PDF
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="ml-2 h-4 w-4" />
            طباعة
          </Button>
        </div>
        {canEdit && (
          <Button onClick={onEdit} variant="outline" size="sm">
            <Edit className="ml-2 h-4 w-4" />
            تعديل العقد
          </Button>
        )}
      </div>

      {/* Contract Document */}
      <Card className="border-2 shadow-lg">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-8 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg">
                  <FileText className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">عقد تقديم خدمات</h1>
                  <p className="text-emerald-100 text-sm">
                    شركة روبوويب للحلول التقنية
                  </p>
                </div>
              </div>
              <Badge className={`${status.color} text-white px-4 py-2 text-base`}>
                {status.label}
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-emerald-100 mb-1">رقم العقد</p>
                <p className="font-mono font-bold text-lg">{contract.contract_number}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <p className="text-emerald-100 mb-1">تاريخ الإصدار</p>
                <p className="font-bold text-lg">
                  {new Date(contract.created_at).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-8">
            {/* معلومات العميل */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold">معلومات العميل</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">اسم العميل</p>
                    <p className="font-bold text-lg">{contract.client_name || contract.client?.name || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">الشركة</p>
                    <p className="font-bold text-lg">{contract.client_company || contract.client?.company || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">البريد الإلكتروني</p>
                    <p className="font-semibold">{contract.client_email || contract.client?.email || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">رقم الهاتف</p>
                    <p className="font-semibold" dir="ltr">{contract.client_phone || contract.client?.phone || "غير محدد"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* تفاصيل العقد */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">تفاصيل العقد</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">نوع الخدمة</p>
                      <p className="font-bold text-lg">{contract.service_type || "غير محدد"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الباقة المختارة</p>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {contract.package_name || "غير محدد"}
                      </Badge>
                    </div>
                  </div>
                  {(contract.service_description || contract.contract_terms?.service?.description) && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">وصف الخدمة</p>
                      <p className="text-sm leading-relaxed">
                        {contract.service_description || contract.contract_terms?.service?.description}
                      </p>
                    </div>
                  )}
                  {(contract.timeline || contract.contract_terms?.service?.timeline) && (
                    <div className="mt-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">المدة الزمنية:</span>
                      <span className="font-semibold">{contract.timeline || contract.contract_terms?.service?.timeline}</span>
                    </div>
                  )}
                  
                  {/* المخرجات */}
                  {(contract.deliverables?.length > 0 || contract.contract_terms?.service?.deliverables?.length > 0) && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">المخرجات والتسليمات</p>
                      <ul className="list-disc list-inside space-y-1">
                        {(contract.deliverables || contract.contract_terms?.service?.deliverables || []).map((item: string, index: number) => (
                          <li key={index} className="text-sm">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* التفاصيل المالية */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold">التفاصيل المالية</h2>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg p-6 border-2 border-emerald-200 dark:border-emerald-800">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                      المبلغ الإجمالي
                    </p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {(contract.total_amount || 180000).toLocaleString()}
                      <span className="text-lg mr-1">ج.م</span>
                    </p>
                  </div>
                  <div className="text-center border-x border-emerald-300 dark:border-emerald-700">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                      المبلغ المقدم (مطلوب)
                    </p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {(contract.deposit_amount || 90000).toLocaleString()}
                      <span className="text-lg mr-1">ج.م</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-2">
                      المبلغ المتبقي
                    </p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                      {(contract.remaining_amount || 90000).toLocaleString()}
                      <span className="text-lg mr-1">ج.م</span>
                    </p>
                  </div>
                </div>
                {contract.payment_method && (
                  <div className="mt-4 pt-4 border-t border-emerald-300 dark:border-emerald-700">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 text-center">
                      طريقة الدفع: <span className="font-bold">{contract.payment_method}</span>
                    </p>
                  </div>
                )}
                
                {/* جدول الدفعات */}
                {(contract.payment_schedule?.length > 0 || contract.contract_terms?.payment?.payment_schedule?.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-emerald-300 dark:border-emerald-700">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold mb-2">جدول الدفعات:</p>
                    <ul className="space-y-1">
                      {(contract.payment_schedule || contract.contract_terms?.payment?.payment_schedule || []).map((item: string, index: number) => (
                        <li key={index} className="text-sm text-emerald-700 dark:text-emerald-300">
                          {index + 1}. {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* شروط وأحكام العقد */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold">شروط وأحكام العقد</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    يلتزم الطرف الأول (روبوويب) بتقديم الخدمة المتفق عليها حسب المواصفات المحددة
                  </h3>
                </div>
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    يلتزم الطرف الثاني (العميل) بدفع المبلغ المتفق عليه حسب الجدول الزمني
                  </h3>
                </div>
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    مدة التنفيذ تبدأ من تاريخ استلام الدفعة الأولى
                  </h3>
                </div>
                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    أي تعديلات إضافية خارج نطاق العقد تخضع لتكلفة إضافية منفصلة
                  </h3>
                </div>
                
                {/* البنود المخصصة */}
                {contract.contract_terms?.custom_terms?.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <p className="font-semibold text-sm text-muted-foreground">بنود إضافية:</p>
                      {contract.contract_terms.custom_terms.map((term: any, index: number) => (
                        <div key={index} className="border-l-4 border-emerald-500 pl-4">
                          <h4 className="font-bold mb-1">{term.title}</h4>
                          <p className="text-sm text-muted-foreground">{term.content}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* التوقيعات */}
            <div>
              <h2 className="text-xl font-bold mb-4">التوقيعات</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* توقيع المسؤول */}
                <div className="border-2 border-dashed rounded-lg p-6">
                  <p className="text-sm text-muted-foreground mb-4 text-center font-semibold">
                    توقيع المسؤول
                  </p>
                  {contract.signatures?.admin_signature ? (
                    <div>
                      <div className="relative h-32 mb-3 bg-white dark:bg-gray-900 rounded border">
                        <Image
                          src={contract.signatures.admin_signature}
                          alt="توقيع المسؤول"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="text-center text-xs text-muted-foreground">
                        <p className="font-semibold">شركة روبوويب</p>
                        <p className="flex items-center justify-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.signatures.admin_signed_at).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">في انتظار التوقيع</p>
                    </div>
                  )}
                </div>

                {/* توقيع العميل */}
                <div className="border-2 border-dashed rounded-lg p-6">
                  <p className="text-sm text-muted-foreground mb-4 text-center font-semibold">
                    توقيع العميل
                  </p>
                  {contract.signatures?.client_signature ? (
                    <div>
                      <div className="relative h-32 mb-3 bg-white dark:bg-gray-900 rounded border">
                        <Image
                          src={contract.signatures.client_signature}
                          alt="توقيع العميل"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                      <div className="text-center text-xs text-muted-foreground">
                        <p className="font-semibold">{contract.client?.name}</p>
                        <p className="flex items-center justify-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.signatures.client_signed_at).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">في انتظار توقيع العميل</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-muted/30 p-6 rounded-b-lg border-t">
            <div className="text-center text-sm text-muted-foreground space-y-1">
              <p className="font-semibold">شركة روبوويب للحلول التقنية</p>
              <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
              <p className="text-xs">
                هذا العقد ملزم قانونياً لجميع الأطراف ويخضع لقوانين جمهورية مصر العربية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
