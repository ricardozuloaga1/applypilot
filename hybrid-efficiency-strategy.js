/**
 * Hybrid GPT-3.5 vs GPT-4 Efficiency Strategy
 * Optimizes model selection based on job complexity and accuracy requirements
 */

class HybridMatchingStrategy {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.costTracker = {
            gpt35: { tokens: 0, cost: 0 },
            gpt4: { tokens: 0, cost: 0 }
        };
    }

    /**
     * Analyze job complexity to determine optimal model
     */
    analyzeJobComplexity(jobDescription, jobTitle) {
        const complexityFactors = {
            // Technical complexity indicators
            technical: /\b(algorithm|architecture|framework|API|database|cloud|microservices|DevOps|ML|AI)\b/gi,
            
            // Seniority indicators
            senior: /\b(senior|lead|principal|director|VP|executive|manager|head of)\b/gi,
            
            // Specialized skills
            specialized: /\b(PhD|certification|license|security clearance|specialized|expert)\b/gi,
            
            // Industry-specific
            regulated: /\b(healthcare|finance|legal|compliance|audit|FDA|SEC|HIPAA)\b/gi,
            
            // Company size/complexity
            enterprise: /\b(Fortune 500|enterprise|multinational|startup|scale|growth)\b/gi
        };

        let complexityScore = 0;
        let factors = [];

        Object.entries(complexityFactors).forEach(([factor, regex]) => {
            const matches = (jobDescription + ' ' + jobTitle).match(regex);
            if (matches) {
                complexityScore += matches.length;
                factors.push(factor);
            }
        });

        return {
            score: complexityScore,
            factors: factors,
            level: this.getComplexityLevel(complexityScore),
            recommendedModel: this.getRecommendedModel(complexityScore)
        };
    }

    getComplexityLevel(score) {
        if (score >= 8) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    getRecommendedModel(score) {
        if (score >= 6) return 'gpt-4';
        if (score >= 3) return 'gpt-3.5-with-validation';
        return 'gpt-3.5';
    }

    /**
     * Execute matching with optimal model selection
     */
    async performOptimalMatching(jobDescription, jobTitle, company, resumeContent) {
        const complexity = this.analyzeJobComplexity(jobDescription, jobTitle);
        
        console.log(`📊 Job Complexity Analysis:
        Score: ${complexity.score}
        Level: ${complexity.level}
        Factors: ${complexity.factors.join(', ')}
        Recommended: ${complexity.recommendedModel}`);

        switch (complexity.recommendedModel) {
            case 'gpt-4':
                return await this.runGPT4Analysis(jobDescription, jobTitle, company, resumeContent);
            
            case 'gpt-3.5-with-validation':
                return await this.runGPT35WithValidation(jobDescription, jobTitle, company, resumeContent);
            
            default:
                return await this.runGPT35Analysis(jobDescription, jobTitle, company, resumeContent);
        }
    }

    /**
     * GPT-4 Analysis for complex jobs
     */
    async runGPT4Analysis(jobDescription, jobTitle, company, resumeContent) {
        const startTime = Date.now();
        
        const prompt = `You are an expert HR analyst. Perform comprehensive 22-variable job-candidate matching analysis.

JOB: ${jobTitle} at ${company}
DESCRIPTION: ${jobDescription}

RESUME: ${resumeContent}

Provide detailed analysis with:
1. 22 structured variables extraction
2. Statistical confidence levels
3. Detailed gap analysis
4. Hiring recommendation with evidence

Return structured JSON with complete analysis.`;

        const response = await this.callOpenAI('gpt-4', prompt);
        const processingTime = Date.now() - startTime;
        
        this.trackCost('gpt4', response.usage);
        
        return {
            model: 'gpt-4',
            processingTime,
            accuracy: 'high',
            confidence: 95,
            result: JSON.parse(response.choices[0].message.content),
            costEstimate: this.calculateCost('gpt4', response.usage)
        };
    }

    /**
     * GPT-3.5 with validation for medium complexity
     */
    async runGPT35WithValidation(jobDescription, jobTitle, company, resumeContent) {
        const startTime = Date.now();
        
        // First pass with GPT-3.5
        const initialResult = await this.runGPT35Analysis(jobDescription, jobTitle, company, resumeContent);
        
        // Validate with GPT-4 for critical decisions
        if (initialResult.result.overallScore > 80 || initialResult.result.overallScore < 30) {
            console.log('🔍 High-stakes result detected, validating with GPT-4...');
            const validationResult = await this.runGPT4Analysis(jobDescription, jobTitle, company, resumeContent);
            
            return {
                model: 'gpt-3.5-validated',
                processingTime: Date.now() - startTime,
                accuracy: 'high',
                confidence: 90,
                result: validationResult.result,
                costEstimate: initialResult.costEstimate + validationResult.costEstimate,
                validation: 'gpt-4-confirmed'
            };
        }
        
        return {
            ...initialResult,
            model: 'gpt-3.5-standard',
            confidence: 75
        };
    }

    /**
     * GPT-3.5 Analysis for simple jobs
     */
    async runGPT35Analysis(jobDescription, jobTitle, company, resumeContent) {
        const startTime = Date.now();
        
        const prompt = `Analyze job-candidate match:

JOB: ${jobTitle} at ${company}
DESCRIPTION: ${jobDescription}

RESUME: ${resumeContent}

Return JSON with:
{
  "overallScore": 0-100,
  "strengths": ["matched skills/experience"],
  "gaps": ["missing requirements"],
  "recommendation": "hire/consider/pass",
  "reasoning": "detailed explanation"
}`;

        const response = await this.callOpenAI('gpt-3.5-turbo', prompt);
        const processingTime = Date.now() - startTime;
        
        this.trackCost('gpt35', response.usage);
        
        return {
            model: 'gpt-3.5-turbo',
            processingTime,
            accuracy: 'good',
            confidence: 75,
            result: JSON.parse(response.choices[0].message.content),
            costEstimate: this.calculateCost('gpt35', response.usage)
        };
    }

    /**
     * Call OpenAI API
     */
    async callOpenAI(model, prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert HR analyst and ATS system. Provide accurate job-candidate matching analysis.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: model === 'gpt-4' ? 1500 : 800,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * Track costs for analysis
     */
    trackCost(model, usage) {
        const rates = {
            gpt35: { input: 0.0015, output: 0.002 },
            gpt4: { input: 0.03, output: 0.06 }
        };

        const cost = (usage.prompt_tokens * rates[model].input + 
                     usage.completion_tokens * rates[model].output) / 1000;
        
        this.costTracker[model].tokens += usage.total_tokens;
        this.costTracker[model].cost += cost;
    }

    calculateCost(model, usage) {
        const rates = {
            gpt35: { input: 0.0015, output: 0.002 },
            gpt4: { input: 0.03, output: 0.06 }
        };

        return (usage.prompt_tokens * rates[model].input + 
                usage.completion_tokens * rates[model].output) / 1000;
    }

    /**
     * Get cost and performance analytics
     */
    getAnalytics() {
        return {
            totalCost: this.costTracker.gpt35.cost + this.costTracker.gpt4.cost,
            breakdown: {
                'GPT-3.5': {
                    tokens: this.costTracker.gpt35.tokens,
                    cost: this.costTracker.gpt35.cost,
                    percentage: (this.costTracker.gpt35.cost / 
                               (this.costTracker.gpt35.cost + this.costTracker.gpt4.cost)) * 100
                },
                'GPT-4': {
                    tokens: this.costTracker.gpt4.tokens,
                    cost: this.costTracker.gpt4.cost,
                    percentage: (this.costTracker.gpt4.cost / 
                               (this.costTracker.gpt35.cost + this.costTracker.gpt4.cost)) * 100
                }
            }
        };
    }
}

/**
 * Example usage
 */
async function demonstrateHybridStrategy() {
    const matcher = new HybridMatchingStrategy('your-api-key');
    
    // Example 1: Complex Senior Role (will use GPT-4)
    const seniorJob = {
        title: 'Senior Software Architect',
        company: 'Tech Startup',
        description: 'Lead architecture decisions for microservices platform, requiring expertise in cloud infrastructure, API design, and team leadership...'
    };
    
    // Example 2: Standard Role (will use GPT-3.5)
    const standardJob = {
        title: 'Customer Service Representative',
        company: 'Local Business',
        description: 'Handle customer inquiries, process orders, maintain customer records...'
    };
    
    const resume = 'John Doe, Software Engineer with 5 years experience...';
    
    console.log('🚀 Testing Hybrid Strategy:');
    
    const result1 = await matcher.performOptimalMatching(
        seniorJob.description, seniorJob.title, seniorJob.company, resume
    );
    
    const result2 = await matcher.performOptimalMatching(
        standardJob.description, standardJob.title, standardJob.company, resume
    );
    
    console.log('\n📊 Results:');
    console.log(`Senior Role: ${result1.model} (${result1.processingTime}ms, $${result1.costEstimate.toFixed(4)})`);
    console.log(`Standard Role: ${result2.model} (${result2.processingTime}ms, $${result2.costEstimate.toFixed(4)})`);
    
    console.log('\n💰 Cost Analytics:');
    console.log(matcher.getAnalytics());
}

// Export for use in your existing system
module.exports = HybridMatchingStrategy; 