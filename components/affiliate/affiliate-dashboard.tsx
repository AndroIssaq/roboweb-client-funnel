"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, TrendingUp, Clock } from "lucide-react"

interface AffiliateDashboardProps {
  stats: {
    totalReferrals: number
    totalRevenue: number
    totalPaid: number
    totalPending: number
    totalEarnings: number
  }
}

export function AffiliateDashboard({ stats }: AffiliateDashboardProps) {
  const statCards = [
    {
      title: "إجمالي الإحالات",
      value: stats.totalReferrals,
      icon: Users,
      description: "عدد العملاء المحالين",
    },
    {
      title: "إجمالي الأرباح",
      value: `${stats.totalEarnings.toLocaleString("ar-EG")} ج.م`,
      icon: TrendingUp,
      description: "العمولات المكتسبة",
    },
    {
      title: "المدفوعات المستلمة",
      value: `${stats.totalPaid.toLocaleString("ar-EG")} ج.م`,
      icon: DollarSign,
      description: "المبالغ المدفوعة",
    },
    {
      title: "قيد الانتظار",
      value: `${stats.totalPending.toLocaleString("ar-EG")} ج.م`,
      icon: Clock,
      description: "في انتظار الدفع",
    },
  ]

  return (
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
  )
}
