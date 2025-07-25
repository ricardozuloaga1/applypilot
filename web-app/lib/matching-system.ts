/**
 * Extension-Mirror Job Matching System
 * Uses GPT-4o holistic scoring approach identical to Chrome extension
 * Replaces evidence-based matching with superior AI-powered analysis
 */

export interface ExtensionMatchResult {
  score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  reasoning: string;
  matrix: ExtensionMatchMatrix[];
  analyzedAt: string;
}

export interface ExtensionMatchMatrix {
  category: string;
  requirement: string;
  evidence: string;
  matchLevel: 'strong' | 'exceeds' | 'partial' | 'missing';
  gapAction: string;
}

export interface JobData {
  title: string;
  company: string;
  description: string;
  location: string;
  salary?: string;
}

export interface Resume {
  content: string;
  name: string;
}

export class ExtensionMatchingSystem {
  private apiKey: string;
  private apiCallCount: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Calculate job match using GPT-4o (mirrors Chrome extension exactly)
   * This is the core method that replicates popup.js calculateJobMatch
   */
  async calculateJobMatch(job: JobData, resume: Resume): Promise<ExtensionMatchResult> {
    console.log('🔍 Calculating job match with GPT-4o (extension logic)...');
    console.log('Starting job match calculation for:', job.title);
    console.log('Resume content length:', resume.content?.length || 0, 'characters');
    console.log('Resume content preview:', resume.content?.substring(0, 200) + '...');
    
    // Validate resume content (like extension)
    if (!resume.content || resume.content.trim().length === 0) {
      console.error('❌ Resume content is empty or unreadable');
      throw new Error('Resume content is empty or unreadable after processing.');
    }
    
    if (resume.content.length < 50) {
      console.error('❌ Resume content too short:', resume.content.length, 'characters');
      throw new Error('Resume content is too short - please check that your file contains readable text.');
    }

    console.log('✅ Resume content validation passed');

    // Smart truncation that preserves key sections (optimized for speed)
    const maxResumeLength = 3000; // ~750 tokens - increased for better context
    const maxJobDescLength = 8000; // ~2000 tokens - reduced for faster processing
    
    // For resume, try to preserve key sections
    let truncatedResume = resume.content;
    let skillsMatch, experienceMatch, educationMatch, licenseMatch, toolsMatch;
    
    if (resume.content.length > maxResumeLength) {
      // Try to keep skills, experience, education, licensing, and tools sections
      skillsMatch = resume.content.match(/(core\s+skills?|skills?|technologies?|expertise)[^]*?(?=\n\n|\n[A-Z]|$)/i);
      experienceMatch = resume.content.match(/(professional\s+experience|experience|employment|work)[^]*?(?=\n\n|\n[A-Z]|$)/i);
      educationMatch = resume.content.match(/(education|degree|university)[^]*?(?=\n\n|\n[A-Z]|$)/i);
      licenseMatch = resume.content.match(/(licenses?|admissions?|bar|certifications?)[^]*?(?=\n\n|\n[A-Z]|$)/i);
      toolsMatch = resume.content.match(/(tools?|platforms?|software|technical\s+skills?)[^]*?(?=\n\n|\n[A-Z]|$)/i);
      
      let keyContent = [skillsMatch?.[0], experienceMatch?.[0], educationMatch?.[0], licenseMatch?.[0], toolsMatch?.[0]]
        .filter(Boolean).join('\n\n');
      
      if (keyContent.length > maxResumeLength) {
        truncatedResume = keyContent.substring(0, maxResumeLength) + '...';
      } else {
        truncatedResume = keyContent || resume.content.substring(0, maxResumeLength) + '...';
      }
    }
    
    // For job description, preserve requirements and responsibilities
    let truncatedJobDesc = job.description || '';
    if (truncatedJobDesc.length > maxJobDescLength) {
      const reqMatch = truncatedJobDesc.match(/(requirements?|qualifications?|must have|essential)[^]*?(?=\n\n|\n[A-Z]|$)/i);
      const respMatch = truncatedJobDesc.match(/(responsibilities?|duties|role|what you'll do)[^]*?(?=\n\n|\n[A-Z]|$)/i);
      
      let keyContent = [reqMatch?.[0], respMatch?.[0]]
        .filter(Boolean).join('\n\n');
      
      if (keyContent.length > maxJobDescLength) {
        truncatedJobDesc = keyContent.substring(0, maxJobDescLength) + '...';
      } else {
        truncatedJobDesc = keyContent || truncatedJobDesc.substring(0, maxJobDescLength) + '...';
      }
    }
    
    // Log truncation info
    if (resume.content && resume.content.length > maxResumeLength) {
      console.log(`Resume truncated: ${resume.content.length} → ${truncatedResume.length} chars`);
      console.log(`Resume sections found: Skills=${!!skillsMatch}, Experience=${!!experienceMatch}, Education=${!!educationMatch}, Licenses=${!!licenseMatch}, Tools=${!!toolsMatch}`);
    }
    if (job.description && job.description.length > maxJobDescLength) {
      console.log(`Job description truncated: ${job.description.length} → ${truncatedJobDesc.length} chars`);
    }
    
    // Log analysis details
    console.log(`Analyzing job: ${job.title} at ${job.company}`);
    console.log(`Estimated tokens: ~${Math.ceil((truncatedResume.length + truncatedJobDesc.length) / 4)}`);
    console.log(`Using improved scoring system with smart truncation`);
    
    // EXACT GPT-4o prompt from extension - FIXED TO PREVENT HALLUCINATION
    const matchPrompt = `
You are a strict ATS system that provides brutally honest job-resume matching scores. Be very discriminating and use the full 0-100 scale.

CRITICAL RULE: You MUST ONLY cite information that is found in the resume text. Do not infer, interpret, or assume information beyond what is written. However, you must be thorough in analyzing the resume content before marking something as missing. If something is not mentioned in the resume, state "Not mentioned in resume" in the evidence field.

SCORING CRITERIA:
- 90-100: Perfect match - candidate exceeds ALL requirements
- 80-89: Excellent match - meets ALL requirements with some extras
- 70-79: Good match - meets MOST requirements with minor gaps
- 60-69: Moderate match - meets SOME requirements with notable gaps
- 50-59: Weak match - few requirements met, significant gaps
- 0-49: Poor match - fundamental misalignment, major gaps

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${truncatedJobDesc}
Location: ${job.location}
${job.salary ? `Salary: ${job.salary}` : ''}

RESUME:
${truncatedResume}

ANALYSIS INSTRUCTIONS:
1. Count specific technical skills mentioned in job vs resume
2. Evaluate years of experience required vs actual
3. Check education and certification requirements
4. Look for industry/domain experience alignment
5. Assess seniority level and leadership scope
6. Verify location or work-authorization fit
7. Identify language proficiency requirements
8. Note soft-skill keywords or cultural values the job stresses

CATEGORIES TO EVALUATE  
(use **exactly** these names in "matrix[].category"):
1. Technical Skills
2. Experience
3. Education
4. Certifications & Licenses
5. Industry / Domain Experience
6. Seniority Level / Leadership
7. Soft Skills & Competencies
8. Location / Work Authorization
9. Language Proficiency
10. Culture / Value Alignment

For **every** category above, create ONE matrix entry.  
If the job posting does **not** mention that category set  
"requirement": "Not specified in job posting" and "matchLevel": "N/A".

KNOCK-OUTS (optional)  
Add a "knockOuts" array in the JSON you return.  
Populate it with any MUST-HAVE phrases you detect in the job text
(e.g., “US Work Authorization”, “PMP certification”).  
If any knock-out item is **missing** in the resume, cap the overallScore at **49** even after weighting.

EVIDENCE REQUIREMENTS:
- Carefully analyze the resume text to find relevant information
- Use direct quotes or accurate paraphrases from the resume text
- Do NOT infer skills, experience, or qualifications not explicitly stated
- If information is missing, write "Not mentioned in resume"
- If years of experience aren't specified, write "Experience duration not specified"
- Look for related information that may satisfy requirements (e.g., bar admissions, degrees, software tools)
- Be thorough in your analysis before marking something as "Not mentioned"

Be harsh but fair. Don't give sympathy scores. If there are major gaps, reflect this in a low score. Most candidates should score below 70 unless they're truly exceptional matches. Use the full range from 0-100.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown formatting like \`\`\`

Format response as JSON with matrix structure:
{
  "overallScore": 45,
  "strengths": ["Specific matching skills/experience found"],
  "gaps": ["Specific missing requirements"],
  "recommendations": ["Concrete actionable advice"],
  "reasoning": "Detailed explanation of score calculation",
  "matrix": [
    { "category": "Technical Skills",           "requirement": "Python, 5+ yrs",                 "evidence": "Resume mentions Python but duration not specified",                 "matchLevel": "partial", "gapAction": "Add total years of Python experience" },
    { "category": "Experience",                 "requirement": "Senior developer role",          "evidence": "Not mentioned in resume",                                       "matchLevel": "missing", "gapAction": "Highlight any leadership or senior duties" },
    { "category": "Education",                  "requirement": "BS in CS",                       "evidence": "MS in CS from State Univ.",                                     "matchLevel": "exceeds", "gapAction": "Emphasize advanced degree coursework" },
    { "category": "Certifications & Licenses",  "requirement": "AWS Solutions Architect",        "evidence": "Not mentioned in resume",                                       "matchLevel": "missing", "gapAction": "List cloud certifications or training" },
    { "category": "Industry / Domain Experience","requirement": "FinTech background",            "evidence": "Not mentioned in resume",                                       "matchLevel": "missing", "gapAction": "Add finance-related project examples" },
    { "category": "Seniority Level / Leadership","requirement": "Lead / Manager experience",     "evidence": "Experience duration not specified",                              "matchLevel": "partial", "gapAction": "Quantify team size led" },
    { "category": "Soft Skills & Competencies",  "requirement": "Strong communication",          "evidence": "Resume states 'excellent written communication'",                "matchLevel": "meets",   "gapAction": "Provide impact examples" },
    { "category": "Location / Work Authorization","requirement": "US work authorization",       "evidence": "US citizen (stated)",                                           "matchLevel": "meets",   "gapAction": "None" },
    { "category": "Language Proficiency",        "requirement": "Spanish fluency",               "evidence": "Resume lists Spanish (professional)",                           "matchLevel": "meets",   "gapAction": "Add certification if available" },
    { "category": "Culture / Value Alignment",   "requirement": "Agile, collaborative mindset",  "evidence": "Not mentioned in resume",                                       "matchLevel": "missing", "gapAction": "Mention Agile team experience" }
  ]
}
`;

    // Create AbortController for timeout (increased for complex jobs)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a strict ATS system that provides brutally honest, discriminating job-resume match scores. Use the full 0-100 scale and be very analytical. Return only valid JSON.'
            },
            {
              role: 'user',
              content: matchPrompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        const content = result.choices[0].message.content;
        
        // Track API call
        this.incrementApiCalls();
        
        // Parse the JSON response (exact logic from extension)
        try {
          // Clean up the response - remove markdown formatting if present
          let cleanContent = content.trim();
          if (cleanContent.startsWith('```json')) {
            cleanContent = cleanContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
          }
          
          const matchData = JSON.parse(cleanContent);
          
          return {
            score: Math.max(0, Math.min(100, matchData.overallScore || 0)),
            strengths: matchData.strengths || [],
            gaps: matchData.gaps || [],
            recommendations: matchData.recommendations || [],
            reasoning: matchData.reasoning || '',
            matrix: matchData.matrix || [],
            analyzedAt: new Date().toISOString()
          };
        } catch (parseError) {
          console.error('Failed to parse match analysis:', parseError);
          // Fallback: extract score from text (like extension)
          const scoreMatch = content.match(/(\d+)/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
          
          return {
            score: Math.max(0, Math.min(100, score)),
            strengths: [],
            gaps: [],
            recommendations: [],
            reasoning: content,
            matrix: [],
            analyzedAt: new Date().toISOString()
          };
        }
      } else {
        const error = await response.json();
        console.error('Job Match API Error Details:', error);
        
        // Handle specific API errors with clear messaging
        if (error.error?.message?.includes('tokens per min') || 
            error.error?.message?.includes('Rate limit') || 
            response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        } else if (error.error?.message?.includes('Request too large') || 
                   error.error?.message?.includes('maximum context length')) {
          throw new Error('Job description too large for analysis. Try scoring this job individually.');
        } else if (response.status === 503) {
          throw new Error('OpenAI service temporarily unavailable. Please try again in a moment.');
        } else if (response.status >= 500) {
          throw new Error('Server error occurred. Please try again.');
        }
        
        throw new Error(error.error?.message || `API Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Job match calculation error:', error);
      
      // Handle different error types (like extension)
      if (error.name === 'AbortError') {
        console.warn('Job match calculation timed out after 60 seconds');
        throw new Error('Analysis timed out. This job may have a very long description. Please try again or try scoring it individually.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Calculate job match with retry logic (mirrors extension)
   */
  async calculateJobMatchWithRetry(job: JobData, resume: Resume, maxRetries: number = 3): Promise<ExtensionMatchResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.calculateJobMatch(job, resume);
        return result;
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed for job ${job.title}:`, error);
        
        if (error.message.includes('Rate limit') && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 10000; // Exponential backoff: 20s, 40s, 80s
          console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        throw error; // Re-throw if max retries reached or different error
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Helper method to get score status classification (like extension)
   */
  getScoreStatus(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'moderate';
    return 'needs-improvement';
  }

  getMatchLevel(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good'; 
    if (score >= 50) return 'moderate';
    if (score >= 30) return 'weak';
    return 'poor';
  }

  /**
   * Track API usage (simplified version of extension logic)
   */
  private incrementApiCalls(): void {
    this.apiCallCount++;
    console.log(`API calls made: ${this.apiCallCount}`);
  }

  /**
   * Get API call count
   */
  getApiCallCount(): number {
    return this.apiCallCount;
  }
} 