"use client"

import Link from "next/link"
import { DataTable } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

interface ClientsTableProps {
  clients: any[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const columns = [
    {
      key: "company_name",
      label: "اسم الشركة",
    },
    {
      key: "email",
      label: "البريد الإلكتروني",
    },
    {
      key: "phone",
      label: "الهاتف",
    },
    {
      key: "industry",
      label: "المجال",
    },
    {
      key: "status",
      label: "الحالة",
      render: (client: any) => (
        <Badge variant={client.status === "active" ? "default" : "secondary"}>
          {client.status === "active" ? "نشط" : "غير نشط"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "الإجراءات",
      render: (client: any) => (
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/clients/${client.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ]

  return <DataTable data={clients} columns={columns} searchKey="company_name" searchPlaceholder="البحث عن عميل..." />
}
