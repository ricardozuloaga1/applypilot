// API Service Layer for AutoApply AI
// Handles both centralized API and user-provided API key approaches

class APIService {
    constructor() {
        this.config = window.API_CONFIG || {
            USE_CENTRALIZED_API: false,
            BACKEND_API_URL: '',
            OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions'
        };
    }

    /**
     * Main chat completion method
     * Routes to either centralized API or direct OpenAI based on config
     */
    async chatCompletion(messages, options = {}) {
        if (this.config.USE_CENTRALIZED_API) {
            return await this.centralizedChatCompletion(messages, options);
        } else {
            return await this.directOpenAIChatCompletion(messages, options);
        }
    }

    /**
     * Centralized API approach - calls your backend
     */
    async centralizedChatCompletion(messages, options = {}) {
        const endpoint = `${this.config.BACKEND_API_URL}${this.config.ENDPOINTS.CHAT_COMPLETION}`;
        
        const payload = {
            messages,
            model: options.model || 'gpt-4o',
            max_tokens: options.max_tokens || 1000,
            temperature: options.temperature || 0.3,
            // Add user identification for usage tracking
            user_id: await this.getUserId(),
            source: 'chrome-extension'
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add any authentication headers for your backend
                    'X-Extension-Version': chrome.runtime.getManifest().version
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `API Error: ${response.status}`);
            }

            const result = await response.json();
            
            // Track usage if endpoint is available
            this.trackUsage(messages, result);
            
            return result;
        } catch (error) {
            console.error('Centralized API error:', error);
            throw error;
        }
    }

    /**
     * Direct OpenAI approach - requires user API key
     */
    async directOpenAIChatCompletion(messages, options = {}) {
        const apiKey = await this.getUserApiKey();
        if (!apiKey) {
            throw new Error('OpenAI API key not configured. Please set your API key in the extension settings.');
        }

        const payload = {
            model: options.model || 'gpt-4o',
            messages,
            max_tokens: options.max_tokens || 1000,
            temperature: options.temperature || 0.3
        };

        try {
            const response = await fetch(this.config.OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Direct OpenAI API error:', error);
            throw error;
        }
    }

    /**
     * Get user API key from storage (for direct OpenAI approach)
     */
    async getUserApiKey() {
        try {
            const result = await chrome.storage.sync.get('openaiApiKey');
            return result.openaiApiKey;
        } catch (error) {
            console.error('Error getting API key:', error);
            return null;
        }
    }

    /**
     * Get or generate user ID for usage tracking
     */
    async getUserId() {
        try {
            let result = await chrome.storage.local.get('userId');
            if (!result.userId) {
                // Generate a unique user ID
                result.userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                await chrome.storage.local.set({ userId: result.userId });
            }
            return result.userId;
        } catch (error) {
            console.error('Error getting user ID:', error);
            return 'anonymous_user';
        }
    }

    /**
     * Track API usage (for centralized approach)
     */
    async trackUsage(messages, result) {
        if (!this.config.USE_CENTRALIZED_API) return;

        try {
            const endpoint = `${this.config.BACKEND_API_URL}${this.config.ENDPOINTS.USAGE_TRACKING}`;
            
            const usageData = {
                user_id: await this.getUserId(),
                timestamp: new Date().toISOString(),
                model: result.model || 'gpt-4o',
                prompt_tokens: result.usage?.prompt_tokens || 0,
                completion_tokens: result.usage?.completion_tokens || 0,
                total_tokens: result.usage?.total_tokens || 0,
                source: 'chrome-extension'
            };

            // Fire and forget - don't block on usage tracking
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Extension-Version': chrome.runtime.getManifest().version
                },
                body: JSON.stringify(usageData)
            }).catch(error => {
                console.warn('Usage tracking failed:', error);
            });
        } catch (error) {
            console.warn('Usage tracking error:', error);
        }
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const testMessages = [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Say "Connection test successful" and nothing else.' }
            ];

            const result = await this.chatCompletion(testMessages, {
                max_tokens: 50,
                temperature: 0
            });

            return {
                success: true,
                message: result.choices?.[0]?.message?.content || 'Test completed',
                model: result.model
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                error: error
            };
        }
    }

    /**
     * Check if API is properly configured
     */
    async isConfigured() {
        if (this.config.USE_CENTRALIZED_API) {
            return !!(this.config.BACKEND_API_URL && this.config.ENDPOINTS.CHAT_COMPLETION);
        } else {
            const apiKey = await this.getUserApiKey();
            return !!apiKey;
        }
    }

    /**
     * Get configuration info for UI
     */
    getConfigInfo() {
        return {
            useCentralizedAPI: this.config.USE_CENTRALIZED_API,
            backendURL: this.config.USE_CENTRALIZED_API ? this.config.BACKEND_API_URL : null,
            requiresUserApiKey: !this.config.USE_CENTRALIZED_API
        };
    }
}

// Export for use in extension
window.APIService = APIService; 