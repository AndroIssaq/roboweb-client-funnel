"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileImage, CheckCircle, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"

interface IdCardUploadProps {
  contractId: string
  userRole: "admin" | "client"
  currentUserId: string
  existingCardUrl?: string
  onUploadComplete?: () => void
}

export function IdCardUpload({
  contractId,
  userRole,
  currentUserId,
  existingCardUrl,
  onUploadComplete,
}: IdCardUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingCardUrl || null)
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة فقط")
      return
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت")
      return
    }

    setFile(selectedFile)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const supabase = createClient()

      // Upload to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${currentUserId}/${contractId}-${userRole}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("id-cards")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("id-cards")
        .getPublicUrl(fileName)

      // Update contract
      const updateField = userRole === "admin" ? "admin_id_card_url" : "client_id_card_url"
      const updateDateField = userRole === "admin" ? "admin_id_card_uploaded_at" : "client_id_card_uploaded_at"

      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          [updateField]: publicUrl,
          [updateDateField]: new Date().toISOString(),
        })
        .eq("id", contractId)

      if (updateError) throw updateError

      toast.success("تم رفع صورة البطاقة بنجاح")
      setFile(null)
      onUploadComplete?.()
    } catch (error: any) {
      console.error("Error uploading ID card:", error)
      toast.error(error.message || "فشل رفع الصورة")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setPreviewUrl(existingCardUrl || null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          {userRole === "admin" ? "صورة بطاقة المسؤول" : "صورة بطاقة العميل"}
        </CardTitle>
        <CardDescription>
          {userRole === "admin" 
            ? "يرجى رفع صورة بطاقة الهوية الوطنية للمسؤول"
            : "يرجى رفع صورة بطاقة الهوية الوطنية"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
              <Image
                src={previewUrl}
                alt="ID Card Preview"
                fill
                className="object-contain"
              />
            </div>
            
            {existingCardUrl && !file ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>تم رفع البطاقة</span>
              </div>
            ) : file ? (
              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                  {uploading ? "جاري الرفع..." : "رفع الصورة"}
                </Button>
                <Button onClick={handleRemove} variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <label htmlFor={`id-card-${userRole}`} className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  اضغط لاختيار صورة البطاقة
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG (حد أقصى 5MB)
                </p>
                <input
                  id={`id-card-${userRole}`}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
