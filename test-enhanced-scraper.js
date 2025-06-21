// Test script for enhanced job scraping with full descriptions
// This tests the improved Adzuna API integration

const { scrapeAdzunaJobs } = require('./src/lib/alternativeJobSources.ts');

async function testEnhancedScraping() {
  console.log('🔍 Testing Enhanced Job Scraping with Full Descriptions');
  console.log('=' * 60);
  
  try {
    // Test the specific job type mentioned by the user
    const jobs = await scrapeAdzunaJobs('Legal Technology Consulting Manager', 'Remote');
    
    console.log(`\n📊 Found ${jobs.length} jobs`);
    
    if (jobs.length > 0) {
      const firstJob = jobs[0];
      
      console.log('\n📋 Sample Job Details:');
      console.log(`Title: ${firstJob.title}`);
      console.log(`Company: ${firstJob.company}`);
      console.log(`Location: ${firstJob.location}`);
      console.log(`Source: ${firstJob.source}`);
      console.log(`Salary: ${firstJob.salaryRange || 'Not specified'}`);
      console.log(`Job Type: ${firstJob.jobType || 'Not specified'}`);
      console.log(`URL: ${firstJob.url}`);
      
      console.log('\n📄 Description Length Analysis:');
      console.log(`Characters: ${firstJob.description.length}`);
      console.log(`Words: ${firstJob.description.split(' ').length}`);
      console.log(`Lines: ${firstJob.description.split('\n').length}`);
      
      console.log('\n📝 Description Preview (first 500 chars):');
      console.log('-'.repeat(50));
      console.log(firstJob.description.substring(0, 500) + '...');
      console.log('-'.repeat(50));
      
      // Test for quality indicators
      const quality = {
        hasResponsibilities: firstJob.description.toLowerCase().includes('responsibl'),
        hasQualifications: firstJob.description.toLowerCase().includes('qualific') || firstJob.description.toLowerCase().includes('requirement'),
        hasCompanyInfo: firstJob.description.toLowerCase().includes('company') || firstJob.description.toLowerCase().includes('about'),
        hasDetailedContent: firstJob.description.length > 1000,
        hasBulletPoints: firstJob.description.includes('•') || firstJob.description.includes('*') || firstJob.description.includes('-'),
      };
      
      console.log('\n✅ Quality Assessment:');
      Object.entries(quality).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
      });
      
      const overallQuality = Object.values(quality).filter(Boolean).length;
      console.log(`\n🎯 Overall Quality Score: ${overallQuality}/5`);
      
      if (overallQuality >= 3) {
        console.log('🎉 SUCCESS: Job descriptions are comprehensive and suitable for AI document generation!');
      } else {
        console.log('⚠️  WARNING: Job descriptions may need further enhancement.');
      }
    } else {
      console.log('❌ No jobs found. Check API configuration and search terms.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that ADZUNA_APP_ID and ADZUNA_APP_KEY are set in .env');
    console.log('2. Verify internet connection');
    console.log('3. Check API rate limits');
  }
}

// Run the test
testEnhancedScraping(); 