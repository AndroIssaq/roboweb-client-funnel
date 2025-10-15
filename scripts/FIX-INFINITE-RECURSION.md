# إصلاح مشكلة Infinite Recursion في RLS Policies

## المشكلة
عند محاولة قراءة بيانات المستخدمين، يظهر الخطأ:
```
infinite recursion detected in policy for relation "users"
```

## السبب
السياسات (RLS Policies) على جدول `users` كانت تحاول قراءة نفس الجدول للتحقق من دور المستخدم (admin)، مما يسبب تكرار لا نهائي.

## الحل
استخدام **Security Definer Function** التي تتجاوز RLS عند التحقق من دور المستخدم.

## خطوات التطبيق

### الطريقة 1: عبر Supabase Dashboard (موصى بها)

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ محتوى ملف `07-fix-rls-infinite-recursion.sql`
5. الصق المحتوى في المحرر
6. اضغط **Run** أو **F5**

### الطريقة 2: عبر Supabase CLI

```bash
# تأكد من تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref your-project-ref

# تطبيق الملف
supabase db push --file scripts/07-fix-rls-infinite-recursion.sql
```

## التحقق من نجاح الإصلاح

بعد تطبيق الإصلاح:
1. أعد تحميل الصفحة
2. جرب تسجيل الدخول
3. يجب أن تختفي رسالة الخطأ
4. يجب أن يتم التوجيه إلى لوحة التحكم بنجاح

## ملاحظات مهمة

- هذا الإصلاح يحذف السياسات القديمة ويستبدلها بسياسات جديدة آمنة
- الـ function `is_admin()` تستخدم `SECURITY DEFINER` لتجاوز RLS بشكل آمن
- لن تحتاج لتشغيل هذا الملف مرة أخرى إلا إذا أعدت إنشاء قاعدة البيانات
