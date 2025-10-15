import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getContractById } from "@/lib/actions/contract-workflow"
import { ContractViewer } from "@/components/contracts/contract-viewer"
import { DeleteContractButton } from "@/components/admin/delete-contract-button"
import { createClient } from "@/lib/supabase/server"

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contract = await getContractById(id)
  
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!contract || !user) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/contracts">
            <ArrowLeft className="ml-2" />
            العودة للعقود
          </Link>
        </Button>
        
        <DeleteContractButton contractId={contract.id} contractNumber={contract.contract_number} />
      </div>

      <ContractViewer contract={contract} userRole="admin" currentUserId={user.id} />
    </div>
  )
}
