-- Safe fix script - handles existing tables and configurations

-- 1. Fix notifications table column name (is_read -> read)
DO $$ 
BEGIN
  -- Check if is_read exists and rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
    RAISE NOTICE 'Renamed is_read to read';
  END IF;

  -- Add read column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read BOOLEAN NOT NULL DEFAULT FALSE;
    RAISE NOTICE 'Added read column';
  END IF;

  -- Add link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'link'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN link TEXT;
    RAISE NOTICE 'Added link column';
  END IF;

  -- Add related_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'related_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN related_id UUID;
    RAISE NOTICE 'Added related_id column';
  END IF;

  -- Add read_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read_at TIMESTAMPTZ;
    RAISE NOTICE 'Added read_at column';
  END IF;
END $$;

-- 2. Drop and recreate index with correct column name
DROP INDEX IF EXISTS idx_notifications_unread;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = FALSE;

-- 2.5. Fix notification types constraint
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('contract', 'payment', 'project', 'message', 'system', 'referral', 'deletion'));

-- 3. Ensure delete policy exists
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Enable Realtime for notifications (skip if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    RAISE NOTICE 'Added notifications to realtime publication';
  ELSE
    RAISE NOTICE 'Notifications already in realtime publication';
  END IF;
END $$;

-- 5. Add workflow columns to contracts if not exists
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS admin_signature_data TEXT,
ADD COLUMN IF NOT EXISTS admin_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_signed_by UUID,
ADD COLUMN IF NOT EXISTS client_signature_data TEXT,
ADD COLUMN IF NOT EXISTS client_signature_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS final_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS contract_link_token TEXT;

-- 6. Add affiliate_code to users if not exists
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE;

-- 7. Create index on affiliate_code
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON public.users(affiliate_code) WHERE affiliate_code IS NOT NULL;

-- 8. Create contract_activities table if not exists
CREATE TABLE IF NOT EXISTS public.contract_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Create indexes for contract_activities
CREATE INDEX IF NOT EXISTS idx_contract_activities_contract ON public.contract_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_activities_user ON public.contract_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_activities_created ON public.contract_activities(created_at DESC);

-- 10. Enable RLS for contract_activities
ALTER TABLE public.contract_activities ENABLE ROW LEVEL SECURITY;

-- 11. Drop existing policies for contract_activities
DROP POLICY IF EXISTS "Users can view activities for their contracts" ON public.contract_activities;
DROP POLICY IF EXISTS "System can insert activities" ON public.contract_activities;

-- 12. Create policies for contract_activities
CREATE POLICY "Users can view activities for their contracts"
  ON public.contract_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = contract_activities.contract_id
      AND (
        contracts.client_id = auth.uid()
        OR contracts.affiliate_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
      )
    )
  );

CREATE POLICY "System can insert activities"
  ON public.contract_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 13. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All fixes applied successfully!';
  RAISE NOTICE '✅ Notifications table updated';
  RAISE NOTICE '✅ Realtime enabled';
  RAISE NOTICE '✅ Contract workflow columns added';
  RAISE NOTICE '✅ Contract activities table ready';
END $$;
