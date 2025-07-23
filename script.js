// --- Global State ---
let currentView = "table";
let priceChartInstance = null;
let scatterChartInstance = null;
let modelsData = [];
let sortState = { column: null, direction: "asc" };

// --- Constants for State Management ---
const LOCAL_STORAGE_KEY = "aiModelSelections";
const URL_PARAM_KEY = "models";

// --- DOM Elements ---
const modelSelectionList = document.getElementById("model-selection-list");
const comparisonTableBody = document.getElementById("comparison-table-body");
const viewTitle = document.getElementById("view-title");
const tableView = document.getElementById("table-view");
const barChartView = document.getElementById("bar-chart-view");
const scatterPlotView = document.getElementById("scatter-plot-view");
const tableViewBtn = document.getElementById("tableViewBtn");
const barChartViewBtn = document.getElementById("barChartViewBtn");
const scatterPlotViewBtn = document.getElementById("scatterPlotViewBtn");
const refreshPageBtn = document.getElementById("refreshPageBtn");
const priceChartCanvas = document.getElementById("priceChart");
const scatterChartCanvas = document.getElementById("scatterChart");
const barChartMessage = document.getElementById("bar-chart-message");
const scatterChartMessage = document.getElementById("scatter-chart-message");
const barChartCanvasContainer = document.querySelector(
  "#bar-chart-view .chart-canvas-container"
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
const modelSearchInput = document.getElementById("modelSearchInput");
const filterDropdownBtn = document.getElementById("filterDropdownBtn");
const filterDropdownMenu = document.getElementById("filterDropdownMenu");

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

function parseContextWindow(str) {
  if (typeof str !== "string" || str === "N/A") return 0;
  const lower = str.toLowerCase();
  const num = parseFloat(lower);
  if (lower.endsWith("m")) return num * 1000000;
  if (lower.endsWith("k")) return num * 1000;
  return num;
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

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
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
        img.onload = () => {
          resolve();
        };
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
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r\n|\n/);
  const headers = lines[0]
    .trim()
    .split(",")
    .map((h) => h.trim());
  const headerMap = headers.reduce((acc, h, i) => ({ ...acc, [h]: i }), {});

  const requiredHeaders = [
    "Vendor",
    "Model",
    "Context (tokens)",
    "Input Price ($/1M tokens)",
    "Output Price ($/1M tokens)",
    "Status",
  ];
  for (const h of requiredHeaders) {
    if (headerMap[h] === undefined) {
      console.error(`Required CSV header missing: "${h}"`);
      return [];
    }
  }

  const dataRows = lines.slice(1);
  const parsedData = [];

  dataRows.forEach((line, rowIndex) => {
    if (line.trim() === "") return;

    const values = [];
    let currentVal = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(currentVal.trim());
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    if (values.length !== headers.length) {
      console.warn(
        `Row ${
          rowIndex + 2
        } has incorrect column count. Expected ${headers.length}, got ${
          values.length
        }. Line: "${line}"`
      );
      return;
    }

    const get = (headerName) => values[headerMap[headerName]] || "";

    const modelName = get("Model");
    if (!modelName) {
      console.warn(`Model name missing at row ${rowIndex + 2}.`);
      return;
    }

    const parsePrice = (priceValue) => {
      if (
        !priceValue ||
        priceValue === "Open Source" ||
        priceValue === "Not Public"
      )
        return null;
      const num = parseFloat(priceValue);
      return isNaN(num) ? null : num;
    };

    const modelObject = {
      provider: get("Vendor"),
      name: modelName,
      id: modelName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/gi, ""),
      contextWindow: formatNumber(get("Context (tokens)")),
      inputPrice: parsePrice(get("Input Price ($/1M tokens)")),
      outputPrice: parsePrice(get("Output Price ($/1M tokens)")),
      status: get("Status"),
      logo: getLogoFilename(get("Vendor")),
    };

    if (!modelObject.id) {
      console.warn(
        `Model at row ${rowIndex + 2} resulted in empty ID. Name: "${modelName}"`
      );
      return;
    }
    parsedData.push(modelObject);
  });

  return parsedData;
}

async function loadModelsData() {
  try {
    const response = await fetch("models.csv");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const csvText = await response.text();
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
  if (!modelSelectionList || !modelsData || modelsData.length === 0) {
    modelSelectionList.innerHTML =
      "<p>No model data available or list not found.</p>";
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
    };

    const providerNameSpan = document.createElement("span");
    providerNameSpan.textContent = provider;
    providerTitle.appendChild(logoImg);
    providerTitle.appendChild(providerNameSpan);

    const clearProviderBtn = document.createElement("button");
    clearProviderBtn.className = "clear-provider-btn";
    clearProviderBtn.innerHTML = "&times;";
    clearProviderBtn.setAttribute("aria-label", `Clear ${provider} selections`);
    clearProviderBtn.title = `Clear ${provider} selections`;
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
      if (!model.id) return;
      const div = document.createElement("div");
      div.className = "model-item";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `model-checkbox-${model.id}`;
      checkbox.value = model.id;
      checkbox.addEventListener("change", () => updateDisplay());

      const label = document.createElement("label");
      label.htmlFor = `model-checkbox-${model.id}`;

      const mainLineDiv = document.createElement("div");
      mainLineDiv.className = "model-main-line";

      if (model.logo) {
        const modelItemLogoImg = document.createElement("img");
        modelItemLogoImg.src = `img/logos/${model.logo}`;
        modelItemLogoImg.alt = `${model.provider || "Provider"} logo`;
        modelItemLogoImg.className = "model-logo";
        modelItemLogoImg.loading = "lazy";
        mainLineDiv.appendChild(modelItemLogoImg);
      }
      const nameSpan = document.createElement("span");
      nameSpan.className = "model-name-text";
      nameSpan.textContent = model.name || "Unnamed Model";
      mainLineDiv.appendChild(nameSpan);

      const category = getPriceCategory(model);
      if (category.name !== "N/A") {
        const categoryTag = document.createElement("span");
        categoryTag.className = `price-tag ${category.className}`;
        categoryTag.textContent = category.name;
        mainLineDiv.appendChild(categoryTag);
      }
      label.appendChild(mainLineDiv);

      div.appendChild(checkbox);
      div.appendChild(label);
      modelListDiv.appendChild(div);
    });
    groupDiv.appendChild(providerTitle);
    groupDiv.appendChild(modelListDiv);
    modelSelectionList.appendChild(groupDiv);
  }
}

function filterModelSelectionList() {
  const searchTerm = modelSearchInput.value.toLowerCase();
  const modelGroups = modelSelectionList.querySelectorAll(".model-group");

  modelGroups.forEach((group) => {
    const modelItems = group.querySelectorAll(".model-item");
    let groupHasVisibleModel = false;

    modelItems.forEach((item) => {
      const modelName = item
        .querySelector(".model-name-text")
        .textContent.toLowerCase();
      if (modelName.includes(searchTerm)) {
        item.style.display = "flex";
        groupHasVisibleModel = true;
      } else {
        item.style.display = "none";
      }
    });

    group.style.display = groupHasVisibleModel ? "block" : "none";
  });
}

function selectAllModels() {
  if (!modelSelectionList) return;
  const checkboxes = modelSelectionList.querySelectorAll(
    'input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    checkbox.checked = true;
  });
  updateDisplay();
}

function expandAllProviders() {
  if (!modelSelectionList) return;
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
}

function clearAndCollapseSelections() {
  if (!modelSelectionList) return;
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
}

function filterModelsByCategory(categoryName) {
  if (!modelSelectionList || !modelsData) return;
  const allCheckboxes = modelSelectionList.querySelectorAll(
    'input[type="checkbox"]'
  );
  const matchingModelIds = modelsData
    .filter((model) => {
      const category = getPriceCategory(model);
      return category.name.toLowerCase() === categoryName.toLowerCase();
    })
    .map((model) => model.id);
  allCheckboxes.forEach((checkbox) => {
    checkbox.checked = matchingModelIds.includes(checkbox.value);
  });
  updateDisplay();
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
      price !== null && !isNaN(price) ? `$${price.toFixed(2)}` : "N/A";

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

    const providerCell = document.createElement("td");
    providerCell.textContent = model.provider || "N/A";
    row.appendChild(providerCell);

    const inputPriceCell = document.createElement("td");
    inputPriceCell.textContent = formatPrice(model.inputPrice);
    row.appendChild(inputPriceCell);

    const outputPriceCell = document.createElement("td");
    outputPriceCell.textContent = formatPrice(model.outputPrice);
    row.appendChild(outputPriceCell);

    const contextCell = document.createElement("td");
    contextCell.textContent = model.contextWindow || "N/A";
    row.appendChild(contextCell);

    comparisonTableBody.appendChild(row);
  });
}

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
    const barWidth = chart.getDatasetMeta(0).data[0]?.width || 80;
    const maxWidth = barWidth + 10;
    const lineHeight = 12;

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
      const modelName = model.name || "N/A";
      wrapText(ctx, modelName, xPos, currentY, maxWidth, lineHeight);
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
  const calculatedMinWidth =
    selectedModelsData.length * minBarWidthPerModel + chartPadding;
  barChartCanvasContainer.style.minWidth = `${calculatedMinWidth}px`;

  const labels = selectedModelsData.map((model) => model.name);
  const inputPrices = selectedModelsData.map((model) => model.inputPrice ?? 0);
  const outputPrices = selectedModelsData.map(
    (model) => model.outputPrice ?? 0
  );
  const data = {
    labels,
    datasets: [
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
    ],
  };

  const xAxisItemHeight = 60;

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
          logoSize: 16,
          textPadding: 4,
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
              return "";
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

async function renderScatterChart(selectedModelsData) {
  if (!scatterChartCanvas || !scatterChartMessage) return;
  if (scatterChartInstance) scatterChartInstance.destroy();
  scatterChartMessage.textContent = "";
  scatterChartCanvas.style.display = "block";

  const chartData = selectedModelsData
    .map((model) => ({
      ...model,
      contextValue: parseContextWindow(model.contextWindow),
    }))
    .filter(
      (model) =>
        model.inputPrice !== null &&
        model.inputPrice !== undefined &&
        model.contextValue > 0
    );

  if (chartData.length === 0) {
    scatterChartMessage.textContent =
      "Select models with both price and context data to display chart.";
    scatterChartCanvas.style.display = "none";
    return;
  }

  const scatterData = chartData.map((model) => ({
    x: model.contextValue,
    y: model.inputPrice,
    model: model,
  }));

  const config = {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Models",
          data: scatterData,
          backgroundColor: "rgba(0, 123, 255, 0.6)",
          borderColor: "rgba(0, 123, 255, 1)",
          pointRadius: 6,
          pointHoverRadius: 9,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Efficiency Frontier: Price vs. Context Window",
          font: { size: 16 },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const model = context.raw.model;
              return [
                `${model.name}`,
                `Context: ${model.contextWindow} tokens`,
                `Input Price: $${model.inputPrice.toFixed(2)}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: "logarithmic",
          title: {
            display: true,
            text: "Context Window (Tokens) - Logarithmic Scale",
          },
          ticks: {
            callback: function (value, index, values) {
              if (value === 1000 || value === 1000000 || value === 1000000000) {
                return formatNumber(String(value));
              }
              if (
                Math.log10(value) % 1 === 0 ||
                value < 10000 ||
                index === 0 ||
                index === values.length - 1
              ) {
                return formatNumber(String(value));
              }
              return "";
            },
            minRotation: 0,
            maxRotation: 45,
          },
        },
        y: {
          type: "linear",
          beginAtZero: true,
          title: {
            display: true,
            text: "Input Price ($/1M tokens)",
          },
          ticks: {
            callback: (value) => "$" + value.toFixed(2),
          },
        },
      },
    },
  };

  const ctx = scatterChartCanvas.getContext("2d");
  if (ctx) {
    try {
      scatterChartInstance = new Chart(ctx, config);
    } catch (error) {
      console.error("Scatter chart initialization error:", error);
      scatterChartMessage.textContent =
        "Error rendering scatter chart. Check console.";
      scatterChartCanvas.style.display = "none";
    }
  } else {
    console.error("Failed to get 2D context for scatter chart canvas.");
    scatterChartMessage.textContent = "Error rendering chart context.";
    scatterChartCanvas.style.display = "none";
  }
}

async function switchView(view) {
  tableViewBtn.classList.toggle("active", view === "table");
  const chartsBtn = document.getElementById("chartsDropdownBtn");
  chartsBtn.classList.toggle("active", view === "bar" || view === "scatter");

  tableView.classList.toggle("active", view === "table");
  barChartView.classList.toggle("active", view === "bar");
  scatterPlotView.classList.toggle("active", view === "scatter");

  if (viewTitle) {
    switch (view) {
      case "bar":
        viewTitle.textContent = "Price Comparison (Bar)";
        break;
      case "scatter":
        viewTitle.textContent = "Price vs. Context (Scatter)";
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

function saveSelectionsToLocalStorage(selectedIds) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedIds));
}

function updateUrlWithSelections(selectedIds) {
  const url = new URL(window.location);
  if (selectedIds.length > 0) {
    url.searchParams.set(URL_PARAM_KEY, selectedIds.join(","));
  } else {
    url.searchParams.delete(URL_PARAM_KEY);
  }
  history.replaceState(null, "", url.toString());
}

function loadSelections() {
  const urlParams = new URLSearchParams(window.location.search);
  let idsToSelect = [];
  if (urlParams.has(URL_PARAM_KEY)) {
    idsToSelect = urlParams.get(URL_PARAM_KEY).split(",");
    saveSelectionsToLocalStorage(idsToSelect);
  } else {
    const storedIds = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedIds) {
      try {
        idsToSelect = JSON.parse(storedIds);
      } catch (e) {
        idsToSelect = [];
      }
    }
  }
  if (idsToSelect.length > 0) {
    const allCheckboxes = modelSelectionList.querySelectorAll(
      'input[type="checkbox"]'
    );
    allCheckboxes.forEach((checkbox) => {
      if (idsToSelect.includes(checkbox.value)) {
        checkbox.checked = true;
      }
    });
  }
}

async function updateDisplay() {
  if (!modelsData || modelsData.length === 0) {
    if (comparisonTableBody)
      comparisonTableBody.innerHTML = `<tr><td colspan="5">No model data loaded.</td></tr>`;
    if (barChartMessage) barChartMessage.textContent = "No model data loaded.";
    if (scatterChartMessage)
      scatterChartMessage.textContent = "No model data loaded.";
    if (priceChartInstance) priceChartInstance.destroy();
    if (scatterChartInstance) scatterChartInstance.destroy();
    if (priceChartCanvas) priceChartCanvas.style.display = "none";
    if (scatterChartCanvas) scatterChartCanvas.style.display = "none";
    return;
  }
  if (!modelSelectionList) return;

  const selectedCheckboxes = modelSelectionList.querySelectorAll(
    'input[type="checkbox"]:checked'
  );
  const selectedModelIds = Array.from(selectedCheckboxes).map(
    (checkbox) => checkbox.value
  );

  saveSelectionsToLocalStorage(selectedModelIds);
  updateUrlWithSelections(selectedModelIds);

  let filteredModelsData = modelsData.filter(
    (model) => model.id && selectedModelIds.includes(model.id)
  );

  if (sortState.column && currentView === "table") {
    filteredModelsData.sort((a, b) => {
      const valA = a[sortState.column];
      const valB = b[sortState.column];
      let comparison = 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (sortState.column === "contextWindow") {
        comparison = parseContextWindow(valA) - parseContextWindow(valB);
      } else if (
        sortState.column === "inputPrice" ||
        sortState.column === "outputPrice"
      ) {
        comparison = valA - valB;
      } else {
        comparison = valA.localeCompare(valB);
      }
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  } else {
    filteredModelsData.sort((a, b) => a.name.localeCompare(b.name));
  }

  switch (currentView) {
    case "bar":
      await renderBarChart(filteredModelsData);
      break;
    case "scatter":
      await renderScatterChart(filteredModelsData);
      break;
    case "table":
    default:
      updateTableView(filteredModelsData);
      break;
  }
}

function setDynamicTimestamp() {
  if (!dynamicTimestampSpan) return;
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
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  if (
    !modelSelectionList ||
    !comparisonTableBody ||
    !priceChartCanvas ||
    !scatterChartCanvas ||
    !dynamicTimestampSpan
  ) {
    if (document.body)
      document.body.innerHTML =
        "<h1>Error: Application structure incomplete.</h1>";
    return;
  }

  modelsData = await loadModelsData();

  if (modelsData && modelsData.length > 0) {
    populateModelSelection();
    setDynamicTimestamp();
    loadSelections();

    // Dropdown Logic
    document.querySelectorAll(".dropdown-toggle").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = button.nextElementSibling;
        const isVisible = menu.classList.contains("show");

        document
          .querySelectorAll(".dropdown-menu")
          .forEach((m) => m.classList.remove("show"));
        document
          .querySelectorAll(".dropdown-toggle")
          .forEach((b) => b.classList.remove("active"));

        if (!isVisible) {
          menu.classList.add("show");
          button.classList.add("active");
        }
      });
    });

    window.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown")) {
        document
          .querySelectorAll(".dropdown-menu")
          .forEach((m) => m.classList.remove("show"));
        document
          .querySelectorAll(".dropdown-toggle")
          .forEach((b) => b.classList.remove("active"));
      }
    });

    // Event Listeners
    if (tableViewBtn)
      tableViewBtn.addEventListener("click", () => switchView("table"));
    if (barChartViewBtn)
      barChartViewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        switchView("bar");
      });
    if (scatterPlotViewBtn)
      scatterPlotViewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        switchView("scatter");
      });
    if (refreshPageBtn)
      refreshPageBtn.addEventListener("click", () =>
        clearAndCollapseSelections()
      );
    if (hamburgerBtn) hamburgerBtn.addEventListener("click", openPanel);
    if (closePanelBtn) closePanelBtn.addEventListener("click", closePanel);
    if (overlay) overlay.addEventListener("click", closePanel);
    if (selectAllBtn) selectAllBtn.addEventListener("click", selectAllModels);
    if (expandAllBtn)
      expandAllBtn.addEventListener("click", expandAllProviders);
    if (clearPanelBtn)
      clearPanelBtn.addEventListener("click", clearAndCollapseSelections);
    if (filterLowBtn)
      filterLowBtn.addEventListener("click", () =>
        filterModelsByCategory("Low")
      );
    if (filterMediumBtn)
      filterMediumBtn.addEventListener("click", () =>
        filterModelsByCategory("Medium")
      );
    if (filterHighBtn)
      filterHighBtn.addEventListener("click", () =>
        filterModelsByCategory("High")
      );
    if (modelSearchInput)
      modelSearchInput.addEventListener("input", filterModelSelectionList);

    document.querySelectorAll("th.sortable").forEach((header) => {
      header.addEventListener("click", () => {
        const sortKey = header.dataset.sortKey;
        if (sortState.column === sortKey) {
          sortState.direction =
            sortState.direction === "asc" ? "desc" : "asc";
        } else {
          sortState.column = sortKey;
          sortState.direction = "asc";
        }
        document.querySelectorAll("th.sortable").forEach((th) => {
          th.classList.remove("sorted-asc", "sorted-desc");
        });
        header.classList.add(
          sortState.direction === "asc" ? "sorted-asc" : "sorted-desc"
        );
        updateDisplay();
      });
    });

    await switchView(currentView);
  } else {
    if (modelSelectionList)
      modelSelectionList.innerHTML =
        "<p>Failed to load model data. Check console.</p>";
    if (dynamicTimestampSpan)
      dynamicTimestampSpan.textContent = "Data loading failed";
  }
});