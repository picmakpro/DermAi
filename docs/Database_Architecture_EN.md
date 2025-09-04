# 🏗️ Database Architecture – DermAI V2

## Overview

This document defines the complete Supabase database architecture for DermAI V2, including schemas, relationships, security policies, and migrations.

---

## 📊 **DATABASE SCHEMA**

### **Table: profiles** 
*Extended user profiles*

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'enterprise')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User preferences
  notification_preferences JSONB DEFAULT '{"email": true, "push": false, "sms": false}',
  privacy_settings JSONB DEFAULT '{"share_analytics": true, "public_profile": false}',
  
  -- Acquisition metadata
  acquisition_source TEXT, -- 'organic', 'google_ads', 'social', etc.
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT
);

-- Indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);
```

### **Table: user_analyses**
*User analyses and diagnoses*

```sql
CREATE TABLE user_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Core data
  analysis_data JSONB NOT NULL, -- Full AI analysis result
  photos_metadata JSONB, -- Photo metadata (URLs, types, etc.)
  questionnaire_data JSONB, -- Questionnaire answers
  
  -- Status & sharing
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  shared_publicly BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE, -- Token for public sharing
  share_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking & analytics
  analysis_version TEXT DEFAULT '1.0', -- Prompt/algorithm version
  processing_time_ms INTEGER, -- Processing time
  ai_model_used TEXT DEFAULT 'gpt-4o-vision',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_analyses_user_id ON user_analyses(user_id);
CREATE INDEX idx_analyses_created_at ON user_analyses(created_at);
CREATE INDEX idx_analyses_status ON user_analyses(status);
CREATE INDEX idx_analyses_share_token ON user_analyses(share_token) WHERE share_token IS NOT NULL;
```

### **Table: skin_progress**
*Tracking skin evolution*

```sql
CREATE TABLE skin_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  base_analysis_id UUID REFERENCES user_analyses(id) ON DELETE CASCADE,
  comparison_analysis_id UUID REFERENCES user_analyses(id) ON DELETE CASCADE,
  
  -- Comparison data
  comparison_data JSONB NOT NULL, -- Differential scores, % improvement
  improvement_areas TEXT[], -- Identified areas of improvement
  regression_areas TEXT[], -- Areas of worsening (if any)
  
  -- Metadata
  time_period_days INTEGER, -- # of days between analyses
  progress_notes TEXT, -- Optional user notes
  ai_insights TEXT, -- AI-generated insights
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_progress_user_id ON skin_progress(user_id);
CREATE INDEX idx_progress_base_analysis ON skin_progress(base_analysis_id);
CREATE INDEX idx_progress_created_at ON skin_progress(created_at);
```

### **Table: products**
*Carefully curated internal product catalog*

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic information
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'cleanser', 'toner', 'essence', 'serum', 'moisturizer', 
    'eye_cream', 'sunscreen', 'treatment', 'mask', 'balm', 
    'oil', 'exfoliant', 'spot_treatment'
  )),
  subcategory TEXT, -- 'gel_cleanser', 'vitamin_c_serum', 'retinol_treatment'
  
  -- Commercial data
  price DECIMAL(8,2) NOT NULL,
  affiliate_link TEXT NOT NULL,
  commission_rate DECIMAL(5,4) DEFAULT 0.0500, -- e.g., 0.0800 for 8%
  
  -- Intelligent AI selection criteria
  skin_types TEXT[] NOT NULL DEFAULT '{}', -- ['dry', 'oily', 'combination', 'sensitive']
  target_concerns TEXT[] NOT NULL DEFAULT '{}', -- ['dehydration', 'acne', 'wrinkles', 'hyperpigmentation']
  concern_intensity TEXT DEFAULT 'moderate' CHECK (concern_intensity IN ('mild', 'moderate', 'severe')),
  routine_position TEXT[] DEFAULT '{"both"}' CHECK (routine_position <@ ARRAY['morning', 'evening', 'both']),
  
  -- Quality metadata for prioritization
  efficacy_rating DECIMAL(3,2) DEFAULT 4.0 CHECK (efficacy_rating BETWEEN 1.0 AND 5.0),
  user_rating DECIMAL(3,2), 
  reviews_count INTEGER DEFAULT 0,
  clinical_proven BOOLEAN DEFAULT FALSE,
  dermatologist_recommended BOOLEAN DEFAULT FALSE,
  
  -- Smart catalog management
  in_stock BOOLEAN DEFAULT TRUE,
  priority_score INTEGER DEFAULT 100 CHECK (priority_score BETWEEN 1 AND 100),
  budget_tier TEXT DEFAULT 'mid' CHECK (budget_tier IN ('budget', 'mid', 'premium', 'luxury')),
  
  -- Optimization data
  conversion_rate DECIMAL(5,4) DEFAULT 0.0000, -- Average conversion rate
  recommendation_count INTEGER DEFAULT 0, -- # of times recommended
  
  -- Images & descriptions
  image_url TEXT,
  description TEXT,
  key_ingredients TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for AI-driven selection performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_concerns ON products USING GIN(target_concerns);
CREATE INDEX idx_products_skin_types ON products USING GIN(skin_types);
CREATE INDEX idx_products_price_tier ON products(budget_tier, price);
CREATE INDEX idx_products_priority ON products(priority_score DESC, efficacy_rating DESC);
CREATE INDEX idx_products_in_stock ON products(in_stock) WHERE in_stock = TRUE;
```

### **Table: product_interactions**
*Tracking interactions with internal products*

```sql
CREATE TABLE product_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES user_analyses(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Recommendation context
  recommendation_context JSONB, -- Why this product was recommended
  position_in_routine INTEGER, -- Position within the recommended routine
  budget_allocated DECIMAL(8,2), -- Budget allocated to this product
  
  -- Interaction tracking
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('recommended', 'viewed', 'clicked', 'wishlisted', 'purchased')),
  interaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Conversion data
  conversion_confirmed BOOLEAN DEFAULT FALSE,
  conversion_timestamp TIMESTAMP WITH TIME ZONE,
  purchase_amount DECIMAL(8,2),
  commission_earned DECIMAL(8,2),
  
  -- Metadata
  user_agent TEXT,
  device_type TEXT,
  utm_parameters JSONB
);

-- Indexes for product-performance analytics
CREATE INDEX idx_product_interactions_product_id ON product_interactions(product_id);
CREATE INDEX idx_product_interactions_user_id ON product_interactions(user_id);
CREATE INDEX idx_product_interactions_type ON product_interactions(interaction_type);
CREATE INDEX idx_product_interactions_conversion ON product_interactions(conversion_confirmed) WHERE conversion_confirmed = TRUE;
CREATE INDEX idx_product_interactions_timestamp ON product_interactions(interaction_timestamp);
```

### **Table: user_preferences**
*Detailed preferences for personalization*

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Product preferences
  preferred_brands TEXT[], -- Favorite brands
  budget_range_min DECIMAL(8,2) DEFAULT 0,
  budget_range_max DECIMAL(8,2) DEFAULT 1000,
  excluded_ingredients TEXT[], -- Ingredients to avoid
  preferred_product_types TEXT[], -- Preferred product types
  
  -- Routine preferences
  routine_frequency TEXT DEFAULT 'daily' CHECK (routine_frequency IN ('minimal', 'daily', 'intensive')),
  morning_routine_duration INTEGER DEFAULT 10, -- minutes
  evening_routine_duration INTEGER DEFAULT 15, -- minutes
  
  -- Communication preferences
  reminder_frequency TEXT DEFAULT 'weekly' CHECK (reminder_frequency IN ('never', 'weekly', 'monthly')),
  preferred_communication_time TIME DEFAULT '09:00:00',
  language_preference TEXT DEFAULT 'fr' CHECK (language_preference IN ('fr', 'en', 'es', 'de')),
  
  -- Tracking & analytics
  analytics_consent BOOLEAN DEFAULT TRUE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  data_sharing_consent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### **Table: ai_feedback**
*User feedback on AI analyses*

```sql
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES user_analyses(id) ON DELETE CASCADE,
  
  -- Analysis feedback
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 5),
  product_relevance_rating INTEGER CHECK (product_relevance_rating BETWEEN 1 AND 5),
  
  -- Text feedback
  feedback_text TEXT,
  improvement_suggestions TEXT,
  
  -- Specific feedback
  inaccurate_areas TEXT[], -- Areas the user felt were misanalyzed
  helpful_insights TEXT[], -- Particularly useful insights
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_analysis_id ON ai_feedback(analysis_id);
CREATE INDEX idx_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX idx_feedback_ratings ON ai_feedback(accuracy_rating, usefulness_rating);
```

### **Table: analytics_events**
*Detailed analytics events*

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous events
  session_id TEXT NOT NULL,
  
  -- Event data
  event_name TEXT NOT NULL,
  event_category TEXT, -- 'engagement', 'conversion', 'error', etc.
  event_properties JSONB,
  
  -- User context
  page_url TEXT,
  referrer_url TEXT,
  user_agent TEXT,
  device_type TEXT,
  screen_resolution TEXT,
  
  -- Geolocation (anonymized)
  country_code TEXT,
  region TEXT,
  
  -- Timing
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page_load_time_ms INTEGER,
  time_on_page_ms INTEGER
);

-- Indexes for analytics performance
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
```

---

## 🔒 **SECURITY POLICIES (RLS)**

### **Row Level Security for profiles**

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view/update only their profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### **Row Level Security for user_analyses**

```sql
ALTER TABLE user_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own analyses
CREATE POLICY "Users can view own analyses" ON user_analyses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create analyses
CREATE POLICY "Users can create analyses" ON user_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can modify their analyses
CREATE POLICY "Users can update own analyses" ON user_analyses
  FOR UPDATE USING (auth.uid() = user_id);

-- Public analyses are viewable by everyone
CREATE POLICY "Public analyses are viewable by all" ON user_analyses
  FOR SELECT USING (shared_publicly = TRUE AND share_expires_at > NOW());
```

### **Row Level Security for other tables**

```sql
-- skin_progress
ALTER TABLE skin_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON skin_progress
  FOR ALL USING (auth.uid() = user_id);

-- affiliate_interactions
ALTER TABLE affiliate_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own interactions" ON affiliate_interactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert interactions" ON affiliate_interactions
  FOR INSERT WITH CHECK (TRUE); -- Allow insertion from the API

-- user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ai_feedback
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own feedback" ON ai_feedback
  FOR ALL USING (auth.uid() = user_id);
```

---

## 🔄 **TRIGGERS & FUNCTIONS**

### **Auto-update function**

```sql
-- Generic function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to required tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON user_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### **Auto-calculation function for progress**

```sql
CREATE OR REPLACE FUNCTION calculate_skin_progress(
  base_analysis_data JSONB,
  comparison_analysis_data JSONB
) RETURNS JSONB AS $$
DECLARE
  progress_data JSONB;
  score_improvement DECIMAL;
BEGIN
  -- Compute improvement of the overall score
  score_improvement := (comparison_analysis_data->>'globalScore')::DECIMAL 
                     - (base_analysis_data->>'globalScore')::DECIMAL;
  
  -- Build the progress object
  progress_data := jsonb_build_object(
    'score_improvement', score_improvement,
    'improvement_percentage', 
      CASE 
        WHEN (base_analysis_data->>'globalScore')::DECIMAL > 0 THEN
          (score_improvement / (base_analysis_data->>'globalScore')::DECIMAL) * 100
        ELSE 0
      END,
    'calculated_at', NOW()
  );
  
  RETURN progress_data;
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 **VIEWS FOR ANALYTICS**

### **User metrics view**

```sql
CREATE VIEW user_metrics AS
SELECT 
  p.id,
  p.email,
  p.subscription_status,
  p.created_at as signup_date,
  COUNT(ua.id) as total_analyses,
  MAX(ua.created_at) as last_analysis_date,
  COUNT(ai.id) FILTER (WHERE ai.interaction_type = 'click') as affiliate_clicks,
  COUNT(ai.id) FILTER (WHERE ai.conversion_confirmed = TRUE) as conversions,
  SUM(ai.commission_amount) as total_commissions
FROM profiles p
LEFT JOIN user_analyses ua ON p.id = ua.user_id
LEFT JOIN affiliate_interactions ai ON p.id = ai.user_id
GROUP BY p.id, p.email, p.subscription_status, p.created_at;
```

### **Affiliate performance view**

```sql
CREATE VIEW affiliate_performance AS
SELECT 
  affiliate_partner,
  product_id,
  product_name,
  COUNT(*) FILTER (WHERE interaction_type = 'view') as views,
  COUNT(*) FILTER (WHERE interaction_type = 'click') as clicks,
  COUNT(*) FILTER (WHERE conversion_confirmed = TRUE) as conversions,
  ROUND(
    COUNT(*) FILTER (WHERE conversion_confirmed = TRUE)::DECIMAL / 
    NULLIF(COUNT(*) FILTER (WHERE interaction_type = 'click'), 0) * 100, 
    2
  ) as conversion_rate_percent,
  SUM(commission_amount) as total_commission,
  AVG(conversion_value) as avg_order_value
FROM affiliate_interactions
GROUP BY affiliate_partner, product_id, product_name
ORDER BY total_commission DESC;
```

---

## 🚀 **INITIAL MIGRATION SCRIPT**

```sql
-- Full creation script to run on Supabase

-- 1. Create tables in order
\i profiles.sql
\i user_analyses.sql  
\i skin_progress.sql
\i affiliate_interactions.sql
\i user_preferences.sql
\i ai_feedback.sql
\i analytics_events.sql

-- 2. Create functions
\i functions.sql

-- 3. Apply RLS policies
\i security_policies.sql

-- 4. Create views
\i analytics_views.sql

-- 5. Insert test data (optional)
\i test_data.sql
```

---

## 📊 **BACKUP & MAINTENANCE STRATEGY**

### **Automatic backups**
- Daily automatic backup via Supabase
- Weekly export to external storage
- 30‑day retention for daily backups
- 12‑month retention for monthly backups

### **Data maintenance**
- Automatic purge of `analytics_events` > 6 months
- Archive inactive analyses > 2 years
- Clean expired share tokens
- Monthly index optimization

### **Monitoring**
- Alerts on rapid table growth
- Query performance monitoring
- Storage usage monitoring
- Logs of access to sensitive data

This architecture is designed to be scalable, secure, and GDPR‑compliant while supporting DermAI V2’s analytical and business needs.
