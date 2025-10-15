# 🎨 دليل إعداد نظام Portfolio الجديد

## 📋 الخطوات المطلوبة:

### 1️⃣ تشغيل Migration في Supabase

1. **افتح Supabase Dashboard**
   - روح على: https://supabase.com/dashboard
   - اختار المشروع بتاعك

2. **SQL Editor**
   - من القائمة الجانبية، اختار **SQL Editor**
   - اضغط **New Query**

3. **نسخ ولصق الـ SQL**
   - افتح الملف: `supabase/migrations/create_portfolio_table.sql`
   - انسخ كل المحتوى
   - الصقه في الـ SQL Editor

4. **تشغيل الـ SQL**
   - اضغط **Run** أو اضغط `Ctrl + Enter`
   - انتظر حتى يظهر: ✅ Success

---

### 2️⃣ التأكد من إنشاء الجدول

بعد تشغيل الـ SQL، روح على:
- **Table Editor** من القائمة الجانبية
- هتلاقي جدول جديد اسمه: `portfolio_projects`
- افتحه وشوف الـ 6 مشاريع الـ dummy data

---

### 3️⃣ استخدام النظام

#### **من Dashboard الأدمن:**

1. **عرض كل المشاريع:**
   ```
   /admin/portfolio
   ```

2. **إضافة مشروع جديد:**
   ```
   /admin/portfolio/new
   ```

3. **تعديل مشروع:**
   - من جدول المشاريع، اضغط على أيقونة القلم ✏️

4. **حذف مشروع:**
   - من جدول المشاريع، اضغط على أيقونة الحذف 🗑️
   - أكد الحذف

5. **تغيير حالة المشروع (منشور/مسودة):**
   - اضغط على أيقونة العين 👁️
   - الحالة هتتغير تلقائياً

6. **عرض المشروع في الموقع:**
   - اضغط على أيقونة الرابط الخارجي 🔗
   - هيفتح في tab جديد

#### **للزوار:**

```
/portfolio
```
- هتعرض كل المشاريع المنشورة (published فقط)
- المسودات (drafts) مش هتظهر

---

## 📊 البيانات الموجودة في الجدول:

### الجدول: `portfolio_projects`

| العمود | النوع | الوصف |
|--------|------|-------|
| `id` | UUID | معرّف فريد |
| `title` | TEXT | عنوان المشروع (عربي) |
| `title_en` | TEXT | عنوان المشروع (إنجليزي) |
| `slug` | TEXT | الرابط (URL-friendly) |
| `category` | TEXT | الفئة |
| `description` | TEXT | الوصف |
| `client_name` | TEXT | اسم العميل |
| `year` | INTEGER | سنة التنفيذ |
| `thumbnail_url` | TEXT | رابط الصورة |
| `images` | TEXT[] | مصفوفة روابط الصور |
| `technologies` | TEXT[] | التقنيات المستخدمة |
| `features` | TEXT[] | المميزات |
| `color` | TEXT | اللون المميز |
| `live_url` | TEXT | رابط المشروع المباشر |
| `github_url` | TEXT | رابط GitHub |
| `featured` | BOOLEAN | مشروع مميز؟ |
| `status` | TEXT | الحالة (published/draft) |
| `views` | INTEGER | عدد المشاهدات |
| `stats` | JSONB | إحصائيات المشروع |
| `testimonial` | JSONB | شهادة العميل |
| `created_at` | TIMESTAMP | تاريخ الإنشاء |
| `updated_at` | TIMESTAMP | تاريخ آخر تحديث |

---

## 🎯 المشاريع الـ Dummy Data:

1. **متجر الأزياء العصري** (Featured ⭐)
   - Category: تجارة إلكترونية
   - Color: #FF6B9D (Pink)
   - Status: Published

2. **منصة التعليم الإلكتروني** (Featured ⭐)
   - Category: تطبيقات الويب
   - Color: #8B5CF6 (Purple)
   - Status: Published

3. **بورتفوليو مصور محترف** (Featured ⭐)
   - Category: معرض أعمال
   - Color: #06B6D4 (Cyan)
   - Status: Published

4. **تطبيق توصيل الطعام**
   - Category: تطبيقات الموبايل
   - Color: #F59E0B (Orange)
   - Status: Published

5. **لوحة تحكم تحليلات**
   - Category: تطبيقات الويب
   - Color: #10B981 (Emerald)
   - Status: Published

6. **موقع عقارات متكامل**
   - Category: تطبيقات الويب
   - Color: #EC4899 (Pink)
   - Status: Draft (مخفي)

---

## 🔐 الصلاحيات (RLS):

- ✅ **أي شخص**: يمكنه مشاهدة المشاريع المنشورة فقط
- ✅ **الأدمن**: يمكنه عمل كل شيء (إضافة، تعديل، حذف، تغيير الحالة)

---

## 📝 مثال: إضافة مشروع جديد

### من الـ Dashboard:

1. روح `/admin/portfolio`
2. اضغط **إضافة مشروع جديد**
3. املأ البيانات:
   - **عنوان المشروع**: متجر الكترونات
   - **Slug**: electronics-store
   - **الفئة**: تجارة إلكترونية
   - **الوصف**: متجر شامل للإلكترونيات...
   - **اسم العميل**: شركة التقنية
   - **السنة**: 2024
   - **التقنيات**: Next.js, Stripe, Supabase
   - **المميزات** (كل ميزة في سطر):
     ```
     نظام بحث متقدم
     مقارنة المنتجات
     دفع آمن
     ```
   - **اللون**: اختار لون مميز
   - **الحالة**: منشور أو مسودة
   - **مميز**: ✓ (إذا تريد ظهوره في الصفحة الرئيسية)

4. اضغط **إضافة المشروع**

---

## 🎨 المميزات:

### ✅ في الـ Admin Dashboard:

1. **Stats Cards**:
   - إجمالي المشاريع
   - المشاريع المنشورة
   - المسودات
   - إجمالي المشاهدات

2. **Table متقدم**:
   - عرض كل المشاريع
   - Quick Actions (عرض، تعديل، حذف، تغيير الحالة)
   - Badge للمشاريع المميزة ⭐
   - Badge للحالة (منشور/مسودة)

3. **Forms شاملة**:
   - كل الحقول المطلوبة
   - Validation
   - Color picker
   - Select dropdown للفئات

### ✅ في الصفحة العامة (`/portfolio`):

1. **Hero Section مبهر**:
   - 3 Gradient orbs متحركة
   - 20 Floating particles
   - Animated text

2. **Filter System**:
   - تصفية حسب الفئة
   - Counter لعدد المشاريع في كل فئة
   - Animated transitions

3. **Portfolio Cards**:
   - 3D Tilt effect
   - Hover animations
   - Featured badge

4. **Project Modal**:
   - تفاصيل كاملة للمشروع
   - Stats, Technologies, Features
   - Links (Live URL, GitHub)

5. **CTA Section**:
   - Animated background
   - Call to action button

---

## 🚀 التشغيل:

```bash
# تأكد إن Supabase شغال
npm run dev
```

**روح على:**
- Admin: `http://localhost:3000/admin/portfolio`
- Public: `http://localhost:3000/portfolio`

---

## 📱 الـ Actions المتاحة:

### من الكود:

```typescript
// Get all projects (admin only)
const projects = await getAllPortfolioProjects()

// Get published projects (public)
const published = await getPublishedPortfolioProjects()

// Get project by slug (with views increment)
const project = await getPortfolioProjectBySlug("my-project")

// Get project by ID (no views increment)
const project = await getPortfolioProjectById("uuid")

// Create project
await createPortfolioProject(formData)

// Update project
await updatePortfolioProject(id, formData)

// Delete project
await deletePortfolioProject(id)

// Toggle status (published <-> draft)
await toggleProjectStatus(id, currentStatus)
```

---

## ✅ الخلاصة:

1. ✅ **Supabase table** جاهز مع dummy data
2. ✅ **Admin dashboard** كامل (إضافة، تعديل، حذف)
3. ✅ **Public portfolio** مع animations وfilters
4. ✅ **زرار لعرض كل مشروع** في موقع مباشر
5. ✅ **عمود live_url** لرابط المشروع
6. ✅ **RLS policies** للحماية
7. ✅ **Views counter** تلقائي

---

**جاهز للاستخدام! 🎉**

إذا واجهت أي مشاكل، تأكد من:
1. تشغيل الـ SQL migration بنجاح
2. Supabase connection شغالة
3. صلاحيات الأدمن صحيحة
