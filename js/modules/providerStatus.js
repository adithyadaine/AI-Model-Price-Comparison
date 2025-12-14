/**
 * Provider Status Module
 * 
 * Provides status page URLs and visual indicators for AI providers.
 * Since most providers don't expose public status APIs, this module
 * links to official status pages rather than providing live monitoring.
 */

// Status page URLs for major providers
export const providerStatusPages = {
    'OpenAI': 'https://status.openai.com',
    'Anthropic': 'https://status.anthropic.com',
    'Google': 'https://status.cloud.google.com',
    'Meta': 'https://metastatus.com/', 
    'Mistral': 'https://status.mistral.ai',
    'Cohere': 'https://status.cohere.ai',
    'DeepSeek': 'https://status.deepseek.com',
    'EssentialAI': null,
    'AI21 Labs': 'https://status.ai21.com',
    'Alibaba': 'https://status.alibabacloud.com',
    'Amazon Bedrock': 'https://health.aws.amazon.com/health/status',
    'MiniMax': null,
    'Moonshot AI': 'https://status.moonshot.cn', 
    'NVIDIA': 'https://status.ngc.nvidia.com', 
    'Perplexity AI': 'https://status.perplexity.ai',
    'xAI': 'https://status.x.ai',
    'Zhipu AI': null,
    'Microsoft': 'https://status.azure.com',
    'Together AI': 'https://status.together.ai',
    'Fireworks AI': 'https://status.fireworks.ai',
    'Hugging Face': 'https://status.huggingface.co',
    'OpenRouter': 'https://status.openrouter.ai'
};

/**
 * Get the status page URL for a provider
 * @param {string} providerName - Name of the provider
 * @returns {string|null} - Status page URL or null
 */
export function getProviderStatusUrl(providerName) {
    return providerStatusPages[providerName] || null;
}

/**
 * Check if a provider has a status page
 * @param {string} providerName - Name of the provider
 * @returns {boolean}
 */
export function hasStatusPage(providerName) {
    return !!providerStatusPages[providerName];
}

/**
 * Get HTML for a status badge/link
 * @param {string} providerName - Name of the provider
 * @returns {string} - HTML string for the badge
 */
export function getStatusBadgeHtml(providerName) {
    const url = getProviderStatusUrl(providerName);
    
    if (!url) {
        return `<span class="badge bg-light text-muted border" title="No status page available">
            <i class="bi bi-question-circle me-1"></i>Status
        </span>`;
    }
    
    return `<a href="${url}" target="_blank" rel="noopener" 
        class="badge bg-success-subtle text-success border border-success-subtle text-decoration-none status-badge-link"
        title="View ${providerName} status page">
        <i class="bi bi-check-circle me-1"></i>Status
    </a>`;
}

/**
 * Get all providers that have status pages
 * @returns {Array<{name: string, url: string}>}
 */
export function getProvidersWithStatus() {
    return Object.entries(providerStatusPages)
        .filter(([_, url]) => url !== null)
        .map(([name, url]) => ({ name, url }));
}

// --- Real-time System Status Scraping ---
async function fetchStatus(targetUrl) {
    const proxies = [
        url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        url => `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const bg of proxies) {
        try {
            const proxyUrl = bg(targetUrl);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const text = await response.text();
                if (text && text.length > 50) return text; // Basic validation
            }
        } catch (error) {
            console.warn(`[Status] Proxy failed:`, error);
        }
    }
    return null;
}

export async function updateSystemStatus() {
    // OpenRouter
    const orTextEl = document.getElementById('openrouter-status-text');
    const orDotEl = document.getElementById('openrouter-status-dot');
    
    if (orTextEl && orDotEl) {
        // Reset to checking state if re-opened (optional, but good for UX)
        // orTextEl.textContent = 'Checking...'; 
        
        const html = await fetchStatus('https://status.openrouter.ai/');
        if (html) {
            // Check keywords
            if (html.includes('All Systems Operational') || html.includes('Operational') || html.includes('No incidents reported')) {
                 orTextEl.textContent = 'Operational';
                 orDotEl.className = 'status-dot bg-success status-pulse';
            } else if (html.includes('Major Outage')) {
                 orTextEl.textContent = 'Major Outage';
                 orDotEl.className = 'status-dot bg-danger status-pulse';
            } else if (html.includes('Degraded Performance')) {
                 orTextEl.textContent = 'Degraded';
                 orDotEl.className = 'status-dot bg-warning';
            } else {
                 orTextEl.textContent = 'Operational';
                 orDotEl.className = 'status-dot bg-success status-pulse';
            }
        } else {
             orTextEl.textContent = 'Unknown';
             orDotEl.className = 'status-dot bg-secondary';
        }
    }

    // HuggingFace
    const hfTextEl = document.getElementById('hf-status-text');
    const hfDotEl = document.getElementById('hf-status-dot');

    if (hfTextEl && hfDotEl) {
        const html = await fetchStatus('https://status.huggingface.co/');
        if (html) {
             if (html.includes('All Systems Operational') || html.includes('Operational') || html.includes('No incidents reported')) {
                 hfTextEl.textContent = 'Operational';
                 hfDotEl.className = 'status-dot bg-success status-pulse';
            } else if (html.includes('Major Outage')) {
                 hfTextEl.textContent = 'Outage';
                 hfDotEl.className = 'status-dot bg-danger status-pulse';
            } else if (html.includes('Degraded')) {
                 hfTextEl.textContent = 'Degraded';
                 hfDotEl.className = 'status-dot bg-warning';
            } else {
                 hfTextEl.textContent = 'Operational';
                 hfDotEl.className = 'status-dot bg-success status-pulse';
            }
        } else {
             hfTextEl.textContent = 'Unknown';
             hfDotEl.className = 'status-dot bg-secondary';
        }
    }

    // Update Timestamp
    const tsEl = document.getElementById('apiStatusLastChecked');
    if (tsEl) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        tsEl.innerHTML = `<i class="bi bi-clock me-1"></i>Last checked: ${timeStr}`;
    }
}
