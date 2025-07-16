import { createClient } from '@supabase/supabase-js'

// NOTE: Create a .env.local file in the web-app directory with:
// NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client for demo purposes if no credentials are provided
const createDemoClient = () => {
  const createMockQueryBuilder = () => ({
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: function() { return this },
    order: function() { return this },
    single: function() { return this }
  })

  return {
    from: () => createMockQueryBuilder(),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'demo/file.pdf' }, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://demo.url' } })
      })
    }
  }
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createDemoClient()

// Database types
export interface Resume {
  id: string
  user_id: string
  name: string
  file_url: string
  content: string
  file_type: string
  file_size: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  user_id: string
  title: string
  company: string
  description: string
  location: string
  salary: string | null
  url: string
  source: string
  captured_at: string
  starred: boolean
}

export interface JobMatch {
  id: string
  job_id: string
  resume_id: string
  score: number
  analysis: any
  created_at: string
}

// Database helper functions
export const database = {
  // Resume operations
  async saveResume(resumeData: Omit<Resume, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('resumes')
      .insert([resumeData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getResumes(userId: string) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteResume(resumeId: string) {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
    
    if (error) throw error
  },

  async setActiveResume(resumeId: string, userId: string) {
    // First, set all resumes as inactive
    await supabase
      .from('resumes')
      .update({ is_active: false })
      .eq('user_id', userId)
    
    // Then set the selected resume as active
    const { error } = await supabase
      .from('resumes')
      .update({ is_active: true })
      .eq('id', resumeId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Job operations
  async saveJob(jobData: Omit<Job, 'id' | 'captured_at'>) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getJobs(userId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('captured_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteJob(jobId: string) {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
    
    if (error) throw error
  },

  async toggleStarJob(jobId: string, starred: boolean) {
    const { error } = await supabase
      .from('jobs')
      .update({ starred })
      .eq('id', jobId)
    
    if (error) throw error
  },

  // Job match operations
  async saveJobMatch(matchData: Omit<JobMatch, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('job_matches')
      .insert([matchData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getJobMatches(jobId: string) {
    const { data, error } = await supabase
      .from('job_matches')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // File upload operations
  async uploadResume(file: File, userId: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('resumes')
      .upload(fileName, file)
    
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(fileName)
    
    return { path: data.path, url: publicUrl }
  },

  async deleteResumeFile(filePath: string) {
    const { error } = await supabase.storage
      .from('resumes')
      .remove([filePath])
    
    if (error) throw error
  }
} 