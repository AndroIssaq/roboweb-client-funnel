"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ContractRealtimeMonitorProps {
  contractId: string
  userRole: "admin" | "client" | "affiliate"
}

export function ContractRealtimeMonitor({ contractId, userRole }: ContractRealtimeMonitorProps) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to contract changes
    const contractChannel = supabase
      .channel(`contract-${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${contractId}`,
        },
        () => {
          // Contract was deleted
          toast.error("تم حذف العقد", {
            description: "تم حذف هذا العقد من قبل المسؤول",
            duration: 5000,
          })

          // Redirect based on role
          setTimeout(() => {
            if (userRole === "affiliate") {
              router.push("/affiliate/contracts")
            } else if (userRole === "client") {
              router.push("/client/contracts")
            } else {
              router.push("/admin/contracts")
            }
          }, 2000)
        }
      )
      .subscribe()

    // Subscribe to deletion requests for this contract (for affiliates)
    let deletionChannel: any = null
    if (userRole === "affiliate") {
      deletionChannel = supabase
        .channel(`deletion-request-${contractId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "contract_deletion_requests",
            filter: `contract_id=eq.${contractId}`,
          },
          (payload) => {
            const newStatus = payload.new.status
            const reviewNotes = payload.new.review_notes

            if (newStatus === "approved") {
              toast.success("تمت الموافقة على حذف العقد", {
                description: reviewNotes || "تم قبول طلب حذف العقد",
                duration: 5000,
              })
            } else if (newStatus === "rejected") {
              toast.error("تم رفض طلب حذف العقد", {
                description: reviewNotes || "تم رفض طلب حذف العقد",
                duration: 5000,
              })
              
              // Refresh to update UI
              router.refresh()
            }
          }
        )
        .subscribe()
    }

    return () => {
      supabase.removeChannel(contractChannel)
      if (deletionChannel) {
        supabase.removeChannel(deletionChannel)
      }
    }
  }, [contractId, userRole, router, supabase])

  return null
}
