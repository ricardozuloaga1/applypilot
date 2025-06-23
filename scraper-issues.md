# Scraper Issues: ZipRecruiter & LinkedIn (Playwright)

## ZipRecruiter Playwright Scraper

- **Status:** Blocked by anti-bot measures (Cloudflare or similar)
- **What was tried:**
  - Playwright-based browser automation (headless and non-headless)
  - Realistic user agent, extra HTTP headers, navigator.webdriver stealth
  - Random delays before and after navigation
  - Multiple robust selectors for job cards
- **Observed behavior:**
  - Page loads, but only bot-protection or decoy HTML is served
  - No job cards found, no real job data returned
  - Console logs show "Just a moment..." or similar anti-bot page
- **Root cause:**
  - ZipRecruiter uses advanced bot detection that blocks even sophisticated browser automation from typical IPs
- **Next steps:**
  - Try paid residential/rotating proxies (may be costly and brittle)
  - Use a paid scraping API (e.g., Mantiks, Apify, SerpApi)
  - Consider focusing on other sources with less aggressive protection

---

## LinkedIn Playwright Scraper

- **Status:** Blocked/obfuscated, not feasible for reliable scraping
- **What was tried:**
  - Playwright-based browser automation (headless and non-headless)
  - Manual login in non-headless mode
  - Realistic user agent, extra HTTP headers, navigator.webdriver stealth
  - Waited for job card selectors, tried to print and inspect full HTML
- **Observed behavior:**
  - HTML is heavily obfuscated/minified, no readable job cards or descriptions
  - No clear job data in the DOM, even after login
  - Job data may be loaded dynamically or encoded in JS blobs
- **Root cause:**
  - LinkedIn uses advanced anti-bot and anti-scraping techniques, including obfuscated client-side rendering and login walls
- **Next steps:**
  - Use a paid API (e.g., Mantiks, SerpApi) for public LinkedIn job data
  - Accept that only public jobs (not behind login) may be available via API
  - Monitor for changes, but do not invest further in browser automation for LinkedIn

---

## Recommendations

- **Integrate Mantiks API** (or similar) for LinkedIn and ZipRecruiter job data
- Use Playwright scrapers for sources that are accessible and stable (e.g., SimplyHired)
- Continue to diversify job sources to reduce reliance on any single provider
- Document and monitor anti-bot changes for future opportunities 