-- Fix all issues: notifications, workflow, and foreign keys

-- 1. Create notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add read column if table exists with is_read
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' 
             AND column_name = 'is_read') THEN
    ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
  END IF;
END $$;

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Enable Realtime for notifications (skip if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2. Add workflow columns to contracts if not exists
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS admin_signature_data TEXT,
ADD COLUMN IF NOT EXISTS admin_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_signed_by UUID,
ADD COLUMN IF NOT EXISTS client_signature_data TEXT,
ADD COLUMN IF NOT EXISTS client_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS final_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS contract_link_token TEXT,
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();

-- Make contract_link_token unique
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'contracts_contract_link_token_key'
  ) THEN
    ALTER TABLE public.contracts
    ADD CONSTRAINT contracts_contract_link_token_key UNIQUE (contract_link_token);
  END IF;
END $$;

-- Add foreign key for admin_signed_by
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

-- Create indexes for contracts workflow
CREATE INDEX IF NOT EXISTS idx_contracts_workflow_status ON public.contracts(workflow_status);
CREATE INDEX IF NOT EXISTS idx_contracts_link_token ON public.contracts(contract_link_token);

-- Generate unique tokens for existing contracts
UPDATE public.contracts
SET contract_link_token = gen_random_uuid()::text
WHERE contract_link_token IS NULL;

-- 3. Create contract_activities table if not exists
CREATE TABLE IF NOT EXISTS public.contract_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for contract_activities
CREATE INDEX IF NOT EXISTS idx_contract_activities_contract ON public.contract_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_activities_created ON public.contract_activities(created_at DESC);

-- Enable RLS for contract_activities
ALTER TABLE public.contract_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all contract activities" ON public.contract_activities;
DROP POLICY IF EXISTS "Clients can view their contract activities" ON public.contract_activities;
DROP POLICY IF EXISTS "System can insert contract activities" ON public.contract_activities;

-- Create policies for contract_activities
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

CREATE POLICY "System can insert contract activities"
  ON public.contract_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Create contract_deletion_requests table if not exists
CREATE TABLE IF NOT EXISTS public.contract_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for contract_deletion_requests
CREATE INDEX IF NOT EXISTS idx_deletion_requests_contract ON public.contract_deletion_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.contract_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_requested_by ON public.contract_deletion_requests(requested_by);

-- Enable RLS for contract_deletion_requests
ALTER TABLE public.contract_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all deletion requests" ON public.contract_deletion_requests;
DROP POLICY IF EXISTS "Affiliates can view their own deletion requests" ON public.contract_deletion_requests;
DROP POLICY IF EXISTS "Affiliates can create deletion requests" ON public.contract_deletion_requests;
DROP POLICY IF EXISTS "Admins can update deletion requests" ON public.contract_deletion_requests;

-- Create policies for contract_deletion_requests
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

CREATE POLICY "Affiliates can view their own deletion requests"
  ON public.contract_deletion_requests
  FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

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

-- 5. Create triggers for real-time updates
CREATE OR REPLACE FUNCTION update_contract_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contract_timestamp ON public.contracts;
CREATE TRIGGER trigger_update_contract_timestamp
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_timestamp();

CREATE OR REPLACE FUNCTION notify_contract_status_change()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trigger_notify_contract_status ON public.contracts;
CREATE TRIGGER trigger_notify_contract_status
  AFTER UPDATE OF workflow_status ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION notify_contract_status_change();

-- Verify everything
SELECT 
  'All tables and features created successfully!' as status,
  (SELECT COUNT(*) FROM public.notifications) as notifications_count,
  (SELECT COUNT(*) FROM public.contract_activities) as activities_count,
  (SELECT COUNT(*) FROM public.contract_deletion_requests) as deletion_requests_count,
  (SELECT COUNT(*) FROM public.contracts WHERE workflow_status IS NOT NULL) as contracts_with_workflow;
