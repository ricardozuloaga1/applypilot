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
    
    // DEBUG MODE: Always add button for testing
    const hostname = window.location.hostname.toLowerCase();
    console.log('FORCE ADDING BUTTON FOR DEBUGGING - hostname:', hostname);
    console.log('Current URL:', window.location.href);
    console.log('Extension context valid:', !!(chrome.runtime && chrome.runtime.id));
    
    const button = document.createElement('div');
    button.id = 'autoapply-capture-btn';
    button.className = 'autoapply-floating-btn';
    
    // Add inline styles to ensure visibility even if CSS doesn't load
    button.style.cssText = `
        position: fixed !important;
        top: 50px !important;
        right: 50px !important;
        z-index: 2147483647 !important;
        background: #ff0066 !important;
        color: white !important;
        border-radius: 15px !important;
        padding: 20px 25px !important;
        cursor: pointer !important;
        box-shadow: 0 8px 30px rgba(255, 0, 102, 0.6) !important;
        font-family: Arial, sans-serif !important;
        font-size: 16px !important;
        font-weight: bold !important;
        border: 3px solid white !important;
        user-select: none !important;
        width: auto !important;
        height: auto !important;
        min-width: 150px !important;
        text-align: center !important;
    `;
    
    button.innerHTML = `
        <div style="display: block; text-align: center;">
            <div style="font-size: 20px; margin-bottom: 5px;">🤖</div>
            <div style="font-size: 14px; font-weight: bold;">DEBUG: CAPTURE</div>
        </div>
    `;
    
    button.addEventListener('click', () => {
        // Add capturing state
        button.classList.add('capturing');
        button.innerHTML = `
            <div class="autoapply-btn-content">
                <span class="autoapply-btn-icon">⏳</span>
                <span class="autoapply-btn-text">Capturing...</span>
            </div>
        `;
        
        // Capture job data directly
        const jobData = extractJobData();
        
        // Send to popup with error handling
        try {
            if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ 
            action: 'jobCaptured', 
            jobData: jobData 
        });
            } else {
                console.warn('Extension context invalidated. Please refresh the page.');
                throw new Error('Extension context invalidated');
            }
        } catch (error) {
            console.warn('Failed to send message to extension:', error.message);
            // Show user-friendly error message
            button.classList.remove('capturing');
            button.classList.add('error');
            button.innerHTML = `
                <div class="autoapply-btn-content">
                    <span class="autoapply-btn-icon">❌</span>
                    <span class="autoapply-btn-text">Error</span>
                </div>
            `;
            setTimeout(() => {
                button.classList.remove('error');
                button.innerHTML = `
                    <div class="autoapply-btn-content">
                        <span class="autoapply-btn-icon">🤖</span>
                        <span class="autoapply-btn-text">Capture</span>
                    </div>
                    <div class="autoapply-tooltip">Refresh page to fix extension</div>
                `;
            }, 3000);
            return;
        }
        
        // Visual feedback
        setTimeout(() => {
            button.classList.remove('capturing');
            button.classList.add('success');
            button.innerHTML = `
                <div class="autoapply-btn-content">
                    <span class="autoapply-btn-icon">✅</span>
                    <span class="autoapply-btn-text">Captured!</span>
                </div>
            `;
            
            // Reset after 2 seconds
            setTimeout(() => {
                button.classList.remove('success');
                button.innerHTML = `
                    <div class="autoapply-btn-content">
                        <span class="autoapply-btn-icon">🤖</span>
                        <span class="autoapply-btn-text">Capture</span>
                    </div>
                    <div class="autoapply-tooltip">Capture job details</div>
                `;
            }, 2000);
        }, 500);
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
                    obs.disconnect();
                } catch (error) {
                    console.error('❌ ERROR ADDING BUTTON AFTER WAITING:', error);
                }
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }
}

// Initialize content script
function init() {
    console.log('Initializing AutoApply AI content script...');
    console.log('Document ready state:', document.readyState);
    console.log('Extension context valid:', !!(chrome.runtime && chrome.runtime.id));
    
    addCaptureButton();
    
    // Also try to add button after a delay in case DOM is still loading
    setTimeout(() => {
        addCaptureButton();
    }, 2000);
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
                description = element.textContent.trim();
                break;
            }
        }
    }
    
    // Final fallback for description
    if (!description) {
        description = document.body.textContent.substring(0, 1000);
    }
    
    // Clean up extracted data
    if (description.length > 2000) {
        description = description.substring(0, 2000) + '...';
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