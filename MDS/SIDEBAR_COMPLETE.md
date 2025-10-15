# 🎨 Sidebar احترافي - مكتمل

## ✅ المميزات:

### **1. Sidebar موجود في جميع الصفحات** ✅
- ✅ Admin
- ✅ Affiliate  
- ✅ Client

### **2. إمكانية القفل والفتح** ✅
- ✅ زر Toggle في Desktop
- ✅ يحفظ الحالة في localStorage
- ✅ Animation smooth

### **3. Responsive Design** ✅
- ✅ Desktop: Sidebar ثابت على اليمين
- ✅ Mobile: Sidebar منزلق من اليمين
- ✅ Overlay للموبايل

### **4. Badge الإشعارات** ✅
- ✅ يظهر عدد الإشعارات غير المقروءة
- ✅ Realtime updates
- ✅ في الوضع المقفول: نقطة حمراء

### **5. Animations** ✅
- ✅ Smooth transitions (300ms)
- ✅ Hover effects
- ✅ Active state
- ✅ Collapse/Expand animation

---

## 📁 الملفات الجديدة:

### **1. components/layout/app-sidebar.tsx** ✅
```typescript
✅ Sidebar Component الرئيسي
✅ يعمل للأدمن والشريك والعميل
✅ Collapse/Expand functionality
✅ Mobile responsive
✅ Badge notifications
✅ Smooth animations
```

### **2. components/layout/sidebar-layout.tsx** ✅
```typescript
✅ Wrapper Component
✅ يستقبل userRole, userId, userName
✅ يمرر البيانات للـ Sidebar
```

---

## 🎨 الشكل:

### **Desktop - Expanded:**
```
┌────────────────────────────────────────────┐
│                                            │
│  ┌──────────────────┐                     │
│  │ [R] Roboweb    [→]│                     │
│  ├──────────────────┤                     │
│  │ [👤] محمد        │                     │
│  │ مدير النظام      │                     │
│  ├──────────────────┤                     │
│  │ 🏠 لوحة التحكم   │                     │
│  │ 📄 العقود        │                     │
│  │ 👥 العملاء       │                     │
│  │ 📁 المشاريع      │                     │
│  │ 💬 الرسائل       │                     │
│  │ 🔔 الإشعارات [3]│                     │
│  │ ⚙️ الإعدادات     │                     │
│  ├──────────────────┤                     │
│  │ 🚪 تسجيل الخروج  │                     │
│  └──────────────────┘                     │
│                                            │
└────────────────────────────────────────────┘
```

### **Desktop - Collapsed:**
```
┌────────────────────────────────────────────┐
│                                            │
│  ┌───┐                                     │
│  │[R]│                                     │
│  │[←]│                                     │
│  ├───┤                                     │
│  │🏠 │                                     │
│  │📄 │                                     │
│  │👥 │                                     │
│  │📁 │                                     │
│  │💬 │                                     │
│  │🔔•│ (نقطة حمراء)                       │
│  │⚙️ │                                     │
│  ├───┤                                     │
│  │🚪 │                                     │
│  └───┘                                     │
│                                            │
└────────────────────────────────────────────┘
```

### **Mobile - Open:**
```
┌────────────────────────────────────────────┐
│ [Overlay]                                  │
│  ┌──────────────────┐                     │
│  │ [R] Roboweb      │                     │
│  ├──────────────────┤                     │
│  │ [👤] محمد        │                     │
│  ├──────────────────┤                     │
│  │ 🏠 لوحة التحكم   │                     │
│  │ 📄 العقود        │                     │
│  │ ...              │                     │
│  └──────────────────┘                     │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🎯 الكود:

### **AppSidebar Component:**
```typescript
export function AppSidebar({ userRole, userId, userName }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const unreadCount = useUnreadNotifications(userId)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  // Navigation items based on role
  const getNavItems = () => {
    if (userRole === "admin") {
      return [
        { title: "لوحة التحكم", href: "/admin", icon: LayoutDashboard },
        { title: "العقود", href: "/admin/contracts", icon: FileText },
        { title: "الإشعارات", href: "/admin/notifications", icon: Bell, badge: unreadCount },
        // ...
      ]
    }
    // ...
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && <div className="overlay" onClick={() => setIsMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed right-0 top-0 h-screen transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Header */}
        <div className="p-4">
          {!isCollapsed && <span>Roboweb</span>}
          <Button onClick={toggleCollapsed}>
            {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4">
            <p>{userName}</p>
            <p>{userRole}</p>
          </div>
        )}

        {/* Navigation */}
        <nav>
          {navItems.map((item) => (
            <Link href={item.href} className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all",
              isActive && "bg-primary text-primary-foreground",
              isCollapsed && "justify-center"
            )}>
              <Icon />
              {!isCollapsed && <span>{item.title}</span>}
              {!isCollapsed && item.badge > 0 && <Badge>{item.badge}</Badge>}
              {isCollapsed && item.badge > 0 && <div className="dot" />}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <form action={logout}>
          <Button>
            <LogOut />
            {!isCollapsed && <span>تسجيل الخروج</span>}
          </Button>
        </form>
      </aside>

      {/* Spacer for main content */}
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "mr-20" : "mr-64"
      )} />
    </>
  )
}
```

---

## 🎨 Animations:

### **Collapse/Expand:**
```css
transition-all duration-300 ease-in-out

/* Width changes smoothly */
w-64 → w-20
mr-64 → mr-20

/* Content fades in/out */
opacity-100 → opacity-0
```

### **Hover Effects:**
```css
hover:bg-accent hover:text-accent-foreground
transition-all duration-200

/* Active state */
bg-primary text-primary-foreground
```

### **Mobile Slide:**
```css
translate-x-full → translate-x-0
transition-all duration-300 ease-in-out
```

---

## 📱 Responsive Breakpoints:

### **Desktop (lg: 1024px+):**
- ✅ Sidebar ثابت على اليمين
- ✅ زر Toggle يظهر
- ✅ يحفظ الحالة في localStorage

### **Mobile (< 1024px):**
- ✅ Sidebar مخفي بشكل افتراضي
- ✅ زر Toggle في أعلى اليمين
- ✅ Overlay عند الفتح
- ✅ يغلق عند الضغط على Overlay
- ✅ يغلق عند تغيير الصفحة

---

## ✅ الملفات المُحدثة:

### **1. app/admin/layout.tsx** ✅
```typescript
✅ استبدال Sidebar القديم بـ SidebarLayout
✅ تمرير userRole="admin"
✅ تمرير userId و userName
```

### **2. app/affiliate/layout.tsx** ✅
```typescript
✅ استبدال Sidebar القديم بـ SidebarLayout
✅ تمرير userRole="affiliate"
```

### **3. app/client/layout.tsx** ✅
```typescript
✅ استبدال Sidebar القديم بـ SidebarLayout
✅ تمرير userRole="client"
```

---

## 🎯 Features:

### **1. localStorage Persistence:**
```typescript
// Save state
localStorage.setItem("sidebar-collapsed", "true")

// Load on mount
const saved = localStorage.getItem("sidebar-collapsed")
setIsCollapsed(saved === "true")
```

### **2. Auto-close on mobile:**
```typescript
useEffect(() => {
  setIsMobileOpen(false)
}, [pathname])
```

### **3. Badge Notifications:**
```typescript
const unreadCount = useUnreadNotifications(userId)

// In expanded mode
<Badge>{unreadCount}</Badge>

// In collapsed mode
{unreadCount > 0 && <div className="w-2 h-2 bg-destructive rounded-full" />}
```

### **4. Active State:**
```typescript
const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

className={cn(
  isActive && "bg-primary text-primary-foreground"
)}
```

---

## 🎉 النتيجة النهائية:

**Sidebar احترافي بمميزات Google-level**:
- ✅ موجود في جميع الصفحات
- ✅ Collapse/Expand مع localStorage
- ✅ Smooth animations (300ms)
- ✅ Mobile responsive مع Overlay
- ✅ Badge notifications مع Realtime
- ✅ Active state highlighting
- ✅ Hover effects
- ✅ Clean modern design
- ✅ RTL support
- ✅ Accessibility

**النظام جاهز للإنتاج! 🚀✨**
