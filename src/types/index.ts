// Core types for AutoApply AI

export interface ParsedResume {
  name: string;
  title: string;
  email: string;
  phone?: string;
  experience: string[];
  skills: string[];
  education: string[];
  summary: string;
}

export interface JobSuggestion {
  title: string;
  confidence: number;
  reasoning: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  dateScraped: string;
  source: string; // 'indeed', 'linkedin', 'mock', etc.
  // Additional optional fields from LinkedIn scraping
  salaryRange?: string;
  jobType?: string; // Full-time, Part-time, Contract, etc.
  experienceLevel?: string; // Entry level, Mid-Senior level, etc.
  postedDate?: string; // "2 days ago", etc.
  applicantCount?: string; // "Be among the first 25 applicants", "200+ applicants", etc.
}

export interface GeneratedDocument {
  type: 'resume' | 'cover_letter';
  content: string;
  htmlContent: string;
  pdfUrl?: string;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  jobUrl: string;
  dateScraped: string;
  dateApplied?: string;
  resumeLink?: string;
  coverLetterLink?: string;
  status: 'Not Started' | 'In Progress' | 'Applied' | 'Interview' | 'Rejected' | 'Accepted';
  notes?: string;
  driveFolderId?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'resume_upload' | 'job_scrape' | 'document_generation' | 'application_track';
  message: string;
  details?: any;
} 