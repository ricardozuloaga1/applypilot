"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Briefcase, 
  Sparkles, 
  Settings, 
  Download,
  Trash2,
  Plus,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap
} from "lucide-react"
import { AutoApplyAI } from "@/lib/extension-mirror"
import type { Job, Resume } from "@/lib/extension-mirror"
// Old matching system imports removed - now using extension's scoring logic
import Image from "next/image"
import ResumeBuilderIntegration from '../../components/ResumeBuilderIntegration';
import { CompanyLogo } from '../../components/CompanyLogo';
import { EnhancementPopover } from '../../components/EnhancementPopover';
import { ResumeSelector } from '../../components/ResumeSelector';
import { DocumentTemplatePreview } from '../../components/DocumentTemplatePreview';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Authentication wrapper component
function AuthenticatedDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null
  }

  // User is authenticated, render the actual dashboard
  return <DashboardContent />
}

// Main dashboard component (only rendered when authenticated)
function DashboardContent() {
  const [activeTab, setActiveTab] = useState("resume-builder")
  const [autoApply, setAutoApply] = useState<AutoApplyAI | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Job management state
  const [selectedJobs, setSelectedJobs] = useState<number[]>([])
  const [jobSearch, setJobSearch] = useState("")
  const [jobSortBy, setJobSortBy] = useState<'date' | 'score' | 'title' | 'company'>('date')
  const [jobSortOrder, setJobSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set())
  const [expandedJobDescriptions, setExpandedJobDescriptions] = useState<Set<number>>(new Set())
  const [scoringJobId, setScoringJobId] = useState<number | null>(null)
  const [scoringProgress, setScoringProgress] = useState<{current: number, total: number, startTime: number} | null>(null)
  const [stopScoring, setStopScoring] = useState<boolean>(false)
  const [bulkScoring, setBulkScoring] = useState<boolean>(false)
  const [bulkScoreMode, setBulkScoreMode] = useState<boolean>(false)
  
  // Generation options
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'text' | 'docx'>('pdf')
  
  // Settings
  const [apiKey, setApiKey] = useState<string>('')
  const [autoScore, setAutoScore] = useState<boolean>(true)
  const [notifications, setNotifications] = useState<boolean>(true)
  const [selectedEnhancements, setSelectedEnhancements] = useState<Set<string>>(new Set())
  const [detailedEnhancements, setDetailedEnhancements] = useState<Record<string, { familiarity: string; experience: string }>>({})
  
  // 8-Variable Matching System state
  // Old matching system state variables removed - now using extension's scoring logic

  // AI Document Generation state
  const [generatedDocuments, setGeneratedDocuments] = useState<Array<{
    id: string;
    jobId: number;
    jobTitle: string;
    companyName: string;
    content: string;
    format: string;
    mimeType: string;
    extension: string;
    fileName: string;
    generatedAt: string;
  }>>([])
  const [activeDocumentIndex, setActiveDocumentIndex] = useState<number>(0)
  const [enhancementSuggestions, setEnhancementSuggestions] = useState<{
    [jobId: number]: {
      jobTitle: string;
      companyName: string;
      enhancements: {
        category: string;
        requirement: string;
        gapAction: string;
      }[];
    };
  } | null>(null)
  const [selectedAIDocumentResume, setSelectedAIDocumentResume] = useState<string | null>(null)
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null)
  const [selectedAIMode, setSelectedAIMode] = useState<'precision' | 'gap_filler' | 'beast_mode'>('precision')
  
  // Legacy state for backward compatibility
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null)
  const [generatedFormat, setGeneratedFormat] = useState<string>('txt')
  const [generatedMimeType, setGeneratedMimeType] = useState<string>('text/plain')
  const [generatedExtension, setGeneratedExtension] = useState<string>('txt')

  // Initialize AutoApplyAI instance
  useEffect(() => {
    const initializeAutoApply = async () => {
      try {
        console.log('🔍 Initializing AutoApply AI...')
        const autoApplyInstance = new AutoApplyAI()
        await autoApplyInstance.init()
        console.log('✅ AutoApply AI initialized')
        setAutoApply(autoApplyInstance)
        
        // Load initial data
        console.log('🔍 Loading initial data...')
        await loadJobs(autoApplyInstance)
        await loadResumes(autoApplyInstance)
        console.log('✅ Initial data loaded')
        
        // Load saved settings
        const savedApiKey = localStorage.getItem('openai_api_key')
        const savedAutoScore = localStorage.getItem('auto_score')
        const savedNotifications = localStorage.getItem('notifications')
        
        if (savedApiKey) {
          setApiKey(savedApiKey)
          autoApplyInstance.setApiKey(savedApiKey)
          
          // API key is available for matching system
        }
        if (savedAutoScore) setAutoScore(savedAutoScore === 'true')
        if (savedNotifications) setNotifications(savedNotifications === 'true')
        
      } catch (err) {
        console.error('Failed to initialize AutoApply:', err)
        setError('Failed to initialize application')
      }
    }

    initializeAutoApply()
  }, [])

  const loadJobs = async (autoApplyInstance?: AutoApplyAI) => {
    try {
      const instance = autoApplyInstance || autoApply
      if (!instance) {
        console.log('❌ No AutoApply instance available')
        return
      }

      console.log('🔍 Loading jobs...')
      const allJobs = await instance.getJobs()
      console.log('🔍 Jobs loaded:', allJobs.length, 'jobs')
      console.log('🔍 First job:', allJobs[0])
      setJobs(allJobs)
    } catch (err) {
      console.error('Failed to load jobs:', err)
      setError('Failed to load jobs')
    }
  }

  const loadResumes = async (autoApplyInstance?: AutoApplyAI) => {
    try {
      const instance = autoApplyInstance || autoApply
      if (!instance) return

      const allResumes = await instance.loadResumes()
      setResumes(allResumes)
      
      // Auto-select the active resume for document generation and global selector
      const activeResume = allResumes.find(r => r.isActive)
      if (activeResume) {
        if (!selectedAIDocumentResume) {
          console.log('🔍 Auto-selecting active resume for document generation:', activeResume.name)
          setSelectedAIDocumentResume(activeResume.id)
        }
        if (!activeResumeId) {
          console.log('🔍 Auto-selecting active resume for global selector:', activeResume.name)
          setActiveResumeId(activeResume.id)
        }
      } else if (allResumes.length > 0 && !activeResumeId) {
        // If no active resume, select the first one
        console.log('🔍 Auto-selecting first resume:', allResumes[0].name)
        setActiveResumeId(allResumes[0].id)
      }
    } catch (err) {
      console.error('Failed to load resumes:', err)
      setError('Failed to load resumes')
    }
  }

  // Helper function to generate proper file names
  const generateFileName = (userName: string, companyName: string, documentType: string, format: string): string => {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Clean up names by removing special characters and spaces
    const cleanUserName = userName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const cleanCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    
    return `${cleanUserName}_${cleanCompanyName}_${documentType}_${currentDate}.${format}`;
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!autoApply) return

    try {
      setIsLoading(true)
      await autoApply.deleteJob(jobId.toString())
      await loadJobs()
      setSelectedJobs(prev => prev.filter(id => id !== jobId))
      setSuccess('Job deleted successfully!')
    } catch (err) {
      setError('Failed to delete job')
      console.error('Error deleting job:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJobSelection = (jobId: number) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(prev => prev.filter(id => id !== jobId))
    } else if (selectedJobs.length < 3) {
      setSelectedJobs(prev => [...prev, jobId])
    }
  }

  const toggleJobExpansion = (jobId: number) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const toggleJobDescriptionExpansion = (jobId: number) => {
    setExpandedJobDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const selectAllUnscoredJobs = () => {
    // Only select jobs that don't already have scores
    const unscoredJobs = sortedJobs.filter(job => !job.matchScore || job.matchScore === 0)
    setSelectedJobs(unscoredJobs.map(job => job.id))
  }

  const selectAllJobs = () => {
    setSelectedJobs(sortedJobs.map(job => job.id))
  }

  const clearJobSelection = () => {
    setSelectedJobs([])
  }

  const handleBulkScoreMode = () => {
    setBulkScoreMode(true)
    setSelectedJobs([]) // Clear any existing selection
  }

  const handleStartBulkScoring = () => {
    setBulkScoreMode(false)
    handleBulkScoreJobs()
  }

  const handleCancelBulkScoring = () => {
    setBulkScoreMode(false)
    setSelectedJobs([])
    setStopScoring(false)
  }

  const handleSelectAllJobs = () => {
    setSelectedJobs(jobs.map(job => job.id))
  }

  const handleDeselectAllJobs = () => {
    setSelectedJobs([])
  }

  const handleStopScoring = () => {
    setStopScoring(true)
    setSuccess('Scoring stopped by user. Completed jobs have been saved.')
  }

  const handleScoreAllJobs = async () => {
    if (!autoApply || jobs.length === 0) return

    const activeResume = resumes.find(r => r.isActive)
    if (!activeResume) {
      setError('No active resume found. Please upload a resume in the Resume Builder tab first.')
      return
    }

    // Score all jobs that don't have a score yet
    const unscoredJobs = jobs.filter(job => !job.matchScore);
    if (unscoredJobs.length === 0) {
      setSuccess('All jobs are already scored!')
      return
    }

    try {
      setBulkScoring(true)
      setError(null)
      setStopScoring(false) // Reset stop flag
      setScoringProgress({ current: 0, total: unscoredJobs.length, startTime: Date.now() })
      
      let completedJobs = 0
      let successfulJobs = 0
      let timeoutErrors = 0
      let rateLimitErrors = 0
      let otherErrors = 0
      
      console.log('🔍 Starting score all jobs for', unscoredJobs.length, 'unscored jobs')
      
      for (const job of unscoredJobs) {
        // Check if user requested to stop scoring
        if (stopScoring) {
          console.log('🛑 Scoring stopped by user request')
          break
        }

        let retryCount = 0
        const maxRetries = 1
        
        while (retryCount <= maxRetries) {
          try {
            setScoringJobId(job.id)
            setScoringProgress({ current: completedJobs, total: unscoredJobs.length, startTime: Date.now() })
            console.log(`🔍 Scoring job ${completedJobs + 1}/${unscoredJobs.length}: ${job.title}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}`)
            
            const matchResult = await autoApply.scoreJob(job.id)
            successfulJobs++
            console.log(`✅ Successfully scored: ${job.title}`)
            break
            
          } catch (err: any) {
            console.error(`Failed to score job ${job.title}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}:`, err)
            
            if (err.message.includes('timed out') && retryCount < maxRetries) {
              retryCount++
              console.log(`⏳ Retrying job ${job.title} due to timeout...`)
              await new Promise(resolve => setTimeout(resolve, 5000))
              continue
            }
            
            if (err.message.includes('timed out')) {
              timeoutErrors++
            } else if (err.message.includes('Rate limit')) {
              rateLimitErrors++
            } else {
              otherErrors++
            }
            break
          }
        }
        
        completedJobs++
        setScoringProgress({ current: completedJobs, total: unscoredJobs.length, startTime: Date.now() })
        
        if (completedJobs < unscoredJobs.length && !stopScoring) {
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
      
      await loadJobs()
      
      let message = `Score all completed: ${successfulJobs}/${unscoredJobs.length} jobs scored successfully`
      if (timeoutErrors > 0 || rateLimitErrors > 0 || otherErrors > 0) {
        const errorDetails = []
        if (timeoutErrors > 0) errorDetails.push(`${timeoutErrors} timeout errors`)
        if (rateLimitErrors > 0) errorDetails.push(`${rateLimitErrors} rate limit errors`)
        if (otherErrors > 0) errorDetails.push(`${otherErrors} other errors`)
        message += `. Issues: ${errorDetails.join(', ')}`
      }
      
      setSuccess(message)
    } catch (err: any) {
      setError(`Score all failed: ${err.message}`)
      console.error('Error in score all:', err)
    } finally {
      setBulkScoring(false)
      setScoringJobId(null)
      setScoringProgress(null)
    }
  }

  const handleScoreJob = async (jobId: number) => {
    if (!autoApply) return

    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    // Get and validate active resume before scoring
    const activeResume = resumes.find(r => r.isActive)
    if (!activeResume) {
      setError('No active resume found. Please upload a resume in the Resume Builder tab first.')
      return
    }

    console.log('🎯 SCORING DEBUG - Active Resume Details:', {
      id: activeResume.id,
      name: activeResume.name,
      contentLength: activeResume.content?.length || 0,
      contentPreview: activeResume.content?.substring(0, 150) + '...',
      uploadDate: activeResume.uploadDate,
      isActive: activeResume.isActive
    })

    try {
      setScoringJobId(jobId)
      setError(null)
      
      console.log('🔍 Starting job scoring for:', job.title)
      console.log('🔍 Using resume:', activeResume.name, 'with', activeResume.content?.length, 'characters')
      const matchResult = await autoApply.scoreJob(jobId)
      
      await loadJobs()
      setSuccess(`Job "${job.title}" scored: ${matchResult.overallScore}% match (using resume: ${activeResume.name})`)
    } catch (err: any) {
      setError(`Failed to score job: ${err.message}`)
      console.error('Error scoring job:', err)
    } finally {
      setScoringJobId(null)
    }
  }

  const handleBulkScoreJobs = async () => {
    if (!autoApply || selectedJobs.length === 0) return

    const activeResume = resumes.find(r => r.isActive)
    if (!activeResume) {
      setError('No active resume found. Please upload a resume in the Resume Builder tab first.')
      return
    }

    console.log('🎯 BULK SCORING DEBUG - Active Resume Details:', {
      id: activeResume.id,
      name: activeResume.name,
      contentLength: activeResume.content?.length || 0,
      contentPreview: activeResume.content?.substring(0, 150) + '...',
      jobsToScore: selectedJobs.length,
      isActive: activeResume.isActive
    })

    try {
      setBulkScoring(true)
      setError(null)
      setStopScoring(false) // Reset stop flag
      setScoringProgress({ current: 0, total: selectedJobs.length, startTime: Date.now() })
      
      const totalJobs = selectedJobs.length
      let completedJobs = 0
      let successfulJobs = 0
      let timeoutErrors = 0
      let rateLimitErrors = 0
      let otherErrors = 0
      
      console.log('🔍 Starting bulk scoring for', totalJobs, 'jobs')
      
      for (const jobId of selectedJobs) {
        // Check if user requested to stop scoring
        if (stopScoring) {
          console.log('🛑 Bulk scoring stopped by user request')
          break
        }

        const job = jobs.find(j => j.id === jobId)
        if (!job) continue
        
        let retryCount = 0
        const maxRetries = 1 // Allow one retry for timeout errors
        
        while (retryCount <= maxRetries) {
          try {
            setScoringJobId(jobId)
            console.log(`🔍 Scoring job ${completedJobs + 1}/${totalJobs}: ${job.title}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}`)
            
            const matchResult = await autoApply.scoreJob(jobId)
            successfulJobs++
            console.log(`✅ Successfully scored: ${job.title}`)
            break // Success, exit retry loop
            
          } catch (err: any) {
            console.error(`Failed to score job ${job.title}${retryCount > 0 ? ` (Retry ${retryCount})` : ''}:`, err)
            
            // If it's a timeout error and we haven't exhausted retries, try again
            if (err.message.includes('timed out') && retryCount < maxRetries) {
              retryCount++
              console.log(`⏳ Retrying job ${job.title} due to timeout...`)
              await new Promise(resolve => setTimeout(resolve, 5000)) // Extra delay before retry
              continue
            }
            
            // Categorize the error for reporting
            if (err.message.includes('timed out')) {
              timeoutErrors++
            } else if (err.message.includes('Rate limit')) {
              rateLimitErrors++
            } else {
              otherErrors++
            }
            
            // For other errors or exhausted retries, move on
            break
          }
        }
        
        completedJobs++
        setScoringProgress({ current: completedJobs, total: totalJobs, startTime: Date.now() })
        
        // Add delay to avoid rate limiting (increased to 5 seconds for better stability)
        if (completedJobs < totalJobs && !stopScoring) {
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
      
      await loadJobs()
      
      // Create detailed success message
      let message = `Bulk scoring completed: ${successfulJobs}/${totalJobs} jobs scored successfully`
      if (timeoutErrors > 0 || rateLimitErrors > 0 || otherErrors > 0) {
        const errorDetails = []
        if (timeoutErrors > 0) errorDetails.push(`${timeoutErrors} timeout errors`)
        if (rateLimitErrors > 0) errorDetails.push(`${rateLimitErrors} rate limit errors`)
        if (otherErrors > 0) errorDetails.push(`${otherErrors} other errors`)
        message += `. Issues: ${errorDetails.join(', ')}`
      }
      
      setSuccess(message)
      setSelectedJobs([])
    } catch (err: any) {
      setError(`Bulk scoring failed: ${err.message}`)
      console.error('Error in bulk scoring:', err)
    } finally {
      setBulkScoring(false)
      setScoringJobId(null)
      setScoringProgress(null)
    }
  }

  const handleJobSort = (sortBy: 'date' | 'score' | 'title' | 'company') => {
    if (jobSortBy === sortBy) {
      setJobSortOrder(jobSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setJobSortBy(sortBy)
      setJobSortOrder('desc')
    }
  }

  // Filter and sort jobs
  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.company.toLowerCase().includes(jobSearch.toLowerCase()) ||
    job.location.toLowerCase().includes(jobSearch.toLowerCase())
  )

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (jobSortBy) {
      case 'date':
        aValue = new Date(a.captureDate).getTime()
        bValue = new Date(b.captureDate).getTime()
        break
      case 'score':
        aValue = a.matchScore
        bValue = b.matchScore
        break
      case 'title':
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case 'company':
        aValue = a.company.toLowerCase()
        bValue = b.company.toLowerCase()
        break
      default:
        return 0
    }
    
    if (jobSortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const clearMessages = () => {
    setError(null)
    setSuccess(null)
  }

  // Old 8-variable matching system handlers removed - now using extension's scoring logic

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleDownloadDocument = (job: Job, docIndex: number) => {
    if (!job.generatedDocs || !job.generatedDocs[docIndex]) return
    
    const doc = job.generatedDocs[docIndex]
    try {
      // Convert base64 to blob
      const byteChars = atob(doc.base64)
      const byteArray = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i)
      }
      
      const blob = new Blob([byteArray], { type: doc.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.type}_${job.title.replace(/[^a-zA-Z0-9]/g, '-')}_${job.company.replace(/[^a-zA-Z0-9]/g, '-')}.${doc.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading document:', error)
      setError('Failed to download document')
    }
  }

  const handleAIGenerateDocument = async () => {
    if (selectedJobs.length === 0) {
      setError('Please select at least one job to generate a document for.')
      return
    }
    
    // Use active resume by default, or fallback to selected resume
    let resume = resumes.find(r => r.isActive) || resumes.find(r => r.id === selectedAIDocumentResume)
    
    if (!resume) {
      setError('No resume found. Please upload a resume in the Resume Builder tab first.')
      return
    }

    // Get user name from resume name or use fallback
    const userName = resume.name.split(' - ')[0] || 'User';

    try {
      setIsLoading(true)
      setError(null)
      setGeneratedDocuments([]) // Clear previous documents
      setActiveDocumentIndex(0)
      setEnhancementSuggestions(null)
      
      const newGeneratedDocuments = [];
      
      // Generate documents for ALL selected jobs
      for (let i = 0; i < selectedJobs.length; i++) {
        const jobId = selectedJobs[i];
        const job = jobs.find(j => j.id === jobId);
        
        if (!job) {
          console.warn(`Job with ID ${jobId} not found, skipping...`);
          continue;
        }

        console.log(`🔍 Generating document ${i + 1}/${selectedJobs.length} for ${job.company} - ${job.title}`);
        
        const response = await fetch('/api/document-generate', {
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job,
            resume,
            amplificationMode: selectedAIMode,
            apiKey,
            enhancements: Array.from(selectedEnhancements).map(key => ({ 
              // TODO: Fix this to work with new job-specific enhancement structure
              // ...enhancementSuggestions?.find(enh => `${enh.category}:${enh.requirement}` === key),
              ...detailedEnhancements[key]
            })),
            format: selectedFormat
          })
        });

        const data = await response.json();
        
        if (data.error) {
          console.error(`Error generating document for ${job.company}:`, data.error);
          setError(`Failed to generate document for ${job.company}: ${data.error}`);
          continue;
        }

        // Generate proper file name
        const documentType = 'Resume'; // Could be 'CoverLetter' in future
        const fileName = generateFileName(userName, job.company, documentType, selectedFormat);
        
        // Create document object
        const generatedDoc = {
          id: `${jobId}_${Date.now()}`,
          jobId: jobId,
          jobTitle: job.title,
          companyName: job.company,
          content: data.content,
          format: data.format || selectedFormat,
          mimeType: data.mimeType || 'text/plain',
          extension: data.extension || selectedFormat,
          fileName: fileName,
          generatedAt: new Date().toISOString()
        };

        newGeneratedDocuments.push(generatedDoc);
        
        // Update progress for user feedback
        if (selectedJobs.length > 1) {
          setSuccess(`Generated ${i + 1}/${selectedJobs.length} documents...`);
        }
      }
      
      if (newGeneratedDocuments.length > 0) {
        setGeneratedDocuments(newGeneratedDocuments);
        setActiveDocumentIndex(0);
        
        // Set legacy state for backward compatibility
        setGeneratedDocument(newGeneratedDocuments[0].content);
        setGeneratedFormat(newGeneratedDocuments[0].format);
        setGeneratedMimeType(newGeneratedDocuments[0].mimeType);
        setGeneratedExtension(newGeneratedDocuments[0].extension);
        
        setSuccess(`Successfully generated ${newGeneratedDocuments.length} document${newGeneratedDocuments.length > 1 ? 's' : ''}!`);
      } else {
        setError('No documents were generated successfully.');
      }
      
    } catch (err: any) {
      setError(`Failed to generate smart document: ${err.message}`);
      console.error('Error generating smart document:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownloadGeneratedDocument = async () => {
    const activeDoc = generatedDocuments[activeDocumentIndex];
    if (!activeDoc) return;
    
    try {
      if (activeDoc.format === 'pdf') {
        // Dynamically import jsPDF
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()
        // Split text into lines to fit page width
        const lines = doc.splitTextToSize(activeDoc.content, 180)
        doc.text(lines, 10, 10)
        doc.save(activeDoc.fileName)
        setSuccess(`${activeDoc.fileName} downloaded successfully as PDF!`)
      } else if (activeDoc.format === 'docx') {
        // Dynamically import docx
        const docx = await import('docx')
        const { Document, Packer, Paragraph, TextRun } = docx
        const paragraphs = activeDoc.content.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }))
        const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] })
        const blob = await Packer.toBlob(doc)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = activeDoc.fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setSuccess(`${activeDoc.fileName} downloaded successfully as DOCX!`)
      } else {
        // Plain text
        const blob = new Blob([activeDoc.content], { type: activeDoc.mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = activeDoc.fileName
        document.body.appendChild(a)
        a.click()  
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setSuccess(`${activeDoc.fileName} downloaded successfully!`)
      }
    } catch (error) {
      console.error('Error downloading generated document:', error)
      setError('Failed to download generated document')
    }
  }

  const handleTemplateBasedDownload = async (templateId: string, format: 'pdf' | 'docx' | 'txt') => {
    // Use the actual generated document content for download
    const content = generatedDocuments[activeDocumentIndex]?.content || '';

      // Generate file name
    const userName = 'Resume';
      const templateNames = {
        'modern_professional': 'Modern_Professional',
        'creative': 'Creative_Professional', 
        'executive': 'Executive'
      };
      const templateName = templateNames[templateId as keyof typeof templateNames] || 'Template';
      const fileName = `${userName}_${templateName}_Resume.${format}`;
      
      if (format === 'pdf') {
      try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
        const previewElement = document.getElementById('resume-preview');
        if (!previewElement) throw new Error('Preview element not found');
        await doc.html(previewElement, {
          callback: (doc) => doc.save(fileName),
          x: 0,
          y: 0,
          width: 612,
          windowWidth: 800
        });
        setSuccess(`${fileName} downloaded successfully with ${templateName} template!`);
      } catch (pdfError) {
        console.warn('jsPDF.html() failed, using html2canvas fallback:', pdfError);
        try {
          const html2canvas = (await import('html2canvas')).default;
          const previewElement = document.getElementById('resume-preview');
          if (!previewElement) throw new Error('Preview element not found');
          const canvas = await html2canvas(previewElement, {
            scale: 2, 
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#fff',
          });
          const imgData = canvas.toDataURL('image/png');
          const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
          const pageWidth = 210;
          const imgProps = {
            width: pageWidth,
            height: (canvas.height * pageWidth) / canvas.width,
          };
          doc.addImage(imgData, 'PNG', 0, 0, imgProps.width, imgProps.height);
          doc.save(fileName);
          setSuccess(`${fileName} downloaded (canvas fallback) with ${templateName} template!`);
        } catch (canvasError) {
          console.error('❌ PDF generation failed (both methods):', canvasError);
          setError('PDF generation failed. Please try again.');
        }
      }
      return;
    }
    // ... existing code for docx and txt ...
  }

  const handleSaveEnhancement = (enhancement: any, familiarity: string, experience: string) => {
    const enhancementKey = `${enhancement.category}:${enhancement.requirement}`;
    
    // Add to selected enhancements
    setSelectedEnhancements(prev => {
      const newSet = new Set(prev);
      newSet.add(enhancementKey);
      return newSet;
    });
    
    // Save detailed enhancement info
    setDetailedEnhancements(prev => ({
      ...prev,
      [enhancementKey]: {
        familiarity,
        experience
      }
    }));
    
    setSuccess(`Enhancement saved: ${enhancement.requirement} (${familiarity} familiarity)`);
  };

  const handleSyncFromExtension = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loadJobs();
      setSuccess('Jobs synced from extension successfully!');
    } catch (err: any) {
      setError(`Failed to sync jobs: ${err.message}`);
      console.error('Error syncing jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loadJobs();
      setSuccess('Jobs refreshed successfully!');
    } catch (err: any) {
      setError(`Failed to refresh jobs: ${err.message}`);
      console.error('Error refreshing jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!apiKey.trim()) {
        setError('Please enter a valid API key');
        return;
      }
      
      // Save to localStorage
      localStorage.setItem('openai_api_key', apiKey);
      
      // Update AutoApply instance
      if (autoApply) {
        autoApply.setApiKey(apiKey);
      }
      
      setSuccess('API key saved successfully!');
    } catch (err: any) {
      setError(`Failed to save API key: ${err.message}`);
      console.error('Error saving API key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Save settings to localStorage
      localStorage.setItem('auto_score', autoScore.toString());
      localStorage.setItem('notifications', notifications.toString());
      
      setSuccess('Settings saved successfully!');
    } catch (err: any) {
      setError(`Failed to save settings: ${err.message}`);
      console.error('Error saving settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchEnhancements = async () => {
    if (selectedJobs.length === 0) {
      setError('Please select at least one job to get enhancement suggestions for.')
      return
    }
    
    // Use active resume by default, or fallback to selected resume
    let resume = resumes.find(r => r.isActive) || resumes.find(r => r.id === selectedAIDocumentResume)
    if (!resume) {
      setError('No resume found. Please upload a resume in the Resume Builder tab first.')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setEnhancementSuggestions(null)
      
      const jobEnhancements: { [jobId: number]: { jobTitle: string; companyName: string; enhancements: any[] } } = {};
      
      // Fetch enhancements for each selected job
      for (let i = 0; i < selectedJobs.length; i++) {
        const jobId = selectedJobs[i];
        const job = jobs.find(j => j.id === jobId);
        
        if (!job) {
          console.warn(`Job with ID ${jobId} not found, skipping...`);
          continue;
        }

        console.log(`🔍 Fetching enhancements ${i + 1}/${selectedJobs.length} for ${job.company} - ${job.title}`);
        
        const response = await fetch('/api/job-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job,
            resume,
            apiKey
          })
        });

        const data = await response.json();
        
        if (data.error) {
          console.error(`Error fetching enhancements for ${job.company}:`, data.error);
          continue;
        }

        // Filter for missing/partial requirements
        const enhancements = (data.matrix || []).filter((row: { matchLevel: string; }) => row.matchLevel === 'missing' || row.matchLevel === 'partial');
        
        if (enhancements.length > 0) {
          jobEnhancements[jobId] = {
            jobTitle: job.title,
            companyName: job.company,
            enhancements: enhancements
          };
        }
        
        // Update progress for user feedback
        if (selectedJobs.length > 1) {
          setSuccess(`Analyzed ${i + 1}/${selectedJobs.length} jobs for enhancements...`);
        }
      }
      
      if (Object.keys(jobEnhancements).length > 0) {
        setEnhancementSuggestions(jobEnhancements);
        setSuccess(`Enhancement suggestions fetched for ${Object.keys(jobEnhancements).length} job${Object.keys(jobEnhancements).length > 1 ? 's' : ''}!`);
      } else {
        setSuccess('No enhancement gaps found - your resume matches well with the selected jobs!');
        setEnhancementSuggestions({});
      }
      
    } catch (err: any) {
      setError(`Failed to fetch enhancement suggestions: ${err.message}`)
      console.error('Error fetching enhancement suggestions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!autoApply) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing AutoApply AI</h2>
            <p className="text-gray-600">Setting up your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="Apply Pilot Logo" width={72} height={72} priority />
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/'}
                className="text-gray-600 hover:text-blue-600"
              >
                ← Back to Home
              </Button>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Web App
              </Badge>
            </div>
          </div>
        </div>

        {/* Global Messages */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 mb-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
                <Button variant="ghost" size="sm" onClick={clearMessages} className="ml-auto">
                  ×
                </Button>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 p-4 mb-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-700">{success}</span>
                <Button variant="ghost" size="sm" onClick={clearMessages} className="ml-auto">
                  ×
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="resume-builder" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Resume Builder
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="ai-generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Smart Document Generation
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Compact Resume Selector - below tabs */}
          <ResumeSelector
            resumes={resumes}
            activeResumeId={activeResumeId}
            onResumeSelect={setActiveResumeId}
            onUploadNew={() => setActiveTab('resume-builder')}
            onCreateNew={() => setActiveTab('resume-builder')}
          />

          {/* Resume Builder Tab - now with both upload and manual form options */}
          <TabsContent value="resume-builder" className="space-y-6">
            <ResumeBuilderIntegration 
              onComplete={(data, templateId) => {
                console.log('Resume completed:', data, templateId);
                setSuccess('Professional resume generated successfully!');
                setActiveTab('jobs');
              }}
              onResumeUploaded={async (storedResume) => {
                console.log('🔄 Resume uploaded, refreshing resumes list...');
                await loadResumes();
                
                // Set the uploaded resume as active
                if (storedResume && storedResume.id) {
                  setActiveResumeId(storedResume.id);
                  console.log('✅ Set uploaded resume as active:', storedResume.name);
                }
                
                setSuccess(`Resume "${storedResume?.name || 'Untitled'}" uploaded and set as active!`);
              }}
            />
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Captured Jobs ({jobs.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncFromExtension}
                      className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Sync Extension
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshJobs}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardTitle>
                

                
                {/* Scoring Buttons */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {/* Score All Jobs Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScoreAllJobs}
                    disabled={bulkScoring || bulkScoreMode || jobs.filter(job => !job.matchScore).length === 0}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:text-green-800 transition-all duration-200 hover:scale-105 rounded-full px-4 py-2 text-xs font-semibold"
                  >
                    <Zap className="h-3 w-3 mr-2" />
                    Score All Jobs ({jobs.filter(job => !job.matchScore).length})
                  </Button>

                  {/* Bulk Score Selected Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkScoreMode ? handleStartBulkScoring : handleBulkScoreMode}
                    disabled={bulkScoring || (bulkScoreMode && selectedJobs.length === 0)}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 hover:scale-105 rounded-full px-4 py-2 text-xs font-semibold"
                  >
                    {bulkScoring ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Scoring...
                      </>
                    ) : bulkScoreMode ? (
                      selectedJobs.length > 0 ? 'Start Scoring' : 'Select Jobs to Score'
                    ) : (
                      'Bulk Score Selected'
                    )}
                  </Button>
                  {bulkScoreMode && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelBulkScoring}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Stop Scoring Button - only shows during scoring */}
                  {bulkScoring && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStopScoring}
                      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:text-red-800 transition-all duration-200 hover:scale-105 rounded-full px-4 py-2 text-xs font-semibold"
                    >
                      🛑 Stop Scoring
                    </Button>
                  )}
                </div>
                              </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bulk Score Mode Notice with Select All Options */}
                  {bulkScoreMode && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <p className="text-sm text-yellow-700">
                            <strong>Bulk Scoring Mode:</strong> Click on the job cards below to select them for bulk scoring. 
                            {selectedJobs.length > 0 ? (
                              <span className="font-semibold"> {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected - click "Start Scoring" to begin!</span>
                            ) : (
                              <span> Select the jobs you want to score and click "Start Scoring".</span>
                            )}
                          </p>
                        </div>
                        
                        {/* Select All / Deselect All Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAllJobs}
                            disabled={selectedJobs.length === jobs.length}
                            className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            Select All ({jobs.length})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeselectAllJobs}
                            disabled={selectedJobs.length === 0}
                            className="text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                                  {/* Scoring Statistics & Extension Notice */}
                {!bulkScoreMode && (
                  <div className="space-y-4">
                    {/* Scoring Statistics */}
                    {jobs.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BarChart3 className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-800">Scoring Progress</p>
                              <p className="text-xs text-green-600">
                                {jobs.filter(job => job.matchScore).length} of {jobs.length} jobs scored
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-700">
                              {Math.round((jobs.filter(job => job.matchScore).length / jobs.length) * 100)}%
                            </div>
                            <div className="text-xs text-green-600">Complete</div>
                          </div>
                        </div>
                        {jobs.filter(job => job.matchScore).length < jobs.length && (
                          <div className="mt-2 text-xs text-green-600">
                            💡 Use "Score All Jobs" to quickly score remaining {jobs.filter(job => !job.matchScore).length} jobs
                          </div>
                        )}
                      </div>
                    )}

                    {/* Extension Integration Notice */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-blue-700">
                          <strong>Chrome Extension Integration:</strong> Jobs captured with the floating button will automatically sync here. 
                          Click "Sync Extension" to manually refresh from the extension.
                        </p>
                      </div>
                    </div>
                  </div>
                )}



                {/* Search and Sort */}
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJobSort('date')}
                      className="flex items-center gap-2"
                    >
                      Date <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleJobSort('score')}
                      className="flex items-center gap-2"
                    >
                      Score <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                                                {/* Job Actions - Non-Bulk Mode */}
                {!bulkScoreMode && selectedJobs.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-green-900">Selected Jobs Actions</h3>
                        <p className="text-sm text-green-700 mt-1">
                          {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          {selectedJobs.length} selected
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearJobSelection}
                          className="text-green-600 hover:text-green-800"
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setActiveTab("ai-generate")}
                          disabled={selectedJobs.length === 0 || selectedJobs.length > 3}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Documents
                        </Button>
                      </div>
                      
                      <div className="text-sm text-green-600">
                        {selectedJobs.length > 3 && "Max 3 jobs for document generation"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Scoring Progress */}
                {bulkScoring && (scoringJobId || scoringProgress) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      {scoringProgress && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">
                              Scoring Progress: {scoringProgress.current}/{scoringProgress.total} jobs
                            </span>
                            <span className="text-xs text-blue-600">
                              {Math.round((scoringProgress.current / scoringProgress.total) * 100)}% complete
                            </span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(scoringProgress.current / scoringProgress.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Current Job */}
                      {scoringJobId && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Currently scoring: {jobs.find(j => j.id === scoringJobId)?.title}
                            </span>
                          </div>
                          <div className="text-xs text-blue-600">
                            5s delay between jobs
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Selection - Non-Bulk Mode */}
                {!bulkScoreMode && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Quick Selection</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllUnscoredJobs}
                          className="text-gray-600 border-gray-300 hover:bg-gray-100"
                          disabled={bulkScoring}
                        >
                          Select All Unscored
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllJobs}
                          className="text-gray-600 border-gray-300 hover:bg-gray-100"
                          disabled={bulkScoring}
                        >
                          Select All
                        </Button>
                        <span className="text-sm text-gray-600">
                          {sortedJobs.filter(job => !job.matchScore || job.matchScore === 0).length} unscored jobs
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Proceed to Generate Button */}
                {!bulkScoreMode && selectedJobs.length > 0 && (
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setActiveTab("ai-generate")}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      Proceed to Generate ({selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''})
                    </Button>
                  </div>
                )}

                {/* Jobs List */}
                {sortedJobs.length === 0 ? (
                  <Card className="bg-gray-50">
                    <CardContent className="p-8 text-center">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        {jobs.length === 0 ? 'No jobs captured yet.' : 'No jobs match your search.'}
                      </p>
                      <p className="text-sm text-gray-500">Use the Chrome extension to capture job postings from job sites.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {sortedJobs.map((job) => (
                      <Card key={job.id} className={`${selectedJobs.includes(job.id) ? 'ring-2 ring-blue-500' : ''} ${bulkScoreMode ? 'ring-1 ring-yellow-300 bg-yellow-50/30' : ''} transition-all duration-200 bg-white hover:shadow-lg hover:shadow-blue-100/50 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)]`} style={{ borderRadius: '12px' }}>
                        <CardContent className="p-0">
                          {/* Main Job Card */}
                          <div 
                            className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-300 hover:shadow-inner"
                            onClick={() => toggleJobExpansion(job.id)}
                            title="Click to see Match Analysis"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                  checked={selectedJobs.includes(job.id)}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    handleJobSelection(job.id)
                                  }}
                                  disabled={bulkScoring}
                                  title={bulkScoreMode ? "Select job for bulk scoring" : "Select job for actions"}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-bold text-lg text-[#101828]">{job.title}</h4>
                                    {/* Generated Documents */}
                                    {job.generatedDocs && job.generatedDocs.length > 0 && (
                                      <div className="flex items-center space-x-1">
                                        {job.generatedDocs.map((doc, index) => (
                                          <Button
                                            key={index}
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleDownloadDocument(job, index)
                                            }}
                                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold min-w-[28px] h-6 px-2 rounded-md transition-all"
                                            title={`Download ${doc.type.toUpperCase()} (${doc.format.toUpperCase()})`}
                                          >
                                            {doc.type === 'resume' ? 'CV' : doc.type === 'cover' ? 'CL' : doc.type.charAt(0).toUpperCase() + doc.type.charAt(1).toUpperCase()}
                                          </Button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm text-[#667085] mb-1">
                                    <CompanyLogo companyName={job.company} size="sm" />
                                    <span>{job.company} • {job.location}</span>
                                  </div>
                                  <p className="text-xs text-[#667085]">{job.source} • {formatDate(job.captureDate)}</p>
                                  
                                  {/* Job Description Preview */}
                                  {job.description && (
                                    <div className="mt-2">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleJobDescriptionExpansion(job.id)
                                          }}
                                          className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          <span>Job Description</span>
                                          {expandedJobDescriptions.has(job.id) ? (
                                            <ChevronUp className="h-3 w-3" />
                                          ) : (
                                            <ChevronDown className="h-3 w-3" />
                                          )}
                                        </button>
                                      </div>
                                      
                                      {expandedJobDescriptions.has(job.id) && (
                                        <div className="mt-2 bg-gray-50 rounded-lg p-3 border max-h-48 overflow-y-auto">
                                          <div className="text-sm text-gray-700">
                                            {job.description}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right flex items-center space-x-3">
                                  {/* Circular Score Badge */}
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                    job.matchScore && job.matchScore >= 76 ? 'bg-green-500' :
                                    job.matchScore && job.matchScore >= 51 ? 'bg-yellow-500' :
                                    job.matchScore ? 'bg-red-500' : 'bg-gray-400'
                                  }`}>
                                    {job.matchScore ? `${job.matchScore}%` : '?'}
                                  </div>
                                  
                                  {/* Pill-style Progress Bar */}
                                  <div className="flex flex-col items-end">
                                    <div className="text-xs font-medium text-gray-600 mb-1">
                                      {job.matchScore ? (
                                        job.matchScore >= 76 ? 'Excellent Match' :
                                        job.matchScore >= 51 ? 'Moderate Match' :
                                        'Needs Improvement'
                                      ) : 'Not Scored'}
                                    </div>
                                    <div className="w-20 bg-gray-200 rounded-full h-3 shadow-inner">
                                      <div 
                                        className="h-3 rounded-full transition-all duration-700 bg-gradient-to-r shadow-sm"
                                        style={{ 
                                          width: `${job.matchScore || 0}%`,
                                          backgroundImage: job.matchScore && job.matchScore >= 76 ? 'linear-gradient(90deg, #22c55e, #16a34a)' :
                                                         job.matchScore && job.matchScore >= 51 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' :
                                                         job.matchScore ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #9ca3af, #6b7280)'
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>

                                
                                {!bulkScoreMode && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleScoreJob(job.id)
                                    }}
                                    disabled={scoringJobId === job.id}
                                    title={scoringJobId === job.id ? "Scoring job..." : "Score job"}
                                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 hover:scale-105 rounded-full px-4 py-2 text-xs font-semibold"
                                  >
                                    {scoringJobId === job.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        Scoring...
                                      </>
                                    ) : (
                                      'Score'
                                    )}
                                  </Button>
                                )}
                                
                                {/* Old 8-variable analysis button removed - now using extension's scoring logic */}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 hover:scale-105"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteJob(job.id)
                                  }}
                                  title="Delete job"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {expandedJobs.has(job.id) && (
                            <div className="border-t bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm p-6 space-y-6" style={{ backdropFilter: 'blur(6px)' }}>
                              {/* Job Details */}
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <Briefcase className="h-4 w-4 mr-2" />
                                  Job Details
                                </h5>
                                <div className="bg-white p-3 rounded border space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium">Location:</span>
                                    <span>{job.location || 'Not specified'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Salary:</span>
                                    <span>{job.salary || 'Not specified'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">Source:</span>
                                    <span>{job.source}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">URL:</span>
                                    <a 
                                      href={job.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 truncate max-w-xs"
                                    >
                                      {job.url}
                                    </a>
                                  </div>
                                </div>
                              </div>

                              {/* Match Analysis */}
                              {job.matchAnalysis && (
                                <div>
                                  <h5 className="font-bold text-lg text-[#101828] mb-4 flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                                    Match Analysis
                                  </h5>
                                  <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20" style={{ backdropFilter: 'blur(6px)' }}>
                                    <div className="mb-6">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-base font-semibold text-gray-900">Overall Match Score</span>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                                          job.matchScore && job.matchScore >= 76 ? 'bg-green-500' :
                                          job.matchScore && job.matchScore >= 51 ? 'bg-yellow-500' :
                                          job.matchScore ? 'bg-red-500' : 'bg-gray-400'
                                        }`}>
                                          {job.matchScore || 0}%
                                        </div>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                                        <div 
                                          className="h-4 rounded-full transition-all duration-1000 bg-gradient-to-r shadow-sm animate-pulse"
                                          style={{ 
                                            width: `${job.matchScore || 0}%`,
                                            backgroundImage: job.matchScore && job.matchScore >= 76 ? 'linear-gradient(90deg, #22c55e, #16a34a)' :
                                                           job.matchScore && job.matchScore >= 51 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' :
                                                           job.matchScore ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #9ca3af, #6b7280)'
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    {/* Requirements vs Evidence Matrix - Extension Format */}
                                    {job.matchAnalysis.matrix && (
                                      <div className="mt-6">
                                        <h6 className="font-semibold text-base mb-4 flex items-center text-gray-900">
                                          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                                          Requirements vs Evidence
                                        </h6>
                                        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">Category</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">Job Requirement</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">Resume Evidence</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">Match</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-900">Action</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {job.matchAnalysis.matrix.map((row: { category: string; requirement: string; evidence: string; matchLevel: string; gapAction: string; }, index: number) => {
                                                const getMatchIcon = (matchLevel: string) => {
                                                  switch (matchLevel?.toLowerCase()) {
                                                    case 'strong': return '✅';
                                                    case 'meets': return '✅';
                                                    case 'exceeds': return '💎';
                                                    case 'partial': return '🔺';
                                                    case 'missing': return '❌';
                                                    default: return '⚪';
                                                  }
                                                };
                                                
                                                const getMatchClass = (matchLevel: string) => {
                                                  switch (matchLevel?.toLowerCase()) {
                                                    case 'strong': return 'bg-green-100 text-green-800 border-green-300';
                                                    case 'meets': return 'bg-green-100 text-green-800 border-green-300';
                                                    case 'exceeds': return 'bg-blue-100 text-blue-800 border-blue-300';
                                                    case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                                    case 'missing': return 'bg-red-100 text-red-800 border-red-300';
                                                    default: return 'bg-gray-100 text-gray-800 border-gray-300';
                                                  }
                                                };
                                                
                                                return (
                                                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                                    <td className="px-4 py-3 font-medium text-gray-900 border-b border-gray-100">{row.category || ''}</td>
                                                    <td className="px-4 py-3 text-gray-700 border-b border-gray-100">{row.requirement || ''}</td>
                                                    <td className="px-4 py-3 text-gray-700 border-b border-gray-100">{row.evidence || 'Not mentioned'}</td>
                                                    <td className="px-4 py-3 border-b border-gray-100">
                                                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getMatchClass(row.matchLevel)}`} style={{ lineHeight: '1.2' }}>
                                                        <span className="text-base mr-1.5">{getMatchIcon(row.matchLevel)}</span>
                                                        <span>{row.matchLevel || 'unknown'}</span>
                                                      </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-600 border-b border-gray-100" title={row.gapAction || ''}>
                                                      {row.gapAction || ''}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                        
                                        {/* Overall Match Conclusion */}
                                        <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border border-blue-200/50 shadow-sm">
                                          <div className="flex items-center space-x-2 mb-3">
                                            <Activity className="h-5 w-5 text-blue-600" />
                                            <h6 className="font-bold text-lg text-gray-900">Overall Assessment</h6>
                                          </div>
                                          <div className="text-base text-gray-800 leading-relaxed">
                                            {job.matchScore && job.matchScore >= 90 ? (
                                              <span className="text-green-700">
                                                <strong>🎯 Excellent Match</strong> - This position aligns very well with your background and experience. You meet most requirements and should be confident in applying.
                                              </span>
                                            ) : job.matchScore && job.matchScore >= 70 ? (
                                              <span className="text-blue-700">
                                                <strong>✅ Good Match</strong> - You have solid qualifications for this role. Consider highlighting your relevant experience and addressing any gaps through examples.
                                              </span>
                                            ) : job.matchScore && job.matchScore >= 50 ? (
                                              <span className="text-yellow-700">
                                                <strong>⚠️ Moderate Match</strong> - You meet some requirements but may need to emphasize transferable skills and relevant experience to strengthen your application.
                                              </span>
                                            ) : job.matchScore && job.matchScore >= 30 ? (
                                              <span className="text-orange-700">
                                                <strong>🔄 Challenging Match</strong> - This role has significant gaps from your current profile. Focus on transferable skills and consider if this aligns with your career goals.
                                              </span>
                                            ) : job.matchScore ? (
                                              <span className="text-red-700">
                                                <strong>❌ Poor Match</strong> - This position requires qualifications that don't align well with your current background. Consider roles that better match your experience.
                                              </span>
                                            ) : (
                                              <span className="text-gray-600">
                                                <strong>🔍 Not Analyzed</strong> - Click the score button to analyze how well this position matches your background.
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Old 8-Variable Matching Analysis UI removed - now using extension's scoring logic */}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Selection Counter */}
                {!bulkScoreMode && selectedJobs.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            {selectedJobs.length} / 3 jobs selected
                          </Badge>
                          {selectedJobs.length === 3 && (
                            <span className="text-sm text-blue-600">Maximum selection reached</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            onClick={() => setActiveTab("ai-generate")}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Proceed to Generate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Document Generation Tab */}
          <TabsContent value="ai-generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Smart Document Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Jobs</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobs.map(job => (
                      <Button
                        key={job.id}
                        variant={selectedJobs.includes(job.id) ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedJobs(selectedJobs.includes(job.id)
                            ? selectedJobs.filter(id => id !== job.id)
                            : [...selectedJobs, job.id])
                        }}
                        className={selectedJobs.includes(job.id) ? 'bg-blue-600 text-white' : ''}
                      >
                        {job.title} @ {job.company}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Resume Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Resume</h3>
                  <div className="flex flex-wrap gap-2">
                    {resumes.map(resume => (
                      <Button
                        key={resume.id}
                        variant={selectedAIDocumentResume === resume.id ? 'default' : 'outline'}
                        onClick={() => setSelectedAIDocumentResume(resume.id)}
                        className={selectedAIDocumentResume === resume.id ? 'bg-blue-600 text-white' : ''}
                      >
                        {resume.name}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Format Selection */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Format:</h3>
                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    {[
                      { label: 'Text', value: 'text' },
                      { label: 'PDF', value: 'pdf' },
                      { label: 'Word', value: 'docx' }
                    ].map(format => (
                      <Button
                        key={format.value}
                        variant={selectedFormat === format.value ? 'default' : 'outline'}
                        onClick={() => setSelectedFormat(format.value as 'pdf' | 'text' | 'docx')}
                        className={`w-full ${selectedFormat === format.value ? 'bg-blue-600 text-white' : ''}`}
                      >
                        {format.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Amplification Mode Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Amplification Mode</h3>
                  <p className="text-sm text-gray-600 mb-4">Choose how aggressively to enhance your resume for the job</p>
                  <div className="grid grid-cols-3 gap-3 max-w-md mb-4">
                    {[
                      { 
                        label: 'Precision', 
                        value: 'precision',
                        description: 'Conservative approach - only adds skills you clearly possess'
                      },
                      { 
                        label: 'Gap Filler', 
                        value: 'gap_filler',
                        description: 'Moderate approach - highlights relevant experience and adds reasonable skills'
                      },
                      { 
                        label: 'Beast Mode', 
                        value: 'beast_mode',
                        description: 'Aggressive approach - maximally optimizes resume for ATS and job requirements'
                      }
                    ].map(mode => (
                      <Button
                        key={mode.value}
                        variant={selectedAIMode === mode.value ? 'default' : 'outline'}
                        onClick={() => setSelectedAIMode(mode.value as any)}
                        className={`w-full ${selectedAIMode === mode.value ? 'bg-purple-600 text-white' : ''}`}
                      >
                        {mode.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Mode Descriptions */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md">
                    {selectedAIMode === 'precision' && (
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-green-700">Precision Mode</span>
                </div>
                        <p className="text-gray-700">Focuses on your existing skills and experience with minimal enhancement. Best for straightforward job matches.</p>
                      </div>
                    )}
                    {selectedAIMode === 'gap_filler' && (
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="font-medium text-yellow-700">Gap Filler Mode</span>
                        </div>
                        <p className="text-gray-700">Strategically highlights transferable skills and relevant experience to bridge qualification gaps.</p>
                      </div>
                    )}
                    {selectedAIMode === 'beast_mode' && (
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="font-medium text-red-700">Beast Mode</span>
                        </div>
                        <p className="text-gray-700">Maximum optimization for ATS systems and job requirements. Ideal for competitive positions.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Get Enhancement Suggestions Button */}
                <div>
                  <Button 
                    onClick={handleFetchEnhancements} 
                    disabled={isLoading || !selectedJobs.length} 
                    className="w-full max-w-md bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Get Enhancement Suggestions
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 max-w-md">
                    Analyze selected jobs to identify missing skills and experience gaps that can be added to your resume.
                  </p>
                </div>

                {/* Generate Button */}
                <div>
                  <Button 
                    onClick={handleAIGenerateDocument} 
                    disabled={isLoading || !selectedJobs.length || !selectedAIDocumentResume} 
                    className="w-full max-w-md bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
                    Generate Document
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 max-w-md">
                    Generate enhanced resume documents tailored to your selected jobs using the chosen amplification mode.
                  </p>
                </div>
                {/* Generated Documents Output */}
                {generatedDocuments.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Generated Documents ({generatedDocuments.length})
                      </h4>
                      
                      {/* Document Navigation */}
                      {generatedDocuments.length > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveDocumentIndex(Math.max(0, activeDocumentIndex - 1))}
                            disabled={activeDocumentIndex === 0}
                          >
                            ← Previous
                          </Button>
                          <span className="text-sm text-gray-600">
                            {activeDocumentIndex + 1} of {generatedDocuments.length}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveDocumentIndex(Math.min(generatedDocuments.length - 1, activeDocumentIndex + 1))}
                            disabled={activeDocumentIndex === generatedDocuments.length - 1}
                          >
                            Next →
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Active Document Display */}
                    {generatedDocuments[activeDocumentIndex] && (
                      <div className="space-y-4">
                        {/* Document Info Header */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-blue-900">
                                {generatedDocuments[activeDocumentIndex].jobTitle} @ {generatedDocuments[activeDocumentIndex].companyName}
                              </h5>
                              <p className="text-sm text-blue-700">
                                {generatedDocuments[activeDocumentIndex].fileName}
                              </p>
                            </div>
                            <div className="text-xs text-blue-600">
                              {new Date(generatedDocuments[activeDocumentIndex].generatedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* Document Content */}
                        <div className="bg-gray-100 p-4 rounded text-sm max-h-96 overflow-y-auto border">
                          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
                            {generatedDocuments[activeDocumentIndex].content}
                          </pre>
                        </div>
                        
                        {/* Template Selection */}
                        <DocumentTemplatePreview
                          documentContent={generatedDocuments[activeDocumentIndex].content}
                          documentTitle={generatedDocuments[activeDocumentIndex].fileName}
                          onDownload={(templateId: string, format: 'pdf' | 'docx' | 'txt') => {
                            if (templateId === 'original' && format === 'txt') {
                              // Handle original format download
                              handleDownloadGeneratedDocument();
                            } else if (format === 'pdf' || format === 'docx') {
                              // Handle template-based download
                              handleTemplateBasedDownload(templateId, format);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Enhancement Suggestions Results */}
                  {enhancementSuggestions && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Enhancement Suggestions ({selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} analyzed)
                    </h3>
                    <div className="space-y-6">
                      {Object.keys(enhancementSuggestions).length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-green-600 mb-2">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                          </div>
                          <h4 className="text-lg font-medium text-green-800 mb-1">Perfect Match!</h4>
                          <p className="text-sm text-green-700">
                            Your resume already covers all requirements for the selected job{selectedJobs.length > 1 ? 's' : ''}.
                          </p>
                        </div>
                      ) : (
                        Object.entries(enhancementSuggestions).map(([jobId, jobData]) => (
                          <div key={jobId} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Job Header */}
                            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-blue-900">
                                    {jobData.jobTitle} @ {jobData.companyName}
                                  </h4>
                                  <p className="text-sm text-blue-700">
                                    {jobData.enhancements.length} gap{jobData.enhancements.length !== 1 ? 's' : ''} identified
                                  </p>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800">
                                  Job ID: {jobId}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Enhancements for this job */}
                            <div className="p-4 space-y-3">
                              {jobData.enhancements.map((enh, idx) => {
                                const enhancementKey = `${jobId}:${enh.category}:${enh.requirement}`;
                                const isSelected = selectedEnhancements.has(enhancementKey);
                                const savedDetails = detailedEnhancements[enhancementKey];
                                
                                return (
                                  <div key={idx} className={`border rounded-lg p-4 transition-all duration-200 ${
                                    isSelected 
                                      ? 'bg-green-50 border-green-200 shadow-sm' 
                                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                  }`}>
                                    <EnhancementPopover enhancement={enh} onSave={(enhancement, familiarity, experience) => {
                                      const enhancementKey = `${jobId}:${enhancement.category}:${enhancement.requirement}`;
                                      
                                      // Add to selected enhancements
                                      setSelectedEnhancements(prev => {
                                        const newSet = new Set(prev);
                                        newSet.add(enhancementKey);
                                        return newSet;
                                      });
                                      
                                      // Save detailed enhancement info
                                      setDetailedEnhancements(prev => ({
                                        ...prev,
                                        [enhancementKey]: {
                                          familiarity,
                                          experience,
                                          jobId: parseInt(jobId),
                                          jobTitle: jobData.jobTitle,
                                          companyName: jobData.companyName
                                        }
                                      }));
                                    }}>
                                      <div className="cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                            isSelected ? 'bg-green-500' : 'bg-gray-300'
                                          }`}>
                                            {isSelected ? (
                                              <CheckCircle className="h-3 w-3 text-white" />
                                            ) : (
                                              <Plus className="h-3 w-3 text-white" />
                                            )}
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {enh.category}
                                          </Badge>
                                          <span className={`text-sm ${isSelected ? 'line-through text-gray-500' : 'text-blue-800 font-medium'}`}>
                                            {enh.requirement}
                                          </span>
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 italic ml-8 mb-2">
                                          {enh.gapAction}
                                        </p>
                                        
                                        {isSelected && savedDetails && (
                                          <div className="ml-8 mt-3 p-3 bg-white rounded border border-green-200">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-xs">
                                                {savedDetails.familiarity === 'beginner' && '🌱'}
                                                {savedDetails.familiarity === 'intermediate' && '🔧'}
                                                {savedDetails.familiarity === 'expert' && '🏆'}
                                              </span>
                                              <Badge className={`text-xs ${
                                                savedDetails.familiarity === 'beginner' ? 'text-orange-600 bg-orange-100' :
                                                savedDetails.familiarity === 'intermediate' ? 'text-blue-600 bg-blue-100' :
                                                'text-green-600 bg-green-100'
                                              }`}>
                                                {savedDetails.familiarity}
                                              </Badge>
                                            </div>
                                            <p className="text-xs text-gray-700 leading-relaxed">
                                              {savedDetails.experience}
                                            </p>
                                          </div>
                                        )}
                                        
                                        {!isSelected && (
                                          <div className="ml-8 mt-2">
                                            <p className="text-xs text-blue-600 font-medium">
                                              👆 Click to add this enhancement with your experience details
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </EnhancementPopover>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                      
                      {selectedEnhancements.size > 0 && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-900">
                              {selectedEnhancements.size} Enhancement{selectedEnhancements.size !== 1 ? 's' : ''} Selected
                            </span>
                          </div>
                          <p className="text-sm text-green-700 mb-3">
                            These enhancements will be included in your generated documents with your specific experience details.
                          </p>
                          <div className="text-sm text-blue-700 font-medium">
                            ⬇️ Now you can generate documents with these enhancements!
                          </div>
                        </div>
                      )}
                    </div>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Configuration */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OpenAI API Key
                      </label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Required for document generation. Your key is stored securely.
                      </p>
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      onClick={handleSaveApiKey}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save API Key'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Preferences */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Auto-score new jobs</h4>
                        <p className="text-sm text-gray-600">Automatically calculate match scores for captured jobs</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={autoScore}
                        onChange={(e) => setAutoScore(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300" 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Notifications</h4>
                        <p className="text-sm text-gray-600">Get notified about new jobs and generation status</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300" 
                      />
                    </div>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Settings'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Export the authenticated wrapper as default
export default AuthenticatedDashboard; 