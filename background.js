// Background service worker for AutoApply AI
console.log('AutoApply AI background service worker loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('AutoApply AI extension installed');
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'jobCaptured') {
        // Store the job data in case popup isn't open
        chrome.storage.local.get(['jobs'], (result) => {
            const jobs = result.jobs || [];
            jobs.unshift({
                ...request.jobData,
                id: Date.now(),
                capturedAt: new Date().toISOString(),
                starred: false
            });
            chrome.storage.local.set({ jobs: jobs });
        });
        
        // Forward to popup if it's open
        chrome.runtime.sendMessage(request).catch(() => {
            // Popup not open, ignore
        });
    } else if (request.action === 'captureFromFloatingButton') {
        console.log('Capture request from floating button for URL:', request.url);
        
        // Get the sender tab and trigger job capture
        if (sender.tab) {
            // Send message to content script to extract job data
            chrome.tabs.sendMessage(sender.tab.id, { action: 'captureJob' })
                .then(response => {
                    if (response && response.success) {
                        // Store the job
                        chrome.storage.local.get(['jobs'], (result) => {
                            const jobs = result.jobs || [];
                            jobs.unshift({
                                ...response.jobData,
                                id: Date.now(),
                                capturedAt: new Date().toISOString(),
                                starred: false
                            });
                            chrome.storage.local.set({ jobs: jobs });
                            console.log('Job captured from floating button:', response.jobData.title);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error capturing job from floating button:', error);
                });
        }
    }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('AutoApply AI service worker started');
});