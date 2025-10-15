-- Fix schema issues and add missing functions

-- 1. Fix affiliates table - rename referral_code to affiliate_code for consistency
ALTER TABLE affiliates RENAME COLUMN referral_code TO affiliate_code;

-- 2. Drop the old index and create new one
DROP INDEX IF EXISTS idx_affiliates_referral_code;
CREATE INDEX IF NOT EXISTS idx_affiliates_affiliate_code ON affiliates(affiliate_code);

-- 3. Create affiliate_payouts table (was missing from original schema)
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

CREATE TRIGGER update_affiliate_payouts_updated_at 
  BEFORE UPDATE ON affiliate_payouts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Add missing columns to portfolio table
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Generate slugs for existing records
UPDATE portfolio 
SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- 5. Add missing columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;

-- 6. Create RPC function for incrementing affiliate referrals
CREATE OR REPLACE FUNCTION increment_affiliate_referrals(affiliate_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE affiliates
  SET total_referrals = total_referrals + 1
  WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to calculate affiliate earnings
CREATE OR REPLACE FUNCTION update_affiliate_earnings(affiliate_id UUID)
RETURNS VOID AS $$
DECLARE
  total_earned DECIMAL(10, 2);
  total_paid DECIMAL(10, 2);
BEGIN
  -- Calculate total earnings from contracts
  SELECT COALESCE(SUM(c.total_amount * a.commission_rate / 100), 0)
  INTO total_earned
  FROM contracts c
  JOIN affiliates a ON a.id = c.affiliate_id
  WHERE c.affiliate_id = affiliate_id AND c.status IN ('signed', 'active', 'completed');
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0)
  INTO total_paid
  FROM affiliate_payouts
  WHERE affiliate_payouts.affiliate_id = update_affiliate_earnings.affiliate_id 
    AND status = 'paid';
  
  -- Update affiliate record
  UPDATE affiliates
  SET 
    total_earnings = total_earned,
    paid_earnings = total_paid,
    pending_earnings = total_earned - total_paid
  WHERE id = affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Add trigger to update affiliate earnings when contract is created/updated
CREATE OR REPLACE FUNCTION trigger_update_affiliate_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.affiliate_id IS NOT NULL THEN
    PERFORM update_affiliate_earnings(NEW.affiliate_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contract_affiliate_earnings_trigger
  AFTER INSERT OR UPDATE ON contracts
  FOR EACH ROW
  WHEN (NEW.affiliate_id IS NOT NULL)
  EXECUTE FUNCTION trigger_update_affiliate_earnings();

-- 9. Add trigger to update affiliate earnings when payout status changes
CREATE OR REPLACE FUNCTION trigger_update_affiliate_earnings_on_payout()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_affiliate_earnings(NEW.affiliate_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payout_affiliate_earnings_trigger
  AFTER INSERT OR UPDATE ON affiliate_payouts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_affiliate_earnings_on_payout();
