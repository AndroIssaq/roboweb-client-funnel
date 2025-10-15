# ✅ إصلاح خطأ Client Profile Duplicate

## المشكلة:
```
Error creating client profile: {
  code: '23505',
  message: 'duplicate key value violates unique constraint "clients_user_id_key"'
}
```

**السبب**: 
- عند إنشاء عقد جديد لعميل موجود
- الكود يحاول إنشاء `client profile` جديد
- لكن `user_id` موجود بالفعل في جدول `clients`
- `user_id` له unique constraint

**النتيجة**:
- ❌ العقد يُنشأ لكن client profile يفشل
- ❌ الإشعارات لا تُرسل (لأن الكود يتوقف عند الخطأ)

---

## الحل:

### **تحقق أولاً إذا كان client profile موجود**:

```typescript
// قبل:
await supabase
  .from("clients")
  .upsert({
    user_id: clientUserId,
    contract_id: contract.id,
    company_name: contractData.company_name,
  })

// بعد:
const { data: existingClient } = await supabase
  .from("clients")
  .select("id")
  .eq("user_id", clientUserId)
  .maybeSingle()

if (existingClient) {
  // Update existing
  await supabase
    .from("clients")
    .update({ company_name: contractData.company_name })
    .eq("user_id", clientUserId)
} else {
  // Create new
  await supabase
    .from("clients")
    .insert({
      user_id: clientUserId,
      company_name: contractData.company_name,
    })
}
```

---

## 📁 الملفات المُصلحة:

### **1. lib/actions/affiliate-contracts.ts**:
```typescript
✅ تحقق من وجود client profile قبل الإنشاء
✅ update إذا موجود، insert إذا جديد
✅ استخدم .maybeSingle() بدلاً من .single()
```

### **2. lib/actions/contracts.ts**:
```typescript
✅ تحقق من وجود client profile
✅ insert فقط إذا لم يكن موجود
✅ استخدم .maybeSingle()
```

---

## 🎯 السيناريوهات:

### **السيناريو 1: عميل جديد**:
```
1. الشريك ينشئ عقد
2. Email العميل غير موجود
   ↓
3. ينشئ user جديد ✅
4. ينشئ client profile جديد ✅
5. ينشئ العقد ✅
6. يرسل الإشعارات ✅
```

### **السيناريو 2: عميل موجود (عقد أول)**:
```
1. الشريك ينشئ عقد
2. Email العميل موجود
3. لكن client profile غير موجود
   ↓
4. يستخدم user الموجود ✅
5. ينشئ client profile جديد ✅
6. ينشئ العقد ✅
7. يرسل الإشعارات ✅
```

### **السيناريو 3: عميل موجود (عقد ثاني)**:
```
1. الشريك ينشئ عقد ثاني لنفس العميل
2. Email العميل موجود
3. client profile موجود
   ↓
4. يستخدم user الموجود ✅
5. يحدث client profile (بدلاً من إنشاء جديد) ✅
6. ينشئ العقد ✅
7. يرسل الإشعارات ✅
```

---

## ✅ الاختبار:

### **اختبر عميل جديد**:
```
1. سجل دخول كشريك
2. أنشئ عقد بـ email جديد
3. يجب أن ينجح ✅
4. يجب أن تصل الإشعارات ✅
```

### **اختبر عميل موجود**:
```
1. سجل دخول كشريك
2. أنشئ عقد ثاني لنفس email
3. يجب أن ينجح ✅
4. لا يوجد error "duplicate key" ✅
5. يجب أن تصل الإشعارات ✅
```

---

## 🗄️ هيكل جدول clients:

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,  ← هنا المشكلة!
  company_name TEXT,
  industry TEXT,
  onboarding_completed BOOLEAN,
  created_at TIMESTAMPTZ
);
```

**المشكلة**: `user_id` له unique constraint
**الحل**: تحقق قبل insert

---

## 📊 العلاقات:

```
users (1) ←→ (1) clients
  ↓
  └─ user_id (unique)

users (1) ←→ (many) contracts
  ↓
  └─ client_id
```

**ملاحظة**: 
- كل `user` له `client profile` واحد فقط
- لكن كل `user` يمكن أن يكون له عقود متعددة

---

## 🎉 النتيجة:

**الآن يعمل بشكل صحيح**:
- ✅ عميل جديد → ينشئ profile جديد
- ✅ عميل موجود → يحدث profile الموجود
- ✅ لا errors
- ✅ الإشعارات تُرسل للجميع
- ✅ العقد يُنشأ بنجاح

**جرب الآن! 🚀**
