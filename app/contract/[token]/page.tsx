import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ContractViewer } from "@/components/contracts/contract-viewer"

export default async function PublicContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // Get contract by token
  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("contract_link_token", token)
    .single()

  if (error || !contract) {
    notFound()
  }

  // Get client user ID for ContractViewer
  const clientUserId = contract.client_id

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">عقد خدمات - Roboweb</h1>
          <p className="text-muted-foreground">رقم العقد: {contract.contract_number}</p>
        </div>

        <ContractViewer contract={contract} userRole="client" currentUserId={clientUserId} />
      </div>
    </div>
  )
}
