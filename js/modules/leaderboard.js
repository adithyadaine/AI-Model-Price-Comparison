/**
 * HuggingFace Open LLM Leaderboard Integration
 * 
 * This module fetches benchmark data from the HuggingFace Open LLM Leaderboard
 * dataset and provides functions to match and display scores for AI models.
 * 
 * Data source: https://huggingface.co/datasets/open-llm-leaderboard/contents
 * API: HuggingFace Datasets Server (free, no key required)
 * 
 * NOTE: Uses a CORS proxy on localhost for testing. Bypasses proxy in production.
 */

// Cache for leaderboard data
let leaderboardCache = null;
let cacheTimestamp = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

// API Configuration
const HF_API_BASE = 'https://datasets-server.huggingface.co/rows';
const CORS_PROXY = 'https://corsproxy.io/?';
const DATASET = 'open-llm-leaderboard/contents';
const BATCH_SIZE = 100;
const MAX_ROWS = 500; // Limit to avoid excessive API calls

/**
 * Check if we're running on localhost (needs CORS proxy)
 */
function isLocalhost() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

/**
 * Get the API base URL (with or without CORS proxy)
 */
function getApiUrl() {
    if (isLocalhost()) {
        console.log('[Leaderboard] Running on localhost - using CORS proxy');
        return CORS_PROXY + encodeURIComponent(HF_API_BASE);
    }
    return HF_API_BASE;
}

/**
 * Fetch leaderboard data from HuggingFace datasets server
 * @returns {Promise<Object|null>} - Map of model names to benchmark data
 */
export async function fetchLeaderboardData() {
    // Return cached data if valid
    if (leaderboardCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION_MS)) {
        console.log('[Leaderboard] Using cached data');
        return leaderboardCache;
    }

    try {
        console.log('[Leaderboard] Fetching data from HuggingFace...');
        
        const apiBase = getApiUrl();
        const allRows = [];
        let offset = 0;
        
        // Fetch data in batches
        while (offset < MAX_ROWS) {
            const params = `?dataset=${DATASET}&config=default&split=train&offset=${offset}&length=${BATCH_SIZE}`;
            const url = isLocalhost() 
                ? `${CORS_PROXY}${encodeURIComponent(HF_API_BASE + params)}`
                : `${HF_API_BASE}${params}`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                console.error('[Leaderboard] API error:', response.status, response.statusText);
                break;
            }

            const data = await response.json();
            
            if (!data.rows || data.rows.length === 0) {
                break;
            }
            
            allRows.push(...data.rows);
            offset += BATCH_SIZE;
            
            // If we got less than batch size, we've reached the end
            if (data.rows.length < BATCH_SIZE) {
                break;
            }
        }

        // Transform data into a map keyed by model name variations
        const leaderboardMap = {};
        
        allRows.forEach(item => {
            const row = item.row;
            if (!row) return;
            
            // Extract model identifier (usually in format "org/model-name")
            const fullName = row.fullname || row.Model || '';
            const modelName = fullName.split('/').pop() || fullName;
            
            // Open LLM Leaderboard v2 field names
            const entry = {
                fullName: fullName,
                modelName: modelName,
                // Primary scores (Leaderboard v2)
                average: row['Average ⬆️'] || null,
                ifeval: row['IFEval'] || null,
                bbh: row['BBH'] || null,
                mathLvl5: row['MATH Lvl 5'] || null,
                gpqa: row['GPQA'] || null,
                musr: row['MUSR'] || null,
                mmluPro: row['MMLU-PRO'] || null,
                // Additional fields
                license: row['Hub License'] || null,
                precision: row['Precision'] || null,
                type: row['Type'] || null,
                architecture: row['Architecture'] || null,
                params: row['#Params (B)'] || null
            };
            
            // Store by multiple keys for flexible matching
            const nameLower = modelName.toLowerCase();
            const fullNameLower = fullName.toLowerCase();
            
            // Normalize function for consistent key creation
            const normalize = (s) => s.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[_.]/g, '-')
                .replace(/--+/g, '-')
                .trim();
            
            const normalizedName = normalize(modelName);
            const normalizedFull = normalize(fullName);
            
            // Store original forms
            leaderboardMap[nameLower] = entry;
            leaderboardMap[fullNameLower] = entry;
            
            // Store normalized forms  
            leaderboardMap[normalizedName] = entry;
            leaderboardMap[normalizedFull] = entry;
            
            // Store with spaces replaced by nothing (e.g., "llama3" instead of "llama-3")
            leaderboardMap[nameLower.replace(/[-\s]/g, '')] = entry;
            
            // Also store without common suffixes for better matching
            const cleanName = normalizedName
                .replace(/-instruct$/i, '')
                .replace(/-chat$/i, '')
                .replace(/-hf$/i, '')
                .replace(/-v\d+(\.\d+)?$/i, '');
            if (cleanName !== normalizedName) {
                leaderboardMap[cleanName] = entry;
            }
        });

        leaderboardCache = leaderboardMap;
        cacheTimestamp = Date.now();
        
        // Also store on window for debugging
        window.__leaderboardCache = leaderboardMap;
        
        console.log(`[Leaderboard] Loaded ${Object.keys(leaderboardMap).length} model entries`);
        
        return leaderboardMap;

    } catch (error) {
        // Check if it's a CORS error
        if (error.message && error.message.includes('CORS')) {
            console.warn('[Leaderboard] CORS error - HuggingFace API blocked from this origin.');
            console.log('[Leaderboard] This is expected on localhost. Data will show N/A.');
        } else {
            console.error('[Leaderboard] Failed to fetch data:', error.message || error);
        }
        return null;
    }
}

/**
 * Find leaderboard data for a specific model
 * @param {string} modelName - Model name to search for
 * @param {string} provider - Provider name (optional, for better matching)
 * @returns {Object|null} - Leaderboard data or null
 */
export function findLeaderboardScore(modelName, provider = '') {
    if (!leaderboardCache) return null;
    
    const nameLower = (modelName || '').toLowerCase().trim();
    const providerLower = (provider || '').toLowerCase().trim();
    
    // Normalize function to create comparable keys
    const normalize = (s) => s.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[_.]/g, '-')
        .replace(/--+/g, '-')
        .trim();
    
    // Direct match
    if (leaderboardCache[nameLower]) {
        return leaderboardCache[nameLower];
    }
    
    // Try normalized version
    const normalizedName = normalize(nameLower);
    if (leaderboardCache[normalizedName]) {
        return leaderboardCache[normalizedName];
    }
    
    // Try with provider prefix (e.g., "meta-llama/llama-3")
    const providerMappings = {
        'meta': 'meta-llama',
        'google': 'google',
        'mistral': 'mistralai',
        'anthropic': 'anthropic',
        'cohere': 'cohere',
        'microsoft': 'microsoft',
        'alibaba': 'alibaba'
    };
    
    const hfProvider = providerMappings[providerLower] || providerLower;
    const withProvider = `${hfProvider}/${normalizedName}`;
    if (leaderboardCache[withProvider]) {
        return leaderboardCache[withProvider];
    }
    
    // Try common variations
    const variations = [
        normalizedName,
        nameLower.replace(/\s+/g, '-'),
        nameLower.replace(/-/g, ''),
        nameLower.replace(/\./g, '-'),
        // Remove version numbers for base model matching
        normalizedName.replace(/-\d+(\.\d+)?[a-z]?$/i, ''),
        normalizedName.replace(/-\d+b$/i, ''),
        // Remove common suffixes
        normalizedName.replace(/-instruct$/i, ''),
        normalizedName.replace(/-chat$/i, ''),
        // Handle "llama 3" -> "llama-3" variations
        normalizedName.replace(/(\w+)\s*(\d)/g, '$1-$2'),
        // NEW: Robust matching ported from benchmark.js
        // Specific fix for version dots: "1.5" -> "1-5" global
        normalizedName.replace(/(\d+)\.(\d+)/g, '$1-$2'),
        // Handle "experimental" vs "exp"
        normalizedName.replace('experimental', 'exp'),
        // Remove "(free)" or "(online)" suffixes common in OpenRouter
        nameLower.replace(/\s*\((free|online|beta|preview)\)/g, '').replace(/\s+/g, '-').trim(),
        // Handle "flash lite" -> "flash-lite"
        nameLower.replace('flash lite', 'flash-lite')
    ];
    
    for (const variant of variations) {
        if (leaderboardCache[variant]) {
            return leaderboardCache[variant];
        }
    }
    
    // Fuzzy match - find entries that contain key parts of the model name
    // Extract core model identifiers (e.g., "llama", "3", "70b", "instruct")
    const parts = normalizedName.split('-').filter(p => p.length > 1);
    
    for (const [key, entry] of Object.entries(leaderboardCache)) {
        // Check if key contains most of our significant parts
        const matchCount = parts.filter(p => key.includes(p)).length;
        if (matchCount >= Math.min(3, parts.length) && parts.length > 2) {
            return entry;
        }
    }
    
    return null;
}

/**
 * Calculate average benchmark score
 * @param {Object} entry - Leaderboard entry
 * @returns {number|null} - Average score or null
 */
export function calculateAverageScore(entry) {
    if (!entry) return null;
    
    // If average is already provided
    if (entry.average !== null && !isNaN(parseFloat(entry.average))) {
        return parseFloat(entry.average);
    }
    
    // Calculate from individual scores (v2 benchmarks)
    const scores = [
        entry.ifeval,
        entry.bbh,
        entry.mathLvl5,
        entry.gpqa,
        entry.musr,
        entry.mmluPro
    ].filter(s => s !== null && !isNaN(parseFloat(s)));
    
    if (scores.length === 0) return null;
    
    const sum = scores.reduce((a, b) => a + parseFloat(b), 0);
    return sum / scores.length;
}

/**
 * Get formatted display for a benchmark score
 * @param {Object} entry - Leaderboard entry
 * @param {string} benchmark - Benchmark name
 * @returns {string} - Formatted score or "N/A"
 */
export function getBenchmarkDisplay(entry, benchmark) {
    if (!entry || entry[benchmark] === null || entry[benchmark] === undefined) {
        return 'N/A';
    }
    
    const score = parseFloat(entry[benchmark]);
    if (isNaN(score)) return 'N/A';
    
    return score.toFixed(1);
}

/**
 * Get a summary object with key benchmark scores (v2 leaderboard)
 * @param {Object} entry - Leaderboard entry
 * @returns {Object} - Summary with formatted scores
 */
export function getLeaderboardSummary(entry) {
    if (!entry) {
        return {
            available: false,
            average: 'N/A',
            mmluPro: 'N/A',
            ifeval: 'N/A',
            bbh: 'N/A'
        };
    }
    
    const avg = calculateAverageScore(entry);
    
    return {
        available: true,
        average: avg !== null ? avg.toFixed(1) : 'N/A',
        mmluPro: getBenchmarkDisplay(entry, 'mmluPro'),
        ifeval: getBenchmarkDisplay(entry, 'ifeval'),
        bbh: getBenchmarkDisplay(entry, 'bbh'),
        gpqa: getBenchmarkDisplay(entry, 'gpqa'),
        mathLvl5: getBenchmarkDisplay(entry, 'mathLvl5')
    };
}
