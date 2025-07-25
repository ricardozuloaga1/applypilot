// Web Content Bridge - Content script for localhost communication
// This script only runs on localhost and bridges extension data to web app

console.log('🔗 Web Content Bridge loaded for:', window.location.href);

// Only run on localhost
if (window.location.hostname === 'localhost') {
  console.log('🔗 Localhost detected, setting up extension bridge');

  // Create a bridge object that the web app can use
  window.ExtensionDataBridge = {
    // Get extension data and inject it into the page
    async getExtensionData() {
      try {
        console.log('🔗 Requesting extension data...');
        
        // Request data from background script
        const response = await chrome.runtime.sendMessage({ action: 'syncData' });
        
        if (response && response.success) {
          console.log('🔗 Extension data received:', {
            jobs: response.jobs?.length || 0,
            resumes: response.resumes?.length || 0
          });
          
          // Inject data into page
          const dataEvent = new CustomEvent('extensionDataReceived', {
            detail: response
          });
          window.dispatchEvent(dataEvent);
          
          return response;
        } else {
          console.log('🔗 Extension data request failed:', response);
          return null;
        }
      } catch (error) {
        console.error('🔗 Extension data request error:', error);
        return null;
      }
    },

    // Get jobs specifically
    async getJobs() {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getJobs' });
        if (response && response.success) {
          return response.jobs || [];
        }
        return [];
      } catch (error) {
        console.error('🔗 Failed to get jobs:', error);
        return [];
      }
    },

    // Get resumes specifically
    async getResumes() {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'getResumes' });
        if (response && response.success) {
          return response.resumes || [];
        }
        return [];
      } catch (error) {
        console.error('🔗 Failed to get resumes:', error);
        return [];
      }
    }
  };

  // Auto-load extension data when page loads
  window.addEventListener('load', () => {
    console.log('🔗 Page loaded, fetching extension data...');
    window.ExtensionDataBridge.getExtensionData();
  });

  // Also try after a short delay in case page hasn't fully loaded
  setTimeout(() => {
    console.log('🔗 Delayed fetch of extension data...');
    window.ExtensionDataBridge.getExtensionData();
  }, 1000);

  // Listen for messages from web app
  window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'REQUEST_EXTENSION_DATA') {
      console.log('🔗 Web app requested extension data');
      const data = await window.ExtensionDataBridge.getExtensionData();
      
      // Send response back to web app
      window.postMessage({
        type: 'EXTENSION_DATA_RESPONSE',
        data: data
      }, '*');
    }
  });

  console.log('🔗 Web Content Bridge setup complete');
}