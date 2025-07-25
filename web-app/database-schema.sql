-- Apply Pilot AI Database Schema
-- This schema supports user authentication, subscription management, job tracking, and document generation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER MANAGEMENT TABLES
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    stripe_customer_id TEXT UNIQUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'professional')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete', 'trialing')),
    credits_remaining INTEGER, -- NULL for unlimited plans
    credits_total INTEGER,     -- NULL for unlimited plans  
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User credits for free tier users
CREATE TABLE public.user_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    credits_remaining INTEGER DEFAULT 3 NOT NULL,
    credits_used INTEGER DEFAULT 0 NOT NULL,
    last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id)
);

-- =====================================================
-- JOB MANAGEMENT TABLES  
-- =====================================================

-- Jobs table for captured job postings
CREATE TABLE public.jobs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    job_url TEXT,
    description TEXT,
    requirements TEXT,
    salary TEXT,
    job_type TEXT, -- 'full-time', 'part-time', 'contract', etc.
    remote_type TEXT, -- 'remote', 'hybrid', 'on-site'
    posted_date TIMESTAMP WITH TIME ZONE,
    application_deadline TIMESTAMP WITH TIME ZONE,
    match_score INTEGER, -- 0-100 score from AI matching
    match_analysis JSONB, -- Detailed scoring breakdown
    source_platform TEXT, -- 'linkedin', 'indeed', 'glassdoor', etc.
    company_logo TEXT,
    is_applied BOOLEAN DEFAULT FALSE,
    applied_date TIMESTAMP WITH TIME ZONE,
    application_status TEXT DEFAULT 'not_applied' CHECK (application_status IN ('not_applied', 'applied', 'interviewing', 'rejected', 'offered')),
    notes TEXT,
    tags TEXT[], -- User-defined tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Job scoring history
CREATE TABLE public.job_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    job_id INTEGER REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID NOT NULL, -- Reference to the resume used for scoring
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    analysis JSONB NOT NULL, -- Detailed scoring breakdown
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- RESUME MANAGEMENT TABLES
-- =====================================================

-- Resumes table
CREATE TABLE public.resumes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL, -- Raw text content
    file_type TEXT, -- 'pdf', 'docx', 'txt', etc.
    file_size INTEGER,
    file_url TEXT, -- If stored in Supabase Storage
    extracted_data JSONB, -- Structured resume data from AI extraction
    is_active BOOLEAN DEFAULT FALSE, -- Only one active resume per user
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Resume versions (for tracking changes)
CREATE TABLE public.resume_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    extracted_data JSONB,
    changes_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- DOCUMENT GENERATION TABLES
-- =====================================================

-- Generated documents (resumes, cover letters)
CREATE TABLE public.generated_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id INTEGER REFERENCES public.jobs(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'cover_letter', 'both')),
    format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'txt')),
    amplification_mode TEXT NOT NULL CHECK (amplification_mode IN ('precision', 'gap_filler', 'beast_mode')),
    content TEXT NOT NULL,
    file_url TEXT, -- If stored as file in Supabase Storage
    enhancements JSONB, -- Applied enhancements/modifications
    generation_metadata JSONB, -- AI model used, tokens, etc.
    credits_used INTEGER DEFAULT 3, -- Track credit usage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enhancement suggestions
CREATE TABLE public.enhancement_suggestions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_id INTEGER REFERENCES public.jobs(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    suggestions JSONB NOT NULL, -- Array of enhancement suggestions
    applied_enhancements JSONB, -- Which suggestions were applied
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- USAGE TRACKING TABLES
-- =====================================================

-- Credit usage log
CREATE TABLE public.credit_usage_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('score', 'generate', 'enhancement')),
    credits_used INTEGER NOT NULL,
    credits_remaining INTEGER,
    resource_id TEXT, -- job_id, document_id, etc.
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- API usage tracking
CREATE TABLE public.api_usage_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_stripe_customer ON public.user_profiles(stripe_customer_id);

-- Subscriptions
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_sub ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Jobs
CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_match_score ON public.jobs(match_score DESC);
CREATE INDEX idx_jobs_company ON public.jobs(company);
CREATE INDEX idx_jobs_source_platform ON public.jobs(source_platform);

-- Job scores
CREATE INDEX idx_job_scores_job_id ON public.job_scores(job_id);
CREATE INDEX idx_job_scores_user_id ON public.job_scores(user_id);

-- Resumes
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_is_active ON public.resumes(user_id, is_active) WHERE is_active = true;

-- Generated documents
CREATE INDEX idx_generated_docs_user_id ON public.generated_documents(user_id);
CREATE INDEX idx_generated_docs_job_id ON public.generated_documents(job_id);
CREATE INDEX idx_generated_docs_created ON public.generated_documents(created_at DESC);

-- Credit usage
CREATE INDEX idx_credit_usage_user_id ON public.credit_usage_log(user_id);
CREATE INDEX idx_credit_usage_created ON public.credit_usage_log(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhancement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User subscriptions policies  
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- User credits policies
CREATE POLICY "Users can view their own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage credits" ON public.user_credits
    FOR ALL USING (auth.role() = 'service_role');

-- Jobs policies
CREATE POLICY "Users can manage their own jobs" ON public.jobs
    FOR ALL USING (auth.uid() = user_id);

-- Job scores policies
CREATE POLICY "Users can manage their own job scores" ON public.job_scores
    FOR ALL USING (auth.uid() = user_id);

-- Resumes policies
CREATE POLICY "Users can manage their own resumes" ON public.resumes
    FOR ALL USING (auth.uid() = user_id);

-- Resume versions policies
CREATE POLICY "Users can view resume versions" ON public.resume_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resumes 
            WHERE resumes.id = resume_versions.resume_id 
            AND resumes.user_id = auth.uid()
        )
    );

-- Generated documents policies
CREATE POLICY "Users can manage their own documents" ON public.generated_documents
    FOR ALL USING (auth.uid() = user_id);

-- Enhancement suggestions policies
CREATE POLICY "Users can manage their own enhancements" ON public.enhancement_suggestions
    FOR ALL USING (auth.uid() = user_id);

-- Credit usage log policies
CREATE POLICY "Users can view their own credit usage" ON public.credit_usage_log
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage credit usage" ON public.credit_usage_log
    FOR ALL USING (auth.role() = 'service_role');

-- API usage log policies (admin only)
CREATE POLICY "Only service role can access API logs" ON public.api_usage_log
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON public.resumes 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to ensure only one active resume per user
CREATE OR REPLACE FUNCTION ensure_single_active_resume()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        -- Set all other resumes for this user to inactive
        UPDATE public.resumes 
        SET is_active = false 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply single active resume trigger
CREATE TRIGGER ensure_single_active_resume_trigger 
    BEFORE INSERT OR UPDATE ON public.resumes
    FOR EACH ROW EXECUTE PROCEDURE ensure_single_active_resume();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, user_id, full_name)
    VALUES (
        NEW.id,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    INSERT INTO public.user_credits (user_id, credits_remaining)
    VALUES (NEW.id, 3);
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================
-- INITIAL DATA / SAMPLE DATA (Optional)
-- =====================================================

-- Sample job data for testing (optional)
-- INSERT INTO public.jobs (user_id, title, company, location, description, source_platform)
-- VALUES 
--     (auth.uid(), 'Senior Software Engineer', 'Tech Corp', 'San Francisco, CA', 'We are looking for a senior software engineer...', 'linkedin'),
--     (auth.uid(), 'Product Manager', 'Startup Inc', 'Remote', 'Join our growing team as a product manager...', 'indeed');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 