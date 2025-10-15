"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Users } from "lucide-react"
import { PaymentProofUpload } from "./payment-proof-upload"
import { PaymentProofVerification } from "../admin/payment-proof-verification"
import { ContractDocumentView } from "./contract-document-view"

interface ContractData {
  id: string
  contract_number: string
  status: string
  created_at: string
  
  // معلومات العميل
  client: {
    id: string
    name: string
    email: string
    phone: string
    id_card_url?: string
  }
  
  // معلومات الشريك (اختياري)
  affiliate?: {
    id: string
    name: string
    code: string
    commission_percentage: number
    commission_amount: number
  }
  
  // معلومات الخدمة
  service: {
    type: string
    package_name: string
    description: string
  }
  
  // معلومات الدفع
  payment: {
    total_amount: number
    deposit_amount: number
    remaining_amount: number
    payment_method: string
  }
  
  // التوقيعات
  signatures: {
    admin_signature?: string
    admin_signed_at?: string
    client_signature?: string
    client_signed_at?: string
  }
  
  // إثبات الدفع
  payment_proof?: {
    url: string
    method: string
    uploaded_at: string
    verified: boolean
    verified_at?: string
    notes?: string
  }
}

interface UnifiedContractViewProps {
  contract: ContractData
  userRole: "admin" | "client" | "affiliate"
  userId: string
}

export function UnifiedContractView({ contract, userRole, userId }: UnifiedContractViewProps) {
  // التحقق من الصلاحيات
  const canViewPaymentProof = userRole === "admin" || contract.client.id === userId
  const canUploadPaymentProof =
    userRole === "client" &&
    contract.client.id === userId &&
    contract.status === "pending_payment_proof"
  const canVerifyPaymentProof =
    userRole === "admin" &&
    contract.status === "pending_verification" &&
    contract.payment_proof?.url

  const canEdit = 
    (userRole === "admin" || (userRole === "affiliate" && contract.affiliate?.id === userId)) &&
    (contract.status === "draft" || contract.status === "pending_signature")

  return (
    <div className="space-y-6">
      {/* عرض العقد بالتصميم الجديد */}
      <ContractDocumentView 
        contract={contract}
        canEdit={canEdit}
        onEdit={() => {
          const editUrl = userRole === "admin" 
            ? `/admin/contracts/${contract.id}/edit`
            : `/affiliate/contracts/${contract.id}/edit`
          window.location.href = editUrl
        }}
      />

      {/* رأس العقد القديم - محذوف */}
      {false && <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">عقد تقديم خدمات تقنية</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    رقم العقد: <span className="font-mono font-bold">{contract.contract_number}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={`${statusInfo.color} text-white`}>
                <StatusIcon className="ml-1 h-3 w-3" />
                {statusInfo.label}
              </Badge>
              <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* معلومات العميل */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                العميل
              </div>
              <div className="space-y-1">
                <p className="font-bold">{contract.client.name}</p>
                <p className="text-sm text-muted-foreground">{contract.client.email}</p>
                <p className="text-sm text-muted-foreground">{contract.client.phone}</p>
                {contract.client.id_card_url && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="ml-1 h-3 w-3" />
                    هوية موثقة
                  </Badge>
                )}
              </div>
            </div>

            {/* معلومات الخدمة */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Package className="h-4 w-4" />
                الخدمة
              </div>
              <div className="space-y-1">
                <p className="font-bold">{contract.service.package_name}</p>
                <p className="text-sm text-muted-foreground">{contract.service.type}</p>
                <Badge variant="secondary" className="text-xs">
                  {contract.service.description}
                </Badge>
              </div>
            </div>

            {/* معلومات الدفع */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                الدفع
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">الإجمالي:</span>
                  <span className="font-bold text-emerald-600">
                    {contract.payment.total_amount.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">المقدم:</span>
                  <span className="font-semibold">
                    {contract.payment.deposit_amount.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">المتبقي:</span>
                  <span className="font-semibold">
                    {contract.payment.remaining_amount.toLocaleString()} ج.م
                  </span>
                </div>
                <Badge variant="outline" className="text-xs w-full justify-center">
                  {contract.payment.payment_method}
                </Badge>
              </div>
            </div>
          </div>

          {/* معلومات الشريك */}
          {contract.affiliate && (
            <>
              <Separator className="my-6" />
              <Alert className="bg-purple-50 dark:bg-purple-950/20 border-purple-200">
                <Users className="h-4 w-4 text-purple-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-900 dark:text-purple-100">
                        شريك تسويقي: {contract.affiliate.name}
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                        كود الإحالة: {contract.affiliate.code}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        العمولة: {contract.affiliate.commission_percentage}%
                      </p>
                      <p className="font-bold text-purple-900 dark:text-purple-100">
                        {contract.affiliate.commission_amount.toLocaleString()} ج.م
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* التوقيعات */}
          <Separator className="my-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* توقيع المسؤول */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileCheck className="h-4 w-4" />
                توقيع المسؤول
              </div>
              {contract.signatures.admin_signature ? (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="relative h-24 mb-2">
                    <Image
                      src={contract.signatures.admin_signature}
                      alt="توقيع المسؤول"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    <Calendar className="inline h-3 w-3 ml-1" />
                    {new Date(contract.signatures.admin_signed_at!).toLocaleString("ar-EG")}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">بانتظار التوقيع</p>
                </div>
              )}
            </div>

            {/* توقيع العميل */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileCheck className="h-4 w-4" />
                توقيع العميل
              </div>
              {contract.signatures.client_signature ? (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="relative h-24 mb-2">
                    <Image
                      src={contract.signatures.client_signature}
                      alt="توقيع العميل"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    <Calendar className="inline h-3 w-3 ml-1" />
                    {new Date(contract.signatures.client_signed_at!).toLocaleString("ar-EG")}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">بانتظار التوقيع</p>
                </div>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <Separator className="my-6" />
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Download className="ml-2 h-4 w-4" />
              تحميل PDF
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="ml-2 h-4 w-4" />
              مشاركة
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullTerms(!showFullTerms)}
            >
              <FileText className="ml-2 h-4 w-4" />
              {showFullTerms ? "إخفاء" : "عرض"} الشروط الكاملة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* إثبات الدفع - للعميل */}
      {canUploadPaymentProof && (
        <PaymentProofUpload
          contractId={contract.id}
          contractNumber={contract.contract_number}
          depositAmount={contract.payment.deposit_amount}
        />
      )}

      {/* التحقق من إثبات الدفع - للمسؤول */}
      {canVerifyPaymentProof && contract.payment_proof && (
        <PaymentProofVerification
          contractId={contract.id}
          contractNumber={contract.contract_number}
          paymentProofUrl={contract.payment_proof.url}
          paymentMethod={contract.payment_proof.method}
          depositAmount={contract.payment.deposit_amount}
          uploadedAt={contract.payment_proof.uploaded_at}
          clientName={contract.client.name}
          affiliateName={contract.affiliate?.name}
          affiliateCommission={contract.affiliate?.commission_amount}
        />
      )}

      {/* عرض إثبات الدفع - للجميع بعد التحقق */}
      {contract.payment_proof?.verified && canViewPaymentProof && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
              <CheckCircle className="h-5 w-5" />
              تم التحقق من الدفع ✅
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">طريقة الدفع</p>
                <p className="font-bold">{contract.payment_proof.method}</p>
              </div>
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">تاريخ التحقق</p>
                <p className="font-bold">
                  {new Date(contract.payment_proof.verified_at!).toLocaleDateString("ar-EG")}
                </p>
              </div>
            </div>
            {contract.payment_proof.notes && (
              <Alert>
                <AlertDescription>
                  <p className="text-sm font-semibold mb-1">ملاحظات:</p>
                  <p className="text-sm">{contract.payment_proof.notes}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* الشروط الكاملة */}
      {showFullTerms && (
        <Card>
          <CardHeader>
            <CardTitle>شروط وأحكام العقد</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            {/* هنا يتم عرض الشروط الكاملة من generateContractTerms */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {/* سيتم تمريرها كـ prop أو جلبها */}
              <p className="text-muted-foreground">
                الشروط الكاملة للعقد... (سيتم إضافتها من القالب)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات إضافية حسب الدور */}
      {userRole === "affiliate" && contract.affiliate && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardHeader>
            <CardTitle className="text-purple-900 dark:text-purple-100">
              معلومات العمولة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>نسبة العمولة:</span>
              <span className="font-bold">{contract.affiliate.commission_percentage}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>مبلغ العمولة:</span>
              <span className="font-bold text-lg text-purple-600">
                {contract.affiliate.commission_amount.toLocaleString()} ج.م
              </span>
            </div>
            <Separator />
            <Alert>
              <AlertDescription className="text-sm">
                💡 سيتم دفع العمولة خلال 7 أيام من تفعيل العقد والتحقق من الدفع
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
