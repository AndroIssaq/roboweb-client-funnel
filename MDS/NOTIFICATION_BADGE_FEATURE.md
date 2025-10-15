# 🔔 Notification Badge Feature - Realtime

## المميزات الجديدة:

### **Badge للإشعارات غير المقروءة**:
```
✅ يظهر badge أحمر بجانب "الإشعارات"
✅ يعرض عدد الإشعارات غير المقروءة
✅ يتحدث في الوقت الفعلي (Realtime)
✅ يظهر "99+" إذا كان العدد أكثر من 99
```

---

## 📁 الملفات الجديدة:

### **1. hooks/use-unread-notifications.ts**:
```typescript
// Hook مخصص لجلب عدد الإشعارات غير المقروءة
// مع Realtime updates

export function useUnreadNotifications(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    // Fetch initial count
    fetchUnreadCount()
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel("notifications-changes")
      .on("postgres_changes", {
        event: "*",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchUnreadCount()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
  
  return unreadCount
}
```

---

## 🎨 الملفات المُحدثة:

### **1. components/admin/admin-nav.tsx**:
```typescript
✅ استخدام useUnreadNotifications hook
✅ عرض Badge بجانب "الإشعارات"
✅ Realtime updates
```

### **2. components/affiliate/affiliate-nav.tsx**:
```typescript
✅ استخدام useUnreadNotifications hook
✅ عرض Badge بجانب "الإشعارات"
✅ Realtime updates
```

### **3. components/client/client-nav.tsx**:
```typescript
✅ استخدام useUnreadNotifications hook
✅ عرض Badge بجانب "الإشعارات"
✅ Realtime updates
```

---

## 🎯 كيف يعمل:

### **1. عند تحميل الصفحة**:
```
1. يجلب user_id الحالي
2. يجلب عدد الإشعارات غير المقروءة
3. يعرض Badge إذا كان العدد > 0
```

### **2. عند وصول إشعار جديد**:
```
1. Supabase Realtime يكتشف التغيير
2. Hook يعيد جلب العدد
3. Badge يتحدث تلقائياً ⚡
4. لا حاجة لـ refresh الصفحة
```

### **3. عند قراءة إشعار**:
```
1. المستخدم يضغط على إشعار
2. يتم تحديث read = true
3. Realtime يكتشف التغيير
4. Badge يتحدث (ينقص العدد) ⚡
```

---

## 🎨 شكل Badge:

```
┌─────────────────────────────────┐
│ Sidebar                         │
├─────────────────────────────────┤
│ 🏠 لوحة التحكم                  │
│ 🔔 الإشعارات          [3] ←    │
│ 📄 العقود                       │
│ 👥 العملاء                      │
└─────────────────────────────────┘
```

### **الألوان**:
```
- Badge: أحمر (destructive)
- النص: أبيض
- الشكل: دائري
- الحجم: صغير (h-5)
```

---

## ⚡ Realtime Events:

### **الأحداث المُراقبة**:
```typescript
event: "*"  // جميع الأحداث:
  - INSERT  // إشعار جديد
  - UPDATE  // تحديث إشعار (مثل read = true)
  - DELETE  // حذف إشعار
```

### **Filter**:
```typescript
filter: `user_id=eq.${userId}`
// فقط الإشعارات الخاصة بالمستخدم الحالي
```

---

## 📊 الأداء:

### **Optimization**:
```typescript
✅ استخدام count بدلاً من select *
✅ head: true (لا يجلب البيانات)
✅ filter على user_id
✅ cleanup عند unmount
```

### **Query**:
```typescript
const { count } = await supabase
  .from("notifications")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("read", false)
```

---

## 🎯 السيناريوهات:

### **سيناريو 1: إشعار جديد**:
```
1. شريك ينشئ عقد
   ↓
2. إشعار يُرسل للأدمن
   ↓
3. Realtime يكتشف INSERT
   ↓
4. Badge يظهر [1] ⚡
   ↓
5. لا حاجة لـ refresh
```

### **سيناريو 2: قراءة إشعار**:
```
1. أدمن يفتح الإشعارات
   ↓
2. يضغط على إشعار
   ↓
3. read = true
   ↓
4. Realtime يكتشف UPDATE
   ↓
5. Badge ينقص [0] ⚡
   ↓
6. Badge يختفي
```

### **سيناريو 3: عدة إشعارات**:
```
1. 5 إشعارات غير مقروءة
   ↓
2. Badge يعرض [5]
   ↓
3. يقرأ 2 منها
   ↓
4. Badge يتحدث [3] ⚡
```

### **سيناريو 4: أكثر من 99**:
```
1. 150 إشعار غير مقروء
   ↓
2. Badge يعرض [99+]
   ↓
3. يقرأ 60 منها
   ↓
4. Badge يتحدث [90] ⚡
```

---

## ✅ الاختبار:

### **1. اختبر Badge**:
```
1. سجل دخول كأدمن
2. افتح sidebar
3. يجب أن ترى Badge إذا كان هناك إشعارات ✅
```

### **2. اختبر Realtime**:
```
1. افتح تاب 1: أدمن
2. افتح تاب 2: شريك
3. في تاب 2: أنشئ عقد
4. في تاب 1: Badge يظهر تلقائياً ⚡✅
5. لا حاجة لـ refresh
```

### **3. اختبر القراءة**:
```
1. افتح /admin/notifications
2. اضغط على إشعار
3. Badge ينقص تلقائياً ⚡✅
```

### **4. اختبر جميع الأدوار**:
```
✅ Admin - يرى badge
✅ Affiliate - يرى badge
✅ Client - يرى badge
```

---

## 🎉 النتيجة:

**الآن يعمل بشكل احترافي**:
- ✅ Badge يظهر للإشعارات غير المقروءة
- ✅ Realtime updates بدون refresh
- ✅ يعمل لجميع الأدوار
- ✅ أداء محسن
- ✅ UX ممتاز

**جرب الآن! 🚀**
