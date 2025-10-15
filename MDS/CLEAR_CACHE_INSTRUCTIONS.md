# 🔧 تعليمات حل مشكلة الـ Cache

## المشكلة:
```
Error: Failed to read source code from affiliate-notifications-list.tsx
```

الملف تم حذفه لكن Next.js لا يزال يبحث عنه بسبب الـ cache.

---

## ✅ الحل السريع:

### **الخطوة 1: إيقاف الـ dev server**
```bash
# اضغط Ctrl+C في Terminal
```

### **الخطوة 2: حذف مجلد .next**
```bash
# في PowerShell:
Remove-Item -Path ".next" -Recurse -Force
```

### **الخطوة 3: تشغيل الـ dev server مرة أخرى**
```bash
npm run dev
```

---

## 🎯 البديل (إذا لم ينجح):

### **حذف node_modules و .next ثم إعادة التثبيت:**
```bash
# 1. إيقاف dev server
Ctrl+C

# 2. حذف المجلدات
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "node_modules" -Recurse -Force

# 3. إعادة التثبيت
npm install

# 4. تشغيل dev server
npm run dev
```

---

## 📝 ملاحظة:

الملف `affiliate-notifications-list.tsx` تم حذفه بالفعل وجميع الاستيرادات تم تحديثها.
المشكلة فقط في cache الخاص بـ Next.js.

---

**بعد تنفيذ الخطوات أعلاه، يجب أن تختفي المشكلة تماماً! ✅**
