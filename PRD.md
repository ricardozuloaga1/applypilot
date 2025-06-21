# 🧾 Product Requirements Document (PRD)

**Project Name:** AutoApply AI  
**Purpose:** Automate the process of job search, resume tailoring, document generation, and application tracking — all from a single web-based UI.

## 1. 🎯 Objectives

- Simplify and automate the job application process
- Use AI to personalize applications at scale
- Provide a dashboard to manage every step from resume parsing to job tracking
- Maintain full control (no reliance on third-party automation tools like Zapier/n8n)

## 2. 👤 Target User

- Professionals actively searching for jobs
- Consultants or freelancers applying to multiple roles
- Students or recent grads optimizing outreach

## 3. 📦 Key Features

### A. Resume Ingestion & Parsing
- Upload resume (PDF or pasted text)
- Extract structured data: name, title, skills, experience
- Summarize background in dashboard

### B. AI-Suggested Job Titles
- Use LLM to suggest 5 suitable job titles based on resume
- Display titles for user selection

### C. Job Board Scraper
- Scrape jobs from Indeed, LinkedIn, or other sources
- Search using suggested titles
- Extract job info: title, company, location, description, link

### D. Document Generator
- Tailor resume & cover letter to each job using OpenAI
- Render final docs as PDFs
- Optional customization templates

### E. Google Drive Integration
- Create folder per job
- Upload resume + cover letter
- Return links for reference

### F. Application Tracker
- Track each job (title, company, date, docs, status)
- Log applications in Google Sheets or internal DB

### G. Web-Based UI
- Upload resume
- See AI job title suggestions
- Trigger job search and scrape results
- Click to generate documents
- View/Download generated docs
- Track job application status
- View system activity logs

## 4. 🖥️ System Architecture

| Layer | Tech Stack |
|-------|------------|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Next.js API Routes or Express, Node.js |
| LLM | OpenAI GPT-4 API |
| Scraping | Apify SDK, SerpAPI, or Puppeteer/Playwright |
| Cloud | Google Drive API |
| Spreadsheet | Google Sheets API or Airtable API |
| Database | Firebase, Supabase, or local DB |
| Auth (opt.) | Clerk, Firebase Auth, or custom session logic |

## 5. 🧭 User Flow

1. Upload resume
2. View extracted summary
3. Get 5 role suggestions
4. Select roles → auto-scrape job boards
5. Display job results in table
6. Click "Generate Docs" → auto-create tailored resume & cover letter
7. Upload to Google Drive
8. Track in dashboard (status, links, dates)

## 6. 🔐 Permissions & Security

- Google OAuth for Drive/Sheets access
- Basic Auth / Single-User access initially
- Resume data stored locally unless user opts to save it

## 7. 📈 Metrics to Track

- Number of jobs scraped per session
- Number of applications generated
- Avg. time saved per job application
- Resume/cover doc generation success/fail count

## 8. 💡 Future Features

- Auto-apply via email or job portal API
- Interview tracker
- LinkedIn integration
- Multi-user SaaS with subscriptions
- Template manager for different job styles 