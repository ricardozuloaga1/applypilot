import { createClient } from '@supabase/supabase-js'

// NOTE: Create a .env.local file in the web-app directory with:
// NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client for demo purposes if no credentials are provided
const createDemoClient = () => {
  const createMockQueryBuilder = () => {
    const mockBuilder = {
      insert: () => mockBuilder,
      select: () => mockBuilder,
      update: () => mockBuilder,
      delete: () => mockBuilder,
      upsert: () => mockBuilder,
      eq: () => mockBuilder,
      order: () => mockBuilder,
      single: () => Promise.resolve({ data: null, error: null })
    };
    return mockBuilder;
  }

  return {
    from: () => createMockQueryBuilder(),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'demo/file.pdf' }, error: null }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://demo.url' } })
      })
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ error: { message: 'Demo mode - auth not available' } }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'Demo mode - auth not available' } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: { message: 'Demo mode - auth not available' } })
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
  job_url: string        // Fixed: url -> job_url
  source_platform: string // Fixed: source -> source_platform  
  created_at: string     // Fixed: captured_at -> created_at
  match_score?: number   // Fixed: matchScore -> match_score
  match_analysis?: any   // Fixed: matchAnalysis -> match_analysis
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
  async saveResume(resumeData: Omit<Resume, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('resumes')
      .insert([{ ...resumeData, user_id: user.id }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getResumes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteResume(resumeId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  async setActiveResume(resumeId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    // First, set all resumes as inactive
    await supabase
      .from('resumes')
      .update({ is_active: false })
      .eq('user_id', user.id)
    
    // Then set the selected resume as active
    const { error } = await supabase
      .from('resumes')
      .update({ is_active: true })
      .eq('id', resumeId)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  // Job operations
  async saveJob(jobData: Omit<Job, 'id' | 'created_at' | 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    try {
      console.log('🔍 Attempting to save job data:', JSON.stringify(jobData, null, 2))
      
      // Check if job already exists by matching URL and company
      const { data: existingJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('job_url', jobData.job_url)
        .eq('company', jobData.company)
        .eq('title', jobData.title)
        .eq('user_id', user.id)
      
      let result
      if (existingJobs && existingJobs.length > 0) {
        // Update existing job
        console.log('🔄 Updating existing job:', existingJobs[0].id)
        const { data, error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', existingJobs[0].id)
          .eq('user_id', user.id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // Insert new job
        console.log('➕ Inserting new job')
        const { data, error } = await supabase
          .from('jobs')
          .insert([{ ...jobData, user_id: user.id }])
          .select()
          .single()
        
        if (error) throw error
        result = data
      }
      
      console.log('✅ Job saved successfully:', result?.id)
      return result
    } catch (err: any) {
      console.error('❌ Supabase saveJob error:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      })
      throw err
    }
  },

  async updateJob(jobId: string, updates: Partial<Job>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getJobById(jobId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()
    
    if (error) throw error
    return data
  },

  async getJobs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async deleteJob(jobId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

  async toggleStarJob(jobId: string, starred: boolean) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { error } = await supabase
      .from('jobs')
      .update({ starred })
      .eq('id', jobId)
      .eq('user_id', user.id)
    
    if (error) throw error
  },

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
  async uploadResume(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    
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

// Add job persistence methods only if real Supabase client is used
if (supabaseUrl && supabaseAnonKey) {
  database.saveJob = async function(jobData) {
    try {
      console.log('🔍 Attempting to save job data:', JSON.stringify(jobData, null, 2))
      
      // Check if job already exists by matching URL and company
      const { data: existingJobs } = await supabase
        .from('jobs')
        .select('id')
        .eq('job_url', jobData.job_url)
        .eq('company', jobData.company)
        .eq('title', jobData.title)
      
      let result
      if (existingJobs && existingJobs.length > 0) {
        // Update existing job
        console.log('🔄 Updating existing job:', existingJobs[0].id)
        const { data, error } = await supabase
          .from('jobs')
          .update(jobData)
          .eq('id', existingJobs[0].id)
          .select()
          .single()
        
        if (error) throw error
        result = data
      } else {
        // Insert new job (let database auto-generate ID)
        console.log('➕ Inserting new job')
        const { data, error } = await supabase
          .from('jobs')
          .insert([jobData])
          .select()
          .single()
        
        if (error) throw error
        result = data
      }
      
      console.log('✅ Job saved successfully:', result?.id)
      return result
    } catch (err: any) {
      console.error('❌ Supabase saveJob error:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      })
      console.error('❌ Exception in saveJob:', err)
      throw err
    }
  }

  database.updateJob = async function(jobId, updates) {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  database.getJobById = async function(jobId) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    if (error) throw error
    return data
  }
} 