"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { sendContractToClient } from "@/lib/actions/affiliate-contracts"
import { useRouter } from "next/navigation"

interface SendContractButtonProps {
  contractId: string
}

export function SendContractButton({ contractId }: SendContractButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!confirm("هل أنت متأكد من إرسال العقد للعميل؟")) {
      return
    }

    setLoading(true)
    const result = await sendContractToClient(contractId)
    
    if (result.success) {
      alert("تم إرسال العقد للعميل بنجاح!")
      router.refresh()
    } else {
      alert(result.error || "فشل في إرسال العقد")
    }
    setLoading(false)
  }

  return (
    <Button onClick={handleSend} disabled={loading}>
      {loading ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <Send className="ml-2 h-4 w-4" />
      )}
      إرسال للعميل
    </Button>
  )
}
