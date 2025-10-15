# ⚡ تثبيت معرض الأعمال - خطوة بخطوة

## 1. تثبيت الحزم المطلوبة

```bash
npm install framer-motion
```

## 2. تحديث Tailwind Config

افتح `tailwind.config.ts` وأضف:

```typescript
export default {
  theme: {
    extend: {
      animation: {
        'gradient': 'gradient 3s ease infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        }
      }
    }
  }
}
```

## 3. أضف الصور (اختياري)

في `public/projects/`:
- `fashion-store.jpg`
- `elearning.jpg`
- `photographer.jpg`

أو استخدم placeholder images مؤقتاً.

## 4. جرّب الصفحة

```bash
npm run dev
```

ثم اذهب لـ:
- **للعملاء**: `http://localhost:3000/portfolio`
- **للأدمن**: `http://localhost:3000/admin/portfolio`

## 5. تخصيص المشاريع

عدّل في `lib/data/portfolio.ts`:
- غير `demoProjects` للمشاريع الحقيقية
- أضف صور حقيقية
- حدّث البيانات

## ✅ كل شيء جاهز!

الصفحة الآن شغالة 100% مع:
- ✨ أنيميشنز خرافية
- 🎯 تجربة مستخدم ممتازة
- 📱 responsive كامل
- ⚡ أداء عالي

**استمتع! 🚀**
