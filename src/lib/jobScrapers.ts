// @ts-nocheck
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

// Advanced scraper using Playwright (browser automation)
export async function scrapeWithPlaywright(
  jobTitle: string,
  location: string = 'Remote',
  maxJobs: number = 25,
  proxy?: string
): Promise<JobListing[]> {
  const { chromium } = require('playwright');

  console.log(`Starting Playwright scraper for: ${jobTitle} in ${location}`);

  // Launch browser with stealth and optional proxy
  const browser = await chromium.launch({
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
      '--disable-renderer-backgrounding',
      ...(proxy ? [`--proxy-server=${proxy}`] : [])
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  });

  const page = await context.newPage();

  // Add random delay to avoid detection
  const randomDelay: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

  const allJobs: JobListing[] = [];

  // Focus on accessible sites only (Indeed and Glassdoor are blocked by Cloudflare)
  console.log('🎯 Focusing on accessible job sites: SimplyHired');

  // Try SimplyHired (confirmed accessible)
  const simplyHiredJobs = await scrapeSimplyHiredWithPlaywright(page, jobTitle, location, maxJobs, randomDelay);
  allJobs.push(...simplyHiredJobs);

  // Try ZipRecruiter (confirmed accessible)
  const zipRecruiterJobs = await scrapeZipRecruiterWithPlaywright(page, jobTitle, location, maxJobs, randomDelay);
  allJobs.push(...zipRecruiterJobs);

  await browser.close();

  console.log(`Playwright scraper found ${allJobs.length} total jobs`);
  return allJobs;
}

// SimplyHired scraper with Playwright (confirmed accessible)
async function scrapeSimplyHiredWithPlaywright(
  page: any,
  jobTitle: string,
  location: string,
  maxJobs: number,
  randomDelay: () => Promise<void>
): Promise<JobListing[]> {
  try {
    console.log('Scraping SimplyHired with Playwright...');

    const searchUrl = `https://www.simplyhired.com/search?q=${encodeURIComponent(jobTitle)}&l=${encodeURIComponent(location)}`;

    await page.goto(searchUrl, {
      waitUntil: 'networkidle',
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
    const jobs = await page.evaluate(({ jobTitle, location }) => {
      const extractedJobs = [];
      const cardSelectors = [
        '[data-testid="searchSerpJob"]',
        '.SerpJob-container',
        '.job-listing',
        'article[data-job-id]',
        '.jobposting'
      ];
      let jobCards = null;
      for (const selector of cardSelectors) {
        jobCards = document.querySelectorAll(selector);
        if (jobCards.length > 0) break;
      }
      if (!jobCards) return extractedJobs;
      jobCards.forEach((card, index) => {
        if (index >= 25) return;
        try {
          const titleSelectors = [
            'h3 a', '[data-testid="jobTitle"] a', '.jobTitle a', 'h2 a', '.job-title a', 'a[data-testid="job-title"]'
          ];
          const companySelectors = [
            '[data-testid="companyName"]', '.company-name', '.companyName', '.hiring-company', '.company'
          ];
          const locationSelectors = [
            '[data-testid="searchSerpJobLocation"]', '.job-location', '.location', '.jobLocation', '[data-testid="location"]'
          ];
          const salarySelectors = [
            '[data-testid="searchSerpJobSalaryEst"]', '.salary', '.pay', '.compensation', '.wage'
          ];
          let title, company, jobLocation, link, salary;
          for (const selector of titleSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              title = element.textContent?.trim();
              if (!link) link = element.getAttribute('href');
              if (title && title.length > 3) break;
            }
          }
          for (const selector of companySelectors) {
            const element = card.querySelector(selector);
            if (element) {
              company = element.textContent?.trim();
              if (company && company.length > 1) break;
            }
          }
          for (const selector of locationSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              jobLocation = element.textContent?.trim();
              if (jobLocation && jobLocation.length > 1) break;
            }
          }
          for (const selector of salarySelectors) {
            const element = card.querySelector(selector);
            if (element) {
              salary = element.textContent?.trim();
              if (salary && salary.includes('$')) break;
            }
          }
          if (title && company && !title.includes('placeholder') && !company.includes('placeholder') && title.length > 3 && company.length > 1) {
            extractedJobs.push({
              title,
              company,
              location: jobLocation || location,
              url: link ? (link.startsWith('http') ? link : `https://www.simplyhired.com${link}`) : '#',
              salary: salary || undefined,
              source: 'simplyhired-playwright'
            });
          }
        } catch (e) {
          // Ignore extraction errors for individual cards
        }
      });
      return extractedJobs;
    }, { jobTitle, location });

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

    console.log(`Found ${jobListings.length} quality jobs from SimplyHired (Playwright)`);
    return jobListings;
  } catch (error) {
    console.error('Error scraping SimplyHired with Playwright:', error);
    return [];
  }
}

// ZipRecruiter scraper with Playwright (confirmed accessible)
async function scrapeZipRecruiterWithPlaywright(
  page: any,
  jobTitle: string,
  location: string,
  maxJobs: number,
  randomDelay: () => Promise<void>
): Promise<JobListing[]> {
  try {
    console.log('Scraping ZipRecruiter with Playwright...');

    const searchUrl = `https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location)}`;

    // Add a longer random delay before navigation
    await randomDelay();
    await randomDelay();

    // Set up extra stealth headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", ";Not A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
    });
    // User agent and viewport are set in the context, not on the page (Playwright best practice)
    // await page.setUserAgent(...); // <-- Do not use
    // await page.setViewportSize(...); // <-- Do not use

    // Try to set navigator.webdriver to false
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Add a short delay after navigation
    await randomDelay();

    // Debug: log first 500 chars of HTML after navigation
    const pageContent = await page.content();
    console.log('ZipRecruiter page HTML preview:', pageContent.slice(0, 500));

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

    const jobs = await page.evaluate(({ jobTitle, location }) => {
      const extractedJobs = [];
      const cardSelectors = [
        '[data-testid="job-card"]',
        '.job_content',
        '.jobList-item',
        '.job-card-container',
        'article[data-job-id]'
      ];
      let jobCards = null;
      for (const selector of cardSelectors) {
        jobCards = document.querySelectorAll(selector);
        if (jobCards.length > 0) break;
      }
      if (!jobCards) return extractedJobs;
      jobCards.forEach((card, index) => {
        if (index >= 25) return;
        try {
          const titleSelectors = ['h2 a', '.job-title a', '[data-testid="job-title"]', '.jobTitle a'];
          const companySelectors = ['.company-name', '.hiring-company', '[data-testid="company-name"]', '.companyName'];
          const locationSelectors = ['.job-location', '.location', '[data-testid="job-location"]', '.jobLocation'];
          const salarySelectors = ['.salary', '.compensation', '[data-testid="salary"]', '.pay'];
          let title, company, jobLocation, link, salary;
          for (const selector of titleSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              title = element.textContent?.trim();
              link = element.getAttribute('href');
              if (title) break;
            }
          }
          for (const selector of companySelectors) {
            const element = card.querySelector(selector);
            if (element) {
              company = element.textContent?.trim();
              if (company) break;
            }
          }
          for (const selector of locationSelectors) {
            const element = card.querySelector(selector);
            if (element) {
              jobLocation = element.textContent?.trim();
              if (jobLocation) break;
            }
          }
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
              source: 'ziprecruiter-playwright'
            });
          }
        } catch (e) {
          // Ignore extraction errors for individual cards
        }
      });
      return extractedJobs;
    }, { jobTitle, location });

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

    console.log(`Found ${jobListings.length} jobs from ZipRecruiter (Playwright)`);
    return jobListings;
  } catch (error) {
    console.error('Error scraping ZipRecruiter with Playwright:', error);
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