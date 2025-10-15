-- Update contracts table to support full workflow with signatures

-- Add new columns for workflow
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'draft', -- 'draft', 'pending_admin_signature', 'pending_client_signature', 'completed', 'cancelled'
ADD COLUMN IF NOT EXISTS admin_signature_data TEXT,
ADD COLUMN IF NOT EXISTS admin_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_signed_by UUID,
ADD COLUMN IF NOT EXISTS client_signature_data TEXT,
ADD COLUMN IF NOT EXISTS client_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS final_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS contract_link_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Add foreign key constraints separately (to avoid conflicts)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contracts_admin_signed_by_fkey'
  ) THEN
    ALTER TABLE public.contracts
    ADD CONSTRAINT contracts_admin_signed_by_fkey
    FOREIGN KEY (admin_signed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for workflow status
CREATE INDEX IF NOT EXISTS idx_contracts_workflow_status ON public.contracts(workflow_status);
CREATE INDEX IF NOT EXISTS idx_contracts_link_token ON public.contracts(contract_link_token);

-- Generate unique tokens for existing contracts
UPDATE public.contracts
SET contract_link_token = gen_random_uuid()::text
WHERE contract_link_token IS NULL;

-- Create contract_activities table for tracking all actions
CREATE TABLE IF NOT EXISTS public.contract_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL, -- 'created', 'admin_signed', 'client_signed', 'viewed', 'downloaded', 'cancelled'
  activity_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contract_activities_contract ON public.contract_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_activities_created ON public.contract_activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.contract_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all activities
CREATE POLICY "Admins can view all contract activities"
  ON public.contract_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Clients can view their contract activities
CREATE POLICY "Clients can view their contract activities"
  ON public.contract_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = contract_activities.contract_id
      AND contracts.client_id = auth.uid()
    )
  );

-- Policy: System can insert activities
CREATE POLICY "System can insert contract activities"
  ON public.contract_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_contract_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_updated
DROP TRIGGER IF EXISTS trigger_update_contract_timestamp ON public.contracts;
CREATE TRIGGER trigger_update_contract_timestamp
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_timestamp();

-- Function to notify on contract status change
CREATE OR REPLACE FUNCTION notify_contract_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be used for real-time updates
  PERFORM pg_notify(
    'contract_updates',
    json_build_object(
      'contract_id', NEW.id,
      'workflow_status', NEW.workflow_status,
      'updated_at', NEW.last_updated
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for real-time notifications
DROP TRIGGER IF EXISTS trigger_notify_contract_status ON public.contracts;
CREATE TRIGGER trigger_notify_contract_status
  AFTER UPDATE OF workflow_status ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION notify_contract_status_change();

-- Verify updates
SELECT 
  'Contracts workflow schema updated successfully' as status,
  COUNT(*) as total_contracts,
  COUNT(CASE WHEN workflow_status = 'draft' THEN 1 END) as draft_contracts,
  COUNT(CASE WHEN workflow_status = 'completed' THEN 1 END) as completed_contracts
FROM public.contracts;
