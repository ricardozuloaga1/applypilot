/**
 * Integration Example: How to modify your existing popup.js 
 * to use the Enhanced Matching System with 22-variable statistical analysis
 */

// Add this to your existing popup.js file, replacing the current calculateJobMatch method

class AutoApplyAI {
    constructor() {
        // ... existing constructor code ...
        
        // Add the enhanced matching system
        this.enhancedMatcher = new EnhancedMatchingSystem();
    }

    /**
     * Enhanced job matching using GPT-4o with 22-variable analysis
     * Replace your existing calculateJobMatch method with this
     */
    async calculateJobMatch(job) {
        if (!this.resumeFile) {
            console.warn('No resume available for matching');
            return null;
        }

        try {
            // Step 1: Extract and parse resume text (existing code)
            console.log(`📄 Extracting text from: ${this.resumeFile.name}`);
            this.setStatus?.('capture-status', `📄 Processing resume file: ${this.resumeFile.name}...`, 'info');
            
            const resumeText = await this.readFileAsText(this.resumeFile);
            
            // Validate resume content
            if (!resumeText || resumeText.trim().length === 0) {
                throw new Error('Resume content is empty or unreadable after processing.');
            }
            
            if (resumeText.length < 50) {
                throw new Error('Resume content is too short - please check that your file contains readable text.');
            }
            
            console.log('✅ Resume text successfully extracted and processed');
            
            // Step 2: Extract structured resume data (existing code)
            this.setStatus?.('capture-status', `🔍 Analyzing resume structure...`, 'info');
            
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                console.warn('No API key available for job scoring');
                return null;
            }
            
            const resumeData = await this.extractResumeData(resumeText, apiKey);
            
            // Step 3: Use Enhanced Matching System for analysis
            this.setStatus?.('capture-status', `🎯 Performing enhanced 22-variable analysis...`, 'info');
            
            const enhancedResult = await this.enhancedMatcher.fullMatchingAnalysis(
                job.description,
                job.title,
                job.company,
                resumeText,
                resumeData,
                apiKey
            );
            
            // Step 4: Format results for display
            const displayResult = this.enhancedMatcher.formatForDisplay(enhancedResult);
            
            console.log('🎯 Enhanced matching analysis complete:', displayResult);
            
            // Step 5: Return enhanced result in format compatible with existing UI
            return {
                // Legacy format for backward compatibility
                overallScore: displayResult.score,
                matchPercentage: displayResult.percentage,
                categoryBreakdown: displayResult.categoryBreakdown,
                
                // Enhanced data
                enhanced: true,
                totalMatches: displayResult.matches,
                statisticalSignificance: displayResult.significance,
                confidenceLevel: displayResult.confidence,
                hiringDecision: displayResult.decision,
                missingCritical: displayResult.missingCritical,
                recommendations: displayResult.recommendations,
                
                // Full detailed analysis
                fullAnalysis: enhancedResult,
                
                // Color coding for UI
                scoreColor: displayResult.scoreColor,
                scoreText: displayResult.scoreText,
                
                // Timestamp
                analyzedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error in enhanced job matching:', error);
            
            // Fallback to original method if enhanced fails
            this.setStatus?.('capture-status', `⚠️ Enhanced analysis failed, using standard analysis...`, 'warning');
            
            try {
                return await this.calculateJobMatchOriginal(job);
            } catch (fallbackError) {
                console.error('Fallback matching also failed:', fallbackError);
                throw error;
            }
        }
    }

    /**
     * Rename your existing calculateJobMatch method to this for fallback
     */
    async calculateJobMatchOriginal(job) {
        // Your existing calculateJobMatch logic here
        // This serves as a fallback if the enhanced system fails
        
        // ... existing code ...
        
        return {
            overallScore: 75,
            matchPercentage: "75%",
            categoryBreakdown: "Standard Analysis",
            enhanced: false
        };
    }

    /**
     * Enhanced status display for the UI
     */
    displayEnhancedResults(result) {
        if (!result.enhanced) {
            // Use existing display logic for non-enhanced results
            return this.displayJobMatch(result);
        }

        // Enhanced display with statistical information
        const container = document.getElementById('job-results-container');
        if (!container) return;

        container.innerHTML = `
            <div class="enhanced-match-result">
                <div class="score-header">
                    <h3 style="color: ${result.scoreColor}; margin-bottom: 10px;">
                        ${result.scoreText}: ${result.overallScore.toFixed(1)}
                    </h3>
                    <div class="statistical-info">
                        <div class="matches-info">
                            <strong>Variable Matches:</strong> ${result.totalMatches} 
                            <span class="percentage">(${result.matchPercentage})</span>
                        </div>
                        <div class="significance-info">
                            ${result.statisticalSignificance}
                        </div>
                        <div class="decision-info">
                            <strong>Hiring Decision:</strong> 
                            <span class="decision-${result.hiringDecision.toLowerCase()}">${result.hiringDecision}</span>
                        </div>
                    </div>
                </div>

                <div class="category-breakdown">
                    <h4>Category Breakdown:</h4>
                    <pre>${result.categoryBreakdown}</pre>
                </div>

                ${result.missingCritical && result.missingCritical.length > 0 ? `
                    <div class="missing-critical">
                        <h4 style="color: #dc3545;">Missing Critical Requirements:</h4>
                        <ul>
                            ${result.missingCritical.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="recommendations">
                    <h4>Recommendations:</h4>
                    <ul>
                        ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>

                <div class="detailed-analysis-toggle">
                    <button onclick="toggleDetailedAnalysis()" class="toggle-button">
                        View Detailed Analysis
                    </button>
                    <div id="detailed-analysis" style="display: none;">
                        <pre>${JSON.stringify(result.fullAnalysis, null, 2)}</pre>
                    </div>
                </div>

                <div class="analysis-timestamp">
                    <small>Analysis completed: ${new Date(result.analyzedAt).toLocaleString()}</small>
                </div>
            </div>
        `;

        // Add CSS for enhanced styling
        this.addEnhancedStyles();
    }

    /**
     * Add enhanced styling for the new UI components
     */
    addEnhancedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .enhanced-match-result {
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
            }
            
            .score-header h3 {
                font-size: 1.4em;
                margin-bottom: 10px;
            }
            
            .statistical-info {
                background-color: #e9ecef;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 15px;
            }
            
            .matches-info, .significance-info, .decision-info {
                margin-bottom: 5px;
            }
            
            .percentage {
                color: #6c757d;
                font-size: 0.9em;
            }
            
            .decision-strong_recommend, .decision-recommend {
                color: #28a745;
                font-weight: bold;
            }
            
            .decision-maybe {
                color: #ffc107;
                font-weight: bold;
            }
            
            .decision-weak_maybe, .decision-reject {
                color: #dc3545;
                font-weight: bold;
            }
            
            .category-breakdown {
                margin-bottom: 15px;
            }
            
            .category-breakdown pre {
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                font-size: 0.9em;
            }
            
            .missing-critical {
                background-color: #f8d7da;
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 15px;
            }
            
            .missing-critical ul {
                margin-bottom: 0;
            }
            
            .recommendations {
                margin-bottom: 15px;
            }
            
            .toggle-button {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 10px;
            }
            
            .toggle-button:hover {
                background-color: #0056b3;
            }
            
            .analysis-timestamp {
                text-align: center;
                margin-top: 15px;
                color: #6c757d;
            }
        `;
        
        if (!document.getElementById('enhanced-styles')) {
            style.id = 'enhanced-styles';
            document.head.appendChild(style);
        }
    }

    /**
     * Update the job scoring button handler
     */
    updateJobScoringHandler() {
        // Find your existing job scoring button and update its handler
        const existingButtons = document.querySelectorAll('.score-job-btn');
        existingButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const jobId = e.target.dataset.jobId;
                const jobData = this.getJobData(jobId); // Your existing method
                
                try {
                    this.setStatus?.('capture-status', '🎯 Starting enhanced analysis...', 'info');
                    
                    const result = await this.calculateJobMatch(jobData);
                    
                    if (result) {
                        this.displayEnhancedResults(result);
                        this.setStatus?.('capture-status', '✅ Enhanced analysis complete!', 'success');
                    } else {
                        this.setStatus?.('capture-status', '❌ Analysis failed', 'error');
                    }
                } catch (error) {
                    console.error('Error in job scoring:', error);
                    this.setStatus?.('capture-status', `❌ Error: ${error.message}`, 'error');
                }
            });
        });
    }
}

// Global function for the detailed analysis toggle
function toggleDetailedAnalysis() {
    const detailsDiv = document.getElementById('detailed-analysis');
    const button = document.querySelector('.toggle-button');
    
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        button.textContent = 'Hide Detailed Analysis';
    } else {
        detailsDiv.style.display = 'none';
        button.textContent = 'View Detailed Analysis';
    }
}

// Initialize the enhanced system when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Your existing initialization code
    
    // Add the enhanced matching system script
    const script = document.createElement('script');
    script.src = 'enhanced_matching_extension.js';
    script.onload = function() {
        console.log('✅ Enhanced matching system loaded');
        
        // Initialize your AutoApplyAI instance
        const autoApply = new AutoApplyAI();
        autoApply.updateJobScoringHandler();
    };
    document.head.appendChild(script);
});

/**
 * Example usage in your existing popup.html
 * 
 * Add this button to trigger enhanced analysis:
 * 
 * <button class="enhanced-score-btn" onclick="runEnhancedAnalysis()">
 *     🎯 Enhanced Analysis (22 Variables)
 * </button>
 * 
 * Add this container for results:
 * 
 * <div id="job-results-container"></div>
 */

async function runEnhancedAnalysis() {
    const autoApply = new AutoApplyAI();
    
    // Get current job data from your existing system
    const currentJob = getCurrentJobData(); // Your existing method
    
    if (!currentJob) {
        alert('Please navigate to a job posting first');
        return;
    }
    
    try {
        const result = await autoApply.calculateJobMatch(currentJob);
        autoApply.displayEnhancedResults(result);
    } catch (error) {
        console.error('Enhanced analysis failed:', error);
        alert('Enhanced analysis failed. Please try again.');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoApplyAI };
} 