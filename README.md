# 🤖 AutoApply AI

🤖 **Automate your job search with AI-powered resume tailoring, document generation, and application tracking.**

## Features

✅ **Phase 1-4 Complete:**
- 📄 **Resume Upload & Parsing** - AI-powered resume analysis using OpenAI GPT-4
- 🎯 **AI Job Suggestions** - Get personalized job title recommendations based on your background
- 🔍 **Real Job Scraping** - Integrated with Apify LinkedIn Jobs Scraper for live job data
- 📊 **Professional Job Results** - Sortable table with detailed job information

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AutoApply\ AI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the project root:
   ```bash
   # Required for AI features
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Required for real job scraping (optional - falls back to mock data)
   APIFY_API_KEY=your_apify_api_key_here
   
   # Optional: Google integration (for future phases)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
   GOOGLE_SHEETS_ID=your_sheets_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:5001](http://localhost:5001)

## How It Works

### 1. Resume Processing
- Paste your resume text (PDF upload simplified for reliability)
- AI extracts name, title, experience, skills, education, and summary
- Clean, organized display of parsed data

### 2. AI Job Suggestions
- GPT-4 analyzes your background
- Suggests 5 relevant job titles with confidence scores
- Multi-select interface for job search

### 3. Real Job Scraping
- **LinkedIn Integration**: Uses Apify's LinkedIn Jobs Scraper for real job data
- **Fallback Support**: Automatically falls back to demo data if API unavailable
- **Rich Data**: Job titles, companies, locations, salaries, job types, experience levels
- **Smart Filtering**: Deduplication and intelligent sorting

### 4. Job Results
- Professional sortable table
- Direct links to job postings
- Enhanced UI showing data source (LinkedIn vs. demo)
- Salary ranges and job details when available

## API Configuration

### Apify Setup (Recommended for Real Data)
1. Create account at [Apify.com](https://apify.com)
2. Get your API key from the dashboard
3. Add `APIFY_API_KEY=your_key_here` to your `.env` file

**Without Apify**: The app works perfectly with demo data for testing and development.

### OpenAI Setup (Required)
1. Create account at [OpenAI](https://platform.openai.com)
2. Generate an API key
3. Add `OPENAI_API_KEY=your_key_here` to your `.env` file

## Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 for resume parsing and job suggestions
- **Job Scraping**: Apify LinkedIn Jobs Scraper
- **UI Components**: Custom components with beautiful animations
- **State Management**: React hooks

## Project Status

### ✅ Completed Phases
- **Phase 1**: Next.js project setup with Tailwind CSS
- **Phase 2**: Resume upload and AI parsing
- **Phase 3**: AI-powered job title suggestions
- **Phase 4**: Real job scraping with LinkedIn integration

### 🚧 Upcoming Phases
- **Phase 5**: AI document generation (tailored resumes & cover letters)
- **Phase 6**: Google Drive integration for document storage
- **Phase 7**: Application tracking with Google Sheets
- **Phase 8**: Activity logs and UX polish

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `APIFY_API_KEY` | No | Apify API key for real job scraping |
| `GOOGLE_CLIENT_ID` | No | Google OAuth (future phases) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth (future phases) |
| `GOOGLE_DRIVE_FOLDER_ID` | No | Google Drive integration (future) |
| `GOOGLE_SHEETS_ID` | No | Application tracking (future) |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ for job seekers everywhere**
