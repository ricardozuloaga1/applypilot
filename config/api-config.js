// API Configuration for AutoApply AI
// This file contains API endpoints and configuration
// For production deployment, update these values

const API_CONFIG = {
    // Set to true to use centralized API, false for user-provided keys
    USE_CENTRALIZED_API: false,
    
    // Your backend API endpoint (when USE_CENTRALIZED_API is true)
    BACKEND_API_URL: 'https://your-api-server.com/api',
    
    // OpenAI API endpoint (when USE_CENTRALIZED_API is false)
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    
    // API endpoints for your backend
    ENDPOINTS: {
        CHAT_COMPLETION: '/chat-completion',
        USAGE_TRACKING: '/usage',
        USER_AUTH: '/auth'
    }
};

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
} else {
    window.API_CONFIG = API_CONFIG;
} 