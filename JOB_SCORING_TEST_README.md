# 🎯 AutoApply AI - Job Scoring Test Script

## Overview

This standalone test script replicates the **exact** scoring and comparison logic from the main AutoApply AI application. It allows you to test multiple job descriptions against multiple resumes in complete isolation to understand how the scoring algorithm works.

## 🔧 What This Script Does

The test script is a **1:1 replica** of the scoring system from your main application, including:

- **Exact GPT-4o prompts** from `matching-system.ts`
- **Identical text preprocessing** and truncation logic
- **Same scoring criteria** (0-100 scale with strict ATS evaluation)
- **Complete analysis matrix** with 10 evaluation categories
- **Detailed breakdown** of strengths, gaps, and recommendations

## 📋 Features

### Core Functionality
- ✅ **Multiple Resume Upload**: PDF, DOCX, TXT files or manual text input
- ✅ **Multiple Job Description Upload**: TXT files or manual text input
- ✅ **All Combinations Testing**: Tests every resume against every job
- ✅ **Real-time Progress Tracking**: Shows current test progress with delays
- ✅ **Detailed Results**: Complete scoring breakdown for each combination

### Analysis Details
- 📊 **Overall Score** (0-100 with grade: Poor/Weak/Moderate/Good/Excellent)
- 💪 **Strengths** - What matches well between resume and job
- ❌ **Gaps** - What's missing or doesn't align
- 💡 **Recommendations** - Actionable advice to improve the match
- 🧠 **AI Reasoning** - Detailed explanation of the score calculation
- 📋 **Analysis Matrix** - 10-category breakdown with evidence and match levels

### Export Options
- 📄 **JSON Export** - Raw data for further analysis
- 📊 **CSV Export** - Spreadsheet-compatible format
- 🌐 **HTML Report** - Formatted report for sharing

## 🚀 How to Use

### Step 1: Setup
1. Open `standalone_job_scoring_test.html` in any modern web browser
2. Enter your OpenAI API key (stored locally, never sent anywhere except OpenAI)

### Step 2: Upload Data

#### Resumes
- **Option A**: Upload multiple resume files (PDF, DOCX, TXT)
- **Option B**: Paste resume content manually and give it a name

#### Job Descriptions  
- **Option A**: Upload multiple job description TXT files
- **Option B**: Paste job content manually with title, company, and location

### Step 3: Run Tests
1. Click **"Run All Combinations"** 
2. The script will test every resume against every job
3. Progress bar shows current status
4. Results appear as each test completes

### Step 4: Analyze Results
- Results are sorted by score (highest matches first)
- Each result shows detailed breakdown
- Export results in your preferred format

## 📊 Understanding the Scoring

### Score Ranges
- **90-100**: Perfect match - candidate exceeds ALL requirements
- **80-89**: Excellent match - meets ALL requirements with some extras  
- **70-79**: Good match - meets MOST requirements with minor gaps
- **60-69**: Moderate match - meets SOME requirements with notable gaps
- **50-59**: Weak match - few requirements met, significant gaps
- **0-49**: Poor match - fundamental misalignment, major gaps

### Analysis Categories
The system evaluates 10 specific categories:
1. **Technical Skills** - Programming languages, tools, technologies
2. **Experience** - Years and type of work experience
3. **Education** - Degrees, certifications, academic background
4. **Certifications & Licenses** - Professional certifications required
5. **Industry / Domain Experience** - Relevant industry background
6. **Seniority Level / Leadership** - Management and leadership experience
7. **Soft Skills & Competencies** - Communication, teamwork, etc.
8. **Location / Work Authorization** - Geographic and legal requirements
9. **Language Proficiency** - Required language skills
10. **Culture / Value Alignment** - Company culture fit

### Match Levels
- **Exceeds** 🟢 - Candidate surpasses requirements
- **Meets** 🔵 - Candidate meets requirements exactly  
- **Partial** 🟡 - Candidate partially meets requirements
- **Missing** 🔴 - Requirement not found in resume
- **N/A** ⚪ - Not specified in job posting

## 🔬 Technical Details

### AI Processing
- **Model**: GPT-4o (same as main application)
- **Timeout**: 60 seconds per job-resume combination
- **Rate Limiting**: 3-second delays between API calls
- **Token Optimization**: Smart truncation preserves key resume sections

### Data Handling
- **Resume Truncation**: Preserves skills, experience, education, licenses, tools sections
- **Job Truncation**: Preserves requirements and responsibilities sections  
- **Content Limits**: 3000 chars for resumes, 8000 chars for job descriptions
- **Format Support**: Handles various file formats and manual input

### Error Handling
- **API Errors**: Detailed error messages for troubleshooting
- **Timeout Handling**: Graceful handling of long-running requests
- **Rate Limiting**: Automatic handling of OpenAI rate limits
- **Validation**: Content validation before processing

## 📁 Sample Test Data

To test the system, you can use:

### Sample Resume Content
```
John Doe
Software Engineer
New York, NY | john.doe@email.com

PROFESSIONAL SUMMARY
Experienced full-stack developer with 5+ years developing web applications using React, Node.js, and Python. Strong background in agile development and team collaboration.

TECHNICAL SKILLS
- Programming: JavaScript, Python, Java, TypeScript
- Frontend: React, Angular, HTML5, CSS3
- Backend: Node.js, Express, Django, Flask
- Databases: PostgreSQL, MongoDB, MySQL
- Cloud: AWS, Docker, Kubernetes

PROFESSIONAL EXPERIENCE
Senior Software Engineer
Tech Corp, New York, NY | 2020 - Present
- Led development of customer-facing web applications serving 10,000+ users
- Implemented CI/CD pipelines reducing deployment time by 50%
- Mentored 3 junior developers and conducted code reviews

Software Developer
StartupCo, San Francisco, CA | 2019 - 2020
- Developed RESTful APIs using Node.js and Express
- Built responsive React components for mobile-first design
- Collaborated with UX team to implement user-centered designs

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2019
```

### Sample Job Description
```
Senior Full Stack Developer
TechStartup Inc.
Remote / San Francisco, CA

ABOUT THE ROLE
We're seeking a Senior Full Stack Developer to join our growing engineering team. You'll be responsible for developing scalable web applications and leading technical initiatives.

REQUIREMENTS
- 4+ years of experience in full-stack development
- Strong proficiency in JavaScript/TypeScript and React
- Experience with Node.js and RESTful API development
- Knowledge of cloud platforms (AWS preferred)
- Bachelor's degree in Computer Science or related field
- Experience with agile development methodologies
- Strong communication and leadership skills

RESPONSIBILITIES
- Design and develop user-facing web applications
- Build and maintain backend services and APIs
- Collaborate with product team on feature development
- Mentor junior developers and conduct code reviews
- Participate in technical decision making

NICE TO HAVE
- Experience with Docker and Kubernetes
- Knowledge of CI/CD pipelines
- Previous startup experience
- Open source contributions
```

## 🚨 Important Notes

### API Usage
- **Cost**: Each test uses OpenAI API credits (~$0.01-0.05 per test)
- **Rate Limits**: Built-in delays prevent exceeding OpenAI limits
- **Privacy**: Your API key and data stay local, only prompts sent to OpenAI

### Best Practices
- **Start Small**: Test with 1-2 resumes and jobs first
- **Quality Data**: Ensure resume and job content is complete and well-formatted
- **API Key**: Use a valid OpenAI API key with sufficient credits
- **Internet**: Stable internet connection required for API calls

### Limitations
- **File Formats**: PDF parsing not implemented (use text extraction tools first)
- **Large Files**: Very large documents will be truncated
- **API Dependency**: Requires active OpenAI API access

## 🆚 Comparison with Main App

This test script uses the **identical logic** from your main application:

| Component | Main App | Test Script |
|-----------|----------|-------------|
| Scoring Logic | `ExtensionMatchingSystem.calculateJobMatch()` | ✅ Exact copy |
| GPT-4o Prompt | `matching-system.ts` prompt | ✅ Exact copy |
| Text Processing | Smart truncation logic | ✅ Exact copy |
| Score Calculation | 0-100 scale with grades | ✅ Exact copy |
| Analysis Matrix | 10-category evaluation | ✅ Exact copy |
| Error Handling | Timeout and rate limit handling | ✅ Exact copy |

## 🔧 Troubleshooting

### Common Issues

**"API key not configured"**
- Ensure you've entered a valid OpenAI API key
- Check that your API key has sufficient credits

**"Content too short"**
- Resume content must be at least 50 characters
- Job description should be comprehensive

**"Rate limit exceeded"** 
- Wait a few minutes and try again
- The script includes automatic delays to prevent this

**"Analysis timed out"**
- Very long job descriptions may timeout
- Try with shorter, more focused content

### Performance Tips
- **Batch Size**: Test 2-3 combinations first to verify setup
- **Content Quality**: Well-formatted content produces better results  
- **Network**: Ensure stable internet connection for API calls

## 📞 Support

This test script replicates your main application's scoring logic exactly. If you encounter issues:

1. **Check Console**: Browser developer console shows detailed logs
2. **Verify API Key**: Ensure OpenAI API key is valid and has credits
3. **Test Content**: Start with known-good resume and job description
4. **Check Network**: Verify internet connection for API calls

## 🎯 Use Cases

This standalone test script is perfect for:
- **Algorithm Testing**: Understanding how the scoring works
- **Content Optimization**: Testing different resume versions
- **Job Analysis**: Comparing multiple job opportunities
- **Benchmarking**: Establishing baseline scores
- **Training**: Learning the system before using the main app

---

**Happy Testing!** 🚀

This script gives you complete visibility into how the AutoApply AI scoring system evaluates job-resume matches, allowing you to optimize both your resume content and job targeting strategy. 