import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AffiliateContractForm } from "@/components/affiliate/affiliate-contract-form"

export default async function NewAffiliateContractPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get affiliate info
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (!affiliate) {
    redirect("/")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">عقد جديد</h1>
        <p className="text-muted-foreground">إنشاء عقد جديد لعميل</p>
      </div>

      <AffiliateContractForm affiliateId={user.id} />
    </div>
  )
}
