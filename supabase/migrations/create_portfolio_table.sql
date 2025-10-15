-- Create portfolio_projects table
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  client_name TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  thumbnail_url TEXT,
  images TEXT[], -- Array of image URLs
  technologies TEXT[] NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  color TEXT NOT NULL DEFAULT '#10b981', -- emerald-500
  live_url TEXT,
  github_url TEXT,
  featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published', -- published, draft
  views INTEGER DEFAULT 0,
  stats JSONB, -- {label, value}[]
  testimonial JSONB, -- {text, author, position, avatar}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_projects(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_status ON portfolio_projects(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_projects(featured);
CREATE INDEX IF NOT EXISTS idx_portfolio_slug ON portfolio_projects(slug);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER portfolio_updated_at
  BEFORE UPDATE ON portfolio_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_updated_at();

-- Insert dummy data
INSERT INTO portfolio_projects (
  title, title_en, slug, category, description, client_name, year,
  thumbnail_url, technologies, features, color, live_url, featured, status, stats, testimonial
) VALUES
(
  'متجر الأزياء العصري',
  'Modern Fashion Store',
  'modern-fashion-store',
  'تجارة إلكترونية',
  'متجر إلكتروني متكامل للأزياء العصرية مع نظام دفع آمن وإدارة مخزون متقدمة. يوفر تجربة تسوق سلسة مع تصميم عصري وسريع.',
  'شركة الموضة الحديثة',
  2024,
  '/placeholder-fashion.jpg',
  ARRAY['Next.js 14', 'Tailwind CSS', 'Stripe', 'Supabase', 'Framer Motion'],
  ARRAY['نظام سلة تسوق متقدم', 'دفع آمن متعدد الطرق', 'إدارة المخزون التلقائية', 'تتبع الطلبات في الوقت الفعلي', 'نظام تقييم المنتجات', 'خصومات وكوبونات ذكية'],
  '#FF6B9D',
  'https://fashion-store-demo.vercel.app',
  true,
  'published',
  '[{"label": "زيادة المبيعات", "value": "+250%"}, {"label": "معدل التحويل", "value": "12.5%"}, {"label": "متوسط قيمة الطلب", "value": "850 ج.م"}]'::jsonb,
  '{"text": "المتجر تجاوز كل توقعاتنا! التصميم رائع والأداء ممتاز", "author": "أحمد محمد", "position": "مدير التسويق", "avatar": "/avatar1.jpg"}'::jsonb
),
(
  'منصة التعليم الإلكتروني',
  'E-Learning Platform',
  'elearning-platform',
  'تطبيقات الويب',
  'منصة تعليمية شاملة توفر كورسات متنوعة مع نظام إدارة تعلم متقدم وشهادات معتمدة. تدعم البث المباشر والتفاعل بين الطلاب والمعلمين.',
  'أكاديمية المستقبل',
  2024,
  '/placeholder-elearning.jpg',
  ARRAY['React', 'Node.js', 'MongoDB', 'WebRTC', 'AWS', 'Socket.io'],
  ARRAY['بث مباشر للمحاضرات', 'اختبارات تفاعلية', 'شهادات معتمدة', 'تتبع التقدم الدراسي', 'منتدى نقاش للطلاب', 'دعم متعدد اللغات'],
  '#8B5CF6',
  'https://elearning-demo.vercel.app',
  true,
  'published',
  '[{"label": "طلاب نشطين", "value": "15,000+"}, {"label": "معدل الرضا", "value": "98%"}, {"label": "معدل إكمال الكورسات", "value": "87%"}]'::jsonb,
  '{"text": "المنصة أحدثت ثورة في طريقة تدريسنا وزادت التفاعل بشكل كبير", "author": "د. سارة أحمد", "position": "مديرة الأكاديمية", "avatar": "/avatar2.jpg"}'::jsonb
),
(
  'بورتفوليو مصور محترف',
  'Professional Photographer Portfolio',
  'photographer-portfolio',
  'معرض أعمال',
  'موقع معرض أعمال مذهل لمصور محترف يعرض أعماله بطريقة فنية مبدعة مع معرض صور تفاعلي وحجز مواعيد مدمج.',
  'استوديو النور',
  2024,
  '/placeholder-photo.jpg',
  ARRAY['Next.js', 'Three.js', 'Tailwind CSS', 'Cloudinary', 'Framer Motion'],
  ARRAY['معرض صور 3D تفاعلي', 'نظام حجز مواعيد', 'إدارة الألبومات', 'مشاركة سريعة على السوشيال ميديا', 'حماية الصور بالعلامة المائية', 'استعراض بدقة عالية'],
  '#06B6D4',
  'https://photographer-demo.vercel.app',
  true,
  'published',
  '[{"label": "زيادة العملاء", "value": "+180%"}, {"label": "مشاهدات شهرية", "value": "50,000+"}, {"label": "معدل التفاعل", "value": "8.5%"}]'::jsonb,
  '{"text": "الموقع يعرض أعمالي بشكل احترافي وجذب الكثير من العملاء الجدد", "author": "محمد علي", "position": "مصور فوتوغرافي", "avatar": "/avatar3.jpg"}'::jsonb
),
(
  'تطبيق توصيل الطعام',
  'Food Delivery App',
  'food-delivery-app',
  'تطبيقات الموبايل',
  'تطبيق توصيل طعام شامل يربط المطاعم بالعملاء مع تتبع الطلبات في الوقت الفعلي ونظام دفع آمن وتقييمات المطاعم.',
  'شركة سريع',
  2023,
  '/placeholder-food.jpg',
  ARRAY['React Native', 'Node.js', 'PostgreSQL', 'Redis', 'Google Maps API'],
  ARRAY['تتبع الطلب على الخريطة', 'دفع متعدد الطرق', 'نظام تقييم', 'برنامج ولاء', 'إشعارات فورية', 'دعم فني 24/7'],
  '#F59E0B',
  NULL,
  false,
  'published',
  '[{"label": "طلبات يومية", "value": "5,000+"}, {"label": "مطاعم مسجلة", "value": "250+"}, {"label": "وقت التوصيل المتوسط", "value": "28 دقيقة"}]'::jsonb,
  '{"text": "التطبيق سهل الاستخدام وزاد مبيعاتنا بشكل ملحوظ", "author": "خالد حسن", "position": "مدير المطعم", "avatar": "/avatar4.jpg"}'::jsonb
),
(
  'لوحة تحكم تحليلات',
  'Analytics Dashboard',
  'analytics-dashboard',
  'تطبيقات الويب',
  'لوحة تحكم تحليلية متقدمة توفر رؤى عميقة عن البيانات مع مخططات تفاعلية وتقارير قابلة للتخصيص وتصدير البيانات.',
  'شركة البيانات الذكية',
  2023,
  '/placeholder-analytics.jpg',
  ARRAY['React', 'TypeScript', 'D3.js', 'Express', 'PostgreSQL'],
  ARRAY['مخططات تفاعلية', 'تقارير قابلة للتخصيص', 'تصدير البيانات', 'تحليلات في الوقت الفعلي', 'لوحات معلومات متعددة', 'تنبيهات ذكية'],
  '#10B981',
  'https://analytics-demo.vercel.app',
  false,
  'published',
  '[{"label": "بيانات معالجة", "value": "100M+"}, {"label": "وقت التحميل", "value": "< 2s"}, {"label": "دقة التقارير", "value": "99.9%"}]'::jsonb,
  NULL
),
(
  'موقع عقارات متكامل',
  'Real Estate Platform',
  'real-estate-platform',
  'تطبيقات الويب',
  'منصة عقارية شاملة لعرض وبيع وشراء العقارات مع بحث متقدم وجولات افتراضية 360 درجة وحاسبة قروض مدمجة.',
  'عقارات المدينة',
  2023,
  '/placeholder-realestate.jpg',
  ARRAY['Next.js', 'Mapbox', 'Prisma', 'PostgreSQL', 'AWS S3'],
  ARRAY['جولات افتراضية 360°', 'بحث متقدم بالخريطة', 'حاسبة قروض', 'مقارنة العقارات', 'جدولة المعاينات', 'تنبيهات أسعار'],
  '#EC4899',
  NULL,
  false,
  'draft',
  '[{"label": "عقارات مدرجة", "value": "2,500+"}, {"label": "زيارات شهرية", "value": "150K+"}, {"label": "معدل التحويل", "value": "4.2%"}]'::jsonb,
  '{"text": "أفضل منصة عقارية استخدمتها على الإطلاق", "author": "عمر السيد", "position": "وكيل عقاري", "avatar": "/avatar5.jpg"}'::jsonb
);

-- Enable RLS
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published projects
CREATE POLICY "Anyone can view published projects"
  ON portfolio_projects FOR SELECT
  USING (status = 'published');

-- Policy: Authenticated users can manage all projects
-- You can modify this later to restrict to specific roles
CREATE POLICY "Authenticated users can manage projects"
  ON portfolio_projects FOR ALL
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT ON portfolio_projects TO anon, authenticated;
GRANT ALL ON portfolio_projects TO authenticated;
