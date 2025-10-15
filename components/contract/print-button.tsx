"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Download className="ml-2" />
      تحميل PDF
    </Button>
  )
}
