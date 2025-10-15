"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ContractForm } from "@/components/contract/contract-form"
import { ContractPreview } from "@/components/contract/contract-preview"
import { SignaturePad } from "@/components/contract/signature-pad"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileCheck } from "lucide-react"
import Link from "next/link"
import { createContract } from "@/lib/actions/contracts"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Step = "form" | "preview" | "signature" | "complete"

export default function NewContractPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<Step>("form")
  const [contractData, setContractData] = useState<any>(null)
  const [signatureData, setSignatureData] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")

  const handleFormSubmit = (data: any) => {
    setError("")
    // Generate contract number for preview
    const contractNumber = `RW-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`

    const contract = {
      contractNumber,
      ...data,
      remainingAmount: (Number(data.totalAmount) - Number(data.depositAmount)).toString(),
      createdAt: new Date().toISOString(),
      terms: [
        "يلتزم الطرف الأول (روبوويب) بتقديم الخدمة المتفق عليها وفقاً للمواصفات المحددة",
        "يلتزم الطرف الثاني (العميل) بدفع المبالغ المستحقة في المواعيد المحددة",
        "مدة التسليم المتوقعة: 30 يوم عمل من تاريخ استلام جميع المتطلبات",
        "يحق للعميل طلب 3 مراجعات مجانية على التصميم النهائي",
        "يتم تقديم دعم فني مجاني لمدة 6 أشهر بعد التسليم",
        "في حالة إلغاء العقد، لا يسترد العربون المدفوع",
        "جميع حقوق الملكية الفكرية تنتقل للعميل بعد سداد كامل المبلغ",
      ],
    }

    setContractData(contract)
    setStep("preview")
  }

  const handleSignatureSave = async (signature: string) => {
    setSignatureData(signature)
    setIsSubmitting(true)
    setError("")

    try {
      const result = await createContract(contractData, signature)

      if (result.error) {
        setError(result.error)
        toast({
          title: "خطأ",
          description: result.error,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء العقد رقم ${result.contractNumber}`,
      })

      setStep("complete")
    } catch (err) {
      const errorMessage = "حدث خطأ غير متوقع"
      setError(errorMessage)
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild>
            <Link href="/admin/contracts">
              <ArrowLeft className="ml-2" />
              العودة للعقود
            </Link>
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "form" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">إنشاء عقد جديد</h1>
              <p className="text-muted-foreground">أدخل بيانات العقد والعميل</p>
            </div>
            <ContractForm onSubmit={handleFormSubmit} />
          </div>
        )}

        {step === "preview" && contractData && (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">معاينة العقد</h1>
              <p className="text-muted-foreground">تأكد من صحة البيانات قبل المتابعة</p>
            </div>

            <ContractPreview contract={contractData} />

            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setStep("form")}>
                تعديل البيانات
              </Button>
              <Button onClick={() => setStep("signature")}>المتابعة للتوقيع</Button>
            </div>
          </div>
        )}

        {step === "signature" && (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">التوقيع الإلكتروني</h1>
              <p className="text-muted-foreground">يرجى التوقيع لإتمام العقد</p>
            </div>

            <SignaturePad onSave={handleSignatureSave} onCancel={() => setStep("preview")} disabled={isSubmitting} />
            {isSubmitting && <p className="text-center text-muted-foreground">جاري حفظ العقد...</p>}
          </div>
        )}

        {step === "complete" && contractData && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                  <FileCheck className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">تم إنشاء العقد بنجاح!</h1>
              <p className="text-muted-foreground mb-8">رقم العقد: {contractData.contractNumber}</p>

              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/admin/contracts">عرض جميع العقود</Link>
                </Button>
                <Button onClick={() => window.print()}>طباعة العقد</Button>
              </div>
            </div>

            <ContractPreview contract={contractData} showSignature signatureData={signatureData} />
          </div>
        )}
      </div>
    </div>
  )
}
