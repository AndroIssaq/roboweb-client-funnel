-- Create contract deletion requests table

CREATE TABLE IF NOT EXISTS public.contract_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deletion_requests_contract ON public.contract_deletion_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.contract_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_requested_by ON public.contract_deletion_requests(requested_by);

-- Enable RLS
ALTER TABLE public.contract_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
  ON public.contract_deletion_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy: Affiliates can view their own deletion requests
CREATE POLICY "Affiliates can view their own deletion requests"
  ON public.contract_deletion_requests
  FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

-- Policy: Affiliates can create deletion requests
CREATE POLICY "Affiliates can create deletion requests"
  ON public.contract_deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'affiliate'
    )
  );

-- Policy: Admins can update deletion requests
CREATE POLICY "Admins can update deletion requests"
  ON public.contract_deletion_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Verify table creation
SELECT 
  'contract_deletion_requests table created successfully' as status,
  COUNT(*) as total_requests
FROM public.contract_deletion_requests;
