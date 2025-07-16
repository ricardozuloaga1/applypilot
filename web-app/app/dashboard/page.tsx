"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Briefcase, 
  Sparkles, 
  Settings, 
  Upload, 
  Download,
  Star,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
  BarChart3
} from "lucide-react"
import { AutoApplyAI } from "@/lib/extension-mirror"
import type { Job, Resume, GenerationOptions } from "@/lib/extension-mirror"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("resumes")
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
  const [scoringJobId, setScoringJobId] = useState<number | null>(null)
  
  // Generation options
  const [selectedDocumentType, setSelectedDocumentType] = useState<'cover' | 'resume' | 'both'>('both')
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'text' | 'docx'>('pdf')
  const [selectedMode, setSelectedMode] = useState<'precision' | 'gap' | 'beast'>('precision')
  
  // Settings
  const [apiKey, setApiKey] = useState<string>('')
  const [autoScore, setAutoScore] = useState<boolean>(true)
  const [notifications, setNotifications] = useState<boolean>(true)
  const [enhancementAnalysis, setEnhancementAnalysis] = useState<any>(null)
  const [showEnhancements, setShowEnhancements] = useState<boolean>(false)
  const [selectedEnhancements, setSelectedEnhancements] = useState<Set<string>>(new Set())

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
    } catch (err) {
      console.error('Failed to load resumes:', err)
      setError('Failed to load resumes')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !autoApply) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await autoApply.handleResumeUpload(file)
      await loadResumes()
      setSuccess('Resume uploaded successfully!')
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError('Failed to upload resume')
      console.error('Error uploading resume:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    if (!autoApply) return

    try {
      setIsLoading(true)
      await autoApply.deleteResume(resumeId)
      await loadResumes()
      setSuccess('Resume deleted successfully!')
    } catch (err) {
      setError('Failed to delete resume')
      console.error('Error deleting resume:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetActiveResume = async (resumeId: string) => {
    if (!autoApply) return

    try {
      setIsLoading(true)
      await autoApply.setActiveResume(resumeId)
      await loadResumes()
      setSuccess('Active resume updated!')
    } catch (err) {
      setError('Failed to set active resume')
      console.error('Error setting active resume:', err)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleScoreJob = async (jobId: number) => {
    if (!autoApply) return

    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    try {
      setScoringJobId(jobId)
      setError(null)
      
      console.log('🔍 Starting job scoring for:', job.title)
      const matchResult = await autoApply.scoreJob(jobId)
      
      await loadJobs()
      setSuccess(`Job "${job.title}" scored: ${matchResult.overallScore}% match`)
    } catch (err: any) {
      setError(`Failed to score job: ${err.message}`)
      console.error('Error scoring job:', err)
    } finally {
      setScoringJobId(null)
    }
  }

  const handleGenerateDocuments = async () => {
    if (!autoApply || selectedJobs.length === 0) {
      setError('Please select at least one job to generate documents for')
      return
    }

    const activeResume = resumes.find(r => r.isActive)
    if (!activeResume) {
      setError('Please select an active resume first')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Sync selected enhancements with AutoApply instance
      autoApply.setSelectedEnhancements(selectedEnhancements)

      const options: GenerationOptions = {
        documentType: selectedDocumentType,
        format: selectedFormat,
        mode: selectedMode,
        jobIds: selectedJobs
      }

      await autoApply.generateDocuments(options)
      
      // Reload jobs to reflect newly generated documents
      await loadJobs()
      
      setSuccess(`Documents generated successfully! Check your downloads folder.`)
      setSelectedJobs([])
      setActiveTab('jobs')
    } catch (err) {
      setError('Failed to generate documents')
      console.error('Error generating documents:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid API key')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      if (autoApply) {
        autoApply.setApiKey(apiKey)
      }
      
      localStorage.setItem('openai_api_key', apiKey)
      setSuccess('API key saved successfully!')
    } catch (err) {
      setError('Failed to save API key')
      console.error('Error saving API key:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Save settings to localStorage
      localStorage.setItem('auto_score', autoScore.toString())
      localStorage.setItem('notifications', notifications.toString())
      
      setSuccess('Settings saved successfully!')
    } catch (err) {
      setError('Failed to save settings')
      console.error('Error saving settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshJobs = async () => {
    await loadJobs()
  }

  const handleSyncFromExtension = async () => {
    if (!autoApply) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Debug: Check if Chrome extension is available
      console.log('🔍 ExtensionBridge available:', !!(window as any).ExtensionBridge)
      console.log('🔍 Chrome API available:', !!(window as any).chrome?.runtime)
      
      // Test ExtensionBridge first
      if (typeof window !== 'undefined' && (window as any).ExtensionBridge) {
        console.log('🔍 Testing ExtensionBridge communication...')
        try {
          const isAvailable = (window as any).ExtensionBridge.isExtensionAvailable()
          console.log('🔍 Extension available via bridge:', isAvailable)
          
          if (isAvailable) {
            const extensionId = (window as any).ExtensionBridge.getExtensionId()
            console.log('🔍 Extension ID:', extensionId)
            
            const bridgeResponse = await (window as any).ExtensionBridge.syncData()
            console.log('🔍 ExtensionBridge response:', bridgeResponse)
          }
        } catch (bridgeError) {
          console.error('🔍 ExtensionBridge test failed:', bridgeError)
        }
      }
      
      if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
        console.log('🔍 Chrome extension API available')
        
        // Test direct message to extension
        try {
          console.log('🔍 Testing extension communication...')
          console.log('🔍 Chrome object:', (window as any).chrome)
          console.log('🔍 Runtime object:', (window as any).chrome?.runtime)
          console.log('🔍 Extension ID:', (window as any).chrome?.runtime?.id)
          
          const testResponse = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Extension communication timeout'))
            }, 5000)
            
            (window as any).chrome.runtime.sendMessage({ action: 'syncData' }, (response: any) => {
              clearTimeout(timeout)
              if ((window as any).chrome.runtime.lastError) {
                console.error('Chrome runtime error:', (window as any).chrome.runtime.lastError)
                reject((window as any).chrome.runtime.lastError)
              } else {
                console.log('🔍 Direct extension response:', response)
                resolve(response)
              }
            })
          })
          
          if (testResponse && testResponse.success) {
            console.log('🔍 Extension data received:', {
              jobs: testResponse.jobs?.length || 0,
              resumes: testResponse.resumes?.length || 0
            })
          } else {
            console.log('🔍 Extension response failed:', testResponse)
          }
        } catch (testError) {
          console.error('🔍 Direct extension test failed:', testError)
        }
      } else {
        console.log('🔍 Chrome extension API not available')
      }
      
      const stats = await autoApply.syncFromExtension()
      await loadJobs()
      await loadResumes()
      
      setSuccess(`Synced ${stats.jobs} jobs and ${stats.resumes} resumes from Chrome extension!`)
    } catch (err: any) {
      setError(err.message || 'Failed to sync from Chrome extension')
      console.error('Extension sync error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSmartEnhancement = async () => {
    if (!autoApply) return

    if (selectedJobs.length === 0) {
      setError('Please select at least one job to analyze')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Get the actual job objects from selected IDs
      const selectedJobObjects = jobs.filter(job => selectedJobs.includes(job.id))
      
      // Call analyzeResumeGaps with the selected jobs
      const analysis = await autoApply.analyzeResumeGapsWithJobs(selectedJobObjects)
      setEnhancementAnalysis(analysis)
      setShowEnhancements(true)
      setSuccess('Resume enhancement analysis completed!')
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume gaps')
      console.error('Enhancement analysis error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEnhancementSelection = (category: string, title: string) => {
    const enhancementKey = `${category}:${title}`
    const newSelected = new Set(selectedEnhancements)
    
    if (newSelected.has(enhancementKey)) {
      newSelected.delete(enhancementKey)
    } else {
      newSelected.add(enhancementKey)
    }
    
    setSelectedEnhancements(newSelected)
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

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-300'
    if (score >= 70) return 'bg-blue-100 text-blue-800 border-blue-300'
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    if (score >= 30) return 'bg-orange-100 text-orange-800 border-orange-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const getMatchScoreStyle = (score: number | null | undefined) => {
    // Handle unscored jobs
    if (score === null || score === undefined) {
      return {
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        borderColor: 'rgba(107, 114, 128, 0.6)',
        color: '#6b7280'
      }
    }
    
    if (score >= 90) return {
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: 'rgba(34, 197, 94, 0.6)',
      color: '#059669'
    }
    if (score >= 70) return {
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 0.6)',
      color: '#0284c7'
    }
    if (score >= 50) return {
      backgroundColor: 'rgba(251, 191, 36, 0.2)',
      borderColor: 'rgba(251, 191, 36, 0.6)',
      color: '#d97706'
    }
    if (score >= 30) return {
      backgroundColor: 'rgba(249, 115, 22, 0.2)',
      borderColor: 'rgba(249, 115, 22, 0.6)',
      color: '#ea580c'
    }
    return {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      borderColor: 'rgba(239, 68, 68, 0.6)',
      color: '#dc2626'
    }
  }

  const getMatchIcon = (score: number | null | undefined) => {
    // Handle unscored jobs
    if (score === null || score === undefined) {
      return '❓'
    }
    
    if (score >= 90) return '🟢'
    if (score >= 70) return '🔵'
    if (score >= 50) return '🟡'
    if (score >= 30) return '🟠'
    return '🔴'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">AutoApply AI</h1>
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
            <TabsTrigger value="resumes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Resume Upload
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs ({jobs.length})
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Resume Upload Tab */}
          <TabsContent value="resumes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Resume Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Resume</h3>
                  <p className="text-gray-600 mb-4">Drag and drop your resume or click to browse</p>
                  <p className="text-sm text-gray-500 mb-4">Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>

                {/* Resume List */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Stored Resumes</h3>
                  {resumes.length === 0 ? (
                    <Card className="bg-gray-50">
                      <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No resumes uploaded yet. Upload your first resume to get started.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {resumes.map((resume) => (
                        <Card key={resume.id} className={`${resume.isActive ? 'ring-2 ring-blue-500' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{resume.name}</h4>
                                  <p className="text-sm text-gray-500">{resume.type} • {formatFileSize(resume.size)} • {formatDate(resume.uploadDate)}</p>
                                </div>
                                {resume.isActive && (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {!resume.isActive && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleSetActiveResume(resume.id)}
                                    title="Set as active resume"
                                  >
                                    <Star className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600"
                                  onClick={() => handleDeleteResume(resume.id)}
                                  title="Delete resume"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
              </CardHeader>
              <CardContent className="space-y-6">
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

                {/* Top Proceed to Generate Button */}
                {selectedJobs.length > 0 && (
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => setActiveTab("generate")}
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
                  <div className="space-y-3">
                    {sortedJobs.map((job) => (
                      <Card key={job.id} className={`${selectedJobs.includes(job.id) ? 'ring-2 ring-blue-500' : ''} transition-all duration-200`}>
                        <CardContent className="p-0">
                          {/* Main Job Card */}
                          <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleJobExpansion(job.id)}
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
                                  disabled={!selectedJobs.includes(job.id) && selectedJobs.length >= 3}
                                />
                                <div>
                                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                                  <p className="text-sm text-gray-500">{job.company} • {job.location}</p>
                                  <p className="text-xs text-gray-400">{job.source} • {formatDate(job.captureDate)}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <div 
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                                    style={getMatchScoreStyle(job.matchScore)}
                                  >
                                    <span className="mr-1">{getMatchIcon(job.matchScore)}</span>
                                    {job.matchScore ? `${job.matchScore}% Match` : 'Not Scored'}
                                  </div>
                                </div>
                                
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
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleScoreJob(job.id)
                                  }}
                                  disabled={scoringJobId === job.id}
                                  title={scoringJobId === job.id ? "Scoring with AI..." : "Score job with AI"}
                                >
                                  {scoringJobId === job.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <div className="text-sm">📊</div>
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600"
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
                            <div className="border-t bg-gray-50 p-4 space-y-4">
                              {/* Job Description */}
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Job Description
                                </h5>
                                <div className="bg-white p-3 rounded border max-h-48 overflow-y-auto text-sm text-gray-700">
                                  {job.description || 'No description available'}
                                </div>
                              </div>

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
                                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Match Analysis
                                  </h5>
                                  <div className="bg-white p-3 rounded border">
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Overall Match Score</span>
                                        <div 
                                          className="px-2 py-1 rounded text-xs font-medium border"
                                          style={getMatchScoreStyle(job.matchScore || 0)}
                                        >
                                          {getMatchIcon(job.matchScore || 0)} {job.matchScore || 0}%
                                        </div>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${job.matchScore || 0}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    {/* Requirements vs Evidence Matrix */}
                                    {job.matchAnalysis.requirements && (
                                      <div className="mt-4">
                                        <h6 className="font-medium text-sm mb-2">Requirements vs Evidence</h6>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-xs border-collapse">
                                            <thead>
                                              <tr className="bg-gray-100">
                                                <th className="border border-gray-300 px-2 py-1 text-left">Requirement</th>
                                                <th className="border border-gray-300 px-2 py-1 text-left">Evidence</th>
                                                <th className="border border-gray-300 px-2 py-1 text-left">Match</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {job.matchAnalysis.requirements.map((req: any, index: number) => (
                                                <tr key={index}>
                                                  <td className="border border-gray-300 px-2 py-1">{req.requirement}</td>
                                                  <td className="border border-gray-300 px-2 py-1">{req.evidence}</td>
                                                  <td className="border border-gray-300 px-2 py-1">
                                                    <span className={`px-1 py-0.5 rounded text-xs ${
                                                      req.matchLevel === 'Strong' ? 'bg-green-100 text-green-800' :
                                                      req.matchLevel === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                                      'bg-red-100 text-red-800'
                                                    }`}>
                                                      {req.matchLevel}
                                                    </span>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Selection Counter */}
                {selectedJobs.length > 0 && (
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
                            onClick={() => setActiveTab("generate")}
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

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Document Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Document Type Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Document Type</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Cover Letter", value: "cover" as const },
                      { label: "Tailored Resume", value: "resume" as const },
                      { label: "Both Documents", value: "both" as const }
                    ].map((type) => (
                      <Card 
                        key={type.value} 
                        className={`cursor-pointer hover:bg-gray-50 border-2 transition-colors ${
                          selectedDocumentType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedDocumentType(type.value)}
                      >
                        <CardContent className="p-4 text-center">
                          <h4 className="font-medium text-gray-900">{type.label}</h4>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>



                {/* Format Selection */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Format</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "PDF", value: "pdf" as const },
                      { label: "Text", value: "text" as const },
                      { label: "DOCX", value: "docx" as const }
                    ].map((format) => (
                      <Card 
                        key={format.value} 
                        className={`cursor-pointer hover:bg-gray-50 border-2 transition-colors ${
                          selectedFormat === format.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedFormat(format.value)}
                      >
                        <CardContent className="p-4 text-center">
                          <h4 className="font-medium text-gray-900">{format.label}</h4>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* AI Enhancement Modes */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Enhancement Mode</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: "Precision Mode", value: "precision" as const, icon: "🎯", description: "Conservative, factual accuracy" },
                      { name: "Gap Filler Mode", value: "gap" as const, icon: "🔗", description: "Addresses missing qualifications" },
                      { name: "Beast Mode", value: "beast" as const, icon: "⚡", description: "Aggressive enhancement" }
                    ].map((mode) => (
                      <Card 
                        key={mode.value} 
                        className={`cursor-pointer hover:bg-gray-50 border-2 transition-colors ${
                          selectedMode === mode.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedMode(mode.value)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-2">{mode.icon}</div>
                          <h4 className="font-medium text-gray-900 mb-1">{mode.name}</h4>
                          <p className="text-sm text-gray-600">{mode.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Smart Enhancement Section - Only shown for resume/both document types */}
                {(selectedDocumentType === 'resume' || selectedDocumentType === 'both') && selectedJobs.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Smart Enhancement</h3>
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-purple-700">
                                AI will analyze your resume against selected job requirements and suggest targeted enhancements to make your application more competitive.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-purple-600">
                              {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected for analysis
                            </div>
                            <Button 
                              variant="outline"
                              className="text-purple-600 border-purple-300 hover:bg-purple-100"
                              onClick={handleSmartEnhancement}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Search className="mr-2 h-4 w-4" />
                                  Analyze & Suggest Enhancements
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* Enhancement Suggestions - Hashtag Style */}
                          {showEnhancements && enhancementAnalysis && (
                            <div className="space-y-4 mt-4 pt-4 border-t border-purple-200">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-purple-800">Recommended Enhancements:</h4>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                                    {selectedEnhancements.size} selected
                                  </Badge>
                                  {selectedEnhancements.size > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedEnhancements(new Set())}
                                      className="text-gray-600 hover:text-gray-800"
                                    >
                                      Clear All
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {Object.entries(enhancementAnalysis).map(([category, suggestions]: [string, any]) => (
                                <div key={category} className="space-y-2">
                                  <h5 className="text-sm font-medium text-purple-700">{category}</h5>
                                  <div className="space-y-2">
                                    {suggestions.map((suggestion: any, index: number) => {
                                      const enhancementKey = `${category}:${suggestion.title}`
                                      const isSelected = selectedEnhancements.has(enhancementKey)
                                      
                                      return (
                                        <div
                                          key={index}
                                          onClick={() => toggleEnhancementSelection(category, suggestion.title)}
                                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                            isSelected
                                              ? 'bg-purple-600 text-white border-purple-600'
                                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                          } border ${
                                            suggestion.priority === 'high' ? 'border-l-4 border-l-red-500' :
                                            suggestion.priority === 'medium' ? 'border-l-4 border-l-yellow-500' :
                                            'border-l-4 border-l-blue-500'
                                          }`}
                                          title={suggestion.description}
                                        >
                                          <span className="flex-1">#{suggestion.title}</span>
                                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                            suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-blue-100 text-blue-700'
                                          } ${isSelected ? 'bg-purple-700 text-purple-100' : ''}`}>
                                            {suggestion.priority}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Current Selections Summary */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Current Selection</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Jobs:</strong> {selectedJobs.length} selected</p>
                      <p><strong>Document Type:</strong> {selectedDocumentType === 'both' ? 'Both Documents' : selectedDocumentType === 'cover' ? 'Cover Letter' : 'Tailored Resume'}</p>
                      <p><strong>Format:</strong> {selectedFormat === 'docx' ? 'DOCX' : selectedFormat.toUpperCase()}</p>
                      <p><strong>Mode:</strong> {selectedMode === 'precision' ? 'Precision Mode' : selectedMode === 'gap' ? 'Gap Filler Mode' : 'Beast Mode'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6 text-center">
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      onClick={handleGenerateDocuments}
                      disabled={isLoading || selectedJobs.length === 0}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-5 w-5" />
                          Generate Documents
                        </>
                      )}
                    </Button>
                    {selectedJobs.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Select jobs from the Jobs tab to generate documents
                      </p>
                    )}
                  </CardContent>
                </Card>
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