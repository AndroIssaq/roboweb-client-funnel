-- إضافة إمكانية تعديل بنود العقد للأدمن والشريك
-- هذا يسمح بتخصيص كل عقد حسب احتياجات العميل

-- 1. إضافة حقل contract_terms لتخزين جميع بنود العقد بشكل مرن
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS contract_terms JSONB DEFAULT '{}'::jsonb;

-- 2. إضافة حقول إضافية للعقد
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS service_description TEXT,
ADD COLUMN IF NOT EXISTS timeline TEXT,
ADD COLUMN IF NOT EXISTS deliverables TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS payment_schedule TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2.1 إضافة حقل company_name في جدول users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 3. إضافة indexes للأداء
CREATE INDEX IF NOT EXISTS idx_contracts_contract_terms ON contracts USING gin(contract_terms);
CREATE INDEX IF NOT EXISTS idx_contracts_service_type ON contracts(service_type);
CREATE INDEX IF NOT EXISTS idx_contracts_package_name ON contracts(package_name);

-- 4. إضافة تعليقات توضيحية
COMMENT ON COLUMN contracts.contract_terms IS 'بنود العقد الكاملة بصيغة JSON - قابلة للتعديل من الأدمن والشريك';
COMMENT ON COLUMN contracts.service_description IS 'وصف تفصيلي للخدمة';
COMMENT ON COLUMN contracts.timeline IS 'المدة الزمنية المتوقعة للمشروع';
COMMENT ON COLUMN contracts.deliverables IS 'قائمة المخرجات والتسليمات';
COMMENT ON COLUMN contracts.payment_schedule IS 'جدول الدفعات';

-- 5. إنشاء جدول لتتبع تعديلات العقد
CREATE TABLE IF NOT EXISTS contract_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  modified_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  modified_by_role TEXT NOT NULL CHECK (modified_by_role IN ('admin', 'affiliate')),
  modification_type TEXT NOT NULL CHECK (modification_type IN ('terms_updated', 'amount_changed', 'deliverables_changed', 'custom_terms_added')),
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. إضافة indexes لجدول التعديلات
CREATE INDEX IF NOT EXISTS idx_contract_modifications_contract_id ON contract_modifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_modifications_modified_by ON contract_modifications(modified_by);
CREATE INDEX IF NOT EXISTS idx_contract_modifications_created_at ON contract_modifications(created_at DESC);

-- 7. تفعيل RLS على جدول التعديلات
ALTER TABLE contract_modifications ENABLE ROW LEVEL SECURITY;

-- 8. سياسات الأمان لجدول التعديلات
-- المسؤولين يمكنهم رؤية كل التعديلات
CREATE POLICY "Admins can view all modifications"
ON contract_modifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- الشركاء يمكنهم رؤية تعديلات عقودهم فقط
CREATE POLICY "Affiliates can view their contract modifications"
ON contract_modifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = contract_modifications.contract_id
    AND contracts.affiliate_id = auth.uid()
  )
);

-- العملاء يمكنهم رؤية تعديلات عقودهم
CREATE POLICY "Clients can view their contract modifications"
ON contract_modifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = contract_modifications.contract_id
    AND contracts.client_id = auth.uid()
  )
);

-- المسؤولين والشركاء يمكنهم إضافة تعديلات
CREATE POLICY "Admins and affiliates can insert modifications"
ON contract_modifications FOR INSERT
TO authenticated
WITH CHECK (
  modified_by = auth.uid()
  AND (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    OR
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_id
      AND contracts.affiliate_id = auth.uid()
      AND contracts.status IN ('draft', 'pending_signature')
    )
  )
);

-- 9. تحديث سياسات RLS للعقود للسماح بالتعديل
-- المسؤولين يمكنهم تعديل أي عقد في حالة draft أو pending_signature
DROP POLICY IF EXISTS "Admins can update draft contracts" ON contracts;
CREATE POLICY "Admins can update draft contracts"
ON contracts FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  AND status IN ('draft', 'pending_signature')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- الشركاء يمكنهم تعديل عقودهم فقط في حالة draft أو pending_signature
DROP POLICY IF EXISTS "Affiliates can update their draft contracts" ON contracts;
CREATE POLICY "Affiliates can update their draft contracts"
ON contracts FOR UPDATE
TO authenticated
USING (
  affiliate_id = auth.uid()
  AND status IN ('draft', 'pending_signature')
)
WITH CHECK (
  affiliate_id = auth.uid()
  AND status IN ('draft', 'pending_signature')
);

-- 10. إنشاء دالة لتسجيل التعديلات تلقائياً
CREATE OR REPLACE FUNCTION log_contract_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- تسجيل التعديل فقط إذا تغيرت البنود المهمة
  IF (
    OLD.service_type IS DISTINCT FROM NEW.service_type OR
    OLD.package_name IS DISTINCT FROM NEW.package_name OR
    OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
    OLD.deposit_amount IS DISTINCT FROM NEW.deposit_amount OR
    OLD.contract_terms IS DISTINCT FROM NEW.contract_terms
  ) THEN
    INSERT INTO contract_modifications (
      contract_id,
      modified_by,
      modified_by_role,
      modification_type,
      old_values,
      new_values
    )
    SELECT
      NEW.id,
      auth.uid(),
      users.role,
      'terms_updated',
      jsonb_build_object(
        'service_type', OLD.service_type,
        'package_name', OLD.package_name,
        'total_amount', OLD.total_amount,
        'deposit_amount', OLD.deposit_amount,
        'contract_terms', OLD.contract_terms
      ),
      jsonb_build_object(
        'service_type', NEW.service_type,
        'package_name', NEW.package_name,
        'total_amount', NEW.total_amount,
        'deposit_amount', NEW.deposit_amount,
        'contract_terms', NEW.contract_terms
      )
    FROM users
    WHERE users.id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. إنشاء trigger لتسجيل التعديلات
DROP TRIGGER IF EXISTS trigger_log_contract_modification ON contracts;
CREATE TRIGGER trigger_log_contract_modification
AFTER UPDATE ON contracts
FOR EACH ROW
WHEN (
  OLD.status IN ('draft', 'pending_signature') AND
  NEW.status IN ('draft', 'pending_signature')
)
EXECUTE FUNCTION log_contract_modification();

-- 12. إنشاء view لعرض آخر التعديلات على العقود
CREATE OR REPLACE VIEW contract_latest_modifications AS
SELECT DISTINCT ON (cm.contract_id)
  cm.id,
  cm.contract_id,
  cm.modified_by,
  u.full_name as modified_by_name,
  cm.modified_by_role,
  cm.modification_type,
  cm.created_at as modified_at,
  c.contract_number,
  c.status as contract_status
FROM contract_modifications cm
JOIN users u ON u.id = cm.modified_by
JOIN contracts c ON c.id = cm.contract_id
ORDER BY cm.contract_id, cm.created_at DESC;

-- 13. منح الصلاحيات
GRANT SELECT ON contract_latest_modifications TO authenticated;

-- 14. إنشاء دالة للحصول على سجل تعديلات عقد معين
CREATE OR REPLACE FUNCTION get_contract_modification_history(contract_uuid UUID)
RETURNS TABLE (
  id UUID,
  modified_by_name TEXT,
  modified_by_role TEXT,
  modification_type TEXT,
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    u.full_name as modified_by_name,
    cm.modified_by_role,
    cm.modification_type,
    cm.old_values,
    cm.new_values,
    cm.notes,
    cm.created_at
  FROM contract_modifications cm
  JOIN users u ON u.id = cm.modified_by
  WHERE cm.contract_id = contract_uuid
  ORDER BY cm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. منح صلاحيات تنفيذ الدالة
GRANT EXECUTE ON FUNCTION get_contract_modification_history(UUID) TO authenticated;

-- 16. إضافة قيود للتأكد من صحة البيانات
ALTER TABLE contracts
ADD CONSTRAINT check_total_amount_positive CHECK (total_amount > 0),
ADD CONSTRAINT check_deposit_amount_positive CHECK (deposit_amount >= 0),
ADD CONSTRAINT check_deposit_not_exceed_total CHECK (deposit_amount <= total_amount);

-- 17. تحديث العقود الموجودة بقيم افتراضية
UPDATE contracts
SET contract_terms = jsonb_build_object(
  'service', jsonb_build_object(
    'type', COALESCE(service_type, ''),
    'package_name', COALESCE(package_name, ''),
    'description', '',
    'timeline', '',
    'deliverables', ARRAY[]::TEXT[]
  ),
  'payment', jsonb_build_object(
    'total_amount', COALESCE(total_amount, 0),
    'deposit_amount', COALESCE(deposit_amount, 0),
    'remaining_amount', COALESCE(remaining_amount, 0),
    'payment_method', COALESCE(payment_method, ''),
    'payment_schedule', ARRAY[]::TEXT[]
  ),
  'custom_terms', '[]'::jsonb
)
WHERE contract_terms = '{}'::jsonb OR contract_terms IS NULL;

-- 18. إنشاء دالة للتحقق من إمكانية تعديل العقد
CREATE OR REPLACE FUNCTION can_edit_contract(contract_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  contract_status TEXT;
  user_role TEXT;
  is_affiliate BOOLEAN;
BEGIN
  -- جلب حالة العقد
  SELECT status INTO contract_status
  FROM contracts
  WHERE id = contract_uuid;
  
  -- جلب دور المستخدم
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid;
  
  -- التحقق من أن المستخدم شريك هذا العقد
  SELECT EXISTS(
    SELECT 1 FROM contracts
    WHERE id = contract_uuid
    AND affiliate_id = user_uuid
  ) INTO is_affiliate;
  
  -- يمكن التعديل إذا:
  -- 1. العقد في حالة draft أو pending_signature
  -- 2. المستخدم admin أو شريك العقد
  RETURN (
    contract_status IN ('draft', 'pending_signature')
    AND (user_role = 'admin' OR is_affiliate)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. منح صلاحيات تنفيذ الدالة
GRANT EXECUTE ON FUNCTION can_edit_contract(UUID, UUID) TO authenticated;

-- 20. إنشاء إشعار عند تعديل عقد من شريك
CREATE OR REPLACE FUNCTION notify_admins_on_affiliate_modification()
RETURNS TRIGGER AS $$
DECLARE
  modifier_role TEXT;
  contract_num TEXT;
BEGIN
  -- جلب دور المعدّل
  SELECT role INTO modifier_role
  FROM users
  WHERE id = NEW.modified_by;
  
  -- إذا كان المعدّل شريك، أرسل إشعار للمسؤولين
  IF modifier_role = 'affiliate' THEN
    SELECT contract_number INTO contract_num
    FROM contracts
    WHERE id = NEW.contract_id;
    
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT 
      id,
      'تعديل على عقد من شريك',
      'قام شريك بتعديل بنود العقد رقم ' || contract_num,
      'contract_modified',
      '/admin/contracts/' || NEW.contract_id
    FROM users
    WHERE role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21. إنشاء trigger للإشعارات
DROP TRIGGER IF EXISTS trigger_notify_admins_on_affiliate_modification ON contract_modifications;
CREATE TRIGGER trigger_notify_admins_on_affiliate_modification
AFTER INSERT ON contract_modifications
FOR EACH ROW
EXECUTE FUNCTION notify_admins_on_affiliate_modification();

-- 22. إضافة معلومات إضافية للعقد
COMMENT ON TABLE contract_modifications IS 'سجل كامل لجميع التعديلات على العقود - يتتبع من عدّل ومتى وماذا تغير';
COMMENT ON COLUMN contract_modifications.modified_by_role IS 'دور المعدّل: admin أو affiliate';
COMMENT ON COLUMN contract_modifications.old_values IS 'القيم القديمة قبل التعديل';
COMMENT ON COLUMN contract_modifications.new_values IS 'القيم الجديدة بعد التعديل';

SELECT 'Contract terms editing system created successfully! الأدمن والشريك يمكنهم الآن تعديل العقود 🎉' as status;
