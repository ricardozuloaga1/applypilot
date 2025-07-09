# 🤖 AutoApply AI - Chrome Extension

An AI-powered Chrome extension that helps you capture job listings, match them with your resume, and generate tailored application documents.

## ✨ Features

- **🎯 Job Capture**: Automatically extract job details from LinkedIn, Indeed, and other job sites
- **📊 AI Resume Matching**: Get compatibility scores and detailed analysis for each job
- **📝 Document Generation**: Create customized cover letters and application documents
- **⭐ Job Management**: Star, sort, and search through your captured jobs
- **🔒 Secure Storage**: All data stored locally in your browser

## 🚀 Installation

1. **Download the Extension**
   - Clone this repository or download the ZIP file
   - Extract to a folder on your computer

2. **Install in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked" and select the extension folder
   - The AutoApply AI icon should appear in your browser toolbar

3. **Set Up Your OpenAI API Key**
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - When you first use AI features, you'll be prompted to enter your API key
   - The key is stored securely in your browser and never shared

## 🎯 How to Use

### 1. Capture Jobs
- Navigate to any job posting (LinkedIn, Indeed, etc.)
- Click the AutoApply AI extension icon
- Click "🎯 Capture Job" to extract job details
- The job will be saved to your Jobs tab

### 2. Upload Your Resume
- In the extension popup, go to the "📥 Capture" tab
- Click "📄 Upload Resume" and select your resume file
- Supported formats: .txt, .docx, .doc (PDF coming soon)
- For best results, use plain text (.txt) format

### 3. Analyze Job Matches
- After uploading your resume, click "📊 Score All Jobs"
- The AI will analyze how well your resume matches each job
- View detailed analysis with strengths, gaps, and recommendations

### 4. Generate Documents
- Go to the "📝 Generate" tab
- Select a job and choose document type (cover letter, etc.)
- The AI will create a tailored document based on the job and your resume

## 🔧 Recent Updates

### v1.0.0 - Job Expansion Fix
- **✅ Fixed job expansion cutoff issue**
- Increased job list container height from 400px to 600px
- Added scrollable job descriptions with 200px max-height
- Improved content visibility when expanding job details

### Security Improvements
- **🔒 Removed hardcoded API keys**
- Added secure API key storage using Chrome's sync storage
- Users now configure their own OpenAI API key
- Enhanced error handling for API key configuration

## 🛠️ Technical Details

- **Manifest Version**: 3
- **Permissions**: activeTab, storage, scripting
- **APIs Used**: OpenAI GPT-4 for job matching and document generation
- **Storage**: Chrome sync storage for settings, local storage for jobs

## 📋 Supported Job Sites

- LinkedIn
- Indeed
- Lever.co
- Greenhouse.io
- Workday
- Most job sites with standard HTML structure

## 🔒 Privacy & Security

- All job data is stored locally in your browser
- Your OpenAI API key is stored securely using Chrome's sync storage
- No data is sent to external servers except OpenAI for AI processing
- You have full control over your data

## 🐛 Troubleshooting

**Job capture not working?**
- Refresh the job page and try again
- Make sure you're on a job posting page (not search results)
- Check if the site is supported

**Resume not uploading?**
- For best results, save your resume as a plain text (.txt) file
- Make sure the file contains readable text
- Word documents (.docx) are supported but may need troubleshooting

**API key issues?**
- Get a new API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Make sure you have credits available in your OpenAI account
- The extension will prompt you to enter your API key when needed

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Try refreshing the page and reloading the extension
3. Check the browser console for error messages
4. Create an issue in this repository

## 🚀 Future Features

- PDF resume support
- More job sites support
- Batch job applications
- Interview preparation tools
- Job search analytics

---

Made with ❤️ for job seekers everywhere! 