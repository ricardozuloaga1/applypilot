// GPT-4o Prompts for Enhanced Job Matching System
// These are the actual prompts that would be sent to the OpenAI API

class GPT4oPrompts {
    
    // PROMPT 1: Extract job requirements from job description
    static getJobExtractionPrompt(jobDescription) {
        return `
You are an expert HR analyst. Extract EXACTLY 22 specific job requirements from the following job description. 
For each variable, provide specific requirements found in the text, or mark as "not found" if not mentioned.

JOB DESCRIPTION:
${jobDescription}

Extract the following 22 variables in JSON format:

{
    "Required Technical Skills": {
        "found": true/false,
        "requirements": ["specific skill 1", "specific skill 2", ...],
        "evidence": "exact quote from job description"
    },
    "Education Level": {
        "found": true/false,
        "requirements": ["specific degree requirement"],
        "evidence": "exact quote from job description"
    },
    "Years of Experience": {
        "found": true/false,
        "requirements": ["specific years requirement"],
        "evidence": "exact quote from job description"
    },
    "Industry Experience": {
        "found": true/false,
        "requirements": ["specific industry requirements"],
        "evidence": "exact quote from job description"
    },
    "Certifications/Licenses": {
        "found": true/false,
        "requirements": ["specific certifications"],
        "evidence": "exact quote from job description"
    },
    "Programming Languages": {
        "found": true/false,
        "requirements": ["specific programming languages"],
        "evidence": "exact quote from job description"
    },
    "Frameworks/Technologies": {
        "found": true/false,
        "requirements": ["specific frameworks/technologies"],
        "evidence": "exact quote from job description"
    },
    "Database Experience": {
        "found": true/false,
        "requirements": ["specific database requirements"],
        "evidence": "exact quote from job description"
    },
    "Cloud Platforms": {
        "found": true/false,
        "requirements": ["specific cloud platforms"],
        "evidence": "exact quote from job description"
    },
    "Project Management": {
        "found": true/false,
        "requirements": ["specific project management requirements"],
        "evidence": "exact quote from job description"
    },
    "Team Leadership": {
        "found": true/false,
        "requirements": ["specific leadership requirements"],
        "evidence": "exact quote from job description"
    },
    "Communication Skills": {
        "found": true/false,
        "requirements": ["specific communication requirements"],
        "evidence": "exact quote from job description"
    },
    "Problem Solving": {
        "found": true/false,
        "requirements": ["specific problem solving requirements"],
        "evidence": "exact quote from job description"
    },

    "Agile/Scrum Experience": {
        "found": true/false,
        "requirements": ["specific agile/scrum requirements"],
        "evidence": "exact quote from job description"
    },
    "Cross-functional Collaboration": {
        "found": true/false,
        "requirements": ["specific collaboration requirements"],
        "evidence": "exact quote from job description"
    },
    "Advanced Degree": {
        "found": true/false,
        "requirements": ["specific advanced degree requirements"],
        "evidence": "exact quote from job description"
    },

    "Speaking/Teaching Experience": {
        "found": true/false,
        "requirements": ["specific speaking/teaching requirements"],
        "evidence": "exact quote from job description"
    },
    "Language Skills": {
        "found": true/false,
        "requirements": ["specific language requirements"],
        "evidence": "exact quote from job description"
    },
    "Geographic Preferences": {
        "found": true/false,
        "requirements": ["specific geographic requirements"],
        "evidence": "exact quote from job description"
    }
}

INSTRUCTIONS:
1. Be specific - extract exact requirements, not general categories
2. Use exact quotes from the job description as evidence
3. If a requirement is not mentioned, set "found": false and "requirements": []
4. Look for synonyms and implied requirements (e.g., "React experience" implies JavaScript)
5. Return valid JSON only
`;
    }

    // PROMPT 2: Extract candidate qualifications from resume
    static getResumeExtractionPrompt(resumeContent) {
        return `
You are an expert resume analyst. Extract EXACTLY 22 specific qualifications from the following resume. 
For each variable, provide specific qualifications found in the text, or mark as "not found" if not mentioned.

RESUME CONTENT:
${resumeContent}

Extract the following 22 variables in JSON format:

{
    "Required Technical Skills": {
        "found": true/false,
        "qualifications": ["specific skill with experience level", "specific skill 2", ...],
        "evidence": "exact quote from resume"
    },
    "Education Level": {
        "found": true/false,
        "qualifications": ["specific degree achieved"],
        "evidence": "exact quote from resume"
    },
    "Years of Experience": {
        "found": true/false,
        "qualifications": ["total years of experience"],
        "evidence": "exact quote from resume"
    },
    "Industry Experience": {
        "found": true/false,
        "qualifications": ["specific industry experience"],
        "evidence": "exact quote from resume"
    },
    "Certifications/Licenses": {
        "found": true/false,
        "qualifications": ["specific certifications held"],
        "evidence": "exact quote from resume"
    },
    "Programming Languages": {
        "found": true/false,
        "qualifications": ["specific programming languages"],
        "evidence": "exact quote from resume"
    },
    "Frameworks/Technologies": {
        "found": true/false,
        "qualifications": ["specific frameworks/technologies"],
        "evidence": "exact quote from resume"
    },
    "Database Experience": {
        "found": true/false,
        "qualifications": ["specific database experience"],
        "evidence": "exact quote from resume"
    },
    "Cloud Platforms": {
        "found": true/false,
        "qualifications": ["specific cloud platform experience"],
        "evidence": "exact quote from resume"
    },
    "Project Management": {
        "found": true/false,
        "qualifications": ["specific project management experience"],
        "evidence": "exact quote from resume"
    },
    "Team Leadership": {
        "found": true/false,
        "qualifications": ["specific leadership experience"],
        "evidence": "exact quote from resume"
    },
    "Communication Skills": {
        "found": true/false,
        "qualifications": ["specific communication experience"],
        "evidence": "exact quote from resume"
    },
    "Problem Solving": {
        "found": true/false,
        "qualifications": ["specific problem solving experience"],
        "evidence": "exact quote from resume"
    },
    
    "Agile/Scrum Experience": {
        "found": true/false,
        "qualifications": ["specific agile/scrum experience"],
        "evidence": "exact quote from resume"
    },
    "Cross-functional Collaboration": {
        "found": true/false,
        "qualifications": ["specific collaboration experience"],
        "evidence": "exact quote from resume"
    },
    "Advanced Degree": {
        "found": true/false,
        "qualifications": ["specific advanced degree"],
        "evidence": "exact quote from resume"
    },
    
    "Speaking/Teaching Experience": {
        "found": true/false,
        "qualifications": ["specific speaking/teaching experience"],
        "evidence": "exact quote from resume"
    },
    "Language Skills": {
        "found": true/false,
        "qualifications": ["specific language skills"],
        "evidence": "exact quote from resume"
    },
    "Geographic Preferences": {
        "found": true/false,
        "qualifications": ["specific geographic information"],
        "evidence": "exact quote from resume"
    }
}

INSTRUCTIONS:
1. Be specific - extract exact qualifications with experience levels where possible
2. Use exact quotes from the resume as evidence
3. If a qualification is not mentioned, set "found": false and "qualifications": []
4. Look for implied qualifications (e.g., "Django developer" implies Python skills)
5. Include years of experience, proficiency levels, and specific achievements
6. Return valid JSON only
`;
    }

    // PROMPT 3: Create comparison table and analysis
    static getComparisonPrompt(jobRequirements, resumeQualifications) {
        return `
You are an expert hiring manager. Compare the job requirements with candidate qualifications for all 22 variables and create a detailed comparison analysis.

JOB REQUIREMENTS:
${JSON.stringify(jobRequirements, null, 2)}

RESUME QUALIFICATIONS:
${JSON.stringify(resumeQualifications, null, 2)}

Create a detailed comparison analysis in JSON format:

{
    "overall_analysis": {
        "total_score": 0-100,
        "variables_matched": 0-22,
        "match_percentage": 0-100,
        "statistical_significance": "excellent/strong/good/weak",
        "confidence_level": 0-100,
        "hiring_recommendation": "STRONG_RECOMMEND/RECOMMEND/CONSIDER/PASS"
    },
    "variable_analysis": {
        "Required Technical Skills": {
            "is_match": true/false,
            "match_percentage": 0-100,
            "job_requirements": ["req1", "req2", ...],
            "resume_qualifications": ["qual1", "qual2", ...],
            "matched_items": ["item1", "item2", ...],
            "missing_items": ["item1", "item2", ...],
            "analysis": "Detailed comparison explanation",
            "evidence": {
                "job": "exact quote from job description",
                "resume": "exact quote from resume"
            }
        },
        // ... repeat for all 22 variables
    },
    "category_scores": {
        "critical_requirements": {
            "score": 0-100,
            "weight": 40,
            "variables": ["Required Technical Skills", "Education Level", "Years of Experience", "Industry Experience", "Certifications/Licenses"]
        },
        "core_competencies": {
            "score": 0-100,
            "weight": 35,
            "variables": ["Programming Languages", "Frameworks/Technologies", "Database Experience", "Cloud Platforms", "Project Management", "Team Leadership", "Communication Skills", "Problem Solving"]
        },
        "experience_factors": {
            "score": 0-100,
            "weight": 15,
            "variables": ["Cross-functional Collaboration"]
        },
        "preferred_qualifications": {
            "score": 0-100,
            "weight": 10,
            "variables": ["Advanced Degree", "Speaking/Teaching Experience", "Language Skills", "Geographic Preferences"]
        }
    },
    "detailed_recommendation": {
        "strengths": ["strength1", "strength2", ...],
        "gaps": ["gap1", "gap2", ...],
        "overall_assessment": "Detailed hiring recommendation with reasoning"
    }
}

ANALYSIS RULES:
1. Statistical Significance Levels:
   - Excellent (18-22 matches): 99.9% confidence
   - Strong (16-17 matches): 99.0% confidence  
   - Good (14-15 matches): 95.0% confidence
   - Weak (<14 matches): <95% confidence

2. Hiring Recommendations:
   - STRONG_RECOMMEND: 18+ matches, excellent statistical significance
   - RECOMMEND: 16-17 matches, strong statistical significance
   - CONSIDER: 14-15 matches, good statistical significance
   - PASS: <14 matches, weak statistical significance

3. Matching Logic:
   - Use semantic understanding (not just keyword matching)
   - Consider synonyms and related skills
   - Account for experience levels and proficiency
   - Look for transferable skills and implied qualifications

4. Weighted Scoring:
   - Critical Requirements: 40% weight
   - Core Competencies: 35% weight
   - Experience Factors: 15% weight
   - Preferred Qualifications: 10% weight

5. For each variable, provide:
   - Specific items that match
   - Specific items that are missing
   - Detailed analysis of the comparison
   - Evidence quotes from both job and resume

Return valid JSON only.
`;
    }

    // PROMPT 4: Single comprehensive prompt (alternative approach)
    static getComprehensivePrompt(jobDescription, resumeContent) {
        return `
You are an expert hiring manager with advanced statistical analysis skills. Perform a comprehensive job-candidate matching analysis using exactly 22 validated variables.

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeContent}

TASK: Extract requirements and qualifications for all 22 variables, then create a detailed comparison analysis.

THE 22 VARIABLES (with weights):
CRITICAL REQUIREMENTS (40% total weight):
1. Required Technical Skills (10%)
2. Education Level (8%)
3. Years of Experience (8%)
4. Industry Experience (8%)
5. Certifications/Licenses (6%)

CORE COMPETENCIES (35% total weight):
6. Programming Languages (6%)
7. Frameworks/Technologies (6%)
8. Database Experience (5%)
9. Cloud Platforms (5%)
10. Project Management (4%)
11. Team Leadership (4%)
12. Communication Skills (3%)
13. Problem Solving (2%)

EXPERIENCE FACTORS (15% total weight):

16. Agile/Scrum Experience (4%)
17. Cross-functional Collaboration (3%)

PREFERRED QUALIFICATIONS (10% total weight):
18. Advanced Degree (3%)

20. Speaking/Teaching Experience (2%)
21. Language Skills (2%)
22. Geographic Preferences (1%)

RETURN FORMAT:
{
    "job_extraction": {
        "Variable Name": {
            "found": true/false,
            "requirements": ["specific requirement 1", "specific requirement 2"],
            "evidence": "exact quote from job description"
        }
        // ... for all 22 variables
    },
    "resume_extraction": {
        "Variable Name": {
            "found": true/false,
            "qualifications": ["specific qualification 1", "specific qualification 2"],
            "evidence": "exact quote from resume"
        }
        // ... for all 22 variables
    },
    "comparison_analysis": {
        "Variable Name": {
            "is_match": true/false,
            "match_percentage": 0-100,
            "matched_items": ["item1", "item2"],
            "missing_items": ["item1", "item2"],
            "detailed_analysis": "Comprehensive comparison explanation",
            "weight": 0.10
        }
        // ... for all 22 variables
    },
    "statistical_results": {
        "total_weighted_score": 0-100,
        "variables_matched": 0-22,
        "match_ratio": 0-1.0,
        "statistical_significance": "excellent/strong/good/weak",
        "confidence_level": 95.0-99.9,
        "p_value": 0.001-0.05,
        "hiring_recommendation": "STRONG_RECOMMEND/RECOMMEND/CONSIDER/PASS"
    },
    "category_breakdown": {
        "critical_requirements": {"score": 0-100, "matched": 0-5},
        "core_competencies": {"score": 0-100, "matched": 0-8},
        "experience_factors": {"score": 0-100, "matched": 0-4},
        "preferred_qualifications": {"score": 0-100, "matched": 0-5}
    },
    "hiring_summary": {
        "key_strengths": ["strength1", "strength2"],
        "critical_gaps": ["gap1", "gap2"],
        "overall_assessment": "Detailed hiring recommendation with statistical backing"
    }
}

CRITICAL INSTRUCTIONS:
1. Extract SPECIFIC requirements and qualifications (not general categories)
2. Use semantic understanding, not just keyword matching
3. Provide exact quotes as evidence
4. Calculate weighted scores using the specified percentages
5. Apply statistical significance thresholds:
   - 18-22 matches: Excellent (99.9% confidence)
   - 16-17 matches: Strong (99.0% confidence)
   - 14-15 matches: Good (95.0% confidence)
   - <14 matches: Weak (<95% confidence)
6. Return valid JSON only

This analysis will be used for hiring decisions, so accuracy is critical.
`;
    }

    // Helper function to call OpenAI API
    static async callGPT4o(prompt, apiKey) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert HR analyst and hiring manager with advanced statistical analysis skills. You provide detailed, accurate, and statistically validated job-candidate matching analysis.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1, // Low temperature for consistent, analytical responses
                max_tokens: 4000,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    }

    // Complete workflow function
    static async performEnhancedMatching(jobDescription, resumeContent, apiKey) {
        try {
            // Option 1: Use comprehensive single prompt (recommended)
            const prompt = this.getComprehensivePrompt(jobDescription, resumeContent);
            const result = await this.callGPT4o(prompt, apiKey);
            
            return result;

            // Option 2: Use separate prompts (alternative approach)
            /*
            const jobPrompt = this.getJobExtractionPrompt(jobDescription);
            const resumePrompt = this.getResumeExtractionPrompt(resumeContent);
            
            const [jobRequirements, resumeQualifications] = await Promise.all([
                this.callGPT4o(jobPrompt, apiKey),
                this.callGPT4o(resumePrompt, apiKey)
            ]);
            
            const comparisonPrompt = this.getComparisonPrompt(jobRequirements, resumeQualifications);
            const comparison = await this.callGPT4o(comparisonPrompt, apiKey);
            
            return {
                job_extraction: jobRequirements,
                resume_extraction: resumeQualifications,
                comparison_analysis: comparison
            };
            */
        } catch (error) {
            console.error('GPT-4o API Error:', error);
            throw error;
        }
    }
}

// Usage example
/*
const apiKey = 'your-openai-api-key';
const jobDescription = 'Senior Software Engineer job description...';
const resumeContent = 'John Smith resume content...';

GPT4oPrompts.performEnhancedMatching(jobDescription, resumeContent, apiKey)
    .then(result => {
        console.log('Enhanced Matching Result:', result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
*/

module.exports = GPT4oPrompts; 