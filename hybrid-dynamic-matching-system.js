/**
 * Fixed 8-Variable Job Matching System
 * Streamlined approach focusing on core essential requirements
 * No dynamic variables - strict matching on 8 universal criteria
 */

class HybridDynamicMatchingSystem {
    constructor(apiKey) {
        this.apiKey = apiKey;
        
        // FIXED 8 VARIABLES SYSTEM - OPTIMIZED WEIGHTS
        this.FIXED_VARIABLES = [
            {
                name: "Experience Level",
                weight: 0.20,
                description: "Years of relevant experience required",
                patterns: ["years", "experience", "minimum", "required experience", "junior", "senior", "entry level"]
            },
            {
                name: "Technical Skills",
                weight: 0.31,
                description: "Required technologies, tools, and software",
                patterns: ["technical skills", "software", "programming", "tools", "systems", "technologies", "platforms"]
            },
            {
                name: "Job Functions",
                weight: 0.13,
                description: "Core responsibilities and duties",
                patterns: ["responsibilities", "duties", "functions", "tasks", "activities", "role"]
            },
            {
                name: "Industry Experience",
                weight: 0.11,
                description: "Specific industry or domain knowledge",
                patterns: ["industry", "domain", "sector", "field experience", "background", "vertical"]
            },
            {
                name: "Education Requirements", 
                weight: 0.09,
                description: "Degree level and field requirements",
                patterns: ["Bachelor's", "Master's", "PhD", "degree", "diploma", "education", "major", "field of study"]
            },
            {
                name: "Certifications",
                weight: 0.09,
                description: "Professional certifications and licenses",
                patterns: ["certification", "license", "certified", "licensed", "credential", "certificate"]
            },
            {
                name: "Soft Skills",
                weight: 0.07,
                description: "Communication, leadership, and interpersonal skills",
                patterns: ["communication", "leadership", "teamwork", "analytical", "problem solving", "interpersonal"]
            },
            {
                name: "Special Requirements",
                weight: 0.00,
                description: "Security clearance, travel, work authorization - BINARY GATE",
                patterns: ["clearance", "travel", "authorization", "physical", "security", "visa", "citizenship"],
                isBinaryGate: true
            }
        ];
        
        this.totalVariables = 8;
    }

    /**
     * Extract requirements for all 8 fixed variables from job description
     */
    async extractJobRequirements(jobDescription, jobTitle, company) {
        const prompt = `You are an expert HR analyst. Analyze this job posting and extract requirements for each of the 8 core variables.

JOB TITLE: ${jobTitle}
COMPANY: ${company}
JOB DESCRIPTION: ${jobDescription}

Extract requirements for these 8 variables ONLY. Be strict - only extract requirements that are explicitly mentioned or clearly implied.

Return in this exact JSON format:
{
    "variables": [
        {
            "name": "Experience Level",
            "job_requirements": "Clear statement of what experience the job requires (e.g., '5+ years of software development experience')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        },
        {
            "name": "Education Requirements",
            "job_requirements": "Clear statement of education requirements (e.g., 'Bachelor's degree in Computer Science required')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        },
        {
            "name": "Technical Skills",
            "job_requirements": "Clear statement of technical skills required (e.g., 'Proficiency in React, Node.js, and Python required')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        },
        {
            "name": "Certifications",
            "job_requirements": "Clear statement of certifications required (e.g., 'AWS certification preferred')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        },
        {
            "name": "Soft Skills",
            "job_requirements": "Clear statement of soft skills required (e.g., 'Strong communication and leadership skills')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        },
        {
            "name": "Industry Experience",
            "job_requirements": "Clear statement of industry experience required (e.g., 'Experience in fintech industry preferred')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        },
        {
            "name": "Job Functions",
            "job_requirements": "Clear statement of job functions required (e.g., 'Design and develop scalable applications')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        },
        {
            "name": "Special Requirements",
            "job_requirements": "Clear statement of special requirements (e.g., 'Security clearance required, 20% travel')",
            "requirements_evidence": "Direct quote from job description showing this requirement",
            "found": true/false
        }
    ]
}

RULES:
1. Only extract requirements explicitly mentioned in the job description
2. Set "found": false if no requirements are mentioned for that variable
3. Be strict - don't infer or assume requirements not clearly stated
4. Include exact quotes as evidence
5. Write job_requirements in clear, professional language
6. Focus on must-have requirements, not nice-to-have preferences`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 2000,
                    temperature: 0.1
                })
            });

            const data = await response.json();
            
            // Check if API call was successful
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}. Response: ${JSON.stringify(data)}`);
            }
            
            // Check if response has expected structure
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error(`Invalid API response structure: ${JSON.stringify(data)}`);
            }
            
            const content = data.choices[0].message.content;
            
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error extracting job requirements:', error);
            throw error;
        }
    }

    /**
     * Evaluate candidate against extracted job requirements
     */
    async evaluateCandidate(resumeText, jobRequirements) {
        const prompt = `You are an expert resume evaluator. Compare this candidate's resume against the job requirements for each variable.

CANDIDATE RESUME:
${resumeText}

JOB REQUIREMENTS:
${JSON.stringify(jobRequirements.variables, null, 2)}

For each variable, evaluate the candidate's match and provide a score from 0-100.

Return in this exact JSON format:
{
    "evaluation": [
        {
            "variable": "Experience Level",
            "score": 85,
            "job_requirements": "Exactly what the job requires for this variable",
            "candidate_evidence": "Specific evidence from resume showing candidate's background",
            "match_quality": "Strong/Moderate/Weak/None"
        }
    ],
    "overall_score": 78,
    "summary": "Brief overall assessment"
}

SCORING GUIDELINES:
- 90-100: Exceeds requirements significantly (explicit evidence)
- 80-89: Meets requirements well (explicit evidence)
- 70-79: Meets basic requirements (explicit evidence)
- 60-69: Partially meets requirements (explicit evidence)
- 40-59: Below requirements but some evidence (explicit evidence)
- 1-39: No explicit evidence but reasonable inference can be made
- 0: No evidence found and no reasonable inference possible OR no requirements exist

CRITICAL SCORING RULES:
1. **SPECIAL CASE**: If the job has NO REQUIREMENTS for a variable (e.g., "No specific certifications required"), score must be 0 - you cannot score something that doesn't exist
2. If NO evidence is found and NO reasonable inference can be made, score must be 0
3. If no explicit evidence but reasonable inference is possible based on related experience, score 1-39
4. If explicit evidence is found, score 40+ based on how well it meets requirements
5. Never give a score above 39 without explicit evidence in the resume

EXAMPLES OF REASONABLE INFERENCE (1-39 range):
- Communication skills: Can be inferred from leadership roles, client-facing work, or training others
- Industry knowledge: Can be inferred from working in similar companies or roles
- Problem-solving: Can be inferred from complex project management or troubleshooting experience

FORMATTING REQUIREMENTS:
1. job_requirements: State exactly what the job requires (e.g., "The job requires 5+ years of software development experience")
2. candidate_evidence: State what the candidate has (e.g., "The candidate has 6 years of software development experience across multiple companies")
3. Be clear and specific - avoid vague statements
4. If no requirements found for a variable, state "No specific requirements mentioned for this variable"
5. If no evidence found in resume, state "No evidence found in resume for this requirement"
6. If scoring based on inference, state "No explicit evidence but can infer from [specific experience]"

CRITICAL NO REQUIREMENTS RULE:
- If job_requirements = "No specific requirements mentioned for this variable", then score = 0
- If job_requirements = "No specific [X] required", then score = 0
- Example: If no certifications required, score = 0 (not 100%)

STRICT EVIDENCE-BASED SCORING: Score 0 for no evidence/inference OR no requirements, 1-39 for reasonable inference, 40+ only for explicit evidence.`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 2000,
                    temperature: 0.1
                })
            });

            const data = await response.json();
            
            // Check if API call was successful
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}. Response: ${JSON.stringify(data)}`);
            }
            
            // Check if response has expected structure
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error(`Invalid API response structure: ${JSON.stringify(data)}`);
            }
            
            const content = data.choices[0].message.content;
            
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            
            const evaluation = JSON.parse(jsonMatch[0]);
            
            // Post-processing: Ensure variables with no requirements are scored as 0
            if (evaluation.evaluation) {
                evaluation.evaluation.forEach(item => {
                    const noRequirementsPatterns = [
                        /no specific .* (required|mentioned)/i,
                        /no .* requirements/i,
                        /not required/i,
                        /not mentioned/i,
                        /no requirements found/i
                    ];
                    
                    const hasNoRequirements = noRequirementsPatterns.some(pattern => 
                        pattern.test(item.job_requirements)
                    );
                    
                    if (hasNoRequirements) {
                        item.score = 0;
                        item.match_quality = "None";
                        // Update candidate evidence to be clearer
                        if (item.candidate_evidence === item.job_requirements) {
                            item.candidate_evidence = "No evaluation needed - no requirements specified";
                        }
                    }
                });
            }
            
            return evaluation;
        } catch (error) {
            console.error('Error evaluating candidate:', error);
            throw error;
        }
    }

    /**
     * Main matching function - simplified for 8 variables
     */
    async performMatching(jobDescription, jobTitle, company, resumeText) {
        try {
            console.log('Starting 8-variable matching process...');
            
            // Step 1: Extract job requirements
            console.log('Step 1: Extracting job requirements...');
            const jobRequirements = await this.extractJobRequirements(jobDescription, jobTitle, company);
            
            // Step 2: Evaluate candidate
            console.log('Step 2: Evaluating candidate...');
            const evaluation = await this.evaluateCandidate(resumeText, jobRequirements);
            
            // Step 3: Calculate weighted score
            console.log('Step 3: Calculating weighted score...');
            const weightedScore = this.calculateWeightedScore(evaluation);
            
            return {
                success: true,
                jobRequirements: jobRequirements,
                evaluation: evaluation,
                weightedScore: weightedScore,
                totalVariables: this.totalVariables,
                processingTime: Date.now()
            };
            
        } catch (error) {
            console.error('Error in matching process:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate weighted score based on variable importance with binary gate logic
     * Excludes variables with no requirements and redistributes weights
     */
    calculateWeightedScore(evaluation) {
        let weightedSum = 0;
        let binaryGateFailure = false;
        let totalActiveWeight = 0;
        
        // First pass: identify variables with requirements and check binary gates
        const activeVariables = [];
        
        evaluation.evaluation.forEach(item => {
            const variable = this.FIXED_VARIABLES.find(v => v.name === item.variable);
            if (variable) {
                // Check if this variable has no requirements
                const noRequirementsPatterns = [
                    /no specific .* (required|mentioned)/i,
                    /no .* requirements/i,
                    /not required/i,
                    /not mentioned/i,
                    /no requirements found/i
                ];
                
                const hasNoRequirements = noRequirementsPatterns.some(pattern => 
                    pattern.test(item.job_requirements)
                );
                
                if (hasNoRequirements) {
                    // Mark as not applicable - exclude from calculation
                    item.score = "N/A";
                    item.match_quality = "Not Required";
                    item.candidate_evidence = "Not applicable - no requirements specified";
                    return; // Skip this variable
                }
                
                // Check for binary gate failures
                if (variable.isBinaryGate) {
                    if (item.score < 70) {
                        binaryGateFailure = true;
                    }
                } else {
                    // This is an active variable that should be included
                    activeVariables.push({ item, variable });
                    totalActiveWeight += variable.weight;
                }
            }
        });
        
        // If no active variables, return 0
        if (activeVariables.length === 0) {
            return 0;
        }
        
        // Second pass: calculate weighted score with redistributed weights
        activeVariables.forEach(({ item, variable }) => {
            // Redistribute weight: (original weight / total active weight) * 100
            const redistributedWeight = variable.weight / totalActiveWeight;
            weightedSum += item.score * redistributedWeight;
        });
        
        // If binary gate fails, cap the score at 39 (does not meet requirements)
        if (binaryGateFailure) {
            return Math.min(39, Math.round(weightedSum));
        }
        
        return Math.round(weightedSum);
    }

    /**
     * Get redistributed weights for active variables (those with requirements)
     */
    getRedistributedWeights(evaluation) {
        const activeWeights = {};
        let totalActiveWeight = 0;
        
        // Calculate total weight of variables with requirements
        evaluation.evaluation.forEach(item => {
            const variable = this.FIXED_VARIABLES.find(v => v.name === item.variable);
            if (variable && item.score !== "N/A") {
                totalActiveWeight += variable.weight;
            }
        });
        
        // Redistribute weights proportionally
        evaluation.evaluation.forEach(item => {
            const variable = this.FIXED_VARIABLES.find(v => v.name === item.variable);
            if (variable) {
                if (item.score === "N/A") {
                    activeWeights[item.variable] = 0;
                } else {
                    activeWeights[item.variable] = (variable.weight / totalActiveWeight) * 100;
                }
            }
        });
        
        return activeWeights;
    }



    /**
     * Get color based on score level
     */
    getScoreColor(score) {
        if (score >= 80) return '#22c55e'; // Green
        if (score >= 60) return '#eab308'; // Yellow
        if (score >= 40) return '#f97316'; // Orange
        return '#ef4444'; // Red
    }

    /**
     * Format results for display
     */
    formatResults(results) {
        if (!results.success) {
            return `<div class="error">Error: ${results.error}</div>`;
        }

        let html = `
            <div class="results-container">
                <div class="score-header">
                    <h3>8-Variable Match Score: ${results.weightedScore}%</h3>
                    <p>Variables Analyzed: ${results.totalVariables}</p>
                </div>
                
                <div class="variables-breakdown">
                    <h4>Detailed Variable Analysis:</h4>
                    <div class="variables-grid">
        `;

        const redistributedWeights = this.getRedistributedWeights(results.evaluation);
        
        results.evaluation.evaluation.forEach(item => {
            const variable = this.FIXED_VARIABLES.find(v => v.name === item.variable);
            const originalWeight = variable ? (variable.weight * 100).toFixed(1) : '0';
            const activeWeight = redistributedWeights[item.variable] ? redistributedWeights[item.variable].toFixed(1) : '0';
            const isBinaryGate = variable && variable.isBinaryGate;
            const isNotApplicable = item.score === "N/A";
            
            html += `
                <div class="variable-item ${isNotApplicable ? 'not-applicable' : ''}">
                    <div class="variable-header">
                        <span class="variable-name">${item.variable}</span>
                        <span class="variable-score ${isNotApplicable ? 'score-na' : 'score-' + this.getScoreClass(item.score)}">
                            ${isNotApplicable ? 'N/A' : item.score + '%'}
                        </span>
                    </div>
                    <div class="variable-weight">
                        ${isBinaryGate ? 'Binary Gate: Must meet if required' : 
                          isNotApplicable ? 'No Weight (No Requirements)' : 
                          `Weight: ${activeWeight}% (was ${originalWeight}%)`}
                    </div>
                    
                    <div class="variable-requirements">
                        <strong>Job Requirements:</strong>
                        <p>${item.job_requirements}</p>
                    </div>
                    
                    <div class="variable-evidence">
                        <strong>Candidate Evidence:</strong>
                        <p>${item.candidate_evidence}</p>
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
                
                <div class="score-visualization">
                    <div class="overall-score-card">
                        <div class="score-circle">
                            <div class="score-number">${results.weightedScore}%</div>
                            <div class="score-label">Overall Match</div>
                        </div>
                        <div class="score-status ${this.getScoreClass(results.weightedScore)}">
                            ${this.getScoreDescription(results.weightedScore)}
                        </div>
                    </div>
                    
                    <div class="variables-chart">
                        <div class="chart-header">
                            <h4>Variable Performance & Contribution</h4>
                            <div class="chart-tabs">
                                <button class="chart-tab active" data-chart="horizontal">📊 Horizontal</button>
                                <button class="chart-tab" data-chart="vertical">📈 Vertical</button>
                                <button class="chart-tab" data-chart="comparison">⚖️ Comparison</button>
                            </div>
                        </div>
                        
                        <div class="chart-content">
                            <div class="chart-view active" data-chart="horizontal">
                                <div class="chart-bars">
                                    ${this.generateBarChart(results.evaluation)}
                                </div>
                            </div>
                            
                            <div class="chart-view" data-chart="vertical">
                                ${this.generateVerticalBarChart(results.evaluation)}
                            </div>
                            
                            <div class="chart-view" data-chart="comparison">
                                ${this.generateComparisonChart(results.evaluation)}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="summary">
                    <h4>Summary:</h4>
                    <p>${results.evaluation.summary}</p>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Get CSS class for score styling
     */
    getScoreClass(score) {
        if (score === "N/A") return 'na';
        if (score >= 80) return 'high';
        if (score >= 60) return 'medium';
        if (score >= 40) return 'low';
        return 'very-low';
    }

    /**
     * Get score description text
     */
    getScoreDescription(score) {
        if (score >= 80) return 'Strong Match';
        if (score >= 60) return 'Good Match';
        if (score >= 40) return 'Partial Match';
        return 'Poor Match';
    }

    /**
     * Generate enhanced horizontal bar chart HTML with animations and interactivity
     */
    generateBarChart(evaluation) {
        let barChartHtml = '';
        const redistributedWeights = this.getRedistributedWeights(evaluation);
        
        evaluation.evaluation.forEach((item, index) => {
            const variable = this.FIXED_VARIABLES.find(v => v.name === item.variable);
            if (!variable) return;
            
            const originalWeight = variable.weight * 100;
            const activeWeight = redistributedWeights[item.variable] || 0;
            const isBinaryGate = variable.isBinaryGate;
            const isNotApplicable = item.score === "N/A";
            const scoreClass = isNotApplicable ? 'na' : this.getScoreClass(item.score);
            
            // Calculate the weighted contribution for this variable
            const contribution = isNotApplicable ? 0 : 
                                isBinaryGate ? 0 : 
                                (item.score * (activeWeight / 100));
            
            barChartHtml += `
                <div class="bar-item ${isNotApplicable ? 'not-applicable' : ''}" 
                     data-variable="${item.variable}" 
                     data-score="${item.score}" 
                     style="animation-delay: ${index * 0.1}s">
                    <div class="bar-header">
                        <div class="bar-name-section">
                            <span class="bar-name">${item.variable}</span>
                            <span class="bar-contribution">
                                ${isNotApplicable ? 'Not Required' : 
                                  isBinaryGate ? 'Binary Gate' : 
                                  `+${contribution.toFixed(1)} points`}
                            </span>
                        </div>
                        <span class="bar-score">${isNotApplicable ? 'N/A' : item.score + '%'}</span>
                    </div>
                    <div class="bar-container">
                        <div class="bar-background">
                            <div class="bar-fill ${scoreClass}" 
                                 style="width: 0%" 
                                 data-target-width="${isNotApplicable ? '0' : item.score}%"
                                 data-score="${item.score}">
                                ${isNotApplicable ? '' : '<div class="bar-shine"></div>'}
                            </div>
                            ${isNotApplicable ? '' : '<div class="bar-benchmark" style="left: 70%" title="70% - Good Match Threshold"></div>'}
                        </div>
                        <div class="bar-weight">
                            ${isBinaryGate ? 'Binary Gate' : 
                              isNotApplicable ? 'No Weight' : 
                              `${activeWeight.toFixed(1)}% weight`}
                        </div>
                    </div>
                    <div class="bar-details">
                        <div class="bar-requirement">
                            <strong>Requirement:</strong> ${item.job_requirements}
                        </div>
                        <div class="bar-evidence">
                            <strong>Evidence:</strong> ${item.candidate_evidence}
                        </div>
                    </div>
                </div>
            `;
        });

        return barChartHtml;
    }

    /**
     * Generate a vertical bar chart as an alternative visualization
     */
    generateVerticalBarChart(evaluation) {
        let verticalChartHtml = '<div class="vertical-chart-container">';
        const redistributedWeights = this.getRedistributedWeights(evaluation);
        
        evaluation.evaluation.forEach((item, index) => {
            const variable = this.FIXED_VARIABLES.find(v => v.name === item.variable);
            if (!variable) return;
            
            const activeWeight = redistributedWeights[item.variable] || 0;
            const isBinaryGate = variable.isBinaryGate;
            const isNotApplicable = item.score === "N/A";
            const scoreClass = isNotApplicable ? 'na' : this.getScoreClass(item.score);
            
            verticalChartHtml += `
                <div class="vertical-bar-item ${isNotApplicable ? 'not-applicable' : ''}" 
                     data-variable="${item.variable}" 
                     style="animation-delay: ${index * 0.1}s">
                    <div class="vertical-bar-container">
                        <div class="vertical-bar-background">
                            <div class="vertical-bar-fill ${scoreClass}" 
                                 style="height: 0%" 
                                 data-target-height="${isNotApplicable ? '0' : item.score}%"
                                 title="${item.variable}: ${isNotApplicable ? 'N/A' : item.score + '%'}">
                            </div>
                            ${isNotApplicable ? '' : '<div class="vertical-bar-benchmark" style="bottom: 70%" title="70% threshold"></div>'}
                        </div>
                        <div class="vertical-bar-score">${isNotApplicable ? 'N/A' : item.score + '%'}</div>
                    </div>
                    <div class="vertical-bar-label">
                        <div class="vertical-bar-name">${item.variable}</div>
                        <div class="vertical-bar-weight">
                            ${isBinaryGate ? 'Binary' : 
                              isNotApplicable ? 'No Weight' : 
                              `${activeWeight.toFixed(1)}%`}
                        </div>
                    </div>
                </div>
            `;
        });
        
        verticalChartHtml += '</div>';
        return verticalChartHtml;
    }

    /**
     * Generate comparison chart showing actual vs required scores
     */
    generateComparisonChart(evaluation) {
        let comparisonHtml = '<div class="comparison-chart-container">';
        const redistributedWeights = this.getRedistributedWeights(evaluation);
        
        evaluation.evaluation.forEach((item, index) => {
            const variable = this.FIXED_VARIABLES.find(v => v.name === item.variable);
            if (!variable) return;
            
            const activeWeight = redistributedWeights[item.variable] || 0;
            const isBinaryGate = variable.isBinaryGate;
            const isNotApplicable = item.score === "N/A";
            const scoreClass = isNotApplicable ? 'na' : this.getScoreClass(item.score);
            
            // Define minimum acceptable score (70% for most, 100% for binary gates)
            const minAcceptable = isBinaryGate ? 100 : 70;
            const meetsRequirement = isNotApplicable ? 'na' : (item.score >= minAcceptable);
            
            comparisonHtml += `
                <div class="comparison-item ${isNotApplicable ? 'not-applicable' : ''}" 
                     data-variable="${item.variable}" 
                     style="animation-delay: ${index * 0.1}s">
                    <div class="comparison-header">
                        <span class="comparison-name">${item.variable}</span>
                        <span class="comparison-status ${
                            isNotApplicable ? 'na' : 
                            meetsRequirement ? 'meets' : 'below'
                        }">
                            ${isNotApplicable ? 'N/A' : meetsRequirement ? '✓' : '✗'}
                        </span>
                    </div>
                    <div class="comparison-bars">
                        <div class="comparison-bar-row">
                            <span class="comparison-label">Candidate:</span>
                            <div class="comparison-bar-bg">
                                <div class="comparison-bar-fill ${scoreClass}" 
                                     style="width: 0%" 
                                     data-target-width="${isNotApplicable ? '0' : item.score}%">
                                </div>
                            </div>
                            <span class="comparison-score">${isNotApplicable ? 'N/A' : item.score + '%'}</span>
                        </div>
                        <div class="comparison-bar-row">
                            <span class="comparison-label">Required:</span>
                            <div class="comparison-bar-bg">
                                <div class="comparison-bar-fill required" 
                                     style="width: 0%" 
                                     data-target-width="${isNotApplicable ? '0' : minAcceptable}%">
                                </div>
                            </div>
                            <span class="comparison-score">${isNotApplicable ? 'N/A' : minAcceptable + '%'}</span>
                        </div>
                    </div>
                    <div class="comparison-weight">
                        Weight: ${isBinaryGate ? 'Binary Gate' : 
                                  isNotApplicable ? 'No Weight' : 
                                  `${activeWeight.toFixed(1)}%`}
                    </div>
                </div>
            `;
        });
        
        comparisonHtml += '</div>';
        return comparisonHtml;
    }

    /**
     * Initialize bar chart animations after DOM is ready
     */
    initializeBarChartAnimations() {
        // Animate horizontal bars
        const barFills = document.querySelectorAll('.bar-fill');
        barFills.forEach((bar, index) => {
            setTimeout(() => {
                const targetWidth = bar.getAttribute('data-target-width');
                bar.style.width = targetWidth;
            }, index * 100);
        });

        // Animate vertical bars
        const verticalBars = document.querySelectorAll('.vertical-bar-fill');
        verticalBars.forEach((bar, index) => {
            setTimeout(() => {
                const targetHeight = bar.getAttribute('data-target-height');
                bar.style.height = targetHeight;
            }, index * 100);
        });

        // Animate comparison bars
        const comparisonBars = document.querySelectorAll('.comparison-bar-fill');
        comparisonBars.forEach((bar, index) => {
            setTimeout(() => {
                const targetWidth = bar.getAttribute('data-target-width');
                bar.style.width = targetWidth;
            }, index * 50);
        });
    }


}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HybridDynamicMatchingSystem;
} 