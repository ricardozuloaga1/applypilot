// Enhanced popup script with job collection functionality
class AutoApplyAI {
    constructor() {
        this.jobs = []; // Initialize as empty array
        this.selectedJob = null;
        this.resumeFile = null;
        this.currentTab = 'capture';
        this.scoringPaused = false;
        this.matchColors = {
            excellent: { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.6)', icon: '🟢', label: 'Excellent Match' },
            good: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.6)', icon: '🔵', label: 'Good Match' },
            moderate: { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.6)', icon: '🟡', label: 'Moderate Match' },
            weak: { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.6)', icon: '🟠', label: 'Weak Match' },
            poor: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.6)', icon: '🔴', label: 'Poor Match' },
            unscored: { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.6)', icon: '⚪', label: 'Not Scored' }
        };
        this.init();
    }

    async init() {
        try {
            console.log('Initializing AutoApply AI popup...');
            
            // Ensure jobs array is initialized
            this.jobs = [];
            
            await this.loadJobs();
            await this.loadResume();
            this.setupEventListeners();
            this.setupTabs();
            this.renderJobs();
            this.updateJobsCount();
            this.updateGenerateButton();
            this.updateApiStatus();
            
            console.log('AutoApply AI popup initialized successfully');
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
        // Capture tab
        document.getElementById('capture-btn').addEventListener('click', () => this.captureJob());
        document.getElementById('resume-upload').addEventListener('change', (e) => this.handleResumeUpload(e));
        document.getElementById('score-all-btn').addEventListener('click', () => this.scoreAllJobs());
        document.getElementById('pause-scoring-btn').addEventListener('click', () => this.toggleScoringPause());
        
        // Jobs tab
        document.getElementById('clear-jobs-btn').addEventListener('click', () => this.clearAllJobs());
        document.getElementById('search-jobs').addEventListener('input', (e) => this.searchJobs(e.target.value));
        
        // Sort dropdown
        document.getElementById('sort-button').addEventListener('click', () => this.toggleSortDropdown());
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sort-dropdown')) {
                this.closeSortDropdown();
            }
        });
        
        // Sort options
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const value = e.target.dataset.value;
                this.selectSortOption(value);
                this.sortJobs(value);
            });
        });
        
        // Generate tab
        document.getElementById('generate-btn').addEventListener('click', () => this.generateDocument());
        
        // Settings tab
        document.getElementById('save-api-key-btn').addEventListener('click', () => this.saveApiKey());
        document.getElementById('test-api-btn').addEventListener('click', () => this.testApiConnection());
        
        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'jobCaptured') {
                this.handleJobCaptured(request.jobData);
            }
        });
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        
        // Update content based on tab
        if (tabName === 'jobs') {
            this.renderJobs();
        } else if (tabName === 'generate') {
            this.updateGenerateButton();
        } else if (tabName === 'settings') {
            this.loadApiKeyForSettings();
        }
    }

    async captureJob() {
        const captureBtn = document.getElementById('capture-btn');
        const originalText = captureBtn.textContent;
        
        // Disable button and show progress
        captureBtn.disabled = true;
        captureBtn.classList.add('capturing');
        captureBtn.textContent = '⏳ Capturing...';
        this.setStatus('capture-status', 'Capturing job...', 'info');
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            console.log('Current tab URL:', tab.url);
            
            // Check if we're on a supported job site
            const hostname = new URL(tab.url).hostname.toLowerCase();
            const supportedSites = ['linkedin.com', 'indeed.com', 'lever.co', 'greenhouse.io', 'workday.com'];
            const isJobSite = supportedSites.some(site => hostname.includes(site)) || 
                             hostname.includes('jobs') || hostname.includes('careers');
            
            console.log('Hostname:', hostname, 'Is job site:', isJobSite);
            
            if (!isJobSite) {
                this.setStatus('capture-status', 'Please navigate to a job posting on LinkedIn, Indeed, or other job sites', 'error');
                return;
            }
            
            // Inject content script if needed
            this.setStatus('capture-status', 'Preparing page...', 'info');
            try {
                // First inject CSS
                await chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['content.css']
                });
                console.log('Content CSS injected successfully');
                
                // Then inject JavaScript
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                console.log('Content script injected successfully');
                
                // Also try to manually add the button via code injection
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        console.log('🚀 MANUAL BUTTON INJECTION ATTEMPT');
                        // Remove existing button first
                        const existing = document.getElementById('autoapply-capture-btn');
                        if (existing) existing.remove();
                        
                        // Create button with proper functionality
                        const btn = document.createElement('div');
                        btn.id = 'autoapply-capture-btn';
                        btn.style.cssText = `
                            position: fixed !important;
                            top: 20px !important;
                            right: 20px !important;
                            z-index: 2147483647 !important;
                            background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
                            color: white !important;
                            border-radius: 12px !important;
                            padding: 16px 20px !important;
                            cursor: pointer !important;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                            font-size: 14px !important;
                            font-weight: 600 !important;
                            border: none !important;
                            box-shadow: 0 4px 20px rgba(37, 99, 235, 0.4) !important;
                            transition: all 0.3s ease !important;
                        `;
                        
                        btn.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 16px;">🤖</span>
                                <span>Capture Job</span>
                            </div>
                        `;
                        
                        // Add hover effects
                        btn.onmouseenter = () => {
                            btn.style.transform = 'translateY(-2px)';
                            btn.style.boxShadow = '0 6px 25px rgba(37, 99, 235, 0.6)';
                        };
                        btn.onmouseleave = () => {
                            btn.style.transform = 'translateY(0)';
                            btn.style.boxShadow = '0 4px 20px rgba(37, 99, 235, 0.4)';
                        };
                        
                        // Add click functionality to trigger job capture
                        btn.onclick = () => {
                            btn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                            btn.innerHTML = `
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 16px;">⏳</span>
                                    <span>Capturing...</span>
                                </div>
                            `;
                            
                            // Send message to background script to trigger capture
                            chrome.runtime.sendMessage({ 
                                action: 'captureFromFloatingButton',
                                url: window.location.href
                            });
                            
                            // Reset button after delay
                            setTimeout(() => {
                                btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                                btn.innerHTML = `
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 16px;">✅</span>
                                        <span>Captured!</span>
                                    </div>
                                `;
                                
                                setTimeout(() => {
                                    btn.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
                                    btn.innerHTML = `
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="font-size: 16px;">🤖</span>
                                            <span>Capture Job</span>
                                        </div>
                                    `;
                                }, 2000);
                            }, 1000);
                        };
                        
                        document.body.appendChild(btn);
                        console.log('✅ FUNCTIONAL CAPTURE BUTTON ADDED');
                    }
                });
                console.log('Functional button injection attempted');
                
            } catch (injectionError) {
                console.log('Content script injection result:', injectionError);
                // Continue anyway - might already be injected
            }
            
            // Longer delay to ensure content script is ready
            this.setStatus('capture-status', 'Analyzing page content...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Send message to content script with timeout
            this.setStatus('capture-status', 'Extracting job details...', 'info');
            let response;
            try {
                console.log('Sending message to content script...');
                response = await Promise.race([
                    chrome.tabs.sendMessage(tab.id, { action: 'captureJob' }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Capture timeout')), 15000)
                    )
                ]);
                console.log('Content script response:', response);
            } catch (timeoutError) {
                console.error('Message sending error:', timeoutError);
                if (timeoutError.message === 'Capture timeout') {
                    this.setStatus('capture-status', 'Capture timed out. Please refresh the page and try again.', 'error');
                    return;
                } else if (timeoutError.message.includes('Receiving end does not exist')) {
                    this.setStatus('capture-status', 'Content script not ready. Please refresh the page and try again.', 'error');
                    return;
                }
                throw timeoutError;
            }
            
            if (response && response.success) {
                console.log('Job capture successful:', response.jobData);
                await this.handleJobCaptured(response.jobData);
            } else {
                console.log('Job capture failed:', response);
                this.setStatus('capture-status', response?.error || 'No job found on this page. Try refreshing and capturing again.', 'error');
            }
        } catch (error) {
            console.error('Capture error:', error);
            
            // Handle specific error types
            if (error.message.includes('context invalidated')) {
                this.setStatus('capture-status', 'Extension was reloaded. Please refresh the page and try again.', 'error');
            } else if (error.message.includes('Receiving end does not exist')) {
                this.setStatus('capture-status', 'Content script not loaded. Please refresh the page and try again.', 'error');
            } else {
                this.setStatus('capture-status', `Error: ${error.message}. Try refreshing the page.`, 'error');
            }
        } finally {
            // Always reset button state
            captureBtn.disabled = false;
            captureBtn.classList.remove('capturing');
            captureBtn.textContent = originalText;
            
            // Reset status to ready after a delay (unless it's a success message)
            setTimeout(() => {
                const statusEl = document.getElementById('capture-status');
                if (statusEl && !statusEl.classList.contains('success')) {
                    this.setStatus('capture-status', 'Ready to capture jobs', 'info');
                }
            }, 5000);
        }
    }

    async handleJobCaptured(jobData) {
        console.log('Handling captured job data:', jobData);
        
        // Ensure jobs array exists
        if (!this.jobs || !Array.isArray(this.jobs)) {
            console.warn('Jobs array not initialized in handleJobCaptured, initializing...');
            this.jobs = [];
        }
        
        jobData.id = Date.now();
        jobData.capturedAt = new Date().toISOString();
        jobData.starred = false;
        
        this.jobs.unshift(jobData);
        console.log('Jobs array after adding new job:', this.jobs.length);
        
        await this.saveJobs();
        this.renderJobs();
        this.updateJobsCount();
        this.setStatus('capture-status', `✅ Captured: ${jobData.title}`, 'success');
        
        // Auto-select the newly captured job
        this.selectedJob = jobData;
        this.updateGenerateButton();
        
        // Auto-score the job if resume is available
        if (this.resumeFile) {
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
            return;
        }
        
        container.innerHTML = this.jobs.map(job => {
            const matchColor = this.getMatchColor(job.matchAnalysis?.score);
            const matchScore = job.matchAnalysis?.score;
            
            return `
            <div class="job-item ${this.selectedJob && this.selectedJob.id === job.id ? 'selected' : ''}" 
                 data-job-id="${job.id}">
                <div class="job-content">
                    <div class="job-info">
                        <div class="job-title">${this.escapeHtml(job.title)}</div>
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
                        <div class="job-action" data-action="expand" data-job-id="${job.id}">▼</div>
                        <div class="job-action" data-action="star" data-job-id="${job.id}">
                            ${job.starred ? '⭐' : '☆'}
                        </div>
                        ${matchScore === null || matchScore === undefined ? 
                            `<div class="job-action" data-action="score" data-job-id="${job.id}" title="Score this job">📊</div>` : 
                            `<div class="job-action" data-action="rescore" data-job-id="${job.id}" title="Re-score this job">🔄</div>`
                        }
                        <div class="job-action" data-action="delete" data-job-id="${job.id}">🗑️</div>
                    </div>
                </div>
                <div class="job-expanded-content" data-job-id="${job.id}" style="display: none;">
                    ${job.matchAnalysis ? `
                        <div class="match-analysis">
                            <h4>🎯 Match Analysis</h4>
                            <div class="match-details">
                                <div class="match-section">
                                    <strong>✅ Strengths:</strong>
                                    <ul>${job.matchAnalysis.strengths.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}</ul>
                                </div>
                                <div class="match-section">
                                    <strong>❌ Gaps:</strong>
                                    <ul>${job.matchAnalysis.gaps.map(g => `<li>${this.escapeHtml(g)}</li>`).join('')}</ul>
                                </div>
                                <div class="match-section">
                                    <strong>💡 Recommendations:</strong>
                                    <ul>${job.matchAnalysis.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('')}</ul>
                                </div>
                                <div class="match-reasoning">
                                    <strong>Analysis:</strong> ${this.escapeHtml(job.matchAnalysis.reasoning)}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="job-description">${this.escapeHtml(job.description)}</div>
                    <div class="job-details">
                        <div class="job-detail-item">
                            <strong>Location:</strong> ${this.escapeHtml(job.location || 'Not specified')}
                        </div>
                        <div class="job-detail-item">
                            <strong>Salary:</strong> ${this.escapeHtml(job.salary || 'Not specified')}
                        </div>
                        ${job.recruiterName ? `<div class="job-detail-item">
                            <strong>Recruiter:</strong> ${job.recruiterLinkedIn ? `<a href="${job.recruiterLinkedIn}" target="_blank">${this.escapeHtml(job.recruiterName)}</a>` : this.escapeHtml(job.recruiterName)}
                        </div>` : ''}
                        <div class="job-detail-item">
                            <strong>URL:</strong> <a href="${job.url}" target="_blank" title="${job.url}">🔗 View Job Posting</a>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
        
        // Add event listeners to job items
        container.querySelectorAll('.job-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('job-action')) {
                    const jobId = parseInt(item.getAttribute('data-job-id'));
                    this.selectJob(jobId);
                }
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
                    if (actionType === 'star') {
                        this.toggleStar(jobId);
                    } else if (actionType === 'delete') {
                        this.deleteJob(jobId);
                    } else if (actionType === 'expand') {
                        this.toggleJobExpansion(jobId);
                    } else if (actionType === 'score' || actionType === 'rescore') {
                        this.scoreJob(jobId);
                    }
                } catch (error) {
                    console.error('Error handling job action:', error);
                }
            });
        });
    }

    selectJob(jobId) {
        this.selectedJob = this.jobs.find(job => job.id === jobId);
        this.renderJobs();
        this.updateGenerateButton();
    }

    async toggleStar(jobId) {
        console.log('Toggling star for job ID:', jobId);
        const job = this.jobs.find(job => job.id === jobId);
        if (job) {
            job.starred = !job.starred;
            console.log('Job starred status changed to:', job.starred);
            await this.saveJobs();
            this.renderJobs();
        } else {
            console.error('Job not found for ID:', jobId);
        }
    }

    toggleJobExpansion(jobId) {
        console.log('Toggling expansion for job ID:', jobId);
        const expandedContent = document.querySelector(`[data-job-id="${jobId}"].job-expanded-content`);
        const expandButton = document.querySelector(`[data-action="expand"][data-job-id="${jobId}"]`);
        
        console.log('Found expanded content:', !!expandedContent);
        console.log('Found expand button:', !!expandButton);
        
        if (expandedContent && expandButton) {
            const isExpanded = expandedContent.style.display !== 'none';
            expandedContent.style.display = isExpanded ? 'none' : 'block';
            expandButton.textContent = isExpanded ? '▼' : '▲';
            console.log('Job expansion toggled. Is now expanded:', !isExpanded);
        } else {
            console.error('Could not find expansion elements for job ID:', jobId);
        }
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
        const dropdown = document.getElementById('sort-dropdown');
        dropdown.classList.toggle('show');
    }
    
    closeSortDropdown() {
        const dropdown = document.getElementById('sort-dropdown');
        dropdown.classList.remove('show');
    }
    
    selectSortOption(value) {
        const sortText = document.getElementById('sort-text');
        const options = document.querySelectorAll('.sort-option');
        
        options.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.value === value) {
                option.classList.add('selected');
                sortText.textContent = option.textContent;
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
        this.updateResumeStatus();
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
            statusEl.textContent = 'No resume uploaded';
            statusEl.style.color = 'rgba(255, 255, 255, 0.6)';
        }
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
        
        const hasJob = this.selectedJob !== null;
        const hasResume = this.resumeFile !== null;
        
        if (hasJob && hasResume) {
            generateBtn.disabled = false;
            generateStatus.textContent = `Ready to generate for: ${this.selectedJob.title}`;
            generateStatus.className = 'status';
        } else if (!hasJob && !hasResume) {
            generateBtn.disabled = true;
            generateStatus.textContent = 'Select a job and upload your resume first';
            generateStatus.className = 'status';
        } else if (!hasJob) {
            generateBtn.disabled = true;
            generateStatus.textContent = 'Select a job from the Jobs tab';
            generateStatus.className = 'status';
        } else {
            generateBtn.disabled = true;
            generateStatus.textContent = 'Upload your resume first';
            generateStatus.className = 'status';
        }
    }

    async generateDocument() {
        if (!this.selectedJob || !this.resumeFile) return;
        
        const docType = document.getElementById('doc-type').value;
        this.setStatus('generate-status', 'Generating document with ChatGPT-4o...', 'info');
        
        try {
            // Read resume file
            const resumeText = await this.readFileAsText(this.resumeFile);
            
            // Get API key from storage
            const apiKey = await this.getApiKey();
            if (!apiKey) {
                throw new Error('OpenAI API key not configured. Please set your API key in the extension settings.');
            }

            // Generate document with optimized prompts
            const content = await this.generateOptimizedDocument(resumeText, this.selectedJob, docType, apiKey);
            this.downloadDocument(content, docType, this.selectedJob.title);
            this.setStatus('generate-status', 'Document generated successfully!', 'success');
            
        } catch (error) {
            console.error('Generation error:', error);
            this.setStatus('generate-status', `Error: ${error.message}`, 'error');
        }
    }

    async generateOptimizedDocument(resumeText, job, docType, apiKey) {
        let systemPrompt = '';
        let userPrompt = '';
        
        switch (docType) {
            case 'resume':
                systemPrompt = `You are an expert resume writer and ATS optimization specialist. Your task is to tailor a resume for a specific job posting.

CRITICAL RULES:
- ONLY use information that exists in the original resume
- NEVER invent new jobs, skills, companies, or experiences
- NEVER add fictional details or accomplishments
- Focus on reordering, rephrasing, and emphasizing relevant content
- Use keywords from the job description naturally
- Maintain professional formatting and structure
- Keep all dates, company names, and factual information exactly as provided`;

                userPrompt = `Tailor this resume for the following job posting. Optimize for ATS systems and highlight the most relevant experiences.

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

ORIGINAL RESUME:
${resumeText}

INSTRUCTIONS:
1. Reorganize sections to highlight most relevant experience first
2. Rewrite bullet points to emphasize skills mentioned in the job description
3. Use action verbs and quantifiable achievements where they exist
4. Include relevant keywords naturally
5. Maintain the same factual content - do not invent anything
6. Return ONLY the tailored resume content in clean markdown format`;
                break;

            case 'cover-letter':
                systemPrompt = `You are a professional cover letter writer. Create compelling, personalized cover letters that demonstrate genuine interest and relevant qualifications.

CRITICAL RULES:
- Write in a professional, engaging tone
- Reference specific details from the job posting
- Highlight relevant experience from the resume
- Keep it concise (3-4 paragraphs maximum)
- Show enthusiasm for the role and company
- NEVER invent experience not in the resume`;

                userPrompt = `Write a compelling cover letter for this job application:

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

RESUME SUMMARY:
${resumeText.substring(0, 1500)}

REQUIREMENTS:
1. Address the hiring manager professionally
2. Open with enthusiasm for the specific role
3. Highlight 2-3 most relevant experiences from the resume
4. Show knowledge of the company/role requirements
5. Close with a professional call to action
6. Keep it under 400 words
7. Format as a proper business letter`;
                break;

            case 'follow-up':
                systemPrompt = `You are a professional communication expert. Write polite, professional follow-up emails that demonstrate continued interest without being pushy.`;

                userPrompt = `Write a professional follow-up email for this job application:

JOB DETAILS:
Title: ${job.title}
Company: ${job.company}

REQUIREMENTS:
1. Professional subject line
2. Polite greeting
3. Brief reminder of the application and enthusiasm
4. Offer to provide additional information
5. Professional closing
6. Keep it concise (under 150 words)
7. Strike a balance between persistent and respectful`;
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
                    
                    // Method 3: Ask user to provide plain text
                    const errorMsg = `❌ Unable to extract text from Word document. 

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

    downloadDocument(content, type, jobTitle) {
        const filename = `${type}-${jobTitle.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
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

    async loadResume() {
        try {
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
            
            const resumeData = {
                name: this.resumeFile.name,
                type: this.resumeFile.type,
                content: content,
                processedAt: new Date().toISOString(),
                originalSize: this.resumeFile.size,
                extractedLength: content.length
            };
            
            await chrome.storage.local.set({ resumeFile: resumeData });
            
            console.log('✅ Resume processed and saved successfully');
            console.log(`📊 Stats: Original ${this.resumeFile.size} bytes → ${content.length} characters extracted`);
            
            // Show success feedback
            const resumeStatus = document.getElementById('resume-status');
            if (resumeStatus) {
                resumeStatus.textContent = `✅ ${this.resumeFile.name} (${content.length} chars extracted)`;
                resumeStatus.style.color = '#10b981';
            }
            
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
            console.log('Resume content length:', resumeText.length, 'characters');
            console.log('Resume preview:', resumeText.substring(0, 200) + '...');
            
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
            const maxJobDescLength = 4000; // ~1000 tokens - increased for better context
            
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
            let truncatedJobDesc = job.description;
            if (job.description.length > maxJobDescLength) {
                const reqMatch = job.description.match(/(requirements?|qualifications?|must have|essential)[^]*?(?=\n\n|\n[A-Z]|$)/i);
                const respMatch = job.description.match(/(responsibilities?|duties|role|what you'll do)[^]*?(?=\n\n|\n[A-Z]|$)/i);
                
                let keyContent = [reqMatch?.[0], respMatch?.[0]]
                    .filter(Boolean).join('\n\n');
                
                if (keyContent.length > maxJobDescLength) {
                    truncatedJobDesc = keyContent.substring(0, maxJobDescLength) + '...';
                } else {
                    truncatedJobDesc = keyContent || job.description.substring(0, maxJobDescLength) + '...';
                }
            }
            
            // Log truncation info
            if (resumeText.length > maxResumeLength) {
                console.log(`Resume truncated: ${resumeText.length} → ${truncatedResume.length} chars`);
            }
            if (job.description.length > maxJobDescLength) {
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

Format response as JSON:
{
  "overallScore": 45,
  "strengths": ["Specific matching skills/experience found"],
  "gaps": ["Specific missing requirements"],
  "recommendations": ["Concrete actionable advice"],
  "reasoning": "Detailed explanation of score calculation"
}
`;

            // Use the API key from the ML scoring section
            if (!apiKey) {
                throw new Error('OpenAI API key not configured. Please set your API key in the extension settings.');
            }

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
                    const matchData = JSON.parse(content);
                    
                    return {
                        score: Math.max(0, Math.min(100, matchData.overallScore || 0)),
                        strengths: matchData.strengths || [],
                        gaps: matchData.gaps || [],
                        recommendations: matchData.recommendations || [],
                        reasoning: matchData.reasoning || '',
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
            
            // Show progress to user
            this.setStatus('capture-status', `Analyzing match for: ${job.title}...`, 'info');
            
            // Update UI to show scoring in progress
            const matchData = await this.calculateJobMatchWithRetry(job);
            if (matchData) {
                job.matchAnalysis = matchData;
                await this.saveJobs();
                this.renderJobs();
                this.setStatus('capture-status', `✅ Analysis complete for: ${job.title}`, 'success');
            } else {
                this.setStatus('capture-status', `❌ Failed to analyze: ${job.title}`, 'error');
            }
        } catch (error) {
            console.error('Score job error:', error);
            if (error.message.includes('Rate limit')) {
                this.setStatus('capture-status', `❌ Rate limit exceeded. Please wait a moment and try again.`, 'error');
            } else if (error.message.includes('not supported') || error.message.includes('unreadable') || error.message.includes('Failed to extract')) {
                this.setStatus('capture-status', `❌ Document processing error: ${error.message}`, 'error');
            } else if (error.message.includes('API key not configured')) {
                this.setStatus('capture-status', `❌ ${error.message}`, 'error');
            } else {
                this.setStatus('capture-status', `❌ Error: ${error.message}`, 'error');
            }
        }
    }

    // API Key Management Methods
    async getApiKey() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['openaiApiKey'], (result) => {
                resolve(result.openaiApiKey);
            });
        });
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
        const apiKey = await this.getApiKey();
        
        if (!apiKey) {
            this.setStatus('api-status', 'No API key configured. Please save an API key first.', 'error');
            return;
        }
        
        this.setStatus('api-status', '🧪 Testing API connection...', 'info');
        
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            if (response.ok) {
                this.setStatus('api-status', '✅ API connection successful!', 'success');
                this.updateApiStatus();
            } else {
                const error = await response.json();
                this.setStatus('api-status', `❌ API test failed: ${error.error?.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('API test error:', error);
            this.setStatus('api-status', '❌ API test failed: Network error', 'error');
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
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.autoApplyAI = new AutoApplyAI();
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

