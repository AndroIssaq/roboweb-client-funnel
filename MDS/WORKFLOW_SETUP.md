# إعداد نظام Workflow للعقود

## ⚠️ مهم جداً: يجب تطبيق SQL أولاً!

قبل أن تعمل صفحات العقود بشكل صحيح، يجب تطبيق التحديثات على قاعدة البيانات:

### 1. افتح Supabase SQL Editor
```
https://supabase.com/dashboard/project/YOUR_PROJECT/sql
```

### 2. طبق هذه الـ Scripts بالترتيب:

#### أ) Notifications Table (إذا لم تطبقه)
```sql
-- انسخ والصق من: scripts/23-create-notifications.sql
-- اضغط Run
```

#### ب) Contracts Workflow Update
```sql
-- انسخ والصق من: scripts/24-update-contracts-workflow.sql
-- اضغط Run
```

### 3. تحقق من النجاح
بعد تطبيق الـ SQL، يجب أن ترى:
- ✅ جدول `notifications` موجود
- ✅ جدول `contract_activities` موجود
- ✅ أعمدة جديدة في `contracts`:
  - `workflow_status`
  - `admin_signature_data`
  - `client_signature_data`
  - `contract_link_token`
  - وغيرها...

### 4. أعد تشغيل السيرفر
```bash
# اضغط Ctrl+C لإيقاف السيرفر
# ثم شغله مرة أخرى
npm run dev
```

---

## 🎯 بعد التطبيق:

### صفحات العقود ستعمل:
- ✅ `/affiliate/contracts/[id]` - عرض العقد للشريك
- ✅ `/admin/contracts/[id]` - عرض وتوقيع العقد للمسؤول
- ✅ `/client/contracts/[id]` - عرض وتوقيع العقد للعميل

### Workflow سيعمل:
1. الشريك ينشئ عقد → `pending_admin_signature`
2. المسؤول يوقع → `pending_client_signature`
3. العميل يوقع → `completed`

---

## 🔧 استكشاف الأخطاء:

### إذا ظهر 404 عند فتح العقد:
1. تأكد أن SQL تم تطبيقه
2. تحقق من Console للأخطاء
3. تأكد أن `affiliate_id` موجود في العقد

### إذا ظهر خطأ في Database:
```
column "workflow_status" does not exist
```
معناها: لم يتم تطبيق SQL بعد!

---

## 📝 ملاحظات:

- العقود القديمة ستحصل على `workflow_status = 'draft'` تلقائياً
- سيتم توليد `contract_link_token` لكل العقود القديمة
- الـ Real-time updates ستعمل تلقائياً بعد التطبيق
