// Enhanced popup script with job collection functionality
class AutoApplyAI {
    constructor() {
        this.jobs = []; // Initialize as empty array
        this.selectedJob = null;
        this.selectedJobs = new Set(); // For multi-job selection (up to 3)
        this.maxSelectedJobs = 3; // Limit for selected jobs
        this.resumeFile = null;
        this.storedResumes = []; // Array to store multiple resumes
        this.activeResumeId = null; // ID of currently active resume
        this.currentTab = 'capture';
        this.scoringPaused = false;
        this.scoringMode = 'automatic'; // 'automatic' or 'manual'
        
        // Initialize API service
        this.apiService = new APIService();
        this.matchColors = {
            excellent: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.6)', icon: '🟢', label: 'Excellent Match' },
            good: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.6)', icon: '🔵', label: 'Good Match' },
            moderate: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.6)', icon: '🟡', label: 'Moderate Match' },
            weak: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.6)', icon: '🟠', label: 'Weak Match' },
            poor: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.6)', icon: '🔴', label: 'Poor Match' },
            unscored: { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.6)', icon: '⚪', label: 'Not Scored' }
        };
        this.scoringJobId = null; // Track which job is being scored
        this.expandedJobs = new Set(); // Track expanded jobs
        this.selectedEnhancements = new Set(); // Track selected enhancement hashtags
        this.currentEnhancements = []; // Store current enhancement suggestions
    }

    async init() {
        try {
            console.log('Initializing AutoApply AI popup...');
            
            // Ensure jobs array is initialized
            this.jobs = [];
            
            await this.loadJobs();
            await this.loadStoredResumes();
            await this.loadActiveResumeId();
            await this.loadResume();
            await this.loadScoringPreference();
            await this.loadAmplificationMode();
            
            // Auto-select first resume if no active resume is set but resumes exist
            if (!this.activeResumeId && this.storedResumes && this.storedResumes.length > 0) {
                console.log('No active resume set, auto-selecting first available resume');
                await this.setActiveResume(this.storedResumes[0].id);
            }
            
            this.setupEventListeners();
            this.setupTabs();
            this.renderJobs();
            this.renderStoredResumes();
            this.updateActiveResumeDisplay();
            this.updateJobsCount();
            this.updateGenerateButton();
            this.updateApiStatus();
            this.initializeDocumentType();
            this.reattachSortEventListeners();
            this.setupApiConfiguration(); // Setup API configuration UI
            
            console.log('AutoApply AI popup initialized successfully');
            
            // Test tab switching immediately
            console.log('Testing tab elements...');
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            console.log('Found tabs:', tabs.length);
            console.log('Found tab contents:', tabContents.length);
            
            // Add a simple test click handler
            tabs.forEach((tab, index) => {
                console.log(`Tab ${index}:`, tab.getAttribute('data-tab'), tab.textContent.trim());
            });
            
        } catch (error) {
            console.error('Error initializing AutoApply AI popup:', error);
            // Set a safe fallback state
            this.jobs = [];
            this.selectedJob = null;
            this.renderJobs();
            this.updateJobsCount();
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Resume Upload tab - with debugging
        const resumeUploadElement = document.getElementById('resume-upload');
        if (resumeUploadElement) {
            console.log('✅ Resume upload element found, attaching event listener');
            resumeUploadElement.addEventListener('change', (e) => {
                console.log('📄 Resume upload change event triggered', e);
                this.handleResumeUpload(e);
            });
        } else {
            console.error('❌ Resume upload element NOT found!');
        }
        
        // Other buttons with debugging
        const scoreAllBtn = document.getElementById('score-all-btn');
        const pauseScoringBtn = document.getElementById('pause-scoring-btn');
        const clearResumesBtn = document.getElementById('clear-resumes-btn');
        
        if (scoreAllBtn) {
            scoreAllBtn.addEventListener('click', () => this.scoreAllJobsAndShowResults());
        }
        if (pauseScoringBtn) {
            pauseScoringBtn.addEventListener('click', () => this.toggleScoringPause());
        }
        if (clearResumesBtn) {
            clearResumesBtn.addEventListener('click', () => this.clearAllResumes());
        }
        
        // Active resume selector
        document.getElementById('change-resume-btn').addEventListener('click', () => this.toggleResumeSelector());
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.active-resume-actions')) {
                this.closeResumeSelector();
            }
        });
        
        // Scoring preference listeners
        document.getElementById('auto-scoring').addEventListener('change', () => this.saveScoringPreference());
        document.getElementById('manual-scoring').addEventListener('change', () => this.saveScoringPreference());
        
        // Jobs tab
        document.getElementById('clear-jobs-btn').addEventListener('click', () => this.clearAllJobs());
        document.getElementById('search-jobs').addEventListener('input', (e) => this.searchJobs(e.target.value));
        
        // Sort dropdown
        const sortButton = document.getElementById('sort-button');
        if (sortButton) {
            sortButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSortDropdown();
            });
        }
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sort-dropdown')) {
                this.closeSortDropdown();
            }
        });
        
        // Ensure sort dropdown works immediately
        this.reattachSortEventListeners();
        
        // Sort options - using event delegation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('sort-option')) {
                const value = e.target.dataset.value;
                this.selectSortOption(value);
                this.sortJobs(value);
            }
        });
        
        // Generate tab
        document.getElementById('generate-btn').addEventListener('click', () => this.generateDocument());
        
        // Document type and format button listeners
        this.setupDocumentTypeButtons();
        this.setupDocumentFormatButtons();
        
        // Amplification mode listener
        this.setupAmplificationModeListener();
        
        // Document type listener
        this.setupDocumentTypeListener();
        
        // Settings tab
        document.getElementById('save-api-key-btn').addEventListener('click', () => this.saveApiKey());
        document.getElementById('test-api-btn').addEventListener('click', () => this.testApiConnection());
        
        // Selection controls
        document.getElementById('clear-selection-btn').addEventListener('click', () => this.clearJobSelection());
        
        // Proceed to generate buttons
        document.getElementById('proceed-to-generate-top').addEventListener('click', () => this.proceedToGenerate());
        document.getElementById('proceed-to-generate-bottom').addEventListener('click', () => this.proceedToGenerate());
        
        // Enhancement analysis
        document.getElementById('analyze-gaps-btn').addEventListener('click', () => this.analyzeResumeGaps());
        
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'jobCaptured') {
                this.handleJobCaptured(request.jobData);
            }
        });
    }

    setupTabs() {
        console.log('setupTabs() called');
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        console.log('Setting up tabs, found:', tabs.length, 'tab buttons');
        console.log('Found:', tabContents.length, 'tab content areas');
        
        if (tabs.length === 0) {
            console.error('No tabs found! DOM might not be ready.');
            return;
        }
        
        tabs.forEach((tab, index) => {
            const targetTab = tab.getAttribute('data-tab');
            console.log(`Setting up tab ${index}: ${targetTab}`);
            
            // Validate that the corresponding content exists
            const contentId = `${targetTab}-tab`;
            const contentElement = document.getElementById(contentId);
            if (!contentElement) {
                console.error(`Tab content not found for ${targetTab}: ${contentId}`);
                return;
            }
            
            // Add click event listener with debugging
            tab.addEventListener('click', (e) => {
                console.log(`Tab clicked: ${targetTab}`);
                e.preventDefault();
                e.stopPropagation();
                this.switchTab(targetTab);
            });
            
            console.log(`✅ Tab ${targetTab} event listener attached successfully`);
        });
        
        console.log('✅ All tabs setup completed');
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        try {
            // Update active tab - remove active class from all tabs
            const allTabs = document.querySelectorAll('.tab');
            const allTabContents = document.querySelectorAll('.tab-content');
            
            console.log(`Found ${allTabs.length} tab buttons and ${allTabContents.length} tab contents`);
            
            allTabs.forEach(tab => tab.classList.remove('active'));
            allTabContents.forEach(content => content.classList.remove('active'));
            
            // Find and activate the tab button
            const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabButton) {
                tabButton.classList.add('active');
                console.log(`✅ Tab button activated: ${tabName}`);
            } else {
                console.error(`❌ Tab button not found for: ${tabName}`);
                return;
            }
            
            // Find and activate the tab content
            const contentId = `${tabName}-tab`;
            const tabContent = document.getElementById(contentId);
            if (tabContent) {
                tabContent.classList.add('active');
                console.log(`✅ Tab content activated: ${contentId}`);
            } else {
                console.error(`❌ Tab content not found for: ${contentId}`);
                return;
            }
            
            this.currentTab = tabName;
            console.log(`✅ Successfully switched to tab: ${tabName}`);
            
            // Update content based on tab
            if (tabName === 'jobs') {
                this.renderJobs();
                this.updateJobsCount();
                this.updateProceedToGenerateButtons();
                // Ensure sort dropdown works when switching to jobs tab
                setTimeout(() => {
                    this.reattachSortEventListeners();
                }, 100);
            } else if (tabName === 'generate') {
                this.updateGenerateButton();
                this.toggleTemplateCustomization(); // Initialize template customization
                this.initializeDocumentType(); // Initialize document type selection
            } else if (tabName === 'settings') {
                this.loadApiKeyForSettings();
            }
        } catch (error) {
            console.error(`❌ Error switching to tab ${tabName}:`, error);
        }
    }

    // Job capture is now handled by the floating button in content.js
    // This method is no longer needed

    async handleJobCaptured(jobData) {
        console.log('Handling captured job data:', jobData);
        
        // Ensure jobs array exists
        if (!this.jobs || !Array.isArray(this.jobs)) {
            console.warn('Jobs array not initialized in handleJobCaptured, initializing...');
            this.jobs = [];
        }
        
        jobData.id = Date.now();
        jobData.capturedAt = new Date().toISOString();
        
        this.jobs.unshift(jobData);
        console.log('Jobs array after adding new job:', this.jobs.length);
        
        await this.saveJobs();
        this.renderJobs();
        this.updateJobsCount();
        this.setStatus('capture-status', `✅ Captured: ${jobData.title}`, 'success');
        
        // Auto-select the newly captured job
        this.selectedJob = jobData;
        this.updateGenerateButton();
        
        // Auto-score the job if resume is available and automatic mode is enabled
        if (this.resumeFile && this.scoringMode === 'automatic') {
            setTimeout(() => this.scoreJob(jobData.id), 1000); // Small delay to avoid overwhelming the UI
        }
        
        // Show success message longer for successful captures
        setTimeout(() => {
            this.setStatus('capture-status', 'Ready to capture jobs', 'info');
        }, 5000);
    }

    renderJobs() {
        const container = document.getElementById('job-list');
        
        // Ensure jobs array exists
        if (!this.jobs || !Array.isArray(this.jobs)) {
            console.warn('Jobs array is not initialized, initializing as empty array');
            this.jobs = [];
        }
        
        if (this.jobs.length === 0) {
            container.innerHTML = `
                <div class="no-jobs">
                    <p>No jobs captured yet</p>
                    <small>Navigate to a job posting and click "Capture Current Job"</small>
                </div>
            `;
            this.reattachSortEventListeners(); // Ensure sort dropdown works even with no jobs
            return;
        }
        
        container.innerHTML = this.jobs.map(job => {
            const matchColor = this.getMatchColor(job.matchAnalysis?.score);
            const matchScore = job.matchAnalysis?.score;
            const isScoring = this.scoringJobId === job.id;
            const isExpanded = this.expandedJobs.has(job.id);
            // Render download links for generated docs
            let docLinks = '';
            if (job.generatedDocs && job.generatedDocs.length > 0) {
                docLinks = `<div class=\"job-doc-links\">` + job.generatedDocs.map((doc, idx) => {
                    let icon = '⬇️';
                    if (doc.type === 'resume') icon = 'CV';
                    else if (doc.type === 'cover-letter') icon = 'CL';
                    return `<button class=\"job-doc-download\" title=\"Download ${doc.type.toUpperCase()} (${doc.format.toUpperCase()})\" data-job-id=\"${job.id}\" data-doc-idx=\"${idx}\">${icon}</button>`;
                }).join('') + `</div>`;
            }
            return `
            <div class="job-item ${this.selectedJob && this.selectedJob.id === job.id ? 'selected' : ''} ${this.selectedJobs.has(job.id) ? 'multi-selected' : ''}" 
                 data-job-id="${job.id}">
                <div class="job-content">
                    <div class="job-checkbox-container">
                        <input type="checkbox" class="job-checkbox" data-job-id="${job.id}" ${this.selectedJobs.has(job.id) ? 'checked' : ''} ${this.selectedJobs.size >= this.maxSelectedJobs && !this.selectedJobs.has(job.id) ? 'disabled' : ''}>
                    </div>
                    <div class="job-info">
                        <div class="job-title">${this.escapeHtml(job.title)} ${docLinks}</div>
                        <div class="job-company">${this.escapeHtml(job.company)} • ${this.escapeHtml(job.source)}</div>
                    </div>
                    <div class="match-score">
                        ${matchScore !== null && matchScore !== undefined ? 
                            `<div class="match-circle ${this.getMatchLevel(matchScore)}"></div><span>${matchScore}%</span>` : 
                            `<div class="match-circle unscored"></div><span>Not Scored</span>`
                        }
                    </div>
                </div>
                <div class="job-meta">
                    <div class="job-date">${new Date(job.capturedAt).toLocaleDateString()}</div>
                    <div class="job-actions">
                        ${matchScore === null || matchScore === undefined ? 
                            `<div class="job-action${isScoring ? ' loading' : ''}" data-action="score" data-job-id="${job.id}" title="Score this job" ${isScoring ? 'style=\"pointer-events:none;opacity:0.6;\"' : ''}>
                                ${isScoring ? '<span class=\"spinner\"></span>' : '📊'}
                            </div>` : 
                            `<div class="job-action${isScoring ? ' loading' : ''}" data-action="rescore" data-job-id="${job.id}" title="Re-score this job" ${isScoring ? 'style=\"pointer-events:none;opacity:0.6;\"' : ''}>
                                ${isScoring ? '<span class=\"spinner\"></span>' : '🔄'}
                            </div>`
                        }
                        <div class="job-action" data-action="delete" data-job-id="${job.id}"><span class="delete-symbol">×</span></div>
                    </div>
                </div>
                <div class="job-expanded-content" data-job-id="${job.id}" style="display:${isExpanded ? 'block' : 'none'};">
                    ${job.matchAnalysis ? `
                        <div class="match-analysis">
                            <h4><span class="analysis-symbol">▲</span> Match Analysis</h4>
                            ${job.matchAnalysis.matrix ? this.renderAnalysisMatrix(job.matchAnalysis.matrix) : ''}
                            <div class="match-details">
                                <div class="match-section">
                                    <strong><span class="strength-symbol">✓</span> Strengths:</strong>
                                    <ul>${job.matchAnalysis.strengths.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}</ul>
                                </div>
                                <div class="match-section">
                                    <strong><span class="gap-symbol">✗</span> Gaps:</strong>
                                    <ul>${job.matchAnalysis.gaps.map(g => `<li>${this.escapeHtml(g)}</li>`).join('')}</ul>
                                </div>
                                <div class="match-section">
                                    <strong><span class="recommendation-symbol">→</span> Recommendations:</strong>
                                    <ul>${job.matchAnalysis.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('')}</ul>
                                </div>
                                <div class="match-reasoning">
                                    <strong>Analysis:</strong> ${this.formatAnalysisReasoning(job.matchAnalysis.reasoning)}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="job-description-section">
                        <h4 class="job-description-header">Job Description</h4>
                        <div class="job-description">${this.escapeHtml(job.description)}</div>
                    </div>
                    <div class="job-details">
                        <div class="job-detail-item">
                            <strong>Location:</strong> ${this.escapeHtml(job.location || 'Not specified')}
                        </div>
                        <div class="job-detail-item">
                            <strong>Salary:</strong> 
                        </div>
                        ${job.recruiterName ? `<div class="job-detail-item">
                            <strong>Recruiter:</strong> ${job.recruiterLinkedIn ? `<a href="${job.recruiterLinkedIn}" target="_blank">${this.escapeHtml(job.recruiterName)}</a>` : this.escapeHtml(job.recruiterName)}
                        </div>` : ''}
                        <div class="job-detail-item">
                            <strong>URL:</strong> <a href="${job.url}" target="_blank" title="${job.url}"><span class="link-symbol">↗</span> View Job Posting</a>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
        
        // Add event listeners to job items
        container.querySelectorAll('.job-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('job-action') && !e.target.classList.contains('job-checkbox') && !e.target.classList.contains('job-doc-download')) {
                    const jobId = parseInt(item.getAttribute('data-job-id'));
                    this.toggleJobExpansion(jobId);
                }
            });
        });
        
        // Add event listeners to job checkboxes
        container.querySelectorAll('.job-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const jobId = parseInt(checkbox.getAttribute('data-job-id'));
                this.toggleJobSelection(jobId);
            });
        });
        
        // Add event listeners to job actions with better error handling
        container.querySelectorAll('.job-action').forEach(action => {
            action.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const jobId = parseInt(action.getAttribute('data-job-id'));
                const actionType = action.getAttribute('data-action');
                
                console.log('Job action clicked:', actionType, 'for job ID:', jobId);
                
                try {
                    if (actionType === 'delete') {
                        this.deleteJob(jobId);
                    } else if (actionType === 'score' || actionType === 'rescore') {
                        this.scoreJobAndShowResults(jobId);
                    }
                } catch (error) {
                    console.error('Error handling job action:', error);
                }
            });
        });
        

        // Add download event listeners for generated docs
        setTimeout(() => {
            container.querySelectorAll('.job-doc-download').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const jobId = btn.getAttribute('data-job-id');
                    const docIdx = btn.getAttribute('data-doc-idx');
                    const job = this.jobs.find(j => j.id == jobId);
                    if (job && job.generatedDocs && job.generatedDocs[docIdx]) {
                        const doc = job.generatedDocs[docIdx];
                        const byteChars = atob(doc.base64);
                        const byteNumbers = new Array(byteChars.length);
                        for (let i = 0; i < byteChars.length; i++) {
                            byteNumbers[i] = byteChars.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: doc.mimeType });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${doc.type}-${job.title.replace(/[^a-zA-Z0-9]/g, '-')}.${doc.format}`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                });
            });
        }, 0);
        
        // Reattach sort event listeners after rendering
        this.reattachSortEventListeners();
    }

    reattachSortEventListeners() {
        // Remove existing listeners and reattach to ensure they work
        const sortButton = document.getElementById('sort-button');
        if (sortButton) {
            // Clone the node to remove all event listeners
            const newSortButton = sortButton.cloneNode(true);
            sortButton.parentNode.replaceChild(newSortButton, sortButton);
            
            // Add the click event listener
            newSortButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Sort button clicked!');
                this.toggleSortDropdown();
            });
            
            console.log('Sort button event listener reattached');
        }
        
        // Also ensure sort options work
        setTimeout(() => {
            document.querySelectorAll('.sort-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const value = e.target.dataset.value;
                    console.log('Sort option clicked:', value);
                    this.selectSortOption(value);
                    this.sortJobs(value);
                });
            });
        }, 100);
    }

    selectJob(jobId) {
        this.selectedJob = this.jobs.find(job => job.id === jobId);
        this.renderJobs();
        this.updateGenerateButton();
    }
    
    toggleJobSelection(jobId) {
        if (this.selectedJobs.has(jobId)) {
            this.selectedJobs.delete(jobId);
        } else if (this.selectedJobs.size < this.maxSelectedJobs) {
            this.selectedJobs.add(jobId);
        }
        this.renderJobs();
        this.updateGenerateButton();
        this.updateSelectedJobsCounter();
        this.updateEnhancementSectionVisibility();
    }
    
    clearJobSelection() {
        this.selectedJobs.clear();
        this.renderJobs();
        this.updateGenerateButton();
        this.updateSelectedJobsCounter();
        this.updateEnhancementSectionVisibility();
    }
    
    updateSelectedJobsCounter() {
        const counter = document.getElementById('selection-counter');
        const controls = document.getElementById('job-selection-controls');
        
        if (this.selectedJobs.size > 0) {
            counter.textContent = `${this.selectedJobs.size} / ${this.maxSelectedJobs} jobs selected`;
            controls.style.display = 'flex';
        } else {
            controls.style.display = 'none';
        }
        
        // Update proceed to generate buttons
        this.updateProceedToGenerateButtons();
    }
    
    updateProceedToGenerateButtons() {
        const topBtn = document.getElementById('proceed-to-generate-top');
        const bottomBtn = document.getElementById('proceed-to-generate-bottom');
        const topText = document.getElementById('proceed-text-top');
        const bottomText = document.getElementById('proceed-text-bottom');
        
        const selectedCount = this.selectedJobs.size;
        const isEnabled = selectedCount >= 1 && selectedCount <= 3;
        
        topBtn.disabled = !isEnabled;
        bottomBtn.disabled = !isEnabled;
        
        if (selectedCount === 0) {
            topText.textContent = 'Select 1-3 jobs to generate documents';
            bottomText.textContent = 'Select 1-3 jobs to generate documents';
        } else if (selectedCount === 1) {
            topText.textContent = 'Proceed to Generate (1 job selected)';
            bottomText.textContent = 'Proceed to Generate (1 job selected)';
        } else if (selectedCount <= 3) {
            topText.textContent = `Proceed to Generate (${selectedCount} jobs selected)`;
            bottomText.textContent = `Proceed to Generate (${selectedCount} jobs selected)`;
        } else {
            topText.textContent = `Too many jobs selected (${selectedCount}/3 max)`;
            bottomText.textContent = `Too many jobs selected (${selectedCount}/3 max)`;
        }
    }
    
    proceedToGenerate() {
        if (this.selectedJobs.size >= 1 && this.selectedJobs.size <= 3) {
            // Switch to generate tab
            this.switchTab('generate');
            
            // Scroll to top of generate tab
            const generateTab = document.getElementById('generate-tab');
            if (generateTab) {
                generateTab.scrollTop = 0;
            }
        }
    }



    toggleJobExpansion(jobId) {
        if (this.expandedJobs.has(jobId)) {
            this.expandedJobs.delete(jobId);
        } else {
            this.expandedJobs.add(jobId);
        }
        this.renderJobs();
    }

    async deleteJob(jobId) {
        if (confirm('Are you sure you want to delete this job?')) {
            this.jobs = this.jobs.filter(job => job.id !== jobId);
            
            // Clear selection if deleted job was selected
            if (this.selectedJob && this.selectedJob.id === jobId) {
                this.selectedJob = null;
            }
            
            await this.saveJobs();
            this.renderJobs();
            this.updateJobsCount();
            this.updateGenerateButton();
        }
    }

    async clearAllJobs() {
        if (confirm('Are you sure you want to clear all jobs?')) {
            this.jobs = [];
            this.selectedJob = null;
            await this.saveJobs();
            this.renderJobs();
            this.updateJobsCount();
            this.updateGenerateButton();
        }
    }

    searchJobs(query) {
        const items = document.querySelectorAll('.job-item');
        const lowercaseQuery = query.toLowerCase();
        
        items.forEach(item => {
            const title = item.querySelector('.job-title').textContent.toLowerCase();
            const company = item.querySelector('.job-company').textContent.toLowerCase();
            const description = item.querySelector('.job-description').textContent.toLowerCase();
            
            const matches = title.includes(lowercaseQuery) || 
                          company.includes(lowercaseQuery) || 
                          description.includes(lowercaseQuery);
            
            item.style.display = matches ? 'block' : 'none';
        });
    }

    toggleSortDropdown() {
        console.log('toggleSortDropdown called');
        const dropdown = document.getElementById('sort-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            console.log('Dropdown toggled, classes:', dropdown.classList.toString());
        } else {
            console.error('Sort dropdown element not found');
        }
    }
    
    closeSortDropdown() {
        const dropdown = document.getElementById('sort-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
    
    selectSortOption(value) {
        const sortText = document.getElementById('sort-text');
        const options = document.querySelectorAll('.sort-option');
        
        options.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.value === value) {
                option.classList.add('selected');
                if (sortText) {
                    sortText.textContent = option.textContent;
                }
            }
        });
        
        this.closeSortDropdown();
    }

    sortJobs(sortBy) {
        const jobsCopy = [...this.jobs];
        
        switch (sortBy) {
            case 'score':
                jobsCopy.sort((a, b) => {
                    const scoreA = a.matchAnalysis?.score || -1;
                    const scoreB = b.matchAnalysis?.score || -1;
                    return scoreB - scoreA; // Descending order (highest score first)
                });
                break;
            case 'title':
                jobsCopy.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'date':
            default:
                jobsCopy.sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
                break;
        }
        
        this.jobs = jobsCopy;
        this.renderJobs();
    }

    async handleResumeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Show processing state
        const resumeStatus = document.getElementById('resume-status');
        if (resumeStatus) {
            resumeStatus.textContent = `⏳ Processing ${file.name}...`;
            resumeStatus.style.color = '#fbbf24';
        }
        
        try {
        this.resumeFile = file;
        await this.saveResume();
        
        // Automatically set the newly uploaded resume as active
        if (this.storedResumes.length > 0) {
            this.activeResumeId = this.storedResumes[this.storedResumes.length - 1].id; // Last uploaded
            await this.saveActiveResumeId();
        }
        
        this.updateResumeStatus();
        this.updateActiveResumeDisplay();
        this.updateGenerateButton();
            
            // Show format-specific success messages
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();
            
            if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                fileName.endsWith('.docx')) {
                setTimeout(() => {
                    this.setStatus('capture-status', '✅ DOCX document processed successfully! Text extracted and ready for job matching.', 'success');
                }, 1000);
            } else if (fileName.endsWith('.doc')) {
                setTimeout(() => {
                    this.setStatus('capture-status', '✅ DOC document processed successfully! Text extracted and ready for job matching.', 'success');
                }, 1000);
            } else if (fileName.endsWith('.txt')) {
                setTimeout(() => {
                    this.setStatus('capture-status', '✅ Text file processed perfectly! Ready for job matching.', 'success');
                }, 1000);
            }
            
            // Ask user if they want to re-score existing jobs
            if (this.jobs.length > 0) {
                const shouldRescore = confirm(`Resume updated! Would you like to re-analyze your ${this.jobs.length} job(s) with the new resume?`);
                if (shouldRescore) {
                    // Clear existing scores and re-score
                    this.jobs.forEach(job => job.matchAnalysis = null);
                    await this.saveJobs();
                    this.renderJobs();
                    setTimeout(() => this.scoreAllJobs(), 500);
                }
            }
        } catch (error) {
            console.error('Resume upload failed:', error);
            
            // Reset file input
            event.target.value = '';
            
            // Show error message
            this.setStatus('capture-status', `Resume upload failed: ${error.message}`, 'error');
            

            
            // Update resume status
            this.updateResumeStatus();
            this.updateGenerateButton();
        }
    }

    updateResumeStatus() {
        const statusEl = document.getElementById('resume-status');
        if (this.resumeFile) {
            statusEl.textContent = `✅ ${this.resumeFile.name}`;
            statusEl.style.color = '#10b981';
            
            // Add debug info
            console.log('Resume file info:', {
                name: this.resumeFile.name,
                type: this.resumeFile.type,
                size: this.resumeFile.size,
                lastModified: new Date(this.resumeFile.lastModified)
            });
        } else {
            statusEl.textContent = '';
            statusEl.style.color = '';
        }
    }

    renderStoredResumes() {
        const container = document.getElementById('resume-items');
        const managementSection = document.getElementById('resume-management');
        
        if (!container || !managementSection) return;

        if (this.storedResumes.length === 0) {
            managementSection.style.display = 'none';
            return;
        }

        managementSection.style.display = 'block';
        
        container.innerHTML = this.storedResumes.map(resume => `
            <div class="resume-item ${resume.id === this.activeResumeId ? 'active' : ''}" data-resume-id="${resume.id}">
                <div class="resume-item-info">
                    <div class="resume-item-name">${this.escapeHtml(resume.name)}</div>
                    <div class="resume-item-details">
                        ${resume.extractedLength} characters • Uploaded ${new Date(resume.uploadedAt).toLocaleDateString()}
                        ${resume.id === this.activeResumeId ? ' • <strong>Currently Active</strong>' : ''}
                    </div>
                </div>
                <div class="resume-item-actions">
                    <button class="resume-action-btn danger" data-action="delete" data-resume-id="${resume.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.resume-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const resumeId = btn.getAttribute('data-resume-id');
                
                if (action === 'delete') {
                    this.deleteStoredResume(resumeId);
                }
            });
        });
    }

    async activateResume(resumeId) {
        const resume = this.storedResumes.find(r => r.id === resumeId);
        if (!resume) return;

        this.activeResumeId = resumeId;
        
        // Create a File object from the stored resume
        // Note: We store extracted text content, so we should use text/plain type
        const blob = new Blob([resume.content], { type: 'text/plain' });
        this.resumeFile = new File([blob], resume.name, { 
            type: 'text/plain',
            lastModified: new Date(resume.uploadedAt).getTime()
        });
        this.resumeData = resume.content;
        
        // Save the active resume ID
        await this.saveActiveResumeId();
        
        // Update UI
        this.renderStoredResumes();
        this.updateActiveResumeDisplay();
        this.updateResumeStatus();
        this.updateGenerateButton();
        
        console.log(`Activated resume: ${resume.name}`);
    }

    async deleteStoredResume(resumeId) {
        if (!confirm('Are you sure you want to delete this resume?')) return;

        const resumeIndex = this.storedResumes.findIndex(r => r.id === resumeId);
        if (resumeIndex === -1) return;

        const deletedResume = this.storedResumes[resumeIndex];
        this.storedResumes.splice(resumeIndex, 1);

        // If we deleted the active resume, clear it
        if (this.activeResumeId === resumeId) {
            this.activeResumeId = null;
            this.resumeFile = null;
            this.resumeData = null;
            
            // If there are other resumes, activate the first one
            if (this.storedResumes.length > 0) {
                await this.activateResume(this.storedResumes[0].id);
            } else {
                await this.saveActiveResumeId(); // Save null activeResumeId
            }
        }

        await this.saveStoredResumes();
        this.renderStoredResumes();
        this.updateActiveResumeDisplay();
        this.updateResumeStatus();
        this.updateGenerateButton();
        
        console.log(`Deleted resume: ${deletedResume.name}`);
    }

    async clearAllResumes() {
        if (!confirm('Are you sure you want to delete all stored resumes? This action cannot be undone.')) return;

        this.storedResumes = [];
        this.activeResumeId = null;
        this.resumeFile = null;
        this.resumeData = null;

        await this.saveStoredResumes();
        await this.saveActiveResumeId();
        await chrome.storage.local.remove(['resumeFile']); // Also clear legacy storage
        
        this.renderStoredResumes();
        this.updateActiveResumeDisplay();
        this.updateResumeStatus();
        this.updateGenerateButton();
        
        console.log('Cleared all stored resumes');
    }

    updateJobsCount() {
        const countEl = document.getElementById('jobs-count');
        if (!this.jobs || !Array.isArray(this.jobs)) {
            console.warn('Jobs array not available in updateJobsCount');
            this.jobs = [];
        }
        if (countEl) {
            countEl.textContent = `${this.jobs.length} job${this.jobs.length !== 1 ? 's' : ''}`;
        }
    }

    updateGenerateButton() {
        const generateBtn = document.getElementById('generate-btn');
        const generateStatus = document.getElementById('generate-status');
        const selectedJobsSection = document.getElementById('selected-jobs-section');
        
        // Check if we have selected jobs (multi-selection mode) or a single selected job
        const hasSelectedJobs = this.selectedJobs.size > 0;
        const hasSingleJob = this.selectedJob && !hasSelectedJobs;
        
        if (hasSelectedJobs) {
            // Multi-job selection mode
            generateBtn.disabled = false;
            generateStatus.textContent = `Ready to generate documents for ${this.selectedJobs.size} job${this.selectedJobs.size > 1 ? 's' : ''}`;
            selectedJobsSection.style.display = 'block';
            this.renderSelectedJobs();
        } else if (hasSingleJob) {
            // Single job selection mode (legacy)
            generateBtn.disabled = false;
            generateStatus.textContent = `Ready to generate for: ${this.selectedJob.title}`;
            selectedJobsSection.style.display = 'none';
        } else {
            // No jobs selected
            generateBtn.disabled = true;
            generateStatus.textContent = 'Select jobs from the Jobs tab';
            selectedJobsSection.style.display = 'none';
        }
        
        // Show/hide template customization based on document type
        this.toggleTemplateCustomization();
    }
    
    renderSelectedJobs() {
        const container = document.getElementById('selected-jobs-list');
        if (!container) return;
        
        const selectedJobsArray = Array.from(this.selectedJobs).map(jobId => 
            this.jobs.find(job => job.id === jobId)
        ).filter(job => job); // Filter out any undefined jobs
        
        container.innerHTML = selectedJobsArray.map(job => {
            const generationStatus = job.generationStatus || 'pending';
            
            return `
                <div class="selected-job-card" data-job-id="${job.id}">
                    <div class="selected-job-header">
                        <div class="selected-job-info">
                            <div class="selected-job-title">${this.escapeHtml(job.title)}</div>
                            <div class="selected-job-company">${this.escapeHtml(job.company)}</div>
                        </div>
                        <div class="selected-job-status">
                            <div class="job-generation-status ${generationStatus}">
                                ${this.getGenerationStatusText(generationStatus)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    updateJobDocumentType(jobId, docType) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            job.selectedDocType = docType;
            this.saveJobs(); // Save the selection
        }
    }
    
    getGenerationStatusText(status) {
        switch (status) {
            case 'pending': return 'Ready to generate';
            case 'generating': return 'Generating...';
            case 'completed': return 'Generated successfully';
            case 'error': return 'Generation failed';
            default: return 'Ready to generate';
        }
    }

    async generateDocument() {
        // Check if we have selected jobs
        const hasSelectedJobs = this.selectedJobs.size > 0;
        
        if (hasSelectedJobs) {
            // Always generate for all selected jobs
            await this.generateMultipleDocuments();
        } else if (this.selectedJob && this.resumeFile) {
            // Fallback for old single job selection (if any)
            await this.generateSingleDocument();
        } else {
            this.setStatus('generate-status', 'Please select jobs from the Jobs tab first', 'info');
        }
    }


    
    async generateMultipleDocuments() {
        const selectedJobsArray = Array.from(this.selectedJobs).map(jobId => 
            this.jobs.find(job => job.id === jobId)
        ).filter(job => job);
        
        if (selectedJobsArray.length === 0) return;
        
        const docFormat = this.getSelectedDocumentFormat();
        const generateBtn = document.getElementById('generate-btn');
        const generateStatus = document.getElementById('generate-status');
        
        // Disable generate button during generation
        generateBtn.disabled = true;
        generateStatus.textContent = 'Generating documents...';
        
        try {
            // Get resume text and API key once
            const activeResume = this.getActiveResume();
            if (!activeResume) {
                throw new Error('No active resume found. Please upload and select a resume first.');
            }
            
            const resumeText = activeResume.content;
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                throw new Error('OpenAI API key not configured. Please set your API key in the extension settings.');
            }
            
            let successCount = 0;
            let errorCount = 0;
            
            // Get document type from global settings
            const docType = this.getSelectedDocumentType();
            
            // Generate documents sequentially
            for (let i = 0; i < selectedJobsArray.length; i++) {
                const job = selectedJobsArray[i];
                
                try {
                    // Update job status to generating
                    job.generationStatus = 'generating';
                    this.renderSelectedJobs();
                    
                    generateStatus.textContent = `Generating ${docType} for ${job.title} (${i + 1}/${selectedJobsArray.length})...`;
                    
                    // Generate document
                    const content = await this.generateOptimizedDocument(resumeText, job, docType, apiKey);
                    
                    // Create blob and store document
                    const blob = await this.createDocumentBlob(content, docType, job.title, docFormat);
                    const mimeType = this.getDocumentMimeType(docFormat);
                    
                    // Initialize generatedDocs array if it doesn't exist
                    if (!job.generatedDocs) {
                        job.generatedDocs = [];
                    }
                    
                    // Remove existing documents of the same type, keep others
                    job.generatedDocs = job.generatedDocs.filter(doc => doc.type !== docType);
                    
                    // Store as base64 for persistence
                    const arrayBuffer = await blob.arrayBuffer();
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
                    
                    job.generatedDocs.push({
                        type: docType,
                        format: docFormat,
                        mimeType,
                        base64,
                        timestamp: Date.now()
                    });
                    
                    job.generationStatus = 'completed';
                    successCount++;
                    
                } catch (error) {
                    console.error(`Error generating document for job ${job.id}:`, error);
                    job.generationStatus = 'error';
                    errorCount++;
                }
                
                // Update UI after each job
                this.renderSelectedJobs();
                await this.saveJobs();
                
                // Small delay between generations to avoid overwhelming the API
                if (i < selectedJobsArray.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            // Final status update
            if (errorCount === 0) {
                generateStatus.textContent = `Successfully generated ${successCount} documents!`;
            } else {
                generateStatus.textContent = `Generated ${successCount} documents, ${errorCount} failed.`;
            }
            
        } catch (error) {
            console.error('Multi-document generation error:', error);
            generateStatus.textContent = `Error: ${error.message}`;
        } finally {
            generateBtn.disabled = false;
        }
    }
    
    async generateSingleDocument() {
        const docType = this.getSelectedDocumentType();
        const docFormat = this.getSelectedDocumentFormat();
        
        this.setStatus('generate-status', `Generating document with ChatGPT-4o...`, 'info');
        
        try {
            // Read resume file
            const resumeText = await this.readFileAsText(this.resumeFile);
            
            // Get API key from storage
            const apiKey = await this.getApiKey();
            if (!apiKey) throw new Error('OpenAI API key not configured. Please set your API key in the extension settings.');
            
            // Generate document with optimized prompts
            const content = await this.generateOptimizedDocument(resumeText, this.selectedJob, docType, apiKey);
            
            // Create blob and store document
            const blob = await this.createDocumentBlob(content, docType, this.selectedJob.title, docFormat);
            const mimeType = this.getDocumentMimeType(docFormat);
            
            // Initialize generatedDocs array if it doesn't exist
            if (!this.selectedJob.generatedDocs) {
                this.selectedJob.generatedDocs = [];
            }
            
            // Remove existing documents of the same type, keep others
            this.selectedJob.generatedDocs = this.selectedJob.generatedDocs.filter(doc => doc.type !== docType);
            
            // Store as base64 for persistence
            const arrayBuffer = await blob.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            this.selectedJob.generatedDocs.push({
                type: docType,
                format: docFormat,
                mimeType,
                base64,
                timestamp: Date.now()
            });
            
            await this.saveJobs();
            
            // Download as usual
            await this.downloadDocument(content, docType, this.selectedJob.title, docFormat);
            
            this.setStatus('generate-status', `Document generated successfully as ${docFormat.toUpperCase()}!`, 'success');
        } catch (error) {
            console.error('Generation error:', error);
            this.setStatus('generate-status', `Error: ${error.message}`, 'error');
        }
    }
    
    async createDocumentBlob(content, docType, jobTitle, docFormat) {
        if (docFormat === 'pdf') {
            return await this.generatePDF(content, docType, jobTitle);
        } else if (docFormat === 'docx') {
            return await this.generateWord(content, docType, jobTitle);
        } else {
            const formattedContent = `${this.formatDocumentTitle(docType, jobTitle)}\n\n${content}`;
            return new Blob([formattedContent], { type: 'text/plain' });
        }
    }
    
    getDocumentMimeType(docFormat) {
        switch (docFormat) {
            case 'pdf': return 'application/pdf';
            case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            default: return 'text/plain';
        }
    }

    async generateOptimizedDocument(resumeText, job, docType, apiKey) {
        let systemPrompt = '';
        let userPrompt = '';
        
        switch (docType) {
            case 'resume':
                // Check if we have pre-extracted structured data
                let extractedData;
                const activeResume = this.storedResumes.find(r => r.id === this.activeResumeId);
                
                if (activeResume && activeResume.structuredData) {
                    console.log('✅ Using pre-extracted structured data from resume upload');
                    extractedData = activeResume.structuredData;
                } else {
                    console.log('🔍 No pre-extracted data found, extracting structured data now...');
                    extractedData = await this.extractResumeData(resumeText, apiKey);
                }
                
                // Then generate tailored resume using our template
                return await this.generateTemplatedResume(extractedData, job, apiKey);
                break;

            case 'cover-letter':
                // Use structured data for cover letters too
                let coverLetterExtractedData;
                const coverLetterActiveResume = this.storedResumes.find(r => r.id === this.activeResumeId);
                
                if (coverLetterActiveResume && coverLetterActiveResume.structuredData) {
                    console.log('✅ Using pre-extracted structured data for cover letter generation');
                    coverLetterExtractedData = coverLetterActiveResume.structuredData;
                } else {
                    console.log('🔍 No pre-extracted data found, extracting structured data for cover letter...');
                    coverLetterExtractedData = await this.extractResumeData(resumeText, apiKey);
                }

                systemPrompt = `You are a professional cover letter writer. Create compelling, personalized cover letters that demonstrate genuine interest and relevant qualifications.

CRITICAL RULES:
- Write in a professional, engaging tone
- Reference specific details from the job posting
- Highlight relevant experience from the resume data
- Keep it concise (3-4 paragraphs maximum)
- Show enthusiasm for the role and company
- NEVER invent experience not in the resume data
- Use the structured resume data to create targeted narratives`;

                userPrompt = `Write a compelling cover letter for this job application using the structured resume data:

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

STRUCTURED RESUME DATA:
${JSON.stringify(coverLetterExtractedData, null, 2)}

REQUIREMENTS:
1. Use the person's actual name from personalInfo
2. Address the hiring manager professionally
3. Open with enthusiasm for the specific role at the specific company
4. Highlight 2-3 most relevant experiences from the experience array that match the job requirements
5. Reference specific skills from coreSkills that align with the job description
6. Show knowledge of the company/role requirements
7. Close with a professional call to action
8. Keep it under 400 words
9. Format as a proper business letter with sender's contact information from personalInfo

EXAMPLE STRUCTURE:
[Your Name from personalInfo]
[Your Address from personalInfo]
[Your Phone and Email from personalInfo]

[Date]

Dear Hiring Manager,

I am writing to express my strong interest in the [Job Title] position at [Company]. With [relevant experience summary from experience array], I am excited about the opportunity to contribute to [company-specific mention].

In my role as [most relevant job title from experience], I [specific achievement or responsibility that matches job requirements]. My experience in [relevant skills from coreSkills] has prepared me well for the challenges outlined in your job posting, particularly [specific job requirement].

Additionally, my background in [second relevant experience/skill] and [third relevant experience/skill] aligns perfectly with your needs for [job-specific requirement]. I am particularly drawn to [company/role-specific detail from job description].

I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to [Company]'s continued success. Thank you for considering my application.

Sincerely,
[Your Name]`;
                break;

            case 'both':
                // Generate both cover letter and resume
                // Get structured data for both documents
                let bothCoverLetterExtractedData;
                const bothCoverLetterActiveResume = this.storedResumes.find(r => r.id === this.activeResumeId);
                
                if (bothCoverLetterActiveResume && bothCoverLetterActiveResume.structuredData) {
                    console.log('✅ Using pre-extracted structured data for both document generation');
                    bothCoverLetterExtractedData = bothCoverLetterActiveResume.structuredData;
                } else {
                    console.log('🔍 No pre-extracted data found, extracting structured data for both documents...');
                    bothCoverLetterExtractedData = await this.extractResumeData(resumeText, apiKey);
                }

                const coverLetterSystemPrompt = `You are a professional cover letter writer. Create compelling, personalized cover letters that demonstrate genuine interest and relevant qualifications.

CRITICAL RULES:
- Write in a professional, engaging tone
- Reference specific details from the job posting
- Highlight relevant experience from the resume data
- Keep it concise (3-4 paragraphs maximum)
- Show enthusiasm for the role and company
- NEVER invent experience not in the resume data
- Use the structured resume data to create targeted narratives`;

                const coverLetterUserPrompt = `Write a compelling cover letter for this job application using the structured resume data:

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

STRUCTURED RESUME DATA:
${JSON.stringify(bothCoverLetterExtractedData, null, 2)}

REQUIREMENTS:
1. Use the person's actual name from personalInfo
2. Address the hiring manager professionally
3. Open with enthusiasm for the specific role at the specific company
4. Highlight 2-3 most relevant experiences from the experience array that match the job requirements
5. Reference specific skills from coreSkills that align with the job description
6. Show knowledge of the company/role requirements
7. Close with a professional call to action
8. Keep it under 400 words
9. Format as a proper business letter with sender's contact information from personalInfo`;

                // Generate cover letter first
                const coverLetterResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [
                            { role: 'system', content: coverLetterSystemPrompt },
                            { role: 'user', content: coverLetterUserPrompt }
                        ],
                        max_tokens: 2000,
                        temperature: 0.3
                    })
                });

                let coverLetterContent = '';
                if (coverLetterResponse.ok) {
                    const coverLetterResult = await coverLetterResponse.json();
                    coverLetterContent = coverLetterResult.choices[0].message.content;
                    this.incrementApiCalls();
                } else {
                    const error = await coverLetterResponse.json();
                    throw new Error(error.error?.message || `Cover Letter API Error: ${coverLetterResponse.status}`);
                }

                // Generate resume using the same structured data
                const resumeContent = await this.generateTemplatedResume(bothCoverLetterExtractedData, job, apiKey, false);

                // Increment document generated counter once for the combined document
                this.incrementDocGenerated();

                // Combine both documents
                return `COVER LETTER\n\n${coverLetterContent}\n\n\n${'='.repeat(50)}\n\nTAILORED RESUME\n\n${resumeContent}`;
                break;
        }

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
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            this.incrementApiCalls();
            this.incrementDocGenerated();
            return result.choices[0].message.content;
        } else {
            const error = await response.json();
            throw new Error(error.error?.message || `API Error: ${response.status} - ${response.statusText}`);
        }
    }

    async extractResumeData(resumeText, apiKey) {
        const systemPrompt = `You are a resume data extraction expert. Extract structured information from resumes and return it in a standardized JSON format.

CRITICAL RULES:
- Extract ONLY information that exists in the resume
- Do NOT invent or assume any information
- Preserve exact dates, company names, and job titles
- Extract skills exactly as written
- Maintain all factual accuracy`;

        const userPrompt = `Extract structured data from this resume and return it in the following JSON format:

RESUME TEXT:
${resumeText}

REQUIRED JSON STRUCTURE:
{
  "personalInfo": {
    "name": "Full Name",
    "location": "City, State",
    "phone": "Phone Number",
    "email": "Email Address",
    "citizenship": "Citizenship status if mentioned"
  },
  "professionalSummary": "2-3 sentence summary of experience",
  "coreSkills": [
    "Skill 1",
    "Skill 2",
    "Skill 3"
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "responsibilities": [
        "Responsibility 1",
        "Responsibility 2"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "location": "City, State",
      "year": "Graduation Year or Date Range"
    }
  ],
  "licenses": [
    "License or certification"
  ],
  "additionalSections": {
    "tools": ["Tool 1", "Tool 2"],
    "languages": ["Language 1", "Language 2"],
    "projects": [],
    "certifications": []
  }
}

Return ONLY the JSON object with extracted data.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 4000,
                temperature: 0.1
            })
        });

        if (response.ok) {
            const result = await response.json();
            const content = result.choices[0].message.content;
            
            try {
                // Clean and parse JSON
                let cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
                const extractedData = JSON.parse(cleanContent);
                
                // Log the extracted data to help debug
                console.log('🔍 Extracted resume data:', extractedData);
                console.log('📊 Experience entries:', extractedData.experience?.length || 0);
                console.log('📚 Education entries:', extractedData.education?.length || 0);
                console.log('🛠️ Skills count:', extractedData.coreSkills?.length || 0);
                
                return extractedData;
            } catch (error) {
                console.error('Error parsing extracted data:', error);
                console.error('Raw content that failed to parse:', content);
                throw new Error('Failed to extract resume data');
            }
        } else {
            throw new Error('Failed to extract resume data from API');
        }
    }

    getAmplificationModePrompt(mode) {
        const prompts = {
            precision: `You are a professional resume writer and markdown formatting expert. Create a tailored resume using the user's structured data and the job description provided.

Use ONLY the user's structured resume data. Tailor language to match the job description, but do not infer or add experience. Be conservative and fact-based.

🔧 FORMATTING RULES:
1. Start with: # [Full Name]
2. Section headers: ## [Section Name]
3. Job titles: **[Job Title]**
4. Degrees: **[Degree Name]**
5. Bullet points: - [Start with action verb, use 1 bullet per line]
6. Company format: [Company Name], [Location] | [Start Date] – [End Date]
7. NO bold for company/location/dates
8. Use proper em dash (–), not hyphen (-), for dates
9. Separate each section with ONE blank line

✍️ WRITING STYLE RULES:
- Use action verbs and quantifiable outcomes
- Frame each bullet in a Problem–Action–Result (PAR) or Action–Impact format
- Each bullet should be 15–25 words unless shorter is more impactful
- Avoid filler phrases (e.g., "responsible for")
- Do not use first-person pronouns

📐 STRUCTURE:
- Professional Summary (2–3 lines)
- Core Skills (thematic grouping)
- Experience (highlight JD-relevant tasks, but preserve resume breadth)
- Education, Licenses, Tools (at the bottom)

📌 PRECISION MODE BEHAVIOR:
- Use ONLY the user's provided data
- Tailor language to match job description keywords
- Do not infer or add any experience, tools, or responsibilities
- Be conservative and fact-based in all descriptions

📏 RESUME LENGTH:
- Total word count: 400–600 words
- Should fit within 1–2 pages of standard formatting
- Focus on relevant experience without overcompressing
`,

            gap_filler: `You are a professional resume writer and markdown formatting expert. Create a tailored resume using the user's structured data and the job description provided.

You may infer reasonable, adjacent experiences that logically align with the user's roles, career level, and tools. Do not invent employers, job titles, or degrees.

🔧 FORMATTING RULES:
1. Start with: # [Full Name]
2. Section headers: ## [Section Name]
3. Job titles: **[Job Title]**
4. Degrees: **[Degree Name]**
5. Bullet points: - [Start with action verb, use 1 bullet per line]
6. Company format: [Company Name], [Location] | [Start Date] – [End Date]
7. NO bold for company/location/dates
8. Use proper em dash (–), not hyphen (-), for dates
9. Separate each section with ONE blank line

✍️ WRITING STYLE RULES:
- Use action verbs and quantifiable outcomes
- Frame each bullet in a Problem–Action–Result (PAR) or Action–Impact format
- Each bullet should be 15–25 words unless shorter is more impactful
- Avoid filler phrases (e.g., "responsible for")
- Do not use first-person pronouns

📐 STRUCTURE:
- Professional Summary (2–3 lines)
- Core Skills (thematic grouping)
- Experience (highlight JD-relevant tasks, but preserve resume breadth)
- Education, Licenses, Tools (at the bottom)

📌 GAP-FILLING BEHAVIOR:
- You may add context around tools, collaboration, or metrics that are likely associated with the user's experience
- Add missing but credible support functions or team interactions (e.g., "collaborated with adjacent departments")
- Add light outcome metrics where plausible (e.g., "reduced review cycles by 15%")
- DO NOT invent new companies, degrees, or jobs

📏 RESUME LENGTH:
- Total word count: 450–700 words
- Should fit within 1–2 pages of standard formatting
- Focus on relevant experience without overcompressing
`,

            beast_mode: `You are an elite executive resume writer. Create a bold, high-impact resume using the user's structured experience and the job description provided.

You are AGGRESSIVE in expanding the scope of roles to reflect leadership, cross-functional ownership, and strategic impact. Transform ordinary responsibilities into executive-level achievements with quantified results — but NEVER invent companies, job titles, or degrees.

🔧 FORMATTING RULES:
1. Start with: # [Full Name]
2. Section headers: ## [Section Name]
3. Job titles: **[Job Title]**
4. Degrees: **[Degree Name]**
5. Bullet points: - [Start with action verb, use 1 bullet per line]
6. Company format: [Company Name], [Location] | [Start Date] – [End Date]
7. NO bold for company/location/dates
8. Use proper em dash (–), not hyphen (-), for dates
9. Separate each section with ONE blank line

✍️ WRITING STYLE RULES:
- Each bullet MUST include quantified impact (percentages, dollar amounts, team sizes, timelines)
- Transform basic tasks into strategic initiatives with measurable outcomes
- Use power verbs: "Spearheaded", "Orchestrated", "Revolutionized", "Optimized", "Delivered"
- Show scale and complexity: "across 5 departments", "managing $2M budget", "leading 15-person team"
- Bullets should be 25–35 words with substantial impact claims
- No generic responsibilities - everything must demonstrate value creation

📐 STRUCTURE:
- Professional Summary (3 bold, impact-heavy lines with specific achievements)
- Core Skills (grouped strategically with expertise levels)
- Experience (each role shows escalating responsibility and measurable impact)
- Education, Licenses, Tools (concise but impressive)

🔥 BEAST MODE BEHAVIOR - BE AGGRESSIVE:
- QUANTIFY EVERYTHING with believable but impressive metrics:
  - "Increased efficiency by 35%", "Reduced costs by $400K annually"
  - "Led cross-functional team of 12", "Managed $1.5M project portfolio"
  - "Accelerated processes by 50%", "Improved client satisfaction to 96%"
  - "Generated $800K in additional revenue", "Streamlined operations saving 200 hours/month"

- ELEVATE EVERY RESPONSIBILITY:
  - "Managed contracts" → "Orchestrated $5M+ contract portfolio, reducing legal risks by 40% and accelerating deal closure by 25%"
  - "Coordinated with teams" → "Led cross-functional initiatives across 4 departments, aligning strategic objectives and delivering 20% faster project completion"
  - "Reviewed documents" → "Architected comprehensive review processes, eliminating 95% of compliance issues and preventing potential $2M in regulatory penalties"

- USE STRATEGIC LANGUAGE:
  - Position as driver of transformation, not executor of tasks
  - Show influence beyond direct reports: "advised C-suite", "influenced company-wide policy"
  - Demonstrate thought leadership: "pioneered new methodology", "established best practices"

- CREDIBLE EXAGGERATION GUIDELINES:
  - Stay within 2x of realistic expectations for the role level
  - Use industry-appropriate metrics (tech: user growth, finance: cost savings, operations: efficiency)
  - Scale achievements appropriately: coordinator level vs director level impacts

📏 RESUME LENGTH:
- Aim for 600–800 words max
- Every word must justify its presence with impact demonstration
- Focus on transformation stories and measurable business value
`
        };
        
        return prompts[mode] || prompts.precision;
    }

    async generateTemplatedResume(extractedData, job, apiKey, shouldIncrementDocGenerated = true) {
        const selectedSections = this.getSelectedTemplateSections();
        const amplificationMode = this.getSelectedAmplificationMode();
        
        const systemPrompt = this.getAmplificationModePrompt(amplificationMode);

        // Build template format based on selected sections
        let templateFormat = `# [Name]
[Location] | [Citizenship if applicable]
Phone: [Phone] | Email: [Email]`;

        if (selectedSections.includeSummary) {
            templateFormat += `

## Professional Summary
[2-3 sentences highlighting most relevant experience for this job]`;
        }

        if (selectedSections.includeSkills) {
            templateFormat += `

## Core Skills
- [Most relevant skill 1]
- [Most relevant skill 2]
- [Most relevant skill 3]
- [Additional relevant skills]`;
        }

        if (selectedSections.includeExperience) {
            templateFormat += `

## Professional Experience
**[Job Title]**
[Company Name], [Location] | [Start Date] – [End Date]
- [Tailored responsibility emphasizing job-relevant skills]
- [Achievement with quantifiable results if available]
- [Additional relevant responsibility]`;
        }

        if (selectedSections.includeEducation) {
            templateFormat += `

## Education
**[Degree Name]**
[Institution Name], [Location] | [Year]`;
        }

        if (selectedSections.includeLicenses) {
            templateFormat += `

## Licenses & Admissions
- [License/Certification 1]
- [License/Certification 2]`;
        }

        if (selectedSections.includeTools) {
            templateFormat += `

## Tools & Platforms
- [Relevant tools and technologies]`;
        }

        // Get selected enhancements for integration
        const selectedEnhancements = this.getSelectedEnhancements();
        const enhancementInstructions = selectedEnhancements.length > 0 ? 
            `\n\nSPECIAL ENHANCEMENT INSTRUCTIONS:
${selectedEnhancements.map(e => `- ${e.category} - ${e.title}: ${e.description} (Priority: ${e.priority})`).join('\n')}

These enhancements should be woven naturally into the resume content to address identified gaps. Focus on high-priority enhancements first.` : '';

        const userPrompt = `Create a tailored resume using this data and job requirements:

EXTRACTED RESUME DATA:
${JSON.stringify(extractedData, null, 2)}

JOB REQUIREMENTS:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}${enhancementInstructions}

TEMPLATE FORMAT TO FOLLOW:
${templateFormat}

SECTION CONFIGURATION:
- Professional Summary: ${selectedSections.includeSummary ? 'INCLUDE' : 'EXCLUDE'}
- Core Skills: ${selectedSections.includeSkills ? 'INCLUDE' : 'EXCLUDE'}
- Professional Experience: ${selectedSections.includeExperience ? 'INCLUDE' : 'EXCLUDE'}
- Education: ${selectedSections.includeEducation ? 'INCLUDE' : 'EXCLUDE'}
- Licenses & Admissions: ${selectedSections.includeLicenses ? 'INCLUDE' : 'EXCLUDE'}
- Tools & Platforms: ${selectedSections.includeTools ? 'INCLUDE' : 'EXCLUDE'}

CRITICAL FORMATTING RULES:
1. Start with exactly: # [Full Name] (with # and space)
2. Use exactly: ## [Section Name] (with ## and space) for ALL section headers
3. For job titles use exactly: **[Job Title]** (with ** on both sides)
4. For company info use exactly: [Company Name], [Location] | [Start Date] – [End Date]
5. Use exactly: - [bullet point] (with - and space) for all bullet points
6. Use exactly: **[Degree Name]** (with ** on both sides) for education
7. Separate each section with exactly one blank line
8. Do NOT use any other formatting like bold company names or italic text

EXAMPLE FORMAT:
# Ricardo E. Zuloaga
New York, NY | United States & Venezuela
Phone: +1 917-254-9676 | Email: ricardozuloaga@gmail.com

## Professional Summary
[Content here]

## Core Skills
- [Skill 1]
- [Skill 2]

## Professional Experience
**Contracts Manager / Senior Legal & Commercial Advisor**
Zumar Trading Corp., New York, NY | 2020 – Present
- [Responsibility 1]
- [Responsibility 2]

## Education
**LL.M.**
Duke University School of Law, Durham, NC | 2013 – 2014

INSTRUCTIONS:
1. Follow the exact formatting rules above
2. Prioritize information most relevant to the job
3. Rewrite responsibilities to include job keywords naturally
4. Emphasize achievements that match job requirements
5. Order experience by relevance to target role
6. Only include sections marked as INCLUDE above
7. Return ONLY the formatted resume content, no explanations`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 6000,
                temperature: 0.3
            })
        });

        if (response.ok) {
            const result = await response.json();
            this.incrementApiCalls();
            if (shouldIncrementDocGenerated) {
                this.incrementDocGenerated();
            }
            return result.choices[0].message.content;
        } else {
            const error = await response.json();
            throw new Error(error.error?.message || `API Error: ${response.status} - ${response.statusText}`);
        }
    }

    async readFileAsText(file) {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        console.log(`Processing file: ${file.name} (${fileType})`);
        
        try {
            // Handle different file types with proper parsers
            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                return await this.extractTextFromPDF(file);
            } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
                return await this.extractTextFromDocx(file);
            } else if (fileName.endsWith('.doc')) {
                return await this.extractTextFromDoc(file);
            } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                return await this.extractTextFromPlainText(file);
            } else {
                // For unknown file types, try plain text extraction
                console.warn(`Unknown file type: ${fileType}. Attempting plain text extraction.`);
                return await this.extractTextFromPlainText(file);
            }
        } catch (error) {
            console.error('Error extracting text from file:', error);
            throw new Error(`Failed to extract text from ${file.name}: ${error.message}`);
        }
    }

    async extractTextFromPlainText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                if (!content || content.trim().length === 0) {
                    reject(new Error('The file appears to be empty.'));
                    return;
                }
                console.log(`✅ Plain text extracted: ${content.length} characters`);
                resolve(content);
            };
            reader.onerror = () => reject(new Error('Failed to read the text file.'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    async extractTextFromDocx(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    console.log('📄 Processing DOCX file...');
                    
                    // Method 1: Try proper DOCX parsing
                    try {
                        const text = await this.parseDocxContent(arrayBuffer);
                        if (text && text.trim().length > 50) {
                            console.log(`✅ DOCX text extracted via XML parsing: ${text.length} characters`);
                            resolve(text);
                            return;
                        }
                    } catch (xmlError) {
                        console.warn('XML parsing failed, trying alternative methods:', xmlError.message);
                    }
                    
                    // Method 2: Try reading as binary text (fallback)
                    try {
                        const uint8Array = new Uint8Array(arrayBuffer);
                        const binaryText = this.extractTextFromDocBinary(uint8Array);
                        if (binaryText && binaryText.trim().length > 50) {
                            console.log(`✅ DOCX text extracted via binary parsing: ${binaryText.length} characters`);
                            resolve(binaryText);
                            return;
                        }
                    } catch (binaryError) {
                        console.warn('Binary parsing failed:', binaryError.message);
                    }
                    
                    // Method 3: Simple binary text extraction as last resort
                    try {
                        console.log('Trying simple binary text extraction...');
                        const simpleText = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer))
                            .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')  // Remove control characters
                            .replace(/\s+/g, ' ')  // Normalize whitespace
                            .trim();
                            
                        if (simpleText && simpleText.length > 100) {
                            console.log(`✅ Simple binary extraction found ${simpleText.length} characters`);
                            resolve(simpleText);
                            return;
                        }
                    } catch (simpleError) {
                        console.warn('Simple binary extraction failed:', simpleError.message);
                    }
                    
                    // Method 4: Ask user to provide plain text
                    const errorMsg = `Resume file issue: Failed to extract text from ${file.name}: ❌ Unable to extract text from Word document. 

IMMEDIATE SOLUTION:
1. Open your Word document
2. Select All (Ctrl+A / Cmd+A)  
3. Copy (Ctrl+C / Cmd+C)
4. Open Notepad/TextEdit
5. Paste and Save as .txt file
6. Upload the .txt file instead

This will give you immediate access to job matching while we improve Word support.`;
                    
                    reject(new Error(errorMsg));
                } catch (error) {
                    reject(new Error(`Failed to process Word document: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read Word document file.'));
            reader.readAsArrayBuffer(file);
        });
    }

    async extractTextFromDoc(file) {
        // Legacy .doc files are more complex to parse, fall back to text extraction
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    console.log('📄 Processing legacy DOC file...');
                    
                    // Extract text using a heuristic approach for legacy .doc files
                    let extractedText = this.extractTextFromDocBinary(content);
                    
                    if (!extractedText || extractedText.trim().length < 20) {
                        reject(new Error('Could not extract readable text from legacy Word document. Please save as .txt or .docx file.'));
                        return;
                    }
                    
                    console.log(`✅ DOC text extracted: ${extractedText.length} characters`);
                    resolve(extractedText);
                } catch (error) {
                    reject(new Error(`Failed to parse legacy Word document: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read legacy Word document.'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    async extractTextFromPDF(file) {
        // Basic PDF text extraction - for now, provide clear instructions
        throw new Error('PDF text extraction not yet implemented. Please copy text from your PDF and save as a .txt file, or export your PDF as a Word document (.docx).');
    }

    async parseDocxContent(arrayBuffer) {
        try {
            console.log('📄 Starting proper DOCX parsing...');
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Implement proper ZIP file parsing
            const zipEntries = this.parseZipFile(uint8Array);
            console.log(`📁 Found ${zipEntries.length} ZIP entries`);
            
            // Find document.xml
            const documentEntry = zipEntries.find(entry => 
                entry.filename === 'word/document.xml' || 
                entry.filename.endsWith('document.xml')
            );
            
            if (!documentEntry) {
                throw new Error('document.xml not found in DOCX file');
            }
            
            console.log('📄 Found document.xml, extracting content...');
            
            // Extract and decompress the file content
            const xmlContent = await this.extractZipEntry(uint8Array, documentEntry);
            const textContent = this.parseWordXml(xmlContent);
            
            if (!textContent || textContent.length < 50) {
                throw new Error('No meaningful text content found in document.xml');
            }
            
            console.log(`✅ Successfully extracted ${textContent.length} characters from DOCX`);
            return this.cleanExtractedText(textContent);
        } catch (error) {
            console.error('DOCX parsing error:', error);
            throw new Error(`DOCX parsing failed: ${error.message}`);
        }
    }

    parseZipFile(data) {
        const entries = [];
        let offset = 0;
        
        console.log('🔍 Parsing ZIP file structure...');
        
        // Look for local file headers (signature: 0x04034b50)
        while (offset < data.length - 4) {
            const signature = this.readUint32LE(data, offset);
            
            if (signature === 0x04034b50) {
                // Found local file header
                const entry = this.parseLocalFileHeader(data, offset);
                if (entry) {
                    entries.push(entry);
                    offset = entry.dataOffset + entry.compressedSize;
                } else {
                    offset += 4;
                }
            } else if (signature === 0x02014b50) {
                // Central directory header - we can stop here
                break;
            } else {
                offset += 1;
            }
        }
        
        console.log(`📁 Found ${entries.length} files in ZIP`);
        return entries;
    }
    
    parseLocalFileHeader(data, offset) {
        try {
            const signature = this.readUint32LE(data, offset);
            if (signature !== 0x04034b50) return null;
            
            const version = this.readUint16LE(data, offset + 4);
            const flags = this.readUint16LE(data, offset + 6);
            const method = this.readUint16LE(data, offset + 8);
            const modTime = this.readUint16LE(data, offset + 10);
            const modDate = this.readUint16LE(data, offset + 12);
            const crc32 = this.readUint32LE(data, offset + 14);
            const compressedSize = this.readUint32LE(data, offset + 18);
            const uncompressedSize = this.readUint32LE(data, offset + 22);
            const filenameLength = this.readUint16LE(data, offset + 26);
            const extraLength = this.readUint16LE(data, offset + 28);
            
            const filenameOffset = offset + 30;
            const filename = this.readString(data, filenameOffset, filenameLength);
            
            const dataOffset = filenameOffset + filenameLength + extraLength;
            
            console.log(`📄 Found file: ${filename} (${compressedSize} bytes, method: ${method})`);
            
            return {
                filename,
                method,
                compressedSize,
                uncompressedSize,
                dataOffset,
                crc32
            };
        } catch (error) {
            console.warn('Error parsing file header:', error);
            return null;
        }
    }
    
    async extractZipEntry(data, entry) {
        console.log(`📤 Extracting ${entry.filename}...`);
        
        const compressedData = data.slice(entry.dataOffset, entry.dataOffset + entry.compressedSize);
        
        if (entry.method === 0) {
            // No compression (stored)
            console.log('📄 File is stored (no compression)');
            return new TextDecoder('utf-8').decode(compressedData);
        } else if (entry.method === 8) {
            // Deflate compression
            console.log('📄 File is deflate compressed, attempting decompression...');
            return await this.inflateData(compressedData);
        } else {
            throw new Error(`Unsupported compression method: ${entry.method}`);
        }
    }
    
    async inflateData(compressedData) {
        console.log('📦 Attempting to decompress deflate data...');
        
        try {
            // Try to use built-in decompression if available
            if (typeof DecompressionStream !== 'undefined') {
                console.log('✅ Using native DecompressionStream API');
                
                // Use proper deflate-raw format for ZIP files
                const stream = new DecompressionStream('deflate-raw');
                
                // Use Response API for simpler stream handling
                const response = new Response(
                    new ReadableStream({
                        start(controller) {
                            controller.enqueue(compressedData);
                            controller.close();
                        }
                    })
                );
                
                const decompressedStream = response.body.pipeThrough(stream);
                const decompressedResponse = new Response(decompressedStream);
                const decompressedBuffer = await decompressedResponse.arrayBuffer();
                
                const decompressed = new TextDecoder('utf-8').decode(decompressedBuffer);
                console.log(`✅ Decompression successful: ${decompressed.length} characters`);
                return decompressed;
            } else {
                // Fallback: try to extract readable text from compressed data
                console.log('⚠️ No native decompression API available, using fallback method');
                return this.extractTextFromCompressedData(compressedData);
            }
        } catch (error) {
            console.warn('Decompression failed, using fallback:', error);
            return this.extractTextFromCompressedData(compressedData);
        }
    }
    
    extractTextFromCompressedData(data) {
        // Extract readable text from compressed data using heuristics
        const text = new TextDecoder('utf-8', { fatal: false }).decode(data);
        
        // Look for XML-like patterns and readable text
        const xmlPatterns = [
            /<w:t[^>]*>([^<]+)<\/w:t>/g,
            />[^<]{3,}</g
        ];
        
        const foundTexts = [];
        
        for (const pattern of xmlPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const textContent = match[1] || match[0].replace(/[<>]/g, '');
                if (textContent.trim().length > 2) {
                    foundTexts.push(textContent.trim());
                }
            }
        }
        
        if (foundTexts.length > 0) {
            console.log(`📝 Extracted ${foundTexts.length} text fragments from compressed data`);
            return foundTexts.join(' ');
        }
        
        // Final fallback: look for any readable text
        const readableText = text
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (readableText.length > 50) {
            console.log('📄 Using general readable text extraction');
            return readableText;
        }
        
        throw new Error('Could not extract readable text from compressed data');
    }
    
    parseWordXml(xmlContent) {
        console.log('🔍 Parsing Word XML content...');
        
        const textElements = [];
        
        // Find all text elements in the XML
        const textTagPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        let match;
        
        while ((match = textTagPattern.exec(xmlContent)) !== null) {
            const textContent = match[1];
            if (textContent && textContent.trim().length > 0) {
                // Decode XML entities
                const decodedText = textContent
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                
                textElements.push(decodedText);
            }
        }
        
        console.log(`📝 Found ${textElements.length} text elements in XML`);
        
        if (textElements.length > 0) {
            const fullText = textElements.join(' ').replace(/\s+/g, ' ').trim();
            console.log(`📄 Combined XML text: ${fullText.length} characters`);
            return fullText;
        }
        
        // Fallback: remove all XML tags and extract text
        const fallbackText = xmlContent
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (fallbackText.length > 100) {
            console.log('📄 Using fallback XML text extraction');
            return fallbackText;
        }
        
        throw new Error('No text content found in XML');
    }
    
    // Utility functions for binary data reading
    readUint16LE(data, offset) {
        return data[offset] | (data[offset + 1] << 8);
    }
    
    readUint32LE(data, offset) {
        return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    }
    
    readString(data, offset, length) {
        const bytes = data.slice(offset, offset + length);
        return new TextDecoder('utf-8').decode(bytes);
    }

    cleanExtractedText(text) {
        // Final cleanup of extracted text
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
            .trim();
    }

    async downloadDocument(content, type, jobTitle, format = 'txt') {
        const sanitizedTitle = jobTitle.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `${type}-${sanitizedTitle}.${format}`;
        
        let blob;
        let mimeType;
        
        try {
            switch (format) {
                case 'pdf':
                    blob = await this.generatePDF(content, type, jobTitle);
                    mimeType = 'application/pdf';
                    break;
                    
                case 'docx':
                    blob = await this.generateWord(content, type, jobTitle);
                    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                    break;
                    
                case 'txt':
                default:
                    const formattedContent = `${this.formatDocumentTitle(type, jobTitle)}\n\n${content}`;
                    blob = new Blob([formattedContent], { type: 'text/plain' });
                    mimeType = 'text/plain';
                    break;
            }
            
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error generating document:', error);
            // Fallback to text format if other formats fail
            if (format !== 'txt') {
                console.log('Falling back to text format...');
                const fallbackBlob = new Blob([content], { type: 'text/plain' });
                const fallbackUrl = URL.createObjectURL(fallbackBlob);
                const fallbackA = document.createElement('a');
                fallbackA.href = fallbackUrl;
                fallbackA.download = `${type}-${sanitizedTitle}.txt`;
                fallbackA.click();
                URL.revokeObjectURL(fallbackUrl);
            }
            throw error;
        }
    }

    async generatePDF(content, type, jobTitle) {
        try {
            // Check if jsPDF library is loaded
            if (!window.jspdf || !window.jspdf.jsPDF) {
                throw new Error('jsPDF library not loaded');
            }
            
            // Use locally loaded jsPDF library
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set font and styling
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            // Add title
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(this.formatDocumentTitle(type, jobTitle), 20, 20);
            
            // Add content
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            // Split content into lines that fit the page
            const lines = doc.splitTextToSize(content, 170);
            let yPosition = 40;
            
            lines.forEach((line, index) => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, 20, yPosition);
                yPosition += 6;
            });
            
            // Generate blob
            const pdfBlob = doc.output('blob');
            return pdfBlob;
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    async generateWord(content, type, jobTitle) {
        try {
            // Check if docx library is loaded
            if (!window.docx || !window.docx.Document) {
                throw new Error('docx library not loaded');
            }
            
            // Use locally loaded docx library
            const { Document, Paragraph, TextRun, Packer, AlignmentType } = window.docx;
            
            // Parse markdown content and convert to Word elements
            const wordElements = this.parseMarkdownToWordElements(content);
            
            // Create document with title and parsed content
            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            margin: {
                                top: 720,    // 0.5 inch
                                right: 720,  // 0.5 inch
                                bottom: 720, // 0.5 inch
                                left: 720    // 0.5 inch
                            }
                        }
                    },
                    children: [
                        // Title
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: this.formatDocumentTitle(type, jobTitle),
                                    bold: true,
                                    size: 32
                                })
                            ],
                            spacing: { after: 400 },
                            alignment: AlignmentType.CENTER
                        }),
                        
                        // Add a separator line
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "___________________________________________",
                                    size: 20
                                })
                            ],
                            spacing: { after: 300 },
                            alignment: AlignmentType.CENTER
                        }),
                        
                        // Parsed content
                        ...wordElements
                    ]
                }]
            });
            
            // Generate blob
            const blob = await Packer.toBlob(doc);
            return blob;
            
        } catch (error) {
            console.error('Error generating Word document:', error);
            throw new Error(`Word generation failed: ${error.message}`);
        }
    }

    parseMarkdownToWordElements(content) {
        const { Paragraph, TextRun, AlignmentType } = window.docx;
        const elements = [];
        
        // Remove the markdown code block wrapper if present
        let cleanContent = content.replace(/^```markdown\s*/, '').replace(/\s*```$/, '');
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        
        // Split content into lines
        const lines = cleanContent.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            if (!trimmedLine) {
                // Empty line - add minimal spacing
                elements.push(new Paragraph({
                    children: [new TextRun({ text: "", size: 12 })],
                    spacing: { after: 100 }
                }));
                continue;
            }
            
            // Handle different markdown elements
            if (trimmedLine.startsWith('# ')) {
                // Main heading (H1) - Name - LEFT ALIGNED
                elements.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: trimmedLine.replace(/^# /, ''),
                            bold: true,
                            size: 36,
                            color: "1a1a1a"
                        })
                    ],
                    spacing: { before: 0, after: 200 },
                    alignment: AlignmentType.LEFT
                }));
            } else if (trimmedLine.startsWith('## ')) {
                // Section heading (H2) - Clean professional style
                const sectionTitle = trimmedLine.replace(/^## /, '');
                elements.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: sectionTitle,
                            bold: true,
                            size: 28,
                            color: "2563eb"
                        })
                    ],
                    spacing: { before: 300, after: 150 },
                    alignment: AlignmentType.LEFT
                }));
            } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && !trimmedLine.includes('|')) {
                // Bold standalone text (job titles, etc.)
                elements.push(new Paragraph({
                    children: [
                        new TextRun({
                            text: trimmedLine.replace(/^\*\*/, '').replace(/\*\*$/, ''),
                            bold: true,
                            size: 23
                        })
                    ],
                    spacing: { before: 200, after: 80 },
                    alignment: AlignmentType.LEFT
                }));
            } else if (trimmedLine.startsWith('- ')) {
                // Bullet point
                const bulletText = trimmedLine.replace(/^- /, '');
                const bulletRuns = this.parseInlineFormatting(bulletText, 22);
                
                elements.push(new Paragraph({
                    children: [
                        new TextRun({ text: '• ', size: 22 }),
                        ...bulletRuns
                    ],
                    spacing: { after: 120 },
                    indent: { 
                        left: 360,  // Consistent left indent for all bullet points
                        hanging: 180  // Hanging indent for bullet alignment
                    }
                }));
            } else {
                // Regular paragraph - handle inline formatting
                const textRuns = this.parseInlineFormatting(trimmedLine, 22);
                
                if (textRuns.length > 0) {
                    // Check if this looks like contact info (contains email, phone, etc.)
                    const isContactInfo = /[@|]|Phone:|Email:|New York|NY|\+1/.test(trimmedLine);
                    
                    // Check if this looks like company/location info (follows job title pattern)
                    const isCompanyInfo = /\w+.*,\s+\w+.*\||\w+.*–|\w+.*\|\s*\d{4}/.test(trimmedLine) && !isContactInfo;
                    
                    // If it's company info, make it slightly smaller and italic for distinction
                    if (isCompanyInfo) {
                        const companyRuns = textRuns.map(run => ({
                            ...run,
                            size: 21,
                            italics: true
                        }));
                        
                        elements.push(new Paragraph({
                            children: companyRuns,
                            spacing: { after: 120 },
                            alignment: AlignmentType.LEFT,
                            indent: { left: 0 }
                        }));
                    } else {
                        elements.push(new Paragraph({
                            children: textRuns,
                            spacing: { 
                                after: isContactInfo ? 120 : 150 
                            },
                            alignment: AlignmentType.LEFT, // Everything left-aligned for ATS compatibility
                            indent: { left: 0 } // Ensure consistent left alignment for all content
                        }));
                    }
                }
            }
        }
        
        return elements;
    }

    parseInlineFormatting(text, fontSize = 22) {
        const { TextRun } = window.docx;
        const runs = [];
        
        // Split by bold markers while preserving them
        const parts = text.split(/(\*\*[^*]+\*\*)/);
        
        for (const part of parts) {
            if (!part) continue;
            
            if (part.startsWith('**') && part.endsWith('**')) {
                // Bold text
                const boldText = part.replace(/^\*\*/, '').replace(/\*\*$/, '');
                if (boldText) {
                    runs.push(new TextRun({
                        text: boldText,
                        bold: true,
                        size: fontSize
                    }));
                }
            } else {
                // Regular text
                if (part) {
                    runs.push(new TextRun({
                        text: part,
                        size: fontSize
                    }));
                }
            }
        }
        
        return runs;
    }

    formatDocumentTitle(type, jobTitle) {
        const typeMap = {
            'cover-letter': 'Cover Letter',
            'resume': 'Resume',
            'both': 'Cover Letter and Resume'
        };
        
        return `${typeMap[type] || type} - ${jobTitle}`;
    }

    async loadJobs() {
        try {
            const result = await chrome.storage.local.get(['jobs']);
            this.jobs = Array.isArray(result.jobs) ? result.jobs : [];
            console.log('Loaded jobs:', this.jobs.length);
        } catch (error) {
            console.error('Error loading jobs:', error);
            this.jobs = [];
        }
    }

    async saveJobs() {
        try {
            await chrome.storage.local.set({ jobs: this.jobs });
        } catch (error) {
            console.error('Error saving jobs:', error);
        }
    }

    async loadStoredResumes() {
        try {
            const result = await chrome.storage.local.get(['storedResumes', 'activeResumeId']);
            this.storedResumes = Array.isArray(result.storedResumes) ? result.storedResumes : [];
            this.activeResumeId = result.activeResumeId || null;
            console.log('Loaded stored resumes:', this.storedResumes.length);
        } catch (error) {
            console.error('Error loading stored resumes:', error);
            this.storedResumes = [];
        }
    }

    async saveStoredResumes() {
        try {
            await chrome.storage.local.set({ 
                storedResumes: this.storedResumes,
                activeResumeId: this.activeResumeId 
            });
        } catch (error) {
            console.error('Error saving stored resumes:', error);
        }
    }

    async loadResume() {
        try {
            // If we have an active resume from stored resumes, use that
            if (this.activeResumeId && this.storedResumes.length > 0) {
                const activeResume = this.storedResumes.find(r => r.id === this.activeResumeId);
                if (activeResume) {
                    // Note: We store extracted text content, so we should use text/plain type
                    const blob = new Blob([activeResume.content], { type: 'text/plain' });
                    this.resumeFile = new File([blob], activeResume.name, { 
                        type: 'text/plain',
                        lastModified: new Date(activeResume.uploadedAt).getTime()
                    });
                    return;
                }
            }

            // Fallback to legacy resume storage
            const result = await chrome.storage.local.get(['resumeFile']);
            if (result.resumeFile) {
                // Create a File object from stored data
                const blob = new Blob([result.resumeFile.content], { type: result.resumeFile.type });
                this.resumeFile = new File([blob], result.resumeFile.name, { type: result.resumeFile.type });
            }
        } catch (error) {
            console.error('Error loading resume:', error);
        }
    }

    async saveResume() {
        if (!this.resumeFile) return;
        
        try {
            console.log(`💾 Processing and saving resume: ${this.resumeFile.name}`);
            
            // Extract and process the text content
            const content = await this.readFileAsText(this.resumeFile);
            
            if (!content || content.trim().length < 50) {
                throw new Error('Resume content is too short or empty after processing. Please check your file.');
            }
            
            // Create new resume entry
            const resumeId = Date.now().toString();
            const resumeData = {
                id: resumeId,
                name: this.resumeFile.name,
                type: this.resumeFile.type,
                content: content,
                uploadedAt: new Date().toISOString(),
                originalSize: this.resumeFile.size,
                extractedLength: content.length
            };

            // Extract structured data if API key is available
            try {
                const apiKey = await this.getApiKey();
                if (apiKey) {
                    console.log('🔍 Extracting structured data from resume...');
                    const structuredData = await this.extractResumeData(content, apiKey);
                    resumeData.structuredData = structuredData;
                    console.log('✅ Structured data extracted and stored with resume');
                } else {
                    console.log('⚠️ No API key found, storing raw text only. Structured extraction will happen during generation.');
                }
            } catch (error) {
                console.warn('Failed to extract structured data during upload:', error.message);
                console.log('📝 Resume saved with raw text only. Structured extraction will happen during generation.');
            }
            
            // Check if a resume with the same name already exists
            const existingIndex = this.storedResumes.findIndex(r => r.name === resumeData.name);
            if (existingIndex !== -1) {
                // Update existing resume
                this.storedResumes[existingIndex] = resumeData;
                this.activeResumeId = resumeData.id;
            } else {
                // Add new resume
                this.storedResumes.push(resumeData);
                this.activeResumeId = resumeData.id;
            }

            // Save to storage
            await this.saveStoredResumes();
            
            // Also save to legacy storage for backward compatibility
            await chrome.storage.local.set({ resumeFile: resumeData });
            
            console.log('✅ Resume processed and saved successfully');
            console.log(`📊 Stats: Original ${this.resumeFile.size} bytes → ${content.length} characters extracted`);
            
            // Update UI
            this.renderStoredResumes();
            this.updateResumeStatus();
            
        } catch (error) {
            console.error('Error processing/saving resume:', error);
            
            // Show detailed error to user
            const resumeStatus = document.getElementById('resume-status');
            if (resumeStatus) {
                resumeStatus.textContent = `❌ Error: ${error.message}`;
                resumeStatus.style.color = '#ef4444';
            }
            
            // Clear the problematic file
            this.resumeFile = null;
            throw error;
        }
    }

    setStatus(elementId, message, type = 'info') {
        const statusEl = document.getElementById(elementId);
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status ${type}`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async calculateJobMatchWithRetry(job, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await this.calculateJobMatch(job);
                return result;
            } catch (error) {
                console.error(`Attempt ${attempt} failed for job ${job.title}:`, error);
                
                if (error.message.includes('Rate limit') && attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 10000; // Exponential backoff: 20s, 40s, 80s
                    console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry ${attempt + 1}...`);
                    this.setStatus('capture-status', `Rate limited. Waiting ${waitTime/1000}s before retry ${attempt + 1}/3 for: ${job.title}`, 'info');
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                
                throw error; // Re-throw if max retries reached or different error
            }
        }
    }

    async calculateJobMatch(job) {
        if (!this.resumeFile) {
            console.warn('No resume available for matching');
            return null;
        }

        try {
            // Step 1: Extract and parse resume text
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
            console.log('Starting job match calculation for:', job.title);
            console.log('Resume content length:', resumeText?.length || 0, 'characters');
            console.log('Resume preview:', resumeText ? resumeText.substring(0, 200) + '...' : 'No resume text');
            
            // Step 2: Proceed with job matching
            this.setStatus?.('capture-status', `🎯 Analyzing match for: ${job.title}...`, 'info');
            
            // Get API key for scoring
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                console.warn('No API key available for job scoring');
                return null;
            }
            
            // Smart truncation that preserves key sections
            const maxResumeLength = 3000; // ~750 tokens - increased for better context
            const maxJobDescLength = 12000; // ~3000 tokens - significantly increased for full job descriptions
            
            // For resume, try to preserve key sections
            let truncatedResume = resumeText;
            if (resumeText.length > maxResumeLength) {
                // Try to keep skills, experience, and education sections
                const skillsMatch = resumeText.match(/(skills?|technologies?|expertise)[^]*?(?=\n\n|\n[A-Z]|$)/i);
                const experienceMatch = resumeText.match(/(experience|employment|work)[^]*?(?=\n\n|\n[A-Z]|$)/i);
                const educationMatch = resumeText.match(/(education|degree|university)[^]*?(?=\n\n|\n[A-Z]|$)/i);
                
                let keyContent = [skillsMatch?.[0], experienceMatch?.[0], educationMatch?.[0]]
                    .filter(Boolean).join('\n\n');
                
                if (keyContent.length > maxResumeLength) {
                    truncatedResume = keyContent.substring(0, maxResumeLength) + '...';
                } else {
                    truncatedResume = keyContent || resumeText.substring(0, maxResumeLength) + '...';
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
            if (resumeText && resumeText.length > maxResumeLength) {
                console.log(`Resume truncated: ${resumeText.length} → ${truncatedResume.length} chars`);
            }
            if (job.description && job.description.length > maxJobDescLength) {
                console.log(`Job description truncated: ${job.description.length} → ${truncatedJobDesc.length} chars`);
            }
            
            // Log analysis details
            console.log(`Analyzing job: ${job.title} at ${job.company}`);
            console.log(`Estimated tokens: ~${Math.ceil((truncatedResume.length + truncatedJobDesc.length) / 4)}`);
            console.log(`Using improved scoring system with smart truncation`);
            
            const matchPrompt = `
You are a strict ATS system that provides brutally honest job-resume matching scores. Be very discriminating and use the full 0-100 scale.

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
3. Check for education/certification requirements
4. Look for industry/domain experience alignment
5. Assess seniority level match

Be harsh but fair. Don't give sympathy scores. If there are major gaps, reflect this in a low score. Most candidates should score below 70 unless they're truly exceptional matches. Use the full range from 0-100.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown formatting like \`\`\`json. Just return the raw JSON object.

Format response as JSON with matrix structure:
{
  "overallScore": 45,
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
    },
    {
      "category": "Experience",
      "requirement": "Senior software development role",
      "evidence": "Senior Software Engineer at TechCorp",
      "matchLevel": "strong",
      "gapAction": "Major strength - emphasize leadership aspects"
    },
    {
      "category": "Education",
      "requirement": "Bachelor's degree in Computer Science",
      "evidence": "Master's degree in Computer Science",
      "matchLevel": "exceeds",
      "gapAction": "Exceeds requirement - highlight advanced coursework"
    }
  ]
}
`;

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
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
                
                // Parse the JSON response
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
                    // Fallback: extract score from text
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
                
                // Handle specific token limit errors
                if (error.error?.message?.includes('tokens per min') || error.error?.message?.includes('Rate limit') || response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                } else if (error.error?.message?.includes('Request too large')) {
                    throw new Error('Content too large for analysis. The system will automatically optimize future requests.');
                }
                
                throw new Error(error.error?.message || `API Error: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error('Job match calculation error:', error);
            
            // Handle different error types
            if (error.name === 'AbortError') {
                console.warn('Job match calculation timed out after 30 seconds');
                throw new Error('Analysis timed out. Please try again.');
            }
            
            // Handle resume reading errors specifically
            if (error.message.includes('Word document') || error.message.includes('corrupted')) {
                throw new Error(`Resume file issue: ${error.message}`);
            }
            
            if (error.message.includes('PDF files')) {
                throw new Error(`PDF not supported: ${error.message}`);
            }
            
            if (error.message.includes('empty or unreadable')) {
                throw new Error(`Resume content issue: ${error.message}`);
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    // Helper method to get score status classification
    getScoreStatus(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'moderate';
        return 'needs-improvement';
    }

    getMatchLevel(score) {
        if (score >= 90) return 'excellent';
        if (score >= 70) return 'good'; 
        if (score >= 50) return 'moderate';
        if (score >= 30) return 'weak';
        return 'poor';
    }

    getMatchColor(score) {
        if (score === null || score === undefined) return this.matchColors.unscored;
        return this.matchColors[this.getMatchLevel(score)];
    }

    formatAnalysisReasoning(reasoning) {
        // Check if reasoning contains JSON (happens when parsing fails)
        let cleanReasoning = reasoning.trim();
        
        // Handle markdown-formatted JSON
        if (cleanReasoning.startsWith('```json')) {
            cleanReasoning = cleanReasoning.replace(/```json\s*/, '').replace(/\s*```$/, '');
        }
        
        if (cleanReasoning.startsWith('{') && cleanReasoning.endsWith('}')) {
            try {
                const parsed = JSON.parse(cleanReasoning);
                if (parsed.reasoning) {
                    return this.escapeHtml(parsed.reasoning);
                }
                // If it's a JSON response, format it nicely
                return `<div class="json-fallback">
                    <strong>Score:</strong> ${parsed.overallScore || 'N/A'}<br>
                    <strong>Analysis:</strong> ${this.escapeHtml(parsed.reasoning || 'No detailed analysis available')}
                </div>`;
            } catch (e) {
                // If JSON parsing fails, treat as regular text
                return this.escapeHtml(cleanReasoning);
            }
        }
        return this.escapeHtml(cleanReasoning);
    }

    renderAnalysisMatrix(matrix) {
        if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
            return '';
        }

        const getMatchIcon = (matchLevel) => {
            switch (matchLevel?.toLowerCase()) {
                case 'strong': return '🟢';
                case 'exceeds': return '🔵';
                case 'partial': return '🟡';
                case 'missing': return '🔴';
                default: return '⚪';
            }
        };

        const getMatchClass = (matchLevel) => {
            switch (matchLevel?.toLowerCase()) {
                case 'strong': return 'match-strong';
                case 'exceeds': return 'match-exceeds';
                case 'partial': return 'match-partial';
                case 'missing': return 'match-missing';
                default: return 'match-unknown';
            }
        };

        return `
            <div class="analysis-matrix">
                <h5>📊 Requirements vs Evidence</h5>
                <div class="matrix-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Job Requirement</th>
                                <th>Resume Evidence</th>
                                <th>Match</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${matrix.map(row => `
                                <tr>
                                    <td class="matrix-category">${this.escapeHtml(row.category || '')}</td>
                                    <td class="matrix-requirement">${this.escapeHtml(row.requirement || '')}</td>
                                    <td class="matrix-evidence">${this.escapeHtml(row.evidence || 'Not mentioned')}</td>
                                    <td class="matrix-match ${getMatchClass(row.matchLevel)}">
                                        ${getMatchIcon(row.matchLevel)} ${this.escapeHtml(row.matchLevel || 'unknown')}
                                    </td>
                                    <td class="matrix-action">${this.escapeHtml(row.gapAction || '')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async scoreAllJobs() {
        if (!this.isResumeValid()) {
            this.setStatus('capture-status', 'Please upload a valid resume first (plain text .txt format recommended)', 'error');
            return;
        }

        // Show pause button
        const pauseBtn = document.getElementById('pause-scoring-btn');
        pauseBtn.style.display = 'inline-block';
        pauseBtn.textContent = '⏸️ Pause Scoring';
        this.scoringPaused = false;

        this.setStatus('capture-status', 'Analyzing job matches (3s delay between requests to avoid rate limits)...', 'info');
        
        let scoredCount = 0;
        const unscored = this.jobs.filter(j => !j.matchAnalysis);
        
        try {
            for (let i = 0; i < unscored.length; i++) {
                const job = unscored[i];
                
                // Check for pause
                await this.waitForResume();
                
                try {
                    this.setStatus('capture-status', `Analyzing ${i + 1}/${unscored.length}: ${job.title}...`, 'info');
                    
                    const matchData = await this.calculateJobMatchWithRetry(job);
                    if (matchData) {
                        job.matchAnalysis = matchData;
                        scoredCount++;
                        
                        // Save progress after each job
                        await this.saveJobs();
                        this.renderJobs();
                    }
                    
                    // Rate limiting: Wait 3 seconds between requests
                    if (i < unscored.length - 1) {
                        this.setStatus('capture-status', `Waiting 3 seconds to avoid rate limits... (${i + 1}/${unscored.length} completed)`, 'info');
                        
                        // Wait with pause checking
                        for (let wait = 0; wait < 3000; wait += 500) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                            await this.waitForResume();
                        }
                    }
                } catch (error) {
                    console.error(`Failed to score job ${job.id}:`, error);
                    if (error.message.includes('Rate limit')) {
                        this.setStatus('capture-status', `Rate limit hit. Waiting 30 seconds... (${i + 1}/${unscored.length} completed)`, 'info');
                        
                        // Wait with pause checking
                        for (let wait = 0; wait < 30000; wait += 1000) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await this.waitForResume();
                        }
                        
                        // Retry this job
                        i--; // Decrement to retry the same job
                        continue;
                    }
                }
            }
            
            this.setStatus('capture-status', `✅ Analyzed ${scoredCount} job matches!`, 'success');
        } finally {
            // Hide pause button
            pauseBtn.style.display = 'none';
            this.scoringPaused = false;
        }
    }

    async rescoreAllJobs() {
        if (!this.isResumeValid()) {
            this.setStatus('capture-status', 'Please upload a valid resume first (plain text .txt format recommended)', 'error');
            return;
        }

        // Clear all existing scores
        this.jobs.forEach(job => {
            delete job.matchAnalysis;
        });

        // Show pause button
        const pauseBtn = document.getElementById('pause-scoring-btn');
        pauseBtn.style.display = 'inline-block';
        pauseBtn.textContent = '⏸️ Pause Scoring';
        this.scoringPaused = false;

        this.setStatus('capture-status', 'Re-analyzing all job matches with improved scoring (3s delay between requests)...', 'info');
        
        let scoredCount = 0;
        
        try {
            for (let i = 0; i < this.jobs.length; i++) {
                const job = this.jobs[i];
                
                // Check for pause
                await this.waitForResume();
                
                try {
                    this.setStatus('capture-status', `Re-analyzing ${i + 1}/${this.jobs.length}: ${job.title}...`, 'info');
                    
                    const matchData = await this.calculateJobMatchWithRetry(job);
                    if (matchData) {
                        job.matchAnalysis = matchData;
                        scoredCount++;
                        
                        // Save progress after each job
                        await this.saveJobs();
                        this.renderJobs();
                    }
                    
                    // Rate limiting: Wait 3 seconds between requests
                    if (i < this.jobs.length - 1) {
                        this.setStatus('capture-status', `Waiting 3 seconds to avoid rate limits... (${i + 1}/${this.jobs.length} completed)`, 'info');
                        
                        // Wait with pause checking
                        for (let wait = 0; wait < 3000; wait += 500) {
                            await new Promise(resolve => setTimeout(resolve, 500));
                            await this.waitForResume();
                        }
                    }
                } catch (error) {
                    console.error(`Failed to re-score job ${job.id}:`, error);
                    if (error.message.includes('Rate limit')) {
                        this.setStatus('capture-status', `Rate limit hit. Waiting 30 seconds... (${i + 1}/${this.jobs.length} completed)`, 'info');
                        
                        // Wait with pause checking
                        for (let wait = 0; wait < 30000; wait += 1000) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await this.waitForResume();
                        }
                        
                        // Retry this job
                        i--; // Decrement to retry the same job
                        continue;
                    }
                }
            }
            
            this.setStatus('capture-status', `✅ Re-analyzed ${scoredCount} job matches with improved scoring!`, 'success');
        } finally {
            // Hide pause button
            pauseBtn.style.display = 'none';
            this.scoringPaused = false;
        }
    }

    toggleScoringPause() {
        this.scoringPaused = !this.scoringPaused;
        const pauseBtn = document.getElementById('pause-scoring-btn');
        
        if (this.scoringPaused) {
            pauseBtn.textContent = '▶️ Resume Scoring';
            this.setStatus('capture-status', '⏸️ Scoring paused. Click Resume to continue.', 'info');
        } else {
            pauseBtn.textContent = '⏸️ Pause Scoring';
            this.setStatus('capture-status', '▶️ Scoring resumed...', 'info');
        }
    }

    async waitForResume() {
        while (this.scoringPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    isResumeValid() {
        return this.resumeFile && this.resumeFile.name;
    }

    // Debug function to test resume reading
    async testResumeReading() {
        if (!this.resumeFile) {
            console.error('❌ No resume file loaded. Please upload a resume first.');
            return false;
        }
        
        try {
            console.log('🧪 Testing resume document processing...');
            console.log('📁 File info:', {
                name: this.resumeFile.name,
                type: this.resumeFile.type,
                size: this.resumeFile.size,
                lastModified: new Date(this.resumeFile.lastModified).toISOString()
            });
            
            const startTime = Date.now();
            console.log('📄 Starting text extraction...');
            
            const content = await this.readFileAsText(this.resumeFile);
            const endTime = Date.now();
            
            console.log('✅ Text extraction completed!');
            console.log(`⏱️ Processing time: ${endTime - startTime}ms`);
            console.log(`📊 Extracted ${content.length} characters`);
            console.log('📄 Content preview (first 500 chars):');
            console.log(content.substring(0, 500));
            
            if (content.length > 500) {
                console.log('📄 Content end preview (last 200 chars):');
                console.log('...' + content.substring(content.length - 200));
            }
            
            // Validate content quality
            const words = content.split(/\s+/).filter(word => word.length > 0);
            const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
            const alphabeticWords = words.filter(word => /^[a-zA-Z]+$/.test(word)).length;
            const alphabeticRatio = alphabeticWords / words.length;
            
            console.log('📈 Content quality analysis:');
            console.log(`   - Total words: ${words.length}`);
            console.log(`   - Average word length: ${avgWordLength.toFixed(1)}`);
            console.log(`   - Alphabetic words ratio: ${(alphabeticRatio * 100).toFixed(1)}%`);
            
            // Provide recommendations
            if (content.length < 100) {
                console.warn('⚠️ Very short content - document may not have processed correctly');
            } else if (alphabeticRatio < 0.7) {
                console.warn('⚠️ Low alphabetic ratio - document may contain formatting artifacts');
            } else if (words.length < 50) {
                console.warn('⚠️ Very few words - resume content seems insufficient');
            } else {
                console.log('✅ Content quality looks good!');
            }
            
            // File type specific feedback
            const fileName = this.resumeFile.name.toLowerCase();
            if (fileName.endsWith('.docx')) {
                console.log('📝 DOCX document processed using XML extraction');
            } else if (fileName.endsWith('.doc')) {
                console.log('📝 Legacy DOC document processed using binary parsing');
            } else if (fileName.endsWith('.txt')) {
                console.log('📝 Plain text document processed directly');
            } else if (fileName.endsWith('.pdf')) {
                console.log('📝 PDF document processing attempted');
            }
            
            console.log('✅ Resume processing test completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Resume processing test failed:', error.message);
            console.error('🔍 Full error details:', error);
            console.error('💡 Suggestions:');
            console.error('   - Try converting your document to plain text (.txt)');
            console.error('   - Ensure your document contains readable text');
            console.error('   - Check that the file is not corrupted');
            return false;
        }
    }



    async scoreJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;
        if (!this.isResumeValid()) {
            this.setStatus('capture-status', 'Please upload a valid resume first (plain text .txt format recommended)', 'error');
            return;
        }
        try {
            // Clear existing score if re-scoring
            if (job.matchAnalysis) {
                delete job.matchAnalysis;
                this.renderJobs(); // Update UI to show "scoring in progress"
            }
            // Set loading state
            this.scoringJobId = job.id;
            this.renderJobs();
            // Show progress to user
            this.setStatus('capture-status', `Analyzing match for: ${job.title}...`, 'info');
            // Update UI to show scoring in progress
            const matchData = await this.calculateJobMatchWithRetry(job);
            if (matchData) {
                job.matchAnalysis = matchData;
                await this.saveJobs();
                this.scoringJobId = null;
                this.renderJobs();
                this.setStatus('capture-status', `✅ Analysis complete for: ${job.title}`, 'success');
            } else {
                this.scoringJobId = null;
                this.renderJobs();
                this.setStatus('capture-status', `❌ Failed to analyze: ${job.title}`, 'error');
            }
        } catch (e) {
            this.scoringJobId = null;
            this.renderJobs();
            throw e;
        }
    }

    // API Key Management Methods
    async getApiKey() {
        const configInfo = this.apiService.getConfigInfo();
        if (configInfo.useCentralizedAPI) {
            return 'centralized'; // Return a placeholder - actual key is handled by backend
        } else {
            return new Promise((resolve) => {
                chrome.storage.sync.get(['openaiApiKey'], (result) => {
                    resolve(result.openaiApiKey);
                });
            });
        }
    }

    async setApiKey(apiKey) {
        return new Promise((resolve) => {
            chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
                resolve();
            });
        });
    }

    async promptForApiKey() {
        const apiKey = prompt(`🔑 OpenAI API Key Required

Please enter your OpenAI API key to enable job matching and document generation features.

You can get your API key from: https://platform.openai.com/api-keys

Your API key will be stored securely in your browser and never shared.`);
        
        if (apiKey && apiKey.trim()) {
            await this.setApiKey(apiKey.trim());
            return apiKey.trim();
        }
        return null;
    }

    async ensureApiKey() {
        let apiKey = await this.getApiKey();
        if (!apiKey) {
            apiKey = await this.promptForApiKey();
        }
        return apiKey;
    }

    // Settings Tab Methods
    async saveApiKey() {
        const apiKeyInput = document.getElementById('api-key-input');
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.setStatus('api-status', 'Please enter an API key', 'error');
            return;
        }
        
        if (!apiKey.startsWith('sk-')) {
            this.setStatus('api-status', 'Invalid API key format. API keys should start with "sk-"', 'error');
            return;
        }
        
        try {
            await this.setApiKey(apiKey);
            this.setStatus('api-status', '✅ API key saved successfully!', 'success');
            
            // Clear the input for security
            apiKeyInput.value = '';
            
            // Update the API status in other tabs
            this.updateApiStatus();
            
        } catch (error) {
            console.error('Error saving API key:', error);
            this.setStatus('api-status', 'Error saving API key', 'error');
        }
    }
    
    async testApiConnection() {
        const btn = document.getElementById('test-api-btn');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = `
                <svg style="display: inline-block; width: 16px; height: 16px; margin-right: 6px; vertical-align: middle; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h4M18 12h4M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
                Testing Connection...
            `;

            const result = await this.apiService.testConnection();
            
            if (result.success) {
                this.setStatus('api-status', `✅ ${result.message} (Model: ${result.model})`, 'success');
                this.updateApiStatus();
            } else {
                this.setStatus('api-status', `❌ ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Test API connection error:', error);
            this.setStatus('api-status', `❌ Connection failed: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
    
    async loadApiKeyForSettings() {
        const apiKey = await this.getApiKey();
        const apiStatus = document.getElementById('api-status');
        
        if (apiKey) {
            this.setStatus('api-status', '✅ API key configured', 'success');
        } else {
            this.setStatus('api-status', 'No API key configured', 'info');
        }
        
        this.updateUsageStats();
    }
    
    updateApiStatus() {
        // Update the AI status in the Generate tab
        const aiStatus = document.getElementById('ai-status');
        this.getApiKey().then(apiKey => {
            if (apiKey) {
                aiStatus.textContent = '✅ ChatGPT-4o Connected';
                aiStatus.className = 'status success';
            } else {
                aiStatus.textContent = '❌ API Key Required';
                aiStatus.className = 'status error';
            }
        });
    }
    
    updateUsageStats() {
        // Count analyzed jobs
        const analyzedJobs = this.jobs.filter(job => job.matchAnalysis).length;
        document.getElementById('jobs-analyzed').textContent = analyzedJobs;
        
        // Get stats from storage
        chrome.storage.local.get(['docsGenerated', 'apiCalls'], (result) => {
            document.getElementById('docs-generated').textContent = result.docsGenerated || 0;
            document.getElementById('api-calls').textContent = result.apiCalls || 0;
        });
    }
    
    incrementDocGenerated() {
        chrome.storage.local.get(['docsGenerated'], (result) => {
            const count = (result.docsGenerated || 0) + 1;
            chrome.storage.local.set({ docsGenerated: count });
            this.updateUsageStats();
        });
    }
    
    incrementApiCalls() {
        chrome.storage.local.get(['apiCalls'], (result) => {
            const count = (result.apiCalls || 0) + 1;
            chrome.storage.local.set({ apiCalls: count });
            this.updateUsageStats();
        });
    }

    // Active Resume Management
    async loadActiveResumeId() {
        try {
            const result = await chrome.storage.sync.get(['activeResumeId']);
            this.activeResumeId = result.activeResumeId || null;
            console.log('Loaded active resume ID:', this.activeResumeId);
        } catch (error) {
            console.error('Error loading active resume ID:', error);
            this.activeResumeId = null;
        }
    }

    async saveActiveResumeId() {
        try {
            await chrome.storage.sync.set({ activeResumeId: this.activeResumeId });
            console.log('Saved active resume ID:', this.activeResumeId);
        } catch (error) {
            console.error('Error saving active resume ID:', error);
        }
    }

    updateActiveResumeDisplay() {
        const nameElement = document.getElementById('active-resume-name');
        const metaElement = document.getElementById('active-resume-meta');
        const changeBtn = document.getElementById('change-resume-btn');
        
        const activeResume = this.getActiveResume();
        
        if (activeResume) {
            nameElement.textContent = activeResume.name;
            metaElement.textContent = `Uploaded ${new Date(activeResume.uploadedAt).toLocaleDateString()}`;
            changeBtn.disabled = false;
        } else {
            nameElement.textContent = 'No resume selected';
            metaElement.textContent = 'Upload or select a resume to start scoring jobs';
            changeBtn.disabled = true;
        }
        
        // Update the dropdown content
        this.updateResumeSelector();
    }

    getActiveResume() {
        if (!this.activeResumeId || !this.storedResumes || !Array.isArray(this.storedResumes)) {
            return null;
        }
        return this.storedResumes.find(resume => resume.id === this.activeResumeId) || null;
    }

    updateResumeSelector() {
        const content = document.getElementById('resume-selector-content');
        
        if (!this.storedResumes || this.storedResumes.length === 0) {
            content.innerHTML = '<div class="resume-option">No resumes available</div>';
            return;
        }
        
        content.innerHTML = this.storedResumes.map(resume => `
            <div class="resume-option ${resume.id === this.activeResumeId ? 'active' : ''}" 
                 data-resume-id="${resume.id}">
                <div class="resume-option-info">
                    <div class="resume-option-name">${this.escapeHtml(resume.name)}</div>
                    <div class="resume-option-meta">Uploaded ${new Date(resume.uploadedAt).toLocaleDateString()}</div>
                </div>
            </div>
        `).join('');
        
        // Add click listeners to resume options
        content.querySelectorAll('.resume-option').forEach(option => {
            const resumeId = option.dataset.resumeId;
            if (resumeId && resumeId !== 'undefined') {
                option.addEventListener('click', () => this.setActiveResume(resumeId));
            }
        });
    }

    toggleResumeSelector() {
        const btn = document.getElementById('change-resume-btn');
        const dropdown = document.getElementById('resume-selector-dropdown');
        
        if (btn.disabled) return;
        
        const isOpen = dropdown.style.display === 'block';
        
        if (isOpen) {
            this.closeResumeSelector();
        } else {
            this.updateResumeSelector(); // Refresh content before showing
            dropdown.style.display = 'block';
            btn.classList.add('open');
        }
    }

    closeResumeSelector() {
        const btn = document.getElementById('change-resume-btn');
        const dropdown = document.getElementById('resume-selector-dropdown');
        
        dropdown.style.display = 'none';
        btn.classList.remove('open');
    }

    async setActiveResume(resumeId) {
        const resume = this.storedResumes.find(r => r.id === resumeId);
        if (!resume) {
            console.error('Resume not found:', resumeId);
            return;
        }
        
        this.activeResumeId = resumeId;
        
        // Create a proper Blob object from the stored content
        // Note: We store extracted text content, so we should use text/plain type
        const blob = new Blob([resume.content], { type: 'text/plain' });
        
        // Update the main resume file reference for scoring
        this.resumeFile = new File([blob], resume.name, {
            type: 'text/plain',
            lastModified: new Date(resume.uploadedAt).getTime()
        });
        this.resumeData = resume.content;
        
        await this.saveActiveResumeId();
        this.updateActiveResumeDisplay();
        this.updateResumeStatus();
        this.closeResumeSelector();
        
        console.log('Active resume set to:', resume.name);
    }

    // Enhanced scoring methods with tab switching
    async scoreJobAndShowResults(jobId) {
        await this.scoreJob(jobId);
        // Switch to jobs tab to show results
        this.switchTab('jobs');
    }

    async scoreAllJobsAndShowResults() {
        await this.scoreAllJobs();
        // Switch to jobs tab to show results
        this.switchTab('jobs');
    }

    // Scoring preference management
    async saveScoringPreference() {
        const autoRadio = document.getElementById('auto-scoring');
        this.scoringMode = autoRadio.checked ? 'automatic' : 'manual';
        
        // Save to storage
        await chrome.storage.sync.set({ 
            scoringMode: this.scoringMode 
        });
        
        // Update the score button text and note
        this.updateScoreButtonText();
        
        console.log('Scoring mode saved:', this.scoringMode);
    }

    updateScoreButtonText() {
        const scoreBtn = document.getElementById('score-all-btn');
        
        if (this.scoringMode === 'automatic') {
            scoreBtn.textContent = '📊 Score All Jobs';
        } else {
            scoreBtn.textContent = '📊 Score All Jobs (Manual Mode)';
        }
    }

    async loadScoringPreference() {
        try {
            const result = await chrome.storage.sync.get('scoringMode');
            this.scoringMode = result.scoringMode || 'automatic';
            
            // Update UI
            const autoRadio = document.getElementById('auto-scoring');
            const manualRadio = document.getElementById('manual-scoring');
            
            if (autoRadio && manualRadio) {
                if (this.scoringMode === 'automatic') {
                    autoRadio.checked = true;
                    manualRadio.checked = false;
                } else {
                    autoRadio.checked = false;
                    manualRadio.checked = true;
                }
            }
            
            // Update the score button text
            this.updateScoreButtonText();
            
            console.log('Scoring mode loaded:', this.scoringMode);
        } catch (error) {
            console.error('Error loading scoring preference:', error);
            this.scoringMode = 'automatic'; // fallback
            this.updateScoreButtonText();
        }
    }

    toggleTemplateCustomization() {
        const selectedType = document.querySelector('.type-option.selected');
        const customizationPanel = document.getElementById('template-customization');
        
        if (selectedType && customizationPanel) {
            const docType = selectedType.dataset.type;
            if (docType === 'resume' || docType === 'both') {
                customizationPanel.style.display = 'block';
            } else {
                customizationPanel.style.display = 'none';
            }
        }
    }

    getSelectedTemplateSections() {
        return {
            includeSummary: document.getElementById('include-summary').checked,
            includeSkills: document.getElementById('include-skills').checked,
            includeExperience: document.getElementById('include-experience').checked,
            includeEducation: document.getElementById('include-education').checked,
            includeLicenses: document.getElementById('include-licenses').checked,
            includeTools: document.getElementById('include-tools').checked
        };
    }

    getSelectedAmplificationMode() {
        const selectedMode = document.querySelector('.mode-option.selected');
        return selectedMode?.dataset.mode || 'precision';
    }

    async saveAmplificationMode(mode) {
        try {
            await chrome.storage.local.set({ amplificationMode: mode });
        } catch (error) {
            console.error('Error saving amplification mode:', error);
        }
    }

    async loadAmplificationMode() {
        try {
            const result = await chrome.storage.local.get('amplificationMode');
            const mode = result.amplificationMode || 'precision';
            
            this.selectAmplificationMode(mode);
            this.updateModeDescription(mode);
            
            return mode;
        } catch (error) {
            console.error('Error loading amplification mode:', error);
            return 'precision';
        }
    }

    updateModeDescription(mode) {
        const descriptions = {
            precision: 'Uses only your structured resume data. Tailors language to match the job description, but does not infer or add experience.',
            gap_filler: 'Uses your resume and job description, and infers adjacent, plausible responsibilities, tools, and metrics based on your stated roles.',
            beast_mode: 'AGGRESSIVE mode: Transforms ordinary responsibilities into executive-level achievements with quantified metrics (30% increase, $500K savings, 15-person teams). Elevates impact while staying credible.'
        };
        
        const descriptionElement = document.getElementById('mode-description');
        if (descriptionElement) {
            descriptionElement.innerHTML = `<p>${descriptions[mode] || descriptions.precision}</p>`;
        }
    }

    selectAmplificationMode(mode) {
        document.querySelectorAll('.mode-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`.mode-option[data-mode="${mode}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    setupAmplificationModeListener() {
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.selectAmplificationMode(mode);
                this.updateModeDescription(mode);
                this.saveAmplificationMode(mode);
            });
        });
    }

    setupDocumentTypeListener() {
        // This function is now handled by setupDocumentTypeButtons()
        // Keeping for backwards compatibility
    }

    toggleAmplificationModeSection(docType) {
        const amplificationSection = document.getElementById('amplification-mode-section');
        if (amplificationSection) {
            if (docType === 'resume' || docType === 'both') {
                amplificationSection.style.display = 'block';
            } else {
                amplificationSection.style.display = 'none';
            }
        }
        
        // Also update enhancement section visibility
        this.updateEnhancementSectionVisibility();
    }

    initializeDocumentType() {
        const selectedType = document.querySelector('.type-option.selected');
        if (selectedType) {
            const currentValue = selectedType.dataset.type;
            this.toggleAmplificationModeSection(currentValue);
            
            // If resume is selected, make sure amplification mode is properly initialized
            if (currentValue === 'resume') {
                const selectedMode = this.getSelectedAmplificationMode();
                this.selectAmplificationMode(selectedMode);
                this.updateModeDescription(selectedMode);
            }
        }
    }
    
    setupDocumentTypeButtons() {
        const typeButtons = document.querySelectorAll('.type-option');
        typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const docType = button.dataset.type;
                this.selectDocumentType(docType);
            });
        });
    }
    
    setupDocumentFormatButtons() {
        const formatButtons = document.querySelectorAll('.format-option');
        formatButtons.forEach(button => {
            button.addEventListener('click', () => {
                const format = button.dataset.format;
                this.selectDocumentFormat(format);
            });
        });
    }
    
    selectDocumentType(type) {
        // Remove selection from all type buttons
        document.querySelectorAll('.type-option').forEach(button => {
            button.classList.remove('selected');
        });
        
        // Add selection to clicked button
        const selectedButton = document.querySelector(`[data-type="${type}"]`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }
        
        // Update amplification mode visibility
        this.toggleAmplificationModeSection(type);
    }
    
    selectDocumentFormat(format) {
        // Remove selection from all format buttons
        document.querySelectorAll('.format-option').forEach(button => {
            button.classList.remove('selected');
        });
        
        // Add selection to clicked button
        const selectedButton = document.querySelector(`[data-format="${format}"]`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }
    }
    
    getSelectedDocumentType() {
        const selectedType = document.querySelector('.type-option.selected');
        return selectedType ? selectedType.dataset.type : 'resume';
    }
    
    getSelectedDocumentFormat() {
        const selectedFormat = document.querySelector('.format-option.selected');
        return selectedFormat ? selectedFormat.dataset.format : 'txt';
    }

    // === ENHANCEMENT SYSTEM METHODS ===

    async analyzeResumeGaps() {
        // Check prerequisites
        const selectedJobs = Array.from(this.selectedJobs).map(jobId => 
            this.jobs.find(job => job.id === jobId)
        ).filter(job => job);

        if (selectedJobs.length === 0) {
            alert('Please select at least one job from the Jobs tab first.');
            return;
        }

        const activeResume = this.getActiveResume();
        if (!activeResume) {
            alert('Please upload and select a resume first.');
            return;
        }

        // Validate resume content
        if (!activeResume.content || typeof activeResume.content !== 'string' || activeResume.content.trim().length === 0) {
            alert('The selected resume appears to be empty or invalid. Please upload a valid resume file.');
            return;
        }

        const apiKey = await this.getApiKey();
        if (!apiKey) {
            alert('Please configure your OpenAI API key in the Settings tab first.');
            return;
        }

        // Show loading state
        this.showEnhancementLoading(true);

        try {
            // Analyze gaps for all selected jobs
            const enhancements = await this.generateEnhancementSuggestions(activeResume.content, selectedJobs, apiKey);
            
            // Store and display suggestions
            this.currentEnhancements = enhancements;
            this.renderEnhancementSuggestions(enhancements);
            
            // Show suggestions section
            document.getElementById('enhancement-suggestions').style.display = 'block';
            
        } catch (error) {
            console.error('Enhancement analysis error:', error);
            alert(`Enhancement analysis failed: ${error.message}`);
        } finally {
            this.showEnhancementLoading(false);
        }
    }

    async generateEnhancementSuggestions(resumeText, jobs, apiKey) {
        // Validate inputs
        if (!resumeText || typeof resumeText !== 'string') {
            throw new Error('Resume text is required and must be a valid string');
        }
        
        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            throw new Error('At least one job is required for enhancement analysis');
        }

        const systemPrompt = `You are a resume enhancement expert. Analyze the user's resume against job requirements and suggest categorized, actionable enhancements that would make their application more competitive.

CRITICAL RULES:
- Focus on what's missing or could be strengthened
- Organize suggestions into logical categories
- Suggest specific skills, metrics, or experiences to highlight
- Make suggestions realistic and achievable
- Provide 2-3 suggestions per category
- Return suggestions organized by category

ENHANCEMENT CATEGORIES TO CONSIDER:
- Technical Skills: Missing technical skills mentioned in job descriptions
- Quantified Achievements: Lack of quantified achievements/metrics
- Leadership & Collaboration: Missing leadership or collaboration examples
- Industry Experience: Absent industry-specific certifications or experience
- Soft Skills: Missing soft skills emphasized in jobs
- Project Examples: Lack of relevant project examples
- Client Relations: Missing client/stakeholder interaction examples
- Process Improvement: Absent process improvement examples`;

        // Combine all job descriptions with safety checks
        const jobDescriptions = jobs.map(job => {
            const title = job.title || 'Unknown Title';
            const company = job.company || 'Unknown Company';
            const description = job.description || 'No description available';
            return `
JOB: ${title} at ${company}
DESCRIPTION: ${description}
`;
        }).join('\n---\n');

        // Safely truncate strings
        const truncatedResume = resumeText.length > 3000 ? resumeText.substring(0, 3000) : resumeText;
        const truncatedJobs = jobDescriptions.length > 2000 ? jobDescriptions.substring(0, 2000) : jobDescriptions;

        const userPrompt = `Analyze this resume against the job requirements and suggest categorized enhancements:

RESUME:
${truncatedResume}

JOB REQUIREMENTS:
${truncatedJobs}

Return enhancement suggestions organized by category in this JSON format:
{
  "Technical Skills": [
    {
      "title": "Add Python Programming",
      "description": "Highlight Python programming skills mentioned in job requirements",
      "priority": "high"
    },
    {
      "title": "Emphasize Cloud Platforms",
      "description": "Showcase AWS/Azure experience for cloud-based roles",
      "priority": "medium"
    }
  ],
  "Quantified Achievements": [
    {
      "title": "Add Revenue Impact",
      "description": "Include specific revenue or cost savings numbers",
      "priority": "high"
    }
  ],
  "Leadership & Collaboration": [
    {
      "title": "Team Leadership Metrics",
      "description": "Quantify team size and leadership achievements",
      "priority": "medium"
    }
  ],
  "Industry Experience": [
    {
      "title": "Relevant Certifications",
      "description": "Add industry-specific certifications mentioned in job",
      "priority": "low"
    }
  ]
}

Requirements:
- Only include categories that have relevant suggestions
- Each "title" should be 2-5 words, actionable
- Each "description" should explain the specific enhancement benefit
- Set "priority" as "high", "medium", or "low" based on impact
- Focus on high-impact improvements that address job requirements
- Make suggestions realistic based on the resume content
- Include 1-3 suggestions per category

Return ONLY the JSON object.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (response.ok) {
            const result = await response.json();
            this.incrementApiCalls();
            
            try {
                const content = result.choices[0].message.content;
                let cleanContent = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
                
                const enhancements = JSON.parse(cleanContent);
                console.log('🔍 Generated categorized enhancement suggestions:', enhancements);
                return enhancements;
            } catch (error) {
                console.error('Error parsing enhancement suggestions:', error);
                throw new Error('Failed to parse enhancement suggestions');
            }
        } else {
            throw new Error(`Enhancement API Error: ${response.status}`);
        }
    }

    renderEnhancementSuggestions(enhancements) {
        const container = document.getElementById('enhancement-tags');
        
        // Convert categorized enhancements to HTML
        let htmlContent = '';
        
        Object.keys(enhancements).forEach(category => {
            const categoryEnhancements = enhancements[category];
            if (categoryEnhancements && categoryEnhancements.length > 0) {
                htmlContent += `
                    <div class="enhancement-category">
                        <h5 class="enhancement-category-title">${category}</h5>
                        <div class="enhancement-category-items">
                            ${categoryEnhancements.map(enhancement => `
                                <div class="enhancement-item ${enhancement.priority}-priority" 
                                     data-category="${category}"
                                     data-title="${enhancement.title}" 
                                     data-description="${enhancement.description}"
                                     data-priority="${enhancement.priority}"
                                     title="${enhancement.description}">
                                    <span class="enhancement-title">${enhancement.title}</span>
                                    <span class="enhancement-priority ${enhancement.priority}">${enhancement.priority}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        container.innerHTML = htmlContent;

        // Add click event listeners
        container.querySelectorAll('.enhancement-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const enhancementData = {
                    category: item.getAttribute('data-category'),
                    title: item.getAttribute('data-title'),
                    description: item.getAttribute('data-description'),
                    priority: item.getAttribute('data-priority')
                };
                this.toggleEnhancementSelection(enhancementData);
            });
        });
    }

    toggleEnhancementSelection(enhancementData) {
        const enhancementKey = `${enhancementData.category}:${enhancementData.title}`;
        const itemElement = document.querySelector(`[data-category="${enhancementData.category}"][data-title="${enhancementData.title}"]`);
        
        if (this.selectedEnhancements.has(enhancementKey)) {
            this.selectedEnhancements.delete(enhancementKey);
            itemElement.classList.remove('selected');
        } else {
            this.selectedEnhancements.add(enhancementKey);
            itemElement.classList.add('selected');
        }

        console.log('Selected enhancements:', Array.from(this.selectedEnhancements));
    }

    showEnhancementLoading(show) {
        const loading = document.getElementById('enhancement-loading');
        const suggestions = document.getElementById('enhancement-suggestions');
        
        if (show) {
            loading.style.display = 'block';
            suggestions.style.display = 'none';
        } else {
            loading.style.display = 'none';
        }
    }

    updateEnhancementSectionVisibility() {
        const enhancementSection = document.getElementById('enhancement-section');
        const docType = this.getSelectedDocumentType();
        const hasSelectedJobs = this.selectedJobs.size > 0;

        // Show enhancement section for resume generation with selected jobs
        if ((docType === 'resume' || docType === 'both') && hasSelectedJobs) {
            enhancementSection.style.display = 'block';
        } else {
            enhancementSection.style.display = 'none';
            // Reset enhancement state when hidden
            this.selectedEnhancements.clear();
            this.currentEnhancements = [];
            document.getElementById('enhancement-suggestions').style.display = 'none';
        }
    }

    getSelectedEnhancements() {
        const selectedEnhancements = [];
        
        // Convert selected enhancement keys back to enhancement objects
        for (const enhancementKey of this.selectedEnhancements) {
            const [category, title] = enhancementKey.split(':');
            
            // Find the enhancement in currentEnhancements
            if (this.currentEnhancements[category]) {
                const enhancement = this.currentEnhancements[category].find(e => e.title === title);
                if (enhancement) {
                    selectedEnhancements.push({
                        category,
                        title: enhancement.title,
                        description: enhancement.description,
                        priority: enhancement.priority
                    });
                }
            }
        }
        
        return selectedEnhancements;
    }

    // === API CONFIGURATION METHODS ===

    setupApiConfiguration() {
        const configInfo = this.apiService.getConfigInfo();
        const apiKeySection = document.querySelector('.api-key-section');
        const apiStatus = document.getElementById('api-status');
        
        if (configInfo.useCentralizedAPI) {
            // Hide API key input for centralized API
            if (apiKeySection) {
                apiKeySection.style.display = 'none';
            }
            
            // Update status message
            if (apiStatus) {
                apiStatus.textContent = 'Using centralized AI service';
                apiStatus.className = 'status success';
            }

            // Update settings header
            const settingsHeader = document.querySelector('#settings-tab h3');
            if (settingsHeader) {
                settingsHeader.innerHTML = `
                    <svg style="display: inline-block; width: 16px; height: 16px; margin-right: 6px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                    </svg>
                    Service Configuration
                `;
            }

            // Add service info
            const serviceInfo = document.createElement('div');
            serviceInfo.className = 'service-info';
            serviceInfo.innerHTML = `
                <div class="service-details">
                    <p>
                        <svg style="display: inline-block; width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="l9 12l2 2 4-4"/>
                        </svg>
                        AI service is provided and managed centrally
                    </p>
                    <p>
                        <svg style="display: inline-block; width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 11a3 3 0 1 1 6 0c0 2-3 3-3 3"/>
                            <path d="M12 17h.01"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                        No API key configuration required
                    </p>
                    ${configInfo.backendURL ? `<p><small>Service endpoint: ${configInfo.backendURL}</small></p>` : ''}
                </div>
            `;
            
            // Insert service info before test section
            const testSection = document.querySelector('.test-section');
            if (testSection && apiKeySection) {
                apiKeySection.parentNode.insertBefore(serviceInfo, testSection);
            }
        } else {
            // Show API key input for user-provided keys
            if (apiKeySection) {
                apiKeySection.style.display = 'block';
            }
            
            // Load existing API key for settings display
            this.loadApiKeyForSettings();
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, creating AutoApplyAI instance...');
    
    // Add a small delay to ensure all DOM elements are ready
    setTimeout(async () => {
        try {
            window.autoApplyAI = new AutoApplyAI();
            console.log('✅ AutoApplyAI instance created successfully');
            await window.autoApplyAI.init();
            console.log('✅ AutoApplyAI initialized successfully');
        } catch (error) {
            console.error('❌ Failed to create AutoApplyAI instance:', error);
        }
    }, 100); // 100ms delay to ensure DOM is fully ready
});

// Global debug function for testing resume reading
window.testResume = async () => {
    console.log('🧪 Starting resume processing test...');
    if (window.autoApplyAI) {
        return await window.autoApplyAI.testResumeReading();
    } else {
        console.error('❌ AutoApply AI not initialized');
        console.log('💡 Please reload the extension and try again');
        return false;
    }
};

// Additional debug function to show current resume info
window.resumeInfo = () => {
    if (window.autoApplyAI && window.autoApplyAI.resumeFile) {
        const file = window.autoApplyAI.resumeFile;
        console.log('📄 Current resume file info:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: new Date(file.lastModified).toISOString()
        });
        return true;
    } else {
        console.log('❌ No resume file currently loaded');
        return false;
    }
};

