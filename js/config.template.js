/**
 * Application Configuration Template
 * 
 * Copy this file to config.js and add your API keys.
 * 
 * IMPORTANT: Do not commit config.js with real API keys to version control!
 */

export const CONFIG = {
    /**
     * Artificial Analysis API Key
     * 
     * Get your free API key at: https://artificialanalysis.ai
     * 1. Create an account on the Artificial Analysis Insights Platform
     * 2. Generate an API key from your dashboard
     * 3. Paste it below
     * 
     * This enables real benchmark data (intelligence scores, speed metrics)
     * for AI models. Without an API key, these fields will show "N/A".
     * 
     * Free tier: 1,000 requests per day
     */
    ARTIFICIAL_ANALYSIS_API_KEY: null,  // Leave null to use "Bring Your Own Key" (localStorage) in production
    
    /**
     * Cache duration for benchmark data (in milliseconds)
     * Default: 1 hour (3600000ms)
     */
    BENCHMARK_CACHE_DURATION_MS: 3600000,
};
