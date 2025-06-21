'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { JobSuggestion, ParsedResume } from '@/types';

interface JobSuggestionsProps {
  resumeData: ParsedResume;
  onJobsSelected: (selectedJobs: string[], platform: string) => void;
  onBack: () => void;
}

export default function JobSuggestions({ resumeData, onJobsSelected, onBack }: JobSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('both');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateSuggestions();
  }, []);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/job-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate job suggestions');
      }

      setSuggestions(data.suggestions);
      toast.success('Job suggestions generated!');
    } catch (error) {
      console.error('Error generating suggestions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobToggle = (jobTitle: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobTitle)
        ? prev.filter(job => job !== jobTitle)
        : [...prev, jobTitle]
    );
  };

  const handleProceed = () => {
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job title');
      return;
    }
    onJobsSelected(selectedJobs, selectedPlatform);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            🎯 AI Job Title Suggestions
          </h2>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Resume
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Based on your resume, here are job titles that match your background. 
            Select the ones you'd like to search for:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose job sources to search:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="platform"
                  value="all"
                  checked={selectedPlatform === 'all' || selectedPlatform === 'both'}
                  onChange={(e) => setSelectedPlatform('all')}
                  className="mr-2"
                />
                <span className="text-sm">🚀 All Sources (Recommended)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="platform"
                  value="apis-only"
                  checked={selectedPlatform === 'apis-only'}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">🌐 APIs Only (Fast)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="platform"
                  value="scraping-only"
                  checked={selectedPlatform === 'scraping-only'}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">🤖 Scraping Only</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="platform"
                  value="adzuna-only"
                  checked={selectedPlatform === 'adzuna-only'}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">🎯 Adzuna Only</span>
              </label>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <strong>Current sources:</strong> Adzuna API (20k/month), RemoteOK API, Puppeteer (SimplyHired + ZipRecruiter)
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Generating AI suggestions...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={generateSuggestions}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && suggestions.length > 0 && (
          <>
            <div className="space-y-4 mb-8">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`
                    border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedJobs.includes(suggestion.title)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                  onClick={() => handleJobToggle(suggestion.title)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 mr-3">
                          {suggestion.title}
                        </h3>
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${getConfidenceBadgeColor(suggestion.confidence)}
                        `}>
                          {suggestion.confidence}% match
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {suggestion.reasoning}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${selectedJobs.includes(suggestion.title)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                        }
                      `}>
                        {selectedJobs.includes(suggestion.title) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedJobs.length} of {suggestions.length} job titles selected
              </div>
              <button
                onClick={handleProceed}
                disabled={selectedJobs.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                🔍 Search for Jobs ({selectedJobs.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 