'use client';

import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import ResumeUpload from '@/components/ResumeUpload';
import ResumeDisplay from '@/components/ResumeDisplay';
import JobSuggestions from '@/components/JobSuggestions';
import JobResults from '@/components/JobResults';
import DocumentGenerator from '@/components/DocumentGenerator';
import { ParsedResume, JobListing } from '@/types';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<'landing' | 'upload' | 'display' | 'suggestions' | 'results' | 'documents'>('landing');
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('both');
  const [selectedJobForDocs, setSelectedJobForDocs] = useState<JobListing | null>(null);

  const handleGetStarted = () => {
    setCurrentStep('upload');
  };

  const handleResumeProcessed = (data: ParsedResume) => {
    setResumeData(data);
    setCurrentStep('display');
  };

  const handleEditResume = () => {
    setCurrentStep('upload');
  };

  const handleProceedToJobSuggestions = () => {
    setCurrentStep('suggestions');
  };

  const handleJobsSelected = (jobs: string[], platform: string) => {
    setSelectedJobs(jobs);
    setSelectedPlatform(platform);
    setCurrentStep('results');
  };

  const handleBackToResume = () => {
    setCurrentStep('display');
  };

  const handleBackToSuggestions = () => {
    setCurrentStep('suggestions');
  };

  const handleJobSelected = (job: JobListing) => {
    setSelectedJobForDocs(job);
    setCurrentStep('documents');
  };

  const handleBackToResults = () => {
    setCurrentStep('results');
  };

  if (currentStep === 'upload') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        <ResumeUpload onResumeProcessed={handleResumeProcessed} />
      </main>
    );
  }

  if (currentStep === 'display' && resumeData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        <ResumeDisplay 
          resumeData={resumeData}
          onEdit={handleEditResume}
          onProceed={handleProceedToJobSuggestions}
        />
      </main>
    );
  }

  if (currentStep === 'suggestions' && resumeData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        <JobSuggestions 
          resumeData={resumeData}
          onJobsSelected={handleJobsSelected}
          onBack={handleBackToResume}
        />
      </main>
    );
  }

  if (currentStep === 'results' && selectedJobs.length > 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        <JobResults 
          selectedJobs={selectedJobs}
          selectedPlatform={selectedPlatform}
          onBack={handleBackToSuggestions}
          onJobSelected={handleJobSelected}
        />
      </main>
    );
  }

  if (currentStep === 'documents' && selectedJobForDocs && resumeData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-right" />
        <DocumentGenerator 
          resumeData={resumeData}
          jobListing={selectedJobForDocs}
          onBack={handleBackToResults}
        />
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🤖 AutoApply AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automate your job search with AI-powered resume tailoring, 
            document generation, and application tracking.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              🚀 Getting Started
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-3">📄</div>
                <h3 className="font-semibold text-gray-800 mb-2">Upload Resume</h3>
                <p className="text-gray-600 text-sm">
                  Upload your resume to get started with AI-powered job matching
                </p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="font-semibold text-gray-800 mb-2">Find Jobs</h3>
                <p className="text-gray-600 text-sm">
                  Let AI suggest job titles and scrape relevant opportunities
                </p>
              </div>
              
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-3">📋</div>
                <h3 className="font-semibold text-gray-800 mb-2">Apply Smart</h3>
                <p className="text-gray-600 text-sm">
                  Generate tailored resumes and cover letters automatically
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button 
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p>🎯 Phase 1 Complete: Next.js + Tailwind CSS Setup</p>
          <p className="text-sm mt-2">Ready to build Phase 2: Resume Upload & Parsing</p>
        </div>
      </div>
    </main>
  );
}
