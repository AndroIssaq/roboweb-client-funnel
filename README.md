# نظام Roboweb Client Funnel

نظام متكامل لإدارة دورة حياة العملاء من التعاقد حتى التسليم

## الميزات

- ✅ نظام عقود إلكترونية مع التوقيع الرقمي
- ✅ تأهيل العملاء وجمع المتطلبات
- ✅ لوحات تحكم للعملاء والمسؤولين والشركاء
- ✅ تتبع تقدم المشاريع في الوقت الفعلي
- ✅ معرض أعمال عام
- ✅ نظام شركاء تسويقيين مع عمولات
- ✅ واجهة عربية كاملة (RTL)
- ✅ تصميم متجاوب لجميع الأجهزة

## التقنيات المستخدمة

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel
- **Fonts**: Tajawal (Arabic)

## البدء السريع

راجع [دليل الإعداد](docs/setup-guide.md) للتعليمات الكاملة.

\`\`\`bash
# تثبيت الحزم
npm install

# تشغيل السيرفر المحلي
npm run dev
\`\`\`

## الهيكل

\`\`\`
├── app/                    # Next.js App Router
│   ├── admin/             # لوحة تحكم المسؤول
│   ├── client/            # لوحة تحكم العميل
│   ├── affiliate/         # لوحة تحكم الشريك
│   ├── auth/              # صفحات المصادقة
│   └── portfolio/         # معرض الأعمال
├── components/            # مكونات React
│   ├── contract/         # مكونات العقود
│   ├── dashboard/        # مكونات لوحات التحكم
│   ├── onboarding/       # مكونات التأهيل
│   ├── portfolio/        # مكونات المعرض
│   └── ui/               # مكونات shadcn/ui
├── lib/                   # المكتبات والأدوات
│   ├── actions/          # Server Actions
│   └── supabase/         # إعداد Supabase
├── scripts/              # سكريبتات SQL
└── docs/                 # التوثيق
\`\`\`

## المساهمة

نرحب بالمساهمات! يرجى فتح Issue أو Pull Request.

## الترخيص

جميع الحقوق محفوظة © 2025 Roboweb
