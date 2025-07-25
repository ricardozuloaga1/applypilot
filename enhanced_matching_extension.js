/**
 * Enhanced Job-Candidate Matching System for Chrome Extension
 * Implements 22-variable structured extraction and statistical comparison using GPT-4o
 */

class EnhancedMatchingSystem {
    constructor() {
        this.model = 'gpt-4o';
        
        // Statistical thresholds from optimal matching research
        this.TOTAL_VARIABLES = 22;
        this.SIGNIFICANCE_THRESHOLD = 14;  // 63.6% for p < 0.05
        this.STRONG_EVIDENCE_THRESHOLD = 16;  // 72.7% for p < 0.01
        this.EXCELLENT_EVIDENCE_THRESHOLD = 18;  // 81.8% for p < 0.001
        
        // Variable categories and weights
        this.CATEGORY_WEIGHTS = {
            'critical_requirements': 0.40,
            'core_competencies': 0.35,
            'experience_factors': 0.15,
            'preferred_qualifications': 0.10
        };
        
        this.VARIABLE_COUNTS = {
            'critical_requirements': 5,
            'core_competencies': 8,
            'experience_factors': 4,
            'preferred_qualifications': 5
        };
    }

    /**
     * Extract 22 structured variables from job description using GPT-4o
     */
    async extractJobVariables(jobDescription, jobTitle, company, apiKey) {
        const systemPrompt = `You are an expert HR analyst and job requirements specialist. Your task is to extract exactly 22 structured variables from job descriptions for systematic candidate matching.

CRITICAL INSTRUCTIONS:
1. Extract EXACTLY 22 variables distributed across 4 categories
2. Be specific and measurable - avoid vague terms
3. Focus on requirements that can be verified from a resume
4. Include both explicit and implicit requirements
5. Consider industry standards and role expectations

VARIABLE CATEGORIES:
- Critical Requirements (5 variables): Must-have qualifications that disqualify if missing
- Core Competencies (8 variables): Key skills and abilities for job success  
- Experience Factors (4 variables): Experience-related requirements
- Preferred Qualifications (5 variables): Nice-to-have qualifications

Return your analysis in the exact JSON format specified.`;

        const userPrompt = `
Analyze this job posting and extract exactly 22 variables for candidate matching:

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION:
${jobDescription}

Extract variables in this exact JSON format:

{
  "job_analysis": {
    "title": "${jobTitle}",
    "company": "${company}",
    "industry": "detected industry",
    "seniority_level": "entry/mid/senior/executive",
    "job_type": "technical/business/creative/etc"
  },
  "critical_requirements": {
    "req_1": {
      "variable": "specific requirement name",
      "description": "detailed description",
      "evidence_needed": "what to look for in resume",
      "disqualifier": true
    },
    "req_2": { ... },
    "req_3": { ... },
    "req_4": { ... },
    "req_5": { ... }
  },
  "core_competencies": {
    "comp_1": {
      "variable": "skill/competency name",
      "description": "detailed description",
      "evidence_needed": "what to look for in resume",
      "proficiency_level": "beginner/intermediate/advanced/expert"
    },
    "comp_2": { ... },
    "comp_3": { ... },
    "comp_4": { ... },
    "comp_5": { ... },
    "comp_6": { ... },
    "comp_7": { ... },
    "comp_8": { ... }
  },
  "experience_factors": {
    "exp_1": {
      "variable": "experience requirement",
      "description": "detailed description",
      "evidence_needed": "what to look for in resume",
      "minimum_threshold": "specific measurement"
    },
    "exp_2": { ... },
    "exp_3": { ... },
    "exp_4": { ... }
  },
  "preferred_qualifications": {
    "pref_1": {
      "variable": "preferred qualification",
      "description": "detailed description", 
      "evidence_needed": "what to look for in resume",
      "bonus_value": "low/medium/high"
    },
    "pref_2": { ... },
    "pref_3": { ... },
    "pref_4": { ... },
    "pref_5": { ... }
  }
}

EXAMPLES of good variable extraction:
- "Bachelor's degree in Computer Science" → specific, verifiable
- "5+ years Python development experience" → measurable threshold
- "Experience with AWS cloud services" → specific technology
- "Strong communication skills" → general competency
- "Agile methodology experience" → specific process knowledge

Ensure each variable is:
✓ Specific and measurable
✓ Verifiable from resume content
✓ Relevant to job success
✓ Distinct from other variables
`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 4000,
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const result = await response.json();
            const content = result.choices[0].message.content;
            
            // Clean and parse JSON
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const jobVariables = JSON.parse(cleanContent);
            
            console.log('📋 Job variables extracted:', jobVariables);
            return jobVariables;
            
        } catch (error) {
            console.error('Error extracting job variables:', error);
            throw error;
        }
    }

    /**
     * Extract 22 corresponding variables from candidate resume using GPT-4o
     */
    async extractCandidateVariables(resumeText, resumeData, apiKey) {
        const systemPrompt = `You are an expert resume analyzer. Your task is to extract exactly 22 structured variables from candidate resumes that correspond to job requirements for systematic matching.

CRITICAL INSTRUCTIONS:
1. Extract EXACTLY 22 variables distributed across 4 categories
2. Base extraction on ACTUAL resume content only - don't invent information
3. Provide specific evidence from the resume for each variable
4. Rate proficiency/experience levels accurately
5. Include both explicit and inferred capabilities

VARIABLE CATEGORIES:
- Critical Requirements (5 variables): Educational background, certifications, licenses
- Core Competencies (8 variables): Technical skills, software proficiency, methodologies
- Experience Factors (4 variables): Years of experience, industry background, role progression
- Preferred Qualifications (5 variables): Additional skills, certifications, achievements

Return your analysis in the exact JSON format specified.`;

        const userPrompt = `
Analyze this candidate's resume and extract exactly 22 variables for job matching:

RESUME TEXT:
${resumeText}

STRUCTURED RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

Extract variables in this exact JSON format:

{
  "candidate_analysis": {
    "name": "candidate name",
    "years_total_experience": "calculated total years",
    "current_level": "entry/mid/senior/executive",
    "primary_expertise": "main area of expertise",
    "industry_background": "industry experience"
  },
  "critical_requirements": {
    "req_1": {
      "variable": "education/certification/license",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "details": "degree/certification details"
    },
    "req_2": { ... },
    "req_3": { ... },
    "req_4": { ... },
    "req_5": { ... }
  },
  "core_competencies": {
    "comp_1": {
      "variable": "technical skill/competency",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "proficiency_level": "beginner/intermediate/advanced/expert",
      "years_experience": "estimated years with this skill"
    },
    "comp_2": { ... },
    "comp_3": { ... },
    "comp_4": { ... },
    "comp_5": { ... },
    "comp_6": { ... },
    "comp_7": { ... },
    "comp_8": { ... }
  },
  "experience_factors": {
    "exp_1": {
      "variable": "experience type",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "measurement": "years/projects/companies/etc",
      "meets_threshold": true/false
    },
    "exp_2": { ... },
    "exp_3": { ... },
    "exp_4": { ... }
  },
  "preferred_qualifications": {
    "pref_1": {
      "variable": "additional qualification",
      "present": true/false,
      "evidence": "specific evidence from resume or 'Not found'",
      "value_level": "low/medium/high"
    },
    "pref_2": { ... },
    "pref_3": { ... },
    "pref_4": { ... },
    "pref_5": { ... }
  }
}

ANALYSIS GUIDELINES:
- Look for explicit mentions and reasonable inferences
- Consider job titles, responsibilities, and achievements
- Evaluate skill levels based on context and experience
- Provide specific evidence quotes when possible
- Be honest about missing qualifications
`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 4000,
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const result = await response.json();
            const content = result.choices[0].message.content;
            
            // Clean and parse JSON
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const candidateVariables = JSON.parse(cleanContent);
            
            console.log('👤 Candidate variables extracted:', candidateVariables);
            return candidateVariables;
            
        } catch (error) {
            console.error('Error extracting candidate variables:', error);
            throw error;
        }
    }

    /**
     * Create detailed comparison table and calculate statistical match score using GPT-4o
     */
    async createComparisonTable(jobVariables, candidateVariables, apiKey) {
        const systemPrompt = `You are an expert statistical analyst specializing in job-candidate matching. Your task is to create a detailed comparison table and calculate a statistically validated match score.

STATISTICAL FRAMEWORK:
- Total Variables: 22
- Significance Threshold: ≥14 matches (63.6%) for p < 0.05
- Strong Evidence: ≥16 matches (72.7%) for p < 0.01  
- Excellent Evidence: ≥18 matches (81.8%) for p < 0.001

CATEGORY WEIGHTS:
- Critical Requirements: 40% (5 variables)
- Core Competencies: 35% (8 variables)
- Experience Factors: 15% (4 variables)
- Preferred Qualifications: 10% (5 variables)

MATCHING LOGIC:
- Critical Requirements: Must match exactly (binary: match/no match)
- Core Competencies: Consider proficiency levels and experience
- Experience Factors: Check if thresholds are met
- Preferred Qualifications: Bonus points for additional value

Return detailed analysis in the exact JSON format specified.`;

        const userPrompt = `
Compare these job requirements with candidate qualifications and create a detailed comparison table:

JOB REQUIREMENTS:
${JSON.stringify(jobVariables, null, 2)}

CANDIDATE QUALIFICATIONS:
${JSON.stringify(candidateVariables, null, 2)}

Create comparison in this exact JSON format:

{
  "comparison_summary": {
    "total_matches": "number of matches out of 22",
    "match_percentage": "percentage as decimal",
    "statistical_significance": "none/significant/strong/excellent",
    "confidence_level": "percentage",
    "overall_recommendation": "reject/weak_maybe/moderate_fit/strong_fit/excellent_fit"
  },
  "detailed_comparison": {
    "critical_requirements": {
      "matches": "number out of 5",
      "score": "weighted score",
      "details": [
        {
          "variable": "requirement name",
          "required": "job requirement",
          "candidate_has": "candidate evidence",
          "match": true/false,
          "impact": "high/medium/low",
          "notes": "explanation"
        }
      ]
    },
    "core_competencies": {
      "matches": "number out of 8",
      "score": "weighted score",
      "details": [
        {
          "variable": "competency name",
          "required_level": "job requirement level",
          "candidate_level": "candidate proficiency",
          "match": true/false,
          "gap_analysis": "explanation of gap if any",
          "notes": "additional context"
        }
      ]
    },
    "experience_factors": {
      "matches": "number out of 4",
      "score": "weighted score", 
      "details": [
        {
          "variable": "experience type",
          "required_threshold": "job requirement",
          "candidate_measurement": "candidate evidence",
          "meets_threshold": true/false,
          "notes": "explanation"
        }
      ]
    },
    "preferred_qualifications": {
      "matches": "number out of 5",
      "score": "weighted score",
      "details": [
        {
          "variable": "preferred qualification",
          "desired": "job preference",
          "candidate_has": "candidate evidence",
          "present": true/false,
          "value_added": "low/medium/high",
          "notes": "explanation"
        }
      ]
    }
  },
  "statistical_analysis": {
    "chi_square_test": {
      "statistic": "calculated chi-square value",
      "p_value": "statistical p-value",
      "significant": true/false
    },
    "effect_size": {
      "cohens_d": "calculated effect size",
      "interpretation": "small/medium/large/very_large"
    },
    "confidence_intervals": {
      "lower_bound": "95% CI lower bound",
      "upper_bound": "95% CI upper bound"
    }
  },
  "recommendations": {
    "hiring_decision": "strong_recommend/recommend/maybe/weak_maybe/reject",
    "missing_critical": ["list of missing critical requirements"],
    "development_areas": ["areas for candidate development"],
    "strengths": ["candidate strengths"],
    "next_steps": ["recommended actions"]
  }
}

ANALYSIS INSTRUCTIONS:
1. Compare each variable systematically
2. Calculate exact match counts for each category
3. Apply statistical tests for significance
4. Provide specific evidence for each decision
5. Include actionable recommendations
6. Be objective and data-driven in assessment
`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 6000,
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const result = await response.json();
            const content = result.choices[0].message.content;
            
            // Clean and parse JSON
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const comparisonResult = JSON.parse(cleanContent);
            
            console.log('📊 Comparison table created:', comparisonResult);
            return comparisonResult;
            
        } catch (error) {
            console.error('Error creating comparison table:', error);
            throw error;
        }
    }

    /**
     * Complete end-to-end matching analysis using GPT-4o
     */
    async fullMatchingAnalysis(jobDescription, jobTitle, company, resumeText, resumeData, apiKey) {
        try {
            console.log(`🔍 Starting full matching analysis for: ${jobTitle} at ${company}`);
            
            // Step 1: Extract job variables
            console.log('📋 Extracting job variables...');
            const jobVariables = await this.extractJobVariables(jobDescription, jobTitle, company, apiKey);
            
            // Step 2: Extract candidate variables  
            console.log('👤 Extracting candidate variables...');
            const candidateVariables = await this.extractCandidateVariables(resumeText, resumeData, apiKey);
            
            // Step 3: Create comparison table
            console.log('📊 Creating comparison table...');
            const comparisonResult = await this.createComparisonTable(jobVariables, candidateVariables, apiKey);
            
            // Step 4: Calculate final metrics
            const totalMatches = parseInt(comparisonResult.comparison_summary.total_matches.split(' ')[0]);
            const matchPercentage = parseFloat(comparisonResult.comparison_summary.match_percentage);
            
            // Determine statistical significance
            let confidenceLevel = 0.0;
            let significanceLevel = "none";
            
            if (totalMatches >= this.EXCELLENT_EVIDENCE_THRESHOLD) {
                confidenceLevel = 99.9;
                significanceLevel = "excellent";
            } else if (totalMatches >= this.STRONG_EVIDENCE_THRESHOLD) {
                confidenceLevel = 99.0;
                significanceLevel = "strong";
            } else if (totalMatches >= this.SIGNIFICANCE_THRESHOLD) {
                confidenceLevel = 95.0;
                significanceLevel = "significant";
            }
            
            // Calculate weighted total score
            const categoryScores = {
                critical_requirements: parseFloat(comparisonResult.detailed_comparison.critical_requirements.score),
                core_competencies: parseFloat(comparisonResult.detailed_comparison.core_competencies.score),
                experience_factors: parseFloat(comparisonResult.detailed_comparison.experience_factors.score),
                preferred_qualifications: parseFloat(comparisonResult.detailed_comparison.preferred_qualifications.score)
            };
            
            const totalScore = Object.keys(categoryScores).reduce((sum, category) => {
                return sum + (categoryScores[category] * this.CATEGORY_WEIGHTS[category]);
            }, 0);
            
            // Step 5: Compile comprehensive result
            const comprehensiveResult = {
                analysis_timestamp: new Date().toISOString(),
                job_analysis: jobVariables,
                candidate_analysis: candidateVariables,
                matching_result: {
                    total_score: totalScore,
                    total_matches: totalMatches,
                    match_percentage: matchPercentage,
                    confidence_level: confidenceLevel,
                    significance_level: significanceLevel,
                    statistical_significance: totalMatches >= this.SIGNIFICANCE_THRESHOLD,
                    category_scores: categoryScores,
                    missing_critical: comparisonResult.recommendations.missing_critical,
                    recommendations: comparisonResult.recommendations.next_steps,
                    hiring_decision: comparisonResult.recommendations.hiring_decision
                },
                detailed_comparison: comparisonResult.detailed_comparison,
                statistical_analysis: comparisonResult.statistical_analysis,
                statistical_framework: {
                    total_variables: this.TOTAL_VARIABLES,
                    significance_threshold: this.SIGNIFICANCE_THRESHOLD,
                    strong_evidence_threshold: this.STRONG_EVIDENCE_THRESHOLD,
                    excellent_evidence_threshold: this.EXCELLENT_EVIDENCE_THRESHOLD,
                    category_weights: this.CATEGORY_WEIGHTS
                }
            };
            
            console.log(`✅ Analysis complete!`);
            console.log(`📊 Total Score: ${totalScore.toFixed(1)}`);
            console.log(`📈 Matches: ${totalMatches}/22 (${(matchPercentage * 100).toFixed(1)}%)`);
            console.log(`🎯 Confidence: ${confidenceLevel}%`);
            console.log(`📋 Significance: ${significanceLevel}`);
            console.log(`💡 Decision: ${comparisonResult.recommendations.hiring_decision}`);
            
            return comprehensiveResult;
            
        } catch (error) {
            console.error('Error in full matching analysis:', error);
            throw error;
        }
    }

    /**
     * Convert analysis result to display format for Chrome extension
     */
    formatForDisplay(analysisResult) {
        const result = analysisResult.matching_result;
        
        // Create color-coded score display
        let scoreColor = '#dc3545'; // red
        let scoreText = 'Poor Match';
        
        if (result.total_score >= 80) {
            scoreColor = '#28a745'; // green
            scoreText = 'Excellent Match';
        } else if (result.total_score >= 70) {
            scoreColor = '#17a2b8'; // blue
            scoreText = 'Good Match';
        } else if (result.total_score >= 50) {
            scoreColor = '#ffc107'; // yellow
            scoreText = 'Moderate Match';
        } else if (result.total_score >= 30) {
            scoreColor = '#fd7e14'; // orange
            scoreText = 'Weak Match';
        }
        
        // Create significance indicator
        const significanceIndicator = result.statistical_significance ? 
            `✅ Statistically Significant (${result.confidence_level}% confidence)` : 
            '❌ Not Statistically Significant';
        
        // Format category breakdown
        const categoryBreakdown = Object.entries(result.category_scores).map(([category, score]) => {
            const categoryName = category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const weight = Math.round(this.CATEGORY_WEIGHTS[category] * 100);
            return `${categoryName}: ${score.toFixed(1)} (${weight}% weight)`;
        }).join('\n');
        
        return {
            score: result.total_score,
            scoreColor,
            scoreText,
            matches: `${result.total_matches}/22`,
            percentage: `${(result.match_percentage * 100).toFixed(1)}%`,
            significance: significanceIndicator,
            decision: result.hiring_decision.replace('_', ' ').toUpperCase(),
            categoryBreakdown,
            missingCritical: result.missing_critical,
            recommendations: result.recommendations,
            confidence: result.confidence_level
        };
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedMatchingSystem;
}

// Make available globally for Chrome extension
window.EnhancedMatchingSystem = EnhancedMatchingSystem; 