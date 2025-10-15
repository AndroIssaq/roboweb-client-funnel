-- Roboweb Client Funnel System - Demo Data
-- Phase 1: Seed data for testing

-- Note: Users must be created through Supabase Auth first
-- This script only creates the supporting data

-- Remove manual user creation, only create supporting records

-- Insert demo contract (assumes users exist in auth.users)
-- You'll need to replace these UUIDs with actual auth user IDs after creating users
INSERT INTO contracts (id, contract_number, client_id, service_type, package_name, total_amount, deposit_amount, remaining_amount, payment_method, contract_terms, status)
VALUES 
  ('00000000-0000-0000-0000-000000000101', 'RW-2025-DEMO1', 
   -- Replace this with actual client user ID from auth.users
   '00000000-0000-0000-0000-000000000002', 
   'تصميم موقع', 'الباقة الذهبية', 15000.00, 7500.00, 7500.00, 'bank_transfer', 
   '{"terms": ["تسليم خلال 30 يوم", "3 مراجعات مجانية", "دعم فني لمدة 6 أشهر"], "notes": "عقد تجريبي للاختبار"}', 'signed')
ON CONFLICT (id) DO NOTHING;

-- Insert demo client profile
INSERT INTO clients (id, user_id, contract_id, company_name, industry, website_url, onboarding_completed, email, phone)
VALUES 
  ('00000000-0000-0000-0000-000000000201', 
   '00000000-0000-0000-0000-000000000002', 
   '00000000-0000-0000-0000-000000000101', 
   'شركة التقنية المتقدمة', 'تقنية', 'https://example.sa', true,
   'client@example.sa', '+966509876543')
ON CONFLICT (id) DO NOTHING;

-- Insert demo project
INSERT INTO projects (id, client_id, contract_id, project_name, project_type, description, start_date, expected_delivery_date, status, progress_percentage, deliverables)
VALUES 
  ('00000000-0000-0000-0000-000000000301', 
   '00000000-0000-0000-0000-000000000201', 
   '00000000-0000-0000-0000-000000000101', 
   'موقع شركة التقنية', 'موقع إلكتروني', 
   'تصميم وتطوير موقع شركة متكامل', 
   '2025-01-15', '2025-02-15', 'in_progress', 45,
   '{"items": [{"name": "تصميم الواجهات", "status": "completed"}, {"name": "التطوير", "status": "in_progress"}, {"name": "الاختبار", "status": "pending"}]}')
ON CONFLICT (id) DO NOTHING;

-- Insert demo portfolio items
INSERT INTO portfolio (id, title, description, category, tags, thumbnail_url, is_featured, is_published, display_order, slug, project_url, client_name, completion_date)
VALUES 
  ('00000000-0000-0000-0000-000000000401', 
   'موقع شركة تجارية', 
   'تصميم موقع إلكتروني احترافي لشركة تجارية رائدة في مجال التجارة الإلكترونية. يتضمن الموقع نظام إدارة محتوى متقدم وتكامل مع بوابات الدفع.',
   'مواقع إلكترونية', 
   ARRAY['تصميم', 'تطوير', 'تجارة إلكترونية'], 
   '/placeholder.svg?height=400&width=600', 
   true, true, 1, 'commercial-company-website',
   'https://example.com', 'شركة التجارة الحديثة', '2024-12-15'),
  ('00000000-0000-0000-0000-000000000402', 
   'تطبيق جوال للتوصيل', 
   'تطبيق جوال متكامل لخدمات التوصيل السريع مع نظام تتبع مباشر وإدارة الطلبات.',
   'تطبيقات جوال', 
   ARRAY['تطبيق', 'iOS', 'Android', 'توصيل'], 
   '/placeholder.svg?height=400&width=600', 
   true, true, 2, 'delivery-mobile-app',
   'https://apps.apple.com/example', 'شركة التوصيل السريع', '2024-11-20'),
  ('00000000-0000-0000-0000-000000000403', 
   'هوية بصرية متكاملة', 
   'تصميم هوية بصرية شاملة تتضمن الشعار والألوان والخطوط ودليل الاستخدام.',
   'هوية بصرية', 
   ARRAY['تصميم', 'برanding', 'هوية'], 
   '/placeholder.svg?height=400&width=600', 
   false, true, 3, 'complete-brand-identity',
   null, 'مؤسسة الإبداع', '2024-10-05')
ON CONFLICT (id) DO NOTHING;

-- Insert demo affiliate (assumes affiliate user exists in auth.users)
INSERT INTO affiliates (id, user_id, affiliate_code, commission_rate, total_referrals, total_earnings, pending_earnings, paid_earnings)
VALUES 
  ('00000000-0000-0000-0000-000000000501', 
   '00000000-0000-0000-0000-000000000003', 
   'DEMO2025', 15.00, 1, 2250.00, 2250.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- Insert demo activity log
INSERT INTO activity_log (user_id, entity_type, entity_id, action, description)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'project', '00000000-0000-0000-0000-000000000301', 'progress_update', 'تم تحديث تقدم المشروع إلى 45%'),
  ('00000000-0000-0000-0000-000000000002', 'client', '00000000-0000-0000-0000-000000000201', 'onboarding_completed', 'أكمل العميل نموذج التأهيل');

-- Create a helpful comment about setting up demo users
COMMENT ON TABLE users IS 'Demo users should be created through Supabase Auth Dashboard or signup flow. Use these credentials for testing: admin@roboweb.sa, client@example.sa, affiliate@example.sa';
