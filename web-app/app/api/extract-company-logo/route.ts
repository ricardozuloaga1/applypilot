import { NextRequest, NextResponse } from 'next/server';

interface LogoExtractionRequest {
  companyName: string;
  companyWebsite?: string;
  batch?: Array<{name: string, website?: string}>;
}

interface LogoResult {
  logoUrl: string | null;
  source: 'clearbit' | 'favicon' | 'fallback' | 'error';
  companyName: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LogoExtractionRequest = await request.json();
    
    if (!body.companyName && !body.batch) {
      return NextResponse.json(
        { error: 'Company name or batch of companies required' },
        { status: 400 }
      );
    }

    // Handle batch extraction
    if (body.batch) {
      console.log(`🔍 Extracting logos for ${body.batch.length} companies`);
      const results = await extractLogoBatch(body.batch);
      return NextResponse.json({ results });
    }

    // Handle single extraction
    console.log(`🔍 Extracting logo for: ${body.companyName}`);
    const result = await extractSingleLogo(body.companyName, body.companyWebsite);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Logo extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract company logo', details: error.message },
      { status: 500 }
    );
  }
}

async function extractSingleLogo(companyName: string, companyWebsite?: string): Promise<LogoResult> {
  // Method 1: Clearbit Logo API
  const clearbitResult = await tryCleatbitApi(companyName);
  if (clearbitResult.logoUrl) {
    return clearbitResult;
  }

  // Method 2: Favicon from website
  if (companyWebsite) {
    const faviconResult = await tryFaviconExtraction(companyName, companyWebsite);
    if (faviconResult.logoUrl) {
      return faviconResult;
    }
  }

  // Method 3: Domain guessing
  const domainResult = await tryDomainGuessing(companyName);
  if (domainResult.logoUrl) {
    return domainResult;
  }

  // Method 4: Fallback
  return createFallbackLogo(companyName);
}

async function extractLogoBatch(companies: Array<{name: string, website?: string}>): Promise<LogoResult[]> {
  const results: LogoResult[] = [];
  
  for (const company of companies) {
    try {
      const result = await extractSingleLogo(company.name, company.website);
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to extract logo for ${company.name}:`, error);
      results.push(createErrorResult(company.name));
    }
  }
  
  return results;
}

async function tryCleatbitApi(companyName: string): Promise<LogoResult> {
  try {
    const domain = guessDomain(companyName);
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    
    const response = await fetch(clearbitUrl, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'AutoApply-AI/1.0'
      }
    });
    
    if (response.ok) {
      console.log(`✅ Clearbit logo found for ${companyName}`);
      return createResult(clearbitUrl, 'clearbit', companyName);
    }
  } catch (error) {
    console.log(`❌ Clearbit API failed for ${companyName}:`, error);
  }
  
  return createResult(null, 'clearbit', companyName);
}

async function tryFaviconExtraction(companyName: string, website: string): Promise<LogoResult> {
  try {
    const domain = extractDomain(website);
    const faviconPaths = [
      '/favicon.ico',
      '/favicon.png', 
      '/apple-touch-icon.png',
      '/apple-touch-icon-180x180.png',
      '/logo.png',
      '/assets/logo.png'
    ];
    
    for (const path of faviconPaths) {
      const logoUrl = `https://${domain}${path}`;
      
      try {
                 const response = await fetch(logoUrl, { 
           method: 'HEAD',
           headers: {
             'User-Agent': 'AutoApply-AI/1.0'
           }
         });
        
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
          console.log(`✅ Favicon found for ${companyName}: ${logoUrl}`);
          return createResult(logoUrl, 'favicon', companyName);
        }
      } catch (error) {
        // Continue to next path
        continue;
      }
    }
  } catch (error) {
    console.log(`❌ Favicon extraction failed for ${companyName}:`, error);
  }
  
  return createResult(null, 'favicon', companyName);
}

async function tryDomainGuessing(companyName: string): Promise<LogoResult> {
  const possibleDomains = generatePossibleDomains(companyName);
  
  for (const domain of possibleDomains) {
    try {
      const faviconUrl = `https://${domain}/favicon.ico`;
             const response = await fetch(faviconUrl, { 
         method: 'HEAD',
         headers: {
           'User-Agent': 'AutoApply-AI/1.0'
         }
       });
      
      if (response.ok) {
        console.log(`✅ Domain guess successful for ${companyName}: ${faviconUrl}`);
        return createResult(faviconUrl, 'favicon', companyName);
      }
    } catch (error) {
      // Continue to next domain
      continue;
    }
  }
  
  return createResult(null, 'favicon', companyName);
}

function createFallbackLogo(companyName: string): LogoResult {
  const initials = getCompanyInitials(companyName);
  const fallbackUrl = generateInitialsLogo(initials, companyName);
  
  console.log(`📝 Using fallback logo for ${companyName}: ${initials}`);
  return createResult(fallbackUrl, 'fallback', companyName);
}

function guessDomain(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/(inc|llc|corp|ltd|co|company)$/, '') + '.com';
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '');
  }
}

function generatePossibleDomains(companyName: string): string[] {
  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/(inc|llc|corp|ltd|co|company|corporation|incorporated)$/g, '')
    .trim();
  
  const words = cleanName.split(/\s+/).filter(w => w.length > 0);
  const domains: string[] = [];
  
  // Full name variations
  domains.push(`${words.join('')}.com`);
  domains.push(`${words.join('-')}.com`);
  
  // First word only
  if (words.length > 0) {
    domains.push(`${words[0]}.com`);
  }
  
  // First two words
  if (words.length > 1) {
    domains.push(`${words[0]}${words[1]}.com`);
    domains.push(`${words[0]}-${words[1]}.com`);
  }
  
  return domains.slice(0, 5); // Limit to prevent too many requests
}

function getCompanyInitials(companyName: string): string {
  return companyName
    .split(' ')
    .filter(word => word.length > 0 && !['inc', 'llc', 'corp', 'ltd', 'co'].includes(word.toLowerCase()))
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
}

function generateInitialsLogo(initials: string, companyName: string): string {
  const colors = [
    '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
    '#db2777', '#0891b2', '#65a30d', '#dc2626', '#2563eb'
  ];
  const colorIndex = companyName.length % colors.length;
  const bgColor = colors[colorIndex];
  
  const svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${bgColor}" rx="8"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            fill="white" text-anchor="middle" dy="0.35em">${initials}</text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function createResult(logoUrl: string | null, source: LogoResult['source'], companyName: string): LogoResult {
  return {
    logoUrl,
    source,
    companyName,
    timestamp: new Date().toISOString()
  };
}

function createErrorResult(companyName: string): LogoResult {
  return {
    logoUrl: null,
    source: 'error',
    companyName,
    timestamp: new Date().toISOString()
  };
} 