import { fetchOpenRouterModels, ALLOWED_PROVIDERS } from './modules/api.js';
import { 
  getStoredTheme, 
  setTheme, 
  toggleTheme, 
  parseValueForSort, 
  getLogoFilename,
  getPriceCategory
} from './modules/utils.js';
import { 
  renderBarChart, 
  renderScatterChart, 
  renderTimelineChart 
} from './modules/charts.js';
import { 
  renderProviders, 
  openProviderDetail, 
  updateTableView, 
  populateModelSelection, 
  filterModelsList,
  openPanel,
  closePanel,
  updateHomeStats,
  showRecentUpdatesModal,
  renderSearchSuggestions
} from './modules/ui.js';
import { state, setModels, setSelection } from './modules/state.js';
import { setApiKey, fetchBenchmarkData } from './modules/benchmark.js';
import { fetchLeaderboardData } from './modules/leaderboard.js';
import { updateSystemStatus } from './modules/providerStatus.js';
// import { CONFIG } from './config.js'; // REMOVED to support missing config file

// Initialize Artificial Analysis API key dynamically
// This allows the app to work even if config.js is not deployed (e.g. GitHub Pages)
try {
  let key = null;
  
  // 1. Try config.js (Local Dev)
  try {
      const module = await import('./config.js');
      if (module.CONFIG && module.CONFIG.ARTIFICIAL_ANALYSIS_API_KEY) {
          key = module.CONFIG.ARTIFICIAL_ANALYSIS_API_KEY;
          console.log('[Config] Artificial Analysis API key configured from config.js');
      }
  } catch (e) {
      // config.js likely doesn't exist in production
  }

  // 2. Try localStorage (Production/BYOK)
  if (!key) {
      const storedKey = localStorage.getItem('artificial_analysis_api_key');
      if (storedKey) {
          key = storedKey;
          console.log('[Config] Artificial Analysis API key configured from localStorage');
      }
  }

  // 3. Set the key if found
  if (key) {
      setApiKey(key);
  } else {
      console.log('[Config] No API key found. Benchmark data will show N/A.');
  }

} catch (e) {
  console.log('[Config] Error initializing API key:', e);
}

// --- Shared Elements ---
const comparisonTableBody = document.getElementById("comparison-table-body");
const tableView = document.getElementById("table-view");
const barChartView = document.getElementById("bar-chart-view");
const refreshDataBtn = document.getElementById("refreshDataBtn");
const modelSearchInput = document.getElementById("modelSearchInput");
const mainSearchInput = document.getElementById("mainSearchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const lastUpdatedTrigger = document.getElementById("lastUpdatedTrigger");

// Additional Interactive Elements
const homeExploreBtn = document.getElementById("homeExploreBtn");
const refreshPageBtn = document.getElementById("refreshPageBtn");
const selectAllBtn = document.getElementById("selectAllBtn");
const clearPanelBtn = document.getElementById("clearPanelBtn");
const expandAllBtn = document.getElementById("expandAllBtn");
const collapseAllBtn = document.getElementById("collapseAllBtn");
const filterLowBtn = document.getElementById("filterLowBtn");
const filterMediumBtn = document.getElementById("filterMediumBtn");
const filterHighBtn = document.getElementById("filterHighBtn");
const backToProvidersBtn = document.getElementById("backToProvidersBtn");

// --- Loading Data ---
async function loadModelsData() {
  console.log("Loading model data...");
  const statusDot = document.getElementById("apiStatusDot");
  const homeStatusDot = document.getElementById("homeApiStatusDot");
  const updateDots = (className) => {
      if (statusDot) statusDot.className = className;
      if (homeStatusDot) homeStatusDot.className = className;
  };
  updateDots("status-dot bg-secondary status-pulse");
  
  updateDisplayCallback(); 
  
  // Fetch OpenRouter models, benchmark data, and leaderboard data in parallel
  const [apiModels, benchmarkData, leaderboardData] = await Promise.all([
    fetchOpenRouterModels(),
    fetchBenchmarkData(),
    fetchLeaderboardData()
  ]);
  
  if (benchmarkData) {
    console.log('[Main] Benchmark data loaded successfully');
  }
  
  if (leaderboardData) {
    console.log('[Main] HuggingFace Leaderboard data loaded successfully');
  }

  if (apiModels === null) {
      updateDots("status-dot bg-danger"); 
      if (comparisonTableBody) comparisonTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Data fetch failed. See sidebar for details.</td></tr>`;
      return [];
  }
  
  const filteredModels = apiModels.filter(model => ALLOWED_PROVIDERS.includes(model.provider));
  if (filteredModels.length === 0) {
      updateDots("status-dot bg-danger");
      return [];
  }
  
  // Sort
  const data = filteredModels.sort((a, b) => {
      if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
      return a.name.localeCompare(b.name);
  });

  setModels(data);  // CRITICAL: Store fetched data in state
  updateHomeStats(data);
  updateHeroCards(data); // Populate Hero Cards
  updateDots("status-dot bg-success status-pulse");

  // Default Selection: If empty, pick 5 diverse models
  if (state.selectedIds.size === 0) {
     const candidates = data.filter(m => m.inputPrice !== null && m.contextWindow !== "N/A" && m.logo);
     const shuffled = [...candidates].sort(() => 0.5 - Math.random());
     const picked = new Set();
     const selected = [];
     for(const m of shuffled) {
         if (selected.length >= 5) break;
         if (!picked.has(m.provider)) {
             selected.push(m.id);
             picked.add(m.provider);
         }
     }
     // If not enough unique providers, fill remaining
     if (selected.length < 5) {
         for(const m of shuffled) {
             if (selected.length >= 5) break;
             if (!selected.includes(m.id)) selected.push(m.id);
         }
     }
     setSelection(selected);
  }

  // Update UI Components
  try {
      renderProviders(); 
      populateModelSelection(updateDisplayCallback);
      updateDisplay();
  } catch (err) {
      console.error("Error rendering UI:", err);
      updateDots("status-dot bg-danger");
      if (comparisonTableBody) comparisonTableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error rendering interface: ${err.message}</td></tr>`;
  }
  
  // Find the most recent release date from the models
  const ts = document.getElementById("dynamicTimestamp");
  if(ts && data.length > 0) {
      const sortedByDate = [...data].sort((a, b) => {
          const dA = parseValueForSort(a.releaseDate, "date");
          const dB = parseValueForSort(b.releaseDate, "date");
          return dB - dA;
      });
      const latest = sortedByDate.find(m => m.releaseDate && m.releaseDate !== "N/A" && m.releaseDate !== "");
      
      if (latest) {
          ts.textContent = latest.releaseDate;
          ts.classList.remove("d-none");
          // ts.classList.add("text-light"); // Removed to support theme switching
      } else {
          ts.textContent = new Date().toLocaleDateString(); 
          ts.classList.add("text-muted");
      }
  }
  
  return data;
}

function updateHeroCards(models) {
    if (!models) return;
    
    // 1. GPT-4o
    const gpt4o = models.find(m => m.provider === "OpenAI" && m.name.includes("GPT-4o"));
    if (gpt4o && document.getElementById("hero-card-1-price")) {
        const price = gpt4o.inputPrice ? `$${gpt4o.inputPrice.toFixed(2)}` : "N/A";
        document.getElementById("hero-card-1-price").textContent = `Input: ${price} / 1M`;
    }

    // 2. Claude 3.5 Sonnet
    const claude = models.find(m => m.provider === "Anthropic" && m.name.includes("Claude") && m.name.includes("3.5") && m.name.includes("Sonnet"));
    if (claude) {
        if (document.getElementById("hero-card-2-context")) {
             document.getElementById("hero-card-2-context").textContent = `Context: ${claude.contextWindow}`;
        }
        if (document.getElementById("hero-card-2-price")) {
             const price = claude.inputPrice ? `$${claude.inputPrice.toFixed(2)}` : "N/A";
             document.getElementById("hero-card-2-price").textContent = `${price} / 1M`;
        }
    }

    // 3. Gemini 2.5 Pro
    const gemini = models.find(m => 
        m.provider && m.provider.toLowerCase().includes("google") && 
        m.name && m.name.toLowerCase().includes("gemini") && 
        m.name.includes("2.5") && 
        m.name.toLowerCase().includes("pro")
    );
    
    if (gemini) {
        if (document.getElementById("hero-card-3-context")) {
             document.getElementById("hero-card-3-context").textContent = `Context: ${gemini.contextWindow}`;
        }
         if (document.getElementById("hero-card-3-price")) {
             const price = gemini.inputPrice ? `$${gemini.inputPrice.toFixed(2)}` : "N/A";
             document.getElementById("hero-card-3-price").textContent = `${price} / 1M`;
        }
    }
}


// --- Display Updates ---
function updateDisplayCallback() {
    updateDisplay();
}

function updateDisplay() {
  if (!state.models) return;
  let selectedModels = state.models.filter(m => state.selectedIds.has(m.id));
  
  // Search Filter
  if (state.search.term && state.search.term.length > 0) {
      const term = state.search.term.toLowerCase();
      selectedModels = selectedModels.filter(m => 
          m.name.toLowerCase().includes(term) || m.provider.toLowerCase().includes(term)
      );
  }
  
  // Sort
  selectedModels.sort((a, b) => {
    let valA = parseValueForSort(a[state.sort.column], state.sort.column === "releaseDate" ? "date" : (["inputPrice", "outputPrice", "contextWindow"].includes(state.sort.column) ? "number" : "string"));
    let valB = parseValueForSort(b[state.sort.column], state.sort.column === "releaseDate" ? "date" : (["inputPrice", "outputPrice", "contextWindow"].includes(state.sort.column) ? "number" : "string"));
    if (valA < valB) return state.sort.direction === "asc" ? -1 : 1;
    if (valA > valB) return state.sort.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Update Views
  if (state.currentView === "table") {
      updateTableView(selectedModels);
      updateSortIcons();
  } else {
      if (barChartView) barChartView.style.display = "block";
      if (state.currentView === "bar") renderBarChart(selectedModels);
      else if (state.currentView === "scatter") renderScatterChart(selectedModels);
      else if (state.currentView === "timeline") renderTimelineChart(selectedModels);
  }

  const badge = document.getElementById("apiStatusBadge");
  if (badge) {
      badge.classList.toggle("d-flex", selectedModels.length > 0);
      badge.classList.toggle("d-none", selectedModels.length === 0);
  }
  
  // Also update checkboxes in sidebar (sync)
  // This is handled by `populateModelSelection` re-rendering OR manual check update.
  // We won't re-render sidebar here to avoid flicker/perf issues.
}

function updateSortIcons() {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.remove("asc", "desc");
    const icon = th.querySelector("i");
    if (icon) icon.className = "bi bi-arrow-down-up text-muted small ms-1";
    if (th.dataset.sort === state.sort.column) {
      th.classList.add(state.sort.direction);
      th.classList.add("text-primary"); 
      if (icon) icon.className = state.sort.direction === "asc" ? "bi bi-sort-up text-primary ms-1" : "bi bi-sort-down text-primary ms-1";
    }
  });
}

// --- Helpers ---
function applyPriceFilter(tierName) {
    if (!state.models) return;
    state.selectedIds.clear();
    state.models.forEach(model => {
        if (getPriceCategory(model).name === tierName) {
            state.selectedIds.add(model.id);
        }
    });
    setSelection(state.selectedIds);
    populateModelSelection(updateDisplayCallback);
    updateDisplay();
}

// --- Setup Listener ---
function setupEventListeners() {
    // Theme
    const themeToggleBtn = document.getElementById("themeToggle");
    if (themeToggleBtn) themeToggleBtn.addEventListener("click", () => toggleTheme(updateDisplay));

    // Navigation
    const navLinks = {
      home: document.getElementById("nav-home"),
      compare: document.getElementById("nav-compare"),
      providers: document.getElementById("nav-providers"),
    };

    const sections = {
        'home': document.getElementById('home-view'),
        'compare': document.getElementById('compare-view-wrap'),
        'providers': document.getElementById('providers-view')
    };
    
    // Brand Logo Click -> Home
    const brandLink = document.getElementById("sidebarBrandLink");
    if (brandLink) {
        brandLink.addEventListener("click", (e) => {
            e.preventDefault();
            updateView("home");
        });
    }

    function updateView(viewName) {
        // Deactivate all nav links
        Object.values(navLinks).forEach(link => link && link.classList.remove('active'));
        // Activate the current nav link
        if (navLinks[viewName]) navLinks[viewName].classList.add('active');
        
        // Hide all sections
        Object.values(sections).forEach(el => el && el.classList.add('d-none'));
        // Show the target section
        if (sections[viewName]) {
            sections[viewName].classList.remove('d-none');
        }
        
        const titleEl = document.getElementById("currentPageTitle");
        if (titleEl) {
             const titles = { home: 'Home', compare: 'Compare', providers: 'Providers' };
             titleEl.textContent = titles[viewName] || 'Home';
        }
        
        if (viewName === "providers") renderProviders();
    }

    Object.entries(navLinks).forEach(([key, link]) => {
      if (!link) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        updateView(key);
      });
    });
    
    // View Controls (Table, Charts)
    const viewBtns = document.querySelectorAll('#viewControls .btn-group .btn');
    viewBtns.forEach(btn => {
        btn.addEventListener("click", () => {
             viewBtns.forEach(b => b.classList.remove("active"));
             btn.classList.add("active");
             document.querySelectorAll('.view-container').forEach(el => {
                 el.classList.add("d-none");
                 el.classList.remove("active");
             });
             
             const id = btn.id.replace("Btn", "").replace("View", "").toLowerCase();
             let targetId = "bar-chart-view";
             let viewName = id;
             
             if (id === "table") { targetId = "table-view"; viewName = "table"; }
             else if (id === "barchart") viewName = "bar";
             else if (id === "scatterchart") viewName = "scatter";
             else if (id === "timelinechart") viewName = "timeline";
             
             state.currentView = viewName;
             const container = document.getElementById(targetId);
             if (container) {
                 container.classList.remove("d-none");
                 container.classList.add("active");
             }
             updateDisplay();
        });
    });

    if (homeExploreBtn) {
        homeExploreBtn.addEventListener("click", () => setActiveSection('Compare'));
    }
    
    if (refreshPageBtn) {
        refreshPageBtn.addEventListener("click", () => window.location.reload());
    }

    if (refreshDataBtn) {
        refreshDataBtn.addEventListener("click", () => {
             const icon = refreshDataBtn.querySelector("i");
             if (icon) icon.classList.add("spin-animation");
             loadModelsData().then(() => { if (icon) icon.classList.remove("spin-animation"); });
        });
    }

    if (lastUpdatedTrigger) {
        lastUpdatedTrigger.addEventListener("click", () => {
             if (state.models && state.models.length > 0) showRecentUpdatesModal(state.models);
        });
    }
    
    if (modelSearchInput) {
        // Debounce setup could be better, but for now direct input
        modelSearchInput.addEventListener("input", (e) => {
            const term = e.target.value.trim().toLowerCase();
            filterModelsList(term); // Existing filter logic for the accordion list
            
            // Search Suggestions Logic
            if (term.length > 0 && state.models) {
                const matches = state.models.filter(m => 
                    m.name.toLowerCase().includes(term) || m.provider.toLowerCase().includes(term)
                );
                // Import renderSearchSuggestions dynamically or add to imports. 
                // Since we are inside main.js which imports from ui.js, we should update imports first.
                // Assuming renderSearchSuggestions is imported (I will update imports in next step or strictly relying on `import { ... } from './modules/ui.js'` at top)
                // Wait, I can't update imports in this same tool call easily if they are far apart.
                // I will use `renderSearchSuggestions` assuming it's imported. I need to make sure to update the import statement too.
                
                renderSearchSuggestions(matches, (model) => {
                    // On Select Logic
                    if (!state.selectedIds.has(model.id)) {
                        state.selectedIds.add(model.id);
                        populateModelSelection(updateDisplayCallback);
                        updateDisplay();
                        
                        // Open selection panel to show feedback
                        openPanel();
                    }
                    // Clear search
                    modelSearchInput.value = '';
                    filterModelsList(''); 
                    renderSearchSuggestions([], null); // Hide
                });
            } else {
                 renderSearchSuggestions([], null); // Hide
            }
        });
        
        // Hide suggestions on click outside
        document.addEventListener('click', (e) => {
            if (!modelSearchInput.contains(e.target) && !document.getElementById('searchSuggestions')?.contains(e.target)) {
                 renderSearchSuggestions([], null);
            }
        });
    }
    
    if (mainSearchInput) {
        mainSearchInput.addEventListener("input", (e) => {
            state.search.term = e.target.value.trim();
            updateDisplay();
        });
    }

    if (homeExploreBtn) {
        homeExploreBtn.addEventListener("click", () => {
             const selectionPanel = document.getElementById("selectionPanel");
             if (selectionPanel) {
                 const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(selectionPanel);
                 bsOffcanvas.show();
             }
        });
    }

    // Sidebar
    if (selectAllBtn) {
        selectAllBtn.addEventListener("click", () => {
            state.models.forEach(m => state.selectedIds.add(m.id));
            populateModelSelection(updateDisplayCallback);
            updateDisplay();
        });
    }
    if (clearPanelBtn) {
        clearPanelBtn.addEventListener("click", () => {
            state.selectedIds.clear();
            populateModelSelection(updateDisplayCallback);
            updateDisplay();
        });
    }
    if (expandAllBtn) {
        expandAllBtn.addEventListener("click", () => {
             document.querySelectorAll('#model-selection-list .accordion-collapse').forEach(el => new bootstrap.Collapse(el, { toggle: false }).show());
        });
    }
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener("click", () => {
             document.querySelectorAll('#model-selection-list .accordion-collapse').forEach(el => new bootstrap.Collapse(el, { toggle: false }).hide());
        });
    }
    
    if (filterLowBtn) filterLowBtn.addEventListener("click", () => applyPriceFilter("Low"));
    if (filterMediumBtn) filterMediumBtn.addEventListener("click", () => applyPriceFilter("Medium"));
    if (filterHighBtn) filterHighBtn.addEventListener("click", () => applyPriceFilter("High"));
    
    if (backToProvidersBtn) {
        backToProvidersBtn.addEventListener("click", () => {
            document.getElementById("providerDetailContainer")?.classList.add("d-none");
            document.getElementById("providersListContainer")?.classList.remove("d-none");
        });
    }
    
    // Sort Headers
    document.querySelectorAll("th[data-sort]").forEach((th) => {
        th.addEventListener("click", () => {
            const column = th.dataset.sort;
            if (state.sort.column === column) {
                state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
            } else {
                state.sort.column = column;
                state.sort.direction = "asc"; 
                if (column === "releaseDate" || column === "contextWindow") state.sort.direction = "desc";
            }
            updateDisplay();
        });
    });
    
    
    // Status Modal Listener
    const statusModal = document.getElementById('apiStatusModal');
    if (statusModal) {
        statusModal.addEventListener('show.bs.modal', () => {
             updateSystemStatus();
        });
    }

    // API Key Modal Listener
    const apiKeyModal = document.getElementById('apiKeyModal');
    if (apiKeyModal) {
        const input = document.getElementById("apiKeyInput");
        apiKeyModal.addEventListener('show.bs.modal', () => {
             // Populate with existing key if available
             const stored = localStorage.getItem('artificial_analysis_api_key');
             if (stored && input) input.value = stored;
             else if (input) input.value = '';
        });
    }

    const apiKeySaveBtn = document.getElementById("saveApiKeyBtn");
    if (apiKeySaveBtn) {
        apiKeySaveBtn.addEventListener("click", () => {
            const input = document.getElementById("apiKeyInput");
            if (input) {
                const key = input.value.trim();
                // Allow clearing the key if empty
                if (key) {
                    localStorage.setItem('artificial_analysis_api_key', key);
                    setApiKey(key);
                } else {
                    localStorage.removeItem('artificial_analysis_api_key');
                    setApiKey(null);
                }
                
                // Close modal
                const modalEl = document.getElementById('apiKeyModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
                
                // Show feedback (could use toast, but for now just log/refresh)
                // Reload data to apply key
                refreshDataBtn.click();
            }
        });
    }
}

function updateCopyrightYear() {
    const yearElem = document.getElementById("copyrightYear");
    if (yearElem) {
        yearElem.textContent = `© ${new Date().getFullYear()}`;
    }
}

// --- Init ---
function init() {
  setTheme(getStoredTheme());
  updateCopyrightYear();
  setupEventListeners();
  loadModelsData();
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
