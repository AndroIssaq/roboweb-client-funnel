import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getContractById } from "@/lib/actions/contract-workflow"
import { ContractViewer } from "@/components/contracts/contract-viewer"
import { createClient } from "@/lib/supabase/server"

export default async function ClientContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contract = await getContractById(id)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!contract || !user) {
    notFound()
  }

  // Verify user is the client
  if (contract.client_id !== user.id) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Button variant="ghost" asChild>
          <Link href="/client/contracts">
            <ArrowLeft className="ml-2" />
            العودة للعقود
          </Link>
        </Button>
      </div>

      <ContractViewer contract={contract} userRole="client" currentUserId={user.id} />
    </div>
  )
}
