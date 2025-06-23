#!/usr/bin/env node

const path = require('path');
const readline = require('readline');
require('ts-node').register();

// Import the Playwright scraper
const { scrapeWithPlaywright } = require('./dist/lib/jobScrapers.js');

// Helper to prompt for input
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}

(async () => {
  try {
    console.log('--- Playwright Multi-Source Scraper Test (SimplyHired + ZipRecruiter) ---');
    const jobTitle = (await prompt('Enter job title (default: Software Engineer): ')) || 'Software Engineer';
    const location = (await prompt('Enter location (default: Remote): ')) || 'Remote';
    const maxJobs = 10;

    console.log(`\nScraping for: "${jobTitle}" in "${location}"...\n`);
    const jobs = await scrapeWithPlaywright(jobTitle, location, maxJobs);

    // Separate results by source
    const simplyHiredJobs = jobs.filter(j => j.source && j.source.includes('simplyhired'));
    const zipRecruiterJobs = jobs.filter(j => j.source && j.source.includes('ziprecruiter'));

    // Print SimplyHired results
    console.log('====================');
    console.log('SimplyHired Results:');
    console.log('====================');
    if (simplyHiredJobs.length === 0) {
      console.log('No jobs found from SimplyHired.');
    } else {
      simplyHiredJobs.forEach((job, idx) => {
        console.log(`${idx + 1}. ${job.title} at ${job.company}`);
        console.log(`   📍 ${job.location}`);
        console.log(`   🔗 ${job.url}`);
        console.log(`   📝 Description length: ${job.description.length}`);
        console.log('---');
      });
    }

    // Print ZipRecruiter results
    console.log('\n====================');
    console.log('ZipRecruiter Results:');
    console.log('====================');
    if (zipRecruiterJobs.length === 0) {
      console.log('No jobs found from ZipRecruiter.');
    } else {
      zipRecruiterJobs.forEach((job, idx) => {
        console.log(`${idx + 1}. ${job.title} at ${job.company}`);
        console.log(`   📍 ${job.location}`);
        console.log(`   🔗 ${job.url}`);
        console.log(`   📝 Description length: ${job.description.length}`);
        console.log('---');
      });
    }

    // Print summary
    console.log('\n====================');
    console.log('Summary:');
    console.log('====================');
    console.log(`SimplyHired: ${simplyHiredJobs.length} jobs`);
    console.log(`ZipRecruiter: ${zipRecruiterJobs.length} jobs`);
    console.log('====================\n');
  } catch (error) {
    console.error('Error running Playwright multi-source scraper:', error);
    process.exit(1);
  }
})(); 