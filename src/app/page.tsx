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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <Toaster position="top-right" />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent"></div>
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-purple-400/40 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-cyan-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300/20 rounded-full animate-ping"></div>
      </div>

      <div className="relative z-10 container mx-auto px-8 py-16 max-w-7xl">
        <div className="text-center mb-4">
          <p className="text-gray-300 text-lg font-medium">Welcome to AutoApply AI</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-20">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Automate Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Job Search
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Tailor resumes, scrape listings, and
              <br />
              track your applications with AI.
            </p>
            <button 
              onClick={handleGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25 text-lg"
            >
              Get Started
            </button>
          </div>

          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 w-80 h-80 rounded-full border border-blue-500/20 animate-spin-slow"></div>
              <div className="absolute inset-4 w-72 h-72 rounded-full border border-purple-500/15 animate-spin-reverse-slow"></div>
              <div className="absolute inset-8 w-64 h-64 rounded-full border border-cyan-500/10 animate-spin-slow"></div>
              
              <div className="relative z-10 w-32 h-32 mx-auto mt-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl shadow-2xl shadow-blue-500/50 flex items-center justify-center animate-float">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
                  <div className="text-4xl">😊</div>
                </div>
              </div>
              
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Getting Started</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center hover:bg-gray-800/70 transition-all duration-300 group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Upload Resume</h3>
              <p className="text-gray-300 leading-relaxed">
                AI scans your resume to kickstart intelligent job matching
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center hover:bg-gray-800/70 transition-all duration-300 group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Find Jobs</h3>
              <p className="text-gray-300 leading-relaxed">
                Scrape listings & get smart AI job title suggestions
              </p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center hover:bg-gray-800/70 transition-all duration-300 group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Apply Smart</h3>
              <p className="text-gray-300 leading-relaxed">
                Auto-generate tailored resumes & cover letters
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-full px-8 py-4">
            <span className="text-2xl">🚀</span>
            <span className="text-white font-semibold text-lg">Phase 1 Complete: UI + Tailwind Setup</span>
          </div>
          <p className="text-gray-400 mt-4 text-lg">Ready to build Phase 2: Resume Upload & Parsing</p>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 border-t border-gray-800/50">
        <p className="text-gray-400">© 2025 AutoApply AI. All rights reserved.</p>
      </footer>
    </main>
  );
}
