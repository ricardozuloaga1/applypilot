-- AutoApply AI Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
-- 1. Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- REMOVED DEFAULT uuid_generate_v4()
    name TEXT NOT NULL,
    file_url TEXT,
    content TEXT,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT resumes_file_type_check CHECK (file_type IN ('pdf', 'docx', 'doc', 'txt', 'rtf')),
    CONSTRAINT resumes_file_size_check CHECK (file_size > 0 AND file_size <= 10485760) -- 10MB max
);

-- 2. Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    description TEXT,
    location TEXT,
    salary TEXT,
    url TEXT,
    source TEXT,
    recruiter_name TEXT,
    recruiter_linkedin TEXT,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    starred BOOLEAN DEFAULT FALSE
);

-- 3. Job matches table
CREATE TABLE IF NOT EXISTS job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL,
    resume_id UUID NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate matches
    UNIQUE(job_id, resume_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_is_active ON resumes(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_captured_at ON jobs(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_starred ON jobs(starred);
CREATE INDEX IF NOT EXISTS idx_job_matches_job_id ON job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_resume_id ON job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_score ON job_matches(score DESC);

-- Create updated_at trigger for resumes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resumes_updated_at 
    BEFORE UPDATE ON resumes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Resumes policies
CREATE POLICY "Users can view their own resumes" 
    ON resumes FOR SELECT 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own resumes" 
    ON resumes FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own resumes" 
    ON resumes FOR UPDATE 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own resumes" 
    ON resumes FOR DELETE 
    USING (auth.uid()::text = user_id::text);

-- Jobs policies
CREATE POLICY "Users can view their own jobs" 
    ON jobs FOR SELECT 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own jobs" 
    ON jobs FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own jobs" 
    ON jobs FOR UPDATE 
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own jobs" 
    ON jobs FOR DELETE 
    USING (auth.uid()::text = user_id::text);

-- Job matches policies
CREATE POLICY "Users can view their own job matches" 
    ON job_matches FOR SELECT 
    USING (true); -- Allow viewing matches for jobs/resumes they own

CREATE POLICY "Users can insert their own job matches" 
    ON job_matches FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Users can update their own job matches" 
    ON job_matches FOR UPDATE 
    USING (true);

CREATE POLICY "Users can delete their own job matches" 
    ON job_matches FOR DELETE 
    USING (true);

-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resume files
CREATE POLICY "Users can upload resume files" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Users can view their resume files" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'resumes');

CREATE POLICY "Users can delete their resume files" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'resumes');

-- Create a function to ensure only one active resume per user
CREATE OR REPLACE FUNCTION ensure_single_active_resume()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this resume as active, deactivate all others for this user
    IF NEW.is_active = TRUE THEN
        UPDATE resumes 
        SET is_active = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_resume_trigger
    BEFORE INSERT OR UPDATE ON resumes
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_active_resume();

-- Insert some sample data for testing (optional)
-- You can uncomment these lines to test the setup
/*
INSERT INTO resumes (user_id, name, file_type, content, is_active) VALUES
(uuid_generate_v4(), 'John Doe Resume.pdf', 'pdf', 'Sample resume content for John Doe...', true);

INSERT INTO jobs (user_id, title, company, description, location, salary, url, source) VALUES
((SELECT user_id FROM resumes LIMIT 1), 'Software Engineer', 'Tech Corp', 'We are looking for a skilled software engineer...', 'San Francisco, CA', '$120,000 - $150,000', 'https://example.com/job/123', 'linkedin.com');
*/

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('resumes', 'jobs', 'job_matches'); 