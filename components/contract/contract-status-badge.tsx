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
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export function ContractStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {statusLabels[status] || status}
    </span>
  )
}
