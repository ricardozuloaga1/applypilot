#!/usr/bin/env node

const { chromium } = require('playwright');

// Hardcoded search parameters for now
const JOB_QUERY = 'Software Engineer';
const LOCATION = 'New York, NY';
const MAX_JOBS = 10; // Limit for demo

function randomDelay(min = 1000, max = 2500) {
  return new Promise(res => setTimeout(res, Math.random() * (max - min) + min));
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(JOB_QUERY)}&location=${encodeURIComponent(LOCATION)}`;
  console.log('Navigating to:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await randomDelay();

  // Give the user time to log in manually
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nPlease log in to LinkedIn in the opened browser window if prompted.');
  await new Promise(resolve => rl.question('Press Enter here after you have logged in and see the jobs page...', () => { rl.close(); resolve(); }));

  // Wait for job cards to load, or print page content if not found
  try {
    await page.waitForSelector('.jobs-search-results__list-item', { timeout: 15000 });
  } catch (err) {
    console.error('Job cards not found. Writing full page HTML to linkedin_debug.html for inspection.');
    const fs = require('fs');
    const content = await page.content();
    fs.writeFileSync('linkedin_debug.html', content, 'utf-8');
    await browser.close();
    console.log('Full HTML written to linkedin_debug.html. Please inspect this file to update selectors or debug further.');
    process.exit(1);
  }

  // Scrape job cards
  const jobs = await page.$$eval('.jobs-search-results__list-item', (cards, max) => {
    return cards.slice(0, max).map(card => {
      const title = card.querySelector('h3')?.innerText.trim() || '';
      const company = card.querySelector('.base-search-card__subtitle')?.innerText.trim() || '';
      const location = card.querySelector('.job-search-card__location')?.innerText.trim() || '';
      const link = card.querySelector('a.base-card__full-link')?.href || '';
      return { title, company, location, link };
    });
  }, MAX_JOBS);

  let results = [];
  for (let [i, job] of jobs.entries()) {
    if (!job.link) continue;
    try {
      console.log(`\n[${i+1}/${jobs.length}] Visiting job: ${job.title} at ${job.company}`);
      await page.goto(job.link, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await randomDelay(1500, 3000);
      // Extract description and posting date
      const description = await page.$eval('.description__text, .show-more-less-html__markup', el => el.innerText.trim());
      let posted = '';
      try {
        posted = await page.$eval('.posted-time-ago__text', el => el.innerText.trim());
      } catch {}
      results.push({ ...job, description, posted });
    } catch (err) {
      console.error(`Error scraping job: ${job.link}\n`, err.message);
    }
    await randomDelay();
  }

  await browser.close();
  console.log('\n--- SCRAPED JOBS ---');
  console.log(JSON.stringify(results, null, 2));
  console.log(`\nTotal jobs scraped: ${results.length}`);
})(); 