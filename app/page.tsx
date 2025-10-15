import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PortfolioShowcase } from "@/components/home/portfolio-showcase"
import { ArrowLeft, Sparkles, Zap, Shield, TrendingUp } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-black dark:via-gray-950 dark:to-black p-6 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-4xl text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm tracking-wider uppercase">
              Roboweb للحلول التقنية
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-black via-emerald-600 to-black dark:from-white dark:via-emerald-400 dark:to-white leading-tight">
            نحول أفكارك إلى واقع رقمي
          </h1>
          
          <p className="text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
            منصة متكاملة لإدارة العقود والمشاريع مع نظام عمولات للشركاء
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-8">
            <Button asChild size="lg" className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-8 py-6 gap-2">
              <Link href="/portfolio">
                <Sparkles className="w-5 h-5" />
                استكشف معرض الأعمال
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
              <Link href="/auth/login">تسجيل الدخول</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-xl">
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2">50+</div>
              <p className="text-gray-600 dark:text-gray-300 font-semibold">مشروع ناجح</p>
            </div>
            <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 shadow-xl">
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2">40+</div>
              <p className="text-gray-600 dark:text-gray-300 font-semibold">عميل سعيد</p>
            </div>
            <div className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl border-2 border-emerald-400 dark:border-emerald-600 shadow-xl">
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-2">95%</div>
              <p className="text-gray-600 dark:text-gray-300 font-semibold">معدل الرضا</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-900 dark:text-white">
              لماذا تختار Roboweb؟
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              نقدم حلول تقنية متكاملة تساعدك على النجاح
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-emerald-50 to-white dark:from-gray-950 dark:to-black rounded-3xl border-2 border-emerald-200 dark:border-emerald-800 hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">إدارة العقود الذكية</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                توقيع إلكتروني آمن وإدارة كاملة للعقود مع تتبع دقيق لكل مرحلة
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-emerald-50 to-white dark:from-gray-950 dark:to-black rounded-3xl border-2 border-emerald-300 dark:border-emerald-700 hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">تتبع المشاريع</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                متابعة دقيقة لحالة المشاريع والتسليمات مع إشعارات فورية
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-emerald-50 to-white dark:from-gray-950 dark:to-black rounded-3xl border-2 border-emerald-400 dark:border-emerald-600 hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 dark:from-emerald-500 dark:to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">نظام العمولات</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                تتبع الإحالات والعمولات للشركاء بشفافية وسهولة تامة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Showcase */}
      <PortfolioShowcase />

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-black via-gray-950 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            جاهز لبدء مشروعك؟
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90">
            انضم إلى عملائنا السعداء واحصل على حل تقني يحقق أهدافك
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="bg-emerald-500 text-white hover:bg-emerald-600 text-lg px-8 py-6">
              <Link href="/portfolio">معرض الأعمال</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-500/10 text-lg px-8 py-6">
              <Link href="/auth/login">ابدأ الآن</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
