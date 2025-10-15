import { getDashboardStats } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FolderKanban, FileText, ImageIcon } from "lucide-react"
import { PendingSignaturesCard } from "@/components/dashboard/pending-signatures-card"
import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const statCards = [
    {
      title: "إجمالي العملاء",
      value: stats.totalClients,
      icon: Users,
      description: "عدد العملاء المسجلين",
    },
    {
      title: "المشاريع النشطة",
      value: stats.activeProjects,
      icon: FolderKanban,
      description: "مشاريع قيد التنفيذ",
    },
    {
      title: "إجمالي العقود",
      value: stats.totalContracts,
      icon: FileText,
      description: "عقود موقعة",
    },
    {
      title: "أعمال منشورة",
      value: stats.publishedPortfolio,
      icon: ImageIcon,
      description: "في معرض الأعمال",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">نظرة عامة على النظام</p>
      </div>

      {/* Pending Signatures */}
      {user && <PendingSignaturesCard userId={user.id} userRole="admin" />}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/admin/contracts/new"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">عقد جديد</p>
                <p className="text-sm text-muted-foreground">إنشاء عقد للعميل</p>
              </div>
            </a>
            <a
              href="/admin/projects"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">إدارة المشاريع</p>
                <p className="text-sm text-muted-foreground">عرض وتحديث المشاريع</p>
              </div>
            </a>
            <a
              href="/admin/portfolio"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
            >
              <ImageIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">إضافة للمعرض</p>
                <p className="text-sm text-muted-foreground">نشر عمل جديد</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
