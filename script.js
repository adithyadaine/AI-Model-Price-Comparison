// --- Global State ---
let currentView = "table";
let priceChartInstance = null;
let modelsData = []; // Will be populated from CSV

// --- DOM Elements ---
const modelSelectionList = document.getElementById("model-selection-list");
const comparisonTableBody = document.getElementById("comparison-table-body");
const viewTitle = document.getElementById("view-title");
const tableView = document.getElementById("table-view");
const barChartView = document.getElementById("bar-chart-view");
const tableViewBtn = document.getElementById("tableViewBtn");
const barChartViewBtn = document.getElementById("barChartViewBtn");
const refreshPageBtn = document.getElementById("refreshPageBtn"); // Main clear button
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
const clearPanelBtn = document.getElementById("clearPanelBtn"); // Clear button in panel
const dynamicTimestampSpan = document.getElementById("dynamicTimestamp");

// --- Global Image Cache ---
const imageCache = {};

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

function formatNumber(numStr) {
  if (numStr === null || numStr === undefined || numStr.trim() === "")
    return "N/A";
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return "N/A";
  if (num >= 1000000)
    return (num / 1000000).toFixed(num % 1000000 !== 0 ? 1 : 0) + "M";
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 !== 0 ? 1 : 0) + "k";
  return num.toString();
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
        imageCache[model.logo] = img; // Store img object to prevent re-attempts
        img.onload = () => {
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load chart logo: ${model.logo}`);
          imageCache[model.logo] = null; // Mark as failed
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
function parseCSV(csvText) {
  console.log(
    "Starting CSV Parse (Direct Header Match, Robust Price Handling)..."
  );
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) {
    console.warn("CSV has too few lines (header + data expected).");
    return [];
  }
  const headers = lines[0]
    .trim()
    .split(",")
    .map((header) => header.trim());
  const vendorIdx = headers.indexOf("Vendor");
  const modelIdx = headers.indexOf("Model");
  const contextIdx = headers.indexOf("Context (tokens)");
  const inputPriceIdx = headers.indexOf("Input Price ($/1M tokens)");
  const outputPriceIdx = headers.indexOf("Output Price ($/1M tokens)");
  const statusIdx = headers.indexOf("Status");

  if (
    [
      vendorIdx,
      modelIdx,
      contextIdx,
      inputPriceIdx,
      outputPriceIdx,
      statusIdx,
    ].some((idx) => idx === -1)
  ) {
    console.error(
      "One or more required CSV headers are missing. Check your models.csv file headers."
    );
    return [];
  }
  const dataRows = lines.slice(1);
  const parsedData = [];
  dataRows.forEach((line, rowIndex) => {
    if (line.trim() === "") return;
    const values = line
      .trim()
      .split(",")
      .map((value) => value.trim());
    if (values.length !== headers.length) {
      console.warn(
        `Row ${rowIndex + 1} has incorrect column count. Line: "${line}"`
      );
      return;
    }
    const modelName = values[modelIdx];
    if (!modelName) {
      console.warn(`Model name missing at row ${rowIndex + 1}.`);
      return;
    }
    const parsePrice = (priceValue) => {
      if (
        priceValue === "Open Source" ||
        priceValue === "Not Public" ||
        priceValue === "" ||
        priceValue === undefined
      )
        return null;
      const num = parseFloat(priceValue);
      return isNaN(num) ? null : num;
    };
    const modelObject = {
      provider: values[vendorIdx],
      name: modelName,
      id: modelName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/gi, ""),
      contextWindow: formatNumber(values[contextIdx]),
      inputPrice: parsePrice(values[inputPriceIdx]),
      outputPrice: parsePrice(values[outputPriceIdx]),
      status: values[statusIdx],
      logo: getLogoFilename(values[vendorIdx]), // Logo is based on provider
    };
    if (modelObject.name === "Grok 1") {
      if (modelObject.inputPrice === 0) modelObject.inputPrice = null;
      if (modelObject.outputPrice === 0) modelObject.outputPrice = null;
    }
    if (!modelObject.id) {
      console.warn(
        `Model at row ${rowIndex + 1} resulted in empty ID. Name: "${modelName}"`
      );
      return;
    }
    parsedData.push(modelObject);
  });
  console.log("CSV Parsed Data (first 5):", parsedData.slice(0, 5));
  return parsedData;
}

async function loadModelsData() {
  console.log("Loading models.csv...");
  try {
    const response = await fetch("models.csv");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
    console.log("Fetched models.csv. Length:", csvText.length);
    return parseCSV(csvText);
  } catch (error) {
    console.error("Failed to load/parse models.csv:", error);
    if (modelSelectionList)
      modelSelectionList.innerHTML = `<p>Error loading model data: ${error.message}.</p>`;
    if (comparisonTableBody)
      comparisonTableBody.innerHTML = `<tr><td colspan="5">Error loading model data.</td></tr>`;
    return [];
  }
}

// --- UI and Logic Functions ---
function openPanel() {
  if (selectionPanel && hamburgerBtn) {
    document.body.classList.add("panel-open");
    selectionPanel.setAttribute("aria-hidden", "false");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }
}

function closePanel() {
  if (selectionPanel && hamburgerBtn) {
    document.body.classList.remove("panel-open");
    selectionPanel.setAttribute("aria-hidden", "true");
    hamburgerBtn.setAttribute("aria-expanded", "false");
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
    modelSelectionList.innerHTML = "<p>No model data available.</p>";
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
  for (const provider of sortedProviders) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "model-group";
    const providerTitle = document.createElement("h3");
    providerTitle.className = "provider-title";

    const providerLogoFilename = getLogoFilename(provider);
    const logoImg = document.createElement("img");
    logoImg.src = `img/logos/${providerLogoFilename}`;
    logoImg.alt = `${provider} logo`;
    logoImg.className = "provider-logo-title";
    logoImg.loading = "lazy";
    logoImg.onerror = function () {
      this.style.display = "none";
      console.warn(
        `Logo not found for provider: ${provider} (path: img/logos/${providerLogoFilename})`
      );
    };

    const providerNameSpan = document.createElement("span");
    providerNameSpan.textContent = provider;

    providerTitle.appendChild(logoImg);
    providerTitle.appendChild(providerNameSpan);

    const clearProviderBtn = document.createElement("button");
    clearProviderBtn.className = "clear-provider-btn";
    clearProviderBtn.innerHTML = "&times;"; // The 'X' symbol
    clearProviderBtn.setAttribute("aria-label", `Clear ${provider} selections`);
    clearProviderBtn.title = `Clear ${provider} selections`; // Tooltip for mouse users
    providerTitle.appendChild(clearProviderBtn);

    providerTitle.setAttribute("aria-expanded", "false");
    const modelListDiv = document.createElement("div");
    modelListDiv.className = "model-list";
    modelListDiv.id = `provider-list-${provider.replace(/\s+/g, "-")}`;
    providerTitle.setAttribute("aria-controls", modelListDiv.id);

    clearProviderBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const checkboxesInGroup = modelListDiv.querySelectorAll(
        'input[type="checkbox"]'
      );
      checkboxesInGroup.forEach((checkbox) => {
        checkbox.checked = false;
      });
      updateDisplay();
    });

    providerTitle.addEventListener("click", () => {
      const isCurrentlyExpanded = groupDiv.classList.contains("expanded");
      groupDiv.classList.toggle("expanded", !isCurrentlyExpanded);
      providerTitle.setAttribute("aria-expanded", !isCurrentlyExpanded);
    });

    const sortedModels = groupedModels[provider].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    sortedModels.forEach((model) => {
      if (!model.id) {
        console.warn("Skipping model due to missing ID:", model);
        return;
      }
      const div = document.createElement("div");
      div.className = "model-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `model-checkbox-${model.id}`;
      checkbox.value = model.id;
      checkbox.addEventListener("change", () => updateDisplay());
      const label = document.createElement("label");
      label.htmlFor = `model-checkbox-${model.id}`;

      if (model.logo) {
        const modelItemLogoImg = document.createElement("img");
        modelItemLogoImg.src = `img/logos/${model.logo}`;
        modelItemLogoImg.alt = `${model.provider || "Provider"} logo`;
        modelItemLogoImg.className = "model-logo";
        modelItemLogoImg.loading = "lazy";
        label.appendChild(modelItemLogoImg);
      }
      const nameSpan = document.createElement("span");
      nameSpan.className = "model-name-text";
      nameSpan.textContent = model.name || "Unnamed Model";
      label.appendChild(nameSpan);

      const category = getPriceCategory(model);
      if (category.name !== "N/A") {
        const categoryTag = document.createElement("span");
        categoryTag.className = `price-tag ${category.className}`;
        categoryTag.textContent = category.name;
        label.appendChild(categoryTag);
      }

      div.appendChild(checkbox);
      div.appendChild(label);
      modelListDiv.appendChild(div);
    });
    groupDiv.appendChild(providerTitle);
    groupDiv.appendChild(modelListDiv);
    modelSelectionList.appendChild(groupDiv);
  }
  console.log("Model selection populated.");
}

function selectAllModels() {
  if (!modelSelectionList) {
    console.error("selectAllModels: modelSelectionList not found.");
    return;
  }
  const checkboxes = modelSelectionList.querySelectorAll(
    'input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });
  updateDisplay();
  console.log("All models selected.");
}

function expandAllProviders() {
  if (!modelSelectionList) {
    console.error("expandAllProviders: modelSelectionList not found.");
    return;
  }
  const providerGroups = modelSelectionList.querySelectorAll(".model-group");
  providerGroups.forEach((groupDiv) => {
    if (!groupDiv.classList.contains("expanded")) {
      groupDiv.classList.add("expanded");
      const providerTitle = groupDiv.querySelector(".provider-title");
      if (providerTitle) {
        providerTitle.setAttribute("aria-expanded", "true");
      }
    }
  });
  console.log("Attempted to expand all providers.");
}

function clearAndCollapseSelections() {
  if (!modelSelectionList) {
    console.error(
      "clearAndCollapseSelections: modelSelectionList not found."
    );
    return;
  }
  const checkboxes = modelSelectionList.querySelectorAll(
    'input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = false;
  });
  const providerGroups = modelSelectionList.querySelectorAll(".model-group");
  providerGroups.forEach((groupDiv) => {
    if (groupDiv.classList.contains("expanded")) {
      groupDiv.classList.remove("expanded");
      const providerTitle = groupDiv.querySelector(".provider-title");
      if (providerTitle) {
        providerTitle.setAttribute("aria-expanded", "false");
      }
    }
  });
  updateDisplay();
  console.log("All selections cleared and providers collapsed.");
}

function updateTableView(selectedModelsData) {
  if (!comparisonTableBody) return;
  comparisonTableBody.innerHTML = "";
  if (!selectedModelsData || selectedModelsData.length === 0) {
    comparisonTableBody.innerHTML = `<tr><td colspan="5">Select models to compare.</td></tr>`;
    return;
  }
  selectedModelsData.forEach((model) => {
    const row = document.createElement("tr");
    const formatPrice = (price) =>
      price !== null && price !== undefined && !isNaN(price)
        ? `$${price.toFixed(2)}`
        : "N/A";

    const modelNameCell = document.createElement("td");
    modelNameCell.className = "model-name-cell";

    if (model.logo) {
      const logoImg = document.createElement("img");
      logoImg.src = `img/logos/${model.logo}`;
      logoImg.alt = `${model.provider || "Provider"} logo`;
      logoImg.className = "table-model-logo";
      logoImg.loading = "lazy";
      logoImg.onerror = function () {
        this.style.display = "none";
      };
      modelNameCell.appendChild(logoImg);
    }
    const modelNameSpan = document.createElement("span");
    modelNameSpan.textContent = model.name || "N/A";
    modelNameCell.appendChild(modelNameSpan);

    const category = getPriceCategory(model);
    if (category.name !== "N/A") {
      const categoryTag = document.createElement("span");
      categoryTag.className = `price-tag ${category.className}`;
      categoryTag.textContent = category.name;
      modelNameCell.appendChild(categoryTag);
    }

    row.appendChild(modelNameCell);

    row.innerHTML += `
            <td>${model.provider || "N/A"}</td>
            <td>${formatPrice(model.inputPrice)}</td>
            <td>${formatPrice(model.outputPrice)}</td>
            <td>${model.contextWindow || "N/A"}</td>
        `;
    comparisonTableBody.appendChild(row);
  });
}

// --- Chart.js Plugin Registration ---
Chart.register({
  id: "customXAxisRenderer",
  afterDraw(chart, args, options) {
    const pluginOpts = chart.config.options.plugins.customXAxisRenderer;
    if (!pluginOpts || !pluginOpts.selectedModels) {
      return;
    }
    const { ctx } = chart;
    const xAxis = chart.scales.x;
    const logoSize = pluginOpts.logoSize || 16;
    const textPadding = pluginOpts.textPadding || 4;
    const font = pluginOpts.font || "10px Arial, sans-serif";
    const textColor = pluginOpts.textColor || "#444";

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
        currentY += logoSize + textPadding; // Reserve space even if no logo
      }
      const modelName = model.name || "N/A";
      ctx.fillText(modelName, xPos, currentY);
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

  const minBarWidthPerModel = 80,
    chartPadding = 100;
  const calculatedMinWidth =
    selectedModelsData.length * minBarWidthPerModel + chartPadding;
  barChartCanvasContainer.style.minWidth = `${calculatedMinWidth}px`;

  const labels = selectedModelsData.map((model) => model.name);
  const inputPrices = selectedModelsData.map((model) => model.inputPrice ?? 0);
  const outputPrices = selectedModelsData.map(
    (model) => model.outputPrice ?? 0
  );
  const data = { labels, datasets: [] };
  data.datasets = [
    {
      label: "Input Price ($/1M tokens)",
      data: inputPrices,
      backgroundColor: "rgba(54, 162, 235, 0.6)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 1,
    },
    {
      label: "Output Price ($/1M tokens)",
      data: outputPrices,
      backgroundColor: "rgba(255, 99, 132, 0.6)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 1,
    },
  ];

  const logoSize = 16;
  const textPadding = 4;
  const xAxisItemHeight = logoSize + textPadding + 12 + 5;

  const config = {
    type: "bar",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "x",
      layout: {
        padding: {
          bottom: xAxisItemHeight,
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Model Pricing Comparison ($/1M Tokens)",
          padding: { top: 10, bottom: 20 },
          font: { size: 14 },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              const modelIndex = context.dataIndex;
              if (
                !selectedModelsData ||
                modelIndex >= selectedModelsData.length
              )
                return label + "Error";
              const model = selectedModelsData[modelIndex];
              if (!model) return label + "Error";
              const originalValue = context.dataset.label
                .toLowerCase()
                .startsWith("input")
                ? model.inputPrice
                : model.outputPrice;
              if (
                originalValue !== null &&
                originalValue !== undefined &&
                !isNaN(originalValue)
              )
                label += `$${context.parsed.y.toFixed(2)}`;
              else label += "N/A";
              return label;
            },
          },
        },
        legend: { position: "top" },
        customXAxisRenderer: {
          selectedModels: selectedModelsData,
          logoSize: logoSize,
          textPadding: textPadding,
          font: "10px Arial, sans-serif",
          textColor: "#444",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Price ($/1M tokens)" },
          ticks: { callback: (value) => "$" + value.toFixed(2) },
        },
        x: {
          title: { display: true, text: "Model" },
          ticks: {
            callback: function (value, index, ticks) {
              return ""; // Hide default labels
            },
          },
        },
      },
    },
  };
  const ctx = priceChartCanvas.getContext("2d");
  if (ctx) {
    try {
      priceChartInstance = new Chart(ctx, config);
    } catch (error) {
      console.error("Chart.js initialization error:", error);
      barChartMessage.textContent = "Error rendering chart. Check console.";
      priceChartCanvas.style.display = "none";
    }
  } else {
    console.error("Failed to get 2D context for price chart canvas.");
    barChartMessage.textContent = "Error rendering chart context.";
    priceChartCanvas.style.display = "none";
  }
}

async function switchView(view) {
  if (tableViewBtn) tableViewBtn.classList.toggle("active", view === "table");
  if (barChartViewBtn)
    barChartViewBtn.classList.toggle("active", view === "bar");
  if (tableView) tableView.classList.toggle("active", view === "table");
  if (barChartView) barChartView.classList.toggle("active", view === "bar");
  if (viewTitle) {
    switch (view) {
      case "bar":
        viewTitle.textContent = "Bar Chart";
        break;
      case "table":
      default:
        viewTitle.textContent = "Table";
        break;
    }
  }
  currentView = view;
  await updateDisplay();
}

async function updateDisplay() {
  console.log("updateDisplay called. Current view:", currentView);
  if (!modelsData || modelsData.length === 0) {
    console.warn("updateDisplay: modelsData is empty or not loaded.");
    if (comparisonTableBody)
      comparisonTableBody.innerHTML = `<tr><td colspan="5">No model data loaded.</td></tr>`;
    if (barChartMessage) barChartMessage.textContent = "No model data loaded.";
    if (priceChartInstance) priceChartInstance.destroy();
    if (priceChartCanvas) priceChartCanvas.style.display = "none";
    return;
  }
  if (!modelSelectionList) {
    console.error("updateDisplay: modelSelectionList not found.");
    return;
  }

  const selectedCheckboxes = modelSelectionList.querySelectorAll(
    'input[type="checkbox"]:checked'
  );
  const selectedModelIds = Array.from(selectedCheckboxes).map(
    (checkbox) => checkbox.value
  );

  let filteredModelsData = modelsData.filter((model) => {
    return model.id && selectedModelIds.includes(model.id);
  });

  filteredModelsData.sort((a, b) => a.name.localeCompare(b.name));

  switch (currentView) {
    case "bar":
      await renderBarChart(filteredModelsData);
      break;
    case "table":
    default:
      updateTableView(filteredModelsData);
      break;
  }
}

function setDynamicTimestamp() {
  if (!dynamicTimestampSpan) {
    console.warn("Dynamic timestamp span not found.");
    return;
  }
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };
  const formattedTimestamp = new Intl.DateTimeFormat("en-US", options)
    .format(now)
    .replace(" at", ",");
  dynamicTimestampSpan.textContent = formattedTimestamp;
  console.log("Timestamp updated:", dynamicTimestampSpan.textContent);
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and parsed.");
  if (
    !modelSelectionList ||
    !comparisonTableBody ||
    !priceChartCanvas ||
    !dynamicTimestampSpan
  ) {
    console.error("Initialization failed: Essential DOM elements are missing.");
    if (document.body)
      document.body.innerHTML =
        "<h1>Error: Application structure incomplete.</h1>";
    return;
  }

  modelsData = await loadModelsData();

  if (modelsData && modelsData.length > 0) {
    populateModelSelection();
    setDynamicTimestamp();

    if (tableViewBtn)
      tableViewBtn.addEventListener("click", () => switchView("table"));
    if (barChartViewBtn)
      barChartViewBtn.addEventListener("click", () => switchView("bar"));
    if (refreshPageBtn)
      refreshPageBtn.addEventListener("click", () => location.reload());

    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openPanel);
    if (closePanelBtn) closePanelBtn.addEventListener("click", closePanel);
    if (overlay) overlay.addEventListener("click", closePanel);

    if (selectAllBtn) {
      selectAllBtn.addEventListener("click", () => {
        selectAllModels();
      });
    }
    if (expandAllBtn) {
      expandAllBtn.addEventListener("click", expandAllProviders);
    }
    if (clearPanelBtn) {
      clearPanelBtn.addEventListener("click", () => {
        clearAndCollapseSelections();
      });
    }

    await switchView(currentView); // Initial view rendering
  } else {
    console.warn("No model data loaded. Check models.csv and console.");
    if (modelSelectionList)
      modelSelectionList.innerHTML =
        "<p>Failed to load model data. Check console.</p>";
    if (dynamicTimestampSpan)
      dynamicTimestampSpan.textContent = "Data loading failed";
  }
});