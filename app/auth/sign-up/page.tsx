"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Users, UserCog } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [accountType, setAccountType] = useState<"client" | "affiliate">("client")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("كلمات المرور غير متطابقة")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            role: accountType, // Store selected role in metadata
          },
        },
      })

      if (error) throw error

      // If affiliate, create affiliate record
      if (accountType === "affiliate" && data.user) {
        // Generate referral code
        const referralCode = `AFF${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        
        await supabase.from("affiliates").insert({
          user_id: data.user.id,
          referral_code: referralCode,
          commission_rate: 10, // Default 10%
          status: "active",
        })
      }

      router.push("/auth/sign-up-success")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحساب")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">إنشاء حساب جديد</CardTitle>
              <CardDescription className="text-base">أدخل بياناتك لإنشاء حساب جديد</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  {/* Account Type Selection */}
                  <div className="grid gap-3">
                    <Label className="text-right">نوع الحساب</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountType("client")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          accountType === "client"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Users className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium">عميل</p>
                        <p className="text-xs text-muted-foreground">متابعة المشاريع</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("affiliate")}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          accountType === "affiliate"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-border hover:border-blue-500/50"
                        }`}
                      >
                        <UserCog className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-medium">شريك تسويقي</p>
                        <p className="text-xs text-muted-foreground">إحالة العملاء</p>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fullName" className="text-right">
                      الاسم الكامل
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="أحمد محمد"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-right">
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-right">
                      كلمة المرور
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="text-right">
                      تأكيد كلمة المرور
                    </Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
                  </Button>
                </div>
                <div className="mt-6 text-center text-sm">
                  لديك حساب بالفعل؟{" "}
                  <Link href="/auth/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    تسجيل الدخول
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
