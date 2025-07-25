"use client"

import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface CompanyLogoProps {
  companyName: string;
  companyWebsite?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
  alt?: string;
}

interface LogoResult {
  logoUrl: string | null;
  source: 'clearbit' | 'favicon' | 'fallback' | 'cached' | 'error';
  companyName: string;
  timestamp: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({ 
  companyName, 
  companyWebsite,
  size = 'md',
  className,
  showFallback = true,
  alt
}) => {
  const [logoData, setLogoData] = useState<LogoResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6', 
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  useEffect(() => {
    if (!companyName) {
      setLoading(false);
      return;
    }

    extractLogo();
  }, [companyName, companyWebsite]);

  const extractLogo = async () => {
    try {
      setLoading(true);
      setError(false);

      // Try to use client-side logo extraction first (faster)
      const cachedResult = getCachedLogo(companyName);
      if (cachedResult) {
        setLogoData(cachedResult);
        setLoading(false);
        return;
      }

      // Call API route for logo extraction
      const response = await fetch('/api/extract-company-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName,
          companyWebsite
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract logo');
      }

      const result: LogoResult = await response.json();
      setLogoData(result);
      
      // Cache the result
      cacheLogo(companyName, result);
      
    } catch (error) {
      console.error('Error extracting company logo:', error);
      setError(true);
      
      // Create fallback logo
      if (showFallback) {
        const fallbackResult = createClientSideFallback(companyName);
        setLogoData(fallbackResult);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCachedLogo = (company: string): LogoResult | null => {
    try {
      const cache = localStorage.getItem('company-logos-cache');
      if (!cache) return null;
      
      const logoCache = JSON.parse(cache);
      const cached = logoCache[company];
      
      if (!cached) return null;
      
      // Check if cache is expired (7 days)
      const isExpired = Date.now() - new Date(cached.timestamp).getTime() > (7 * 24 * 60 * 60 * 1000);
      if (isExpired) {
        delete logoCache[company];
        localStorage.setItem('company-logos-cache', JSON.stringify(logoCache));
        return null;
      }
      
      return cached;
    } catch {
      return null;
    }
  };

  const cacheLogo = (company: string, result: LogoResult) => {
    try {
      const cache = localStorage.getItem('company-logos-cache') || '{}';
      const logoCache = JSON.parse(cache);
      logoCache[company] = result;
      localStorage.setItem('company-logos-cache', JSON.stringify(logoCache));
    } catch (error) {
      console.warn('Failed to cache logo:', error);
    }
  };

  const createClientSideFallback = (company: string): LogoResult => {
    const initials = getCompanyInitials(company);
    const logoUrl = generateInitialsLogo(initials, company);
    
    return {
      logoUrl,
      source: 'fallback',
      companyName: company,
      timestamp: new Date().toISOString()
    };
  };

  const getCompanyInitials = (company: string): string => {
    return company
      .split(' ')
      .filter(word => word.length > 0 && !['inc', 'llc', 'corp', 'ltd', 'co'].includes(word.toLowerCase()))
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  };

  const generateInitialsLogo = (initials: string, company: string): string => {
    const colors = [
      '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
      '#db2777', '#0891b2', '#65a30d', '#dc2626', '#2563eb'
    ];
    const colorIndex = company.length % colors.length;
    const bgColor = colors[colorIndex];
    
    const svg = `
      <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="${bgColor}" rx="8"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
              fill="white" text-anchor="middle" dy="0.35em">${initials}</text>
      </svg>
    `.trim();
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const handleImageError = () => {
    if (showFallback) {
      const fallbackResult = createClientSideFallback(companyName);
      setLogoData(fallbackResult);
    }
    setError(true);
  };

  if (loading) {
    return (
      <div className={cn(
        'animate-pulse bg-gray-200 rounded border flex items-center justify-center',
        sizeClasses[size],
        className
      )}>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
      </div>
    );
  }

  if (!logoData?.logoUrl && !showFallback) {
    return null;
  }

     if (!logoData?.logoUrl && showFallback) {
     const fallbackResult = createClientSideFallback(companyName);
     return (
       <img
         src={fallbackResult.logoUrl!}
         alt={alt || `${companyName} logo`}
         className={cn(
           'rounded border object-contain bg-white',
           sizeClasses[size],
           className
         )}
       />
     );
   }

   if (logoData?.logoUrl) {
     return (
       <img
         src={logoData.logoUrl}
         alt={alt || `${companyName} logo`}
         className={cn(
           'rounded border object-contain bg-white',
           sizeClasses[size],
           className
         )}
         onError={handleImageError}
         title={`${companyName} (via ${logoData.source})`}
       />
     );
   }

   return null;
};

// Batch component for loading multiple logos
interface CompanyLogoBatchProps {
  companies: Array<{name: string, website?: string}>;
  onLogosLoaded?: (results: LogoResult[]) => void;
}

export const CompanyLogoBatch: React.FC<CompanyLogoBatchProps> = ({ 
  companies, 
  onLogosLoaded 
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companies.length === 0) {
      setLoading(false);
      return;
    }

    extractLogoBatch();
  }, [companies]);

  const extractLogoBatch = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/extract-company-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batch: companies
        })
      });

      if (!response.ok) {
        throw new Error('Failed to extract logos');
      }

      const data = await response.json();
      const results: LogoResult[] = data.results;
      
      // Cache all results
      results.forEach(result => {
        cacheLogo(result.companyName, result);
      });

      onLogosLoaded?.(results);
      
    } catch (error) {
      console.error('Error extracting company logos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cacheLogo = (company: string, result: LogoResult) => {
    try {
      const cache = localStorage.getItem('company-logos-cache') || '{}';
      const logoCache = JSON.parse(cache);
      logoCache[company] = result;
      localStorage.setItem('company-logos-cache', JSON.stringify(logoCache));
    } catch (error) {
      console.warn('Failed to cache logo:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">
        Loading {companies.length} company logos...
      </div>
    );
  }

  return null;
}; 