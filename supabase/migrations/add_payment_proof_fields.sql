-- إضافة حقول إثبات الدفع للعقود لضمان حقوق جميع الأطراف
-- هذا يضمن: حق العميل (خدمة مضمونة) + حق الشركة (دفع مثبت) + حق الشريك (عمولة مضمونة)

-- 1. إضافة حقول إثبات الدفع
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_proof_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_proof_verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS payment_proof_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_proof_notes TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_method TEXT CHECK (payment_proof_method IN ('instapay', 'vodafone_cash', 'bank_transfer', 'other'));

-- 2. إضافة حقول معلومات الدفع للشريك
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS affiliate_commission_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS affiliate_commission_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS affiliate_commission_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS affiliate_commission_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS affiliate_payment_proof_url TEXT;

-- 3. تحديث حالات العقد لتشمل حالة "pending_payment_proof"
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE contracts 
ADD CONSTRAINT contracts_status_check 
CHECK (status IN (
  'draft', 
  'pending_signature', 
  'pending_payment_proof',  -- جديد: بانتظار إثبات الدفع
  'pending_verification',    -- جديد: بانتظار التحقق من الدفع
  'signed', 
  'active', 
  'completed', 
  'cancelled',
  'suspended'               -- جديد: معلق لعدم الدفع
));

-- 4. إضافة تعليقات توضيحية
COMMENT ON COLUMN contracts.payment_proof_url IS 'رابط صورة إثبات الدفع (InstaPay/Vodafone Cash/تحويل بنكي)';
COMMENT ON COLUMN contracts.payment_proof_uploaded_at IS 'تاريخ رفع إثبات الدفع';
COMMENT ON COLUMN contracts.payment_proof_verified IS 'هل تم التحقق من إثبات الدفع؟';
COMMENT ON COLUMN contracts.payment_proof_verified_by IS 'المسؤول الذي تحقق من الدفع';
COMMENT ON COLUMN contracts.payment_proof_verified_at IS 'تاريخ التحقق من الدفع';
COMMENT ON COLUMN contracts.payment_proof_notes IS 'ملاحظات حول الدفع';
COMMENT ON COLUMN contracts.payment_proof_method IS 'طريقة الدفع المستخدمة';
COMMENT ON COLUMN contracts.affiliate_commission_amount IS 'مبلغ عمولة الشريك';
COMMENT ON COLUMN contracts.affiliate_commission_percentage IS 'نسبة عمولة الشريك';
COMMENT ON COLUMN contracts.affiliate_commission_paid IS 'هل تم دفع عمولة الشريك؟';
COMMENT ON COLUMN contracts.affiliate_commission_paid_at IS 'تاريخ دفع عمولة الشريك';
COMMENT ON COLUMN contracts.affiliate_payment_proof_url IS 'إثبات دفع عمولة الشريك';

-- 5. إنشاء جدول سجل الدفعات لتتبع كامل
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'installment', 'final_payment', 'affiliate_commission', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_proof_url TEXT,
  transaction_reference TEXT,
  payer_name TEXT,
  payer_phone TEXT,
  receiver_name TEXT,
  receiver_account TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_contracts_payment_proof_verified ON contracts(payment_proof_verified);
CREATE INDEX IF NOT EXISTS idx_contracts_affiliate_commission_paid ON contracts(affiliate_commission_paid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_contract_id ON payment_transactions(contract_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(transaction_type);

-- 7. تفعيل RLS على جدول المعاملات
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 8. سياسات الأمان لجدول المعاملات
CREATE POLICY "Users can view their payment transactions"
ON payment_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = payment_transactions.contract_id
    AND (
      contracts.client_id = auth.uid()
      OR contracts.affiliate_id = auth.uid()
      OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    )
  )
);

CREATE POLICY "Clients can insert payment proofs"
ON payment_transactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contracts
    WHERE contracts.id = contract_id
    AND contracts.client_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all transactions"
ON payment_transactions FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- 9. إنشاء دالة لحساب عمولة الشريك تلقائياً
CREATE OR REPLACE FUNCTION calculate_affiliate_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا كان هناك شريك، احسب العمولة
  IF NEW.affiliate_id IS NOT NULL THEN
    -- جلب نسبة العمولة من جدول الشركاء
    SELECT commission_rate INTO NEW.affiliate_commission_percentage
    FROM affiliates
    WHERE user_id = NEW.affiliate_id;
    
    -- حساب مبلغ العمولة
    IF NEW.affiliate_commission_percentage IS NOT NULL THEN
      NEW.affiliate_commission_amount := (NEW.total_amount * NEW.affiliate_commission_percentage / 100);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. إنشاء trigger لحساب العمولة تلقائياً
DROP TRIGGER IF EXISTS trigger_calculate_affiliate_commission ON contracts;
CREATE TRIGGER trigger_calculate_affiliate_commission
BEFORE INSERT OR UPDATE OF total_amount, affiliate_id ON contracts
FOR EACH ROW
EXECUTE FUNCTION calculate_affiliate_commission();

-- 11. إنشاء دالة لتحديث حالة العقد بناءً على الدفع
CREATE OR REPLACE FUNCTION update_contract_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا تم التحقق من الدفع، حدث حالة العقد
  IF NEW.payment_proof_verified = TRUE AND OLD.payment_proof_verified = FALSE THEN
    NEW.status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. إنشاء trigger لتحديث حالة العقد
DROP TRIGGER IF EXISTS trigger_update_contract_status_on_payment ON contracts;
CREATE TRIGGER trigger_update_contract_status_on_payment
BEFORE UPDATE OF payment_proof_verified ON contracts
FOR EACH ROW
EXECUTE FUNCTION update_contract_status_on_payment();

-- 13. إنشاء دالة لإرسال إشعار عند رفع إثبات الدفع
CREATE OR REPLACE FUNCTION notify_payment_proof_uploaded()
RETURNS TRIGGER AS $$
BEGIN
  -- إنشاء إشعار للمسؤولين
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    link
  )
  SELECT 
    id,
    'إثبات دفع جديد',
    'تم رفع إثبات دفع جديد للعقد رقم ' || NEW.contract_number,
    'payment_proof',
    '/admin/contracts/' || NEW.id
  FROM users
  WHERE role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. إنشاء trigger للإشعارات
DROP TRIGGER IF EXISTS trigger_notify_payment_proof_uploaded ON contracts;
CREATE TRIGGER trigger_notify_payment_proof_uploaded
AFTER UPDATE OF payment_proof_url ON contracts
FOR EACH ROW
WHEN (NEW.payment_proof_url IS NOT NULL AND OLD.payment_proof_url IS NULL)
EXECUTE FUNCTION notify_payment_proof_uploaded();

-- 15. إنشاء view لعرض حالة الدفعات
CREATE OR REPLACE VIEW contract_payment_status AS
SELECT 
  c.id,
  c.contract_number,
  c.total_amount,
  c.deposit_amount,
  c.remaining_amount,
  c.payment_proof_url IS NOT NULL as has_payment_proof,
  c.payment_proof_verified,
  c.payment_proof_method,
  c.affiliate_commission_amount,
  c.affiliate_commission_paid,
  COUNT(pt.id) as total_transactions,
  SUM(CASE WHEN pt.status = 'verified' THEN pt.amount ELSE 0 END) as verified_amount,
  SUM(CASE WHEN pt.status = 'pending' THEN pt.amount ELSE 0 END) as pending_amount
FROM contracts c
LEFT JOIN payment_transactions pt ON c.id = pt.contract_id
GROUP BY c.id;

-- 16. منح الصلاحيات
GRANT SELECT ON contract_payment_status TO authenticated;

SELECT 'Payment proof fields added successfully! حقوق جميع الأطراف محمية الآن.' as status;
