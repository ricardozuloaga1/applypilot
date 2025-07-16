// Background service worker for AutoApply AI
console.log('AutoApply AI background service worker loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('AutoApply AI extension installed');
});

// Handle messages from content scripts and web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request.action, 'from:', sender.tab?.url);
    
    if (request.action === 'jobCaptured') {
        console.log('Processing job capture:', request.jobData?.title || 'No title');
        
        // Store the job data in case popup isn't open
        chrome.storage.local.get(['jobs'], (result) => {
            const jobs = result.jobs || [];
            const newJob = {
                ...request.jobData,
                id: Date.now(),
                capturedAt: new Date().toISOString(),
                starred: false
            };
            jobs.unshift(newJob);
            chrome.storage.local.set({ jobs: jobs }, () => {
                console.log('Job saved to storage:', newJob.title);
                
                // Notify web app about new job if it's listening
                try {
                    chrome.runtime.sendMessage({
                        action: 'jobAdded',
                        jobData: newJob,
                        totalJobs: jobs.length
                    });
                } catch (error) {
                    console.log('Web app not listening for job updates');
                }
                
                sendResponse({ success: true });
            });
        });
        
        // Forward to popup if it's open
        try {
            chrome.runtime.sendMessage(request);
            console.log('Forwarded job capture message to popup');
        } catch (error) {
            console.log('Could not forward to popup (likely not open):', error.message);
        }
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
                            const newJob = {
                                ...response.jobData,
                                id: Date.now(),
                                capturedAt: new Date().toISOString(),
                                starred: false
                            };
                            jobs.unshift(newJob);
                            chrome.storage.local.set({ jobs: jobs }, () => {
                                console.log('Job captured from floating button:', response.jobData.title);
                                
                                // Notify web app about new job if it's listening
                                try {
                                    chrome.runtime.sendMessage({
                                        action: 'jobAdded',
                                        jobData: newJob,
                                        totalJobs: jobs.length
                                    });
                                } catch (error) {
                                    console.log('Web app not listening for job updates');
                                }
                            });
                        });
                    }
                })
                .catch(error => {
                    console.error('Error capturing job from floating button:', error);
                });
        }
    } else if (request.action === 'getJobs') {
        // Web app requesting jobs from extension storage
        console.log('Web app requesting jobs from extension storage');
        chrome.storage.local.get(['jobs'], (result) => {
            const jobs = result.jobs || [];
            console.log('Sending jobs to web app:', jobs.length, 'jobs');
            sendResponse({ success: true, jobs: jobs });
        });
    } else if (request.action === 'getResumes') {
        // Web app requesting resumes from extension storage
        console.log('Web app requesting resumes from extension storage');
        chrome.storage.local.get(['storedResumes', 'activeResumeId'], (result) => {
            const resumes = result.storedResumes || [];
            const activeResumeId = result.activeResumeId || null;
            console.log('Sending resumes to web app:', resumes.length, 'resumes');
            sendResponse({ success: true, resumes: resumes, activeResumeId: activeResumeId });
        });
    } else if (request.action === 'syncData') {
        // Web app requesting full data sync
        console.log('Web app requesting full data sync');
        chrome.storage.local.get(['jobs', 'storedResumes', 'activeResumeId'], (result) => {
            const jobs = result.jobs || [];
            const resumes = result.storedResumes || [];
            const activeResumeId = result.activeResumeId || null;
            console.log('Sending full sync data to web app:', jobs.length, 'jobs,', resumes.length, 'resumes');
            sendResponse({ 
                success: true, 
                jobs: jobs, 
                resumes: resumes, 
                activeResumeId: activeResumeId 
            });
        });
    }
    return true; // Keep message channel open for async responses
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('AutoApply AI service worker started');
});