-- Add missing columns to notifications table

-- Add link column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS link TEXT;

-- Add related_id column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_id UUID;

-- Add read_at column
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Rename is_read to read if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
  END IF;
END $$;

-- Add read column if it doesn't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;

-- Success message
SELECT 'All missing columns added successfully!' as status;
