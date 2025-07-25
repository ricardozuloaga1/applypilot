# Resume Matching Algorithms Documentation

## Overview

This document outlines the resume scoring logic for two different matching systems: the **Extension Algorithm** and the **Web App Algorithm**. Both systems use OpenAI's GPT models but with different approaches, prompts, and scoring methodologies.

---

## 🔍 Extension Algorithm

### **Model & Approach**
- **Model**: GPT-4o (More powerful and contextual)
- **Approach**: Holistic single-pass analysis
- **Score Range**: 0-100 (Harsh grading scale)
- **Analysis Type**: Interpretive matrix breakdown

### **Scoring Criteria**
The Extension uses a strict ATS-style scoring system with the following bands:

| Score Range | Classification | Description |
|-------------|---------------|-------------|
| 90-100 | Perfect match | Candidate exceeds ALL requirements |
| 80-89 | Excellent match | Meets ALL requirements with some extras |
| 70-79 | Good match | Meets MOST requirements with minor gaps |
| 60-69 | Moderate match | Meets SOME requirements with notable gaps |
| 50-59 | Weak match | Few requirements met, significant gaps |
| 0-49 | Poor match | Fundamental misalignment, major gaps |

### **Evaluation Process**
1. **Technical Skills Analysis**: Count specific technical skills mentioned in job vs resume
2. **Experience Evaluation**: Compare years of experience required vs actual
3. **Education/Certification Check**: Verify education/certification requirements
4. **Industry/Domain Alignment**: Assess industry and domain experience match
5. **Seniority Level Assessment**: Evaluate if candidate's level matches job requirements

### **Output Format**
```json
{
  "overallScore": 85,
  "strengths": ["Specific matching skills/experience found"],
  "gaps": ["Specific missing requirements"],
  "recommendations": ["Concrete actionable advice"],
  "reasoning": "Detailed explanation of score calculation",
  "matrix": [
    {
      "category": "Technical Skills",
      "requirement": "Python programming, 5+ years",
      "evidence": "Python developer with 3 years experience",
      "matchLevel": "partial",
      "gapAction": "Highlight advanced Python projects to demonstrate deeper expertise"
    }
  ]
}
```

### **Exact Prompt Used**
```
You are a strict ATS system that provides brutally honest job-resume matching scores. Be very discriminating and use the full 0-100 scale.

SCORING CRITERIA:
- 90-100: Perfect match - candidate exceeds ALL requirements
- 80-89: Excellent match - meets ALL requirements with some extras
- 70-79: Good match - meets MOST requirements with minor gaps
- 60-69: Moderate match - meets SOME requirements with notable gaps
- 50-59: Weak match - few requirements met, significant gaps
- 0-49: Poor match - fundamental misalignment, major gaps

JOB POSTING:
Title: [Job Title]
Company: [Company]
Description: [Job Description]

RESUME:
[Resume Content]

ANALYSIS INSTRUCTIONS:
1. Count specific technical skills mentioned in job vs resume
2. Evaluate years of experience required vs actual
3. Check for education/certification requirements
4. Look for industry/domain experience alignment
5. Assess seniority level match

Be harsh but fair. Don't give sympathy scores. If there are major gaps, reflect this in a low score. Most candidates should score below 70 unless they're truly exceptional matches. Use the full range from 0-100.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.
```

---

## 🔍 Web App Algorithm

### **Model & Approach**
- **Model**: GPT-4o-mini (Faster and more cost-effective)
- **Approach**: Evidence-based variable scoring with exact text matching
- **Score Range**: 0-90 (Weighted scoring system)
- **Analysis Type**: Precise evidence tracking with character offsets

### **Global Weights System**
The Web App uses a weighted scoring system with the following distribution:

| Variable | Weight | Percentage |
|----------|--------|------------|
| Technical Skills | 28 points | 31.1% |
| Experience Level | 18 points | 20.0% |
| Job Functions | 15 points | 16.7% |
| Industry Experience | 10 points | 11.1% |
| Certifications | 7 points | 7.8% |
| Education Requirements | 7 points | 7.8% |
| Soft Skills | 5 points | 5.6% |
| **Total** | **90 points** | **100%** |

### **Criticality Multipliers**
- **must_have**: 1.0x weight (Critical requirements)
- **strong_preference**: 0.7x weight (Important but not critical)
- **nice_to_have**: 0.4x weight (Bonus qualifications)

### **Scoring Rules**
1. **Evidence Requirement**: Only use EXACT text from résumé as evidence
2. **Character Offsets**: Track exact location of evidence in resume text
3. **Match Scoring**: Rate evidence quality from 0.0 to 1.0
4. **No Inference**: Never infer or assume evidence not explicitly stated
5. **Points Calculation**: `requirement_points = weight × crit_bonus × match_score`

### **Thresholds**
- **Auto-pass Overall**: ≥75 points
- **Must-have Minimum**: ≥0.70 match score for all must_have requirements
- **Review Status**: Assigned if any must_have < 0.70 or overall < 75

### **Output Format**
```json
{
  "variables": [
    {
      "name": "Experience Level",
      "details": [
        {
          "jd_text": "6+ years corporate law experience",
          "resume_evidence": "8+ years of corporate law experience",
          "offsets": "180-245",
          "criticality": "must_have",
          "match_score": 0.93
        }
      ],
      "variable_score": 16.7
    }
  ],
  "overall_weighted_score": 80.2,
  "status": "autopass"
}
```

### **Exact Prompt Used**
```
SYSTEM
You are an HR match engine.

GLOBAL_WEIGHTS (sum = 90)  
Technical 28 • Job Functions 15 • Experience 18 • Industry 10 • Certifications 7  
Education 7 • Soft Skills 5

THRESHOLDS  
micro_score_min_for_must_have = 0.70  
auto_pass_overall = 75

RULES
1. For every requirement in the job description, search for EXACT EVIDENCE in the résumé text.  
2. ONLY return evidence that EXISTS VERBATIM in the résumé. DO NOT infer, assume, or create evidence.  
3. If you find exact text that matches the requirement:  
   - Copy the EXACT text from résumé as resume_evidence  
   - Provide the character offsets where this text appears  
   - Score based on how well the exact text matches the requirement (0.0-1.0)  
4. If you find NO exact evidence in the résumé:  
   - Set resume_evidence = ""  
   - Set offsets = ""  
   - Set match_score = 0.0

JOB DESCRIPTION:
Title: [Job Title]
Company: [Company]
Description: [Job Description]

RESUME_TEXT_WITH_OFFSETS:
[Resume with character positions]

CRITICAL: resume_evidence must be EXACT text from the résumé. DO NOT create or infer evidence.
```

---

## 📊 Key Differences Summary

| Aspect | Extension Algorithm | Web App Algorithm |
|--------|-------------------|------------------|
| **Philosophy** | Holistic assessment | Evidence-based analysis |
| **Scoring** | 0-100 harsh grading | 0-90 weighted scoring |
| **Evidence** | Interpretive analysis | Exact text matching only |
| **Model** | GPT-4o (powerful) | GPT-4o-mini (efficient) |
| **Output** | Strengths/gaps/recommendations | Variable scores with evidence |
| **Speed** | Slower but comprehensive | Faster but more rigid |
| **Use Case** | Candidate assessment | Compliance and tracking |

---

## 📋 Sample Resumes for Testing

### **1. John Smith - Senior Corporate Attorney**

```
JOHN SMITH
Senior Corporate Attorney
Email: john.smith@email.com | Phone: (555) 123-4567
San Francisco, CA

PROFESSIONAL SUMMARY
Experienced corporate attorney with 8+ years specializing in mergers & acquisitions, venture capital, and complex corporate finance transactions. Strong background in securities law, corporate governance, and cross-border transactions. Proven track record of successfully closing deals worth over $2 billion.

EXPERIENCE

Senior Associate, Corporate Law | Wilson, Sonsini & Associates | 2019-Present
- Lead counsel on 25+ M&A transactions ranging from $50M to $500M
- Advised technology startups through Series A-C funding rounds
- Managed SEC reporting and compliance for public companies
- Drafted and negotiated complex corporate agreements and joint ventures
- Collaborated with international teams on cross-border transactions

Corporate Attorney | Morrison & Foerster | 2016-2019
- Supported senior partners on large-scale M&A deals
- Conducted due diligence for private equity and venture capital transactions
- Prepared SEC filings and proxy statements
- Advised on corporate governance matters for Fortune 500 companies

EDUCATION
J.D., Harvard Law School | 2016 | Magna Cum Laude
- Harvard Law Review, Editor
- Moot Court Competition, Semi-finalist

B.A., Economics | Stanford University | 2013 | Summa Cum Laude
- Phi Beta Kappa

BAR ADMISSIONS
California State Bar | 2016
New York State Bar | 2017

SKILLS
- M&A and Corporate Finance
- Securities Law and SEC Compliance
- Venture Capital and Private Equity
- Corporate Governance
- Contract Negotiation
- Cross-border Transactions
- Mandarin Chinese (Conversational)

CERTIFICATIONS
- Certified Public Accountant (CPA) | 2014
```

### **2. Sarah Johnson - Criminal Defense Attorney**

```
SARAH JOHNSON
Criminal Defense Attorney
Email: sarah.johnson@email.com | Phone: (555) 987-6543
New York, NY

PROFESSIONAL SUMMARY
Dedicated criminal defense attorney with 5+ years of experience representing clients in state and federal courts. Skilled in trial advocacy, plea negotiations, and appellate work. Strong track record of achieving favorable outcomes for clients facing serious criminal charges.

EXPERIENCE

Criminal Defense Attorney | Johnson & Associates | 2020-Present
- Represent clients in felony and misdemeanor cases including DUI, drug offenses, and white-collar crimes
- Achieved 85% success rate in plea negotiations
- Conducted 15+ jury trials with 70% acquittal rate
- Handle post-conviction appeals and sentence modifications
- Collaborate with private investigators and expert witnesses

Assistant District Attorney | Manhattan District Attorney's Office | 2018-2020
- Prosecuted criminal cases from arraignment through trial
- Managed caseload of 150+ active cases
- Specialized in financial crimes and fraud cases
- Trained junior prosecutors on trial advocacy techniques
- Maintained 90% conviction rate

EDUCATION
J.D., New York University School of Law | 2018
- Criminal Law Journal, Staff Writer
- Legal Aid Society Clinic, Student Attorney

B.A., Political Science | Columbia University | 2015
- Dean's List all semesters

BAR ADMISSIONS
New York State Bar | 2018
U.S. District Court, Southern District of New York | 2019

SKILLS
- Trial Advocacy
- Criminal Procedure
- Evidence Law
- Plea Negotiations
- Appellate Brief Writing
- Client Counseling
- Spanish (Fluent)

NOTABLE CASES
- Successfully defended high-profile embezzlement case resulting in acquittal
- Achieved sentence reduction from 10 years to 3 years in federal drug case
- Won appeal overturning conviction for aggravated assault
```

### **3. Michael Davis - Personal Injury Attorney**

```
MICHAEL DAVIS
Personal Injury Attorney
Email: michael.davis@email.com | Phone: (555) 456-7890
Los Angeles, CA

PROFESSIONAL SUMMARY
Experienced personal injury attorney with 6+ years representing accident victims and their families. Skilled in negotiating with insurance companies and trying cases before juries. Recovered over $15 million in settlements and verdicts for clients.

EXPERIENCE

Senior Associate | Davis & Partners Personal Injury Law | 2019-Present
- Handle complex personal injury cases including auto accidents, medical malpractice, and premises liability
- Negotiated $2.5M settlement for catastrophic injury case
- Achieved $1.8M jury verdict in wrongful death case
- Manage caseload of 75+ active cases
- Mentor junior attorneys and paralegals

Personal Injury Attorney | Miller & Associates | 2018-2019
- Represented clients in motor vehicle accidents and slip-and-fall cases
- Conducted mediations and settlement conferences
- Prepared cases for trial and handled jury selection
- Collaborated with medical experts and accident reconstruction specialists

Insurance Defense Attorney | Pacific Insurance Legal | 2017-2018
- Defended insurance companies in personal injury claims
- Gained valuable insight into insurance company tactics and strategies
- Handled depositions and discovery matters

EDUCATION
J.D., UCLA School of Law | 2017
- Trial Advocacy Competition, Finalist
- Street Law Clinic, Student Attorney

B.A., Psychology | University of Southern California | 2014
- Psychology Honor Society

BAR ADMISSIONS
California State Bar | 2017

SKILLS
- Personal Injury Litigation
- Medical Malpractice
- Premises Liability
- Insurance Law
- Trial Advocacy
- Settlement Negotiations
- Spanish (Conversational)

NOTABLE SETTLEMENTS
- $2.5M - Catastrophic brain injury from auto accident
- $1.8M - Wrongful death verdict
- $950K - Medical malpractice settlement
- $750K - Premises liability case
```

---

## 🎯 Testing Methodology

### **Test Setup**
- **5 Job Descriptions**: Senior Corporate Attorney, Criminal Defense Attorney, Personal Injury Attorney, Immigration Attorney, Family Law Attorney
- **3 Sample Resumes**: Matching the first three job types
- **Comparison Metrics**: Score differences, processing times, match accuracy

### **Expected Outcomes**
- **Extension Algorithm**: Should provide higher scores for obvious matches, detailed recommendations for improvement
- **Web App Algorithm**: Should provide precise evidence tracking, consistent scoring based on weighted variables
- **Score Variations**: Extension tends to be harsher (lower scores), Web App more systematic (evidence-based)

### **Analysis Points**
1. **Score Distribution**: How scores compare between systems
2. **Processing Time**: Extension (slower, more comprehensive) vs Web App (faster, more focused)
3. **Match Quality**: Accuracy of identifying relevant experience
4. **Actionability**: Extension provides recommendations, Web App provides evidence gaps

---

## 📊 Export and Analysis

The test system provides comprehensive data export in multiple formats:

- **Summary CSV**: Quick comparison overview
- **Detailed CSV**: Complete analysis breakdown with all variables
- **Matrix CSV**: Requirement-by-requirement analysis
- **JSON Export**: Complete raw data for further analysis

This allows for statistical analysis, performance comparisons, and algorithm optimization based on real-world testing data. 