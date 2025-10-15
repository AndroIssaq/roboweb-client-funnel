"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils/date"
import Image from "next/image"

interface SignatureData {
  admin_signature_data?: string
  admin_signature_date?: string
  admin_signed_by?: string
  client_signature_data?: string
  client_signature_date?: string
  workflow_status?: string
  admin?: { full_name: string }
  client?: { full_name: string }
}

interface SignaturesDisplayProps {
  contractId: string
  initialData: SignatureData
  showSignaturePad?: boolean
  userRole?: "admin" | "client" | "affiliate"
}

export function SignaturesDisplay({ 
  contractId, 
  initialData,
  showSignaturePad = false,
  userRole
}: SignaturesDisplayProps) {
  const [signatureData, setSignatureData] = useState<SignatureData>(initialData)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to contract changes
    const channel = supabase
      .channel(`contract-signatures-${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${contractId}`,
        },
        async (payload) => {
          console.log("🔔 Signature update received:", payload)
          
          // Fetch updated signature data
          const { data: contractData } = await supabase
            .from("contracts")
            .select(
              `
              admin_signature_data,
              admin_signature_date,
              admin_signed_by,
              client_signature_data,
              client_signature_date,
              workflow_status,
              client_id
            `
            )
            .eq("id", contractId)
            .single()

          if (contractData) {
            // Fetch admin name if exists
            let adminName = null
            if (contractData.admin_signed_by) {
              const { data: adminData } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", contractData.admin_signed_by)
                .single()
              adminName = adminData
            }

            // Fetch client name if exists
            let clientName = null
            if (contractData.client_id) {
              const { data: clientData } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", contractData.client_id)
                .single()
              clientName = clientData
            }

            const updatedData = {
              ...contractData,
              admin: adminName || undefined,
              client: clientName || undefined,
            }

            console.log("✅ Updated signature data:", updatedData)
            setSignatureData(updatedData)
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [contractId, supabase])

  const isCompleted = signatureData.workflow_status === "completed"
  const hasAdminSignature = !!signatureData.admin_signature_data
  const hasClientSignature = !!signatureData.client_signature_data

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">حالة التوقيعات</h3>
        {isCompleted ? (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 ml-1" />
            مكتمل
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 ml-1" />
            في انتظار التوقيع
          </Badge>
        )}
      </div>

      {/* Signatures Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Admin Signature */}
        <Card className={hasAdminSignature ? "border-green-500" : "border-dashed"}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              توقيع المسؤول
              {hasAdminSignature && (
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasAdminSignature ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-2 bg-white">
                  <Image
                    src={signatureData.admin_signature_data!}
                    alt="توقيع المسؤول"
                    width={300}
                    height={100}
                    className="w-full h-24 object-contain"
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {signatureData.admin?.full_name && (
                    <p>الموقع: {signatureData.admin.full_name}</p>
                  )}
                  {signatureData.admin_signature_date && (
                    <p>التاريخ: {formatDate(signatureData.admin_signature_date)}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">في انتظار توقيع المسؤول</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Signature */}
        <Card className={hasClientSignature ? "border-green-500" : "border-dashed"}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              توقيع العميل
              {hasClientSignature && (
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-auto" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasClientSignature ? (
              <div className="space-y-2">
                <div className="border rounded-lg p-2 bg-white">
                  <Image
                    src={signatureData.client_signature_data!}
                    alt="توقيع العميل"
                    width={300}
                    height={100}
                    className="w-full h-24 object-contain"
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {signatureData.client?.full_name && (
                    <p>الموقع: {signatureData.client.full_name}</p>
                  )}
                  {signatureData.client_signature_date && (
                    <p>التاريخ: {formatDate(signatureData.client_signature_date)}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">في انتظار توقيع العميل</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Status Message */}
      {!isCompleted && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              {!hasAdminSignature && !hasClientSignature && (
                <>⏳ في انتظار توقيع المسؤول والعميل</>
              )}
              {hasAdminSignature && !hasClientSignature && (
                <>⏳ تم توقيع المسؤول، في انتظار توقيع العميل</>
              )}
              {!hasAdminSignature && hasClientSignature && (
                <>⏳ تم توقيع العميل، في انتظار توقيع المسؤول</>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {isCompleted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              ✅ تم توقيع العقد من جميع الأطراف - العقد نشط الآن
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
