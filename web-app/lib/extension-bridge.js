// Extension Bridge - Direct communication with Chrome extension
// This script injects into the web app to access Chrome extension APIs

window.ExtensionBridge = {
  // Test if Chrome extension is available
  isExtensionAvailable() {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  },

  // Get extension ID
  getExtensionId() {
    return chrome?.runtime?.id || null;
  },

  // Send message to extension
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.isExtensionAvailable()) {
        reject(new Error('Chrome extension not available'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Extension communication timeout'));
      }, 5000);

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  },

  // Get jobs from extension
  async getJobs() {
    try {
      const response = await this.sendMessage({ action: 'getJobs' });
      return response.success ? response.jobs : [];
    } catch (error) {
      console.error('Failed to get jobs from extension:', error);
      return [];
    }
  },

  // Get resumes from extension
  async getResumes() {
    try {
      const response = await this.sendMessage({ action: 'getResumes' });
      return response.success ? response.resumes : [];
    } catch (error) {
      console.error('Failed to get resumes from extension:', error);
      return [];
    }
  },

  // Sync all data from extension
  async syncData() {
    try {
      const response = await this.sendMessage({ action: 'syncData' });
      return response.success ? response : null;
    } catch (error) {
      console.error('Failed to sync data from extension:', error);
      return null;
    }
  }
};

console.log('🔗 Extension Bridge loaded');