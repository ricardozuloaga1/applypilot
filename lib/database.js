// Database helper functions for AutoApply AI
// This file contains all database operations for resumes, jobs, and job matching

// Database helper class
class AutoApplyDatabase {
    constructor() {
        this.client = null;
        this.userId = null;
        this.initialized = false;
    }

    // Initialize the database connection
    async init() {
        try {
            if (!window.SupabaseConfig) {
                throw new Error('Supabase configuration not loaded');
            }

            this.client = window.SupabaseConfig.getSupabaseClient();
            this.userId = await window.SupabaseConfig.getUserId();
            
            // Test the connection
            const connectionOk = await window.SupabaseConfig.testSupabaseConnection();
            if (!connectionOk) {
                throw new Error('Failed to connect to Supabase');
            }

            this.initialized = true;
            console.log('✅ Database initialized for user:', this.userId);
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    // Ensure database is initialized
    async ensureInitialized() {
        if (!this.initialized) {
            await this.init();
        }
    }

    // === RESUME OPERATIONS ===

    // Save a resume to the database
    async saveResume(resumeData) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('resumes')
                .insert([{
                    user_id: this.userId,
                    name: resumeData.name,
                    file_url: resumeData.file_url,
                    content: resumeData.content,
                    file_type: resumeData.file_type,
                    file_size: resumeData.file_size,
                    is_active: resumeData.is_active || false
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Error saving resume:', error);
                throw error;
            }

            console.log('✅ Resume saved successfully:', data.id);
            return data;
        } catch (error) {
            console.error('❌ Failed to save resume:', error);
            throw error;
        }
    }

    // Get all resumes for current user
    async getResumes() {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('resumes')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching resumes:', error);
                throw error;
            }

            console.log(`✅ Retrieved ${data.length} resumes`);
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch resumes:', error);
            throw error;
        }
    }

    // Get the active resume for current user
    async getActiveResume() {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('resumes')
                .select('*')
                .eq('user_id', this.userId)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('❌ Error fetching active resume:', error);
                throw error;
            }

            if (!data) {
                console.log('ℹ️  No active resume found');
                return null;
            }

            console.log('✅ Active resume found:', data.name);
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch active resume:', error);
            throw error;
        }
    }

    // Set a resume as active (deactivates others)
    async setActiveResume(resumeId) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('resumes')
                .update({ is_active: true })
                .eq('id', resumeId)
                .eq('user_id', this.userId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error setting active resume:', error);
                throw error;
            }

            console.log('✅ Resume set as active:', data.name);
            return data;
        } catch (error) {
            console.error('❌ Failed to set active resume:', error);
            throw error;
        }
    }

    // Delete a resume
    async deleteResume(resumeId) {
        await this.ensureInitialized();
        
        try {
            // First, get the resume to check if it has a file
            const { data: resume, error: fetchError } = await this.client
                .from('resumes')
                .select('file_url')
                .eq('id', resumeId)
                .eq('user_id', this.userId)
                .single();

            if (fetchError) {
                console.error('❌ Error fetching resume for deletion:', fetchError);
                throw fetchError;
            }

            // Delete the file from storage if it exists
            if (resume.file_url) {
                const fileName = resume.file_url.split('/').pop();
                const { error: storageError } = await this.client.storage
                    .from('resumes')
                    .remove([fileName]);

                if (storageError) {
                    console.warn('⚠️  Failed to delete file from storage:', storageError);
                    // Continue with database deletion even if file deletion fails
                }
            }

            // Delete the resume record from database
            const { error } = await this.client
                .from('resumes')
                .delete()
                .eq('id', resumeId)
                .eq('user_id', this.userId);

            if (error) {
                console.error('❌ Error deleting resume:', error);
                throw error;
            }

            console.log('✅ Resume deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to delete resume:', error);
            throw error;
        }
    }

    // Upload resume file to storage
    async uploadResumeFile(file, fileName) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client.storage
                .from('resumes')
                .upload(`${this.userId}/${fileName}`, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('❌ Error uploading file:', error);
                throw error;
            }

            console.log('✅ File uploaded successfully:', data.path);
            return data;
        } catch (error) {
            console.error('❌ Failed to upload file:', error);
            throw error;
        }
    }

    // === JOB OPERATIONS ===

    // Save a job to the database
    async saveJob(jobData) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('jobs')
                .insert([{
                    user_id: this.userId,
                    title: jobData.title,
                    company: jobData.company,
                    description: jobData.description,
                    location: jobData.location,
                    salary: jobData.salary,
                    url: jobData.url,
                    source: jobData.source,
                    recruiter_name: jobData.recruiterName,
                    recruiter_linkedin: jobData.recruiterLinkedIn,
                    starred: jobData.starred || false
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Error saving job:', error);
                throw error;
            }

            console.log('✅ Job saved successfully:', data.id);
            return data;
        } catch (error) {
            console.error('❌ Failed to save job:', error);
            throw error;
        }
    }

    // Get all jobs for current user
    async getJobs() {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('jobs')
                .select(`
                    *,
                    job_matches (
                        id,
                        score,
                        analysis,
                        created_at,
                        resume_id
                    )
                `)
                .eq('user_id', this.userId)
                .order('captured_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching jobs:', error);
                throw error;
            }

            console.log(`✅ Retrieved ${data.length} jobs`);
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch jobs:', error);
            throw error;
        }
    }

    // Update a job
    async updateJob(jobId, updateData) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('jobs')
                .update(updateData)
                .eq('id', jobId)
                .eq('user_id', this.userId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating job:', error);
                throw error;
            }

            console.log('✅ Job updated successfully:', data.id);
            return data;
        } catch (error) {
            console.error('❌ Failed to update job:', error);
            throw error;
        }
    }

    // Delete a job
    async deleteJob(jobId) {
        await this.ensureInitialized();
        
        try {
            const { error } = await this.client
                .from('jobs')
                .delete()
                .eq('id', jobId)
                .eq('user_id', this.userId);

            if (error) {
                console.error('❌ Error deleting job:', error);
                throw error;
            }

            console.log('✅ Job deleted successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to delete job:', error);
            throw error;
        }
    }

    // Clear all jobs for current user
    async clearAllJobs() {
        await this.ensureInitialized();
        
        try {
            const { error } = await this.client
                .from('jobs')
                .delete()
                .eq('user_id', this.userId);

            if (error) {
                console.error('❌ Error clearing jobs:', error);
                throw error;
            }

            console.log('✅ All jobs cleared successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to clear jobs:', error);
            throw error;
        }
    }

    // === JOB MATCH OPERATIONS ===

    // Save a job match result
    async saveJobMatch(matchData) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('job_matches')
                .upsert([{
                    job_id: matchData.job_id,
                    resume_id: matchData.resume_id,
                    score: matchData.score,
                    analysis: matchData.analysis
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Error saving job match:', error);
                throw error;
            }

            console.log('✅ Job match saved successfully:', data.id);
            return data;
        } catch (error) {
            console.error('❌ Failed to save job match:', error);
            throw error;
        }
    }

    // Get job match for specific job and resume
    async getJobMatch(jobId, resumeId) {
        await this.ensureInitialized();
        
        try {
            const { data, error } = await this.client
                .from('job_matches')
                .select('*')
                .eq('job_id', jobId)
                .eq('resume_id', resumeId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('❌ Error fetching job match:', error);
                throw error;
            }

            if (!data) {
                console.log('ℹ️  No job match found');
                return null;
            }

            console.log('✅ Job match found:', data.score);
            return data;
        } catch (error) {
            console.error('❌ Failed to fetch job match:', error);
            throw error;
        }
    }

    // === MIGRATION OPERATIONS ===

    // Migrate data from Chrome storage to Supabase
    async migrateFromChromeStorage() {
        await this.ensureInitialized();
        
        try {
            console.log('🔄 Starting migration from Chrome storage...');
            
            // Get existing data from Chrome storage
            const chromeData = await chrome.storage.local.get(['jobs', 'resumeFile']);
            
            let migratedJobs = 0;
            let migratedResumes = 0;

            // Migrate jobs
            if (chromeData.jobs && Array.isArray(chromeData.jobs)) {
                console.log(`📋 Migrating ${chromeData.jobs.length} jobs...`);
                
                for (const job of chromeData.jobs) {
                    try {
                        await this.saveJob({
                            title: job.title,
                            company: job.company,
                            description: job.description,
                            location: job.location,
                            salary: job.salary,
                            url: job.url,
                            source: job.source,
                            recruiterName: job.recruiterName,
                            recruiterLinkedIn: job.recruiterLinkedIn,
                            starred: job.starred
                        });
                        migratedJobs++;
                    } catch (error) {
                        console.warn('⚠️  Failed to migrate job:', job.title, error);
                    }
                }
            }

            // Migrate resume (if any)
            if (chromeData.resumeFile) {
                console.log('📄 Migrating resume...');
                
                try {
                    // For now, we'll just save the resume content
                    // File upload migration would need special handling
                    await this.saveResume({
                        name: chromeData.resumeFile.name || 'Migrated Resume',
                        content: chromeData.resumeFile.content || '',
                        file_type: chromeData.resumeFile.type || 'txt',
                        file_size: chromeData.resumeFile.size || 0,
                        is_active: true
                    });
                    migratedResumes++;
                } catch (error) {
                    console.warn('⚠️  Failed to migrate resume:', error);
                }
            }

            console.log(`✅ Migration completed: ${migratedJobs} jobs, ${migratedResumes} resumes`);
            return { jobs: migratedJobs, resumes: migratedResumes };
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    // Check if migration is needed
    async needsMigration() {
        try {
            const chromeData = await chrome.storage.local.get(['jobs', 'resumeFile', 'migration_completed']);
            
            // If migration was already completed, skip
            if (chromeData.migration_completed) {
                return false;
            }

            // Check if there's data to migrate
            const hasJobs = chromeData.jobs && Array.isArray(chromeData.jobs) && chromeData.jobs.length > 0;
            const hasResume = chromeData.resumeFile && chromeData.resumeFile.name;
            
            return hasJobs || hasResume;
        } catch (error) {
            console.error('❌ Failed to check migration status:', error);
            return false;
        }
    }

    // Mark migration as completed
    async markMigrationCompleted() {
        try {
            await chrome.storage.local.set({ migration_completed: true });
            console.log('✅ Migration marked as completed');
        } catch (error) {
            console.error('❌ Failed to mark migration as completed:', error);
        }
    }
}

// Create global instance
window.AutoApplyDB = new AutoApplyDatabase();

// Export for use in other files
window.DatabaseOperations = {
    // Initialize
    init: () => window.AutoApplyDB.init(),
    
    // Resume operations
    saveResume: (resumeData) => window.AutoApplyDB.saveResume(resumeData),
    getResumes: () => window.AutoApplyDB.getResumes(),
    getActiveResume: () => window.AutoApplyDB.getActiveResume(),
    setActiveResume: (resumeId) => window.AutoApplyDB.setActiveResume(resumeId),
    deleteResume: (resumeId) => window.AutoApplyDB.deleteResume(resumeId),
    uploadResumeFile: (file, fileName) => window.AutoApplyDB.uploadResumeFile(file, fileName),
    
    // Job operations
    saveJob: (jobData) => window.AutoApplyDB.saveJob(jobData),
    getJobs: () => window.AutoApplyDB.getJobs(),
    updateJob: (jobId, updateData) => window.AutoApplyDB.updateJob(jobId, updateData),
    deleteJob: (jobId) => window.AutoApplyDB.deleteJob(jobId),
    clearAllJobs: () => window.AutoApplyDB.clearAllJobs(),
    
    // Job match operations
    saveJobMatch: (matchData) => window.AutoApplyDB.saveJobMatch(matchData),
    getJobMatch: (jobId, resumeId) => window.AutoApplyDB.getJobMatch(jobId, resumeId),
    
    // Migration operations
    migrateFromChromeStorage: () => window.AutoApplyDB.migrateFromChromeStorage(),
    needsMigration: () => window.AutoApplyDB.needsMigration(),
    markMigrationCompleted: () => window.AutoApplyDB.markMigrationCompleted()
}; 