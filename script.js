// --- Global State ---
let currentView = "table";
let priceChartInstance = null;
let modelsData = []; // Will be populated from CSV
// **** NEW: Add sort state ****
let currentSort = {
  column: "releaseDate",
  direction: "desc",
};

// --- DOM Elements ---
const modelSelectionList = document.getElementById("model-selection-list");
const comparisonTableBody = document.getElementById("comparison-table-body");
const viewTitle = document.getElementById("view-title");
const tableView = document.getElementById("table-view");
const barChartView = document.getElementById("bar-chart-view");
const tableViewBtn = document.getElementById("tableViewBtn");
const chartViewBtn = document.getElementById("chartViewBtn");

const barChartViewBtn = document.getElementById("barChartViewBtn");
const scatterChartViewBtn = document.getElementById("scatterChartViewBtn");
const timelineChartViewBtn = document.getElementById("timelineChartViewBtn");
const refreshPageBtn = document.getElementById("refreshPageBtn");
const priceChartCanvas = document.getElementById("priceChart");
const barChartMessage = document.getElementById("bar-chart-message");
const barChartCanvasContainer = document.querySelector(
  ".chart-canvas-container"
);
const hamburgerBtn = document.getElementById("hamburgerBtn");
const selectionPanel = document.getElementById("selectionPanel");
const closePanelBtn = document.getElementById("closePanelBtn");
const overlay = document.getElementById("overlay");
const selectAllBtn = document.getElementById("selectAllBtn");
const expandAllBtn = document.getElementById("expandAllBtn");
const clearPanelBtn = document.getElementById("clearPanelBtn");
const dynamicTimestampSpan = document.getElementById("dynamicTimestamp");
const filterLowBtn = document.getElementById("filterLowBtn");
const filterMediumBtn = document.getElementById("filterMediumBtn");
const filterHighBtn = document.getElementById("filterHighBtn");
// NEW: Search input element
const modelSearchInput = document.getElementById("modelSearchInput");
// NEW: Model Detail Modal Elements
const modelDetailModal = document.getElementById("modelDetailModal");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");
const modalModelName = document.getElementById("modalModelName");
const modalModelLogo = document.getElementById("modalModelLogo");
const modalModelProvider = document.getElementById("modalModelProvider");
const modalInputPrice = document.getElementById("modalInputPrice");
const modalOutputPrice = document.getElementById("modalOutputPrice");
const modalContextWindow = document.getElementById("modalContextWindow");
const modalReleaseDate = document.getElementById("modalReleaseDate");
const modalStatus = document.getElementById("modalStatus");
// NEW: Theme Toggle Elements
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
// --------------------

// --- Global Image Cache ---
const imageCache = {};

// --- Theme Management ---
function getStoredTheme() {
  return localStorage.getItem("theme") || "light";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);
  updateThemeIcon(theme);
  updateDisplay(); // Re-render to update chart colors
}

function updateThemeIcon(theme) {
  if (theme === "dark") {
    themeIcon.classList.remove("bi-moon-stars-fill");
    themeIcon.classList.add("bi-sun-fill");
  } else {
    themeIcon.classList.remove("bi-sun-fill");
    themeIcon.classList.add("bi-moon-stars-fill"); // Moon icon for light mode (switch to dark)
  }
}

function toggleTheme() {
  const currentTheme = getStoredTheme();
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
}

function getChartColors() {
  const theme = getStoredTheme();
  const isDark = theme === "dark";
  return {
    textColor: isDark ? "#e0e0e0" : "#666",
    gridColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    tooltipBg: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.8)",
    tooltipText: isDark ? "#000" : "#fff"
  };
}



// Initialize Theme
const savedTheme = getStoredTheme();
setTheme(savedTheme);

// --- Helper Functions ---
function getPriceCategory(model) {
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

function parseFormattedNumber(numStr) {
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

function formatNumber(numStr) {
  if (
    numStr === null ||
    numStr === undefined ||
    numStr.trim() === "" ||
    numStr.includes("—")
  )
    return "N/A";
  const sanitizedStr = String(numStr).replace(/,/g, "");
  const num = parseInt(sanitizedStr, 10);
  if (isNaN(num)) return "N/A";
  if (num >= 1000000)
    return (num / 1000000).toFixed(num % 1000000 !== 0 ? 1 : 0) + "M";
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 !== 0 ? 1 : 0) + "k";
  return num.toString();
}

function parseValueForSort(value, type) {
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
      const year = parseInt(parts[2], 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
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

function getLogoFilename(vendorName) {
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
async function preloadLogosForChart(models) {
  const promises = models.map((model) => {
    if (
      model.logo &&
      (imageCache[model.logo] === undefined ||
        (imageCache[model.logo] instanceof HTMLImageElement === false &&
          imageCache[model.logo] !== null))
    ) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = `img/logos/${model.logo}`;
        imageCache[model.logo] = img;
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn(`Failed to load chart logo: ${model.logo}`);
          imageCache[model.logo] = null;
          resolve();
        };
      });
    }
    return Promise.resolve();
  });
  await Promise.all(promises);
}

function getPreloadedImage(logoFilename) {
  if (!logoFilename) return null;
  const img = imageCache[logoFilename];
  if (
    img instanceof HTMLImageElement &&
    img.complete &&
    img.naturalHeight !== 0
  ) {
    return img;
  }
  return null;
}

// --- CSV Processing Functions ---
function parseCsvLineRobust(line) {
    const values = [];
    const csvRegex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
    let match;

    while ((match = csvRegex.exec(line)) !== null) {
        let value;
        if (match[1] !== undefined) {
            value = match[1];
        } else if (match[2] !== undefined) {
            value = match[2];
        } else {
            value = '';
        }
        values.push(value.replace(/Ð/g, '').trim());
        if (match.index === csvRegex.lastIndex) {
            csvRegex.lastIndex++;
        }
    }
    if (line.trim() === "" && values.length === 1 && values[0] === "") {
        return [];
    }
    return values;
}

function parseCSV(csvText) {
  console.log("Starting CSV Parse with robust parser...");

  const normalizedText = csvText.replace(/\r\n/g, '\n').trim();
  const lines = normalizedText.split('\n');

  if (lines.length < 2) {
    console.warn("CSV has too few lines (header + data expected).");
    return [];
  }

  const headers = parseCsvLineRobust(lines[0]);
  
  const vendorIdx = headers.indexOf("Vendor");
  const modelIdx = headers.indexOf("Model");
  const contextIdx = headers.indexOf("Context (tokens)");
  const inputPriceIdx = headers.indexOf("Input Price ($/1M)");
  const outputPriceIdx = headers.indexOf("Output Price ($/1M)");
  const statusIdx = headers.indexOf("Status");
  const releaseDateIdx = headers.indexOf("Release Date");

  const requiredIndices = [vendorIdx, modelIdx, contextIdx, inputPriceIdx, outputPriceIdx, statusIdx];
  if (requiredIndices.some((idx) => idx === -1)) {
    console.error("One or more required CSV headers are missing.", headers);
    return [];
  }

  const dataRows = lines.slice(1);
  const parsedData = [];
  dataRows.forEach((line, rowIndex) => {
    if (line.trim() === "") return;
    const values = parseCsvLineRobust(line);
    if (values.length < headers.length) {
      while (values.length < headers.length) {
          values.push("");
      }
    }
    if (values.every((v) => v === "")) return;
    const modelName = values[modelIdx];
    if (!modelName) {
      console.warn(`Model name missing at row ${rowIndex + 2}.`);
      return;
    }

    const parsePrice = (priceValue) => {
      if (!priceValue || priceValue.includes("—") || priceValue === "Open Source" || priceValue === "Not Public")
        return null;
      const cleanedPrice = priceValue.replace(/[^0-9.]/g, ''); 
      const num = parseFloat(cleanedPrice);
      return isNaN(num) ? null : num;
    };

    const releaseDate = releaseDateIdx !== -1 ? values[releaseDateIdx] || "" : "";

    const modelObject = {
      provider: values[vendorIdx],
      name: modelName,
      id: modelName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/gi, ""),
      contextWindow: formatNumber(values[contextIdx]),
      inputPrice: parsePrice(values[inputPriceIdx]),
      outputPrice: parsePrice(values[outputPriceIdx]),
      status: values[statusIdx],
      releaseDate: releaseDate,
      logo: getLogoFilename(values[vendorIdx]),
    };

    if (modelObject.name === "Grok 1") {
      if (modelObject.inputPrice === 0) modelObject.inputPrice = null;
      if (modelObject.outputPrice === 0) modelObject.outputPrice = null;
    }

    if (!modelObject.id) {
      console.warn(`Model at row ${rowIndex + 2} resulted in empty ID. Name: "${modelName}"`);
      return;
    }
    parsedData.push(modelObject);
  });
  console.log("CSV Parsed Data (first 5):", parsedData.slice(0, 5));
  return parsedData;
}

async function loadModelsData() {
  console.log("Loading ai_model_list.csv...");
  try {
    // UPDATED: Changed file name
    const response = await fetch("ai_model_list.csv");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    console.log("Fetched ai_model_list.csv. Length:", csvText.length);
    return parseCSV(csvText);
  } catch (error) {
    console.error("Failed to load/parse ai_model_list.csv:", error);
    if (modelSelectionList) modelSelectionList.innerHTML = `<p>Error loading model data: ${error.message}.</p>`;
    if (comparisonTableBody) comparisonTableBody.innerHTML = `<tr><td colspan="6">Error loading model data.</td></tr>`;
    return [];
  }
}

// --- UI and Logic Functions ---
// --- UI and Logic Functions ---
// Bootstrap Offcanvas instance
let selectionPanelInstance = null;

function openPanel() {
  const el = document.getElementById("selectionPanel");
  if (el) {
    if (!selectionPanelInstance) selectionPanelInstance = new bootstrap.Offcanvas(el);
    selectionPanelInstance.show();
  }
}

function closePanel() {
  const el = document.getElementById("selectionPanel");
  if (el) {
    const instance = bootstrap.Offcanvas.getInstance(el);
    if (instance) instance.hide();
  }
}

function groupModelsByProvider(models) {
  if (!models || models.length === 0) return {};
  return models.reduce((acc, model) => {
    const provider = model.provider || "Other";
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {});
}

function populateModelSelection() {
  console.log("Populating model selection...");
  if (!modelSelectionList) {
    console.error("populateModelSelection: modelSelectionList not found.");
    return;
  }
  if (!modelsData || modelsData.length === 0) {
    modelSelectionList.innerHTML = "<p class='text-center text-muted'>No model data available.</p>";
    console.warn("populateModelSelection: modelsData is empty.");
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

    // Provider Logo
    const providerLogoFilename = getLogoFilename(provider);
    const logoImg = document.createElement("img");
    logoImg.src = `img/logos/${providerLogoFilename}`;
    logoImg.alt = `${provider} logo`;
    logoImg.className = "me-2";
    logoImg.style.width = "20px";
    logoImg.style.height = "20px";
    logoImg.style.objectFit = "contain";
    logoImg.loading = "lazy";
    logoImg.onerror = function () { this.style.display = "none"; };

    button.appendChild(logoImg);
    button.appendChild(document.createTextNode(provider));

    header.appendChild(button);
    accordionItem.appendChild(header);

    const collapseDiv = document.createElement("div");
    collapseDiv.id = collapseId;
    collapseDiv.className = "accordion-collapse collapse";
    collapseDiv.setAttribute("aria-labelledby", headingId);
    // Remove data-bs-parent to allow multiple sections to be open at once
    // collapseDiv.setAttribute("data-bs-parent", "#model-selection-list"); 

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
      checkbox.addEventListener("change", () => updateDisplay());

      label.appendChild(checkbox);

      if (model.logo) {
        const modelItemLogoImg = document.createElement("img");
        modelItemLogoImg.src = `img/logos/${model.logo}`;
        modelItemLogoImg.alt = `${model.provider || "Provider"} logo`;
        modelItemLogoImg.style.width = "16px";
        modelItemLogoImg.style.height = "16px";
        modelItemLogoImg.style.objectFit = "contain";
        modelItemLogoImg.loading = "lazy";
        label.appendChild(modelItemLogoImg);
      }

      const nameSpan = document.createElement("span");
      nameSpan.className = "model-name-text flex-grow-1";
      nameSpan.textContent = model.name || "Unnamed Model";
      label.appendChild(nameSpan);

      const category = getPriceCategory(model);
      if (category.name !== "N/A") {
        const categoryTag = document.createElement("span");
        let badgeClass = "bg-secondary";
        if (category.className === "low") badgeClass = "bg-success";
        if (category.className === "medium") badgeClass = "bg-warning text-dark";
        if (category.className === "high") badgeClass = "bg-danger";
        
        categoryTag.className = `badge ${badgeClass} rounded-pill`;
        categoryTag.textContent = category.name;
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

function filterModelsList(searchTerm) {
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
      } else if (normalizedSearchTerm === "") {
         if (collapseDiv) new bootstrap.Collapse(collapseDiv, { toggle: false }).hide();
         button.classList.add("collapsed");
         button.setAttribute("aria-expanded", "false");
      }
    } else {
      item.classList.add("d-none");
    }
  });
}

function selectAllModels() {
  modelSelectionList.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);
  updateDisplay();
}

// Initial Render
updateDisplay();

// Theme Toggle Listener
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);
}

function expandAllProviders() {
  modelSelectionList.querySelectorAll(".accordion-collapse").forEach(collapseDiv => {
    new bootstrap.Collapse(collapseDiv, { toggle: false }).show();
  });
}

function clearAndCollapseSelections() {
  modelSelectionList.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
  modelSelectionList.querySelectorAll(".accordion-collapse").forEach(collapseDiv => {
    new bootstrap.Collapse(collapseDiv, { toggle: false }).hide();
  });
  updateDisplay();
}

function filterModelsByCategory(categoryName) {
  const allCheckboxes = modelSelectionList.querySelectorAll('input[type="checkbox"]');
  const matchingModelIds = modelsData.filter(model => getPriceCategory(model).name.toLowerCase() === categoryName.toLowerCase()).map(model => model.id);
  allCheckboxes.forEach(checkbox => checkbox.checked = matchingModelIds.includes(checkbox.value));
  updateDisplay();
}

// Bootstrap Modal instance
let modelDetailModalInstance = null;

function showModelDetail(modelId) {
  const model = modelsData.find(m => m.id === modelId);
  if (!model) return;
  const formatPrice = p => (p !== null && p !== undefined && !isNaN(p)) ? `$${p.toFixed(2)}` : "N/A";
  modalModelName.textContent = model.name || "N/A";
  modalModelLogo.src = model.logo ? `img/logos/${model.logo}` : "";
  modalModelLogo.alt = `${model.provider || "Provider"} logo`;
  modalModelLogo.style.display = model.logo ? "block" : "none";
  modalModelProvider.textContent = model.provider || "N/A";
  modalInputPrice.textContent = formatPrice(model.inputPrice);
  modalOutputPrice.textContent = formatPrice(model.outputPrice);
  modalContextWindow.textContent = model.contextWindow || "N/A";
  modalReleaseDate.textContent = model.releaseDate || "N/A";
  modalStatus.textContent = model.status || "N/A";
  
  const el = document.getElementById("modelDetailModal");
  if (el) {
    if (!modelDetailModalInstance) modelDetailModalInstance = new bootstrap.Modal(el);
    modelDetailModalInstance.show();
  }
}

function hideModelDetail() {
  if (modelDetailModalInstance) {
    modelDetailModalInstance.hide();
  }
}

function updateTableView(selectedModelsData) {
  if (!comparisonTableBody) return;
  comparisonTableBody.innerHTML = "";
  if (!selectedModelsData || selectedModelsData.length === 0) {
    comparisonTableBody.innerHTML = `<tr><td colspan="6">Select models to compare.</td></tr>`;
    return;
  }
  selectedModelsData.forEach((model) => {
    const row = document.createElement("tr");
    row.dataset.modelId = model.id;
    const formatPrice = p => (p !== null && p !== undefined && !isNaN(p)) ? `$${p.toFixed(2)}` : "N/A";
    const modelNameCell = document.createElement("td");
    modelNameCell.className = "model-name-cell d-flex align-items-center";
    modelNameCell.style.cursor = "pointer";
    modelNameCell.title = `View details for ${model.name}`;
    if (model.logo) {
      const logoImg = document.createElement("img");
      logoImg.src = `img/logos/${model.logo}`;
      logoImg.alt = `${model.provider || "Provider"} logo`;
      logoImg.className = "table-model-logo";
      logoImg.loading = "lazy";
      logoImg.onerror = function () { this.style.display = "none"; };
      modelNameCell.appendChild(logoImg);
    }
    const modelNameSpan = document.createElement("span");
    modelNameSpan.className = "model-name-text";
    modelNameSpan.textContent = model.name || "N/A";
    modelNameCell.appendChild(modelNameSpan);
    const category = getPriceCategory(model);
    if (category.name !== "N/A") {
      const categoryTag = document.createElement("span");
      let badgeClass = "bg-secondary";
      if (category.className === "low") badgeClass = "bg-success";
      if (category.className === "medium") badgeClass = "bg-warning text-dark";
      if (category.className === "high") badgeClass = "bg-danger";
      
      categoryTag.className = `badge ${badgeClass} rounded-pill ms-auto`;
      categoryTag.textContent = category.name;
      modelNameCell.appendChild(categoryTag);
    }
    row.appendChild(modelNameCell);
    row.innerHTML += `<td>${model.provider || "N/A"}</td><td>${formatPrice(model.inputPrice)}</td><td>${formatPrice(model.outputPrice)}</td><td>${model.contextWindow || "N/A"}</td><td>${model.releaseDate || "N/A"}</td>`;
    comparisonTableBody.appendChild(row);
  });
  comparisonTableBody.querySelectorAll("tr").forEach(row => {
    const modelNameCell = row.querySelector(".model-name-cell");
    if (modelNameCell) modelNameCell.addEventListener("click", () => showModelDetail(row.dataset.modelId));
  });
}

// --- Chart.js Plugin Registration ---
Chart.register({
  id: "customXAxisRenderer",
  afterDraw(chart, args, options) {
    if (chart.config.type !== "bar") return;
    const pluginOpts = chart.config.options.plugins.customXAxisRenderer;
    if (!pluginOpts || !pluginOpts.selectedModels) return;
    const { ctx } = chart;
    const xAxis = chart.scales.x;
    const logoSize = pluginOpts.logoSize || 16;
    const textPadding = pluginOpts.textPadding || 4;
    const font = pluginOpts.font || "10px Arial, sans-serif";
    const textColor = pluginOpts.textColor || "#444";
    const MAX_LABEL_LENGTH = 15;
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    pluginOpts.selectedModels.forEach((model, index) => {
      if (index >= xAxis.ticks.length) return;
      const xPos = xAxis.getPixelForTick(index);
      const logo = getPreloadedImage(model.logo);
      let currentY = xAxis.bottom + textPadding;
      if (logo) {
        const logoX = xPos - logoSize / 2;
        ctx.drawImage(logo, logoX, currentY, logoSize, logoSize);
        currentY += logoSize + textPadding;
      } else {
        currentY += logoSize + textPadding; 
      }
      let displayLabel = model.name || "N/A";
      if (displayLabel.length > MAX_LABEL_LENGTH) {
          displayLabel = displayLabel.substring(0, MAX_LABEL_LENGTH - 3) + "...";
      }
      ctx.fillText(displayLabel, xPos, currentY); 
    });
    ctx.restore();
  },
});

async function renderBarChart(selectedModelsData) {
  if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) return;
  if (priceChartInstance) priceChartInstance.destroy();
  barChartMessage.textContent = "";
  priceChartCanvas.style.display = "block";
  barChartCanvasContainer.style.minWidth = "0px";

  if (!selectedModelsData || selectedModelsData.length === 0) {
    barChartMessage.textContent = "Select models to display chart.";
    priceChartCanvas.style.display = "none";
    return;
  }

  await preloadLogosForChart(selectedModelsData);

  const minBarWidthPerModel = 100;
  const chartPadding = 100;
  const calculatedMinWidth = selectedModelsData.length * minBarWidthPerModel + chartPadding;
  barChartCanvasContainer.style.minWidth = `${calculatedMinWidth}px`;

  const labels = selectedModelsData.map((model) => model.name);
  const inputPrices = selectedModelsData.map((model) => model.inputPrice ?? null);
  const outputPrices = selectedModelsData.map((model) => model.outputPrice ?? null);
  const data = { labels, datasets: [
    { label: "Input Price ($/1M)", data: inputPrices, backgroundColor: "rgba(54, 162, 235, 0.6)", borderColor: "rgba(54, 162, 235, 1)", borderWidth: 1, minBarLength: 5 },
    { label: "Output Price ($/1M)", data: outputPrices, backgroundColor: "rgba(255, 99, 132, 0.6)", borderColor: "rgba(255, 99, 132, 1)", borderWidth: 1, minBarLength: 5 },
  ]};

  const logoSize = 16;
  const textPadding = 4;
  const xAxisItemHeight = logoSize + textPadding + 12 + 5;
  
  const colors = getChartColors();

  const config = {
    type: "bar",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "x",
      interaction: {
        mode: 'index',
        intersect: false,
      },
      layout: { padding: { bottom: xAxisItemHeight } },
      plugins: {
        title: { display: true, text: "Model Pricing Comparison ($/1M)", padding: { top: 10, bottom: 20 }, font: { size: 14 }, color: colors.textColor },
        tooltip: {
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.raw === null || context.raw === undefined) return label + "N/A";
              const model = selectedModelsData[context.dataIndex];
              if (!model) return label + "N/A";
              const originalValue = context.dataset.label.toLowerCase().startsWith("input") ? model.inputPrice : model.outputPrice;
              if (originalValue !== null && originalValue !== undefined && !isNaN(originalValue)) label += `$${context.parsed.y.toFixed(2)}`;
              else label += "N/A";
              return label;
            },
          },
        },
        legend: { position: "top", labels: { color: colors.textColor } },
        customXAxisRenderer: { selectedModels: selectedModelsData, logoSize, textPadding, font: "10px Arial, sans-serif", textColor: colors.textColor },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Price ($/1M)", color: colors.textColor }, ticks: { callback: (value) => "$" + value.toFixed(2), color: colors.textColor }, grid: { color: colors.gridColor }, min: 0 },
        x: { barPercentage: 0.5, categoryPercentage: 0.7, title: { display: true, text: "Model", color: colors.textColor }, ticks: { callback: () => "", color: colors.textColor }, grid: { color: colors.gridColor } },
      },
    },
  };
  const ctx = priceChartCanvas.getContext("2d");
  if (ctx) {
    try { priceChartInstance = new Chart(ctx, config); } catch (e) { console.error(e); }
  }
}

async function renderScatterChart(selectedModelsData) {
  if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) return;
  if (priceChartInstance) priceChartInstance.destroy();
  barChartMessage.textContent = "";
  priceChartCanvas.style.display = "block";
  barChartCanvasContainer.style.minWidth = "0px";

  const validModels = selectedModelsData.filter(m => m.inputPrice !== null && m.contextWindow && parseFormattedNumber(m.contextWindow));

  if (validModels.length === 0) {
    barChartMessage.textContent = "Select models with price and context window data to display scatter plot.";
    priceChartCanvas.style.display = "none";
    return;
  }

  const scatterData = validModels.map(model => ({ x: parseFormattedNumber(model.contextWindow), y: model.inputPrice, model }));

  const colors = getChartColors();

  const config = {
    type: "scatter",
    data: {
      datasets: [{ label: "Models", data: scatterData, backgroundColor: "rgba(0, 123, 255, 0.6)", pointRadius: 5, pointHoverRadius: 8 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: "Price vs. Context Window", font: { size: 14 }, color: colors.textColor },
        legend: { display: false },
        tooltip: {
          mode: "nearest",
          intersect: true,
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          callbacks: {
            label: function (context) {
              const model = context.raw.model;
              return [`${model.name}`, `Context: ${model.contextWindow}`, `Input Price: $${model.inputPrice.toFixed(2)} / 1M`];
            },
          },
        },
      },
      scales: {
        x: { type: "logarithmic", title: { display: true, text: "Context Window (Tokens) - Logarithmic Scale", color: colors.textColor }, ticks: { callback: v => v >= 1e6 ? `${v/1e6}M` : (v >= 1e3 ? `${v/1e3}k` : v), color: colors.textColor }, grid: { color: colors.gridColor } },
        y: { type: "linear", beginAtZero: true, title: { display: true, text: "Input Price ($/1M)", color: colors.textColor }, ticks: { callback: v => `$${v.toFixed(2)}`, color: colors.textColor }, min: 0, grid: { color: colors.gridColor } },
      },
    },
  };
  const ctx = priceChartCanvas.getContext("2d");
  if (ctx) priceChartInstance = new Chart(ctx, config);
}

async function renderTimelineChart(selectedModelsData) {
  if (!priceChartCanvas || !barChartCanvasContainer || !barChartMessage) return;
  if (priceChartInstance) priceChartInstance.destroy();
  barChartMessage.textContent = "";
  priceChartCanvas.style.display = "block";
  barChartCanvasContainer.style.minWidth = "0px";

  const validModels = selectedModelsData.filter(m => m.releaseDate && parseValueForSort(m.releaseDate, "date").getTime() > 0);

  if (validModels.length === 0) {
    barChartMessage.textContent = "Select models with release dates to display timeline.";
    priceChartCanvas.style.display = "none";
    return;
  }

  // Group by provider to create Y-axis categories
  const providers = [...new Set(validModels.map(m => m.provider))].sort();
  
  const timelineData = validModels.map(model => ({
    x: parseValueForSort(model.releaseDate, "date"),
    y: model.provider,
    model
  }));

  const config = {
    type: "scatter",
    data: {
      datasets: [{
        label: "Models",
        data: timelineData,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        pointRadius: 6,
        pointHoverRadius: 9
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: "Model Release Timeline", font: { size: 14 } },
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const model = context.raw.model;
              return `${model.name} (${model.releaseDate})`;
            }
          }
        }
      },
      scales: {
        x: {
          type: "time",
          time: { unit: "month" },
          title: { display: true, text: "Release Date" }
        },
        y: {
          type: "category",
          labels: providers,
          title: { display: true, text: "Provider" },
          offset: true // Add spacing at top/bottom
        }
      }
    }
  };

  const ctx = priceChartCanvas.getContext("2d");
  if (ctx) priceChartInstance = new Chart(ctx, config);
}

async function switchView(view) {
  const isChartView = view === "bar" || view === "scatter" || view === "timeline";
  if (tableViewBtn) tableViewBtn.classList.toggle("active", !isChartView);
  if (chartViewBtn) {
    chartViewBtn.classList.toggle("active", isChartView);
    // Bootstrap dropdown handles its own state, but we might want to close it if open?
    // Actually, clicking an item usually closes it.
  }
  if (tableView) {
    if (!isChartView) {
      tableView.classList.remove("d-none");
      tableView.classList.add("active");
    } else {
      tableView.classList.add("d-none");
      tableView.classList.remove("active");
    }
  }
  if (barChartView) {
    if (isChartView) {
      barChartView.classList.remove("d-none");
      barChartView.classList.add("active");
    } else {
      barChartView.classList.add("d-none");
      barChartView.classList.remove("active");
    }
  }
  if (viewTitle) {
    switch (view) {
      case "bar": viewTitle.textContent = "Bar Chart"; break;
      case "scatter": viewTitle.textContent = "Scatter Plot"; break;
      case "timeline": viewTitle.textContent = "Timeline"; break;
      default: viewTitle.textContent = "Table"; break;
    }
  }
  currentView = view;
  await updateDisplay();
}

async function updateDisplay() {
  if (!modelsData || modelsData.length === 0) return;
  const selectedModelIds = Array.from(modelSelectionList.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
  let filteredModelsData = modelsData.filter(model => model.id && selectedModelIds.includes(model.id));

  if (currentView === "table") {
    const dataTypes = { name: "string", provider: "string", inputPrice: "number", outputPrice: "number", contextWindow: "number", releaseDate: "date" };
    const sortType = dataTypes[currentSort.column];
    filteredModelsData.sort((a, b) => {
      let valA = parseValueForSort(a[currentSort.column], sortType);
      let valB = parseValueForSort(b[currentSort.column], sortType);
      if (sortType === "date") { valA = valA.getTime(); valB = valB.getTime(); }
      if (valA < valB) return currentSort.direction === "asc" ? -1 : 1;
      if (valA > valB) return currentSort.direction === "asc" ? 1 : -1;
      return 0;
    });
    updateSortIcons();
  } else {
    filteredModelsData.sort((a, b) => a.name.localeCompare(b.name));
  }

  switch (currentView) {
    case "bar": await renderBarChart(filteredModelsData); break;
    case "scatter": await renderScatterChart(filteredModelsData); break;
    case "timeline": await renderTimelineChart(filteredModelsData); break;
    default: updateTableView(filteredModelsData); break;
  }
}

function updateSortIcons() {
  document.querySelectorAll("th[data-sort]").forEach(header => {
    header.classList.remove("asc", "desc");
    if (header.dataset.sort === currentSort.column) {
      header.classList.add(currentSort.direction);
    }
  });
}

const GITHUB_USERNAME = "adithyadaine";
const GITHUB_REPO_NAME = "AI-Model-Price-Comparison";
// UPDATED: Changed file name
const CSV_FILE_PATH = "ai_model_list.csv";

async function setLastUpdatedTimestampFromGithub() {
  if (!dynamicTimestampSpan) return;
  dynamicTimestampSpan.textContent = "Fetching latest update...";
  const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO_NAME}/commits?path=${CSV_FILE_PATH}&page=1&per_page=1`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') throw new Error("GitHub API rate limit exceeded.");
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    const commits = await response.json();
    if (commits && commits.length > 0) {
      const lastCommitDate = new Date(commits[0].commit.author.date);
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true };
      dynamicTimestampSpan.textContent = new Intl.DateTimeFormat("en-US", options).format(lastCommitDate).replace(" at", ",");
    } else {
      dynamicTimestampSpan.textContent = "Could not fetch update date.";
    }
  } catch (error) {
    console.error("Failed to fetch last updated date:", error);
    dynamicTimestampSpan.textContent = `Error: ${error.message}`;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!modelSelectionList || !comparisonTableBody || !priceChartCanvas || !dynamicTimestampSpan) {
    console.error("Initialization failed: Essential DOM elements are missing.");
    document.body.innerHTML = "<h1>Error: Application structure incomplete.</h1>";
    return;
  }

  modelsData = await loadModelsData();

  if (modelsData && modelsData.length > 0) {
    populateModelSelection();
    await setLastUpdatedTimestampFromGithub();

    if (modelSearchInput) modelSearchInput.addEventListener("input", e => filterModelsList(e.target.value));
    if (tableViewBtn) tableViewBtn.addEventListener("click", () => switchView("table"));
    if (barChartViewBtn) barChartViewBtn.addEventListener("click", () => switchView("bar"));
    if (scatterChartViewBtn) scatterChartViewBtn.addEventListener("click", () => switchView("scatter"));
    if (timelineChartViewBtn) timelineChartViewBtn.addEventListener("click", () => switchView("timeline"));
    if (refreshPageBtn) refreshPageBtn.addEventListener("click", () => location.reload());
    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openPanel);
    if (closePanelBtn) closePanelBtn.addEventListener("click", closePanel);
    if (overlay) overlay.addEventListener("click", closePanel);
    if (selectAllBtn) selectAllBtn.addEventListener("click", selectAllModels);
    if (expandAllBtn) expandAllBtn.addEventListener("click", expandAllProviders);
    if (clearPanelBtn) clearPanelBtn.addEventListener("click", () => {
      clearAndCollapseSelections();
      if (modelSearchInput) { modelSearchInput.value = ''; filterModelsList(''); }
    });
    if (filterLowBtn) filterLowBtn.addEventListener("click", () => filterModelsByCategory("Low"));
    if (filterMediumBtn) filterMediumBtn.addEventListener("click", () => filterModelsByCategory("Medium"));
    if (filterHighBtn) filterHighBtn.addEventListener("click", () => filterModelsByCategory("High"));

    document.querySelectorAll("th[data-sort]").forEach(header => {
      header.addEventListener("click", () => {
        const sortKey = header.dataset.sort;
        if (currentSort.column === sortKey) {
          currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
        } else {
          currentSort.column = sortKey;
          currentSort.direction = ["inputPrice", "outputPrice", "contextWindow", "releaseDate"].includes(sortKey) ? "desc" : "asc";
        }
        updateDisplay();
      });
    });
    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener("click", hideModelDetail);
    if (modelDetailModal) {
      modelDetailModal.addEventListener("click", e => { if (e.target === modelDetailModal) hideModelDetail(); });
      document.addEventListener("keydown", e => { if (e.key === "Escape" && modelDetailModal.classList.contains("show")) hideModelDetail(); });
    }
    
    await switchView(currentView);
  } else {
    console.warn("No model data loaded. Check ai_model_list.csv and console.");
    if (modelSelectionList) modelSelectionList.innerHTML = "<p>Failed to load model data.</p>";
    if (dynamicTimestampSpan) dynamicTimestampSpan.textContent = "Data loading failed";
  }
});