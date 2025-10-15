"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileSignature, ArrowRight, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { formatDate } from "@/lib/utils/date"

interface PendingSignature {
  id: string
  contract_number: string
  service_type: string
  total_amount: number
  created_at: string
  workflow_status: string
  client?: { full_name: string }
}

interface PendingSignaturesCardProps {
  userId: string
  userRole: "admin" | "client"
}

export function PendingSignaturesCard({ userId, userRole }: PendingSignaturesCardProps) {
  const [contracts, setContracts] = useState<PendingSignature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchPendingContracts = async () => {
      console.log("📋 Fetching pending signatures for:", userRole, userId)
      
      let query = supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          service_type,
          total_amount,
          created_at,
          workflow_status,
          client_id
        `)

      if (userRole === "admin") {
        // Admin: contracts waiting for admin signature
        query = query.eq("workflow_status", "pending_admin_signature")
      } else {
        // Client: contracts waiting for client signature
        query = query
          .eq("workflow_status", "pending_client_signature")
          .eq("client_id", userId)
      }

      const { data: contractsData, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching pending contracts:", error)
        setLoading(false)
        return
      }

      // Fetch client names separately
      const contractsWithClients = await Promise.all(
        (contractsData || []).map(async (contract) => {
          if (contract.client_id) {
            const { data: clientData } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", contract.client_id)
              .single()
            
            return {
              ...contract,
              client: clientData || undefined,
            }
          }
          return contract
        })
      )

      console.log("✅ Pending contracts:", contractsWithClients)
      setContracts(contractsWithClients as PendingSignature[])
      setLoading(false)
    }

    fetchPendingContracts()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`pending-signatures-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
        },
        (payload) => {
          console.log("🔔 Contract change received:", payload)
          fetchPendingContracts()
        }
      )
      .subscribe((status) => {
        console.log("📡 Pending signatures subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, userRole])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            عقود تحتاج توقيعك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        </CardContent>
      </Card>
    )
  }

  if (contracts.length === 0) {
    return null // Don't show card if no pending signatures
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-900">عقود تحتاج توقيعك</CardTitle>
          </div>
          <Badge variant="destructive" className="bg-orange-600">
            {contracts.length}
          </Badge>
        </div>
        <CardDescription className="text-orange-700">
          يرجى مراجعة العقود التالية والتوقيع عليها
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">عقد رقم {contract.contract_number}</h4>
                <Badge variant="outline" className="text-xs">
                  {contract.service_type}
                </Badge>
              </div>
              {contract.client && (
                <p className="text-xs text-muted-foreground mb-1">
                  العميل: {contract.client.full_name}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(contract.created_at)}
                </span>
                <span className="font-medium text-orange-600">
                  {contract.total_amount.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Link href={userRole === "admin" ? `/admin/contracts/${contract.id}` : `/client/contracts/${contract.id}`}>
                توقيع الآن
                <ArrowRight className="h-4 w-4 mr-2" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
