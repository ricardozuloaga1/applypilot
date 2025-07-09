// Supabase configuration for AutoApply AI Chrome Extension
// This file handles the connection to our Supabase backend

// Supabase credentials - UPDATE THESE WITH YOUR PROJECT VALUES
const SUPABASE_URL = 'https://jnelcvbgrvwpsnjyqgck.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuZWxjdmJncnZ3cHNuanlxZ2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTgzNjEsImV4cCI6MjA2NzQ3NDM2MX0.PTATm9Dxj-P_kRLjYe49MsnEPfxXcw7Fql16lQV9gPs'; // Replace with your anon key

// Import Supabase client (we'll load this from CDN in the HTML)
// For Chrome extensions, we need to load the UMD version
const { createClient } = supabase;

// Create Supabase client instance
let supabaseClient = null;

// Initialize Supabase client
function initializeSupabase() {
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
            SUPABASE_URL === 'YOUR_SUPABASE_URL' || 
            SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            throw new Error('Supabase credentials not configured. Please update config/supabase.js');
        }

        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false
            },
            realtime: {
                enabled: false // Disable realtime for better performance in extension
            }
        });

        console.log('✅ Supabase client initialized successfully');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        throw error;
    }
}

// Get or create Supabase client
function getSupabaseClient() {
    if (!supabaseClient) {
        return initializeSupabase();
    }
    return supabaseClient;
}

// Test connection to Supabase
async function testSupabaseConnection() {
    try {
        const client = getSupabaseClient();
        
        // Test basic connection by fetching from a table
        const { data, error } = await client
            .from('resumes')
            .select('count(*)')
            .limit(1);
        
        if (error) {
            console.error('❌ Supabase connection test failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection test passed');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection test error:', error);
        return false;
    }
}

// Get or create anonymous user ID
// For Chrome extensions, we'll use a persistent UUID stored in Chrome storage
async function getUserId() {
    try {
        // Try to get existing user ID from Chrome storage
        const result = await chrome.storage.local.get(['autoapply_user_id']);
        
        if (result.autoapply_user_id) {
            return result.autoapply_user_id;
        }
        
        // Generate new UUID for this user
        const newUserId = crypto.randomUUID();
        
        // Store it in Chrome storage
        await chrome.storage.local.set({ autoapply_user_id: newUserId });
        
        console.log('✅ Generated new user ID:', newUserId);
        return newUserId;
    } catch (error) {
        console.error('❌ Failed to get/create user ID:', error);
        // Fallback to a random UUID that won't persist
        return crypto.randomUUID();
    }
}

// Export functions for use in other files
// For Chrome extensions, we need to attach to window object
window.SupabaseConfig = {
    initializeSupabase,
    getSupabaseClient,
    testSupabaseConnection,
    getUserId,
    
    // Configuration status
    isConfigured: () => {
        return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
               SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
               SUPABASE_URL && SUPABASE_ANON_KEY;
    },
    
    // Get configuration status for UI display
    getConfigStatus: () => {
        if (!window.SupabaseConfig.isConfigured()) {
            return {
                status: 'not_configured',
                message: 'Supabase credentials not configured'
            };
        }
        
        try {
            getSupabaseClient();
            return {
                status: 'configured',
                message: 'Supabase client ready'
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }
};

// Auto-initialize when this file is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.SupabaseConfig.isConfigured()) {
        try {
            initializeSupabase();
        } catch (error) {
            console.warn('Supabase initialization failed:', error.message);
        }
    } else {
        console.warn('⚠️  Supabase not configured. Please update config/supabase.js with your credentials.');
    }
}); 