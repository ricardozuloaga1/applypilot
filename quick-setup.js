// Quick Setup Script for AutoApply AI
// Run this in the browser console to set your API key

console.log('🚀 AutoApply AI - Quick Setup');
console.log('===============================');

// Set the API key
(async function() {
    const apiKey = "YOUR_OPENAI_API_KEY_HERE";
    
    console.log('📝 Setting API key...');
    await chrome.storage.sync.set({ openaiApiKey: apiKey });
    
    console.log('✅ API key set successfully!');
    console.log('🔍 Verifying storage...');
    
    const result = await chrome.storage.sync.get(['openaiApiKey']);
    console.log('API key stored:', result.openaiApiKey ? 'Yes ✅' : 'No ❌');
    
    console.log('');
    console.log('🎉 Setup Complete!');
    console.log('• API key is now configured');
    console.log('• Go to Settings tab to test connection');
    console.log('• Upload a resume to start job matching');
    console.log('• Visit job sites to capture positions');
    
    // Test the connection
    console.log('');
    console.log('🧪 Testing API connection...');
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ API connection successful!');
        } else {
            console.log('❌ API connection failed');
        }
    } catch (error) {
        console.log('❌ API connection error:', error.message);
    }
})(); 