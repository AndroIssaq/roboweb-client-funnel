import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentClient } from "@/lib/actions/onboarding"
import { getClientProjects } from "@/lib/actions/projects"
import { ProjectStatusCard } from "@/components/dashboard/project-status-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { PendingSignaturesCard } from "@/components/dashboard/pending-signatures-card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle2, TrendingUp, LogOut } from "lucide-react"
import Link from "next/link"
import { logout } from "@/lib/actions/auth"

export default async function ClientDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const client = await getCurrentClient()

  if (!client) {
    redirect("/auth/login")
  }

  const projects = await getClientProjects(client.id)

  // Calculate stats
  const activeProjects = projects.filter((p) => p.status === "in_progress").length
  const completedProjects = projects.filter((p) => p.status === "completed" || p.status === "delivered").length
  const avgProgress =
    projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress_percentage, 0) / projects.length) : 0

  // Mock notifications - replace with real data later
  const notifications = [
    {
      id: "1",
      type: "completed",
      title: "تم إكمال مرحلة التصميم",
      description: "تم الانتهاء من تصميم الواجهات الرئيسية",
      timestamp: "2025-10-12T10:00:00.000Z",
    },
    {
      id: "2",
      type: "pending",
      title: "في انتظار المراجعة",
      description: "يرجى مراجعة التصميم المقترح",
      timestamp: "2025-10-11T10:00:00.000Z",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً، {client.user.full_name}</h1>
            <p className="text-muted-foreground">تابع تقدم مشاريعك وآخر التحديثات</p>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </form>
        </div>

        {/* Pending Signatures */}
        {user && <PendingSignaturesCard userId={user.id} userRole="client" />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard title="إجمالي المشاريع" value={projects.length} icon={FileText} />
          <StatsCard title="المشاريع النشطة" value={activeProjects} icon={Clock} />
          <StatsCard title="المشاريع المكتملة" value={completedProjects} icon={CheckCircle2} />
          <StatsCard title="متوسط التقدم" value={`${avgProgress}%`} icon={TrendingUp} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">مشاريعك</h2>
              {client.contract && (
                <Button variant="outline" asChild>
                  <Link href={`/admin/contracts/${client.contract.id}`}>عرض العقد</Link>
                </Button>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد مشاريع حالياً</p>
                {!client.onboarding_completed && (
                  <Button asChild className="mt-4">
                    <Link href="/client/onboarding">إكمال نموذج التأهيل</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <ProjectStatusCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ActivityFeed activities={notifications} />

            {/* Contract Info */}
            {client.contract && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-semibold mb-2">معلومات العقد</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">رقم العقد:</span> {client.contract.contract_number}
                  </p>
                  <p>
                    <span className="text-muted-foreground">المبلغ:</span>{" "}
                    {Number(client.contract.total_amount).toLocaleString("ar-EG")} ج.م
                  </p>
                  <p>
                    <span className="text-muted-foreground">الحالة:</span> {client.contract.status}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
