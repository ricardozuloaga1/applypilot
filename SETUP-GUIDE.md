# 🚀 AutoApply AI Job Matching Setup Guide

## 🔑 Step 1: Add Your OpenAI API Key

1. **Open `popup.js`** in your code editor
2. **Find and replace** both instances of `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key
3. **Get your API key** from: [OpenAI API Keys](https://platform.openai.com/api-keys)

**Example:**
```javascript
// Replace this:
'Authorization': 'Bearer YOUR_OPENAI_API_KEY_HERE'

// With this (using your actual key):
'Authorization': 'Bearer sk-proj-abc123xyz...'
```

## 🔧 Step 2: Load the Extension

1. **Open Chrome** → `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select your folder**: `/Users/ricardozuloaga/AutoApply AI`
5. **Confirm** AutoApply AI appears in your extensions

## 🧪 Step 3: Test the Features

### A. Upload Your Resume
- Click the **AutoApply AI extension icon**
- Go to **"📥 Capture" tab**
- Click **"📄 Upload Resume"**
- Select your PDF/DOC/DOCX resume

### B. Capture & Score Jobs
- Visit a job posting (LinkedIn, Indeed, etc.)
- Click the **floating "🤖 Capture" button** or extension popup's **"🎯 Capture Job"**
- Job should be **automatically scored** (if resume uploaded)

### C. View Color-Coded Results
- Go to **"📋 Jobs" tab** in extension popup
- See jobs with color-coded match scores:
  - 🟢 **Green** = Excellent Match (90-100%)
  - 🔵 **Blue** = Good Match (70-89%)
  - 🟡 **Yellow** = Moderate Match (50-69%)
  - 🟠 **Orange** = Weak Match (30-49%)
  - 🔴 **Red** = Poor Match (0-29%)

### D. Explore Match Analysis
- **Click any job** to expand details
- See **✅ Strengths**, **❌ Gaps**, and **💡 Recommendations**
- Use **sort dropdown** to "Sort by Match Score"

### E. Bulk Analysis
- Use **"📊 Score All Jobs"** to analyze multiple jobs at once
- Monitor costs (typically ~$0.03-$0.04 per job)

## 💰 Cost Management

- **Typical cost**: $0.03-$0.04 per job analysis
- **25 jobs**: ~$1.00
- **100 jobs**: ~$4.00
- **Monitor usage** on [OpenAI Usage Dashboard](https://platform.openai.com/usage)

## 🐛 Troubleshooting

### Job Not Scoring?
- Ensure resume is uploaded
- Check browser console for API errors
- Verify API key is correct and has billing enabled

### Extension Not Loading?
- Check `chrome://extensions/` for error messages
- Refresh the extension if needed
- Ensure all files are in the same directory

### API Errors?
- Verify API key is correct
- Check OpenAI account has billing set up
- Monitor usage limits on OpenAI dashboard

## 🎯 Usage Tips

1. **Upload a comprehensive resume** for better matching accuracy
2. **Sort by match score** to prioritize your job applications
3. **Read the analysis details** to improve your applications
4. **Re-score jobs** when you update your resume
5. **Focus on 🟢🔵 jobs first** for best success rates

## 🔄 Updates & Changes

When you want to modify the AI prompts or scoring logic:
1. Test changes in `job-match-tester.html` first
2. Apply successful changes to `popup.js`
3. Reload the extension in Chrome

---

**🎉 You're all set!** The job matching system should now be fully integrated and working.

**Questions?** Check the browser console for any errors or debug information. 