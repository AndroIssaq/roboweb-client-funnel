import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Calendar, DollarSign } from "lucide-react"
import { formatDate } from "@/lib/utils/date"
import Link from "next/link"

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending_signature: "بانتظار التوقيع",
  signed: "موقع",
  active: "نشط",
  completed: "مكتمل",
  cancelled: "ملغي",
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_signature: "bg-yellow-100 text-yellow-800",
  signed: "bg-green-100 text-green-800",
  active: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

const workflowLabels: Record<string, string> = {
  pending_admin_signature: "بانتظار توقيع Roboweb",
  pending_client_signature: "بانتظار توقيعك",
  completed: "مكتمل",
}

export default async function ClientContractsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get client's contracts
  const { data: contracts } = await supabase
    .from("contracts")
    .select(`
      *,
      affiliate:users!contracts_affiliate_id_fkey(full_name)
    `)
    .eq("client_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">عقودي</h1>
        <p className="text-muted-foreground">جميع العقود الخاصة بك</p>
      </div>

      {!contracts || contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد عقود حالياً</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {contracts.map((contract: any) => (
            <Card key={contract.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {contract.contract_number}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {contract.service_type} - {contract.package_name}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge className={statusColors[contract.status]}>
                      {statusLabels[contract.status]}
                    </Badge>
                    {contract.workflow_status && (
                      <Badge variant="outline" className="text-xs">
                        {workflowLabels[contract.workflow_status] || contract.workflow_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">المبلغ الإجمالي</p>
                      <p className="font-semibold">{Number(contract.total_amount).toLocaleString("ar-EG")} ج.م</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">العربون</p>
                      <p className="font-semibold">{Number(contract.deposit_amount).toLocaleString("ar-EG")} ج.م</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">تاريخ الإنشاء</p>
                      <p className="font-semibold">{formatDate(contract.created_at)}</p>
                    </div>
                  </div>
                </div>

                {contract.affiliate && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">تم الإحالة بواسطة</p>
                    <p className="text-sm font-medium">{contract.affiliate.full_name}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/client/contracts/${contract.id}`}>عرض العقد</Link>
                  </Button>
                  
                  {contract.workflow_status === "pending_client_signature" && (
                    <Button size="sm" asChild>
                      <Link href={`/client/contracts/${contract.id}`}>
                        توقيع العقد الآن
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
