interface LogoResult {
  logoUrl: string | null;
  source: 'clearbit' | 'favicon' | 'fallback' | 'cached';
  companyName: string;
  timestamp: string;
}

interface LogoCache {
  [companyName: string]: LogoResult;
}

export class CompanyLogoService {
  private cache: LogoCache = {};
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  constructor() {
    this.loadCache();
  }

  /**
   * Main method to extract company logo
   */
  async extractLogo(companyName: string, companyWebsite?: string): Promise<LogoResult> {
    if (!companyName) {
      return this.createResult(null, 'fallback', companyName);
    }

    // Check cache first
    const cachedResult = this.getCachedLogo(companyName);
    if (cachedResult) {
      return { ...cachedResult, source: 'cached' as const };
    }

    console.log(`🔍 Extracting logo for: ${companyName}`);

    // Method 1: Clearbit Logo API (most reliable)
    const clearbitResult = await this.tryCleatbitApi(companyName);
    if (clearbitResult.logoUrl) {
      this.cacheResult(companyName, clearbitResult);
      return clearbitResult;
    }

    // Method 2: Favicon extraction from company website
    if (companyWebsite) {
      const faviconResult = await this.tryFaviconExtraction(companyName, companyWebsite);
      if (faviconResult.logoUrl) {
        this.cacheResult(companyName, faviconResult);
        return faviconResult;
      }
    }

    // Method 3: Try to guess company domain and get favicon
    const domainResult = await this.tryDomainGuessing(companyName);
    if (domainResult.logoUrl) {
      this.cacheResult(companyName, domainResult);
      return domainResult;
    }

    // Method 4: Fallback to default/initials
    const fallbackResult = this.createFallbackLogo(companyName);
    this.cacheResult(companyName, fallbackResult);
    return fallbackResult;
  }

  /**
   * Method 1: Clearbit Logo API
   */
  private async tryCleatbitApi(companyName: string): Promise<LogoResult> {
    try {
      // Clearbit Logo API - free tier available
      const domain = this.guessDomain(companyName);
      const clearbitUrl = `https://logo.clearbit.com/${domain}`;
      
      // Test if logo exists
      const response = await fetch(clearbitUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Clearbit logo found for ${companyName}: ${clearbitUrl}`);
        return this.createResult(clearbitUrl, 'clearbit', companyName);
      }
    } catch (error) {
      console.log(`❌ Clearbit API failed for ${companyName}:`, error);
    }
    
    return this.createResult(null, 'clearbit', companyName);
  }

  /**
   * Method 2: Favicon extraction from known website
   */
  private async tryFaviconExtraction(companyName: string, website: string): Promise<LogoResult> {
    try {
      const domain = this.extractDomain(website);
      const faviconUrl = `https://${domain}/favicon.ico`;
      
      const response = await fetch(faviconUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log(`✅ Favicon found for ${companyName}: ${faviconUrl}`);
        return this.createResult(faviconUrl, 'favicon', companyName);
      }
    } catch (error) {
      console.log(`❌ Favicon extraction failed for ${companyName}:`, error);
    }
    
    return this.createResult(null, 'favicon', companyName);
  }

  /**
   * Method 3: Domain guessing + favicon
   */
  private async tryDomainGuessing(companyName: string): Promise<LogoResult> {
    const possibleDomains = this.generatePossibleDomains(companyName);
    
    for (const domain of possibleDomains) {
      try {
        // Try different favicon paths
        const faviconPaths = [
          '/favicon.ico',
          '/favicon.png',
          '/apple-touch-icon.png',
          '/apple-touch-icon-180x180.png'
        ];
        
        for (const path of faviconPaths) {
          const logoUrl = `https://${domain}${path}`;
          const response = await fetch(logoUrl, { method: 'HEAD' });
          
          if (response.ok) {
            console.log(`✅ Domain guess successful for ${companyName}: ${logoUrl}`);
            return this.createResult(logoUrl, 'favicon', companyName);
          }
        }
      } catch (error) {
        // Continue to next domain
        continue;
      }
    }
    
    return this.createResult(null, 'favicon', companyName);
  }

  /**
   * Method 4: Create fallback logo (company initials)
   */
  private createFallbackLogo(companyName: string): LogoResult {
    const initials = this.getCompanyInitials(companyName);
    const fallbackUrl = this.generateInitialsLogo(initials, companyName);
    
    console.log(`📝 Using fallback logo for ${companyName}: ${initials}`);
    return this.createResult(fallbackUrl, 'fallback', companyName);
  }

  /**
   * Generate company initials from company name
   */
  private getCompanyInitials(companyName: string): string {
    return companyName
      .split(' ')
      .filter(word => word.length > 0 && !['inc', 'llc', 'corp', 'ltd', 'co'].includes(word.toLowerCase()))
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  }

  /**
   * Generate a data URI for initials logo
   */
  private generateInitialsLogo(initials: string, companyName: string): string {
    // Generate a consistent color based on company name
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

  /**
   * Guess company domain from name
   */
  private guessDomain(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .replace(/(inc|llc|corp|ltd|co|company)$/, '') + '.com';
  }

  /**
   * Generate possible domains for a company
   */
  private generatePossibleDomains(companyName: string): string[] {
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
    
    // Common tech company patterns
    if (words.some(w => ['tech', 'software', 'systems', 'solutions'].includes(w))) {
      domains.push(`${words[0]}.io`);
      domains.push(`${words.join('')}.tech`);
    }
    
    return domains;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^www\./, '');
    }
  }

  /**
   * Cache management
   */
  private getCachedLogo(companyName: string): LogoResult | null {
    const cached = this.cache[companyName];
    if (!cached) return null;
    
    const isExpired = Date.now() - new Date(cached.timestamp).getTime() > this.CACHE_DURATION;
    if (isExpired) {
      delete this.cache[companyName];
      this.saveCache();
      return null;
    }
    
    return cached;
  }

  private cacheResult(companyName: string, result: LogoResult): void {
    this.cache[companyName] = result;
    this.saveCache();
  }

  private loadCache(): void {
    try {
      const cached = localStorage.getItem('company-logos-cache');
      if (cached) {
        this.cache = JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Failed to load logo cache:', error);
      this.cache = {};
    }
  }

  private saveCache(): void {
    try {
      localStorage.setItem('company-logos-cache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save logo cache:', error);
    }
  }

  /**
   * Helper to create result object
   */
  private createResult(logoUrl: string | null, source: LogoResult['source'], companyName: string): LogoResult {
    return {
      logoUrl,
      source,
      companyName,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Batch extract logos for multiple companies
   */
  async extractLogos(companies: Array<{name: string, website?: string}>): Promise<LogoResult[]> {
    const results: LogoResult[] = [];
    
    for (const company of companies) {
      const result = await this.extractLogo(company.name, company.website);
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    localStorage.removeItem('company-logos-cache');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalEntries: number, cacheHitRate: number } {
    const totalEntries = Object.keys(this.cache).length;
    // This is a simplified metric - in a real implementation you'd track hits/misses
    return {
      totalEntries,
      cacheHitRate: totalEntries > 0 ? 0.85 : 0 // Estimated
    };
  }
}

// Create singleton instance
export const logoService = new CompanyLogoService(); 