-- Fix Signatures Realtime Issues
-- This script ensures all signature-related columns and constraints are properly set up

-- 1. Ensure all signature columns exist
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS admin_signature_data TEXT,
ADD COLUMN IF NOT EXISTS admin_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_signed_by UUID,
ADD COLUMN IF NOT EXISTS client_signature_data TEXT,
ADD COLUMN IF NOT EXISTS client_signature_date TIMESTAMPTZ;

-- 2. Ensure workflow_status exists and has correct default
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'contracts' 
    AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE public.contracts ADD COLUMN workflow_status TEXT DEFAULT 'draft';
  END IF;
END $$;

-- 3. Add foreign key for admin_signed_by if not exists
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

-- 4. Enable Realtime for contracts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;

-- 5. Ensure RLS is enabled
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- 6. Add policy for reading contracts (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contracts' 
    AND policyname = 'Users can view their own contracts'
  ) THEN
    CREATE POLICY "Users can view their own contracts"
    ON public.contracts FOR SELECT
    USING (
      auth.uid() = client_id 
      OR auth.uid() = affiliate_id 
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

-- 7. Add policy for updating contracts (signatures)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contracts' 
    AND policyname = 'Admins and clients can update signatures'
  ) THEN
    CREATE POLICY "Admins and clients can update signatures"
    ON public.contracts FOR UPDATE
    USING (
      auth.uid() = client_id 
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      auth.uid() = client_id 
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

-- 8. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_workflow_status ON public.contracts(workflow_status);
CREATE INDEX IF NOT EXISTS idx_contracts_admin_signed_by ON public.contracts(admin_signed_by);

SELECT 'Signatures Realtime setup completed successfully!' as status;
