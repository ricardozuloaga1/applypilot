# Environment Configuration for AutoApply AI

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# API Keys
APIFY_API_KEY=your_apify_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Adzuna API Credentials (Free tier - 20k calls/month)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Google OAuth Configuration (Optional - for future Google Drive integration)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000

# Google Drive & Sheets IDs (Optional - for future integration)
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
GOOGLE_SHEETS_ID=your_sheets_id

# Application Configuration
PORT=3000
NODE_ENV=development
```

## Google Services Setup

### Google Drive Folder (Future Integration)
- **Folder Name**: AutoApply AI
- **Structure**: Each application stored in subfolder: `{Company Name} – {Job Title}`
- **Files**: `resume.pdf` and `cover_letter.pdf`

### Google Sheets Tracker (Future Integration)
- **Sheet Name**: AutoApply Spreadsheet
- **Columns**: Job Title, Company, Location, Job URL, Date Scraped, Date Applied, Resume Link, Cover Letter Link, Application Status, Notes

### Google OAuth Settings (When Implementing Drive Integration)
- **Authorized JavaScript Origins**: `http://localhost:3000`
- **Authorized Redirect URIs**: `http://localhost:3000`

## Setup Instructions

1. Copy the environment variables above into a new `.env` file in your project root
2. Replace all placeholder values with your actual API keys and credentials
3. For Adzuna API: Sign up at https://developer.adzuna.com/overview for free 20k/month access
4. For OpenAI API: Get your key from https://platform.openai.com/api-keys
5. Google services are optional and for future features (Phases 6-7)

## Required for Current Features (Phases 1-5)

```bash
# Minimum required environment variables for current functionality
OPENAI_API_KEY=your_openai_api_key_here
ADZUNA_APP_ID=your_adzuna_app_id  
ADZUNA_APP_KEY=your_adzuna_app_key
```

## Security Notes

- Never commit the `.env` file to version control (it's in .gitignore)
- Keep API keys secure and rotate them if compromised  
- Use separate keys for development and production environments
- The placeholders above are safe for public repositories 