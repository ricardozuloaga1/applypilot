import { JobListing } from '@/types';
import { generateId } from './utils';

// Custom Indeed scraper using fetch (no browser automation needed)
export async function scrapeIndeedJobs(
  jobTitle: string, 
  location: string = 'Remote',
  maxJobs: number = 25
): Promise<JobListing[]> {
  try {
    console.log(`Scraping Indeed for: ${jobTitle} in ${location}`);
    
    // Build Indeed search URL
    const searchParams = new URLSearchParams({
      q: jobTitle,
      l: location,
      start: '0',
      limit: maxJobs.toString()
    });
    
    const indeedUrl = `https://www.indeed.com/jobs?${searchParams}`;
    console.log('Indeed URL:', indeedUrl);
    
    // Fetch the Indeed search page
    const response = await fetch(indeedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      console.log(`Indeed responded with status: ${response.status}`);
      return [];
    }

    const html = await response.text();
    
    // Parse the HTML to extract job listings
    const jobs = parseIndeedHTML(html, jobTitle, location);
    
    console.log(`Successfully scraped ${jobs.length} jobs from Indeed`);
    return jobs;
    
  } catch (error) {
    console.error('Error scraping Indeed:', error);
    return [];
  }
}

// Parse Indeed HTML to extract job data
function parseIndeedHTML(html: string, jobTitle: string, location: string): JobListing[] {
  const jobs: JobListing[] = [];
  
  try {
    // Indeed uses various selectors, we'll try to extract what we can
    // This is a simplified parser - in production you'd want more robust parsing
    
    // Look for job card patterns in the HTML
    const jobCardRegex = /<div[^>]*data-jk="([^"]*)"[^>]*>.*?<h2[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<span[^>]*title="([^"]*)"[^>]*>.*?<\/h2>.*?<span[^>]*data-testid="company-name"[^>]*>([^<]*)<\/span>.*?<div[^>]*data-testid="job-location"[^>]*>([^<]*)<\/div>/gs;
    
    let match;
    let count = 0;
    
    while ((match = jobCardRegex.exec(html)) !== null && count < 25) {
      const [, jobKey, relativeUrl, title, company, jobLocation] = match;
      
      if (title && company) {
        const job: JobListing = {
          id: generateId(),
          title: title.trim(),
          company: company.trim(),
          location: jobLocation?.trim() || location,
          url: relativeUrl.startsWith('http') ? relativeUrl : `https://www.indeed.com${relativeUrl}`,
          description: `${title} position at ${company}. View full details on Indeed.`,
          dateScraped: new Date().toISOString(),
          source: 'indeed-custom',
          jobType: 'Full-time', // Default, could be extracted with more parsing
        };
        
        jobs.push(job);
        count++;
      }
    }
    
    // If the regex approach doesn't work well, try a simpler text-based extraction
    if (jobs.length === 0) {
      console.log('Regex parsing failed, trying alternative extraction...');
      return extractJobsFromText(html, jobTitle, location);
    }
    
    return jobs;
    
  } catch (error) {
    console.error('Error parsing Indeed HTML:', error);
    return extractJobsFromText(html, jobTitle, location);
  }
}

// Fallback text-based extraction
function extractJobsFromText(html: string, jobTitle: string, location: string): JobListing[] {
  const jobs: JobListing[] = [];
  
  try {
    // Look for common patterns in Indeed's HTML structure
    const titleRegex = /<span[^>]*title="([^"]*)"[^>]*>/g;
    const companyRegex = /data-testid="company-name"[^>]*>([^<]*)</g;
    const linkRegex = /href="(\/viewjob\?jk=[^"]*)"[^>]*>/g;
    
    const titles: string[] = [];
    const companies: string[] = [];
    const links: string[] = [];
    
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      if (titleMatch[1] && titleMatch[1].length > 5) { // Filter out short/irrelevant titles
        titles.push(titleMatch[1]);
      }
    }
    
    let companyMatch;
    while ((companyMatch = companyRegex.exec(html)) !== null) {
      if (companyMatch[1] && companyMatch[1].trim()) {
        companies.push(companyMatch[1].trim());
      }
    }
    
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      links.push(`https://www.indeed.com${linkMatch[1]}`);
    }
    
    // Combine the extracted data
    const maxItems = Math.min(titles.length, companies.length, 10);
    
    for (let i = 0; i < maxItems; i++) {
      if (titles[i] && companies[i]) {
        const job: JobListing = {
          id: generateId(),
          title: titles[i],
          company: companies[i],
          location: location,
          url: links[i] || '#',
          description: `${titles[i]} position at ${companies[i]}. View full details on Indeed.`,
          dateScraped: new Date().toISOString(),
          source: 'indeed-custom',
          jobType: 'Full-time',
        };
        
        jobs.push(job);
      }
    }
    
    console.log(`Extracted ${jobs.length} jobs using text parsing`);
    return jobs;
    
  } catch (error) {
    console.error('Error in text extraction:', error);
    return [];
  }
}

// Advanced scraper using Puppeteer (browser automation)
export async function scrapeWithPuppeteer(
  jobTitle: string,
  location: string = 'Remote',
  maxJobs: number = 25
): Promise<JobListing[]> {
  try {
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    
    // Add stealth plugin
    puppeteer.use(StealthPlugin());
    
    console.log(`Starting Puppeteer scraper for: ${jobTitle} in ${location}`);
    
    // Launch browser with stealth settings
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--disable-javascript-harmony-shipping',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1366, height: 768 });
    
    // Set extra headers to look more human
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });
    
    // Add random delay to avoid detection
    const randomDelay = (): Promise<void> => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    const allJobs: JobListing[] = [];
    
    // Focus on accessible sites only (Indeed and Glassdoor are blocked by Cloudflare)
    console.log('🎯 Focusing on accessible job sites: SimplyHired + ZipRecruiter');
    
    // Try SimplyHired (confirmed accessible)
    const simplyHiredJobs = await scrapeSimplyHiredWithPuppeteer(page, jobTitle, location, maxJobs, randomDelay);
    allJobs.push(...simplyHiredJobs);
    
    // Try ZipRecruiter (confirmed accessible)
    const zipRecruiterJobs = await scrapeZipRecruiterWithPuppeteer(page, jobTitle, location, maxJobs, randomDelay);
    allJobs.push(...zipRecruiterJobs);
    
    await browser.close();
    
    console.log(`Puppeteer scraper found ${allJobs.length} total jobs`);
    return allJobs;
    
  } catch (error) {
    console.error('Error in Puppeteer scraper:', error);
    return [];
  }
}

// Indeed scraper with Puppeteer
async function scrapeIndeedWithPuppeteer(
  page: any,
  jobTitle: string,
  location: string,
  maxJobs: number,
  randomDelay: () => Promise<void>
): Promise<JobListing[]> {
  try {
    console.log('Scraping Indeed with Puppeteer...');
    
    const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(jobTitle)}&l=${encodeURIComponent(location)}`;
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for job cards to load
    await page.waitForSelector('[data-jk]', { timeout: 10000 }).catch(() => {
      console.log('No job cards found on Indeed');
    });
    
    // Extract job data
    const jobs = await page.evaluate((jobTitle: string, location: string) => {
      const jobCards = document.querySelectorAll('[data-jk]');
      const extractedJobs: any[] = [];
      
      jobCards.forEach((card, index) => {
        if (index >= 25) return; // Limit results
        
        try {
          const titleElement = card.querySelector('h2 a span[title]');
          const companyElement = card.querySelector('[data-testid="company-name"]');
          const locationElement = card.querySelector('[data-testid="job-location"]');
          const linkElement = card.querySelector('h2 a');
          const salaryElement = card.querySelector('[data-testid="attribute_snippet_testid"]');
          
          const title = titleElement?.getAttribute('title') || titleElement?.textContent;
          const company = companyElement?.textContent?.trim();
          const jobLocation = locationElement?.textContent?.trim();
          const link = linkElement?.getAttribute('href');
          const salary = salaryElement?.textContent?.trim();
          
          if (title && company) {
            extractedJobs.push({
              title: title.trim(),
              company: company,
              location: jobLocation || location,
              url: link ? `https://www.indeed.com${link}` : '#',
              salary: salary || undefined,
              source: 'indeed-puppeteer'
            });
          }
        } catch (e) {
          console.log('Error extracting job data:', e);
        }
      });
      
      return extractedJobs;
    }, jobTitle, location);
    
    const jobListings = jobs.map((job: any): JobListing => ({
      id: generateId(),
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      description: `${job.title} position at ${job.company}. View full details on Indeed.`,
      dateScraped: new Date().toISOString(),
      source: job.source,
      salaryRange: job.salary,
      jobType: 'Full-time'
    }));
    
    console.log(`Found ${jobListings.length} jobs from Indeed (Puppeteer)`);
    return jobListings;
    
  } catch (error) {
    console.error('Error scraping Indeed with Puppeteer:', error);
    return [];
  }
}

// SimplyHired scraper with Puppeteer (confirmed accessible)
async function scrapeSimplyHiredWithPuppeteer(
  page: any,
  jobTitle: string,
  location: string,
  maxJobs: number,
  randomDelay: () => Promise<void>
): Promise<JobListing[]> {
  try {
    console.log('Scraping SimplyHired with Puppeteer...');
    
    const searchUrl = `https://www.simplyhired.com/search?q=${encodeURIComponent(jobTitle)}&l=${encodeURIComponent(location)}`;
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Add random delay to avoid detection
    await randomDelay();
    
    // Try multiple job card selectors
    const jobCardSelectors = [
      '[data-testid="searchSerpJob"]',
      '.SerpJob-container',
      '.job-listing',
      'article[data-job-id]',
      '.jobposting'
    ];
    
    let jobCards: any[] = [];
    for (const selector of jobCardSelectors) {
      jobCards = await page.$$(selector);
      if (jobCards.length > 0) {
        console.log(`Found ${jobCards.length} job cards with selector: ${selector}`);
        break;
      }
    }
    
    if (jobCards.length === 0) {
      console.log('No job cards found on SimplyHired');
      return [];
    }
    
    // Extract job data with improved selectors and fallbacks
    const jobs = await page.evaluate((jobTitle: string, location: string) => {
      const extractedJobs: any[] = [];
      
      // Try multiple job card selectors
      const cardSelectors = [
        '[data-testid="searchSerpJob"]',
        '.SerpJob-container',
        '.job-listing',
        'article[data-job-id]',
        '.jobposting'
      ];
      
      let jobCards: NodeListOf<Element> | null = null;
      for (const selector of cardSelectors) {
        jobCards = document.querySelectorAll(selector);
        if (jobCards.length > 0) break;
      }
      
      if (!jobCards) return extractedJobs;
      
      jobCards.forEach((card, index) => {
        if (index >= 25) return;
        
        try {
          // Multiple selector strategies for each field
          const titleSelectors = [
            'h3 a', 
            '[data-testid="jobTitle"] a', 
            '.jobTitle a', 
            'h2 a',
            '.job-title a',
            'a[data-testid="job-title"]'
          ];
          
          const companySelectors = [
            '[data-testid="companyName"]',
            '.company-name',
            '.companyName',
            '.hiring-company',
            '.company'
          ];
          
          const locationSelectors = [
            '[data-testid="searchSerpJobLocation"]',
            '.job-location',
            '.location',
            '.jobLocation',
            '[data-testid="location"]'
          ];
          
          const salarySelectors = [
            '[data-testid="searchSerpJobSalaryEst"]',
            '.salary',
            '.pay',
            '.compensation',
            '.wage'
          ];
          
          let title, company, jobLocation, link, salary;
          
          // Find title with multiple fallbacks
          for (const selector of titleSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              title = element.textContent?.trim();
              if (!link) link = element.getAttribute('href');
              if (title && title.length > 3) break; // Ensure we got real content
            }
          }
          
          // Find company with multiple fallbacks
          for (const selector of companySelectors) {
            const element = card.querySelector(selector);
            if (element) {
              company = element.textContent?.trim();
              if (company && company.length > 1) break; // Ensure we got real content
            }
          }
          
          // Find location with multiple fallbacks
          for (const selector of locationSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              jobLocation = element.textContent?.trim();
              if (jobLocation && jobLocation.length > 1) break;
            }
          }
          
          // Find salary with multiple fallbacks
          for (const selector of salarySelectors) {
            const element = card.querySelector(selector);
            if (element) {
              salary = element.textContent?.trim();
              if (salary && salary.includes('$')) break; // Only accept if it looks like salary
            }
          }
          
          // Quality check - ensure we have real data, not placeholders
          if (title && company && 
              !title.includes('placeholder') && 
              !company.includes('placeholder') &&
              title.length > 3 && 
              company.length > 1) {
            extractedJobs.push({
              title,
              company,
              location: jobLocation || location,
              url: link ? (link.startsWith('http') ? link : `https://www.simplyhired.com${link}`) : '#',
              salary: salary || undefined,
              source: 'simplyhired-puppeteer'
            });
          }
        } catch (e) {
          console.log('Error extracting SimplyHired job data:', e);
        }
      });
      
      return extractedJobs;
    }, jobTitle, location);
    
    const jobListings = jobs.map((job: any): JobListing => ({
      id: generateId(),
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      description: `${job.title} position at ${job.company}. Apply directly through SimplyHired for best results.`,
      dateScraped: new Date().toISOString(),
      source: job.source,
      salaryRange: job.salary,
      jobType: 'Full-time'
    }));
    
    console.log(`Found ${jobListings.length} quality jobs from SimplyHired (Puppeteer)`);
    return jobListings;
    
  } catch (error) {
    console.error('Error scraping SimplyHired with Puppeteer:', error);
    return [];
  }
}

// ZipRecruiter scraper with Puppeteer (confirmed accessible)
async function scrapeZipRecruiterWithPuppeteer(
  page: any,
  jobTitle: string,
  location: string,
  maxJobs: number,
  randomDelay: () => Promise<void>
): Promise<JobListing[]> {
  try {
    console.log('Scraping ZipRecruiter with Puppeteer...');
    
    const searchUrl = `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}`;
    
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Add random delay to avoid detection
    await randomDelay();
    
    // Wait for job cards to load - try multiple selectors
    const jobCardSelectors = [
      '[data-testid="job-card"]',
      '.job_content',
      '.jobList-item',
      '.job-card-container',
      'article[data-job-id]'
    ];
    
    let jobCards: any[] = [];
    for (const selector of jobCardSelectors) {
      jobCards = await page.$$(selector);
      if (jobCards.length > 0) {
        console.log(`Found ${jobCards.length} job cards with selector: ${selector}`);
        break;
      }
    }
    
    if (jobCards.length === 0) {
      console.log('No job cards found on ZipRecruiter');
      return [];
    }
    
    // Extract job data with multiple fallback selectors
    const jobs = await page.evaluate((jobTitle: string, location: string) => {
      const extractedJobs: any[] = [];
      
      // Try multiple job card selectors
      const cardSelectors = [
        '[data-testid="job-card"]',
        '.job_content',
        '.jobList-item',
        '.job-card-container',
        'article[data-job-id]'
      ];
      
      let jobCards: NodeListOf<Element> | null = null;
      for (const selector of cardSelectors) {
        jobCards = document.querySelectorAll(selector);
        if (jobCards.length > 0) break;
      }
      
      if (!jobCards) return extractedJobs;
      
      jobCards.forEach((card, index) => {
        if (index >= 25) return;
        
        try {
          // Multiple selector strategies for each field
          const titleSelectors = ['h2 a', '.job-title a', '[data-testid="job-title"]', '.jobTitle a'];
          const companySelectors = ['.company-name', '.hiring-company', '[data-testid="company-name"]', '.companyName'];
          const locationSelectors = ['.job-location', '.location', '[data-testid="job-location"]', '.jobLocation'];
          const salarySelectors = ['.salary', '.compensation', '[data-testid="salary"]', '.pay'];
          
          let title, company, jobLocation, link, salary;
          
          // Find title
          for (const selector of titleSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              title = element.textContent?.trim();
              link = element.getAttribute('href');
              if (title) break;
            }
          }
          
          // Find company
          for (const selector of companySelectors) {
            const element = card.querySelector(selector);
            if (element) {
              company = element.textContent?.trim();
              if (company) break;
            }
          }
          
          // Find location
          for (const selector of locationSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              jobLocation = element.textContent?.trim();
              if (jobLocation) break;
            }
          }
          
          // Find salary
          for (const selector of salarySelectors) {
            const element = card.querySelector(selector);
            if (element) {
              salary = element.textContent?.trim();
              if (salary) break;
            }
          }
          
          if (title && company) {
            extractedJobs.push({
              title,
              company,
              location: jobLocation || location,
              url: link ? (link.startsWith('http') ? link : `https://www.ziprecruiter.com${link}`) : '#',
              salary: salary || undefined,
              source: 'ziprecruiter-puppeteer'
            });
          }
        } catch (e) {
          console.log('Error extracting ZipRecruiter job data:', e);
        }
      });
      
      return extractedJobs;
    }, jobTitle, location);
    
    const jobListings = jobs.map((job: any): JobListing => ({
      id: generateId(),
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.url,
      description: `${job.title} position at ${job.company}. View full details on ZipRecruiter.`,
      dateScraped: new Date().toISOString(),
      source: job.source,
      salaryRange: job.salary,
      jobType: 'Full-time'
    }));
    
    console.log(`Found ${jobListings.length} jobs from ZipRecruiter (Puppeteer)`);
    return jobListings;
    
  } catch (error) {
    console.error('Error scraping ZipRecruiter with Puppeteer:', error);
    return [];
  }
}

// Scrape multiple job sites
export async function scrapeMultipleSites(
  jobTitle: string,
  location: string = 'Remote',
  sites: string[] = ['indeed']
): Promise<JobListing[]> {
  const allJobs: JobListing[] = [];
  
  for (const site of sites) {
    try {
      switch (site.toLowerCase()) {
        case 'indeed':
          const indeedJobs = await scrapeIndeedJobs(jobTitle, location);
          allJobs.push(...indeedJobs);
          break;
        // Add more sites here
        default:
          console.log(`Scraper for ${site} not implemented yet`);
      }
    } catch (error) {
      console.error(`Error scraping ${site}:`, error);
    }
  }
  
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
  
  return uniqueJobs;
} 