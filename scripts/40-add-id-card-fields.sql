-- إضافة حقول صور البطاقات للعقود
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS admin_id_card_url TEXT,
ADD COLUMN IF NOT EXISTS admin_id_card_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS client_id_card_url TEXT,
ADD COLUMN IF NOT EXISTS client_id_card_uploaded_at TIMESTAMPTZ;

-- إضافة تعليقات
COMMENT ON COLUMN contracts.admin_id_card_url IS 'رابط صورة بطاقة المسؤول';
COMMENT ON COLUMN contracts.admin_id_card_uploaded_at IS 'تاريخ رفع صورة بطاقة المسؤول';
COMMENT ON COLUMN contracts.client_id_card_url IS 'رابط صورة بطاقة العميل';
COMMENT ON COLUMN contracts.client_id_card_uploaded_at IS 'تاريخ رفع صورة بطاقة العميل';

-- إنشاء bucket للبطاقات إذا لم يكن موجود
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-cards', 'id-cards', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies للبطاقات
CREATE POLICY "Users can upload their own ID cards"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-cards' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

CREATE POLICY "Users can view ID cards in their contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-cards' AND
  (
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    OR
    -- Users can see their own
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Users can see cards in contracts they're part of
    EXISTS (
      SELECT 1 FROM contracts
      WHERE (
        contracts.admin_id_card_url = storage.objects.name
        OR contracts.client_id_card_url = storage.objects.name
      )
      AND contracts.client_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete their own ID cards"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'id-cards' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
