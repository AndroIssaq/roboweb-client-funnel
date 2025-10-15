# دليل إعداد نظام Roboweb Client Funnel

## المتطلبات الأساسية

- حساب Vercel
- حساب Supabase
- Node.js 18+ مثبت محلياً (للتطوير المحلي)

## خطوات الإعداد

### 1. إعداد قاعدة البيانات (Supabase)

#### أ. إنشاء المشروع
1. سجل الدخول إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. أنشئ مشروع جديد
3. انتظر حتى يكتمل إعداد المشروع

#### ب. تشغيل السكريبتات
قم بتشغيل السكريبتات بالترتيب التالي من SQL Editor في Supabase:

1. **إنشاء الجداول**: `scripts/01-create-database-schema.sql`
2. **إضافة سياسات الأمان**: `scripts/03-add-rls-policies.sql`
3. **إصلاح جدول المستخدمين**: `scripts/04-fix-users-table.sql`
4. **إضافة الدوال**: `scripts/05-fix-schema-and-add-functions.sql`
5. **إصلاح الأعمدة الناقصة**: `scripts/06-fix-missing-columns.sql`
6. **بيانات تجريبية** (اختياري): `scripts/02-seed-demo-data.sql`

#### ج. إنشاء مستخدمين تجريبيين
من Authentication > Users في Supabase Dashboard:

**مستخدم مسؤول:**
- Email: `admin@roboweb.sa`
- Password: اختر كلمة مرور قوية
- User Metadata: `{"role": "admin"}`

**مستخدم عميل:**
- Email: `client@example.sa`
- Password: اختر كلمة مرور
- User Metadata: `{"role": "client"}`

**مستخدم شريك:**
- Email: `affiliate@example.sa`
- Password: اختر كلمة مرور
- User Metadata: `{"role": "affiliate"}`

#### د. إضافة السجلات في جدول users
بعد إنشاء المستخدمين في Auth، قم بإضافة سجلاتهم في جدول `users`:

\`\`\`sql
-- استبدل UUIDs بالمعرفات الفعلية من auth.users
INSERT INTO users (id, email, full_name, phone, role, status)
VALUES 
  ('UUID_من_auth_users', 'admin@roboweb.sa', 'مدير النظام', '+966501234567', 'admin', 'active'),
  ('UUID_من_auth_users', 'client@example.sa', 'أحمد محمد', '+966509876543', 'client', 'active'),
  ('UUID_من_auth_users', 'affiliate@example.sa', 'سارة علي', '+966551234567', 'affiliate', 'active');
\`\`\`

### 2. ربط المشروع بـ Vercel

1. ادفع الكود إلى GitHub
2. استورد المشروع في Vercel
3. أضف متغيرات البيئة من Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (للعمليات الإدارية)
   - `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (للتطوير المحلي)

### 3. التطوير المحلي

\`\`\`bash
# تثبيت الحزم
npm install

# تشغيل السيرفر المحلي
npm run dev
\`\`\`

## هيكل النظام

### الأدوار (Roles)

1. **Admin** - مسؤول النظام
   - إدارة العقود والمشاريع
   - إدارة العملاء والشركاء
   - إدارة معرض الأعمال
   - معالجة المدفوعات

2. **Client** - العميل
   - عرض المشاريع الخاصة
   - تتبع التقدم
   - التواصل مع الفريق
   - استلام التسليمات

3. **Affiliate** - الشريك التسويقي
   - عرض الإحالات
   - تتبع العمولات
   - طلب السحب

### المسارات الرئيسية

- `/` - الصفحة الرئيسية
- `/auth/login` - تسجيل الدخول
- `/auth/sign-up` - التسجيل
- `/admin/*` - لوحة تحكم المسؤول
- `/client/*` - لوحة تحكم العميل
- `/affiliate/*` - لوحة تحكم الشريك
- `/portfolio` - معرض الأعمال (عام)

## الميزات الرئيسية

### 1. نظام العقود
- إنشاء عقود جديدة
- التوقيع الإلكتروني
- تتبع حالة العقد
- ربط بالشركاء التسويقيين

### 2. تأهيل العملاء
- نموذج متعدد الأقسام
- جمع معلومات الشركة
- جمع الأصول والمتطلبات
- تحديد الأهداف والتوقعات

### 3. إدارة المشاريع
- تتبع التقدم
- إدارة التسليمات
- تحديثات الحالة
- سجل الأنشطة

### 4. معرض الأعمال
- عرض المشاريع المكتملة
- تصنيف حسب النوع
- صفحات تفصيلية للمشاريع
- معرض الصور

### 5. نظام الشركاء
- أكواد إحالة فريدة
- تتبع العمولات
- إدارة المدفوعات
- تقارير الأداء

## الأمان

- **RLS (Row Level Security)** مفعل على جميع الجداول
- **التحقق من الصلاحيات** في جميع Server Actions
- **Middleware** للحماية من الوصول غير المصرح
- **التحقق من البريد الإلكتروني** عند التسجيل

## الدعم الفني

للمساعدة أو الإبلاغ عن مشاكل:
- افتح Issue في GitHub
- راسل فريق الدعم

## الترخيص

جميع الحقوق محفوظة © 2025 Roboweb
