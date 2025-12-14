export const imageCache = {};

export function getStoredTheme() {
  return localStorage.getItem("theme") || "light";
}

export function setTheme(theme, onThemeChange) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);
  updateThemeIcon(theme);
  if (onThemeChange) onThemeChange();
}

export function updateThemeIcon(theme) {
  const themeIcon = document.getElementById("themeIcon");
  if (!themeIcon) return;
  
  if (theme === "dark") {
    themeIcon.classList.remove("bi-moon-stars-fill");
    themeIcon.classList.add("bi-sun-fill");
  } else {
    themeIcon.classList.remove("bi-sun-fill");
    themeIcon.classList.add("bi-moon-stars-fill");
  }
}

export function toggleTheme(onThemeChange) {
  const currentTheme = getStoredTheme();
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme, onThemeChange);
}

export function getChartColors() {
  const theme = getStoredTheme();
  const isDark = theme === "dark";
  return {
    textColor: isDark ? "#e0e0e0" : "#666",
    gridColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    tooltipBg: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.8)",
    tooltipText: isDark ? "#000" : "#fff"
  };
}

export function getPriceCategory(model) {
  const price = model.inputPrice;
  if (price === null || price === undefined) {
    return { name: "N/A", className: "na" };
  }
  if (price < 1.0) {
    return { name: "Low", className: "low" };
  }
  if (price >= 1.0 && price < 5.0) {
    return { name: "Medium", className: "medium" };
  }
  if (price >= 5.0) {
    return { name: "High", className: "high" };
  }
  return { name: "N/A", className: "na" };
}

export function parseFormattedNumber(numStr) {
  if (typeof numStr !== "string" || numStr.trim() === "" || numStr.includes("—"))
    return null;
  const sanitizedStr = numStr.replace(/,/g, "");
  const lowerCaseStr = sanitizedStr.toLowerCase().trim();
  const num = parseFloat(lowerCaseStr);
  if (isNaN(num)) return null;

  if (lowerCaseStr.endsWith("m")) {
    return num * 1000000;
  }
  if (lowerCaseStr.endsWith("k")) {
    return num * 1000;
  }
  return parseInt(sanitizedStr, 10);
}

export function formatNumber(val) {
  if (val === null || val === undefined) return "N/A";
  const numStr = String(val); // Ensure it's a string
  if (numStr.trim() === "" || numStr.includes("—")) return "N/A";
  const sanitizedStr = numStr.replace(/,/g, "");
  const num = parseInt(sanitizedStr, 10);
  if (isNaN(num)) return "N/A";
  if (num >= 1000000)
    return (num / 1000000).toFixed(num % 1000000 !== 0 ? 1 : 0) + "M";
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 !== 0 ? 1 : 0) + "k";
  return num.toString();
}

export function parseValueForSort(value, type) {
  if (value === "N/A" || value === null || value === undefined) {
    return type === "date" ? new Date(0) : -Infinity;
  }
  if (type === "number") {
    const num = parseFormattedNumber(String(value));
    return num !== null ? num : -Infinity;
  }
  if (type === "date") {
    const parts = String(value).split("/");
    if (parts.length === 3) {
      const valYear = parseInt(parts[2], 10);
      // Handles 2-digit years for legacy integrity, but respects 4-digit years (like from API)
      const fullYear = valYear < 100 ? (valYear < 50 ? 2000 + valYear : 1900 + valYear) : valYear;
      const date = new Date(
        fullYear,
        parseInt(parts[0], 10) - 1,
        parseInt(parts[1], 10)
      );
      if (isNaN(date.getTime())) return new Date(0);
      return date;
    }
    return new Date(0);
  }
  return String(value).toLowerCase();
}

export function getLogoFilename(vendorName) {
  if (!vendorName) return "other.png";
  return (
    vendorName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/\(.*\)/g, "")
      .replace(/[^a-z0-9]/gi, "") + ".png"
  );
}

// --- Image Preloading Functions ---
export async function preloadLogosForChart(models) {
  const promises = models.map((model) => {
    // Determine the source to load: 
    // User requested prioritizing local logos if remote fails, or general stability.
    // We'll try logoUrl first, but effectively fallback if errors occur.
    const srcUrl = model.logoUrl;
    const srcLocal = model.logo ? `img/logos/${model.logo}` : null;
    
    // We'll load what we can. If we have a srcUrl, try it. 
    // If it fails, the onerror will handle it (we can try to load the local one there, but it gets complex).
    // Simpler: Just try to load the prioritized one. 
    // BUT user said: "You can use the logos from img/logos if you aren't able to use the google favicon."
    
    const primarySrc = srcUrl;

    if (primarySrc && !imageCache[primarySrc]) {
      return new Promise((resolve) => {
        const img = new Image();
        // img.crossOrigin = "Anonymous"; // REMOVED to avoid CORS blocks on favicons. 
        // Note: usage on canvas will be tainted, preventing data export, but display works.
        img.src = primarySrc;
        
        imageCache[primarySrc] = img; 
        
        img.onload = () => resolve();
        img.onerror = () => {
             // If remote fails, try local
             if (srcLocal) {
                 img.src = srcLocal;
                 // Update cache key mapping? No, simplified: just mark this failed and try to preload local separately?
                 // Better: Swap the src and try again.
                 // But for now, let's just mark it failed and trust the renderer to fallback? 
                 // The renderer calls getPreloadedImage(model), which checks both.
                 // So we just need to make sure the LOCAL image is ALSO preloaded if remote fails.
                 
                 // Trigger a load for local image
                 const localImg = new Image();
                 localImg.src = srcLocal;
                 imageCache[srcLocal] = localImg;
                 localImg.onload = () => resolve();
                 localImg.onerror = () => {
                     imageCache[srcLocal] = null;
                     resolve();
                 };
             } else {
                 imageCache[primarySrc] = null;
                 resolve();
             }
        };
      });
    } else if (srcLocal && !imageCache[srcLocal]) {
        // If no remote URL, or if we want to ensure local is loaded too
         return new Promise((resolve) => {
            const img = new Image();
            img.src = srcLocal;
            imageCache[srcLocal] = img;
            img.onload = () => resolve();
            img.onerror = () => {
                imageCache[srcLocal] = null;
                resolve();
            }
         });
    }
    return Promise.resolve();
  });
  await Promise.all(promises);
}

export function getPreloadedImage(model) {
  if (!model) return null;
  // Try retrieving by logoUrl first, then by constructed local path
  const srcUrl = model.logoUrl;
  const srcLocal = model.logo ? `img/logos/${model.logo}` : null;
  
  let img = null;
  if (srcUrl && imageCache[srcUrl]) {
      img = imageCache[srcUrl];
  } else if (srcLocal && imageCache[srcLocal]) {
      img = imageCache[srcLocal];
  }
  
  if (
    img instanceof HTMLImageElement &&
    img.complete &&
    img.naturalHeight !== 0
  ) {
    return img;
  }
  return null;
}

// --- License Logic ---
export const proprietaryProviders = new Set([
  "OpenAI", "Anthropic", "Google", "Cohere", "AI21 Labs", 
  "Amazon Bedrock", "Perplexity AI", "xAI", "Microsoft", 
  "Inflection", "Reka", "EssentialAI", "MiniMax", "Moonshot AI",
  "Baidu", "ByteDance", "Tencent", "Huawei", "Liquid AI"
]);

export function getLicense(m, lb) {
  const lowerName = m.name.toLowerCase();

  // 1. Check Leaderboard (official source)
  if (lb && lb.license && lb.license !== "N/A") {
      return lb.license;
  }

  // 2. Explicit OSS overrides (e.g. gpt-oss)
  if (lowerName.includes("oss")) return "MIT";

  // 3. Model Family Specific Rules (overrides provider defaults)
  // Google
  if (lowerName.includes("gemma")) return "Gemma Terms";
  // Microsoft
  if (lowerName.includes("phi")) return "MIT";
  // Meta
  if (lowerName.includes("llama")) return "Llama Community";
  // Mistral
  if (lowerName.includes("codestral")) return "MNPL";
  if (lowerName.includes("pixtral")) return "Apache 2.0";
  if (lowerName.includes("mistral")) return "Apache 2.0";
  // Alibaba / Qwen
  if (lowerName.includes("qwen")) return "Apache 2.0";
  // 01.AI / Yi
  if (lowerName.includes("yi-")) return "Apache 2.0";
  // DeepSeek
  if (lowerName.includes("deepseek")) return "MIT"; 
  // Databricks
  if (lowerName.includes("dbrx")) return "Open License";
  // AllenAI
  if (lowerName.includes("olmo")) return "Apache 2.0";
  // IBM
  if (lowerName.includes("granite")) return "Apache 2.0";
  // Nvidia
  if (lowerName.includes("nemotron")) return "NVIDIA Open";
  // Falcon
  if (lowerName.includes("falcon")) return "Apache 2.0";

  // 4. Check Provider Fallback (Proprietary)
  if (m.provider && proprietaryProviders.has(m.provider)) {
      return "Proprietary";
  }
  
  // 5. Default for known/likely Open Source Community Providers
  if (m.provider && !proprietaryProviders.has(m.provider)) {
      return "Apache 2.0"; 
  }
  
  return "N/A";
}
