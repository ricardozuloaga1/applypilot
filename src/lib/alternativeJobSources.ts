import { JobListing } from '@/types';
import { generateId } from './utils';

// Helper function to clean and enhance job descriptions
function cleanAndEnhanceDescription(description: string, jobTitle?: string, company?: string): string {
  if (!description) return 'No description available';
  
  // Remove HTML tags but preserve structure
  let cleaned = description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  
  // Clean up excessive whitespace
  cleaned = cleaned
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  // Ensure minimum length and quality
  if (cleaned.length < 100 && jobTitle && company) {
    cleaned += `\n\nThis is a ${jobTitle} position at ${company}. Please visit the original job posting for complete details.`;
  }
  
  return cleaned;
}

// GitHub Jobs API (free and open)
export async function scrapeGitHubJobs(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  try {
    console.log(`Searching GitHub Jobs for: ${jobTitle}`);
    
    // GitHub Jobs API was discontinued, but we can use GitHub's search
    // This is an example of how to use open APIs
    const searchQuery = encodeURIComponent(`${jobTitle} in:title`);
    
    // Note: This is a placeholder - GitHub Jobs API was discontinued
    // But this shows the pattern for using real APIs
    console.log('GitHub Jobs API discontinued, using mock data');
    
    return [
      {
        id: generateId(),
        title: `${jobTitle} (GitHub)`,
        company: 'Tech Company via GitHub',
        location: location,
        url: 'https://github.com/jobs',
        description: `${jobTitle} position found through GitHub network`,
        dateScraped: new Date().toISOString(),
        source: 'github',
        jobType: 'Full-time'
      }
    ];
    
  } catch (error) {
    console.error('Error fetching GitHub jobs:', error);
    return [];
  }
}

// AngelList/Wellfound API (startup jobs)
export async function scrapeAngelListJobs(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  try {
    console.log(`Searching AngelList for: ${jobTitle}`);
    
    // AngelList has rate limits but is more accessible
    // This would require API key signup
    
    return [
      {
        id: generateId(),
        title: `${jobTitle} (Startup)`,
        company: 'Innovative Startup',
        location: location,
        url: 'https://wellfound.com',
        description: `Startup ${jobTitle} position with equity opportunities`,
        dateScraped: new Date().toISOString(),
        source: 'angellist',
        jobType: 'Full-time',
        salaryRange: '$80k - $150k + equity'
      }
    ];
    
  } catch (error) {
    console.error('Error fetching AngelList jobs:', error);
    return [];
  }
}

// Hacker News Who's Hiring (free, monthly posts)
export async function scrapeHackerNewsJobs(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  try {
    console.log(`Searching Hacker News for: ${jobTitle}`);
    
    // HN has a public API and monthly "Who's Hiring" posts
    const hnApiUrl = 'https://hacker-news.firebaseio.com/v0/item/8863.json';
    
    // This is a simplified example - you'd need to parse the actual posts
    return [
      {
        id: generateId(),
        title: `${jobTitle} (HN)`,
        company: 'YC Startup',
        location: location,
        url: 'https://news.ycombinator.com',
        description: `${jobTitle} position from Hacker News Who's Hiring thread`,
        dateScraped: new Date().toISOString(),
        source: 'hackernews',
        jobType: 'Full-time'
      }
    ];
    
  } catch (error) {
    console.error('Error fetching HN jobs:', error);
    return [];
  }
}

// RemoteOK API (remote jobs, has public API)
export async function scrapeRemoteOKJobs(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  try {
    console.log(`Searching RemoteOK for: ${jobTitle}`);
    
    // RemoteOK has a public API
    const response = await fetch('https://remoteok.io/api', {
      headers: {
        'User-Agent': 'AutoApply-AI-Bot/1.0'
      }
    });
    
    if (!response.ok) {
      console.log(`RemoteOK API responded with: ${response.status}`);
      return [];
    }
    
    const jobs = await response.json();
    console.log(`RemoteOK returned ${jobs.length} total jobs`);
    
    // Skip the first item (it's metadata)
    const jobData = jobs.slice(1);
    
    // Create multiple search terms for better matching
    const searchTerms = [
      jobTitle.toLowerCase(),
      ...jobTitle.toLowerCase().split(' '),
      // Add common variations
      jobTitle.toLowerCase().replace('senior', '').trim(),
      jobTitle.toLowerCase().replace('specialist', '').trim(),
      jobTitle.toLowerCase().replace('manager', '').trim()
    ].filter(term => term.length > 2);
    
    // Filter and transform jobs with broader matching
    const filteredJobs = jobData
      .filter((job: any) => {
        if (!job.position) return false;
        
        const position = job.position.toLowerCase();
        const tags = job.tags ? job.tags.join(' ').toLowerCase() : '';
        const searchText = `${position} ${tags}`;
        
        // Check if any search term matches
        return searchTerms.some(term => 
          searchText.includes(term) || 
          position.includes(term)
        );
      })
      .slice(0, 15)
      .map((job: any): JobListing => ({
        id: generateId(),
        title: job.position || jobTitle,
        company: job.company || 'Remote Company',
        location: 'Remote',
        url: job.url || `https://remoteok.io/remote-jobs/${job.slug || job.id}`,
        description: job.description || `
**Position:** ${job.position}
**Company:** ${job.company}
**Location:** Remote
${job.tags ? `**Required Skills:** ${job.tags.join(', ')}` : ''}
${job.company_logo ? `**Company Logo:** ${job.company_logo}` : ''}

This is a remote ${job.position} position. ${job.tags ? `Looking for candidates with experience in: ${job.tags.join(', ')}.` : ''} 

Apply directly through the RemoteOK platform for this opportunity.
        `.trim(),
        dateScraped: new Date().toISOString(),
        source: 'remoteok',
        jobType: 'Remote',
        salaryRange: job.salary_min && job.salary_max ? 
          `$${job.salary_min} - $${job.salary_max}` : undefined
      }));
    
    console.log(`Found ${filteredJobs.length} matching jobs from RemoteOK`);
    return filteredJobs;
    
  } catch (error) {
    console.error('Error fetching RemoteOK jobs:', error);
    return [];
  }
}

// Function to scrape full job description from Adzuna job page
async function scrapeAdzunaJobPage(redirectUrl: string): Promise<string> {
  try {
    // Follow the redirect URL to get the actual job page
    const response = await fetch(redirectUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch job page: ${response.status}`);
      return '';
    }
    
    const html = await response.text();
    
    // Extract content from common job description patterns
    let description = '';
    
    // Try to extract from various common patterns
    const patterns = [
      /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<section[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
      /<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/gi,
    ];
    
    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches && matches[0]) {
        description = matches[0];
        break;
      }
    }
    
    if (description) {
      // Clean HTML tags but preserve structure
      description = description
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
      
      console.log(`Scraped description length: ${description.length} chars`);
      return description;
    }
    
    return '';
  } catch (error) {
    console.error(`Error scraping job page:`, error);
    return '';
  }
}

// Adzuna API (has free tier) - Enhanced with full job descriptions
export async function scrapeAdzunaJobs(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  try {
    console.log(`Searching Adzuna for: ${jobTitle}`);
    
    // Adzuna has a free API tier
    // You'd need to sign up for API keys
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
    
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      console.log('Adzuna API keys not configured');
      return [];
    }
    
    const country = 'us';
    const what = encodeURIComponent(jobTitle);
    const where = encodeURIComponent(location);
    
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${what}&where=${where}&results_per_page=20`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`Adzuna API responded with: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`Adzuna returned ${data.results.length} job search results`);
    
    // Process jobs and fetch full descriptions
    const jobs = await Promise.all(
      data.results.map(async (job: any): Promise<JobListing> => {
        // Try to get full description using job ID
        let fullDescription = job.description || 'No description available';
        
        // Note: Adzuna API provides limited descriptions (500 chars max)
        // We'll enhance the AI generation to work better with limited descriptions
        console.log(`Using Adzuna description (${fullDescription.length} chars) - API limitation`);
        
        // Enhance description with available metadata
        const enhancedDescription = [
          fullDescription,
          `\n\n--- Additional Context ---`,
          `Company: ${job.company?.display_name || 'Not specified'}`,
          `Location: ${job.location?.display_name || 'Not specified'}`,
          `Job Type: ${job.contract_type || job.contract_time || 'Not specified'}`,
          `Salary: ${job.salary_max ? `$${job.salary_min || 0} - $${job.salary_max}` : 'Not specified'}`,
          `Posted: ${new Date(job.created).toLocaleDateString()}`,
          `Job ID: ${job.id}`,
        ].join('\n');
        
        fullDescription = enhancedDescription;
        console.log(`Enhanced with metadata: ${enhancedDescription.length} chars`);
        
        // Alternative: Try to fetch from company careers page if available
        // This is more reliable than tracking URLs
        if (job.company?.display_name && fullDescription.length < 800) {
          console.log(`Attempting to enrich description for ${job.company.display_name}`);
          // Could implement company-specific enrichment here
        }
        
        // Clean and enhance the description
        fullDescription = cleanAndEnhanceDescription(fullDescription, job.title, job.company.display_name);
        
        return {
          id: generateId(),
          title: job.title || jobTitle,
          company: job.company.display_name || 'Unknown Company',
          location: job.location.display_name || location,
          url: job.redirect_url || '#',
          description: fullDescription,
          dateScraped: new Date().toISOString(),
          source: 'adzuna',
          jobType: job.contract_type || 'Full-time',
          salaryRange: job.salary_min && job.salary_max ? 
            `$${Math.round(job.salary_min)} - $${Math.round(job.salary_max)}` : undefined,
          postedDate: job.created ? new Date(job.created).toLocaleDateString() : undefined
        };
      })
    );
    
    console.log(`Found ${jobs.length} jobs from Adzuna with enhanced descriptions`);
    return jobs;
    
  } catch (error) {
    console.error('Error fetching Adzuna jobs:', error);
    return [];
  }
}

// RSS Feed scraper (many job sites have RSS feeds)
export async function scrapeJobRSSFeeds(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  try {
    console.log(`Searching RSS feeds for: ${jobTitle}`);
    
    // Many job sites have RSS feeds that are easier to scrape
    const rssFeeds = [
      'https://stackoverflow.com/jobs/feed',
      'https://www.dice.com/jobs/rss',
      // Add more RSS feeds here
    ];
    
    // This would require an RSS parser library
    // For now, return mock data showing the concept
    return [
      {
        id: generateId(),
        title: `${jobTitle} (RSS)`,
        company: 'RSS Job Board',
        location: location,
        url: '#',
        description: `${jobTitle} position found via RSS feed`,
        dateScraped: new Date().toISOString(),
        source: 'rss',
        jobType: 'Full-time'
      }
    ];
    
  } catch (error) {
    console.error('Error fetching RSS jobs:', error);
    return [];
  }
}

// Mantiks API (production-ready, robust job search)
export async function scrapeMantiksJobs(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  try {
    const API_KEY = process.env.MANTIKS_API_KEY;
    const JOB_AGE_IN_DAYS = 30;
    if (!API_KEY) {
      console.log('Mantiks API key not configured');
      return [];
    }

    // Step 1: Get location ID from Mantiks
    const locRes = await fetch(`https://api.mantiks.io/location/search?name=${encodeURIComponent(location)}`,
      {
        headers: {
          'x-api-key': API_KEY,
          'accept': 'application/json'
        }
      }
    );
    if (!locRes.ok) {
      console.log('Mantiks location search failed:', locRes.status);
      return [];
    }
    const locData = await locRes.json();
    const locationId = locData?.results?.[0]?.id;
    if (!locationId) {
      console.log('No Mantiks location ID found for', location);
      return [];
    }

    // Step 2: Query jobs by title and location ID
    const url = `https://api.mantiks.io/company/search?job_title=${encodeURIComponent(jobTitle)}&job_location_ids=${locationId}&job_age_in_days=${JOB_AGE_IN_DAYS}`;
    const jobRes = await fetch(url, {
      headers: {
        'x-api-key': API_KEY,
        'accept': 'application/json'
      }
    });
    if (!jobRes.ok) {
      console.log('Mantiks job search failed:', jobRes.status);
      return [];
    }
    const jobData = await jobRes.json();
    const companies = jobData?.companies || [];
    const allJobs: JobListing[] = [];
    companies.forEach((company: any) => {
      if (company.jobs && company.jobs.length) {
        company.jobs.forEach((job: any) => {
          allJobs.push({
            id: generateId(),
            title: job.job_title || jobTitle,
            company: company.name || 'Unknown Company',
            location: job.location || location,
            url: job.job_board_url || '#',
            description: job.description || `${job.job_title} at ${company.name} via ${job.job_board}.`,
            dateScraped: new Date().toISOString(),
            source: 'mantiks',
            salaryRange: job.salary || undefined,
            jobType: job.job_type || undefined,
            postedDate: job.posted_at ? new Date(job.posted_at).toLocaleDateString() : undefined,
            experienceLevel: job.experience_level || undefined,
            applicantCount: job.applicant_count ? String(job.applicant_count) : undefined
          });
        });
      }
    });
    return allJobs;
  } catch (error) {
    console.error('Error fetching Mantiks jobs:', error);
    return [];
  }
}

// Combine reliable alternative sources only
export async function scrapeAlternativeSources(
  jobTitle: string,
  location: string = 'Remote'
): Promise<JobListing[]> {
  console.log(`Searching alternative job sources for: ${jobTitle}`);
  
  const allJobs: JobListing[] = [];
  
  // Add Mantiks as the first source (most robust)
  const sources = [
    scrapeMantiksJobs(jobTitle, location),
    scrapeRemoteOKJobs(jobTitle, location),
    scrapeAdzunaJobs(jobTitle, location)
  ];
  
  const results = await Promise.allSettled(sources);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allJobs.push(...result.value);
    } else {
      console.error(`Source ${index} failed:`, result.reason);
    }
  });
  
  // Remove duplicates
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
  
  console.log(`Found ${uniqueJobs.length} quality jobs from alternative sources`);
  return uniqueJobs;
} 