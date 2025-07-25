// Extension Mirror - Complete replication of Chrome extension functionality
// This mirrors the exact structure and functions from the extension

import { ExtensionMatchingSystem } from './matching-system'
import mammoth from 'mammoth';
import { database } from './supabase';

interface JobData {
  id: number
  title: string
  company: string
  location: string
  description: string
  url: string
  salary: string
  source: string
  capturedAt: string
  matchScore?: number
  matchGrade?: string
  matchAnalysis?: any
  starred?: boolean
}

// Type alias for external usage
export type Job = JobData & {
  captureDate: string // Alias for capturedAt
  id: number // Keep as number to match JobData
}

export interface Resume {
  id: string
  name: string
  content: string
  type: string // Alias for fileType
  fileType: string
  size: number // Alias for fileSize
  fileSize: number
  uploadDate: string // Alias for uploadedAt
  uploadedAt: string
  isActive: boolean
}

interface MatchColors {
  [key: string]: {
    bg: string
    border: string
    icon: string
    label: string
  }
}

interface Enhancement {
  id: string
  text: string
  selected: boolean
}

interface EnhancementSuggestion {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

interface EnhancementAnalysis {
  [category: string]: EnhancementSuggestion[]
}

// Main AutoApplyAI class - mirrors the extension's main class
export class AutoApplyAI {
  private jobs: JobData[] = []
  private selectedJob: JobData | null = null
  private selectedJobs: Set<number> = new Set()
  private maxSelectedJobs = 3
  private resumeFile: File | null = null
  private storedResumes: Resume[] = []
  private activeResumeId: string | null = null
  private currentTab = 'capture'
  private scoringPaused = false
  private scoringMode: 'automatic' | 'manual' = 'automatic'
  private scoringJobId: number | null = null
  private expandedJobs: Set<number> = new Set()
  private selectedEnhancements: Set<string> = new Set()
  private currentEnhancements: Enhancement[] = []
  private currentEnhancementAnalysis: EnhancementAnalysis | null = null
  private apiService: APIService

  public matchColors: MatchColors = {
    excellent: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.6)', icon: '🟢', label: 'Excellent Match' },
    good: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.6)', icon: '🔵', label: 'Good Match' },
    moderate: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.6)', icon: '🟡', label: 'Moderate Match' },
    weak: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.6)', icon: '🟠', label: 'Weak Match' },
    poor: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.6)', icon: '🔴', label: 'Poor Match' },
    unscored: { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.6)', icon: '⚪', label: 'Not Scored' }
  }

  constructor() {
    this.apiService = new APIService()
  }

  // Initialize the application - mirrors extension init()
  async init() {
    try {
      console.log('🔍 Initializing AutoApply AI web app...')
      
      this.jobs = []
      console.log('🔍 Loading jobs from storage...')
      await this.loadJobs()
      console.log('🔍 Jobs loaded, count:', this.jobs.length)
      
      console.log('🔍 Loading stored resumes...')
      await this.loadStoredResumes()
      console.log('🔍 Resumes loaded, count:', this.storedResumes.length)
      
      await this.loadActiveResumeId()
      await this.loadScoringPreference()
      
      // Auto-select first resume if no active resume is set
      if (!this.activeResumeId && this.storedResumes.length > 0) {
        await this.setActiveResume(this.storedResumes[0].id)
      }
      
      console.log('✅ AutoApply AI initialization complete')
    } catch (error) {
      console.error('❌ Error initializing AutoApply AI:', error)
    }
  }

  // Load jobs from storage
  async loadJobs() {
    try {
      console.log('🔍 Loading jobs from storage...')
      
      // First check localStorage (most reliable for persistent scores)
      let localStorageJobs = null
      try {
        const stored = localStorage.getItem('autoapply_jobs')
        if (stored) {
          localStorageJobs = JSON.parse(stored)
          console.log('🔍 Found jobs in localStorage:', localStorageJobs.length, 'jobs')
          
          // Log sample scored job to verify persistence
          const scoredJob = localStorageJobs.find(job => job.matchScore && job.matchScore > 0)
          if (scoredJob) {
            console.log('🔍 Sample scored job in localStorage:', {
              id: scoredJob.id,
              title: scoredJob.title,
              matchScore: scoredJob.matchScore,
              matchGrade: scoredJob.matchGrade
            })
          }
        }
      } catch (error) {
        console.error('Error parsing localStorage jobs:', error)
      }
      
      // Check if we have cached extension data
      if (typeof window !== 'undefined' && (window as any).latestExtensionData) {
        console.log('🔍 Found cached extension data')
        const data = (window as any).latestExtensionData
        if (data.jobs && Array.isArray(data.jobs)) {
          // Use cached data, but prefer localStorage if it has more recent scores
          let jobsToUse = data.jobs
          
          if (localStorageJobs && localStorageJobs.length > 0) {
            // Merge: use localStorage jobs if they have scores, otherwise use cached data
            jobsToUse = data.jobs.map(cachedJob => {
              const localJob = localStorageJobs.find(local => local.id === cachedJob.id)
              return localJob && localJob.matchScore ? localJob : cachedJob
            })
            console.log('🔍 Merged cached extension data with localStorage scores')
          }
          
          this.jobs = jobsToUse.map(job => ({
            ...job,
            // Ensure required fields exist
            matchScore: job.matchScore || 0,
            matchGrade: job.matchGrade || 'unscored',
            starred: job.starred || false,
            generationStatus: job.generationStatus || 'pending',
            generatedDocs: job.generatedDocs || []
          }))
          console.log('✅ Loaded jobs from cached extension data (with localStorage scores):', this.jobs.length, 'jobs')
          return
        }
      }
      
      // If we have localStorage data but no cached extension data, use localStorage
      if (localStorageJobs && localStorageJobs.length > 0) {
        this.jobs = localStorageJobs.map(job => ({
          ...job,
          // Ensure required fields exist
          matchScore: job.matchScore || 0,
          matchGrade: job.matchGrade || 'unscored',
          starred: job.starred || false,
          generationStatus: job.generationStatus || 'pending',
          generatedDocs: job.generatedDocs || []
        }))
        console.log('✅ Loaded jobs from localStorage:', this.jobs.length, 'jobs')
        return
      }

      // Try to load from Chrome extension via ExtensionBridge
      if (typeof window !== 'undefined' && (window as any).ExtensionBridge) {
        try {
          console.log('🔍 Loading jobs via ExtensionBridge')
          const jobs = await (window as any).ExtensionBridge.getJobs()
          
          if (jobs && Array.isArray(jobs)) {
            // Transform extension jobs to match web app expectations
            this.jobs = jobs.map(job => ({
              ...job,
              // Ensure required fields exist
              matchScore: job.matchScore || 0,
              matchGrade: job.matchGrade || 'unscored',
              starred: job.starred || false,
              generationStatus: job.generationStatus || 'pending',
              generatedDocs: job.generatedDocs || []
            }))
            console.log('✅ Loaded jobs from Chrome extension via ExtensionBridge:', this.jobs.length, 'jobs')
            return
          }
        } catch (error) {
          console.log('ExtensionBridge not available, trying direct messaging')
        }
      }

      // Fallback to direct Chrome extension messaging
      if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
        try {
          console.log('🔍 Loading jobs via direct Chrome API')
          const result = await new Promise<any>((resolve, reject) => {
            (window as any).chrome.runtime.sendMessage({ action: 'getJobs' }, (response: any) => {
              if ((window as any).chrome.runtime.lastError) {
                console.log('Extension message error:', (window as any).chrome.runtime.lastError)
                reject((window as any).chrome.runtime.lastError)
              } else {
                resolve(response)
              }
            })
          })
          
          if (result && result.success && result.jobs && Array.isArray(result.jobs)) {
            // Transform extension jobs to match web app expectations
            this.jobs = result.jobs.map(job => ({
              ...job,
              // Ensure required fields exist
              matchScore: job.matchScore || 0,
              matchGrade: job.matchGrade || 'unscored',
              starred: job.starred || false,
              generationStatus: job.generationStatus || 'pending',
              generatedDocs: job.generatedDocs || []
            }))
            console.log('✅ Loaded jobs from Chrome extension via messaging:', this.jobs.length, 'jobs')
            return
          }
        } catch (error) {
          console.log('Chrome extension messaging not available, trying direct storage access')
        }
      }

      // Fallback to direct storage access
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            (window as any).chrome.storage.local.get(['jobs'], (result: any) => {
              if ((window as any).chrome.runtime.lastError) {
                reject((window as any).chrome.runtime.lastError)
              } else {
                resolve(result)
              }
            })
          })
          
          if (result.jobs && Array.isArray(result.jobs)) {
            // Transform extension jobs to match web app expectations
            this.jobs = result.jobs.map(job => ({
              ...job,
              // Ensure required fields exist
              matchScore: job.matchScore || 0,
              matchGrade: job.matchGrade || 'unscored',
              starred: job.starred || false,
              generationStatus: job.generationStatus || 'pending',
              generatedDocs: job.generatedDocs || []
            }))
            console.log('✅ Loaded jobs from Chrome extension storage:', this.jobs.length, 'jobs')
            return
          }
        } catch (error) {
          console.log('Chrome extension storage not available, using localStorage')
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('autoapply_jobs')
      if (stored) {
        try {
          this.jobs = JSON.parse(stored)
          console.log('✅ Loaded jobs from localStorage:', this.jobs.length, 'jobs')
        } catch (error) {
          console.error('Error parsing stored jobs:', error)
          this.jobs = []
        }
      }
      
      // If no jobs found anywhere, create sample jobs
      if (this.jobs.length === 0) {
        this.jobs = this.getSampleJobs()
        await this.saveJobs()
        console.log('✅ Created sample jobs:', this.jobs.length, 'jobs')
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
      this.jobs = this.getSampleJobs()
    }
  }

  // Get jobs in the format expected by the dashboard
  async getJobs(): Promise<Job[]> {
    return this.jobs.map(job => ({
      ...job,
      captureDate: job.capturedAt,
      id: job.id
    })) as Job[]
  }

  // Save jobs to storage
  async saveJobs() {
    try {
      console.log('🔍 Saving jobs with latest data:', this.jobs.length, 'jobs')
      
      // Update cached extension data if it exists (to ensure consistency on reload)
      if (typeof window !== 'undefined' && (window as any).latestExtensionData) {
        (window as any).latestExtensionData.jobs = this.jobs
        console.log('✅ Updated cached extension data with latest job scores')
      }
      
      // First try to save to Chrome extension storage if available
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          await new Promise<void>((resolve, reject) => {
            (window as any).chrome.storage.local.set({ jobs: this.jobs }, () => {
              if ((window as any).chrome.runtime.lastError) {
                reject((window as any).chrome.runtime.lastError)
              } else {
                resolve()
              }
            })
          })
          console.log('✅ Saved jobs to Chrome extension storage')
        } catch (error) {
          console.log('Chrome extension storage not available, using localStorage')
        }
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('autoapply_jobs', JSON.stringify(this.jobs))
      console.log('✅ Saved jobs to localStorage')
      
      // Log a sample job to verify score persistence
      const scoredJob = this.jobs.find(job => job.matchScore && job.matchScore > 0)
      if (scoredJob) {
        console.log('✅ Sample scored job saved:', {
          id: scoredJob.id,
          title: scoredJob.title,
          matchScore: scoredJob.matchScore,
          matchGrade: scoredJob.matchGrade
        })
      }
    } catch (error) {
      console.error('❌ Error saving jobs:', error)
    }
  }

  getSampleJobs(): JobData[] {
    return [
      {
        id: 1,
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'We are looking for a Senior Software Engineer to join our team...',
        url: 'https://example.com/job1',
        salary: '$120,000 - $180,000',
        source: 'LinkedIn',
        capturedAt: new Date().toISOString(),
        matchScore: 85,
        matchGrade: 'excellent'
      },
      {
        id: 2,
        title: 'Full Stack Developer',
        company: 'Startup Inc',
        location: 'Remote',
        description: 'Join our growing team as a Full Stack Developer...',
        url: 'https://example.com/job2',
        salary: '$80,000 - $120,000',
        source: 'Indeed',
        capturedAt: new Date().toISOString(),
        matchScore: 72,
        matchGrade: 'good'
      },
      {
        id: 3,
        title: 'Frontend Developer',
        company: 'Design Studio',
        location: 'New York, NY',
        description: 'Looking for a creative Frontend Developer...',
        url: 'https://example.com/job3',
        salary: '$70,000 - $100,000',
        source: 'Glassdoor',
        capturedAt: new Date().toISOString(),
        matchScore: 58,
        matchGrade: 'moderate'
      }
    ]
  }

  // Load stored resumes
  async loadStoredResumes() {
    try {
      // First try to load from Chrome extension storage if available
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            (window as any).chrome.storage.local.get(['storedResumes'], (result: any) => {
              if ((window as any).chrome.runtime.lastError) {
                reject((window as any).chrome.runtime.lastError)
              } else {
                resolve(result)
              }
            })
          })
          
          if (result.storedResumes && Array.isArray(result.storedResumes)) {
            this.storedResumes = result.storedResumes
            console.log('✅ Loaded resumes from Chrome extension storage:', this.storedResumes.length, 'resumes')
            return
          }
        } catch (error) {
          console.log('Chrome extension storage not available, using localStorage')
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('autoapply_resumes')
      if (stored) {
        try {
          this.storedResumes = JSON.parse(stored)
          console.log('✅ Loaded resumes from localStorage:', this.storedResumes.length, 'resumes')
        } catch (error) {
          console.error('Error parsing stored resumes:', error)
          this.storedResumes = []
        }
      }
    } catch (error) {
      console.error('Error loading resumes:', error)
      this.storedResumes = []
    }
  }

  // Save stored resumes
  async saveStoredResumes() {
    try {
      // First try to save to Chrome extension storage if available
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          await new Promise<void>((resolve, reject) => {
            (window as any).chrome.storage.local.set({ storedResumes: this.storedResumes }, () => {
              if ((window as any).chrome.runtime.lastError) {
                reject((window as any).chrome.runtime.lastError)
              } else {
                resolve()
              }
            })
          })
          console.log('✅ Saved resumes to Chrome extension storage')
        } catch (error) {
          console.log('Chrome extension storage not available, using localStorage')
        }
      }
      
      // Also save to localStorage as backup
      localStorage.setItem('autoapply_resumes', JSON.stringify(this.storedResumes))
    } catch (error) {
      console.error('Error saving resumes:', error)
    }
  }

  // Load active resume ID
  async loadActiveResumeId() {
    try {
      // First try to load from Chrome extension storage if available
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          const result = await new Promise<any>((resolve, reject) => {
            (window as any).chrome.storage.local.get(['activeResumeId'], (result: any) => {
              if ((window as any).chrome.runtime.lastError) {
                reject((window as any).chrome.runtime.lastError)
              } else {
                resolve(result)
              }
            })
          })
          
          if (result.activeResumeId) {
            this.activeResumeId = result.activeResumeId
            console.log('✅ Loaded active resume ID from Chrome extension storage:', this.activeResumeId)
            return
          }
        } catch (error) {
          console.log('Chrome extension storage not available, using localStorage')
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('autoapply_active_resume')
      if (stored) {
        try {
          this.activeResumeId = JSON.parse(stored)
        } catch (error) {
          console.error('Error parsing active resume ID:', error)
          this.activeResumeId = null
        }
      }
    } catch (error) {
      console.error('Error loading active resume ID:', error)
      this.activeResumeId = null
    }
  }

  // Save active resume ID
  async saveActiveResumeId() {
    try {
      // First try to save to Chrome extension storage if available
      if (typeof window !== 'undefined' && (window as any).chrome?.storage) {
        try {
          await new Promise<void>((resolve, reject) => {
            (window as any).chrome.storage.local.set({ activeResumeId: this.activeResumeId }, () => {
              if ((window as any).chrome.runtime.lastError) {
                reject((window as any).chrome.runtime.lastError)
              } else {
                resolve()
              }
            })
          })
          console.log('✅ Saved active resume ID to Chrome extension storage')
        } catch (error) {
          console.log('Chrome extension storage not available, using localStorage')
        }
      }
      
      // Also save to localStorage as backup
      if (this.activeResumeId) {
        localStorage.setItem('autoapply_active_resume', JSON.stringify(this.activeResumeId))
      } else {
        localStorage.removeItem('autoapply_active_resume')
      }
    } catch (error) {
      console.error('Error saving active resume ID:', error)
    }
  }

  // Set active resume
  async setActiveResume(resumeId: string) {
    // Clear previous active resume
    this.storedResumes.forEach(resume => {
      resume.isActive = false
    })
    
    // Set new active resume
    const resume = this.storedResumes.find(r => r.id === resumeId)
    if (resume) {
      resume.isActive = true
      this.activeResumeId = resumeId
      await this.saveStoredResumes()
      await this.saveActiveResumeId()
    }
  }

  // Get active resume
  getActiveResume(): Resume | null {
    const activeResume = this.storedResumes.find(r => r.isActive) || null;
    
    console.log('🔍 GET ACTIVE RESUME DEBUG:', {
      totalResumes: this.storedResumes.length,
      hasActiveResume: !!activeResume,
      activeResumeId: this.activeResumeId,
      activeResume: activeResume ? {
        id: activeResume.id,
        name: activeResume.name,
        isActive: activeResume.isActive,
        hasContent: !!activeResume.content,
        contentLength: activeResume.content?.length || 0,
        contentPreview: activeResume.content?.substring(0, 200) || 'NO CONTENT'
      } : null,
      allResumeInfo: this.storedResumes.map(r => ({
        id: r.id,
        name: r.name,
        isActive: r.isActive,
        hasContent: !!r.content,
        contentLength: r.content?.length || 0
      }))
    });
    
    return activeResume;
  }

    // Store resume with pre-extracted content (public method)
  async storeExtractedResume(file: File, extractedContent: string): Promise<Resume> {
    try {
      console.log('🔍 Storing resume with pre-extracted content:', {
        filename: file.name,
        contentLength: extractedContent.length,
        contentPreview: extractedContent.substring(0, 200)
      });

      console.log('🔍 BEFORE STORAGE - Current resumes:', {
        totalResumes: this.storedResumes.length,
        activeResumeId: this.activeResumeId,
        resumeList: this.storedResumes.map(r => ({
          id: r.id,
          name: r.name,
          isActive: r.isActive,
          contentLength: r.content?.length || 0
        }))
      });

      const resume: Resume = {
        id: Date.now().toString(),
        name: file.name,
        content: extractedContent, // Use the pre-extracted content
        type: file.type,
        fileType: file.type,
        size: file.size,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        isActive: true // Always make the new resume active
      }

      // COMPLETELY REPLACE any existing resume with the same name
      console.log('🔍 Removing any existing resume with same name:', file.name);
      this.storedResumes = this.storedResumes.filter(r => r.name !== file.name);
      
      // Clear ALL resumes as active and set this one as the only active resume
      this.storedResumes.forEach(r => r.isActive = false);
      
      // Add the new resume
      this.storedResumes.push(resume);
      
      // Set as active
      this.activeResumeId = resume.id;
      
      // Save to localStorage
      await this.saveStoredResumes();
      await this.saveActiveResumeId();

      console.log('🔍 AFTER STORAGE - Updated resumes:', {
        totalResumes: this.storedResumes.length,
        activeResumeId: this.activeResumeId,
        resumeList: this.storedResumes.map(r => ({
          id: r.id,
          name: r.name,
          isActive: r.isActive,
          contentLength: r.content?.length || 0
        }))
      });

      console.log('✅ Resume stored with real content:', {
        id: resume.id,
        name: resume.name,
        contentLength: resume.content.length,
        isActive: resume.isActive,
        contentPreview: resume.content.substring(0, 100)
      });

      return resume
    } catch (error) {
      console.error('Error storing extracted resume:', error)
      throw error
    }
  }

  // Handle resume upload
  async handleResumeUpload(file: File) {
    try {
      const content = await this.extractTextFromFile(file)
      const resume: Resume = {
        id: Date.now().toString(),
        name: file.name,
        content,
        type: file.type,
        fileType: file.type,
        size: file.size,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        uploadedAt: new Date().toISOString(),
        isActive: this.storedResumes.length === 0
      }
      
      // If this is the first resume, make it active
      if (resume.isActive) {
        this.storedResumes.forEach(r => r.isActive = false)
        this.activeResumeId = resume.id
        await this.saveActiveResumeId()
      }
      
      this.storedResumes.push(resume)
      await this.saveStoredResumes()
      
      return resume
    } catch (error) {
      console.error('Error handling resume upload:', error)
      throw error
    }
  }

  // Extract text from file (client-side first)
  async extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'text/plain') {
      return await file.text()
    } else if (file.type === 'application/pdf') {
      // Try client-side PDF parsing first
      if (typeof window !== 'undefined') {
        try {
          const pdfjsLib = await import('pdfjs-dist/build/pdf');
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          if (text.trim().length > 20) {
            console.log('✅ Client-side PDF extraction succeeded');
            return text;
          }
        } catch (e) {
          console.warn('⚠️ Client-side PDF extraction failed, falling back to server:', e);
        }
      }
      // Fallback to server API
      return await this.extractPDFText(file)
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log('🔍 Processing DOCX file:', file.name, 'Size:', file.size, 'bytes');
      
      // Try client-side DOCX parsing first
      try {
        console.log('🔍 Attempting client-side DOCX extraction with mammoth...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('🔍 File converted to ArrayBuffer, length:', arrayBuffer.byteLength);
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log('🔍 Mammoth extraction result:', {
          hasValue: !!result.value,
          contentLength: result.value?.length || 0,
          contentPreview: result.value?.substring(0, 300) + '...',
          messages: result.messages,
          messagesCount: result.messages?.length || 0
        });
        
        if (result.value && result.value.trim().length > 20) {
          console.log('✅ Client-side DOCX extraction succeeded');
          const content = result.value.trim();
          
          // Log the actual extracted content for debugging
          console.log('📄 ACTUAL EXTRACTED CONTENT:', content.substring(0, 500));
          
          return result.value;
        } else {
          console.warn('⚠️ Client-side DOCX extraction returned insufficient content, length:', result.value?.length || 0);
        }
      } catch (e) {
        console.error('❌ Client-side DOCX extraction failed:', e);
        console.warn('⚠️ Falling back to server API...');
      }
      
      // Fallback to server API
      console.log('🔍 Falling back to server-side Word extraction API...');
      return await this.extractWordText(file)
    } else if (file.type === 'application/msword') {
      // No good client-side .doc parser, use server
      return await this.extractWordText(file)
    } else {
      throw new Error(`Unsupported file type: ${file.type}`)
    }
  }

  // Extract text from PDF using web app API
  async extractPDFText(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `PDF parsing failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Validate extracted text
      if (!result.text || result.text.trim().length < 10) {
        throw new Error('PDF appears to be empty or contains no readable text. Please try uploading as a .txt file instead.')
      }
      
      console.log(`✅ Successfully extracted ${result.extractedLength || result.text.length} characters from PDF: ${file.name}`)
      return result.text
    } catch (error: any) {
      console.error('Error parsing PDF:', error)
      throw new Error(error.message || 'Failed to extract text from PDF file. Please try uploading as a .txt file instead.')
    }
  }

  // Extract text from Word document using web app API
  async extractWordText(file: File): Promise<string> {
    console.log('🔍 Server-side Word extraction starting for:', file.name);
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/parse-word', {
        method: 'POST',
        body: formData
      })
      
      console.log('🔍 Server API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Server-side Word extraction failed:', errorData);
        throw new Error(errorData.error || `Word parsing failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      console.log('🔍 Server-side Word extraction result:', {
        hasText: !!result.text,
        textLength: result.text?.length || 0,
        textPreview: result.text?.substring(0, 300) + '...',
        extractedLength: result.extractedLength,
        filename: result.filename,
        warnings: result.warnings?.length || 0
      });
      
      // Validate extracted text
      if (!result.text || result.text.trim().length < 10) {
        throw new Error('Word document appears to be empty or contains no readable text. Please try uploading as a .txt file instead.')
      }
      
      console.log(`✅ Successfully extracted ${result.extractedLength || result.text.length} characters from Word document: ${file.name}`)
      console.log('📄 SERVER EXTRACTED CONTENT:', result.text.substring(0, 500));
      
      return result.text
    } catch (error: any) {
      console.error('❌ Error parsing Word document:', error)
      throw new Error(error.message || 'Failed to extract text from Word document. Please try uploading as a .txt file instead.')
    }
  }

  // Delete resume
  async deleteResume(resumeId: string) {
    this.storedResumes = this.storedResumes.filter(r => r.id !== resumeId)
    
    // If the deleted resume was active, clear active resume
    if (this.activeResumeId === resumeId) {
      this.activeResumeId = null
    }
    
    await this.saveStoredResumes()
    await this.saveActiveResumeId()
  }

  // Delete job
  async deleteJob(jobId: string) {
    const id = parseInt(jobId)
    this.jobs = this.jobs.filter(job => job.id !== id)
    this.selectedJobs.delete(id)
    await this.saveJobs()
  }

  // Select job
  selectJob(jobId: number) {
    if (this.selectedJobs.has(jobId)) {
      this.selectedJobs.delete(jobId)
    } else if (this.selectedJobs.size < this.maxSelectedJobs) {
      this.selectedJobs.add(jobId)
    }
  }

  // Clear job selection
  clearJobSelection() {
    this.selectedJobs.clear()
  }

  // Get selected jobs
  getSelectedJobs(): JobData[] {
    return Array.from(this.selectedJobs)
      .map(id => this.jobs.find(job => job.id === id))
      .filter(job => job !== undefined) as JobData[]
  }

  // Generate document - mirrors extension generateDocument method
  async generateDocument(documentType: string, format: string, amplificationMode: string) {
    const selectedJobs = this.getSelectedJobs()
    if (selectedJobs.length === 0) {
      throw new Error('No jobs selected')
    }

    const activeResume = this.getActiveResume()
    if (!activeResume) {
      throw new Error('No active resume found')
    }

    // Process each selected job
    for (const job of selectedJobs) {
      job.generationStatus = 'generating'
      
      try {
        // Generate optimized document
        const document = await this.generateOptimizedDocument(
          job,
          activeResume,
          documentType,
          format,
          amplificationMode
        )
        
        // Store generated document
        if (!job.generatedDocs) {
          job.generatedDocs = []
        }
        
        // Remove existing documents of same type (like Chrome extension)
        job.generatedDocs = job.generatedDocs.filter(doc => doc.type !== documentType)
        
        job.generatedDocs.push({
          type: documentType,
          format,
          mimeType: this.getDocumentMimeType(format),
          base64: document,
          timestamp: Date.now()
        })
        
        // Trigger download
        await this.downloadGeneratedDocument(document, `${documentType}_${job.title}_${job.company}`, format)
        
        job.generationStatus = 'completed'
      } catch (error) {
        console.error('Error generating document:', error)
        job.generationStatus = 'error'
        throw error
      }
    }
    
    await this.saveJobs()
  }

  // Generate documents with options
  async generateDocuments(options: GenerationOptions) {
    const { documentType, format, mode, jobIds } = options
    
    // Temporarily set selected jobs
    const previousSelection = new Set(this.selectedJobs)
    this.selectedJobs = new Set(jobIds)
    
    try {
      if (documentType === 'both') {
        await this.generateDocument('cover', format, mode)
        await this.generateDocument('resume', format, mode)
      } else {
        await this.generateDocument(documentType, format, mode)
      }
    } finally {
      // Restore previous selection
      this.selectedJobs = previousSelection
    }
  }

  // Generate optimized document
  async generateOptimizedDocument(
    job: JobData,
    resume: Resume,
    documentType: string,
    format: string,
    amplificationMode: string
  ): Promise<string> {
    const apiKey = await this.getUserApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    if (documentType === 'resume') {
      // Step 1: Extract structured data from resume
      const extractedData = await this.extractResumeData(resume.content, apiKey)
      console.log('Extracted resume data:', extractedData)

      // Step 2: Build strict template and section config (mirrors extension)
      // (For simplicity, always include all sections)
      const templateFormat = `# [Name]
[Location] | [Citizenship if applicable]
Phone: [Phone] | Email: [Email]

## Professional Summary
[2-3 sentences highlighting most relevant experience for this job]

## Core Skills
- [Most relevant skill 1]
- [Most relevant skill 2]
- [Most relevant skill 3]
- [Additional relevant skills]

## Professional Experience
**[Job Title]**
[Company Name], [Location] | [Start Date] – [End Date]
- [Tailored responsibility emphasizing job-relevant skills]
- [Achievement with quantifiable results if available]
- [Additional relevant responsibility]

## Education
**[Degree Name]**
[Institution Name], [Location] | [Year]

## Licenses & Admissions
- [License/Certification 1]
- [License/Certification 2]

## Tools & Platforms
- [Relevant tools and technologies]`

      // Get selected enhancements for integration
      const selectedEnhancements = this.getSelectedEnhancementDetails ? this.getSelectedEnhancementDetails() : []
      const enhancementInstructions = selectedEnhancements.length > 0 ? 
        `\n\nSPECIAL ENHANCEMENT INSTRUCTIONS:
${selectedEnhancements.map(e => `- ${e.category} - ${e.title}: ${e.description} (Priority: ${e.priority})`).join('\n')}

These enhancements should be woven naturally into the resume content to address identified gaps. Focus on high-priority enhancements first.` : ''

      const userPrompt = `Create a tailored resume using this data and job requirements:

EXTRACTED RESUME DATA:
${JSON.stringify(extractedData, null, 2)}

JOB REQUIREMENTS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}${enhancementInstructions}

TEMPLATE FORMAT TO FOLLOW:
${templateFormat}

SECTION CONFIGURATION:
- Professional Summary: INCLUDE
- Core Skills: INCLUDE
- Professional Experience: INCLUDE
- Education: INCLUDE
- Licenses & Admissions: INCLUDE
- Tools & Platforms: INCLUDE

CRITICAL FORMATTING RULES:
1. Start with exactly: # [Full Name] (with # and space)
2. Use exactly: ## [Section Name] (with ## and space) for ALL section headers
3. For job titles use exactly: **[Job Title]** (with ** on both sides)
4. For company info use exactly: [Company Name], [Location] | [Start Date] – [End Date]
5. Use exactly: - [bullet point] (with - and space) for all bullet points
6. Use exactly: **[Degree Name]** (with ** on both sides) for education
7. Separate each section with exactly one blank line
8. Do NOT use any other formatting like bold company names or italic text

EXAMPLE FORMAT:
# Ricardo E. Zuloaga
New York, NY | United States & Venezuela
Phone: +1 917-254-9676 | Email: ricardozuloaga@gmail.com

## Professional Summary
[Content here]

## Core Skills
- [Skill 1]
- [Skill 2]

## Professional Experience
**Contracts Manager / Senior Legal & Commercial Advisor**
Zumar Trading Corp., New York, NY | 2020 – Present
- [Responsibility 1]
- [Responsibility 2]

## Education
**LL.M.**
Duke University School of Law, Durham, NC | 2013 – 2014

INSTRUCTIONS:
1. Follow the exact formatting rules above
2. Prioritize information most relevant to the job
3. Rewrite responsibilities to include job keywords naturally
4. Emphasize achievements that match job requirements
5. Order experience by relevance to target role
6. Only include sections marked as INCLUDE above
7. Return ONLY the formatted resume content, no explanations`

      const systemPrompt = this.getResumeSystemPrompt ? this.getResumeSystemPrompt(amplificationMode) : ''

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Document generation failed: ${response.status}`)
      }

      const result = await response.json()
      const generatedContent = result.choices[0].message.content

      // Convert to base64 for storage (like Chrome extension)
      const base64Content = btoa(unescape(encodeURIComponent(generatedContent)))
      return base64Content
    }

    // (Unchanged for cover letter and other types)
    let systemPrompt = ''
    let userPrompt = ''

    if (documentType === 'cover') {
      systemPrompt = this.getCoverLetterSystemPrompt(amplificationMode)
      userPrompt = this.getCoverLetterUserPrompt(job, resume, format)
    } else {
      throw new Error('Invalid document type')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Document generation failed: ${response.status}`)
    }

    const result = await response.json()
    const generatedContent = result.choices[0].message.content

    // Convert to base64 for storage (like Chrome extension)
    const base64Content = btoa(unescape(encodeURIComponent(generatedContent)))
    return base64Content
  }

  // Add: Extract structured data from resume using LLM (mirrors extension)
  async extractResumeData(resumeText: string, apiKey: string): Promise<any> {
    const systemPrompt = `You are a resume data extraction expert. Extract structured information from resumes and return it in a standardized JSON format.

CRITICAL RULES:
- Extract ONLY information that exists in the resume
- Do NOT invent or assume any information
- Preserve exact dates, company names, and job titles
- Extract skills exactly as written
- Maintain all factual accuracy`;

    const userPrompt = `Extract structured data from this resume and return it in the following JSON format:

RESUME TEXT:
${resumeText}

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "name": "Full Name",
    "location": "City, State",
    "phone": "Phone Number",
    "email": "Email Address",
    "citizenship": "Citizenship status if mentioned"
  },
  "professionalSummary": "2-3 sentence summary of experience",
  "coreSkills": [
    "Skill 1",
    "Skill 2",
    "Skill 3"
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "responsibilities": [
        "Responsibility 1",
        "Responsibility 2"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "location": "City, State",
      "year": "Graduation Year or Date Range"
    }
  ],
  "licenses": [
    "License or certification"
  ],
  "additionalSections": {
    "tools": ["Tool 1", "Tool 2"],
    "languages": ["Language 1", "Language 2"],
    "projects": [],
    "certifications": []
  }
}

Return ONLY the JSON object with extracted data.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const result = await response.json();
      let content = result.choices[0].message.content;
      try {
        // Clean and parse JSON
        let cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        const extractedData = JSON.parse(cleanContent);
        // Log the extracted data to help debug
        console.log('🔍 Extracted resume data:', extractedData);
        console.log('📊 Experience entries:', extractedData.experience?.length || 0);
        console.log('📚 Education entries:', extractedData.education?.length || 0);
        console.log('🛠️ Skills count:', extractedData.coreSkills?.length || 0);
        // Block generation if all key fields are empty
        if ((extractedData.experience?.length || 0) === 0 && (extractedData.education?.length || 0) === 0 && (extractedData.coreSkills?.length || 0) === 0) {
          throw new Error('Resume extraction failed. Please upload a plain text resume or check your formatting.');
        }
        return extractedData;
      } catch (e) {
        throw new Error('Failed to parse extracted resume data JSON');
      }
    } else {
      const error = await response.json();
      throw new Error(error.error?.message || `Resume data extraction failed: ${response.status}`);
    }
  }

  // Patch: Use structured extraction and strict template for resume generation
  async generateOptimizedDocument(
    job: JobData,
    resume: Resume,
    documentType: string,
    format: string,
    amplificationMode: string
  ): Promise<string> {
    const apiKey = await this.getUserApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    if (documentType === 'resume') {
      // Step 1: Extract structured data from resume
      const extractedData = await this.extractResumeData(resume.content, apiKey)
      console.log('Extracted resume data:', extractedData)

      // Step 2: Build strict template and section config (mirrors extension)
      // (For simplicity, always include all sections)
      const templateFormat = `# [Name]
[Location] | [Citizenship if applicable]
Phone: [Phone] | Email: [Email]

## Professional Summary
[2-3 sentences highlighting most relevant experience for this job]

## Core Skills
- [Most relevant skill 1]
- [Most relevant skill 2]
- [Most relevant skill 3]
- [Additional relevant skills]

## Professional Experience
**[Job Title]**
[Company Name], [Location] | [Start Date] – [End Date]
- [Tailored responsibility emphasizing job-relevant skills]
- [Achievement with quantifiable results if available]
- [Additional relevant responsibility]

## Education
**[Degree Name]**
[Institution Name], [Location] | [Year]

## Licenses & Admissions
- [License/Certification 1]
- [License/Certification 2]

## Tools & Platforms
- [Relevant tools and technologies]`

      // Get selected enhancements for integration
      const selectedEnhancements = this.getSelectedEnhancementDetails ? this.getSelectedEnhancementDetails() : []
      const enhancementInstructions = selectedEnhancements.length > 0 ? 
        `\n\nSPECIAL ENHANCEMENT INSTRUCTIONS:
${selectedEnhancements.map(e => `- ${e.category} - ${e.title}: ${e.description} (Priority: ${e.priority})`).join('\n')}

These enhancements should be woven naturally into the resume content to address identified gaps. Focus on high-priority enhancements first.` : ''

      const userPrompt = `Create a tailored resume using this data and job requirements:

EXTRACTED RESUME DATA:
${JSON.stringify(extractedData, null, 2)}

JOB REQUIREMENTS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}${enhancementInstructions}

TEMPLATE FORMAT TO FOLLOW:
${templateFormat}

SECTION CONFIGURATION:
- Professional Summary: INCLUDE
- Core Skills: INCLUDE
- Professional Experience: INCLUDE
- Education: INCLUDE
- Licenses & Admissions: INCLUDE
- Tools & Platforms: INCLUDE

CRITICAL FORMATTING RULES:
1. Start with exactly: # [Full Name] (with # and space)
2. Use exactly: ## [Section Name] (with ## and space) for ALL section headers
3. For job titles use exactly: **[Job Title]** (with ** on both sides)
4. For company info use exactly: [Company Name], [Location] | [Start Date] – [End Date]
5. Use exactly: - [bullet point] (with - and space) for all bullet points
6. Use exactly: **[Degree Name]** (with ** on both sides) for education
7. Separate each section with exactly one blank line
8. Do NOT use any other formatting like bold company names or italic text

EXAMPLE FORMAT:
# Ricardo E. Zuloaga
New York, NY | United States & Venezuela
Phone: +1 917-254-9676 | Email: ricardozuloaga@gmail.com

## Professional Summary
[Content here]

## Core Skills
- [Skill 1]
- [Skill 2]

## Professional Experience
**Contracts Manager / Senior Legal & Commercial Advisor**
Zumar Trading Corp., New York, NY | 2020 – Present
- [Responsibility 1]
- [Responsibility 2]

## Education
**LL.M.**
Duke University School of Law, Durham, NC | 2013 – 2014

INSTRUCTIONS:
1. Follow the exact formatting rules above
2. Prioritize information most relevant to the job
3. Rewrite responsibilities to include job keywords naturally
4. Emphasize achievements that match job requirements
5. Order experience by relevance to target role
6. Only include sections marked as INCLUDE above
7. Return ONLY the formatted resume content, no explanations`

      const systemPrompt = this.getResumeSystemPrompt ? this.getResumeSystemPrompt(amplificationMode) : ''

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Document generation failed: ${response.status}`)
      }

      const result = await response.json()
      const generatedContent = result.choices[0].message.content

      // Convert to base64 for storage (like Chrome extension)
      const base64Content = btoa(unescape(encodeURIComponent(generatedContent)))
      return base64Content
    }

    // (Unchanged for cover letter and other types)
    let systemPrompt = ''
    let userPrompt = ''

    if (documentType === 'cover') {
      systemPrompt = this.getCoverLetterSystemPrompt(amplificationMode)
      userPrompt = this.getCoverLetterUserPrompt(job, resume, format)
    } else {
      throw new Error('Invalid document type')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || `Document generation failed: ${response.status}`)
    }

    const result = await response.json()
    const generatedContent = result.choices[0].message.content

    // Convert to base64 for storage (like Chrome extension)
    const base64Content = btoa(unescape(encodeURIComponent(generatedContent)))
    return base64Content
  }

  getCoverLetterSystemPrompt(amplificationMode: string): string {
    const basePrompt = `You are an expert cover letter writer. Create a professional, compelling cover letter that highlights the candidate's relevant experience and enthusiasm for the specific role.`
    
    switch (amplificationMode) {
      case 'precision':
        return `${basePrompt} 
        
PRECISION MODE - Be conservative and factual:
- Only mention skills and experiences explicitly stated in the resume
- Use professional, formal language
- Focus on direct matches between resume and job requirements
- Avoid embellishment or speculation
- Keep claims verifiable and accurate`

      case 'gap':
        return `${basePrompt}
        
GAP FILLER MODE - Address missing qualifications strategically:
- Highlight transferable skills that relate to missing requirements
- Emphasize relevant experience that demonstrates adaptability
- Show enthusiasm for learning new skills mentioned in the job
- Frame existing experience in ways that address job gaps
- Demonstrate understanding of the role's challenges`

      case 'beast':
        return `${basePrompt}
        
BEAST MODE - Maximize impact and competitiveness:
- Present the candidate as the ideal fit for the role
- Emphasize standout achievements and unique value proposition
- Use confident, compelling language
- Highlight leadership potential and growth mindset
- Show deep understanding of company needs and industry trends
- Make the candidate memorable and impressive`

      default:
        return basePrompt
    }
  }

  getCoverLetterUserPrompt(job: JobData, resume: Resume, format: string): string {
    const selectedEnhancements = this.getSelectedEnhancementDetails()
    const enhancementInstructions = selectedEnhancements.length > 0 ? `

SELECTED ENHANCEMENTS TO HIGHLIGHT:
${selectedEnhancements.map(e => `- ${e.category} - ${e.title}: ${e.description} (Priority: ${e.priority})`).join('\n')}

ENHANCEMENT INTEGRATION INSTRUCTIONS:
- Address these enhancement areas in the cover letter
- Highlight how the candidate can develop these skills/areas
- Show alignment with job requirements while being authentic
- Focus on high-priority enhancements first` : ''

    return `Create a professional cover letter for this job application:

JOB DETAILS:
- Position: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Job Description: ${job.description}

CANDIDATE RESUME:
${resume.content}${enhancementInstructions}

REQUIREMENTS:
- Format: ${format.toLowerCase() === 'pdf' ? 'Professional format suitable for PDF' : format.toLowerCase() === 'docx' ? 'Professional format suitable for Word document' : 'Plain text format'}
- Length: 3-4 paragraphs
- Include specific examples from the resume that relate to the job
- Show enthusiasm for the role and company
- Include a strong opening and closing
- Make it unique and tailored to this specific position

Generate a complete cover letter that will make the candidate stand out.`
  }

  getResumeSystemPrompt(amplificationMode: string): string {
    const basePrompt = `You are an expert resume writer. Create a tailored, professional resume that highlights the candidate's most relevant qualifications for the specific role.`
    
    switch (amplificationMode) {
      case 'precision':
        return `${basePrompt}
        
PRECISION MODE - Conservative and accurate:
- Only include information explicitly stated in the original resume
- Reorganize and reword existing content for maximum relevance
- Use professional, factual language
- Focus on direct skill matches and relevant experience
- Maintain complete accuracy and verifiability`

      case 'gap':
        return `${basePrompt}
        
GAP FILLER MODE - Strategic positioning:
- Emphasize transferable skills that address job requirements
- Reorganize experience to highlight relevant aspects
- Use industry-appropriate terminology
- Show progression and growth potential
- Frame existing experience to address apparent gaps`

      case 'beast':
        return `${basePrompt}
        
BEAST MODE - Maximum impact:
- Present the candidate as exceptionally qualified
- Emphasize achievements and quantifiable results
- Use powerful, confident language
- Highlight unique value proposition
- Show leadership potential and expertise
- Make the candidate appear ideal for the role`

      default:
        return basePrompt
    }
  }

  getResumeUserPrompt(job: JobData, resume: Resume, format: string): string {
    const selectedEnhancements = this.getSelectedEnhancementDetails()
    const enhancementInstructions = selectedEnhancements.length > 0 ? `

SELECTED ENHANCEMENTS TO INTEGRATE:
${selectedEnhancements.map(e => `- ${e.category} - ${e.title}: ${e.description} (Priority: ${e.priority})`).join('\n')}

ENHANCEMENT INTEGRATION INSTRUCTIONS:
- Weave these enhancements naturally into the resume content
- Address identified gaps while maintaining authenticity
- Focus on high-priority enhancements first
- Ensure all enhancements align with the job requirements` : ''

    return `Create a tailored resume for this job application:

JOB DETAILS:
- Position: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Job Description: ${job.description}

ORIGINAL RESUME:
${resume.content}${enhancementInstructions}

REQUIREMENTS:
- Format: ${format.toLowerCase() === 'pdf' ? 'Professional format suitable for PDF' : format.toLowerCase() === 'docx' ? 'Professional format suitable for Word document' : 'Plain text format'}
- Tailor the resume to emphasize relevant skills and experience
- Reorganize sections to highlight job-relevant qualifications
- Use keywords from the job description appropriately
- Maintain professional formatting and structure
- Include quantifiable achievements where possible

Generate a complete, tailored resume that maximizes the candidate's chances for this specific role.`
  }

  // Get document MIME type
  getDocumentMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'application/pdf'
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      case 'txt':
        return 'text/plain'
      default:
        return 'text/plain'
    }
  }

  // Load scoring preference
  async loadScoringPreference() {
    const stored = localStorage.getItem('autoapply_scoring_mode')
    if (stored) {
      try {
        this.scoringMode = JSON.parse(stored)
      } catch (error) {
        console.error('Error parsing scoring mode:', error)
        this.scoringMode = 'automatic'
      }
    }
  }

  // Save scoring preference
  async saveScoringPreference() {
    try {
      localStorage.setItem('autoapply_scoring_mode', JSON.stringify(this.scoringMode))
    } catch (error) {
      console.error('Error saving scoring mode:', error)
    }
  }

  // Score job
  async scoreJob(jobId: number) {
    const job = this.jobs.find(j => j.id === jobId)
    if (!job) {
      throw new Error('Job not found')
    }

    const activeResume = this.getActiveResume()
    if (!activeResume) {
      throw new Error('No active resume found')
    }

    const apiKey = await this.getUserApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      console.log('🔍 Starting job scoring for:', job.title)
      console.log('🔍 Active resume found:', {
        id: activeResume.id,
        name: activeResume.name,
        contentLength: activeResume.content?.length || 0,
        contentPreview: activeResume.content?.substring(0, 100) + '...'
      })
      console.log('🔍 Job details:', {
        title: job.title,
        company: job.company,
        descriptionLength: job.description?.length || 0
      })
      console.log('🔍 API key configured:', apiKey.substring(0, 10) + '...')
      
      // Validate resume content before proceeding
      if (!activeResume.content || activeResume.content.trim().length < 50) {
        console.error('❌ Resume content too short or empty:', activeResume.content?.length || 0, 'characters')
        throw new Error('Resume content is too short or empty. Please upload a proper resume document.')
      }
      
      // Call the real job matching function
      const matchResult = await this.calculateJobMatch(job, activeResume, apiKey)
      
      console.log('🔍 Match result received:', {
        overallScore: matchResult.overallScore,
        strengths: matchResult.strengths?.length || 0,
        gaps: matchResult.gaps?.length || 0,
        reasoning: matchResult.reasoning?.substring(0, 100) + '...'
      })
      
      // Update job with match results
      job.matchScore = matchResult.overallScore
      job.matchGrade = this.getMatchGrade(matchResult.overallScore)
      job.matchAnalysis = matchResult
      
      await this.saveJobs()
      // --- PERSIST TO SUPABASE ---
      // NOTE: Skipping Supabase persistence for now due to RLS authentication requirements
      // TODO: Implement proper user authentication to enable database persistence
      console.log('ℹ️  Supabase persistence temporarily disabled - requires user authentication');
      console.log('ℹ️  Job scoring data is saved locally and will sync when authentication is implemented');
      
      // Uncomment below when proper authentication is implemented:
      /*
      try {
        // If job has a string id, use it; otherwise, convert number id to string
        const jobIdStr = typeof job.id === 'string' ? job.id : String(job.id);
        
        // Map camelCase fields to snake_case for database - using current schema
        const jobDataForDB = {
          // DON'T send id - let PostgreSQL SERIAL PRIMARY KEY auto-generate it
          user_id: currentUser.id, // TODO: Use real authenticated user ID
          title: job.title || '',
          company: job.company || '',
          description: job.description || '',
          location: job.location || '',
          salary: job.salary || '',
          job_url: job.url || '',
          source_platform: job.source || '',
          created_at: job.capturedAt || new Date().toISOString(),
          match_score: job.matchScore || null,
          match_analysis: job.matchAnalysis || null
        };
        
        await database.saveJob(jobDataForDB);
        console.log('✅ Job scoring persisted to Supabase');
      } catch (persistErr) {
        console.error('❌ Failed to persist job scoring to Supabase:', persistErr);
        // Note: Supabase persistence failed, but job scoring still completed successfully in memory
      }
      */
      // --- END PERSIST ---
      console.log('✅ Job scoring completed:', job.matchScore + '%')
      
      return matchResult
    } catch (error: any) {
      console.error('❌ Error scoring job:', error)
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      })
      throw error
    }
  }

  // Calculate job match using ExtensionMatchingSystem (mirrors Chrome extension logic exactly)
  async calculateJobMatch(job: JobData, resume: Resume, apiKey: string) {
    console.log('🔍 Calculating job match with ExtensionMatchingSystem...')
    
    // Debug the resume content being passed to matching system
    console.log('🔍 RESUME BEING PASSED TO MATCHING SYSTEM:', {
      id: resume.id,
      name: resume.name,
      hasContent: !!resume.content,
      contentLength: resume.content?.length || 0,
      contentPreview: resume.content?.substring(0, 300) || 'NO CONTENT',
      contentType: typeof resume.content
    });
    
    // Validate resume content before passing to matching system
    if (!resume.content || resume.content.trim().length < 50) {
      console.error('❌ Resume content validation failed for matching system:', {
        hasContent: !!resume.content,
        contentLength: resume.content?.length || 0,
        contentTrimmed: resume.content?.trim().length || 0
      });
      throw new Error('Resume content is missing or too short for analysis. Please re-upload your resume.');
    }
    
    // Create an instance of the ExtensionMatchingSystem
    const matchingSystem = new ExtensionMatchingSystem(apiKey)
    
    // Use the extension's exact calculateJobMatch logic
    const result = await matchingSystem.calculateJobMatch(job, resume)
    
    // Transform the result to maintain compatibility with existing UI
    return {
      overallScore: result.score,
      strengths: result.strengths,
      gaps: result.gaps,
      recommendations: result.recommendations,
      reasoning: result.reasoning,
      matrix: result.matrix,
      analyzedAt: result.analyzedAt,
      // Add requirements property for UI compatibility
      requirements: result.matrix || []
    }
  }

  // Score all jobs
  async scoreAllJobs() {
    const activeResume = this.getActiveResume()
    if (!activeResume) {
      throw new Error('No active resume found')
    }

    const apiKey = await this.getUserApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    for (const job of this.jobs) {
      if (!job.matchScore) {
        try {
          await this.scoreJob(job.id)
          // Add delay to avoid rate limiting (3 seconds like Chrome extension)
          await new Promise(resolve => setTimeout(resolve, 3000))
        } catch (error) {
          console.error(`Failed to score job ${job.title}:`, error)
          // Continue with next job on error
        }
      }
    }
  }

  // Get match grade
  getMatchGrade(score: number): string {
    if (score >= 90) return 'excellent'
    if (score >= 70) return 'good'
    if (score >= 50) return 'moderate'
    if (score >= 30) return 'weak'
    return 'poor'
  }

  // Search jobs
  searchJobs(query: string): JobData[] {
    if (!query.trim()) return this.jobs
    
    const lowerQuery = query.toLowerCase()
    return this.jobs.filter(job =>
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.toLowerCase().includes(lowerQuery) ||
      job.location.toLowerCase().includes(lowerQuery)
    )
  }

  // Sort jobs
  sortJobs(sortBy: string): JobData[] {
    const sorted = [...this.jobs]
    
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
      case 'score':
        return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      case 'company':
        return sorted.sort((a, b) => a.company.localeCompare(b.company))
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return sorted
    }
  }

  // Get jobs data (internal format)
  getJobsData(): JobData[] {
    return this.jobs
  }

  // Get resumes in the format expected by dashboard
  getResumes(): Resume[] {
    return this.storedResumes
  }

  // Load resumes (alias for getResumes for dashboard compatibility)
  async loadResumes(): Promise<Resume[]> {
    return this.getResumes()
  }

  // Get current tab
  getCurrentTab(): string {
    return this.currentTab
  }

  // Set current tab
  setCurrentTab(tab: string) {
    this.currentTab = tab
  }

  // Get selected jobs set
  getSelectedJobsSet(): Set<number> {
    return this.selectedJobs
  }

  // Get match colors
  getMatchColors(): MatchColors {
    return this.matchColors
  }

  // Set API key (alias for setUserApiKey)
  async setApiKey(apiKey: string) {
    await this.setUserApiKey(apiKey)
  }

  // Smart Enhancement functionality
  async analyzeResumeGaps() {
    const selectedJobs = this.getSelectedJobs()
    if (selectedJobs.length === 0) {
      throw new Error('Please select at least one job to analyze resume gaps')
    }

    const activeResume = this.getActiveResume()
    if (!activeResume) {
      throw new Error('No active resume found')
    }

    const apiKey = await this.getUserApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const enhancements = await this.generateEnhancementSuggestions(activeResume.content, selectedJobs, apiKey)
      this.currentEnhancementAnalysis = enhancements
      return enhancements
    } catch (error) {
      console.error('Enhancement analysis error:', error)
      throw error
    }
  }

  // Smart Enhancement functionality with provided jobs (for dashboard)
  async analyzeResumeGapsWithJobs(jobs: Job[]) {
    if (jobs.length === 0) {
      throw new Error('Please select at least one job to analyze resume gaps')
    }

    const activeResume = this.getActiveResume()
    if (!activeResume) {
      throw new Error('No active resume found')
    }

    const apiKey = await this.getUserApiKey()
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      // Convert Job[] to JobData[] for the analysis
      const jobData = jobs.map(job => ({
        ...job,
        capturedAt: job.captureDate || job.capturedAt
      })) as JobData[]
      
      const enhancements = await this.generateEnhancementSuggestions(activeResume.content, jobData, apiKey)
      this.currentEnhancementAnalysis = enhancements
      return enhancements
    } catch (error) {
      console.error('Enhancement analysis error:', error)
      throw error
    }
  }

  async generateEnhancementSuggestions(resumeText: string, jobs: JobData[], apiKey: string): Promise<EnhancementAnalysis> {
    // Validate inputs
    if (!resumeText || typeof resumeText !== 'string') {
      throw new Error('Resume text is required and must be a valid string')
    }
    
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      throw new Error('At least one job is required for enhancement analysis')
    }

    const systemPrompt = `You are a resume enhancement expert. Analyze the user's resume against job requirements and suggest categorized, actionable enhancements that would make their application more competitive.

CRITICAL RULES:
- Focus on what's missing or could be strengthened
- Organize suggestions into logical categories
- Suggest specific skills, metrics, or experiences to highlight
- Make suggestions realistic and achievable
- Provide 2-3 suggestions per category
- Return suggestions organized by category

ENHANCEMENT CATEGORIES TO CONSIDER:
- Technical Skills: Missing technical skills mentioned in job descriptions
- Quantified Achievements: Lack of quantified achievements/metrics
- Leadership & Collaboration: Missing leadership or collaboration examples
- Industry Experience: Absent industry-specific certifications or experience
- Soft Skills: Missing soft skills emphasized in jobs
- Project Examples: Lack of relevant project examples
- Client Relations: Missing client/stakeholder interaction examples
- Process Improvement: Absent process improvement examples`

    // Combine all job descriptions with safety checks
    const jobDescriptions = jobs.map(job => {
      const title = job.title || 'Unknown Title'
      const company = job.company || 'Unknown Company'
      const description = job.description || 'No description available'
      return `
JOB: ${title} at ${company}
DESCRIPTION: ${description}
`
    }).join('\n---\n')

    // Safely truncate strings
    const truncatedResume = resumeText.length > 3000 ? resumeText.substring(0, 3000) : resumeText
    const truncatedJobs = jobDescriptions.length > 2000 ? jobDescriptions.substring(0, 2000) : jobDescriptions

    const userPrompt = `Analyze this resume against the job requirements and suggest categorized enhancements:

RESUME:
${truncatedResume}

JOB REQUIREMENTS:
${truncatedJobs}

Return enhancement suggestions organized by category in this JSON format:
{
  "Technical Skills": [
    {
      "title": "Add Python Programming",
      "description": "Highlight Python programming skills mentioned in job requirements",
      "priority": "high"
    },
    {
      "title": "Emphasize Cloud Platforms",
      "description": "Showcase AWS/Azure experience for cloud-based roles",
      "priority": "medium"
    }
  ],
  "Quantified Achievements": [
    {
      "title": "Add Revenue Impact",
      "description": "Include specific revenue or cost savings numbers",
      "priority": "high"
    }
  ],
  "Leadership & Collaboration": [
    {
      "title": "Team Leadership Metrics",
      "description": "Quantify team size and leadership achievements",
      "priority": "medium"
    }
  ],
  "Industry Experience": [
    {
      "title": "Relevant Certifications",
      "description": "Add industry-specific certifications mentioned in job",
      "priority": "low"
    }
  ]
}

Requirements:
- Only include categories that have relevant suggestions
- Each "title" should be 2-5 words, actionable
- Each "description" should explain the specific enhancement benefit
- Set "priority" as "high", "medium", or "low" based on impact
- Focus on high-impact improvements that address job requirements
- Make suggestions realistic based on the resume content
- Include 1-3 suggestions per category

Return ONLY the JSON object.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    })

    if (response.ok) {
      const result = await response.json()
      
      try {
        const content = result.choices[0].message.content
        let cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        
        const enhancements = JSON.parse(cleanContent)
        return enhancements
      } catch (parseError) {
        console.error('Error parsing enhancement suggestions:', parseError)
        throw new Error('Failed to parse enhancement suggestions from AI response')
      }
    } else {
      const error = await response.json()
      throw new Error(error.error?.message || `API Error: ${response.status}`)
    }
  }

  getCurrentEnhancementAnalysis(): EnhancementAnalysis | null {
    return this.currentEnhancementAnalysis
  }

  // Selected enhancement management
  setSelectedEnhancements(enhancements: Set<string>) {
    this.selectedEnhancements = enhancements
  }

  getSelectedEnhancements(): string[] {
    return Array.from(this.selectedEnhancements)
  }

  getSelectedEnhancementDetails(): Array<{ category: string; title: string; description: string; priority: string }> {
    if (!this.currentEnhancementAnalysis) return []
    
    const selected: Array<{ category: string; title: string; description: string; priority: string }> = []
    
    Object.entries(this.currentEnhancementAnalysis).forEach(([category, suggestions]) => {
      suggestions.forEach((suggestion: any) => {
        const enhancementKey = `${category}:${suggestion.title}`
        if (this.selectedEnhancements.has(enhancementKey)) {
          selected.push({
            category,
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority
          })
        }
      })
    })
    
    return selected
  }

  // API Service proxy methods
  async chatCompletion(messages: any[], options: any = {}) {
    const apiKey = await this.getUserApiKey()
    if (!apiKey) {
      throw new Error('No API key configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages,
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        ...options
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    return response.json()
  }

  // Get user API key
  async getUserApiKey(): Promise<string | null> {
    return localStorage.getItem('openai_api_key')
  }

  // Set user API key
  async setUserApiKey(apiKey: string) {
    localStorage.setItem('openai_api_key', apiKey)
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.chatCompletion([
        { role: 'user', content: 'Test message' }
      ], { max_tokens: 10 })
      return !!response
    } catch (error) {
      return false
    }
  }

  // Download generated document
  async downloadGeneratedDocument(base64Content: string, filename: string, format: string) {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_')
    
    // Decode base64 content
    const decodedContent = decodeURIComponent(escape(atob(base64Content)))
    
    let blob: Blob
    let fileExtension: string
    
    switch (format.toLowerCase()) {
      case 'pdf':
        // For PDF, we'd need to convert HTML/text to PDF
        // For now, create a text file with PDF extension
        blob = new Blob([decodedContent], { type: 'text/plain' })
        fileExtension = '.txt' // Changed from .pdf since we're not creating actual PDF
        break
      case 'docx':
        // For DOCX, we'd need to create proper Word document
        // For now, create a text file with DOCX extension
        blob = new Blob([decodedContent], { type: 'text/plain' })
        fileExtension = '.txt' // Changed from .docx since we're not creating actual DOCX
        break
      case 'text':
      default:
        blob = new Blob([decodedContent], { type: 'text/plain' })
        fileExtension = '.txt'
        break
    }
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizedFilename}${fileExtension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Manual sync from Chrome extension storage
  async syncFromExtension(): Promise<{ jobs: number; resumes: number }> {
    const stats = { jobs: 0, resumes: 0 }
    
    // Try using ExtensionBridge first
    if (typeof window !== 'undefined' && (window as any).ExtensionBridge) {
      try {
        console.log('🔍 Using ExtensionBridge for sync')
        const response = await (window as any).ExtensionBridge.syncData()
        
        if (response && response.success) {
          // Update jobs
          if (response.jobs && Array.isArray(response.jobs)) {
            const previousJobCount = this.jobs.length
            // Transform extension jobs to match web app expectations
            this.jobs = response.jobs.map(job => ({
              ...job,
              // Ensure required fields exist
              matchScore: job.matchScore || 0,
              matchGrade: job.matchGrade || 'unscored',
              starred: job.starred || false,
              generationStatus: job.generationStatus || 'pending',
              generatedDocs: job.generatedDocs || []
            }))
            stats.jobs = this.jobs.length
            console.log(`🔄 Synced ${stats.jobs} jobs from Chrome extension (was ${previousJobCount})`)
          }
          
          // Update resumes
          if (response.resumes && Array.isArray(response.resumes)) {
            const previousResumeCount = this.storedResumes.length
            this.storedResumes = response.resumes
            stats.resumes = this.storedResumes.length
            console.log(`🔄 Synced ${stats.resumes} resumes from Chrome extension (was ${previousResumeCount})`)
          }
          
          // Update active resume ID
          if (response.activeResumeId) {
            this.activeResumeId = response.activeResumeId
            console.log(`🔄 Synced active resume ID: ${this.activeResumeId}`)
          }
          
          // Save synced data to localStorage as backup
          await this.saveJobs()
          await this.saveStoredResumes()
          await this.saveActiveResumeId()
          
          return stats
        }
      } catch (error) {
        console.error('ExtensionBridge sync failed:', error)
      }
    }
    
    // Fallback to direct Chrome API
    if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
      try {
        console.log('🔍 Using direct Chrome API for sync')
        // Use message passing to sync data from extension
        const response = await new Promise<any>((resolve, reject) => {
          (window as any).chrome.runtime.sendMessage({ action: 'syncData' }, (response: any) => {
            if ((window as any).chrome.runtime.lastError) {
              reject((window as any).chrome.runtime.lastError)
            } else {
              resolve(response)
            }
          })
        })
        
        if (response && response.success) {
          // Update jobs
          if (response.jobs && Array.isArray(response.jobs)) {
            const previousJobCount = this.jobs.length
            // Transform extension jobs to match web app expectations
            this.jobs = response.jobs.map(job => ({
              ...job,
              // Ensure required fields exist
              matchScore: job.matchScore || 0,
              matchGrade: job.matchGrade || 'unscored',
              starred: job.starred || false,
              generationStatus: job.generationStatus || 'pending',
              generatedDocs: job.generatedDocs || []
            }))
            stats.jobs = this.jobs.length
            console.log(`🔄 Synced ${stats.jobs} jobs from Chrome extension (was ${previousJobCount})`)
          }
          
          // Update resumes
          if (response.resumes && Array.isArray(response.resumes)) {
            const previousResumeCount = this.storedResumes.length
            this.storedResumes = response.resumes
            stats.resumes = this.storedResumes.length
            console.log(`🔄 Synced ${stats.resumes} resumes from Chrome extension (was ${previousResumeCount})`)
          }
          
          // Update active resume ID
          if (response.activeResumeId) {
            this.activeResumeId = response.activeResumeId
            console.log(`🔄 Synced active resume ID: ${this.activeResumeId}`)
          }
          
          // Save synced data to localStorage as backup
          await this.saveJobs()
          await this.saveStoredResumes()
          await this.saveActiveResumeId()
          
          return stats
        } else {
          throw new Error('Failed to sync data from extension')
        }
      } catch (error) {
        console.error('Error syncing from Chrome extension:', error)
        throw new Error('Failed to sync from Chrome extension. Make sure the extension is installed and enabled.')
      }
    } else {
      throw new Error('Chrome extension not available. Please install and enable the AutoApply AI extension.')
    }
  }
}

// API Service class - mirrors extension's APIService class
export class APIService {
  // Implementation mirrors extension's APIService class
  // This would contain the actual API integration logic
}

// Export the main class and types
export { type JobData, type MatchColors } 