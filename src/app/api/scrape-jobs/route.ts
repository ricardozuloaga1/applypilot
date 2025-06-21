import { NextRequest, NextResponse } from 'next/server';
import { JobListing } from '@/types';
import { generateId } from '@/lib/utils';
import { scrapeIndeedJobs, scrapeMultipleSites, scrapeWithPuppeteer } from '@/lib/jobScrapers';
import { scrapeAlternativeSources, scrapeRemoteOKJobs } from '@/lib/alternativeJobSources';

// Apify client for job scraping
const APIFY_API_KEY = process.env.APIFY_API_KEY;

// Actor IDs for different job platforms
const ACTORS = {
  LINKEDIN_FETCHCLUB: 'fetchclub/linkedin-jobs-scraper',
  LINKEDIN_CURIOUS: 'curious_coder/linkedin-jobs-scraper',
  INDEED_MEMO23: 'memo23/apify-indeed-cheerio',
  INDEED_VALIG: 'valig/indeed-jobs-scraper',
  INDEED_CURIOUS: 'curious_coder/indeed-scraper',
  INDEED_CAPROLOK: 'caprolok/indeed-jobs-scraper'
};

interface LinkedInJobResult {
  title?: string;
  company_name?: string;
  location?: string;
  job_url?: string;
  description_text?: string;
  posted_time_ago?: string;
  applicants?: string;
  base_salary?: string;
  seniority_level?: string;
  employment_type?: string;
  apply_url?: string;
}

interface IndeedJobResult {
  title?: string;
  company?: string;
  companyName?: string;
  location?: string;
  url?: string;
  jobUrl?: string;
  description?: string;
  salary?: string;
  jobType?: string;
  postedAt?: string;
  posted?: string;
}

const scrapeJobsFromLinkedIn = async (jobTitle: string, location: string): Promise<JobListing[]> => {
  const actorsToTry = [ACTORS.LINKEDIN_FETCHCLUB, ACTORS.LINKEDIN_CURIOUS];
  
  for (const actorId of actorsToTry) {
    try {
      console.log(`Trying LinkedIn scraper: ${actorId}`);
      
      // Construct LinkedIn search URL
      const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}&f_TPR=&position=1&pageNum=0`;
      
      // Prepare input for the LinkedIn scraper
      const apifyInput = {
        include_company_details: true,
        max_results: 25,
        search_url: searchUrl,
        proxy_group: "DATACENTER"
      };

      // Make request to Apify API
      const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: apifyInput,
          timeout: 300,
        }),
      });

      if (!response.ok) {
        console.log(`LinkedIn scraper ${actorId} failed with status: ${response.status}`);
        continue;
      }

      const runData = await response.json();
      console.log(`LinkedIn run started: ${runData.id}`);

      // Wait for the run to complete
      let runStatus = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 30; // Reduced timeout for faster fallback

      while (runStatus === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const statusResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runData.id}?token=${APIFY_API_KEY}`);
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        attempts++;
      }

      if (runStatus !== 'SUCCEEDED') {
        console.log(`LinkedIn run ${runData.id} status: ${runStatus}`);
        continue;
      }

      // Get the results
      const resultsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runData.id}/dataset/items?token=${APIFY_API_KEY}`);
      const results: LinkedInJobResult[] = await resultsResponse.json();

      if (results && results.length > 0) {
        console.log(`LinkedIn scraper ${actorId} found ${results.length} jobs`);
        
        // Transform the results to our JobListing format
        const jobListings: JobListing[] = results
          .filter(job => job.title && job.company_name)
          .map((job): JobListing => ({
            id: generateId(),
            title: job.title || 'Unknown Title',
            company: job.company_name || 'Unknown Company',
            location: job.location || location,
            url: job.job_url || job.apply_url || '#',
            description: job.description_text || 'No description available',
            dateScraped: new Date().toISOString(),
            source: 'linkedin',
            salaryRange: job.base_salary || undefined,
            jobType: job.employment_type || undefined,
            experienceLevel: job.seniority_level || undefined,
            postedDate: job.posted_time_ago || undefined,
            applicantCount: job.applicants || undefined,
          }));

        return jobListings;
      }

    } catch (error) {
      console.error(`Error with LinkedIn scraper ${actorId}:`, error);
      continue;
    }
  }

  console.log('All LinkedIn scrapers failed');
  return [];
};

const scrapeJobsFromIndeed = async (jobTitle: string, location: string): Promise<JobListing[]> => {
  console.log(`Trying custom Indeed scraper for: ${jobTitle}`);
  
  try {
    // First try our custom scraper
    const customJobs = await scrapeIndeedJobs(jobTitle, location, 25);
    
    if (customJobs.length > 0) {
      console.log(`Custom Indeed scraper found ${customJobs.length} jobs`);
      return customJobs;
    }
    
    console.log('Custom Indeed scraper returned no results, trying Apify scrapers...');
    
    // Fall back to Apify scrapers if custom scraper fails
    const actorsToTry = [
      ACTORS.INDEED_MEMO23,
      ACTORS.INDEED_VALIG,
      ACTORS.INDEED_CURIOUS,
      ACTORS.INDEED_CAPROLOK
    ];
    
    for (const actorId of actorsToTry) {
      try {
        console.log(`Trying Apify Indeed scraper: ${actorId}`);
        
        // Different input formats for different scrapers
        const inputVariations = [
          {
            position: jobTitle,
            location: location,
            maxItems: 25
          },
          {
            jobTitle: jobTitle,
            location: location,
            maxResults: 25
          },
          {
            query: jobTitle,
            location: location,
            limit: 25
          }
        ];

        for (const inputFormat of inputVariations) {
          try {
            const syncResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(inputFormat),
            });

            if (syncResponse.ok) {
              const results: IndeedJobResult[] = await syncResponse.json();
              
              if (results && Array.isArray(results) && results.length > 0) {
                console.log(`Apify Indeed scraper ${actorId} found ${results.length} jobs`);
                
                const jobListings: JobListing[] = results
                  .filter(job => job.title && (job.company || job.companyName))
                  .map((job): JobListing => ({
                    id: generateId(),
                    title: job.title || 'Unknown Title',
                    company: job.company || job.companyName || 'Unknown Company',
                    location: job.location || location,
                    url: job.url || job.jobUrl || '#',
                    description: job.description || 'No description available',
                    dateScraped: new Date().toISOString(),
                    source: 'indeed-apify',
                    salaryRange: job.salary || undefined,
                    jobType: job.jobType || undefined,
                    postedDate: job.postedAt || job.posted || undefined,
                  }));

                return jobListings;
              }
            }
          } catch (inputError) {
            console.log(`Input format failed for ${actorId}:`, inputError instanceof Error ? inputError.message : 'Unknown error');
            continue;
          }
        }

      } catch (error) {
        console.error(`Error with Apify Indeed scraper ${actorId}:`, error);
        continue;
      }
    }

    console.log('All Indeed scrapers failed');
    return [];
    
  } catch (error) {
    console.error('Error in Indeed scraping:', error);
    return [];
  }
};

// Enhanced mock data generator with Indeed-style jobs
const generateMockJobs = (jobTitle: string, count: number = 3): JobListing[] => {
  const companies = [
    'TechCorp', 'InnovateCo', 'GlobalTech', 'StartupXYZ', 'MegaCorp',
    'DataSystems', 'CloudWorks', 'NextGen Solutions', 'Digital Dynamics', 'FutureTech'
  ];
  const locations = [
    'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA',
    'Remote', 'Chicago, IL', 'Los Angeles, CA', 'Denver, CO', 'Atlanta, GA'
  ];
  const sources = ['indeed', 'linkedin'];
  
  return Array.from({ length: count }, (_, index) => ({
    id: generateId(),
    title: jobTitle,
    company: companies[index % companies.length],
    location: locations[index % locations.length],
    url: `https://example-job-${index + 1}.com/apply`,
    description: `We are looking for a talented ${jobTitle} to join our dynamic team. This is an excellent opportunity to work with cutting-edge technology and make a significant impact on our products and services. Key responsibilities include developing scalable solutions, collaborating with cross-functional teams, and contributing to our innovative culture.`,
    dateScraped: new Date().toISOString(),
    source: sources[index % sources.length],
    salaryRange: `$${70 + Math.floor(Math.random() * 80)}k - $${120 + Math.floor(Math.random() * 80)}k`,
    jobType: ['Full-time', 'Part-time', 'Contract'][Math.floor(Math.random() * 3)],
    experienceLevel: ['Entry level', 'Mid-Senior level', 'Senior level'][Math.floor(Math.random() * 3)],
    postedDate: `${Math.floor(Math.random() * 14) + 1} days ago`,
    applicantCount: `${Math.floor(Math.random() * 100) + 10} applicants`,
  }));
};

export async function POST(request: NextRequest) {
  try {
    console.log('Job scraping API called');
    
    const { jobTitles, location = 'Remote', useMockData = false, platform = 'all' } = await request.json();
    
    console.log('Scraping jobs for titles:', jobTitles);
    console.log('Location:', location);
    console.log('Platform:', platform);
    console.log('Use mock data:', useMockData);

    if (!jobTitles || !Array.isArray(jobTitles) || jobTitles.length === 0) {
      return NextResponse.json(
        { error: 'Job titles are required and must be an array' },
        { status: 400 }
      );
    }

    let allJobs: JobListing[] = [];

    // If mock data is requested, return mock data immediately
    if (useMockData) {
      console.log('Using mock data as requested');
      for (const jobTitle of jobTitles) {
        const mockJobs = generateMockJobs(jobTitle, 4); // More mock jobs
        allJobs.push(...mockJobs);
      }
    } else {
      // Try to scrape real data from multiple platforms
      for (const jobTitle of jobTitles) {
        console.log(`Searching jobs for: ${jobTitle}`);
        
        let jobsFound = false;

        // Route based on platform selection
        if (platform === 'apis-only') {
          // Only use API sources
          console.log(`Using APIs only for: ${jobTitle}`);
          const alternativeJobs = await scrapeAlternativeSources(jobTitle, location);
          
          if (alternativeJobs.length > 0) {
            console.log(`Found ${alternativeJobs.length} jobs from APIs for "${jobTitle}"`);
            allJobs.push(...alternativeJobs);
            jobsFound = true;
          }
        } else if (platform === 'scraping-only') {
          // Only use Puppeteer scraping
          console.log(`Using scraping only for: ${jobTitle}`);
          const puppeteerJobs = await scrapeWithPuppeteer(jobTitle, location, 25);
          
          if (puppeteerJobs.length > 0) {
            console.log(`Found ${puppeteerJobs.length} Puppeteer jobs for "${jobTitle}"`);
            allJobs.push(...puppeteerJobs);
            jobsFound = true;
          }
        } else if (platform === 'adzuna-only') {
          // Only use Adzuna API
          console.log(`Using Adzuna only for: ${jobTitle}`);
          const { scrapeAdzunaJobs } = await import('@/lib/alternativeJobSources');
          const adzunaJobs = await scrapeAdzunaJobs(jobTitle, location);
          
          if (adzunaJobs.length > 0) {
            console.log(`Found ${adzunaJobs.length} Adzuna jobs for "${jobTitle}"`);
            allJobs.push(...adzunaJobs);
            jobsFound = true;
          }
        } else {
          // Default: Try all sources (platform === 'all' or legacy 'both')
          console.log(`Trying all sources for: ${jobTitle}`);
          
          // Try APIs first (faster and more reliable)
          const alternativeJobs = await scrapeAlternativeSources(jobTitle, location);
          
          if (alternativeJobs.length > 0) {
            console.log(`Found ${alternativeJobs.length} jobs from APIs for "${jobTitle}"`);
            allJobs.push(...alternativeJobs);
            jobsFound = true;
          }

          // Try Puppeteer scraping if APIs didn't find enough jobs
          if (!jobsFound || alternativeJobs.length < 5) {
            console.log(`Trying Puppeteer scraping for: ${jobTitle}`);
            const puppeteerJobs = await scrapeWithPuppeteer(jobTitle, location, 25);
            
            if (puppeteerJobs.length > 0) {
              console.log(`Found ${puppeteerJobs.length} Puppeteer jobs for "${jobTitle}"`);
              allJobs.push(...puppeteerJobs);
              jobsFound = true;
            }
          }

          // Try LinkedIn Apify as last resort (requires subscription)
          if (!jobsFound) {
            console.log(`Trying LinkedIn for: ${jobTitle}`);
            const linkedInJobs = await scrapeJobsFromLinkedIn(jobTitle, location);
            
            if (linkedInJobs.length > 0) {
              console.log(`Found ${linkedInJobs.length} LinkedIn jobs for "${jobTitle}"`);
              allJobs.push(...linkedInJobs);
              jobsFound = true;
            }
          }
        }

        // If no real jobs found, use mock data as fallback
        if (!jobsFound) {
          console.log(`No real jobs found for "${jobTitle}", using mock data as fallback`);
          const mockJobs = generateMockJobs(jobTitle, 3);
          allJobs.push(...mockJobs);
        }
        
        console.log(`Total jobs found for "${jobTitle}": ${allJobs.filter(job => job.title.toLowerCase().includes(jobTitle.toLowerCase())).length}`);
      }
    }

    // Remove duplicates based on title + company combination
    const uniqueJobs = allJobs.reduce((acc: JobListing[], current) => {
      const duplicate = acc.find(job => 
        job.title.toLowerCase() === current.title.toLowerCase() && 
        job.company.toLowerCase() === current.company.toLowerCase()
      );
      if (!duplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Sort by date scraped (newest first)
    uniqueJobs.sort((a, b) => new Date(b.dateScraped).getTime() - new Date(a.dateScraped).getTime());

    console.log(`Total unique jobs found: ${uniqueJobs.length}`);

    // Determine the primary source of jobs
    const sourceCounts = uniqueJobs.reduce((acc, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const primarySource = Object.keys(sourceCounts).reduce((a, b) => 
      sourceCounts[a] > sourceCounts[b] ? a : b, 'mock'
    );

    return NextResponse.json({
      success: true,
      jobs: uniqueJobs,
      count: uniqueJobs.length,
      source: primarySource,
      sourceCounts,
      platform: platform,
      location: location
    });

  } catch (error) {
    console.error('Error in job scraping API:', error);
    return NextResponse.json(
      { error: 'Failed to scrape jobs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 