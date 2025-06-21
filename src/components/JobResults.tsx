'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { JobListing } from '@/types';
import { formatDate } from '@/lib/utils';

interface JobResultsProps {
  selectedJobs: string[];
  selectedPlatform?: string;
  location?: string;
  onBack: () => void;
  onJobSelected: (job: JobListing) => void;
}

export default function JobResults({ selectedJobs, selectedPlatform = 'both', location = 'Remote', onBack, onJobSelected }: JobResultsProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'company' | 'title' | 'date'>('company');
  const [dataSource, setDataSource] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    scrapeJobs();
  }, []);

  const scrapeJobs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/scrape-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          jobTitles: selectedJobs,
          location: location,
          platform: selectedPlatform
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape jobs');
      }

      setJobs(data.jobs);
      setDataSource(data.dataSource || 'unknown');
      setMessage(data.message || '');
      
      const sourceText = data.dataSource === 'linkedin' ? 'LinkedIn' : 'demo data';
      toast.success(`Found ${data.totalFound} job opportunities from ${sourceText}!`);
    } catch (error) {
      console.error('Error scraping jobs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to scrape jobs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    switch (sortBy) {
      case 'company':
        return a.company.localeCompare(b.company);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'date':
        return new Date(b.dateScraped).getTime() - new Date(a.dateScraped).getTime();
      default:
        return 0;
    }
  });

  const toggleDescription = (jobId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const getDescriptionPreview = (description: string, jobId: string, maxLength: number = 150) => {
    const isExpanded = expandedDescriptions.has(jobId);
    
    if (isExpanded || description.length <= maxLength) {
      return description;
    }
    
    return description.slice(0, maxLength) + '...';
  };

  const getSourceBadge = (source: string) => {
    if (source?.includes('puppeteer')) return 'bg-purple-100 text-purple-800';
    if (source?.includes('adzuna')) return 'bg-green-100 text-green-800';
    if (source?.includes('remoteok')) return 'bg-orange-100 text-orange-800';
    if (source?.includes('linkedin')) return 'bg-blue-100 text-blue-800';
    if (source?.includes('simplyhired')) return 'bg-yellow-100 text-yellow-800';
    if (source?.includes('ziprecruiter')) return 'bg-teal-100 text-teal-800';
    if (source?.includes('indeed')) return 'bg-red-100 text-red-800';
    if (source?.includes('glassdoor')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSourceIcon = (source: string) => {
    if (source?.includes('puppeteer')) return '🤖';
    if (source?.includes('adzuna')) return '🌐';
    if (source?.includes('remoteok')) return '🏠';
    if (source?.includes('linkedin')) return '💼';
    if (source?.includes('simplyhired')) return '📋';
    if (source?.includes('ziprecruiter')) return '⚡';
    if (source?.includes('indeed')) return '🔍';
    if (source?.includes('glassdoor')) return '🏢';
    return '🎭';
  };

  const getSourceDisplayName = (source: string) => {
    if (source?.includes('puppeteer')) return 'Puppeteer';
    if (source?.includes('adzuna')) return 'Adzuna';
    if (source?.includes('remoteok')) return 'RemoteOK';
    if (source?.includes('linkedin')) return 'LinkedIn';
    if (source?.includes('simplyhired')) return 'SimplyHired';
    if (source?.includes('ziprecruiter')) return 'ZipRecruiter';
    if (source?.includes('indeed')) return 'Indeed';
    if (source?.includes('glassdoor')) return 'Glassdoor';
    return source || 'Unknown';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              🔍 Job Search Results
            </h2>
            <p className="text-gray-600 mt-1">
              Searching for: {selectedJobs.join(', ')} • Location: {location}
            </p>
            {message && (
              <p className="text-sm text-blue-600 mt-2">
                {getSourceIcon(dataSource)} {message}
              </p>
            )}
          </div>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Suggestions
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">
              🔍 Searching job sources: Adzuna API → RemoteOK → Puppeteer scraping...
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={scrapeJobs}
              className="mt-2 text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !error && jobs.length > 0 && (
          <>
            {/* Sort Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                Found {jobs.length} job opportunities
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'company' | 'title' | 'date')}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="company">Company</option>
                  <option value="title">Job Title</option>
                  <option value="date">Date Scraped</option>
                </select>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Job Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Details</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedJobs.map((job) => (
                    <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{job.title}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${getSourceBadge(job.source)}`}>
                            {getSourceIcon(job.source)} {getSourceDisplayName(job.source)}
                          </span>
                          {job.postedDate && (
                            <span className="text-xs text-gray-500">
                              Posted {job.postedDate}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-800">{job.company}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-600">{job.location}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {job.jobType && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Type:</span> {job.jobType}
                            </div>
                          )}
                          {job.experienceLevel && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Level:</span> {job.experienceLevel}
                            </div>
                          )}
                          {job.salaryRange && (
                            <div className="text-xs text-green-600 font-medium">
                              💰 {job.salaryRange}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-md">
                        <div className="text-sm text-gray-600">
                          <div className="mb-2">
                            {getDescriptionPreview(job.description, job.id)}
                          </div>
                          {job.description.length > 150 && (
                            <button
                              onClick={() => toggleDescription(job.id)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                            >
                              {expandedDescriptions.has(job.id) ? '▲ Show Less' : '▼ Show More'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-1">
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Job →
                          </a>
                          <button
                            onClick={() => onJobSelected(job)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors"
                          >
                            Generate Docs
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!isLoading && !error && jobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No jobs found for the selected titles.</div>
            <button
              onClick={scrapeJobs}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 