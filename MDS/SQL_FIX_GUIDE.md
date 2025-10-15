# 🔧 دليل إصلاح قاعدة البيانات

## المشكلة:
```
Error: relation "notifications" is already member of publication "supabase_realtime"
```

## الحل:

### **استخدم الملف الجديد: `scripts/27-safe-fix.sql`**

هذا الملف يتعامل مع جميع الحالات:
- ✅ يتحقق قبل إضافة الجدول للـ publication
- ✅ يتعامل مع `is_read` و `read`
- ✅ يضيف policies بأمان
- ✅ يعرض رسائل نجاح

---

## 📋 الخطوات:

### **1. افتح Supabase SQL Editor**:
```
Dashboard → SQL Editor → New Query
```

### **2. انسخ محتوى الملف**:
```
scripts/27-safe-fix.sql
```

### **3. الصق في SQL Editor**

### **4. اضغط Run**

### **5. يجب أن ترى**:
```
✅ All fixes applied successfully!
✅ Notifications table updated
✅ Realtime enabled
✅ Contract workflow columns added
✅ Contract activities table ready
```

---

## 🎯 ما يفعله الكود:

### **1. إصلاح جدول notifications**:
```sql
-- يحول is_read → read
-- يضيف read إذا لم يكن موجود
-- يحدث الـ index
```

### **2. تفعيل Realtime**:
```sql
-- يتحقق أولاً إذا كان موجود
-- يضيف فقط إذا لم يكن موجود
-- لا يعطي error
```

### **3. إضافة أعمدة workflow**:
```sql
-- workflow_status
-- admin_signature_data
-- client_signature_data
-- pdf_url
-- contract_link_token
```

### **4. جدول contract_activities**:
```sql
-- لتتبع جميع الأنشطة
-- مع RLS policies
```

---

## ✅ التحقق من النجاح:

### **1. تحقق من جدول notifications**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';
```
يجب أن ترى عمود `read` (وليس `is_read`)

### **2. تحقق من Realtime**:
```sql
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```
يجب أن ترى `notifications` في القائمة

### **3. تحقق من policies**:
```sql
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'notifications';
```
يجب أن ترى:
- Users can view their own notifications
- System can insert notifications
- Users can update their own notifications
- Users can delete their own notifications

---

## 🔍 إذا حدثت أخطاء:

### **خطأ: column "is_read" does not exist**
```
✅ هذا طبيعي - الكود يتعامل معه
✅ سيضيف عمود read تلقائياً
```

### **خطأ: policy already exists**
```
✅ الكود يحذف ويعيد الإنشاء
✅ لا مشكلة
```

### **خطأ: table already exists**
```
✅ الكود يستخدم IF NOT EXISTS
✅ لا مشكلة
```

---

## 🚀 بعد تطبيق SQL:

### **1. أعد تشغيل السيرفر**:
```bash
npm run dev
```

### **2. اختبر الإشعارات**:
```
1. أنشئ عقد من الشريك
2. افتح /admin/notifications
3. يجب أن ترى إشعار ✅
4. يجب أن يظهر تلقائياً (Realtime) ⚡
```

### **3. اختبر صفحة العقود**:
```
1. سجل دخول كعميل
2. افتح /client/contracts
3. يجب أن ترى العقود ✅
```

---

## 📊 الجداول المُحدثة:

### **notifications**:
```
✅ عمود read (بدلاً من is_read)
✅ Realtime مفعل
✅ Policies كاملة
✅ Indexes محسنة
```

### **contracts**:
```
✅ workflow_status
✅ admin_signature_data
✅ client_signature_data
✅ pdf_url
✅ contract_link_token
```

### **contract_activities** (جديد):
```
✅ تتبع جميع الأنشطة
✅ RLS policies
✅ Indexes
```

### **users**:
```
✅ affiliate_code
✅ Index على affiliate_code
```

---

## 🎉 النتيجة النهائية:

بعد تطبيق SQL:
- ✅ الإشعارات تعمل
- ✅ Realtime يعمل
- ✅ العقود تعمل
- ✅ التوقيع يعمل
- ✅ Tracking يعمل

**كل شيء جاهز! 🚀**
