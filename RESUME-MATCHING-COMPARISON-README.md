# Resume Matching Comparison Test

A comprehensive test script that compares the resume matching logic between the Extension and Web App systems side-by-side.

## Features

### 🔧 **Multiple Matching Systems**
- **Extension Logic**: Holistic AI analysis (single powerful GPT-4o call)
- **Web App Logic**: Multi-step pipeline (extract requirements → match resume)
- **Enhanced Logic**: 22-variable statistical analysis system (optional)

### 📄 **File Support**
- Multiple resume uploads
- Drag & drop interface
- Supports PDF, DOC, DOCX, and TXT files
- Real-time file validation

### 🎯 **Comprehensive Analysis**
- Side-by-side comparison of all matching systems
- Match scores, grades, and processing times
- Statistical significance analysis (Enhanced mode)
- Detailed strengths, gaps, and recommendations
- Category-by-category breakdown

### 📊 **Export Capabilities**
- Export results to JSON format (complete data)
- Export results to CSV format (tabular data)
- Timestamped export files
- Summary statistics included

## How to Use

### 1. **Setup**
1. Open `resume-matching-comparison-test.html` in a web browser
2. Enter your OpenAI API key in the configuration section
3. (Optional) Enable Enhanced 22-Variable Matching using the toggle

### 2. **Upload Resumes**
- Click the upload area or drag & drop resume files
- Multiple resumes can be uploaded at once
- Supported formats: PDF, DOC, DOCX, TXT

### 3. **Add Job Descriptions**
- Enter job title, company, and description
- Click "Add Job Description" to add to the test queue
- Multiple job descriptions can be added

### 4. **Run Comparison**
- Click "Run Comparison" to start the analysis
- The system will test each resume against each job description
- Progress is tracked in real-time
- Results are displayed in expandable job cards

### 5. **View Results**
- **Extension Results**: Shows holistic AI analysis with dynamic categories
- **Web App Results**: Shows structured analysis with fixed categories
- **Enhanced Results**: Shows 22-variable statistical analysis (if enabled)
- Click job cards to expand detailed analysis

### 6. **Export Results**
- Click "Export Results" to download comparison data
- Choose between JSON (complete data) or CSV (tabular format)
- Files are timestamped for easy organization

## System Comparison

### Extension Logic (Holistic)
- **Approach**: Single comprehensive AI call
- **Strengths**: More human-like, contextual awareness
- **Output**: Dynamic categories, intuitive analysis
- **Model**: GPT-4o

### Web App Logic (Multi-Step)
- **Approach**: Extract requirements → Match resume
- **Strengths**: Structured, reproducible, rule-based
- **Output**: Fixed categories, weighted scoring
- **Model**: GPT-4o-mini

### Enhanced Logic (22-Variable)
- **Approach**: Statistical variable extraction and comparison
- **Strengths**: Statistical significance, detailed metrics
- **Output**: 22 variables across 4 categories
- **Model**: GPT-4o

## Understanding Results

### Match Scores
- **90-100%**: Excellent match (exceeds requirements)
- **70-89%**: Good match (meets most requirements)
- **50-69%**: Moderate match (some gaps exist)
- **30-49%**: Weak match (major gaps)
- **0-29%**: Poor match (significant misalignment)

### Enhanced System Metrics
- **Total Matches**: Number of matched variables out of 22
- **Confidence Level**: Statistical confidence percentage
- **Significance Level**: Statistical significance (none/significant/strong/excellent)
- **Category Scores**: Weighted scores for each variable category

## Technical Details

### API Requirements
- OpenAI API key with GPT-4o access
- Rate limiting: 1-second delay between requests
- Error handling for API failures

### Data Structure
- Results stored in structured JSON format
- Each system maintains consistent data schema
- Export formats preserve all analysis details

### Browser Compatibility
- Modern browsers with ES6+ support
- Local file handling capabilities
- No server-side dependencies

## Troubleshooting

### Common Issues
1. **API Key Error**: Ensure valid OpenAI API key with GPT-4o access
2. **File Upload Error**: Check file format and size (PDF, DOC, DOCX, TXT)
3. **Processing Error**: Verify internet connection and API rate limits
4. **Export Error**: Ensure browser allows file downloads

### Performance Tips
- Use concise job descriptions (<12,000 characters)
- Limit resume content (<3,000 characters for optimal performance)
- Process in batches for large datasets
- Monitor API usage and rate limits

## Output Examples

### Extension Analysis
```json
{
  "overallScore": 78.5,
  "matchGrade": "good",
  "strengths": ["5+ years Python experience", "AWS certification"],
  "gaps": ["No React experience", "Limited team leadership"],
  "recommendations": ["Highlight relevant projects", "Emphasize collaboration"]
}
```

### Enhanced Analysis
```json
{
  "overallScore": 82.3,
  "total_matches": 16,
  "confidence_level": 95.0,
  "significance_level": "significant",
  "category_scores": {
    "critical_requirements": 85.0,
    "core_competencies": 78.5,
    "experience_factors": 90.0,
    "preferred_qualifications": 65.0
  }
}
```

## Contributing

This test script is designed to be extensible. To add new matching systems:

1. Create a new matcher class following the existing pattern
2. Add UI column for the new system
3. Update the comparison logic to include the new matcher
4. Modify export functions to handle new result format

## License

This test script is part of the AutoApply AI project and follows the same licensing terms. 