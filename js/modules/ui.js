import { getPriceCategory, getLogoFilename, parseFormattedNumber, parseValueForSort, getLicense } from './utils.js';
import { providerUrls } from './api.js';
import { state } from './state.js';
import { findBenchmarkForModel, getIntelligenceDisplay, getSpeedDisplay } from './benchmark.js';
import { findLeaderboardScore, getLeaderboardSummary } from './leaderboard.js';
import { getStatusBadgeHtml, getProviderStatusUrl } from './providerStatus.js';

let selectionPanelInstance = null;

// --- Helper Functions ---
function groupModelsByProvider(models) {
  if (!models || models.length === 0) return {};
  return models.reduce((acc, model) => {
    const provider = model.provider || "Other";
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {});
}

export function openPanel() {
  const el = document.getElementById("selectionPanel");
  if (el) {
    if (!selectionPanelInstance) selectionPanelInstance = new bootstrap.Offcanvas(el);
    selectionPanelInstance.show();
  }
}

export function closePanel() {
  const el = document.getElementById("selectionPanel");
  if (el) {
    const instance = bootstrap.Offcanvas.getInstance(el);
    if (instance) instance.hide();
  }
}

// --- License Logic (Module Scope) ---
// --- License Logic moved to utils.js ---


export function updateHomeStats(models) {
    const data = models || state.models;
    if (!data) return;
    
    // 1. Active Models
    const totalModelsEl = document.getElementById("stats-model-count");
    if (totalModelsEl) totalModelsEl.textContent = data.length;

    // 2. Providers
    const activeProvidersEl = document.getElementById("stats-provider-count");
    if (activeProvidersEl) {
        const uniqueProviders = new Set(data.map(m => m.provider));
        activeProvidersEl.textContent = uniqueProviders.size;
    }

    // 3. Status Dot
    const statusDot = document.getElementById("homeApiStatusDot");
    if (statusDot) {
        statusDot.className = "status-dot bg-success status-pulse";
    }

    // 4. Token Capacity (Sum of all context windows) - Approximate
    const capacityEl = document.getElementById("stats-token-capacity");
    if (capacityEl) {
        let total = 0;
        data.forEach(m => {
            const val = parseFormattedNumber(m.contextWindow);
            if (val) total += val;
        });
        
        let display = "0";
        if (total > 1000000000) {
            display = (total / 1000000000).toFixed(1) + "B";
        } else if (total > 1000000) {
            display = (total / 1000000).toFixed(0) + "M";
        } else {
             display = total.toLocaleString();
        }
        capacityEl.textContent = display;
    }
}


export function createModelAnalysisCard(model) {
    const div = document.createElement("div");
    div.className = "model-analysis-card container-fluid mb-4";
    
    const relDate = model.releaseDate || "Unknown";
    
    
    // Get HuggingFace Open LLM Leaderboard data
    const leaderboard = findLeaderboardScore(model.name, model.provider);
    const licenseDisplay = getLicense(model, leaderboard);
    
    let ctx = "N/A";
    if (model.contextWindow) {
        let rawStr = String(model.contextWindow).toLowerCase();
        let val = parseFloat(rawStr.replace(/,/g, ''));
        if (rawStr.includes('k')) val = val * 1000;
        else if (rawStr.includes('m')) val = val * 1000000;

        if (!isNaN(val)) {
             if (val >= 1000000) ctx = (val / 1000000).toFixed(1).replace(/\.0$/, '') + "M";
             else if (val >= 1000) ctx = Math.round(val / 1000) + "k";
             else ctx = val.toLocaleString();
        } else {
             ctx = model.contextWindow;
        }
    }

    const parsePrice = (p) => (p === undefined || p === null) ? null : parseFloat(p);
    const inVal = parsePrice(model.inputPrice);
    const outVal = parsePrice(model.outputPrice);
    
    const fmtPrice = (val) => {
        if (val === null) return '<span class="text-muted">N/A</span>';
        if (val === 0) return '<span class="text-success fw-bold">Free</span>';
        return `<span class="fw-bold">${val.toFixed(2)}</span>`;
    };

    const inPriceDisplay = fmtPrice(inVal);
    const outPriceDisplay = fmtPrice(outVal);

    // Build input modality icons from API data
    const inputMods = model.inputModalities || [];
    let inputModalityIcons = '';
    if (inputMods.includes("text")) inputModalityIcons += '<i class="bi bi-fonts" title="Text"></i> ';
    if (inputMods.includes("image")) inputModalityIcons += '<i class="bi bi-image" title="Image"></i> ';
    if (inputMods.includes("file")) inputModalityIcons += '<i class="bi bi-file-earmark" title="File"></i> ';
    if (inputMods.includes("audio")) inputModalityIcons += '<i class="bi bi-music-note-beamed" title="Audio"></i> ';
    if (!inputModalityIcons) inputModalityIcons = '<i class="bi bi-fonts" title="Text"></i>'; // Fallback
    
    // Build output modality icons from API data
    const outputMods = model.outputModalities || [];
    let outputModalityIcons = '';
    if (outputMods.includes("text")) outputModalityIcons += '<i class="bi bi-fonts" title="Text"></i> ';
    if (outputMods.includes("image")) outputModalityIcons += '<i class="bi bi-image" title="Image"></i> ';
    if (outputMods.includes("audio")) outputModalityIcons += '<i class="bi bi-music-note-beamed" title="Audio"></i> ';
    if (!outputModalityIcons) outputModalityIcons = '<i class="bi bi-fonts" title="Text"></i>'; // Fallback

    // Use API data for reasoning
    const isReasoning = model.supportsReasoning === true;
    const reasoningVal = isReasoning ? `<span class="text-success fw-bold">Yes</span>` : `<span class="text-muted">No</span>`;

    // Get real benchmark data from Artificial Analysis (if available)
    const benchmark = findBenchmarkForModel(model.name, model.provider);
    const score = getIntelligenceDisplay(benchmark);
    const tps = getSpeedDisplay(benchmark);
    
     // Get HuggingFace Open LLM Leaderboard data (Already fetched above)
    // const leaderboard = findLeaderboardScore(model.name, model.provider); // Removed redeclaration
    const lbSummary = getLeaderboardSummary(leaderboard);
    
    // Build leaderboard benchmarks section HTML (v2 leaderboard)
    let leaderboardHtml = '';
    if (lbSummary.available) {
        leaderboardHtml = `
            <div class="spec-row pt-2 mt-2">
                <span class="spec-label"><i class="bi bi-trophy me-2"></i>MMLU-PRO</span>
                <span class="spec-val ${lbSummary.mmluPro !== 'N/A' ? 'text-primary fw-bold' : ''}">${lbSummary.mmluPro}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label"><i class="bi bi-graph-up me-2"></i>IFEval</span>
                <span class="spec-val ${lbSummary.ifeval !== 'N/A' ? 'text-primary fw-bold' : ''}">${lbSummary.ifeval}</span>
            </div>
            <div class="spec-row">
                <span class="spec-label"><i class="bi bi-puzzle me-2"></i>BBH</span>
                <span class="spec-val ${lbSummary.bbh !== 'N/A' ? 'text-primary fw-bold' : ''}">${lbSummary.bbh}</span>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="row g-0">
            <div class="col-lg-8 p-4 d-flex flex-column justify-content-center">
                <div class="analysis-header ps-0 pt-0 pb-0 mb-3 border-bottom-0 bg-transparent">
                   <h3 class="fw-bold mb-1 display-6">${model.name}</h3>
                   <div class="sub-text mt-2"><span class="fw-bold">${model.provider}</span> &bull; Released ${relDate}</div>
                </div>

                <div class="analysis-stats-box d-flex justify-content-around align-items-center">
                    <div class="stat-item">
                        <div class="stat-label">Intelligence</div>
                        <div class="stat-rank" style="opacity:0;">--</div>
                        <div class="stat-icon"><i class="bi bi-mortarboard-fill"></i></div>
                        <div class="stat-value ${score !== 'N/A' ? 'text-success' : 'text-muted'}">${score !== 'N/A' ? score + ' <span class="fs-6 text-muted fw-normal">/100</span>' : 'N/A'}</div>
                        <div class="stat-sub">${score !== 'N/A' ? 'AA Index' : 'No data'}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Speed</div>
                         <div class="stat-rank" style="opacity:0;">--</div>
                        <div class="stat-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                        <div class="stat-value ${tps !== 'N/A' ? 'text-success' : 'text-muted'}">${tps !== 'N/A' ? tps : 'N/A'}</div>
                        <div class="stat-sub">${tps !== 'N/A' ? 'tok/s' : 'No data'}</div>
                    </div>
                     <div class="stat-item">
                        <div class="stat-label">Input Price</div>
                        <div class="stat-rank" style="opacity:0;">--</div>
                        <div class="stat-icon text-warning"><i class="bi bi-currency-dollar"></i></div>
                        <div class="stat-value">${inPriceDisplay}</div>
                        <div class="stat-sub">per 1M tok</div>
                    </div>
                     <div class="stat-item">
                        <div class="stat-label">Output Price</div>
                        <div class="stat-rank" style="opacity:0;">--</div>
                        <div class="stat-icon text-warning"><i class="bi bi-currency-dollar"></i></div>
                        <div class="stat-value">${outPriceDisplay}</div>
                        <div class="stat-sub">per 1M tok</div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4 p-4 specs-col d-flex flex-column justify-content-center">
                 <h6 class="text-uppercase text-secondary fw-bold mb-4 small" style="letter-spacing: 1px;">Technical Specifications</h6>
                 <div class="tech-specs-list">
                    <div class="spec-row">
                        <span class="spec-label"><i class="bi bi-lightbulb me-2"></i>Reasoning</span>
                        <span class="spec-val">${reasoningVal}</span>
                    </div>
                    <div class="spec-row">
                         <span class="spec-label"><i class="bi bi-box-arrow-in-right me-2"></i>Input modality</span>
                         <span class="spec-val text-nowrap">${inputModalityIcons}</span>
                    </div>
                    <div class="spec-row">
                         <span class="spec-label"><i class="bi bi-box-arrow-right me-2"></i>Output modality</span>
                         <span class="spec-val">${outputModalityIcons}</span>
                    </div>
                     <div class="spec-row">
                         <span class="spec-label"><i class="bi bi-chat-square-text me-2"></i>Context window</span>
                         <span class="spec-val">${ctx}</span>
                    </div>
                     <div class="spec-row">
                         <span class="spec-label"><i class="bi bi-file-text me-2"></i>License</span>
                         <span class="spec-val">${licenseDisplay}</span>
                    </div>
                    ${leaderboardHtml}
                 </div>
            </div>
        </div>
    `;
    return div;
}

export function openProviderDetail(providerName) {
    const listContainer = document.getElementById("providersListContainer");
    const detailContainer = document.getElementById("providerDetailContainer");
    const title = document.getElementById("selectedProviderTitle");
    const grid = document.getElementById("providerModelsList");
    
    if(!listContainer || !detailContainer || !grid) return;
    
    listContainer.classList.add("d-none");
    detailContainer.classList.remove("d-none");
    
    if(title) title.textContent = providerName;
    
    const providerModels = state.models.filter(m => m.provider === providerName);
    
    let logoSrc = 'img/logos/other.png';
    let logoUrlFallback = 'img/logos/other.png';

    if (providerModels.length > 0) {
        const sample = providerModels.find(m => m.logo) || providerModels.find(m => m.logoUrl) || providerModels[0];
        
        if (sample) {
            if (sample.logoUrl) {
                logoSrc = sample.logoUrl;
                if (sample.logo) logoUrlFallback = `img/logos/${sample.logo}`;
            } else if (sample.logo) {
                logoSrc = `img/logos/${sample.logo}`;
            }
        }
    }
    
    if(title) {
        title.innerHTML = `
            <img src="${logoSrc}" 
                 onerror="this.onerror=null; this.src='${logoUrlFallback}';" 
                 class="me-3 rounded bg-white p-1" 
                 style="height: 42px; width: 42px; object-fit: contain; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <span class="align-middle">${providerName}</span>
        `;
    }
    
    grid.innerHTML = "";
    if(providerModels.length === 0) {
        grid.innerHTML = `<div class="text-center text-muted p-5">No models found for this provider.</div>`;
    } else {
        providerModels.forEach(model => {
            grid.appendChild(createModelAnalysisCard(model));
        });
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function renderProviders() {
  const providersListContainer = document.getElementById("providersListContainer");
  const modelsData = state.models;
  if (!providersListContainer || !modelsData) return;
  
  const providers = [...new Set(modelsData.map(m => m.provider))].sort();
  providersListContainer.innerHTML = "";

  providers.forEach(provider => {
    const modelExample = modelsData.find(m => m.provider === provider);
    
    // Wider columns
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"; 

    const card = document.createElement("div");
    card.className = "card h-100 border shadow-sm hover-shadow transition-all p-3 d-flex flex-column"; 

    const brandingDiv = document.createElement("div");
    brandingDiv.className = "text-center mb-3 mt-2 flex-grow-0"; 
    
    const logo = document.createElement("img");
    logo.className = "mb-2 rounded-3 shadow-sm"; 
    logo.style.width = "48px";
    logo.style.height = "48px";
    logo.style.objectFit = "contain";
    
    // Use remote logo if available, fallback to local, then generic
    if (modelExample && modelExample.logoUrl) {
        logo.src = modelExample.logoUrl;
    } else if (modelExample && modelExample.logo) {
        logo.src = `img/logos/${modelExample.logo}`;
    } else {
        logo.src = 'img/logos/other.png';
    }
    
    logo.onerror = function() {
        // If failed remote, try local if available and different
        if (modelExample && this.src === modelExample.logoUrl && modelExample.logo) {
             this.src = `img/logos/${modelExample.logo}`;
        } else {
             this.src = 'img/logos/other.png'; 
        }
    };
    
    logo.alt = provider;
    brandingDiv.appendChild(logo);

    const titleData = document.createElement("div"); 
    titleData.className = "d-flex justify-content-center align-items-center gap-2 mb-0 fw-bold w-100";
    
    // Add status dot
    const statusUrl = getProviderStatusUrl(provider);
    
    // Wrapper for tooltip
    const statusWrapper = document.createElement("div");
    statusWrapper.className = "d-flex align-items-center";
    
    if (statusUrl) {
        const dotLink = document.createElement("a");
        dotLink.className = "status-dot-link d-inline-block";
        dotLink.href = statusUrl;
        dotLink.target = "_blank";
        dotLink.title = `View ${provider} service status`;
        dotLink.onclick = (e) => e.stopPropagation();
        
        const dot = document.createElement("div");
        dot.className = "status-dot bg-success status-pulse";
        dot.style.cursor = "pointer";
        
        dotLink.appendChild(dot);
        statusWrapper.appendChild(dotLink);
    } else {
        // Orange dot for no status page found
        const dot = document.createElement("div");
        dot.className = "status-dot bg-warning"; // No pulse, just static or maybe subtle? Kept static for now
        dot.title = "No status page available";
        dot.style.cursor = "help";
        statusWrapper.appendChild(dot);
    }
    
    titleData.appendChild(statusWrapper); // Append wrapper instead of direct link
    
    const textSpan = document.createElement("span");
    textSpan.className = "text-truncate";
    textSpan.style.fontSize = "0.9rem"; 
    textSpan.textContent = provider;
    titleData.appendChild(textSpan);

    brandingDiv.appendChild(titleData);

    card.appendChild(brandingDiv);

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "mt-auto w-100";

    const row1 = document.createElement("div");
    row1.className = "d-flex flex-wrap gap-2 mb-2 w-100"; 

    const webBtn = document.createElement("a");
    webBtn.className = "btn btn-sm btn-outline-primary flex-fill fw-medium px-1 py-1 d-flex justify-content-center align-items-center";
    webBtn.style.fontSize = "0.75rem";
    webBtn.innerHTML = '<i class="bi bi-globe me-1"></i>Web';
    webBtn.target = "_blank";
    webBtn.href = providerUrls[provider] || `https://google.com/search?q=${provider}+AI`;
    row1.appendChild(webBtn);

    const dataBtn = document.createElement("a");
    dataBtn.className = "btn btn-sm btn-outline-secondary flex-fill fw-medium px-1 py-1 d-flex justify-content-center align-items-center";
    dataBtn.style.fontSize = "0.75rem";
    dataBtn.innerHTML = '<i class="bi bi-database me-1"></i>Data';
    dataBtn.target = "_blank";
    dataBtn.href = `https://openrouter.ai/models?q=${encodeURIComponent(provider)}`;
    row1.appendChild(dataBtn);
    


    buttonsDiv.appendChild(row1);

    const modelsBtn = document.createElement("button");
    modelsBtn.className = "btn btn-sm btn-outline-primary w-100 fw-medium"; 
    modelsBtn.innerHTML = 'View Models';
    modelsBtn.onclick = (e) => {
        e.stopPropagation(); 
        openProviderDetail(provider);
    };
    buttonsDiv.appendChild(modelsBtn);

    card.appendChild(buttonsDiv);
    
    card.style.cursor = "pointer";
    card.onclick = (e) => {
        if (!e.target.closest('a') && !e.target.closest('button')) {
             openProviderDetail(provider);
        }
    };
    
    col.appendChild(card);
    providersListContainer.appendChild(col);
  });
}

export function updateTableView(selectedModelsData) {
  const comparisonTableBody = document.getElementById("comparison-table-body");
  if (!comparisonTableBody) return;
  comparisonTableBody.innerHTML = "";
  if (!selectedModelsData || selectedModelsData.length === 0) {
    comparisonTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-5 text-muted">Select models to compare.</td></tr>`;
    return;
  }
  selectedModelsData.forEach((model, index) => {
    const row = document.createElement("tr");
    row.dataset.modelId = model.id;
    const formatPrice = p => (p !== null && p !== undefined && !isNaN(p)) ? `$${p.toFixed(2)}` : "—";
    
    const rankCell = document.createElement("td");
    rankCell.className = "ps-4 text-muted fw-medium";
    rankCell.textContent = index + 1;
    row.appendChild(rankCell);

    const modelNameCell = document.createElement("td");
    modelNameCell.className = "model-name-cell d-flex align-items-center";
    modelNameCell.style.cursor = "pointer";
    modelNameCell.title = `View details for ${model.name}`;
    if (model.logo || model.logoUrl) {
      const logoImg = document.createElement("img");
      logoImg.loading = "lazy";
      
      if (model.logoUrl) {
          logoImg.src = model.logoUrl;
      } else {
          logoImg.src = `img/logos/${model.logo}`;
      }
      
      logoImg.onerror = function() {
          if (model.logoUrl && this.src === model.logoUrl && model.logo) {
              this.src = `img/logos/${model.logo}`;
          } else {
              this.style.display = "none";
          }
      };
      
      logoImg.alt = `${model.provider || "Provider"} logo`;
      logoImg.className = "table-model-logo";
      modelNameCell.appendChild(logoImg);
    }
    const modelNameSpan = document.createElement("span");
    modelNameSpan.className = "model-name-text";
    modelNameSpan.textContent = model.name || "N/A";
    modelNameCell.appendChild(modelNameSpan);
    
    row.appendChild(modelNameCell);

    const tierCell = document.createElement("td");
    tierCell.className = "text-center";
    const category = getPriceCategory(model);
    if (category.name !== "N/A") {
      const badge = document.createElement("span");
      badge.className = `badge ${category.className}`;
      badge.textContent = category.name;
      tierCell.appendChild(badge);
    } else {
        tierCell.innerHTML = '<span class="text-muted small">—</span>';
    }
    row.appendChild(tierCell);

    row.innerHTML += `
      <td>${model.provider || "—"}</td>
      <td class="text-end font-monospace">${formatPrice(model.inputPrice)}</td>
      <td class="text-end font-monospace">${formatPrice(model.outputPrice)}</td>
      <td class="text-end">${model.contextWindow || "—"}</td>
      <td class="text-end font-monospace text-muted small">${(getLicense ? getLicense(model, findLeaderboardScore(model.name, model.provider)) : "N/A")}</td>
      <td class="text-end pe-4">${model.releaseDate || "—"}</td>
    `;
    comparisonTableBody.appendChild(row);
  });
}

export function populateModelSelection(updateDisplayCallback) {
  const modelSelectionList = document.getElementById("model-selection-list");
  const modelsData = state.models;
  
  if (!modelSelectionList) return;
  if (!modelsData || modelsData.length === 0) {
    modelSelectionList.innerHTML = "<p class='text-center text-muted'>No model data available.</p>";
    return;
  }
  modelSelectionList.innerHTML = "";
  const groupedModels = groupModelsByProvider(modelsData);
  const sortedProviders = Object.keys(groupedModels).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  sortedProviders.forEach((provider, index) => {
    const providerId = provider.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    const collapseId = `collapse-${providerId}-${index}`;
    const headingId = `heading-${providerId}-${index}`;

    const accordionItem = document.createElement("div");
    accordionItem.className = "accordion-item";

    const header = document.createElement("h2");
    header.className = "accordion-header";
    header.id = headingId;

    const button = document.createElement("button");
    button.className = "accordion-button collapsed";
    button.type = "button";
    button.setAttribute("data-bs-toggle", "collapse");
    button.setAttribute("data-bs-target", `#${collapseId}`);
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", collapseId);

    const modelExample = modelsData.find(m => m.provider === provider);
    const providerLogoFilename = getLogoFilename(provider);
    
    const logoImg = document.createElement("img");
    logoImg.className = "me-2";
    logoImg.style.width = "20px";
    logoImg.style.height = "20px";
    logoImg.style.objectFit = "contain";
    logoImg.loading = "lazy";
    
    if (modelExample && modelExample.logoUrl) {
        logoImg.src = modelExample.logoUrl;
    } else {
        logoImg.src = `img/logos/${providerLogoFilename}`;
    }
    
    logoImg.onerror = function() {
        if (this.src === modelExample?.logoUrl) {
             this.src = `img/logos/${providerLogoFilename}`;
        } else {
             this.style.display = "none";
        }
    };

    button.appendChild(logoImg);
    button.appendChild(document.createTextNode(provider));

    header.appendChild(button);
    accordionItem.appendChild(header);

    const collapseDiv = document.createElement("div");
    collapseDiv.id = collapseId;
    collapseDiv.className = "accordion-collapse collapse";
    collapseDiv.setAttribute("aria-labelledby", headingId);

    const body = document.createElement("div");
    body.className = "accordion-body p-0";

    const listGroup = document.createElement("div");
    listGroup.className = "list-group list-group-flush";

    const sortedModels = groupedModels[provider].sort((a, b) => a.name.localeCompare(b.name));
    sortedModels.forEach((model) => {
      if (!model.id) return;
      
      const label = document.createElement("label");
      label.className = "list-group-item list-group-item-action d-flex align-items-center gap-2 model-item";
      label.style.cursor = "pointer";

      const checkbox = document.createElement("input");
      checkbox.className = "form-check-input flex-shrink-0";
      checkbox.type = "checkbox";
      checkbox.id = `model-checkbox-${model.id}`;
      checkbox.value = model.id;
      checkbox.checked = state.selectedIds.has(model.id);
      
      checkbox.addEventListener("change", (e) => {
          if (e.target.checked) state.selectedIds.add(model.id);
          else state.selectedIds.delete(model.id);
          updateDisplayCallback();
      });

      label.appendChild(checkbox);

      if (model.logo) {
        const modelItemLogoImg = document.createElement("img");
        modelItemLogoImg.style.width = "16px";
        modelItemLogoImg.style.height = "16px";
        modelItemLogoImg.style.objectFit = "contain";
        modelItemLogoImg.loading = "lazy";
        
        modelItemLogoImg.src = `img/logos/${model.logo}`;
        if (model.logoUrl) {
             modelItemLogoImg.onerror = function() {
                 if (this.src !== model.logoUrl) {
                     this.src = model.logoUrl;
                 } else {
                     this.style.display = "none";
                 }
             };
        } else {
             modelItemLogoImg.onerror = function() { this.style.display = "none"; };
        }
        
        label.appendChild(modelItemLogoImg);
      }

      const nameSpan = document.createElement("span");
      nameSpan.className = "model-name-text flex-grow-1";
      nameSpan.textContent = model.name || "Unnamed Model";
      label.appendChild(nameSpan);

      const category = getPriceCategory(model);
      if (category.name !== "N/A") {
        const categoryTag = document.createElement("span");
        categoryTag.className = `badge ${category.className} ms-auto`; 
        categoryTag.textContent = category.name.toUpperCase(); 
        label.appendChild(categoryTag);
      }

      listGroup.appendChild(label);
    });

    body.appendChild(listGroup);
    collapseDiv.appendChild(body);
    accordionItem.appendChild(collapseDiv);
    modelSelectionList.appendChild(accordionItem);
  });
}

export function filterModelsList(searchTerm) {
  const modelSelectionList = document.getElementById("model-selection-list");
  if (!modelSelectionList) return;
  
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();
  const allAccordionItems = modelSelectionList.querySelectorAll(".accordion-item");
  
  allAccordionItems.forEach(item => {
    const button = item.querySelector(".accordion-button");
    const providerName = button ? button.textContent.toLowerCase() : "";
    const listGroup = item.querySelector(".list-group");
    const modelItems = listGroup ? listGroup.querySelectorAll(".model-item") : [];
    
    let groupHasVisibleModels = false;
    let providerMatches = providerName.includes(normalizedSearchTerm);
    
    modelItems.forEach(modelItem => {
      const modelNameText = modelItem.querySelector(".model-name-text");
      const modelName = modelNameText ? modelNameText.textContent.toLowerCase() : "";
      const modelMatches = modelName.includes(normalizedSearchTerm);
      
      if (providerMatches || modelMatches || normalizedSearchTerm === "") {
        modelItem.classList.remove("d-none");
        modelItem.classList.add("d-flex");
        if (modelMatches) groupHasVisibleModels = true;
      } else {
        modelItem.classList.add("d-none");
        modelItem.classList.remove("d-flex");
      }
    });

    if (groupHasVisibleModels || providerMatches || normalizedSearchTerm === "") {
      item.classList.remove("d-none");
      const collapseDiv = item.querySelector(".accordion-collapse");
      if ((groupHasVisibleModels || providerMatches) && normalizedSearchTerm !== "") {
        if (collapseDiv) new bootstrap.Collapse(collapseDiv, { toggle: false }).show();
        button.classList.remove("collapsed");
        button.setAttribute("aria-expanded", "true");
      }
    } else {
      item.classList.add("d-none");
    }
  });
}

// --- New Feature: Remote Models Modal ---
export function showRecentUpdatesModal(models) {
    // Remove old modal if exists to force refresh
    const oldModal = document.getElementById("recentModelsModal_v2");
    if(oldModal) oldModal.remove();

    let modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "recentModelsModal_v2";
    modal.setAttribute("tabindex", "-1");
    // Ensure modal header text matches theme
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fw-bold">Recently Updated Models</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="recentModelsList_v2">
                    <!-- Content -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Sort logic
    let sorted = [...models]
        .sort((a, b) => {
             const dA = parseValueForSort(a.releaseDate, "date");
             const dB = parseValueForSort(b.releaseDate, "date");
             return dB - dA;
        })
        .slice(0, 50);

    const listContainer = document.getElementById("recentModelsList_v2");
    listContainer.innerHTML = "";

    if (sorted.length === 0) {
        listContainer.innerHTML = "<p class='text-muted text-center'>No recently updated models found.</p>";
    } else {
        const listGroup = document.createElement("div");
        listGroup.className = "list-group list-group-flush";

        sorted.forEach(m => {
             const item = document.createElement("div");
             item.className = "list-group-item d-flex justify-content-between align-items-center";
             item.style.backgroundColor = "transparent"; 
             item.style.borderColor = "var(--border-color)";
             
             // Left side
             const leftDiv = document.createElement("div");
             leftDiv.className = "d-flex align-items-center";

             // Logo
             const logoImg = document.createElement("img");
             const filename = getLogoFilename(m.provider);
             logoImg.loading = "lazy";
    
             // Use remote logo if available, fallback to local, then error handler
             if (m.logoUrl) {
                 logoImg.src = m.logoUrl;
             } else {
                 logoImg.src = `img/logos/${filename}`;
             }
             
             logoImg.onerror = () => {
                 // logoImg.src = "img/logos/other.png"; // Fallback to generic if local missing?
                 // Or hide image and show icon? 
                 logoImg.style.display = 'none';
             };
             logoImg.alt = m.provider;
             logoImg.className = "rounded-circle me-3";
             logoImg.style.width = "32px";
             logoImg.style.height = "32px";
             logoImg.style.objectFit = "cover";
             
             const textDiv = document.createElement("div");
             
             const nameDiv = document.createElement("div");
             nameDiv.className = "fw-bold text-body"; 
             nameDiv.textContent = m.name || "Unknown Model";
             
             const providerDiv = document.createElement("div");
             providerDiv.className = "small text-muted";
             providerDiv.textContent = m.provider || "Unknown Provider";
             
             textDiv.appendChild(nameDiv);
             textDiv.appendChild(providerDiv);
             
             leftDiv.appendChild(logoImg);
             leftDiv.appendChild(textDiv);
             
             // Right side
             const rightDiv = document.createElement("div");
             rightDiv.className = "text-end small ms-2";
             const badge = document.createElement("span");
             badge.className = "badge bg-light text-dark border";
             const dateStr = (m.releaseDate && m.releaseDate !== "N/A") ? m.releaseDate : "Unknown";
             badge.textContent = dateStr;
             
             rightDiv.appendChild(badge);
             
             item.appendChild(leftDiv);
             item.appendChild(rightDiv);
             listGroup.appendChild(item);
        });
        listContainer.appendChild(listGroup);
    }

    try {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } catch (e) {
        console.error("Bootstrap Modal failed:", e);
        // Fallback
        modal.classList.add("show");
        modal.style.display = "block";
        modal.style.backgroundColor = "rgba(0,0,0,0.5)";
        
        // Manual Close
        const closeBtns = modal.querySelectorAll('[data-bs-dismiss="modal"]');
        closeBtns.forEach(btn => {
            btn.onclick = () => {
                modal.remove();
            };
        });
    }
}

/**
 * Render search suggestions dropdown
 * @param {Array} matches - Array of matching model objects
 * @param {Function} onSelect - Callback when a suggestion is clicked
 */
export function renderSearchSuggestions(matches, onSelect) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;

    if (!matches || matches.length === 0) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '';
    const MAX_ITEMS = 6;
    
    matches.slice(0, MAX_ITEMS).forEach(model => {
        const item = document.createElement('button');
        item.className = 'list-group-item list-group-item-action border-0 px-3 py-2 bg-transparent';
        item.style.fontSize = '0.85rem';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                ${model.logoUrl ? 
                    `<img src="${model.logoUrl}" alt="${model.provider}" class="me-2 rounded-circle" width="16" height="16" style="min-width: 16px;">` : 
                    `<i class="bi bi-box-seam me-2 text-muted"></i>`
                }
                <div class="text-truncate">
                    <span class="fw-medium">${model.name}</span>
                    <small class="text-muted ms-1">(${model.provider})</small>
                </div>
            </div>
        `;
        item.onclick = (e) => {
            e.stopPropagation(); // Prevent document click from closing immediately
            onSelect(model);
        };
        container.appendChild(item);
    });
    
    // Ensure parent has relative positioning for absolute child
    const parent = container.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative'; 
    }
    
    // Adjust top position to sit below input
    container.style.top = '100%'; 
    container.style.left = '0';
    
    container.style.display = 'block';
}
