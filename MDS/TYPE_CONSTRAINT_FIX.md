# 🚨 إصلاح Notification Type Constraint

## المشكلة:
```
Error creating notification: {
  code: '23514',
  message: 'new row for relation "notifications" violates check constraint "notifications_type_check"'
}
```

**السبب**: الكود يستخدم `type: "referral"` لكن الـ constraint يسمح فقط بـ:
- `contract`
- `payment`
- `project`
- `message`
- `system`

---

## ✅ الحل:

### **أضف `referral` و `deletion` للـ constraint**

---

## 📋 الخطوات:

### **الطريقة 1: استخدم ملف منفصل**

1. **افتح Supabase SQL Editor**
2. **انسخ من**: `scripts/29-fix-notification-types.sql`
3. **الصق**:
```sql
-- Drop existing constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with all types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('contract', 'payment', 'project', 'message', 'system', 'referral', 'deletion'));
```
4. **اضغط Run**

---

### **الطريقة 2: استخدم الملف الكامل**

استخدم `scripts/27-safe-fix.sql` (تم تحديثه ليشمل الإصلاح)

---

## 🎯 أنواع الإشعارات المستخدمة:

### **في الكود**:
```typescript
type: "contract"   // ✅ عقود
type: "payment"    // ✅ مدفوعات
type: "project"    // ✅ مشاريع
type: "message"    // ✅ رسائل
type: "system"     // ✅ نظام
type: "referral"   // ❌ كان مفقود!
type: "deletion"   // ❌ كان مفقود!
```

---

## 📁 أين يُستخدم كل نوع:

### **`contract`**:
```typescript
// عند إنشاء عقد
// عند توقيع عقد
// عند اكتمال عقد
createNotification({
  type: "contract",
  title: "عقد جديد",
  ...
})
```

### **`referral`**:
```typescript
// عند دخول زائر من رابط الشريك
createNotification({
  type: "referral",
  title: "🎯 زائر جديد من رابطك",
  ...
})
```

### **`deletion`**:
```typescript
// عند حذف عقد
createNotification({
  type: "deletion",
  title: "⚠️ تم حذف عقد",
  ...
})
```

---

## ✅ بعد تطبيق SQL:

### **1. أعد تشغيل السيرفر**:
```bash
npm run dev
```

### **2. اختبر الإشعارات**:
```
1. أنشئ عقد جديد ✅
2. افتح رابط شريك ✅
3. احذف عقد ✅
4. يجب أن تصل جميع الإشعارات ✅
```

---

## 🔍 التحقق من الـ Constraint:

### **في Supabase**:
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass 
AND conname = 'notifications_type_check';
```

يجب أن ترى:
```
CHECK (type IN ('contract', 'payment', 'project', 'message', 'system', 'referral', 'deletion'))
```

---

## 📊 ملخص الإصلاحات:

### **الأعمدة**:
```sql
✅ link
✅ related_id
✅ read_at
✅ read (بدلاً من is_read)
```

### **Constraint**:
```sql
✅ contract
✅ payment
✅ project
✅ message
✅ system
✅ referral   ← جديد!
✅ deletion   ← جديد!
```

### **Policies**:
```sql
✅ Users can view their own notifications
✅ System can insert notifications
✅ Users can update their own notifications
✅ Users can delete their own notifications
```

### **Realtime**:
```sql
✅ ALTER PUBLICATION supabase_realtime ADD TABLE notifications
```

---

## 🎯 الترتيب الصحيح للإصلاحات:

### **1. أضف الأعمدة الناقصة**:
```
scripts/28-add-missing-columns.sql
```

### **2. أصلح الـ constraint**:
```
scripts/29-fix-notification-types.sql
```

### **3. أو استخدم الملف الكامل**:
```
scripts/27-safe-fix.sql (محدث)
```

---

**طبق SQL وجرب! 🚀**
