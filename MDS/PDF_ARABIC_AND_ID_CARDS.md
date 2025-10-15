# 📄 إصلاح PDF العربي + إضافة رفع البطاقات

## ✅ المميزات الجديدة:

### **1. PDF يدعم العربي بشكل صحيح** ✅
- ✅ استخدام `@react-pdf/renderer` بدلاً من `jsPDF`
- ✅ دعم خط Cairo العربي
- ✅ RTL support
- ✅ النصوص العربية تظهر بشكل صحيح

### **2. رفع صور البطاقات** ✅
- ✅ Admin يرفع بطاقته (تكون دائماً موجودة)
- ✅ Client يرفع بطاقته بعد التوقيع
- ✅ البطاقات تظهر في PDF
- ✅ Realtime updates

---

## 🎯 كيف يعمل النظام:

### **السيناريو الكامل:**

```
1. Admin ينشئ عقد
   ↓
2. Admin يوقع العقد
   ↓
3. workflow_status = "pending_client_signature"
   ↓
4. Client يفتح العقد
   ↓
5. Client يوقع العقد
   ↓
6. workflow_status = "completed"
   ↓
7. ✨ قسم البطاقات يظهر فوراً ✨
   ↓
8. Admin يرى بطاقته (مرفوعة مسبقاً)
   ↓
9. Client يرفع بطاقته
   ↓
10. PDF يتحدث ويشمل البطاقات
```

---

## 📁 الملفات الجديدة:

### **1. scripts/40-add-id-card-fields.sql** ✅
```sql
-- إضافة حقول البطاقات
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS admin_id_card_url TEXT,
ADD COLUMN IF NOT EXISTS admin_id_card_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_id_card_url TEXT,
ADD COLUMN IF NOT EXISTS client_id_card_uploaded_at TIMESTAMPTZ;

-- إنشاء bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', false);

-- RLS policies
```

### **2. components/contracts/id-card-upload.tsx** ✅
```typescript
export function IdCardUpload({
  contractId,
  userRole,
  currentUserId,
  existingCardUrl,
  onUploadComplete,
}) {
  // Upload logic
  // Preview
  // Validation (max 5MB, images only)
}
```

### **3. components/contracts/contract-pdf-document.tsx** ✅
```typescript
import { Document, Page, Text, View, Image, Font } from "@react-pdf/renderer"

// Register Arabic font
Font.register({
  family: "Cairo",
  fonts: [...]
})

export function ContractPDFDocument(props) {
  return (
    <Document>
      <Page>
        {/* Arabic content */}
        {/* ID Cards section */}
      </Page>
    </Document>
  )
}
```

### **4. lib/actions/id-card-upload.ts** ✅
```typescript
export async function uploadIdCard(
  contractId: string,
  userRole: "admin" | "client",
  fileData: string,
  fileName: string
) {
  // Upload to storage
  // Update contract
  // Revalidate paths
}
```

---

## 🎨 الواجهة:

### **بعد التوقيعين:**
```
┌─────────────────────────────────────────┐
│ التوقيعات                               │
│ ✅ توقيع Roboweb                        │
│ ✅ توقيع العميل                         │
├─────────────────────────────────────────┤
│ صور البطاقات الشخصية                   │
│ يرجى رفع صور بطاقات الهوية الوطنية     │
├─────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐     │
│ │ بطاقة Admin  │  │ بطاقة Client │     │
│ │ [صورة]       │  │ [رفع صورة]   │     │
│ │ ✅ مرفوعة    │  │ [اختر صورة]  │     │
│ └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

---

## 📋 Database Schema:

```sql
contracts:
  - admin_id_card_url: TEXT
  - admin_id_card_uploaded_at: TIMESTAMPTZ
  - client_id_card_url: TEXT
  - client_id_card_uploaded_at: TIMESTAMPTZ
```

---

## 🔒 Security (RLS):

### **Upload Policy:**
```sql
-- Users can upload their own ID cards
CREATE POLICY "Users can upload their own ID cards"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### **View Policy:**
```sql
-- Users can view ID cards in their contracts
CREATE POLICY "Users can view ID cards in their contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-cards' AND
  (
    -- Admin can see all
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR
    -- Users can see their own
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Users can see cards in contracts they're part of
    EXISTS (
      SELECT 1 FROM contracts
      WHERE (contracts.admin_id_card_url = storage.objects.name OR contracts.client_id_card_url = storage.objects.name)
      AND (contracts.client_id = auth.uid() OR contracts.created_by = auth.uid())
    )
  )
);
```

---

## 📄 PDF Features:

### **1. Arabic Support:**
```typescript
// Register Cairo font from Google Fonts
Font.register({
  family: "Cairo",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/cairo/v28/...",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/cairo/v28/...",
      fontWeight: 700,
    },
  ],
})

// Use in styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    direction: "rtl",
  },
})
```

### **2. ID Cards in PDF:**
```typescript
{/* ID Cards - Only show if both signatures are present */}
{props.adminSignature && props.clientSignature && (
  <View style={styles.idCardSection}>
    <Text style={styles.sectionTitle}>صور البطاقات:</Text>
    
    {/* Admin ID Card */}
    {props.adminIdCard && (
      <View style={styles.signatureBox}>
        <Text style={styles.textBold}>بطاقة المسؤول:</Text>
        <Image src={props.adminIdCard} style={styles.idCardImage} />
      </View>
    )}

    {/* Client ID Card */}
    {props.clientIdCard ? (
      <View style={styles.signatureBox}>
        <Text style={styles.textBold}>بطاقة العميل:</Text>
        <Image src={props.clientIdCard} style={styles.idCardImage} />
      </View>
    ) : (
      <Text style={styles.textGray}>(في انتظار رفع البطاقة)</Text>
    )}
  </View>
)}
```

---

## ⚡ Realtime Updates:

```typescript
// في contract-viewer.tsx
useEffect(() => {
  const supabase = getSupabaseClient()
  
  const channel = supabase
    .channel(`contract:${contract.id}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "contracts",
        filter: `id=eq.${contract.id}`,
      },
      (payload) => {
        console.log("Contract updated:", payload)
        toast.info("تم تحديث العقد")
        router.refresh()
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}, [contract.id, router])
```

---

## 🎯 Validation:

### **File Upload:**
```typescript
// Validate file type
if (!selectedFile.type.startsWith("image/")) {
  toast.error("يرجى اختيار صورة فقط")
  return
}

// Validate file size (max 5MB)
if (selectedFile.size > 5 * 1024 * 1024) {
  toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت")
  return
}
```

---

## 📦 Dependencies:

```json
{
  "dependencies": {
    "@react-pdf/renderer": "^3.x.x"
  }
}
```

---

## 🚀 Installation:

```bash
# 1. Install dependencies
npm install @react-pdf/renderer

# 2. Run SQL script
# في Supabase SQL Editor:
# نفذ محتوى scripts/40-add-id-card-fields.sql

# 3. Restart dev server
npm run dev
```

---

## ✅ النتيجة النهائية:

**نظام متكامل للعقود**:
- ✅ PDF يدعم العربي بشكل كامل
- ✅ رفع بطاقات الهوية
- ✅ Admin بطاقته دائماً موجودة
- ✅ Client يرفع بطاقته بعد التوقيع
- ✅ البطاقات تظهر في PDF
- ✅ Realtime updates
- ✅ Security (RLS)
- ✅ Validation
- ✅ Preview قبل الرفع

**النظام جاهز! 🎉**
