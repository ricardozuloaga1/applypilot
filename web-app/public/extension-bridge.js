// Extension Bridge - Communication with Chrome extension via content script
// This script communicates with the extension through a content script bridge

window.ExtensionBridge = {
  // Test if Chrome extension is available via content script
  isExtensionAvailable() {
    return typeof window.ExtensionDataBridge !== 'undefined';
  },

  // Get extension ID (not available in web context)
  getExtensionId() {
    return 'via-content-script';
  },

  // Send message to extension via content script
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (this.isExtensionAvailable()) {
        // Use content script bridge directly
        if (message.action === 'syncData') {
          window.ExtensionDataBridge.getExtensionData()
            .then(resolve)
            .catch(reject);
        } else if (message.action === 'getJobs') {
          window.ExtensionDataBridge.getJobs()
            .then(jobs => resolve({ success: true, jobs }))
            .catch(reject);
        } else if (message.action === 'getResumes') {
          window.ExtensionDataBridge.getResumes()
            .then(resumes => resolve({ success: true, resumes }))
            .catch(reject);
        } else {
          reject(new Error('Unknown action: ' + message.action));
        }
      } else {
        // Fallback to postMessage communication
        const timeout = setTimeout(() => {
          reject(new Error('Extension communication timeout'));
        }, 5000);

        const responseHandler = (event) => {
          if (event.data.type === 'EXTENSION_DATA_RESPONSE') {
            clearTimeout(timeout);
            window.removeEventListener('message', responseHandler);
            resolve(event.data.data);
          }
        };

        window.addEventListener('message', responseHandler);
        window.postMessage({ type: 'REQUEST_EXTENSION_DATA' }, '*');
      }
    });
  },

  // Get jobs from extension
  async getJobs() {
    try {
      if (this.isExtensionAvailable()) {
        const jobs = await window.ExtensionDataBridge.getJobs();
        return jobs || [];
      } else {
        const response = await this.sendMessage({ action: 'getJobs' });
        return response.success ? response.jobs : [];
      }
    } catch (error) {
      console.error('Failed to get jobs from extension:', error);
      return [];
    }
  },

  // Get resumes from extension
  async getResumes() {
    try {
      if (this.isExtensionAvailable()) {
        const resumes = await window.ExtensionDataBridge.getResumes();
        return resumes || [];
      } else {
        const response = await this.sendMessage({ action: 'getResumes' });
        return response.success ? response.resumes : [];
      }
    } catch (error) {
      console.error('Failed to get resumes from extension:', error);
      return [];
    }
  },

  // Sync all data from extension
  async syncData() {
    try {
      if (this.isExtensionAvailable()) {
        const data = await window.ExtensionDataBridge.getExtensionData();
        return data;
      } else {
        const response = await this.sendMessage({ action: 'syncData' });
        return response.success ? response : null;
      }
    } catch (error) {
      console.error('Failed to sync data from extension:', error);
      return null;
    }
  }
};

// Listen for extension data events
window.addEventListener('extensionDataReceived', (event) => {
  console.log('🔗 Extension data received via event:', event.detail);
  
  // Store data globally for immediate access
  window.latestExtensionData = event.detail;
});

console.log('🔗 Extension Bridge loaded');