-- Fix notification types constraint

-- Drop existing constraint if exists
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with all types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('contract', 'payment', 'project', 'message', 'system', 'referral', 'deletion'));

-- Success message
SELECT 'Notification types constraint updated successfully!' as status;
