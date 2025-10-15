# 🚨 إصلاح سريع - عمود link مفقود

## المشكلة:
```
Error creating notification: {
  message: "Could not find the 'link' column of 'notifications' in the schema cache"
}
```

**السبب**: جدول `notifications` ناقص أعمدة!

---

## ✅ الحل السريع:

### **استخدم هذا الملف**: `scripts/28-add-missing-columns.sql`

### **الخطوات**:

1. **افتح Supabase SQL Editor**

2. **انسخ والصق**:
```sql
-- Add missing columns to notifications table

-- Add link column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

-- Add related_id column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Add read_at column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Rename is_read to read if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
  END IF;
END $$;

-- Add read column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

-- Success message
SELECT 'All missing columns added successfully!' as status;
```

3. **اضغط Run**

4. **يجب أن ترى**:
```
All missing columns added successfully!
```

---

## 🎯 الأعمدة المطلوبة:

### **جدول notifications يجب أن يحتوي على**:
```sql
- id (UUID)
- user_id (UUID)
- title (TEXT)
- message (TEXT)
- type (TEXT)
- link (TEXT)           ← مفقود!
- related_id (UUID)     ← مفقود!
- read (BOOLEAN)
- read_at (TIMESTAMPTZ) ← مفقود!
- created_at (TIMESTAMPTZ)
```

---

## ✅ بعد تطبيق SQL:

### **1. تحقق من الأعمدة**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
```

يجب أن ترى جميع الأعمدة ✅

### **2. أعد تشغيل السيرفر**:
```bash
npm run dev
```

### **3. اختبر الإشعارات**:
```
1. أنشئ عقد جديد
2. يجب أن تصل الإشعارات ✅
3. لا error في Console ✅
```

---

## 🔍 التحقق:

### **في Supabase Dashboard**:
```
1. افتح Table Editor
2. اختر جدول notifications
3. يجب أن ترى:
   ✅ link
   ✅ related_id
   ✅ read_at
   ✅ read (وليس is_read)
```

---

## 📋 ملفات SQL المتاحة:

### **للإصلاح السريع** (استخدم هذا الآن):
```
scripts/28-add-missing-columns.sql
```

### **للإصلاح الكامل** (بعد الإصلاح السريع):
```
scripts/27-safe-fix.sql
```

---

## ⚠️ ملاحظة مهمة:

إذا كان جدول `notifications` موجود بالفعل لكن ناقص أعمدة:
- ✅ استخدم `28-add-missing-columns.sql` أولاً
- ✅ ثم استخدم `27-safe-fix.sql` للإصلاحات الأخرى

إذا كان جدول `notifications` غير موجود:
- ✅ استخدم `27-safe-fix.sql` مباشرة

---

**طبق SQL وجرب! 🚀**
