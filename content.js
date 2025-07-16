// Enhanced content script for job capture
(function() {
    'use strict';
    
    // Prevent multiple loads
    if (window.autoApplyAILoaded) {
        console.log('AutoApply AI content script already loaded, skipping...');
        return;
    }
    window.autoApplyAILoaded = true;
    
    console.log('AutoApply AI content script loaded on:', window.location.href);
    
    // Add global function to manually enable button
    window.forceAutoApplyButton = function() {
        console.log('🔧 Manually forcing AutoApply button...');
        if (document.getElementById('autoapply-capture-btn')) {
            console.log('Button already exists!');
            return;
        }
        createFloatingButton();
    };

// Add a floating capture button
function addCaptureButton() {
    // Don't add if already exists
    if (document.getElementById('autoapply-capture-btn')) {
        console.log('Capture button already exists');
        return;
    }
    
    // Check if extension context is valid
    if (!chrome.runtime || !chrome.runtime.id) {
        console.warn('Extension context is invalid. Skipping button creation.');
        return;
    }
    
    // Check if we're on a supported job site
    const hostname = window.location.hostname.toLowerCase();
    const fullUrl = window.location.href.toLowerCase();
    
    console.log('🔍 DEBUGGING SITE DETECTION:');
    console.log('Full URL:', window.location.href);
    console.log('Hostname:', hostname);
    console.log('Pathname:', window.location.pathname);
    
    const supportedSites = [
        'linkedin.com', 
        'indeed.com', 
        'glassdoor.com', 
        'ziprecruiter.com',
        'lever.co', 
        'greenhouse.io', 
        'workday.com',
        'monster.com',
        'careerbuilder.com',
        'simplyhired.com',
        'dice.com',
        'stackoverflow.com',
        'angel.co',
        'wellfound.com',
        'hired.com',
        'flexjobs.com',
        'remote.co',
        'weworkremotely.com',
        'remoteok.io',
        'joblist.com',
        'theladders.com',
        'clearancejobs.com',
        'usajobs.gov',
        'craigslist.org'
    ];
    
    // Check each supported site individually for debugging
    const matchedSites = supportedSites.filter(site => hostname.includes(site));
    console.log('Matched supported sites:', matchedSites);
    
    // Special handling for www subdomains
    const hostnameWithoutWww = hostname.replace(/^www\./, '');
    const matchedSitesWithoutWww = supportedSites.filter(site => hostnameWithoutWww.includes(site));
    console.log('Matched sites without www:', matchedSitesWithoutWww);
    
    // Check keyword patterns
    const keywordPatterns = ['jobs', 'careers', 'hiring', 'employment', 'work', 'recruit'];
    const matchedKeywords = keywordPatterns.filter(keyword => hostname.includes(keyword) || fullUrl.includes(keyword));
    console.log('Matched keywords in URL:', matchedKeywords);
    
    const isJobSite = matchedSites.length > 0 || matchedSitesWithoutWww.length > 0 || matchedKeywords.length > 0;
    
    if (!isJobSite) {
        console.log('❌ Not on a supported job site, skipping button creation. Hostname:', hostname);
        console.log('Supported sites:', supportedSites);
        
        // Check if user has enabled manual override from extension settings
        chrome.storage.sync.get(['allowAllSites'], function(result) {
            if (result.allowAllSites === true) {
                console.log('✅ Manual override enabled - adding button anyway');
                createFloatingButton();
            } else {
                console.log('💡 TIP: To enable the button on any site, you can:');
                console.log('1. Open the extension popup');
                console.log('2. Enable "Allow on all sites" option');
                console.log('3. Or run: chrome.storage.sync.set({allowAllSites: true})');
            }
        });
        return;
    }
    
    console.log('Adding capture button on supported job site:', hostname);
    createFloatingButton();
}

function createFloatingButton() {
    console.log('🎯 createFloatingButton() called');
    console.log('Document ready state:', document.readyState);
    console.log('Document head exists:', !!document.head);
    console.log('Document body exists:', !!document.body);
    
    // Add CSS animation for spinner
    try {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        console.log('✅ CSS styles added successfully');
    } catch (error) {
        console.error('❌ Error adding CSS styles:', error);
    }
    
    const button = document.createElement('div');
    button.id = 'autoapply-capture-btn';
    button.className = 'autoapply-floating-btn';
    
    // Briefcase design - start with left/top positioning from the beginning
    const initialLeft = window.innerWidth - 140 - 20; // button width + margin
    const initialTop = 20;
    
    button.style.cssText = `
        position: fixed !important;
        left: ${initialLeft}px !important;
        top: ${initialTop}px !important;
        z-index: 2147483647 !important;
        background: #ffffff !important;
        color: #2563eb !important;
        border-radius: 12px !important;
        padding: 12px 16px !important;
        cursor: move !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        border: 1px solid #e5e7eb !important;
        user-select: none !important;
        width: auto !important;
        height: auto !important;
        min-width: 120px !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        pointer-events: auto !important;
        opacity: 1 !important;
        visibility: visible !important;
        transition: none !important;
    `;
    
    button.innerHTML = `
        <div class="autoapply-btn-content" style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" fill="#2563eb"/>
            </svg>
            <span class="autoapply-btn-text" style="font-weight: 600; color: #2563eb;">Capture Job</span>
        </div>
    `;
    
    console.log('Button created at position:', initialLeft, initialTop);
    console.log('Button element:', button);
    console.log('Button computed style:', window.getComputedStyle(button).position, window.getComputedStyle(button).left, window.getComputedStyle(button).top);
    
    // Simple hover effects
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px) scale(1.02)';
        button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        button.style.background = '#f8fafc';
    });
    
    button.addEventListener('mouseleave', () => {
        if (!button.classList.contains('capturing')) {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            button.style.background = '#ffffff';
        }
    });
    
    button.addEventListener('click', (e) => {
        console.log('Button clicked');
        
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Processing click for job capture');
        
        // Add capturing state
        button.classList.add('capturing');
        button.style.background = '#fef3c7';
        button.style.borderColor = '#f59e0b';
        button.innerHTML = `
            <div class="autoapply-btn-content" style="display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0; animation: spin 1s linear infinite;">
                    <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="autoapply-btn-text" style="font-weight: 600; color: #f59e0b;">Capturing...</span>
            </div>
        `;
        
        // Capture job data directly
        const jobData = extractJobData();
        
        // Send to background script with error handling
        try {
            if (chrome.runtime && chrome.runtime.id) {
                console.log('Sending job data to background script:', jobData);
                chrome.runtime.sendMessage({ 
                    action: 'jobCaptured', 
                    jobData: jobData,
                    source: 'floating-button'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message:', chrome.runtime.lastError);
                        throw new Error(chrome.runtime.lastError.message);
                    }
                    console.log('Job capture message sent successfully');
                });
            } else {
                console.warn('Extension context invalidated. Please refresh the page.');
                throw new Error('Extension context invalidated');
            }
        } catch (error) {
            console.warn('Failed to send message to extension:', error.message);
            // Show user-friendly error message
            button.classList.remove('capturing');
            button.style.background = '#fef2f2';
            button.style.borderColor = '#ef4444';
            button.innerHTML = `
                <div class="autoapply-btn-content" style="display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="autoapply-btn-text" style="font-weight: 600; color: #ef4444;">Error</span>
                </div>
            `;
            setTimeout(() => {
                button.classList.remove('error');
                button.style.background = '#ffffff';
                button.style.borderColor = '#e5e7eb';
                button.innerHTML = `
                    <div class="autoapply-btn-content" style="display: flex; align-items: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                            <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" fill="#2563eb"/>
                        </svg>
                        <span class="autoapply-btn-text" style="font-weight: 600; color: #2563eb;">Capture Job</span>
                    </div>
                `;
            }, 3000);
            return;
        }
        
        // Visual feedback
        setTimeout(() => {
            button.classList.remove('capturing');
            button.style.background = '#f0fdf4';
            button.style.borderColor = '#10b981';
            button.innerHTML = `
                <div class="autoapply-btn-content" style="display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="autoapply-btn-text" style="font-weight: 600; color: #10b981;">Captured!</span>
                </div>
            `;
            
            // Reset after 3 seconds
            setTimeout(() => {
                button.style.background = '#ffffff';
                button.style.borderColor = '#e5e7eb';
                button.innerHTML = `
                    <div class="autoapply-btn-content" style="display: flex; align-items: center; gap: 8px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0;">
                            <path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" fill="#2563eb"/>
                        </svg>
                        <span class="autoapply-btn-text" style="font-weight: 600; color: #2563eb;">Capture Job</span>
                    </div>
                `;
            }, 3000);
        }, 1000);
    });
    
    console.log('About to add button to page...');
    console.log('Document body exists:', !!document.body);
    console.log('Document ready state:', document.readyState);
    
    // Ensure document.body exists before appending
    if (document.body) {
        try {
            document.body.appendChild(button);
            console.log('✅ CAPTURE BUTTON ADDED SUCCESSFULLY TO BODY');
            console.log('Button element:', button);
            console.log('Button position:', button.getBoundingClientRect());
            
            // Verify button is actually in DOM
            const checkButton = document.getElementById('autoapply-capture-btn');
            console.log('Button found in DOM:', !!checkButton);
            
            // Button is ready - show brief notification
            showNotification('AutoApply AI ready! Click the capture button to save this job.', 'info');
            
        } catch (error) {
            console.error('❌ ERROR ADDING BUTTON:', error);
        }
    } else {
        console.log('Document body not available yet, setting up observer...');
        // Wait for body to be available
        const observer = new MutationObserver((mutations, obs) => {
            if (document.body) {
                try {
                    document.body.appendChild(button);
                    console.log('✅ CAPTURE BUTTON ADDED AFTER WAITING');
                    showNotification('AutoApply AI is ready! Click the blue button to capture this job.', 'info');
                    obs.disconnect();
                } catch (error) {
                    console.error('❌ ERROR ADDING BUTTON AFTER WAITING:', error);
                }
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('autoapply-notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'autoapply-notification';
    notification.className = `autoapply-notification ${type}`;
    notification.textContent = message;
    
    // Enhanced notification styles
    notification.style.cssText = `
        position: fixed !important;
        top: 80px !important;
        right: 20px !important;
        z-index: 2147483646 !important;
        background: rgba(255, 255, 255, 0.95) !important;
        color: #1f2937 !important;
        border-radius: 12px !important;
        padding: 16px 20px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        backdrop-filter: blur(10px) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        max-width: 300px !important;
        opacity: 0 !important;
        transform: translateY(-10px) !important;
        transition: all 0.3s ease !important;
        line-height: 1.4 !important;
        word-wrap: break-word !important;
    `;
    
    if (type === 'info') {
        notification.style.borderLeft = '4px solid #2563eb';
        notification.style.background = 'rgba(219, 234, 254, 0.95)';
        notification.style.color = '#1e40af';
    }
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Initialize content script
function init() {
    console.log('🚀 Initializing AutoApply AI content script...');
    console.log('📄 Document ready state:', document.readyState);
    console.log('🔗 Extension context valid:', !!(chrome.runtime && chrome.runtime.id));
    console.log('🌍 Current URL:', window.location.href);
    console.log('🏠 Current hostname:', window.location.hostname);
    
    addCaptureButton();
    
    // Also try to add button after a delay in case DOM is still loading
    setTimeout(() => {
        console.log('⏰ Trying to add button after 2s delay...');
        addCaptureButton();
    }, 2000);
    
    // Try again after 5 seconds for slow-loading pages
    setTimeout(() => {
        console.log('⏰ Trying to add button after 5s delay...');
        addCaptureButton();
    }, 5000);
}

// Add button when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Re-add button if page changes (SPA navigation)
let currentUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('URL changed to:', currentUrl);
        setTimeout(() => {
            addCaptureButton();
        }, 1000);
    }
}, 2000);

// Enhanced job extraction function
function extractJobData() {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();
    
    let title = '';
    let company = '';
    let description = '';
    let location = '';
    let salary = '';
    let recruiterName = '';
    let recruiterLinkedIn = '';
    
    // Helper function to highlight element being parsed
    function highlightElement(element, label) {
        if (element) {
            element.classList.add('autoapply-highlight');
            element.setAttribute('data-autoapply-label', label);
            setTimeout(() => {
                element.classList.remove('autoapply-highlight');
                element.removeAttribute('data-autoapply-label');
            }, 2000);
        }
    }
    
    // LinkedIn selectors
    if (hostname.includes('linkedin.com')) {
        // Job title selectors
        const titleSelectors = [
            'h1.job-details-jobs-unified-top-card__job-title',
            'h1.jobs-unified-top-card__job-title',
            '.job-details-jobs-unified-top-card__job-title a',
            'h1[data-test-id="job-title"]',
            '.job-details-jobs-unified-top-card__job-title',
            '.jobs-unified-top-card__job-title a'
        ];
        
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                title = element.textContent.trim();
                highlightElement(element, 'Job Title');
                break;
            }
        }
        
        // Company selectors
        const companySelectors = [
            '.job-details-jobs-unified-top-card__company-name a',
            '.jobs-unified-top-card__company-name a',
            '.job-details-jobs-unified-top-card__company-name',
            '.jobs-unified-top-card__company-name'
        ];
        
        for (const selector of companySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                company = element.textContent.trim();
                highlightElement(element, 'Company');
                break;
            }
        }
        
        // Description selectors
        const descSelectors = [
            '.jobs-description__content',
            '.job-details-jobs-unified-top-card__job-description',
            '.jobs-description-content__text',
            '.job-details-jobs-unified-top-card__job-description-text'
        ];
        
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 50) {
                description = element.textContent.trim();
                highlightElement(element, 'Job Description');
                break;
            }
        }
        
        // Location
        const locationSelectors = [
            '.job-details-jobs-unified-top-card__primary-description',
            '.jobs-unified-top-card__bullet'
        ];
        
        for (const selector of locationSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.includes(',')) {
                location = element.textContent.trim();
                break;
            }
        }
        
        // Recruiter information
        const recruiterSelectors = [
            '.job-details-jobs-unified-top-card__job-insight .job-details-jobs-unified-top-card__job-insight-view-model-secondary a',
            '.jobs-poster__name',
            '.jobs-poster__link',
            '.job-details-jobs-unified-top-card__job-insight a[href*="/in/"]',
            '.hiring-team__member-name'
        ];
        
        for (const selector of recruiterSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                recruiterName = element.textContent.trim();
                if (element.href && element.href.includes('/in/')) {
                    recruiterLinkedIn = element.href;
                }
                break;
            }
        }
        
        // Try to find recruiter in job insights or posting info
        if (!recruiterName) {
            const insightElements = document.querySelectorAll('[data-test-id*="insight"], .job-details-jobs-unified-top-card__job-insight');
            for (const element of insightElements) {
                const links = element.querySelectorAll('a[href*="/in/"]');
                for (const link of links) {
                    const text = link.textContent.trim();
                    if (text && text.length > 2 && text.length < 50) {
                        recruiterName = text;
                        recruiterLinkedIn = link.href;
                        break;
                    }
                }
                if (recruiterName) break;
            }
        }
    }
    
    // Indeed selectors
    else if (hostname.includes('indeed.com')) {
        // Title
        const titleSelectors = [
            'h1[data-testid="jobsearch-JobInfoHeader-title"]',
            'h1.jobsearch-JobInfoHeader-title',
            '[data-testid="jobsearch-JobInfoHeader-title"]'
        ];
        
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                title = element.textContent.trim();
                break;
            }
        }
        
        // Company
        const companySelectors = [
            '[data-testid="inlineHeader-companyName"] a',
            '[data-testid="inlineHeader-companyName"]',
            '.jobsearch-InlineCompanyRating-companyHeader a'
        ];
        
        for (const selector of companySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                company = element.textContent.trim();
                break;
            }
        }
        
        // Description
        const descSelectors = [
            '#jobDescriptionText',
            '.jobsearch-jobDescriptionText',
            '[data-testid="jobsearch-JobComponent-description"]'
        ];
        
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 50) {
                description = element.textContent.trim();
                break;
            }
        }
        
        // Location
        const locationSelectors = [
            '[data-testid="job-location"]',
            '.jobsearch-JobInfoHeader-subtitle'
        ];
        
        for (const selector of locationSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                location = element.textContent.trim();
                break;
            }
        }
        
        // Salary
        const salarySelectors = [
            '[data-testid="job-compensation"]',
            '.jobsearch-JobMetadataHeader-item'
        ];
        
        for (const selector of salarySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.includes('$')) {
                salary = element.textContent.trim();
                break;
            }
        }
    }
    
    // Lever.co selectors
    else if (hostname.includes('lever.co')) {
        const titleEl = document.querySelector('.posting-headline h2');
        if (titleEl) title = titleEl.textContent.trim();
        
        const companyEl = document.querySelector('.main-header-text a');
        if (companyEl) company = companyEl.textContent.trim();
        
        const descEl = document.querySelector('.posting-content .content');
        if (descEl) description = descEl.textContent.trim();
        
        const locationEl = document.querySelector('.posting-categories .location');
        if (locationEl) location = locationEl.textContent.trim();
    }
    
    // Greenhouse.io selectors
    else if (hostname.includes('greenhouse.io')) {
        const titleEl = document.querySelector('.app-title');
        if (titleEl) title = titleEl.textContent.trim();
        
        const companyEl = document.querySelector('.company-name');
        if (companyEl) company = companyEl.textContent.trim();
        
        const descEl = document.querySelector('#content .application-form');
        if (descEl) description = descEl.textContent.trim();
        
        const locationEl = document.querySelector('.location');
        if (locationEl) location = locationEl.textContent.trim();
    }
    
    // Glassdoor selectors
    else if (hostname.includes('glassdoor.com')) {
        // Job title selectors
        const titleSelectors = [
            '[data-test="job-title"]',
            '.jobsearch-JobInfoHeader-title',
            '[data-test="JobTitle"]',
            'h1[data-test="job-title"]',
            '.css-17x2pwl',
            '.jobHeader .strong'
        ];
        
        for (const selector of titleSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                title = element.textContent.trim();
                highlightElement(element, 'Job Title');
                break;
            }
        }
        
        // Company selectors
        const companySelectors = [
            '[data-test="employer-name"]',
            '.EmployerProfile_companyName__dkABq',
            '.css-16nw49e',
            '.empName',
            '.empLoc strong'
        ];
        
        for (const selector of companySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                company = element.textContent.trim();
                highlightElement(element, 'Company');
                break;
            }
        }
        
        // Description selectors - IMPORTANT: Avoid review sections
        const descSelectors = [
            '[data-test="job-description-content"]',
            '.jobDescriptionContent',
            '.desc',
            '.job-description-content',
            '.css-1uon59c',
            '.jobDescContent',
            '#job-description-content',
            '.description .jobDescriptionContent',
            '.jobDescriptionWrapper',
            '.jobDescBody',
            '.jobDescription'
        ];
        
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 50) {
                // Make sure we're not capturing review content
                const text = element.textContent.trim();
                if (!text.includes('Pros"') && !text.includes('Cons"') && 
                    !text.includes('reviews)') && !text.includes('Recommend to a friend') &&
                    !text.includes('Approve of CEO') && !text.includes('Career Opportunities')) {
                    description = text;
                    highlightElement(element, 'Job Description');
                    break;
                }
            }
        }
        
        // Location selectors
        const locationSelectors = [
            '[data-test="job-location"]',
            '.css-1v5elnn',
            '.empLoc',
            '.loc'
        ];
        
        for (const selector of locationSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                location = element.textContent.trim();
                break;
            }
        }
        
        // Salary selectors
        const salarySelectors = [
            '[data-test="detailSalary"]',
            '.css-1oxck78',
            '.salary',
            '.salaryRange',
            '[data-test="pay-range"]'
        ];
        
        for (const selector of salarySelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.includes('$')) {
                salary = element.textContent.trim();
                break;
            }
        }
    }
    
    // Fallback: try generic selectors
    if (!title) {
        // Try common job title patterns
        const titleSelectors = [
            'h1',
            '[class*="job-title" i]',
            '[class*="position" i]',
            '[class*="role" i]',
            '[id*="job-title" i]'
        ];
        
        for (const selector of titleSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.textContent.trim();
                if (text.length > 5 && text.length < 150 && !text.includes('\n')) {
                    title = text;
                    break;
                }
            }
            if (title) break;
        }
    }
    
    if (!company) {
        const companySelectors = [
            '[class*="company" i]',
            '[class*="employer" i]',
            '[class*="organization" i]',
            '[id*="company" i]'
        ];
        
        for (const selector of companySelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const text = el.textContent.trim();
                if (text.length > 2 && text.length < 100 && !text.includes('\n')) {
                    company = text;
                    break;
                }
            }
            if (company) break;
        }
    }
    
    if (!description) {
        const descSelectors = [
            '[class*="description" i]',
            '[class*="summary" i]',
            '[class*="details" i]',
            '[id*="description" i]'
        ];
        
        for (const selector of descSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim().length > 100) {
                const text = element.textContent.trim();
                // Extra protection: Avoid review content on all sites
                if (!text.includes('Pros"') && !text.includes('Cons"') && 
                    !text.includes('reviews)') && !text.includes('Recommend to a friend') &&
                    !text.includes('Approve of CEO') && !text.includes('Career Opportunities')) {
                    description = text;
                break;
                }
            }
        }
    }
    
    // Final fallback for description
    if (!description) {
        const bodyText = document.body.textContent;
        
        // For Glassdoor, try to find job description in specific sections
        if (hostname.includes('glassdoor.com')) {
            // Look for job description keywords to find the right section
            // Try to capture both responsibilities and qualifications
            const fullJobSection = bodyText.match(/Position\s+Responsibilities?:(.*?)(?:Benefits:|We\s+believe\s+in|Show\s+less|$)/is);
            if (fullJobSection) {
                description = fullJobSection[1].trim();
            } else {
                // Try to find other job content sections
                const jobSections = [
                    /Job\s+Description:(.*?)(?:Benefits:|We\s+believe\s+in|Show\s+less|$)/is,
                    /Job\s+Summary:(.*?)(?:Benefits:|We\s+believe\s+in|Show\s+less|$)/is,
                    /About\s+the\s+Role:(.*?)(?:Benefits:|We\s+believe\s+in|Show\s+less|$)/is,
                    /Role\s+Overview:(.*?)(?:Benefits:|We\s+believe\s+in|Show\s+less|$)/is,
                    /Responsibilities?:(.*?)(?:Benefits:|We\s+believe\s+in|Show\s+less|$)/is
                ];
                
                let foundDescription = false;
                for (const pattern of jobSections) {
                    const match = bodyText.match(pattern);
                    if (match) {
                        description = match[1].trim();
                        foundDescription = true;
                        break;
                    }
                }
                
                if (!foundDescription) {
                    // Fallback: Take first 5000 chars but avoid review content
                    const text = bodyText.substring(0, 5000);
                    if (!text.includes('Pros"') && !text.includes('Cons"') && !text.includes('reviews)') &&
                        !text.includes('Approve of CEO') && !text.includes('Career Opportunities')) {
                        description = text;
                    } else {
                        description = 'Job description not available - please try again on the job posting page.';
                    }
                }
            }
        } else {
            description = bodyText.substring(0, 1000);
        }
    }
    
    // Clean up extracted data - remove previous 2000 character limit
    // Allow full job descriptions to be captured for better analysis
    if (description.length > 50000) {
        // Only truncate if extremely long (50k+ characters) to prevent memory issues
        description = description.substring(0, 50000) + '...';
    }
    
    return {
        title: title || 'Job Title Not Found',
        company: company || 'Company Not Found', 
        description: description || 'Description not available',
        location: location || '',
        salary: salary || '',
        recruiterName: recruiterName || '',
        recruiterLinkedIn: recruiterLinkedIn || '',
        url: url,
        source: hostname,
        extractedAt: new Date().toISOString()
    };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'captureJob') {
        try {
            console.log('Starting job data extraction...');
            const jobData = extractJobData();
            console.log('Extracted job data:', jobData);
            
            // Validate that we got meaningful data
            if (jobData.title === 'Job Title Not Found' && jobData.company === 'Company Not Found') {
                console.log('No meaningful job data found');
                sendResponse({ success: false, error: 'No job data found on this page. Make sure you are on a job posting page.' });
            } else {
                console.log('Job data extraction successful');
                sendResponse({ success: true, jobData: jobData });
            }
        } catch (error) {
            console.error('Error extracting job data:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep the message channel open for async response
});

})(); // End of IIFE