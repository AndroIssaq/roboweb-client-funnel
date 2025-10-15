"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Users } from "lucide-react"
import { PaymentProofUpload } from "./payment-proof-upload"
import { PaymentProofVerification } from "../admin/payment-proof-verification"
import { ContractDocumentView } from "./contract-document-view"

interface UnifiedContractViewProps {
  contract: any
  userRole: "admin" | "client" | "affiliate"
  userId: string
}

export function UnifiedContractView({ contract, userRole, userId }: UnifiedContractViewProps) {
  // التحقق من الصلاحيات
  const canViewPaymentProof = userRole === "admin" || contract.client?.id === userId
  const canUploadPaymentProof =
    userRole === "client" &&
    contract.client?.id === userId &&
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

      {/* إثبات الدفع - للعميل */}
      {canUploadPaymentProof && (
        <PaymentProofUpload
          contractId={contract.id}
          contractNumber={contract.contract_number}
          depositAmount={contract.payment?.deposit_amount || contract.deposit_amount}
        />
      )}

      {/* التحقق من إثبات الدفع - للمسؤول */}
      {canVerifyPaymentProof && contract.payment_proof && (
        <PaymentProofVerification
          contractId={contract.id}
          contractNumber={contract.contract_number}
          paymentProofUrl={contract.payment_proof.url}
          paymentMethod={contract.payment_proof.method}
          depositAmount={contract.payment?.deposit_amount || contract.deposit_amount}
          uploadedAt={contract.payment_proof.uploaded_at}
          clientName={contract.client?.name || ""}
          affiliateName={contract.affiliate?.name}
          affiliateCommission={contract.affiliate?.commission_amount}
        />
      )}

      {/* عرض إثبات الدفع - للجميع بعد التحقق */}
      {contract.payment_proof?.verified && canViewPaymentProof && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4">
                <CheckCircle className="h-12 w-12 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                  تم التحقق من الدفع ✅
                </h3>
                <p className="text-emerald-700 dark:text-emerald-300">
                  تم التحقق من إثبات الدفع بنجاح
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">طريقة الدفع</p>
                    <p className="font-bold">{contract.payment_proof.method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">تاريخ التحقق</p>
                    <p className="font-bold">
                      {new Date(contract.payment_proof.verified_at).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
                {contract.payment_proof.notes && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      <p className="text-sm font-semibold mb-1">ملاحظات:</p>
                      <p className="text-sm">{contract.payment_proof.notes}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* معلومات إضافية للشريك */}
      {userRole === "affiliate" && contract.affiliate && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                معلومات العمولة
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>نسبة العمولة:</span>
                <span className="font-bold">{contract.affiliate.commission_percentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>مبلغ العمولة:</span>
                <span className="font-bold text-lg text-purple-600">
                  {contract.affiliate.commission_amount?.toLocaleString()} ج.م
                </span>
              </div>
              <Alert>
                <AlertDescription className="text-sm">
                  💡 سيتم دفع العمولة خلال 7 أيام من تفعيل العقد والتحقق من الدفع
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
