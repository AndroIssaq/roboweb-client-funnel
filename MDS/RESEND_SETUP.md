# إعداد Resend للبريد الإلكتروني

## الخطوات:

### 1. إنشاء حساب Resend
1. اذهب إلى: https://resend.com
2. سجل حساب جديد (مجاني)
3. تحقق من بريدك الإلكتروني

### 2. الحصول على API Key
1. اذهب إلى: https://resend.com/api-keys
2. اضغط "Create API Key"
3. اختر اسم للـ Key (مثل: "Roboweb Production")
4. انسخ الـ API Key (سيظهر مرة واحدة فقط!)

### 3. إضافة Domain (اختياري لكن مهم)
1. اذهب إلى: https://resend.com/domains
2. اضغط "Add Domain"
3. أدخل domain الخاص بك (مثل: roboweb.sa)
4. أضف DNS Records المطلوبة في لوحة تحكم الـ domain
5. انتظر التحقق (قد يستغرق بضع دقائق)

### 4. إضافة المتغيرات في .env.local
أضف هذه المتغيرات في ملف `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# From Email (استخدم domain الخاص بك بعد التحقق)
RESEND_FROM_EMAIL=noreply@roboweb.sa
# أو استخدم الـ testing email:
# RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 5. إعادة تشغيل السيرفر
```bash
# أوقف السيرفر (Ctrl+C)
# ثم شغله مرة أخرى
npm run dev
```

---

## ملاحظات مهمة:

### Testing Mode (بدون domain):
- يمكنك استخدام `onboarding@resend.dev` للاختبار
- لكن يمكنك الإرسال فقط لـ email واحد (المسجل في Resend)

### Production Mode (مع domain):
- بعد إضافة domain والتحقق منه
- يمكنك الإرسال لأي email
- استخدم: `noreply@yourdomain.com` أو أي email من domain الخاص بك

### الحدود (Free Plan):
- 100 email/يوم
- 3,000 email/شهر
- إذا احتجت أكثر، ترقى للـ Pro Plan

---

## اختبار الإعداد:

1. افتح: http://localhost:3000/admin/emails
2. اختر مستخدم (نفسك للاختبار)
3. اكتب عنوان ورسالة
4. اضغط إرسال
5. تحقق من بريدك الإلكتروني!

---

## استكشاف الأخطاء:

### خطأ: "API key is invalid"
- تأكد من نسخ الـ API Key بشكل صحيح
- تأكد من إضافته في `.env.local`
- أعد تشغيل السيرفر

### خطأ: "Domain not verified"
- تأكد من إضافة DNS Records بشكل صحيح
- انتظر حتى يتم التحقق (قد يستغرق ساعات)
- استخدم `onboarding@resend.dev` للاختبار مؤقتاً

### لا تصل الرسائل:
- تحقق من مجلد Spam
- تحقق من Resend Dashboard > Logs
- تأكد من أن الـ email صحيح

---

## روابط مفيدة:
- Dashboard: https://resend.com/overview
- API Keys: https://resend.com/api-keys
- Domains: https://resend.com/domains
- Logs: https://resend.com/emails
- Docs: https://resend.com/docs
