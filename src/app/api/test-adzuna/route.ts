import { NextRequest, NextResponse } from 'next/server';

// Test endpoint for Adzuna API fix validation
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Adzuna Job Description Fix');
    
    // Check if API keys are configured
    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
    
    if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Adzuna API keys not configured',
        instructions: 'Please set ADZUNA_APP_ID and ADZUNA_APP_KEY in your .env file'
      });
    }

    // Test job search
    const jobTitle = 'Legal Technology Consulting Manager';
    const location = 'Remote';
    const what = encodeURIComponent(jobTitle);
    const where = encodeURIComponent(location);
    
    const searchUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${what}&where=${where}&results_per_page=3`;
    
    console.log('🔍 Fetching job search results...');
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Adzuna search API failed: ${searchResponse.status}`,
        statusText: searchResponse.statusText
      });
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No jobs found in search results',
        searchData
      });
    }

    const testJob = searchData.results[0];
    const originalDescription = testJob.description || '';
    
    console.log(`📋 Testing job: ${testJob.title} at ${testJob.company.display_name}`);
    console.log(`📏 Original description length: ${originalDescription.length} characters`);

    // Test enhanced description fetch via scraping
    let enhancedDescription = originalDescription;
    let enhancementSuccess = false;

    if (testJob.redirect_url) {
      console.log(`🔍 Scraping enhanced description from: ${testJob.redirect_url}`);
      
      try {
        const response = await fetch(testJob.redirect_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          redirect: 'follow'
        });
        
        if (response.ok) {
          const html = await response.text();
          // Simple extraction for testing
          const match = html.match(/<div[^>]*(?:class="[^"]*(?:job-description|description)[^"]*"|id="jobDescriptionText")[^>]*>([\s\S]*?)<\/div>/i);
          
          if (match && match[1]) {
            const scraped = match[1]
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .trim();
            
            if (scraped.length > originalDescription.length) {
              enhancedDescription = scraped;
              enhancementSuccess = true;
              console.log(`✅ Enhanced description length: ${enhancedDescription.length} characters`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Clean HTML if present
    const cleanDescription = enhancedDescription
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    // Quality analysis
    const qualityMetrics = {
      originalLength: originalDescription.length,
      enhancedLength: enhancedDescription.length,
      cleanedLength: cleanDescription.length,
      improvementRatio: enhancedDescription.length / Math.max(originalDescription.length, 1),
      hasResponsibilities: cleanDescription.toLowerCase().includes('responsibl'),
      hasQualifications: cleanDescription.toLowerCase().includes('qualific') || cleanDescription.toLowerCase().includes('requirement'),
      hasCompanyInfo: cleanDescription.toLowerCase().includes('about') || cleanDescription.toLowerCase().includes('company'),
      hasBulletPoints: cleanDescription.includes('•') || cleanDescription.includes('*') || cleanDescription.includes('-'),
      hasDetailedContent: cleanDescription.length > 1000,
      enhancementWorked: enhancementSuccess
    };

    const qualityScore = Object.entries(qualityMetrics)
      .filter(([key]) => key.startsWith('has') || key === 'enhancementWorked')
      .reduce((score, [, value]) => score + (value ? 1 : 0), 0);

    return NextResponse.json({
      success: true,
      testResults: {
        jobTitle: testJob.title,
        company: testJob.company.display_name,
        location: testJob.location.display_name,
        jobId: testJob.id,
        qualityMetrics,
        qualityScore: `${qualityScore}/6`,
        status: qualityScore >= 4 ? 'EXCELLENT' : qualityScore >= 3 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        descriptionPreviews: {
          original: originalDescription.substring(0, 300) + '...',
          enhanced: enhancedDescription.substring(0, 300) + '...',
          cleaned: cleanDescription.substring(0, 300) + '...'
        },
        fullDescriptions: {
          original: originalDescription,
          enhanced: enhancedDescription,
          cleaned: cleanDescription
        }
      }
    });

  } catch (error) {
    console.error('❌ Adzuna test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'Check server logs for full error details'
    });
  }
} 