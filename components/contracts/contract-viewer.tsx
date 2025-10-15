"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, CheckCircle, Clock, Download, AlertCircle, Pen, Printer } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import { SignatureCanvas } from "./signature-canvas"
import { IdCardUpload } from "./id-card-upload"
import { signContractAsAdmin, signContractAsClient, logContractView } from "@/lib/actions/contract-workflow"
import { downloadContractPDFMake } from "@/lib/pdf/contract-pdfmake"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getSupabaseClient } from "@/lib/supabase/client-singleton"

interface ContractViewerProps {
  contract: any
  userRole: "admin" | "client" | "affiliate"
  currentUserId: string
}

export function ContractViewer({ contract, userRole, currentUserId }: ContractViewerProps) {
  const [showSignature, setShowSignature] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Log view activity
    logContractView(contract.id)
  }, [contract.id])

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = getSupabaseClient()
    
    const channel = supabase
      .channel(`contract:${contract.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${contract.id}`,
        },
        (payload) => {
          console.log("Contract updated:", payload)
          toast.info("تم تحديث العقد")
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [contract.id, router])

  const getStatusBadge = () => {
    switch (contract.workflow_status) {
      case "draft":
        return <Badge variant="secondary">مسودة</Badge>
      case "pending_admin_signature":
        return (
          <Badge variant="default" className="bg-yellow-500">
            في انتظار توقيع المسؤول
          </Badge>
        )
      case "pending_client_signature":
        return (
          <Badge variant="default" className="bg-blue-500">
            في انتظار توقيع العميل
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            مكتمل
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">ملغي</Badge>
      default:
        return <Badge variant="secondary">{contract.workflow_status}</Badge>
    }
  }

  const canSign = () => {
    if (userRole === "admin") {
      return !contract.admin_signature_data && (contract.workflow_status === "draft" || contract.workflow_status === "pending_admin_signature")
    } else {
      return (
        !contract.client_signature_data &&
        contract.admin_signature_data &&
        contract.workflow_status === "pending_client_signature" &&
        contract.client_id === currentUserId
      )
    }
  }

  const handleSign = async (signatureData: string) => {
    setIsSigning(true)
    try {
      const result =
        userRole === "admin"
          ? await signContractAsAdmin(contract.id, signatureData)
          : await signContractAsClient(contract.id, signatureData)

      if (result.success) {
        toast.success(result.message)
        setShowSignature(false)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء التوقيع")
    } finally {
      setIsSigning(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const contractData = {
        contractNumber: contract.contract_number,
        clientName: contract.client?.full_name || "",
        clientEmail: contract.client?.email || "",
        clientPhone: contract.client?.phone || "",
        serviceType: contract.service_type,
        packageName: contract.package_name,
        totalAmount: contract.total_amount,
        depositAmount: contract.deposit_amount,
        remainingAmount: contract.remaining_amount,
        paymentMethod: contract.payment_method,
        contractTerms: contract.contract_terms,
        createdAt: contract.created_at,
        adminSignature: contract.admin_signature_data,
        adminSignatureDate: contract.admin_signature_date,
        adminSignedBy: contract.admin_signer?.full_name,
        clientSignature: contract.client_signature_data,
        clientSignatureDate: contract.client_signature_date,
        adminIdCard: contract.admin_id_card_url,
        clientIdCard: contract.client_id_card_url,
      }

      await downloadContractPDFMake(contractData)
      toast.success("تم تحميل العقد بنجاح")
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast.error("فشل تحميل العقد")
    }
  }

  const handlePrint = () => {
    try {
      window.print()
      toast.success("جاري الطباعة...")
    } catch (error) {
      console.error("Error printing:", error)
      toast.error("فشلت عملية الطباعة")
    }
  }

  if (showSignature) {
    return (
      <SignatureCanvas
        onSave={handleSign}
        onCancel={() => setShowSignature(false)}
        title={userRole === "admin" ? "توقيع المسؤول" : "توقيع العميل"}
        description="يرجى التوقيع في المربع أدناه لإتمام العملية"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">عقد رقم {contract.contract_number}</CardTitle>
              </div>
              <CardDescription>تاريخ الإنشاء: {formatDate(contract.created_at)}</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
      </Card>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل العقد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">العميل</p>
              <p className="font-medium">{contract.client?.full_name}</p>
              <p className="text-sm text-muted-foreground">{contract.client?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نوع الخدمة</p>
              <p className="font-medium">{contract.service_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الباقة</p>
              <p className="font-medium">{contract.package_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
              <p className="font-medium text-lg">{contract.total_amount.toLocaleString("ar-EG")} ج.م</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الدفعة المقدمة (50%)</p>
              <p className="font-medium text-lg text-primary">{contract.deposit_amount.toLocaleString("ar-EG")} ج.م</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المبلغ المتبقي</p>
              <p className="font-medium">{contract.remaining_amount.toLocaleString("ar-EG")} ج.م</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card>
        <CardHeader>
          <CardTitle>شروط وأحكام العقد</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {contract.contract_terms?.terms?.map((term: string, index: number) => (
              <li key={index} className="text-sm">
                {index + 1}. {term}
              </li>
            ))}
          </ul>
          {contract.contract_terms?.notes && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">ملاحظات إضافية:</p>
              <p className="text-sm">{contract.contract_terms.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توقيع Roboweb</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.admin_signature_data ? (
              <div className="space-y-3">
                <div className="border rounded-lg p-4 bg-white">
                  <img src={contract.admin_signature_data} alt="Admin Signature" className="h-24 mx-auto" />
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">تم التوقيع</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  التاريخ: {formatDate(contract.admin_signature_date)}
                </p>
                {contract.admin_signer && <p className="text-xs text-muted-foreground">الموقع: {contract.admin_signer.full_name}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">في انتظار التوقيع</p>
                </div>
                {userRole === "admin" && canSign() && (
                  <Button onClick={() => setShowSignature(true)} className="w-full gap-2" disabled={isSigning}>
                    <Pen className="h-4 w-4" />
                    التوقيع الآن
                  </Button>
                )}
                {userRole === "affiliate" && (
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">سيتم التوقيع من قبل المسؤول</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Signature */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">توقيع العميل</CardTitle>
          </CardHeader>
          <CardContent>
            {contract.client_signature_data ? (
              <div className="space-y-3">
                <div className="border rounded-lg p-4 bg-white">
                  <img src={contract.client_signature_data} alt="Client Signature" className="h-24 mx-auto" />
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">تم التوقيع</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  التاريخ: {formatDate(contract.client_signature_date)}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">في انتظار التوقيع</p>
                </div>
                {userRole === "client" && canSign() && (
                  <Button onClick={() => setShowSignature(true)} className="w-full gap-2" disabled={isSigning}>
                    <Pen className="h-4 w-4" />
                    التوقيع الآن
                  </Button>
                )}
                {userRole === "affiliate" && (
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">سيتم التوقيع من قبل العميل</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ID Cards Section - Show after both signatures */}
      {contract.admin_signature_data && contract.client_signature_data && (
        <div className="space-y-6">
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">صور البطاقات الشخصية</h3>
            <p className="text-sm text-muted-foreground mb-6">
              يرجى رفع صور بطاقات الهوية الوطنية لإتمام العقد
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Admin ID Card - Always show and pre-uploaded */}
            <IdCardUpload
              contractId={contract.id}
              userRole="admin"
              currentUserId={currentUserId}
              existingCardUrl={contract.admin_id_card_url}
              onUploadComplete={() => router.refresh()}
            />

            {/* Client ID Card - Show for client to upload */}
            <IdCardUpload
              contractId={contract.id}
              userRole="client"
              currentUserId={currentUserId}
              existingCardUrl={contract.client_id_card_url}
              onUploadComplete={() => router.refresh()}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Download and Print Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button onClick={handleDownloadPDF} variant="outline" className="gap-2 w-full">
                <Download className="h-4 w-4" />
                تحميل PDF
              </Button>
              <Button onClick={handlePrint} variant="default" className="gap-2 w-full print-button">
                <Printer className="h-4 w-4" />
                {userRole === "admin" && "طباعة نسخة المسؤول"}
                {userRole === "client" && "طباعة نسخة العميل"}
                {userRole === "affiliate" && "طباعة نسخة الشريك"}
              </Button>
            </div>

            {/* Role-specific info */}
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">
                {userRole === "admin" && "💼 أنت تشاهد العقد كـ: مسؤول (Roboweb)"}
                {userRole === "client" && "👤 أنت تشاهد العقد كـ: عميل"}
                {userRole === "affiliate" && "🤝 أنت تشاهد العقد كـ: شريك تسويقي"}
              </p>
            </div>

            {contract.workflow_status === "completed" && (
              <Badge variant="default" className="bg-green-500 text-white px-4 py-2 w-full justify-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                العقد مكتمل ومُوقّع من الطرفين
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
