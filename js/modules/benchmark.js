/**
 * Artificial Analysis Benchmark Integration
 * 
 * This module integrates with the Artificial Analysis API to fetch
 * real benchmark data (intelligence scores, speed metrics) for AI models.
 * 
 * NOTE: API key required. Get one free at: https://artificialanalysis.ai
 * Add to config: ARTIFICIAL_ANALYSIS_API_KEY
 */

// Cache for benchmark data to avoid repeated API calls
let benchmarkCache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

// API Configuration - User can set this
let API_KEY = null;
const CORS_PROXY = 'https://corsproxy.io/?'; 

/**
 * Check if we're running on localhost (needs CORS proxy)
 */
function isLocalhost() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

/**
 * Set the Artificial Analysis API key
 * @param {string} key - API key from Artificial Analysis
 */
export function setApiKey(key) {
    API_KEY = key;
}

/**
 * Fetch benchmark data from Artificial Analysis
 * @returns {Promise<Object|null>} - Map of model slugs to benchmark data
 */
export async function fetchBenchmarkData() {
    // Return cached data if valid
    if (benchmarkCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION_MS)) {
        console.log('[Benchmark] Using cached data');
        return benchmarkCache;
    }

    if (!API_KEY) {
        console.log('[Benchmark] No API key set. Skipping Artificial Analysis integration.');
        console.log('[Benchmark] Get a free API key at: https://artificialanalysis.ai');
        return null;
    }

    try {
        console.log('[Benchmark] Fetching data from Artificial Analysis...');
        
        let url = 'https://artificialanalysis.ai/api/v2/data/llms/models';
        if (isLocalhost()) {
            console.log('[Benchmark] Running on localhost - using CORS proxy');
            url = CORS_PROXY + encodeURIComponent(url);
        }

        const response = await fetch(url, {
            headers: {
                'x-api-key': API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('[Benchmark] API error:', response.status, response.statusText);
            return null;
        }

        const json = await response.json();
        console.log('[Benchmark] Response structure:', Object.keys(json));
        
        let data = [];
        if (Array.isArray(json)) {
            data = json;
        } else if (Array.isArray(json.models)) {
            data = json.models;
        } else if (Array.isArray(json.data)) {
            data = json.data;
        } else if (Array.isArray(json.items)) {
            data = json.items;
        }
        
        // Transform data into a map keyed by various identifiers for easy matching
        const benchmarkMap = {};

        if (Array.isArray(data)) {
            data.forEach(model => {
                // Check if metrics are nested in 'evaluations'
                const evals = model.evaluations || {};
                
                const entry = {
                    intelligenceIndex: model.intelligence_index || evals.intelligence_index || evals.artificial_analysis_intelligence_index || evals.quality_index || null,
                    speedTps: model.median_output_tokens_per_second || evals.median_output_tokens_per_second || null,
                    latencyMs: model.median_latency_ms || evals.median_latency_ms || null,
                    gpqa: model.gpqa || evals.gpqa || null,
                    mmluPro: model.mmlu_pro || evals.mmlu_pro || null,
                    humaneval: model.humaneval || evals.humaneval || null,
                    contextWindow: model.context_window_tokens || null,
                    slug: model.slug || null,
                    name: model.name || null,
                    creator: model.model_creators?.name || model.creator?.name || null
                };
                
                // Store by multiple keys for flexible matching
                if (model.slug) benchmarkMap[model.slug.toLowerCase()] = entry;
                if (model.name) benchmarkMap[model.name.toLowerCase()] = entry;
            });
        }

        benchmarkCache = benchmarkMap;
        cacheTimestamp = Date.now();
        
        console.log(`[Benchmark] Loaded ${Object.keys(benchmarkMap).length} models`);
        return benchmarkMap;

    } catch (error) {
        console.error('[Benchmark] Failed to fetch data:', error);
        return null;
    }
}

/**
 * Find benchmark data for a specific model
 * @param {string} modelName - Model name to search for
 * @param {string} provider - Provider name
 * @returns {Object|null} - Benchmark data or null
 */
export function findBenchmarkForModel(modelName, provider) {
    if (!benchmarkCache) return null;
    
    const nameLower = (modelName || '').toLowerCase().trim();
    const providerLower = (provider || '').toLowerCase().trim();
    
    // Try exact match first
    if (benchmarkCache[nameLower]) {
        return benchmarkCache[nameLower];
    }
    
    // Try common variations
    const variations = [
        nameLower,
        nameLower.replace(/\s+/g, '-'), // "gemini 1.5" -> "gemini-1.5"
        nameLower.replace(/-/g, ' '),   // "gemini-1.5" -> "gemini 1.5"
        nameLower.replace(/\./g, '-'),  // "gemini 1.5" -> "gemini 1-5" (common in slugs)
        nameLower.replace(/\s+/g, '-').replace(/\./g, '-'), // "gemini 1.5" -> "gemini-1-5"
        `${providerLower}-${nameLower}`,
        `${providerLower}/${nameLower}`,
        // Specific fix for "flash-lite": ensure "flash lite" matches "flash-lite"
        nameLower.replace('flash lite', 'flash-lite'),
        // Specific fix for version dots: "1.5" -> "1-5" global
        nameLower.replace(/(\d+)\.(\d+)/g, '$1-$2'),
        // Handle "experimental" vs "exp"
        nameLower.replace('experimental', 'exp'),
        nameLower.replace('experimental', 'exp').replace(/\s+/g, '-'),
        // Remove "(free)" or "(online)" suffixes common in OpenRouter
        nameLower.replace(/\s*\((free|online|beta|preview)\)/g, '').trim(),
        nameLower.replace(/\s*\((free|online|beta|preview)\)/g, '').replace(/\s+/g, '-').trim(),
        // Extra robustness: try stripping version dots directly
        nameLower.replace(/\./g, '') 
    ];
    
    for (const variant of variations) {
        if (benchmarkCache[variant]) {
            // console.log(`[Benchmark] Matched ${modelName} as ${variant}`);
            return benchmarkCache[variant];
        }
    }
    
    // Fuzzy match - find entries that contain the model name
    const normalizeSimple = (s) => s.replace(/[^a-z0-9]/g, '');
    const searchSimple = normalizeSimple(nameLower);
    const searchSimpleProvider = normalizeSimple(providerLower + nameLower);

    for (const [key, entry] of Object.entries(benchmarkCache)) {
        const keySimple = normalizeSimple(key);
        
        // precise robust match
        if (keySimple === searchSimple) return entry;
        
        // provider prefixed match
        if (keySimple === searchSimpleProvider) return entry;
        
        // lenient containment (if length is sufficient to avoid false positives)
        if (searchSimple.length > 5 && keySimple.includes(searchSimple)) return entry;
        if (keySimple.length > 5 && searchSimple.includes(keySimple)) return entry;
    }
    
    return null;
}

/**
 * Get formatted intelligence score display
 * @param {Object} benchmark - Benchmark data object
 * @returns {string} - Formatted score like "85" or "N/A"
 */
export function getIntelligenceDisplay(benchmark) {
    if (!benchmark || benchmark.intelligenceIndex === null) {
        return 'N/A';
    }
    return Math.round(benchmark.intelligenceIndex).toString();
}

/**
 * Get formatted speed display
 * @param {Object} benchmark - Benchmark data object
 * @returns {string} - Formatted speed like "45.2" or "N/A"
 */
export function getSpeedDisplay(benchmark) {
    if (!benchmark || benchmark.speedTps === null) {
        return 'N/A';
    }
    return benchmark.speedTps.toFixed(1);
}
